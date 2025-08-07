import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { X, Hash } from 'lucide-react';
import './CreateRoomModal.css';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { createRoom } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await createRoom({
        name: name.trim(),
        description: description.trim(),
      });

      if (error) {
        setError(error.message);
      } else {
        onRoomCreated(data);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Hash size={24} />
            <h2>Create New Room</h2>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="room-name">Room Name</label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name"
              className="modal-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="room-description">Description (Optional)</label>
            <textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter room description"
              className="modal-textarea"
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="modal-button primary"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal; 