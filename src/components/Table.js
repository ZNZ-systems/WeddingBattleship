import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2 } from 'lucide-react';
import Chair from './Chair';
import './Table.css';

function Table({ table, onSeatGuest, onToggleLockChair, lockedChairs, getGuestName, onDelete, onResize, onRotate }) {
  const [isResizing, setIsResizing] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'table',
    item: { id: table.id },
    canDrag: () => !isResizing,
    options: {
      deltaX: 0,
      deltaY: 0
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [table.id, isResizing]);

  const getChairPositions = () => {
    const positions = [];
    const rotationRad = ((table.rotation || 0) * Math.PI) / 180;
    const rotatePoint = (x, y) => ({
      x: x * Math.cos(rotationRad) - y * Math.sin(rotationRad),
      y: x * Math.sin(rotationRad) + y * Math.cos(rotationRad),
    });

    if (table.shape === 'circle') {
      const angleStep = (2 * Math.PI) / table.seats;
      const radius = Math.max(60 + (table.seats * 3), 80);
      for (let i = 0; i < table.seats; i++) {
        const angle = i * angleStep - Math.PI / 2;
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;
        const r = rotatePoint(x, y);
        positions.push({ x: r.x, y: r.y, angle: angle + Math.PI / 2 + rotationRad });
      }
      return positions;
    }

    // Rectangle/Square layout
    const defaultSide = 140;
    let width = table.width || defaultSide;
    let height = table.height || defaultSide;
    const isSquare = table.shape === 'square';
    const isImperial = table.shape === 'imperial';
    if (isSquare) { const side = Math.max(width, height, 100); width = side; height = side; }
    const halfW = width / 2;
    const halfH = height / 2;
    const offset = 50; // distance from table edge
    const isVertical = !isSquare && height >= width;

    const addPoint = (x, y, angle) => {
      const r = rotatePoint(x, y);
      // For square/rectangular tables, all chairs should face north (upward)
      // So we set angle to 0 (north) regardless of table rotation
      positions.push({ x: r.x, y: r.y, angle: 0 });
    };

    const seats = table.seats;
    if (seats <= 0) return positions;

    if (isSquare) {
      // Equal chairs per side (as even as possible)
      const base = Math.floor(seats / 4);
      const extra = seats % 4;
      const counts = [base, base, base, base]; // top, right, bottom, left
      for (let i = 0; i < extra; i++) counts[i] += 1;

      if (counts[0] > 0) {
        const step = width / (counts[0] + 1);
        for (let i = 1; i <= counts[0]; i++) addPoint(-halfW + step * i, -halfH - offset, -Math.PI / 2);
      }
      if (counts[1] > 0) {
        const step = height / (counts[1] + 1);
        for (let i = 1; i <= counts[1]; i++) addPoint(halfW + offset, -halfH + step * i, 0);
      }
      if (counts[2] > 0) {
        const step = width / (counts[2] + 1);
        for (let i = 1; i <= counts[2]; i++) addPoint(-halfW + step * i, halfH + offset, Math.PI / 2);
      }
      if (counts[3] > 0) {
        const step = height / (counts[3] + 1);
        for (let i = 1; i <= counts[3]; i++) addPoint(-halfW - offset, -halfH + step * i, Math.PI);
      }
    } else if (isImperial) {
      if (isVertical) {
        // Top and bottom anchors (2 each)
        if (seats >= 1) addPoint(-width / 4, -halfH - offset, -Math.PI / 2);
        if (seats >= 2) addPoint(width / 4, -halfH - offset, -Math.PI / 2);
        if (seats >= 3) addPoint(-width / 4, halfH + offset, Math.PI / 2);
        if (seats >= 4) addPoint(width / 4, halfH + offset, Math.PI / 2);
        const remaining = Math.max(0, seats - Math.min(seats, 4));
        const leftCount = Math.ceil(remaining / 2);
        const rightCount = Math.floor(remaining / 2);
        if (leftCount > 0) {
          const step = height / (leftCount + 1);
          for (let i = 1; i <= leftCount; i++) {
            const y = -halfH + step * i;
            addPoint(-halfW - offset, y, Math.PI);
          }
        }
        if (rightCount > 0) {
          const step = height / (rightCount + 1);
          for (let i = 1; i <= rightCount; i++) {
            const y = -halfH + step * i;
            addPoint(halfW + offset, y, 0);
          }
        }
      } else {
        // Left and right anchors (2 each)
        if (seats >= 1) addPoint(-halfW - offset, -height / 4, Math.PI);
        if (seats >= 2) addPoint(-halfW - offset, height / 4, Math.PI);
        if (seats >= 3) addPoint(halfW + offset, -height / 4, 0);
        if (seats >= 4) addPoint(halfW + offset, height / 4, 0);
        const remaining = Math.max(0, seats - Math.min(seats, 4));
        const topCount = Math.ceil(remaining / 2);
        const bottomCount = Math.floor(remaining / 2);
        if (topCount > 0) {
          const step = width / (topCount + 1);
          for (let i = 1; i <= topCount; i++) {
            const x = -halfW + step * i;
            addPoint(x, -halfH - offset, -Math.PI / 2);
          }
        }
        if (bottomCount > 0) {
          const step = width / (bottomCount + 1);
          for (let i = 1; i <= bottomCount; i++) {
            const x = -halfW + step * i;
            addPoint(x, halfH + offset, Math.PI / 2);
          }
        }
      }
    } else if (isVertical) {
      // Top and bottom anchors
      if (seats >= 1) addPoint(0, -halfH - offset, -Math.PI / 2);
      if (seats >= 2) addPoint(0, halfH + offset, Math.PI / 2);
      const remaining = Math.max(0, seats - Math.min(seats, 2));
      const leftCount = Math.ceil(remaining / 2);
      const rightCount = Math.floor(remaining / 2);
      if (leftCount > 0) {
        const step = height / (leftCount + 1);
        for (let i = 1; i <= leftCount; i++) {
          const y = -halfH + step * i;
          addPoint(-halfW - offset, y, Math.PI);
        }
      }
      if (rightCount > 0) {
        const step = height / (rightCount + 1);
        for (let i = 1; i <= rightCount; i++) {
          const y = -halfH + step * i;
          addPoint(halfW + offset, y, 0);
        }
      }
    } else {
      // Left and right anchors
      if (seats >= 1) addPoint(-halfW - offset, 0, Math.PI);
      if (seats >= 2) addPoint(halfW + offset, 0, 0);
      const remaining = Math.max(0, seats - Math.min(seats, 2));
      const topCount = Math.ceil(remaining / 2);
      const bottomCount = Math.floor(remaining / 2);
      if (topCount > 0) {
        const step = width / (topCount + 1);
        for (let i = 1; i <= topCount; i++) {
          const x = -halfW + step * i;
          addPoint(x, -halfH - offset, -Math.PI / 2);
        }
      }
      if (bottomCount > 0) {
        const step = width / (bottomCount + 1);
        for (let i = 1; i <= bottomCount; i++) {
          const x = -halfW + step * i;
          addPoint(x, halfH + offset, Math.PI / 2);
        }
      }
    }

    return positions;
  };

  const chairPositions = getChairPositions();
  const tableRadius = 50 + (table.seats * 2);
  const dimensions = (() => {
    if (table.shape === 'circle') {
      return { width: tableRadius * 2, height: tableRadius * 2 };
    }
    // For square and rectangle, respect width/height from state
    const defaultSide = 140;
    let width = table.width || defaultSide;
    let height = table.height || defaultSide;
    if (table.shape === 'square') {
      const side = Math.max(width, height, 100);
      width = side; height = side;
    }
    return { width, height };
  })();

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = dimensions.width;
    const startH = dimensions.height;
    const onMoveResize = (evt) => {
      let newW = Math.max(80, startW + (evt.clientX - startX));
      let newH = Math.max(80, startH + (evt.clientY - startY));
      if (table.shape === 'square') {
        const side = Math.max(newW, newH);
        newW = side;
        newH = side;
      }
      onResize && onResize({ width: newW, height: newH });
    };
    const onStop = () => {
      document.removeEventListener('mousemove', onMoveResize);
      document.removeEventListener('mouseup', onStop);
      setIsResizing(false);
    };
    document.addEventListener('mousemove', onMoveResize);
    document.addEventListener('mouseup', onStop);
  };

  return (
    <div
      className={`table-container ${isDragging ? 'dragging' : ''}`}
      style={{
        left: table.x,
        top: table.y,
        opacity: isDragging ? 0.5 : 1,
      }}
      ref={drag}
    >
      <div 
        className={`table ${table.shape}`}
        style={{ ...dimensions, transform: `rotate(${table.rotation || 0}deg)` }}
      >
        <div className="table-number">
          {table.name || 'Table'}
        </div>
        
        <div className="table-controls" style={{ transform: `rotate(${-(table.rotation || 0)}deg)` }}>
          <button
            className="table-control-btn rotate"
            onClick={() => onRotate && onRotate((table.rotation || 0) + 90)}
            title="Rotate table 90° clockwise"
          >
            ↻
          </button>
          <button
            className="table-control-btn delete"
            onClick={() => onDelete()}
            title="Delete table"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        {(table.shape === 'rectangle' || table.shape === 'square' || table.shape === 'imperial') && (
          <div className="resize-handle br" onMouseDown={startResize} />
        )}
      </div>
      
      {chairPositions.map((pos, index) => (
        <Chair
          key={index}
          position={pos}
          seatIndex={index}
          guestId={table.guests[index]}
          guestName={getGuestName(table.guests[index])}
          onSeatGuest={(guestId) => onSeatGuest(index, guestId)}
          onToggleLock={() => onToggleLockChair(index)}
          isLocked={lockedChairs.has(`${table.id}-${index}`)}
        />
      ))}
    </div>
  );
}

export default Table;