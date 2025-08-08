import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { updateUserPresence, getAllUserPresence, updateTypingStatus } from '../config/supabase';

const PresenceContext = createContext();

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [userPresence, setUserPresence] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Update user's own presence
  const updatePresence = useCallback(async (status = 'online', roomId = null) => {
    if (!user) return;

    console.log('Updating presence for user:', user.id, 'status:', status);

    try {
      const { data, error } = await updateUserPresence({
        id: user.id,
        status,
        last_seen: new Date().toISOString(),
        current_room: roomId,
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error updating presence:', error);
      } else {
        console.log('Presence updated successfully:', data);
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Set typing status
  const setTyping = useCallback(async (isTyping, roomId = null) => {
    if (!user) return;

    try {
      await updateTypingStatus(user.id, isTyping, roomId);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user]);

  // Fetch all user presence data
  const fetchUserPresence = useCallback(async () => {
    console.log('Fetching user presence data...');
    try {
      const { data, error } = await getAllUserPresence();
      if (error) throw error;
      
      console.log('User presence data:', data);
      setUserPresence(data || []);
      
      // Update online users set
      const online = new Set();
      data?.forEach(presence => {
        console.log('Processing presence:', presence.id, 'status:', presence.status);
        if (presence.status === 'online') {
          online.add(presence.id);
        }
      });
      console.log('Online users:', Array.from(online));
      setOnlineUsers(online);
    } catch (error) {
      console.error('Error fetching user presence:', error);
    }
  }, []);

  // Set up real-time subscriptions for presence
  useEffect(() => {
    if (!user) return;

    // Subscribe to presence changes
    const presenceSubscription = supabase
      .channel('user_presence')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_presence' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setUserPresence(prev => 
              prev.map(presence => 
                presence.id === payload.new.id ? payload.new : presence
              )
            );
            
            // Update online users
            if (payload.new.status === 'online') {
              setOnlineUsers(prev => new Set([...prev, payload.new.id]));
            } else {
              setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(payload.new.id);
                return newSet;
              });
            }

            // Update typing users
            if (payload.new.is_typing) {
              setTypingUsers(prev => new Set([...prev, payload.new.id]));
            } else {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(payload.new.id);
                return newSet;
              });
            }
          } else if (payload.eventType === 'INSERT') {
            setUserPresence(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      presenceSubscription.unsubscribe();
    };
  }, [user]);

  // Initialize user presence when user logs in
  useEffect(() => {
    if (user) {
      updatePresence('online');
      fetchUserPresence();
    }
  }, [user, updatePresence, fetchUserPresence]);

  // Update presence on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user) {
        updatePresence(document.hidden ? 'away' : 'online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, updatePresence]);

  // Update presence before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        updatePresence('offline');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, updatePresence]);

  // Periodic presence update
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updatePresence('online');
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, updatePresence]);

  const value = {
    userPresence,
    typingUsers,
    onlineUsers,
    updatePresence,
    setTyping,
    fetchUserPresence,
    isUserOnline: (userId) => onlineUsers.has(userId),
    isUserTyping: (userId) => typingUsers.has(userId),
    getCurrentRoomUsers: (roomId) => 
      userPresence.filter(presence => presence.current_room === roomId)
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}; 