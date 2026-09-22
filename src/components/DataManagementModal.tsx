import React, { useState, useRef } from 'react';
import { X, Download, Upload, ArrowLeft, Keyboard } from 'lucide-react';
import { db } from '../db/db';
import { exportDB, importInto } from 'dexie-export-import';

const ShortcutButton = ({ shortcut, description }: { shortcut: string; description: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(shortcut);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 8px', background: 'transparent', border: 'none', 
        borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.1s',
        color: copied ? 'var(--g600)' : 'var(--text-primary)'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--n50)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px' }}>{copied ? 'Copied!' : shortcut}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{description}</span>
    </button>
  );
};

export default function DataManagementModal({ onClose }: { onClose: () => void }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportDB(db, { prettyJson: true });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planspace-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export database.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: Importing will OVERWRITE all your current data. This action cannot be undone. Are you sure you want to proceed?")) {
      e.target.value = ''; // Reset file input
      return;
    }

    try {
      setIsImporting(true);
      // clear db first
      await db.delete();
      await db.open();
      await importInto(db, file, { clearTablesBeforeImport: true });
      alert("Database imported successfully! The app will now reload.");
      window.location.reload();
    } catch (error) {
      console.error('Import failed', error);
      alert('Failed to import database. Make sure the file is a valid PlanSpace backup.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'var(--n0)',
        padding: '24px',
        borderRadius: 'var(--radius)',
        width: '400px',
        maxWidth: '90%',
        boxShadow: 'var(--shadow-dropdown)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showShortcuts && (
              <button onClick={() => setShowShortcuts(false)} className="btn btn-ghost" style={{ padding: '4px' }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 style={{ fontSize: '20px', margin: 0 }}>{showShortcuts ? 'Editor Shortcuts' : 'Settings'}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!showShortcuts ? (
            <>
              <button 
                onClick={handleExport} 
                disabled={isExporting}
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', justifyContent: 'center', fontSize: '15px' }}
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Export to JSON'}
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isImporting}
                className="btn" 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', justifyContent: 'center', backgroundColor: 'var(--n0)', border: '1px solid var(--r300)', color: 'var(--r500)', fontSize: '15px' }}
              >
                <Upload size={18} />
                {isImporting ? 'Importing...' : 'Import from JSON'}
              </button>

              <button 
                onClick={() => setShowShortcuts(true)} 
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', justifyContent: 'center', fontSize: '15px' }}
              >
                <Keyboard size={18} />
                Shortcuts
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ShortcutButton shortcut="/date" description="Open date picker" />
              <ShortcutButton shortcut="/task" description="Link a task" />
              <ShortcutButton shortcut="/docs" description="Link a document" />
              <ShortcutButton shortcut="/mindmap" description="Link a mind map" />
              <ShortcutButton shortcut="/flowchart" description="Link a flowchart" />
              <ShortcutButton shortcut="/dailynotes" description="Link a daily note" />
              <ShortcutButton shortcut="//mindmap" description="Embed a mind map" />
              <ShortcutButton shortcut="//flowchart" description="Embed a flowchart" />
            </div>
          )}
          
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>

      </div>
    </div>
  );
}
