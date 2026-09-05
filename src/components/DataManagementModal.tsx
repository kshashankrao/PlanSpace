import React, { useState, useRef } from 'react';
import { X, Download, Upload, AlertTriangle } from 'lucide-react';
import { db } from '../db/db';
import { exportDB, importInto } from 'dexie-export-import';

export default function DataManagementModal({ onClose }: { onClose: () => void }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
        padding: '32px',
        borderRadius: 'var(--radius)',
        width: '500px',
        maxWidth: '90%',
        boxShadow: 'var(--shadow-dropdown)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', margin: 0 }}>Data Management</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Export Section */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--n800)' }}>Export Data</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Download a complete backup of your PlanSpace workspace (Tasks, Sprints, Mind Maps, Flowcharts, and Docs) as a JSON file.
            </p>
            <button 
              onClick={handleExport} 
              disabled={isExporting}
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export to JSON'}
            </button>
          </div>

          {/* Import Section */}
          <div style={{ border: '1px solid var(--r200)', borderRadius: '8px', padding: '16px', backgroundColor: '#FEF2F2' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--r500)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Restore Data
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Restore your workspace from a previous backup file. <strong>This will completely overwrite your current data.</strong>
            </p>
            <input 
              type="file" 
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isImporting}
              className="btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--n0)', border: '1px solid var(--r300)', color: 'var(--r500)' }}
            >
              <Upload size={16} />
              {isImporting ? 'Importing...' : 'Import from JSON'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
