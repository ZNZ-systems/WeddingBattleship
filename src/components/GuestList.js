import React from 'react';
import { useDrag } from 'react-dnd';
import { Users, User } from 'lucide-react';
import './GuestList.css';

function GuestItem({ guest }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'guest',
    item: { id: guest.id, name: guest.fullName },
    canDrag: !guest.seated,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [guest]);

  return (
    <div 
      ref={drag}
      className={`guest-item ${guest.seated ? 'seated' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <User size={16} />
      <span>{guest.fullName}</span>
      {guest.seated && <span className="seated-badge">Seated</span>}
    </div>
  );
}

function GuestList({ guests }) {
  const unseatedGuests = guests.filter(g => !g.seated);
  const seatedGuests = guests.filter(g => g.seated);

  return (
    <div className="guest-list">
      <div className="guest-list-header">
        <Users size={20} />
        <h3>Guest List</h3>
        <span className="guest-count">
          {unseatedGuests.length} / {guests.length} unseated
        </span>
      </div>
      
      <div className="guest-list-content">
        {unseatedGuests.length > 0 && (
          <div className="guest-section">
            <h4>Unseated Guests</h4>
            <div className="guest-items">
              {unseatedGuests.map(guest => (
                <GuestItem key={guest.id} guest={guest} />
              ))}
            </div>
          </div>
        )}
        
        {seatedGuests.length > 0 && (
          <div className="guest-section">
            <h4>Seated Guests</h4>
            <div className="guest-items seated-section">
              {seatedGuests.map(guest => (
                <GuestItem key={guest.id} guest={guest} />
              ))}
            </div>
          </div>
        )}
        
        {guests.length === 0 && (
          <div className="empty-state">
            <Users size={40} color="#d1d5db" />
            <p>No guests imported yet</p>
            <p className="hint">Click "Import Guests" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GuestList;