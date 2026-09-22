import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import DocEditor, { MenuBar } from '../components/DocEditor';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react';

const getFormattedDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getDisplayDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

// --- Single Day Note Component ---
const SingleDayNote = ({ dateStr, isRolling, onFocus, onEditorReady }: { dateStr: string, isRolling?: boolean, onFocus?: (editor: any) => void, onEditorReady?: (editor: any) => void }) => {
  const [initialContent, setInitialContent] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<number>(Date.now());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoaded(false); // Reset loading state when date changes so we don't mount DocEditor with old content
    db.dailyNotes.get(dateStr).then(note => {
      if (isMounted) {
        if (note) {
          setInitialContent(note.content);
          setCreatedAt(note.createdAt);
        } else {
          setInitialContent('');
          setCreatedAt(Date.now());
        }
        setIsLoaded(true);
      }
    });
    return () => { isMounted = false; };
  }, [dateStr]);

  const handleUpdate = (newContent: string) => {
    db.dailyNotes.put({
      date: dateStr,
      content: newContent,
      createdAt: createdAt,
      updatedAt: Date.now()
    });
  };

  if (!isLoaded) return null;

  return (
    <div style={{ 
      marginBottom: '40px',
      display: 'flex',
      flexDirection: 'column',
      flex: isRolling ? 'none' : 1,
      minHeight: 0
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 700, 
        color: 'var(--n800)', 
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {getDisplayDate(dateStr)}
      </h2>
      <div style={{ flex: isRolling ? 'none' : 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <DocEditor 
          key={dateStr} 
          initialContent={initialContent} 
          onUpdate={handleUpdate} 
          borderless={isRolling} 
          hideToolbar={isRolling}
          onFocus={onFocus}
          onEditorReady={onEditorReady}
        />
      </div>
    </div>
  );
};

export default function DailyNotes() {
  const [activeDate, setActiveDate] = useState<string>(getFormattedDate(new Date()));
  const [viewMode, setViewMode] = useState<'single' | 'rolling'>('single');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalEditor, setGlobalEditor] = useState<any>(null);
  const [searchParams] = useSearchParams();

  // Handle URL deep links
  useEffect(() => {
    const urlDate = searchParams.get('date');
    if (urlDate && urlDate !== activeDate) {
      setActiveDate(urlDate);
      setViewMode('single');
      setCurrentMonth(new Date(urlDate));
    }
  }, [searchParams, activeDate]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Query all notes just to know which dates have content (for calendar dots & rolling view)
  const allNotes = useLiveQuery(() => db.dailyNotes.toArray(), []) || [];
  const notesMap = useMemo(() => {
    const map = new Set<string>();
    allNotes.forEach(n => {
      // Consider it having content if it's longer than a basic empty paragraph
      if (n.content && n.content.length > 10) map.add(n.date);
    });
    return map;
  }, [allNotes]);

  // Rolling view dates (last 14 days that have notes, plus today)
  const rollingDates = useMemo(() => {
    const dates: string[] = [];
    // Ensure today is always first
    const today = getFormattedDate(new Date());
    dates.push(today);
    
    // Sort all notes by date descending
    const sortedNotes = [...allNotes].sort((a, b) => b.date.localeCompare(a.date));
    
    for (const note of sortedNotes) {
      if (note.date !== today && note.content && note.content.length > 10) {
        dates.push(note.date);
      }
      if (dates.length >= 14) break;
    }
    
    // Sort so newest is at top
    return dates.sort((a, b) => b.localeCompare(a));
  }, [allNotes]);

  // Calendar Generation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(getFormattedDate(new Date(year, month, i)));
    }
    return days;
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: 'var(--bg-board)', position: 'relative' }}>
      {/* Sidebar */}
      <div style={{ 
        width: isSidebarCollapsed ? '0px' : '300px', 
        minWidth: isSidebarCollapsed ? '0px' : '300px',
        backgroundColor: 'var(--n0)', 
        borderRight: isSidebarCollapsed ? 'none' : '1px solid var(--border-color)', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '300px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={20} color="var(--prio-medium)" /> Daily Notes
          </h2>
        </div>

        <div style={{ padding: '20px', minWidth: '300px', flex: 1, overflowY: 'auto' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--n20)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
            <button 
              className={`btn ${viewMode === 'single' ? '' : 'btn-ghost'}`}
              style={{ flex: 1, backgroundColor: viewMode === 'single' ? 'var(--n0)' : 'transparent', boxShadow: viewMode === 'single' ? 'var(--shadow-card)' : 'none', color: viewMode === 'single' ? 'var(--n800)' : 'var(--n500)' }}
              onClick={() => setViewMode('single')}
            >
              <CalendarDays size={16} /> Single Day
            </button>
            <button 
              className={`btn ${viewMode === 'rolling' ? '' : 'btn-ghost'}`}
              style={{ flex: 1, backgroundColor: viewMode === 'rolling' ? 'var(--n0)' : 'transparent', boxShadow: viewMode === 'rolling' ? 'var(--shadow-card)' : 'none', color: viewMode === 'rolling' ? 'var(--n800)' : 'var(--n500)' }}
              onClick={() => setViewMode('rolling')}
            >
              <List size={16} /> Rolling
            </button>
          </div>

          {/* Calendar */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--n0)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: '4px' }}><ChevronLeft size={16} /></button>
              <span style={{ fontWeight: 600, color: 'var(--n800)' }}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: '4px' }}><ChevronRight size={16} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--n400)' }}>{day}</div>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calendarDays.map((dateStr, i) => {
                if (!dateStr) return <div key={`empty-${i}`} />;
                const d = new Date(dateStr);
                const dayNum = d.getDate();
                const isToday = dateStr === getFormattedDate(new Date());
                const isSelected = viewMode === 'single' && dateStr === activeDate;
                const hasNote = notesMap.has(dateStr);

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setActiveDate(dateStr);
                      setViewMode('single');
                    }}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--b500)' : isToday ? 'var(--b50)' : 'transparent',
                      color: isSelected ? 'var(--n0)' : isToday ? 'var(--b500)' : 'var(--n800)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: isSelected || isToday ? 600 : 400,
                      position: 'relative'
                    }}
                  >
                    {dayNum}
                    {hasNote && (
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '4px', 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        backgroundColor: isSelected ? 'var(--n0)' : 'var(--prio-medium)' 
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="btn btn-ghost"
        style={{
          position: 'absolute',
          top: '24px',
          left: isSidebarCollapsed ? '16px' : '288px',
          zIndex: 100,
          width: '24px',
          height: '24px',
          padding: 0,
          borderRadius: '50%',
          backgroundColor: 'var(--n0)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          transition: 'left 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {viewMode === 'single' ? (
          <div style={{ flex: 1, padding: '32px 64px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <SingleDayNote key={activeDate} dateStr={activeDate} isRolling={false} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Global Sticky Toolbar */}
            <div style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--n0)', zIndex: 10 }}>
              <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                {globalEditor && <MenuBar editor={globalEditor} />}
              </div>
            </div>
            <div style={{ flex: 1, padding: '32px 64px', overflowY: 'auto' }}>
              <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <div style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '2px solid var(--border-color)' }}>
                  <h1 style={{ fontSize: '28px', margin: 0, color: 'var(--n800)' }}>Rolling Notes</h1>
                  <p style={{ color: 'var(--n500)', margin: '8px 0 0 0' }}>Showing your most recent daily notes.</p>
                </div>
                {rollingDates.map((dateStr, index) => (
                  <SingleDayNote 
                    key={dateStr} 
                    dateStr={dateStr} 
                    isRolling={true} 
                    onFocus={(editor) => setGlobalEditor(editor)}
                    onEditorReady={(editor) => {
                      if (index === 0 && !globalEditor) setGlobalEditor(editor);
                    }}
                  />
                ))}
                {rollingDates.length === 0 && (
                  <div style={{ color: 'var(--n400)', textAlign: 'center', padding: '40px' }}>
                    No recent notes found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
