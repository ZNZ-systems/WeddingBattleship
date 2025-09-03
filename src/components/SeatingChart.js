import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import Table from './Table';
import SpecialArea from './SpecialArea';
import './SeatingChart.css';

function SeatingChart({ 
  tables, 
  specialAreas, 
  guests, 
  onMoveItem, 
  onSeatGuest, 
  onToggleLockChair,
  lockedChairs,
  onDeleteTable,
  onDeleteArea,
  onResizeTable,
  onResizeArea,
  onRotateTable
}) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Virtual canvas dimensions - back to 5000x5000
  const VIRTUAL_WIDTH = 5000;
  const VIRTUAL_HEIGHT = 5000;

  const getGuestName = (guestId) => {
    const guest = guests.find(g => g.id === guestId);
    return guest ? guest.fullName : null;
  };

  const handleMouseDown = useCallback((e) => {
    // Start panning on right mouse button or when space is held
    if (e.button === 2 || (e.button === 0 && isSpacePressed)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, [isSpacePressed]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Zoom in/out with Ctrl+wheel or Cmd+wheel
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
      
      // Calculate zoom center point
      const rect = chartRef.current.getBoundingClientRect();
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;
      
      // Adjust pan offset to zoom towards mouse position
      const zoomRatio = newZoom / zoom;
      setPanOffset(prev => ({
        x: centerX - (centerX - prev.x) * zoomRatio,
        y: centerY - (centerY - prev.y) * zoomRatio
      }));
      
      setZoom(newZoom);
    } else {
      // Normal scrolling when not zooming
      if (!isPanning) {
        e.stopPropagation();
      }
    }
  }, [isPanning, zoom]);

  const handleContextMenu = useCallback((e) => {
    // Prevent context menu when right-clicking to pan
    if (isPanning) {
      e.preventDefault();
    }
  }, [isPanning]);

  // Zoom controls
  const zoomIn = () => {
    const newZoom = Math.min(3, zoom * 1.2);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(0.1, zoom / 1.2);
    setZoom(newZoom);
  };

  const resetZoom = () => {
    setZoom(1);
  };

  // Keyboard event handlers for space bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Add global mouse event listeners for panning
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('contextmenu', handleContextMenu);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp, handleContextMenu]);

  const [, drop] = useDrop(() => ({
    accept: ['table', 'area'],
    drop: (item, monitor) => {
      if (!canvasRef.current) return;

      const clientOffset = monitor.getClientOffset();
      const initialClientOffset = monitor.getInitialClientOffset();
      const initialSourceOffset = monitor.getInitialSourceClientOffset();
      if (!clientOffset || !initialClientOffset || !initialSourceOffset) return;

      // Preserve the grab position by subtracting the initial pointer-to-source offset
      const offsetX = initialClientOffset.x - initialSourceOffset.x;
      const offsetY = initialClientOffset.y - initialSourceOffset.y;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = (clientOffset.x - offsetX - canvasRect.left + panOffset.x) / zoom;
      const y = (clientOffset.y - offsetY - canvasRect.top + panOffset.y) / zoom;
      const type = monitor.getItemType();
      onMoveItem(item.id, x, y, type);
    }
  }), [onMoveItem, panOffset, zoom]);

  const getPanInstructions = () => {
    if (isPanning) {
      return 'Release to stop panning';
    }
    if (isSpacePressed) {
      return 'Click and drag to pan • Release space to stop';
    }
    return 'Right-click and drag to pan • Hold space + click to pan • Ctrl+wheel to zoom';
  };

  const resetView = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div 
      className="seating-chart" 
      ref={chartRef}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      style={{ 
        cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : 'default')
      }}
    >
      {/* Zoom controls */}
      <div className="zoom-controls">
        <button 
          className="zoom-btn" 
          onClick={zoomIn}
          title="Zoom in (Ctrl+wheel up)"
        >
          +
        </button>
        <div className="zoom-level">{Math.round(zoom * 100)}%</div>
        <button 
          className="zoom-btn" 
          onClick={zoomOut}
          title="Zoom out (Ctrl+wheel down)"
        >
          −
        </button>
        <button 
          className="zoom-reset-btn" 
          onClick={resetZoom}
          title="Reset zoom to 100%"
        >
          🔍
        </button>
      </div>

      {/* Reset view button */}
      <button 
        className="reset-view-btn" 
        onClick={resetView}
        title="Reset view to center and 100% zoom"
      >
        🏠 Reset View
      </button>

      <div 
        className="chart-canvas" 
        ref={(node) => { canvasRef.current = node; drop(node); }}
        style={{
          width: VIRTUAL_WIDTH,
          height: VIRTUAL_HEIGHT,
          position: 'relative',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {specialAreas.map(area => (
          <SpecialArea
            key={area.id}
            area={area}
            onDelete={() => onDeleteArea(area.id)}
            onResize={(w, h) => onResizeArea(area.id, w, h)}
          />
        ))}
        
        {tables.map(table => (
          <Table
            key={table.id}
            table={table}
            onSeatGuest={(seatIndex, guestId) => onSeatGuest(table.id, seatIndex, guestId)}
            onToggleLockChair={(seatIndex) => onToggleLockChair(table.id, seatIndex)}
            lockedChairs={lockedChairs}
            getGuestName={getGuestName}
            onDelete={() => onDeleteTable(table.id)}
            onResize={(updates) => onResizeTable(table.id, updates)}
            onRotate={(rotation) => onRotateTable(table.id, rotation)}
          />
        ))}
      </div>
      
      {/* Pan indicator */}
      <div className="pan-indicator">
        <div className="pan-instructions">
          {getPanInstructions()}
        </div>
      </div>
    </div>
  );
}

export default SeatingChart;