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
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

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
  }, [user]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
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
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, users(username, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (roomData) => {
    try {
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

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          content: content.trim(),
          room_id: roomId,
          user_id: user.id,
        }])
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
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