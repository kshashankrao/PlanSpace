import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatTaskId } from '../db/db';
import {
  X,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  Network,
  Workflow,
  FileText,
  Plus,
  ExternalLink,
  Eye,
} from 'lucide-react';
import type { Task, TaskComment } from '../db/db';
import EmbeddedDiagramModal from './EmbeddedDiagramModal';

interface TaskModalProps {
  taskToEdit?: Task;
  defaultSprintId?: string;
  onClose: () => void;
}

function toDateInputString(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TaskModal({ taskToEdit, defaultSprintId, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const initialPriority = taskToEdit?.priority === 'urgent' ? 'high' : (taskToEdit?.priority || 'medium');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialPriority as any);
  const [statusId, setStatusId] = useState<string>(taskToEdit?.statusId || 'todo');
  const [sprintId, setSprintId] = useState<string>(taskToEdit?.sprintId ?? defaultSprintId ?? '');
  const [duration, setDuration] = useState(taskToEdit?.duration ? taskToEdit.duration.toString() : '2');
  const [startDateStr, setStartDateStr] = useState<string>(
    toDateInputString(taskToEdit?.startDate ?? Date.now())
  );

  // References state
  const [mindMapId, setMindMapId] = useState<string>(taskToEdit?.mindMapId || '');
  const [flowchartId, setFlowchartId] = useState<string>(taskToEdit?.flowchartId || '');
  const [docId, setDocId] = useState<string>(taskToEdit?.docId || '');
  const [isAddingRef, setIsAddingRef] = useState(false);
  const [previewDiagram, setPreviewDiagram] = useState<{ type: 'mindmap' | 'flowchart'; id: string; title: string } | null>(null);

  // --- Comments State ---
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentMedia, setNewCommentMedia] = useState<string[]>([]);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());
  const mindMaps = useLiveQuery(() => db.mindMaps.toArray());
  const flowcharts = useLiveQuery(() => db.flowcharts.toArray());
  const docs = useLiveQuery(() => db.docs.toArray());

  const linkedMindMapNode = useLiveQuery(
    async () => (taskToEdit?.mindmapNodeId ? await db.mindMapNodes.get(taskToEdit.mindmapNodeId) : undefined),
    [taskToEdit?.mindmapNodeId]
  );
  const linkedFlowchartNode = useLiveQuery(
    async () => (taskToEdit?.flowchartNodeId ? await db.flowchartNodes.get(taskToEdit.flowchartNodeId) : undefined),
    [taskToEdit?.flowchartNodeId]
  );

  useEffect(() => {
    if (linkedMindMapNode?.mindMapId && !mindMapId) {
      setMindMapId(linkedMindMapNode.mindMapId);
    }
  }, [linkedMindMapNode, mindMapId]);

  useEffect(() => {
    if (linkedFlowchartNode?.flowchartId && !flowchartId) {
      setFlowchartId(linkedFlowchartNode.flowchartId);
    }
  }, [linkedFlowchartNode, flowchartId]);

  // If creating on the Kanban board and no defaultSprintId was explicitly passed, default to active sprint
  useEffect(() => {
    if (!taskToEdit && defaultSprintId === undefined && sprints && window.location.hash.includes('/planning/board')) {
      const active = sprints.find(s => s.status === 'active');
      if (active) setSprintId(active.id);
    }
  }, [taskToEdit, defaultSprintId, sprints]);

  const comments = useLiveQuery(
    () =>
      taskToEdit
        ? db.taskComments.where('taskId').equals(taskToEdit.id).reverse().sortBy('createdAt')
        : Promise.resolve([] as TaskComment[]),
    [taskToEdit?.id]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedStart = startDateStr ? new Date(startDateStr + 'T09:00:00').getTime() : undefined;
    const parsedDuration = duration ? Math.max(1, parseInt(duration, 10)) : undefined;

    if (taskToEdit) {
      await db.tasks.update(taskToEdit.id, {
        title: title.trim(),
        description,
        priority,
        statusId,
        sprintId: sprintId || undefined,
        duration: parsedDuration,
        startDate: parsedStart,
        mindMapId: mindMapId || undefined,
        flowchartId: flowchartId || undefined,
        docId: docId || undefined,
        updatedAt: Date.now(),
      });
    } else {
      await db.tasks.add({
        id: crypto.randomUUID(),
        title: title.trim(),
        description,
        statusId,
        sprintId: sprintId || undefined,
        priority,
        duration: parsedDuration,
        startDate: parsedStart,
        mindMapId: mindMapId || undefined,
        flowchartId: flowchartId || undefined,
        docId: docId || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: Date.now(),
      });
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!taskToEdit) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await db.tasks.delete(taskToEdit.id);

      if (taskToEdit.mindmapNodeId) {
        await db.mindMapNodes.update(taskToEdit.mindmapNodeId, { taskId: undefined });
        window.dispatchEvent(new CustomEvent('node-updated'));
      }
      if (taskToEdit.flowchartNodeId) {
        await db.flowchartNodes.update(taskToEdit.flowchartNodeId, { taskId: undefined });
      }

      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewDiagram) {
          setPreviewDiagram(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, previewDiagram]);

  // --- Comment Handlers ---
  const handleAddComment = async () => {
    if (!taskToEdit || (!newCommentText.trim() && newCommentMedia.length === 0)) return;

    await db.taskComments.add({
      id: crypto.randomUUID(),
      taskId: taskToEdit.id,
      content: newCommentText,
      media: newCommentMedia,
      createdAt: Date.now(),
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
    reader.onload = event => {
      if (event.target?.result) {
        setNewCommentMedia(prev => [...prev, event.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (index: number) => {
    setNewCommentMedia(prev => prev.filter((_, i) => i !== index));
  };

  const resolvedMindMap = mindMaps?.find(m => m.id === mindMapId);
  const resolvedFlowchart = flowcharts?.find(f => f.id === flowchartId);
  const resolvedDoc = docs?.find(d => d.id === docId);

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 30, 66, 0.54)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'var(--n0)',
          borderRadius: '8px',
          width: '1040px',
          maxWidth: '95%',
          height: '86vh',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'var(--n20)',
                color: 'var(--n700)',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              {taskToEdit ? formatTaskId(taskToEdit.id) : 'NEW ISSUE'}
            </span>
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
                  <MoreHorizontal size={20} />
                </button>
                {isMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '6px',
                      backgroundColor: 'var(--n0)',
                      boxShadow: 'var(--shadow-dropdown)',
                      borderRadius: '6px',
                      width: '160px',
                      zIndex: 10,
                      padding: '6px 0',
                    }}
                  >
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
                        color: 'var(--danger-color)',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                      onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n10)')}
                      onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 size={15} /> Delete Task
                    </button>
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }} title="Close (Esc)">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT COLUMN: Title, Description, Comments */}
          <div style={{ flex: '0 0 64%', padding: '24px', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--n800)',
                border: '1px solid transparent',
                marginBottom: '20px',
                borderRadius: '6px',
              }}
              placeholder="What needs to be done?"
              className="editable-input"
            />

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--n800)', fontSize: '14px' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  resize: 'vertical',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--n10)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}
                placeholder="Add a detailed description, acceptance criteria, or notes..."
              />
            </div>

            {/* ACTIVITY / COMMENTS SECTION */}
            {taskToEdit ? (
              <div>
                <h3
                  style={{
                    fontSize: '14px',
                    color: 'var(--n800)',
                    fontWeight: 600,
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <MessageSquare size={16} /> Activity & Comments
                </h3>

                {/* Comment Input */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--b400)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                  >
                    ME
                  </div>
                  <div
                    style={{
                      flex: 1,
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--n0)',
                    }}
                  >
                    <textarea
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Add a comment or paste an image..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: 'none',
                        resize: 'vertical',
                        minHeight: '72px',
                        outline: 'none',
                        fontSize: '14px',
                      }}
                    />

                    {newCommentMedia.length > 0 && (
                      <div
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          backgroundColor: 'var(--n10)',
                          borderTop: '1px solid var(--border-color)',
                        }}
                      >
                        {newCommentMedia.map((mediaUrl, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'relative',
                              width: '80px',
                              height: '80px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid var(--n40)',
                            }}
                          >
                            <img src={mediaUrl} alt="attachment preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              onClick={() => removeMedia(idx)}
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                padding: '2px',
                                cursor: 'pointer',
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--n10)',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}
                      >
                        <ImageIcon size={15} /> Attach Image
                      </button>
                      <button
                        type="button"
                        onClick={handleAddComment}
                        disabled={!newCommentText.trim() && newCommentMedia.length === 0}
                        className="btn btn-primary"
                        style={{ padding: '4px 12px', fontSize: '13px' }}
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {comments?.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--n40)',
                          color: 'var(--n600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}
                      >
                        U
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--n800)', marginRight: '8px', fontSize: '13px' }}>User</span>
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
                                  objectFit: 'cover',
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {comments?.length === 0 && (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0', fontSize: '13px' }}>
                      No comments yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  padding: '16px 0',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '16px',
                }}
              >
                Create this task first to post activity comments and image attachments.
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Metadata & References */}
          <div style={{ flex: '0 0 36%', padding: '20px 24px', backgroundColor: 'var(--n10)', overflowY: 'auto' }}>
            <form onSubmit={handleSubmit} id="task-metadata-form" style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: '100%' }}>
              {/* Details Card */}
              <div style={{ backgroundColor: 'var(--n0)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.6px',
                  }}
                >
                  Details
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Status
                    </label>
                    <select
                      value={statusId}
                      onChange={e => setStatusId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--n40)',
                        backgroundColor: 'var(--n10)',
                        fontSize: '13px',
                      }}
                    >
                      {(statuses && statuses.length > 0
                        ? statuses
                        : [
                            { id: 'todo', title: 'To Do' },
                            { id: 'in_progress', title: 'In Progress' },
                            { id: 'done', title: 'Done' },
                          ]
                      ).map(st => (
                        <option key={st.id} value={st.id}>
                          {st.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--n40)',
                        backgroundColor: 'var(--n10)',
                        fontSize: '13px',
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Sprint
                  </label>
                  <select
                    value={sprintId}
                    onChange={e => setSprintId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--n40)',
                      backgroundColor: 'var(--n10)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="">Backlog (No Sprint)</option>
                    {sprints?.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name} ({sp.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={e => setStartDateStr(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--n40)',
                        backgroundColor: 'var(--n10)',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--n40)',
                        backgroundColor: 'var(--n10)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* References & Linked Diagrams / Docs Section */}
              <div style={{ backgroundColor: 'var(--n0)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.6px',
                    }}
                  >
                    Linked Diagrams & Docs
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingRef(!isAddingRef)}
                    className="btn btn-ghost"
                    style={{ padding: '2px 8px', fontSize: '12px', height: '24px', color: 'var(--b400)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={13} /> {isAddingRef ? 'Done' : 'Link'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Mind Map badge */}
                  {(mindMapId || taskToEdit?.mindmapNodeId) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--b50)',
                        color: 'var(--b500)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <Network size={14} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {linkedMindMapNode ? `Idea: ${linkedMindMapNode.label}` : resolvedMindMap?.title || 'Mind Map'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {mindMapId && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDiagram({
                                type: 'mindmap',
                                id: mindMapId,
                                title: resolvedMindMap?.title || 'Mind Map',
                              })
                            }
                            className="btn btn-ghost"
                            style={{ padding: '2px 5px', height: '22px', color: 'var(--b500)' }}
                            title="Interactive Preview"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (taskToEdit?.mindmapNodeId) {
                              window.location.hash = `#/mindmap?node=${taskToEdit.mindmapNodeId}`;
                            } else if (mindMapId) {
                              window.location.hash = `#/mindmap?map=${mindMapId}`;
                            }
                            onClose();
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '2px 5px', height: '22px', color: 'var(--b500)' }}
                          title="Open in Mind Map"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Flowchart badge */}
                  {(flowchartId || taskToEdit?.flowchartNodeId) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#e6fcff',
                        color: '#0065ff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <Workflow size={14} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {linkedFlowchartNode ? `Step: ${linkedFlowchartNode.label}` : resolvedFlowchart?.title || 'Flowchart'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {flowchartId && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDiagram({
                                type: 'flowchart',
                                id: flowchartId,
                                title: resolvedFlowchart?.title || 'Flowchart',
                              })
                            }
                            className="btn btn-ghost"
                            style={{ padding: '2px 5px', height: '22px', color: '#0065ff' }}
                            title="Interactive Preview"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const targetFcId = flowchartId || linkedFlowchartNode?.flowchartId;
                            window.location.hash = targetFcId ? `#/flowchart?map=${targetFcId}` : '#/flowchart';
                            onClose();
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '2px 5px', height: '22px', color: '#0065ff' }}
                          title="Open in Flowchart"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Doc badge */}
                  {docId && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#eae6ff',
                        color: '#403294',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <FileText size={14} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {resolvedDoc?.title || 'Linked Document'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = `#/docs?id=${docId}`;
                          onClose();
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '2px 5px', height: '22px', color: '#403294' }}
                        title="Open Document"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  )}

                  {!mindMapId && !taskToEdit?.mindmapNodeId && !flowchartId && !taskToEdit?.flowchartNodeId && !docId && !isAddingRef && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                      No linked diagrams or docs yet. Click "+ Link" to attach a Mind Map, Flowchart, or Doc.
                    </div>
                  )}
                </div>

                {/* Picker to attach/unlink Mind Map, Flowchart, or Doc */}
                {isAddingRef && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Mind Map
                      </label>
                      <select
                        value={mindMapId}
                        onChange={e => setMindMapId(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--n40)', fontSize: '12px' }}
                      >
                        <option value="">None</option>
                        {mindMaps?.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Flowchart
                      </label>
                      <select
                        value={flowchartId}
                        onChange={e => setFlowchartId(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--n40)', fontSize: '12px' }}
                      >
                        <option value="">None</option>
                        {flowcharts?.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Document
                      </label>
                      <select
                        value={docId}
                        onChange={e => setDocId(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--n40)', fontSize: '12px' }}
                      >
                        <option value="">None</option>
                        {docs?.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.title || 'Untitled'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!title.trim()}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: '14px' }}
                >
                  {taskToEdit ? 'Save Changes' : 'Create Task'}
                </button>
                <button type="button" onClick={onClose} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Inline Interactive Diagram Preview Modal */}
      {previewDiagram && (
        <EmbeddedDiagramModal
          diagramType={previewDiagram.type}
          diagramId={previewDiagram.id}
          title={previewDiagram.title}
          onClose={() => setPreviewDiagram(null)}
        />
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            cursor: 'zoom-out',
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
              borderRadius: '4px',
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
