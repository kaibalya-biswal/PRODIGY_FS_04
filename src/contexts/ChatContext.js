import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchUsers();
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          console.log('New message received via real-time:', payload.new);
          
          // Only add message if it's for the current room
          if (payload.new.room_id === currentRoom) {
            // Fetch the complete message with user data
            const { data: messageWithUser, error } = await supabase
              .from('messages')
              .select('*, users(username, avatar_url)')
              .eq('id', payload.new.id)
              .single();
            
            if (!error && messageWithUser) {
              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const messageExists = prev.some(msg => msg.id === messageWithUser.id);
                if (messageExists) {
                  console.log('Message already exists, skipping duplicate');
                  return prev;
                }
                console.log('Adding new message to chat');
                return [...prev, messageWithUser];
              });
            } else {
              // Fallback to just the payload if user fetch fails
              setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === payload.new.id);
                if (messageExists) return prev;
                return [...prev, payload.new];
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    // Subscribe to new rooms
    const roomsSubscription = supabase
      .channel('rooms')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'rooms' },
        (payload) => {
          setRooms(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      roomsSubscription.unsubscribe();
    };
  }, [user, currentRoom]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure we have unique rooms (in case of any remaining duplicates)
      const uniqueRooms = data ? 
        data.filter((room, index, self) => 
          index === self.findIndex(r => r.name === room.name)
        ) : [];
      
      setRooms(uniqueRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    if (!roomId) return;
    
    console.log('Fetching messages for room:', roomId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, users(username, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Fetched messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (roomData) => {
    try {
      // Check if room with same name already exists
      const { data: existingRoom, error: checkError } = await supabase
        .from('rooms')
        .select('id, name')
        .eq('name', roomData.name)
        .single();

      if (existingRoom) {
        return { 
          data: null, 
          error: { message: 'A room with this name already exists' }
        };
      }

      const { data, error } = await supabase
        .from('rooms')
        .insert([{
          ...roomData,
          created_by: user.id,
        }])
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const sendMessage = async (content, roomId) => {
    if (!content.trim() || !roomId) return;

    console.log('Attempting to send message:', { content, roomId, userId: user.id });

    try {
      // Create the message with user data included
      const newMessage = {
        content: content.trim(),
        room_id: roomId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      // Insert message to database
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select('*, users(username, avatar_url)');

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Message sent successfully:', data);

      // Immediately add the message to local state if it's for the current room
      if (roomId === currentRoom && data && data[0]) {
        const messageWithUser = {
          ...data[0],
          users: data[0].users || {
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_metadata?.username || 'user'}`
          }
        };
        
        // Add to messages immediately for instant feedback
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg.id === messageWithUser.id);
          if (messageExists) return prev;
          return [...prev, messageWithUser];
        });
      }

      return { data: data[0], error: null };
    } catch (error) {
      console.error('Failed to send message:', error);
      return { data: null, error };
    }
  };

  const joinRoom = async (roomId) => {
    setCurrentRoom(roomId);
    await fetchMessages(roomId);
  };

  const value = {
    messages,
    rooms,
    currentRoom,
    users,
    loading,
    createRoom,
    sendMessage,
    joinRoom,
    fetchRooms,
    fetchUsers,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 