import React, { useState } from 'react';
import { db } from '../db/db';
import { X } from 'lucide-react';

interface CreateMindMapModalProps {
  onClose: () => void;
  onSuccess: (newId: string) => void;
}

export default function CreateMindMapModal({ onClose, onSuccess }: CreateMindMapModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = crypto.randomUUID();
    await db.mindMaps.add({
      id: newId,
      title: name.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    await db.mindMapNodes.add({
      id: `root-${newId}`,
      mindMapId: newId,
      label: name.trim(),
      position: { x: 250, y: 250 }
    });

    onSuccess(newId);
    onClose();
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
    }}
    onKeyDown={e => e.stopPropagation()}
    >
      <div style={{
        backgroundColor: 'var(--n0)',
        padding: '24px',
        borderRadius: 'var(--radius)',
        width: '400px',
        maxWidth: '90%',
        boxShadow: 'var(--shadow-dropdown)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', margin: 0 }}>Create Mind Map</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px', color: 'var(--text-secondary)' }}>Mind Map Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{ 
                width: '100%', 
                padding: '8px', 
                color: 'var(--n800)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                outline: 'none'
              }}
              placeholder="e.g. Architecture Brainstorm"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
