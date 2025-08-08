import React from 'react';
import { usePresence } from '../contexts/PresenceContext';
import { formatDistanceToNow } from 'date-fns';
import './UserPresence.css';

const UserPresence = ({ user, showStatus = true, showLastSeen = false, size = 'medium' }) => {
  const { isUserOnline, isUserTyping, userPresence } = usePresence();
  
  const presence = userPresence.find(p => p.id === user.id);
  const isOnline = isUserOnline(user.id);
  const isTyping = isUserTyping(user.id);

  const getStatusColor = () => {
    if (isOnline) return 'online';
    if (presence?.status === 'away') return 'away';
    if (presence?.status === 'busy') return 'busy';
    return 'offline';
  };

  const getStatusText = () => {
    if (isTyping) return 'typing...';
    if (isOnline) return 'online';
    if (presence?.status === 'away') return 'away';
    if (presence?.status === 'busy') return 'busy';
    if (presence?.last_seen) {
      return `last seen ${formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}`;
    }
    return 'offline';
  };

  return (
    <div className={`user-presence ${size}`}>
      <div className="user-avatar">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} />
        ) : (
          <div className="avatar-placeholder">
            {user.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={`status-indicator ${getStatusColor()}`} />
      </div>
      
      {showStatus && (
        <div className="user-info">
          <span className="username">{user.username}</span>
          <span className={`status-text ${getStatusColor()}`}>
            {isTyping && <span className="typing-indicator">●</span>}
            {getStatusText()}
          </span>
          {showLastSeen && presence?.last_seen && !isOnline && (
            <span className="last-seen">
              {formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPresence; 