import React, { useState } from 'react';
import { db } from '../db/db';
import { X } from 'lucide-react';

interface CreateSprintModalProps {
  defaultName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateSprintModal({ defaultName, onClose, onSuccess }: CreateSprintModalProps) {
  const [name, setName] = useState(defaultName);
  const [duration, setDuration] = useState('14'); // default 2 weeks

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await db.sprints.add({
      id: crypto.randomUUID(),
      name,
      durationDays: duration ? parseInt(duration) : undefined,
      status: 'planned',
      createdAt: Date.now()
    });

    if (onSuccess) onSuccess();
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
    }}>
      <div style={{
        backgroundColor: 'var(--n0)',
        padding: '24px',
        borderRadius: 'var(--radius)',
        width: '400px',
        maxWidth: '90%',
        boxShadow: 'var(--shadow-dropdown)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', margin: 0 }}>Create Sprint</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px', color: 'var(--text-secondary)' }}>Sprint Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '8px' }}
              placeholder="e.g. Sprint 1"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px', color: 'var(--text-secondary)' }}>Duration (days)</label>
            <select 
              value={duration} 
              onChange={e => setDuration(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="7">1 week (7 days)</option>
              <option value="14">2 weeks (14 days)</option>
              <option value="21">3 weeks (21 days)</option>
              <option value="28">4 weeks (28 days)</option>
              <option value="">Custom (set manually later)</option>
            </select>
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
