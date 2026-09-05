import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { X, Image as ImageIcon, MessageSquare, Trash2, MoreHorizontal } from 'lucide-react';
import type { Task, TaskComment } from '../db/db';

interface TaskModalProps {
  taskToEdit?: Task;
  onClose: () => void;
}

export default function TaskModal({ taskToEdit, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  // Map 'urgent' to 'high' for backward compatibility
  const initialPriority = taskToEdit?.priority === 'urgent' ? 'high' : (taskToEdit?.priority || 'medium');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialPriority as any);
  const [duration, setDuration] = useState(taskToEdit?.duration ? taskToEdit.duration.toString() : '');
  
  // --- Comments State ---
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentMedia, setNewCommentMedia] = useState<string[]>([]);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments only if editing an existing task
  const comments = useLiveQuery(
    () => taskToEdit ? db.taskComments.where('taskId').equals(taskToEdit.id).reverse().sortBy('createdAt') : Promise.resolve([] as TaskComment[]),
    [taskToEdit?.id]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      await db.tasks.update(taskToEdit.id, {
        title,
        description,
        priority,
        duration: duration ? parseInt(duration) : undefined,
        updatedAt: Date.now(),
      });
    } else {
      await db.tasks.add({
        id: crypto.randomUUID(),
        title,
        description,
        statusId: 'todo',
        priority,
        duration: duration ? parseInt(duration) : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: 0,
      });
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!taskToEdit) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await db.tasks.delete(taskToEdit.id);
      
      // If linked to a mindmap node, unlink it
      if (taskToEdit.mindmapNodeId) {
        await db.mindMapNodes.update(taskToEdit.mindmapNodeId, { taskId: undefined });
        window.dispatchEvent(new CustomEvent('node-updated'));
      }
      
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // --- Comment Handlers ---

  const handleAddComment = async () => {
    if (!taskToEdit || (!newCommentText.trim() && newCommentMedia.length === 0)) return;

    await db.taskComments.add({
      id: crypto.randomUUID(),
      taskId: taskToEdit.id,
      content: newCommentText,
      media: newCommentMedia,
      createdAt: Date.now()
    });

    setNewCommentText('');
    setNewCommentMedia([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => processFile(file));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) processFile(file);
      }
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewCommentMedia(prev => [...prev, event.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (index: number) => {
    setNewCommentMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(9, 30, 66, 0.54)', // Jira style modal backdrop
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'var(--n0)',
        borderRadius: '3px',
        width: '1040px',
        maxWidth: '95%',
        height: '85vh',
        boxShadow: '0 8px 16px -4px rgba(9, 30, 66, 0.25), 0 0 0 1px rgba(9, 30, 66, 0.08)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', paddingBottom: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '14px' }}>{taskToEdit ? `TSK-${taskToEdit.id.substring(0,4)}` : 'Create New Issue'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {taskToEdit && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="btn btn-ghost" 
                  style={{ padding: '6px' }}
                  title="More actions"
                >
                  <MoreHorizontal size={24} />
                </button>
                {isMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: 'var(--n0)',
                    boxShadow: '0 4px 12px rgba(9, 30, 66, 0.15), 0 0 0 1px rgba(9, 30, 66, 0.08)',
                    borderRadius: '3px',
                    width: '160px',
                    zIndex: 10,
                    padding: '8px 0'
                  }}>
                    <button 
                      onClick={handleDelete}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#de350b',
                        fontSize: '14px'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--n10)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={16} /> Delete Task
                    </button>
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }} title="Close (Esc)">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* LEFT COLUMN: Title, Description, Comments */}
          <div style={{ flex: '0 0 65%', padding: '24px', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '8px', fontSize: '24px', fontWeight: 500, color: 'var(--n800)', border: '1px solid transparent', marginBottom: '24px', borderRadius: '4px' }}
              placeholder="What needs to be done?"
              className="editable-input"
            />

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--n800)', fontSize: '15px' }}>Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                rows={6}
                style={{ width: '100%', padding: '12px', resize: 'vertical', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--n10)', fontSize: '14px' }}
                placeholder="Add a description..."
              />
            </div>

            {/* ACTIVITY / COMMENTS SECTION */}
            {taskToEdit && (
              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--n800)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={16} /> Activity
                </h3>

                {/* Comment Input */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--b400)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                    ME
                  </div>
                  <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--n0)' }}>
                    <textarea
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Add a comment..."
                      style={{ width: '100%', padding: '12px', border: 'none', resize: 'vertical', minHeight: '80px', outline: 'none', fontSize: '14px' }}
                    />
                    
                    {/* Media Preview Area */}
                    {newCommentMedia.length > 0 && (
                      <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: 'var(--n10)', borderTop: '1px solid var(--border-color)' }}>
                        {newCommentMedia.map((mediaUrl, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--n40)' }}>
                            <img src={mediaUrl} alt="attachment preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button 
                              onClick={() => removeMedia(idx)}
                              style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--n10)', borderTop: '1px solid var(--border-color)' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileSelect} 
                      />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <ImageIcon size={16} /> Attach Image
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAddComment} 
                        disabled={!newCommentText.trim() && newCommentMedia.length === 0}
                        className="btn btn-primary"
                        style={{ padding: '4px 12px' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {comments?.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--n40)', color: 'var(--n600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                        U
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--n800)', marginRight: '8px' }}>User</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {comment.content && (
                          <div style={{ color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>
                            {comment.content}
                          </div>
                        )}
                        {comment.media && comment.media.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {comment.media.map((url, idx) => (
                              <img 
                                key={idx} 
                                src={url} 
                                alt="attachment" 
                                onDoubleClick={() => setEnlargedImage(url)}
                                style={{ 
                                  maxWidth: '200px', 
                                  maxHeight: '120px', 
                                  borderRadius: '4px', 
                                  border: '1px solid var(--n40)',
                                  cursor: 'pointer',
                                  objectFit: 'cover'
                                }} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {comments?.length === 0 && (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>
                      No comments yet.
                    </div>
                  )}
                </div>
              </div>
            )}
            {!taskToEdit && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '24px 0', borderTop: '1px solid var(--border-color)', marginTop: '24px' }}>
                Save this task first to add comments and attachments.
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Metadata */}
          <div style={{ flex: '0 0 35%', padding: '24px', backgroundColor: 'var(--n10)', overflowY: 'auto' }}>
            <form onSubmit={handleSubmit} id="task-metadata-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ backgroundColor: 'var(--n0)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Details</h4>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px', color: 'var(--text-secondary)' }}>Priority</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--n40)', backgroundColor: 'var(--n10)' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px', color: 'var(--text-secondary)' }}>Duration (days)</label>
                  <input 
                    type="number" 
                    value={duration} 
                    onChange={e => setDuration(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--n40)', backgroundColor: 'var(--n10)' }}
                  />
                </div>
              </div>

              {/* References Section */}
              {taskToEdit && (
                <div style={{ backgroundColor: 'var(--n0)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>References</h4>
                  {taskToEdit.mindmapNodeId ? (
                    <a 
                      href={`/#/mindmap?node=${taskToEdit.mindmapNodeId}`}
                      onClick={onClose}
                      style={{ 
                        fontSize: '13px', 
                        backgroundColor: 'var(--b50)', 
                        color: 'var(--b400)', 
                        padding: '6px 12px', 
                        borderRadius: '4px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 500
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                      Mind Map Node
                    </a>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                      No references added.
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                <button type="submit" className="btn btn-primary" disabled={!title.trim()} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  {taskToEdit ? 'Save Changes' : 'Create Task'}
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                </div>
              </div>

            </form>
          </div>
          
        </div>
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          onClick={() => setEnlargedImage(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={enlargedImage} 
            alt="enlarged" 
            style={{ 
              maxWidth: '90vw', 
              maxHeight: '90vh',
              objectFit: 'contain',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }} 
          />
          <button 
            onClick={() => setEnlargedImage(null)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
