import React, { useMemo } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { Lock, Unlock, User } from 'lucide-react';
import './Chair.css';
import { getInitials } from '../lib/utils';
function Chair({ position, seatIndex, guestId, guestName, onSeatGuest, onToggleLock, isLocked, tableRotation = 0 }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'guest',
    canDrop: () => !isLocked,
    drop: (item) => {
      // If dropping a guest from another chair, seat them here
      if (item.id) {
        onSeatGuest(item.id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [isLocked, onSeatGuest]);

  // Add drag functionality for occupied chairs
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'guest',
    item: guestId ? { id: guestId, name: guestName, fromChair: true } : null,
    canDrag: () => !!guestId && !isLocked,
    end: (item, monitor) => {
      // If dropped on nothing (white space), unseat the guest
      if (!monitor.didDrop()) {
        onSeatGuest(null);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [guestId, guestName, isLocked, onSeatGuest]);

  const handleRemoveGuest = (e) => {
    e.stopPropagation();
    if (!isLocked) {
      onSeatGuest(null);
    }
  };
  
  const handleToggleLock = (e) => {
    e.stopPropagation();
    onToggleLock();
  };

  const isActive = isOver && canDrop;

  const tooltipPosition = useMemo(() => {
    const distance = 64; // px away from chair center (outward)
    const x = Math.cos(position.angle) * distance;
    const y = Math.sin(position.angle) * distance;
    return { x, y };
  }, [position.angle]);

  return (
    <div
      ref={guestId ? drag : drop}
      className={`chair ${guestId ? 'occupied' : 'empty'} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: `translate(-50%, -50%) rotate(${position.angle}rad)`,
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={guestId ? handleRemoveGuest : undefined}
    >
      <div className="chair-inner" style={{ transform: `rotate(${-position.angle - (tableRotation * Math.PI / 180)}rad)` }}>
        <div className="chair-seat">
          {guestId ? (
            <div className="guest-info">
              <User size={14} />
              <span className="guest-name">
                {(() => {
                  const initials = getInitials(guestName);
                  console.log(`Guest: ${guestName}, Initials: "${initials}"`);
                  return initials;
                })()}
              </span>
            </div>
          ) : (
            <span className="seat-number">{seatIndex + 1}</span>
          )}
        </div>
        
        <button
          className="lock-btn"
          onClick={handleToggleLock}
          title={isLocked ? 'Unlock chair' : 'Lock chair'}
        >
          {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>
      {guestId && (
        <div
          className="chair-tooltip"
          style={{
            transform: `translate(-50%, -50%) translate(${tooltipPosition.x}px, ${tooltipPosition.y}px) rotate(${-position.angle - (tableRotation * Math.PI / 180)}rad)`
          }}
        >
          {guestName}
        </div>
      )}
    </div>
  );
}

export default Chair;