import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';
import GuestList from './components/GuestList';
import SeatingChart from './components/SeatingChart';
import Controls from './components/Controls';
import ImportModal from './components/ImportModal';
import Splitter from './components/Splitter';
import { getSupabaseClient } from './lib/supabase';
import { usePlanManager } from './hooks/usePlanManager';

function App() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [controlsHeight, setControlsHeight] = useState(300); // Default height for Controls

  const {
    plan,
    importGuests,
    addTable,
    addSpecialArea,
    moveItem,
    seatGuest,
    toggleLockChair,
    deleteTable,
    deleteArea,
    resizeTable,
    rotateTable,
    resizeArea,
    loadPlan,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePlanManager();

  const { guests, tables, specialAreas, lockedChairs } = plan;

  // Supabase persistence setup
  const [editorToken] = useState(() => {
    try {
      const existing = localStorage.getItem('wb-editor-token');
      if (existing) return existing;
      const generated = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      localStorage.setItem('wb-editor-token', generated);
      return generated;
    } catch (e) {
      return Math.random().toString(36).slice(2);
    }
  });
  const supabase = useMemo(() => getSupabaseClient(editorToken), [editorToken]);
  const slug = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('plan') || 'default';
    } catch (e) {
      return 'default';
    }
  }, []);

  const handleImportGuests = useCallback((importedGuests) => {
    importGuests(importedGuests);
    setShowImportModal(false);
  }, [importGuests]);

  const handleAddTable = useCallback(({ seats, name, shape }) => {
    addTable({ seats, name, shape });
  }, [addTable]);

  const handleAddSpecialArea = useCallback((type) => {
    addSpecialArea(type);
  }, [addSpecialArea]);

  const handleMoveItem = useCallback((id, x, y, type) => {
    moveItem(id, x, y, type);
  }, [moveItem]);

  const handleSeatGuest = useCallback((tableId, seatIndex, guestId) => {
    seatGuest(tableId, seatIndex, guestId);
  }, [seatGuest]);

  const handleToggleLockChair = useCallback((tableId, seatIndex) => {
    toggleLockChair(tableId, seatIndex);
  }, [toggleLockChair]);

  const handleDeleteTable = useCallback((tableId) => {
    deleteTable(tableId);
  }, [deleteTable]);

  const handleDeleteArea = useCallback((areaId) => {
    deleteArea(areaId);
  }, [deleteArea]);

  const handleResizeTable = useCallback((tableId, updates) => {
    resizeTable(tableId, updates);
  }, [resizeTable]);

  const handleRotateTable = useCallback((tableId, rotation) => {
    rotateTable(tableId, rotation);
  }, [rotateTable]);

  const handleResizeArea = useCallback((areaId, width, height) => {
    resizeArea(areaId, width, height);
  }, [resizeArea]);

  const handleResizeControls = useCallback((newHeight) => {
    setControlsHeight(newHeight);
  }, []);

  // Load plan on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('data')
          .eq('slug', slug)
          .maybeSingle();
        if (error || !data || !data.data || cancelled) return;
        loadPlan(data.data);
      } catch (e) {
        // ignore load errors in UI
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, slug, loadPlan]);

  // Autosave plan on changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        await supabase
          .from('plans')
          .upsert({
            slug,
            editor_token: editorToken,
            data: {
              guests,
              tables,
              specialAreas,
              lockedChairs: Array.from(lockedChairs)
            }
          }, { onConflict: 'slug' });
      } catch (e) {
        // ignore save errors in UI
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [guests, tables, specialAreas, lockedChairs, supabase, slug, editorToken]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <h1>Wedding Seating Chart Planner</h1>
        </header>
        
        <div className="app-container">
          <div className="sidebar">
            <Controls
              onAddTable={handleAddTable}
              onAddSpecialArea={handleAddSpecialArea}
              onImportGuests={() => setShowImportModal(true)}
              height={controlsHeight}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
            <Splitter onResize={handleResizeControls} minHeight={200} maxHeight={600} />
            <GuestList
              guests={guests}
            />
          </div>
          
          <div className="main-content">
            <SeatingChart 
              tables={tables}
              specialAreas={specialAreas}
              guests={guests}
              onMoveItem={handleMoveItem}
              onSeatGuest={handleSeatGuest}
              onToggleLockChair={handleToggleLockChair}
              lockedChairs={lockedChairs}
              onDeleteTable={handleDeleteTable}
              onDeleteArea={handleDeleteArea}
              onResizeTable={handleResizeTable}
              onResizeArea={handleResizeArea}
              onRotateTable={handleRotateTable}
            />
          </div>
        </div>
        
        {showImportModal && (
          <ImportModal 
            onImport={handleImportGuests}
            onClose={() => setShowImportModal(false)}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default App;