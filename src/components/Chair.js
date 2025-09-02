import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { Lock, Unlock, User } from 'lucide-react';
import './Chair.css';

function Chair({ position, seatIndex, guestId, guestName, onSeatGuest, onToggleLock, isLocked }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'guest',
    canDrop: () => !isLocked,
    drop: (item) => {
      onSeatGuest(item.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [isLocked, onSeatGuest]);

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
      ref={drop}
      className={`chair ${guestId ? 'occupied' : 'empty'} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: `translate(-50%, -50%) rotate(${position.angle}rad)`,
      }}
      onClick={guestId ? handleRemoveGuest : undefined}
    >
      <div className="chair-inner" style={{ transform: `rotate(${-position.angle}rad)` }}>
        <div className="chair-seat">
          {guestId ? (
            <div className="guest-info">
              <User size={14} />
              <span className="guest-name">{guestName}</span>
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
            transform: `translate(-50%, -50%) translate(${tooltipPosition.x}px, ${tooltipPosition.y}px) rotate(${-position.angle}rad)`
          }}
        >
          {guestName}
        </div>
      )}
    </div>
  );
}

export default Chair;