import React from 'react';
import { format } from 'date-fns';
import UserPresence from './UserPresence';
import './Message.css';

const Message = ({ message, currentUser }) => {
  const isOwnMessage = message.user_id === currentUser?.id;
  const messageTime = new Date(message.created_at);
  
  return (
    <div className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      <div className="message-content">
        {!isOwnMessage && (
          <div className="message-avatar">
            <UserPresence 
              user={message.users} 
              size="small" 
              showStatus={false}
            />
          </div>
        )}
        
        <div className="message-bubble">
          {!isOwnMessage && (
            <div className="message-username">
              {message.users?.username || 'Unknown User'}
            </div>
          )}
          <div className="message-text">
            {message.content}
          </div>
          <div className="message-time">
            {format(messageTime, 'HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message; 