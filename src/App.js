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

function App() {
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [specialAreas, setSpecialAreas] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [lockedChairs, setLockedChairs] = useState(new Set());
  const [controlsHeight, setControlsHeight] = useState(300); // Default height for Controls

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
    setGuests(importedGuests);
    setShowImportModal(false);
  }, []);

  const handleAddTable = useCallback(({ seats, name, shape }) => {
    console.log('Adding table with:', { seats, name, shape });
    const parsedSeats = parseInt(seats);
    const newTable = {
      id: `table-${Date.now()}`,
      name: name && name.length > 0 ? name : `Table ${tables.length + 1}`,
      shape: shape || 'square',
      seats: parsedSeats,
      x: 100,
      y: 100,
      radius: 50 + (parsedSeats * 2),
      width: 160,
      height: 100,
      rotation: 0,
      guests: new Array(parsedSeats).fill(null)
    };
    setTables([...tables, newTable]);
  }, [tables]);

  const handleAddSpecialArea = useCallback((type) => {
    const newArea = {
      id: `area-${Date.now()}`,
      type,
      x: 200,
      y: 200,
      width: 150,
      height: 100
    };
    setSpecialAreas([...specialAreas, newArea]);
  }, [specialAreas]);

  const handleMoveItem = useCallback((id, x, y, type) => {
    if (type === 'table') {
      setTables(tables => tables.map(table => 
        table.id === id ? { ...table, x, y } : table
      ));
    } else if (type === 'area') {
      setSpecialAreas(areas => areas.map(area => 
        area.id === id ? { ...area, x, y } : area
      ));
    }
  }, []);

  const handleSeatGuest = useCallback((tableId, seatIndex, guestId) => {
    const chairId = `${tableId}-${seatIndex}`;
    if (lockedChairs.has(chairId)) return;

    setTables(prevTables => {
      const targetTable = prevTables.find(t => t.id === tableId);
      const previousOccupant = targetTable ? targetTable.guests[seatIndex] : null;

      const updatedTables = prevTables.map(table => {
        let updatedGuests = [...table.guests];

        // If moving a guest, remove them from any other chair across all tables
        if (guestId) {
          updatedGuests = updatedGuests.map(id => (id === guestId ? null : id));
        }

        // Set the target seat on the target table
        if (table.id === tableId) {
          updatedGuests[seatIndex] = guestId;
        }

        return { ...table, guests: updatedGuests };
      });

      // Update seated flags
      if (guestId) {
        setGuests(gs => gs.map(g => (g.id === guestId ? { ...g, seated: true } : g)));
      }
      if (!guestId && previousOccupant) {
        setGuests(gs => gs.map(g => (g.id === previousOccupant ? { ...g, seated: false } : g)));
      } else if (guestId && previousOccupant && previousOccupant !== guestId) {
        setGuests(gs => gs.map(g => (g.id === previousOccupant ? { ...g, seated: false } : g)));
      }

      return updatedTables;
    });
  }, [lockedChairs]);

  const handleToggleLockChair = useCallback((tableId, seatIndex) => {
    const chairId = `${tableId}-${seatIndex}`;
    setLockedChairs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chairId)) {
        newSet.delete(chairId);
      } else {
        newSet.add(chairId);
      }
      return newSet;
    });
  }, []);

  const handleDeleteTable = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.guests.forEach(guestId => {
        if (guestId) {
          setGuests(guests => guests.map(g => 
            g.id === guestId ? { ...g, seated: false } : g
          ));
        }
      });
    }
    setTables(tables => tables.filter(t => t.id !== tableId));
  }, [tables]);

  const handleDeleteArea = useCallback((areaId) => {
    setSpecialAreas(areas => areas.filter(a => a.id !== areaId));
  }, []);

    const handleResizeTable = useCallback((tableId, updates) => {
    setTables(tables => tables.map(table => 
      table.id === tableId ? { ...table, ...updates } : table
    ));
  }, []);

  const handleRotateTable = useCallback((tableId, rotation) => {
    setTables(tables => tables.map(table => 
      table.id === tableId ? { ...table, rotation } : table
    ));
  }, []);

  const handleResizeArea = useCallback((areaId, width, height) => {
    setSpecialAreas(areas => areas.map(area =>
      area.id === areaId ? { ...area, width, height } : area
    ));
  }, []);

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
        const s = data.data;
        setGuests(Array.isArray(s.guests) ? s.guests : []);
        setTables(Array.isArray(s.tables) ? s.tables : []);
        setSpecialAreas(Array.isArray(s.specialAreas) ? s.specialAreas : []);
        setLockedChairs(new Set(Array.isArray(s.lockedChairs) ? s.lockedChairs : []));
      } catch (e) {
        // ignore load errors in UI
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, slug]);

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
            />
            <Splitter onResize={handleResizeControls} minHeight={200} maxHeight={600} />
            <GuestList 
              guests={guests}
              onSeatGuest={handleSeatGuest}
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