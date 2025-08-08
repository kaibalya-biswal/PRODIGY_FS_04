import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { usePresence } from '../contexts/PresenceContext';
import { LogOut, Send, Plus, Users, MessageSquare } from 'lucide-react';
import Message from './Message';
import CreateRoomModal from './CreateRoomModal';
import UserPresence from './UserPresence';
import './Chat.css';

const Chat = () => {
  const { user, signOut } = useAuth();
  const { 
    messages, 
    rooms, 
    currentRoom, 
    users, 
    loading, 
    sendMessage, 
    joinRoom 
  } = useChat();
  const { onlineUsers, getCurrentRoomUsers, setTyping, isUserTyping, updatePresence } = usePresence();
  
  const [message, setMessage] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' or 'users'
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentRoom) return;

    console.log('Sending message:', { message, currentRoom, user });

    // Stop typing indicator
    setTyping(false, currentRoom);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const { error } = await sendMessage(message, currentRoom);
    if (!error) {
      setMessage('');
      console.log('Message sent successfully');
    } else {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error.message || 'Unknown error'}`);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    
    // Start typing indicator
    if (currentRoom) {
      setTyping(true, currentRoom);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false, currentRoom);
      }, 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const currentRoomData = rooms.find(room => room.id === currentRoom);

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.user_metadata?.username || 'user'}`}
              alt="Avatar" 
              className="user-avatar"
            />
            <span className="username">
              {user?.user_metadata?.username || 'User'}
            </span>
          </div>
          <button onClick={handleSignOut} className="logout-button">
            <LogOut size={20} />
          </button>
        </div>

        <div className="sidebar-tabs">
          <button 
            className={`tab-button ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            <MessageSquare size={16} />
            Rooms
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            Users
          </button>
        </div>

        <div className="sidebar-content">
          {activeTab === 'rooms' ? (
            <>
              <div className="section-header">
                <h3>Chat Rooms</h3>
                <button 
                  onClick={() => setShowCreateRoom(true)}
                  className="create-button"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="rooms-list">
                {rooms.map(room => (
                  <div
                    key={room.id}
                    className={`room-item ${currentRoom === room.id ? 'active' : ''}`}
                    onClick={() => {
                      joinRoom(room.id);
                      updatePresence('online', room.id);
                    }}
                  >
                    <div className="room-info">
                      <h4>{room.name}</h4>
                      <p>{room.description}</p>
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <p className="empty-state">No rooms available</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="section-header">
                <h3>
                  Online Users 
                  <span className="online-count">{onlineUsers.size}</span>
                </h3>
              </div>
              <div className="users-list">
                {users.map(userItem => (
                  <div key={userItem.id} className="user-item">
                    <UserPresence 
                      user={userItem} 
                      size="small" 
                      showLastSeen={true}
                    />
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="empty-state">No users online</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        {currentRoom ? (
          <>
            <div className="chat-header">
              <h2>{currentRoomData?.name || 'Chat Room'}</h2>
              <p>{currentRoomData?.description || 'Start chatting with others'}</p>
            </div>

            <div className="messages-container">
              {loading ? (
                <div className="loading-messages">
                  <div className="loading-spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <Message key={msg.id} message={msg} currentUser={user} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={message}
                onChange={handleMessageChange}
                placeholder="Type your message..."
                className="message-input"
              />
              <button type="submit" className="send-button">
                <Send size={20} />
              </button>
            </form>
            
            {/* Typing indicators */}
            {currentRoom && (
              <div className="typing-indicators">
                {users
                  .filter(userItem => 
                    userItem.id !== user.id && 
                    isUserTyping(userItem.id) &&
                    getCurrentRoomUsers(currentRoom).some(presence => presence.id === userItem.id)
                  )
                  .map(userItem => (
                    <div key={userItem.id} className="typing-indicator">
                      <span className="typing-dot">●</span>
                      <span className="typing-text">{userItem.username} is typing...</span>
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-room-selected">
            <MessageSquare size={64} />
            <h2>Welcome to the Chat App</h2>
            <p>Select a room from the sidebar to start chatting</p>
          </div>
        )}
      </div>

      {showCreateRoom && (
        <CreateRoomModal 
          onClose={() => setShowCreateRoom(false)}
          onRoomCreated={(room) => {
            setShowCreateRoom(false);
            joinRoom(room.id);
          }}
        />
      )}
    </div>
  );
};

export default Chat; 