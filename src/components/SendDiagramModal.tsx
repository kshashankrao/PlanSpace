import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import { X, FileText, CheckSquare, Plus, Search, Check } from 'lucide-react';

interface SendDiagramModalProps {
  diagramId: string;
  diagramType: 'mindmap' | 'flowchart';
  diagramTitle: string;
  onClose: () => void;
}

export default function SendDiagramModal({
  diagramId,
  diagramType,
  diagramTitle,
  onClose,
}: SendDiagramModalProps) {
  const [tab, setTab] = useState<'doc' | 'task'>('doc');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const navigate = useNavigate();

  const docs = useLiveQuery(() => db.docs.orderBy('updatedAt').reverse().toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray(), []) || [];

  const filteredDocs = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const buildEmbedHtml = () =>
    `<div data-type="embedded-diagram" diagramid="${diagramId}" diagramtype="${diagramType}" title="${diagramTitle.replace(/"/g, '&quot;')}"></div><p></p>`;

  const handleEmbedInDoc = async (docId: string) => {
    const doc = await db.docs.get(docId);
    if (!doc) return;
    const updatedContent = `${doc.content || ''}${buildEmbedHtml()}`;
    await db.docs.update(docId, {
      content: updatedContent,
      updatedAt: Date.now(),
    });
    setFeedback(`Embedded in "${doc.title}"!`);
    setTimeout(() => {
      onClose();
      navigate(`/docs?id=${docId}`);
    }, 450);
  };

  const handleCreateNewDocWithDiagram = async () => {
    const newDocId = crypto.randomUUID();
    const docTitle = `${diagramTitle} — Notes`;
    await db.docs.add({
      id: newDocId,
      title: docTitle,
      content: `<h1>${diagramTitle}</h1><p>Brainstorming notes and specification:</p>${buildEmbedHtml()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onClose();
    navigate(`/docs?id=${newDocId}`);
  };

  const handleAttachToTask = async (taskId: string) => {
    const task = await db.tasks.get(taskId);
    if (!task) return;
    const update: Record<string, any> = { updatedAt: Date.now() };
    if (diagramType === 'mindmap') {
      update.mindMapId = diagramId;
    } else {
      update.flowchartId = diagramId;
    }
    await db.tasks.update(taskId, update);
    const updatedTask = await db.tasks.get(taskId);
    setFeedback(`Linked to "${task.title}"!`);
    setTimeout(() => {
      onClose();
      if (updatedTask) {
        window.dispatchEvent(new CustomEvent('edit-task', { detail: updatedTask }));
      }
    }, 400);
  };

  const handleCreateTaskFromDiagram = async () => {
    const activeSprint = await db.sprints.where('status').equals('active').first();
    const newTaskId = crypto.randomUUID();
    const newTask = {
      id: newTaskId,
      title: diagramTitle,
      description: `Linked ${diagramType === 'mindmap' ? 'Mind Map' : 'Flowchart'}: ${diagramTitle}`,
      statusId: 'todo',
      priority: 'medium' as const,
      sprintId: activeSprint?.id,
      startDate: Date.now(),
      duration: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 0,
      ...(diagramType === 'mindmap' ? { mindMapId: diagramId } : { flowchartId: diagramId }),
    };
    await db.tasks.add(newTask);
    onClose();
    window.dispatchEvent(new CustomEvent('edit-task', { detail: newTask }));
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(9, 30, 66, 0.54)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'var(--n0)',
          borderRadius: 'var(--radius)',
          width: '460px',
          maxWidth: '92vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--n800)', textTransform: 'none' }}>
              Add "{diagramTitle}" to Docs or Task
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Embed this {diagramType === 'mindmap' ? 'Mind Map' : 'Flowchart'} into a document or attach it to a task
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', padding: '12px 20px 0 20px', gap: '8px', backgroundColor: 'var(--n10)', borderBottom: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setTab('doc')}
            style={{
              padding: '8px 14px',
              background: tab === 'doc' ? 'var(--n0)' : 'transparent',
              border: '1px solid',
              borderColor: tab === 'doc' ? 'var(--border-color)' : 'transparent',
              borderBottom: tab === 'doc' ? '2px solid var(--b400)' : '1px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '13px',
              color: tab === 'doc' ? 'var(--b400)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={15} /> Embed in Doc
          </button>
          <button
            type="button"
            onClick={() => setTab('task')}
            style={{
              padding: '8px 14px',
              background: tab === 'task' ? 'var(--n0)' : 'transparent',
              border: '1px solid',
              borderColor: tab === 'task' ? 'var(--border-color)' : 'transparent',
              borderBottom: tab === 'task' ? '2px solid var(--b400)' : '1px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '13px',
              color: tab === 'task' ? 'var(--b400)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckSquare size={15} /> Attach to Task
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
          {feedback ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--g600)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <Check size={18} /> {feedback}
            </div>
          ) : (
            <>
              {/* Quick Create Action */}
              {tab === 'doc' ? (
                <button
                  type="button"
                  onClick={handleCreateNewDocWithDiagram}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: '36px' }}
                >
                  <Plus size={16} /> Create New Doc with this {diagramType === 'mindmap' ? 'Mind Map' : 'Flowchart'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateTaskFromDiagram}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: '36px' }}
                >
                  <Plus size={16} /> Create New Task Linked to this {diagramType === 'mindmap' ? 'Mind Map' : 'Flowchart'}
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--n10)' }}>
                <Search size={14} color="var(--text-secondary)" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tab === 'doc' ? 'Or search existing documents...' : 'Or search existing tasks...'}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px' }}>
                {tab === 'doc' ? (
                  filteredDocs.length > 0 ? (
                    filteredDocs.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleEmbedInDoc(doc.id)}
                        className="dropdown-item"
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                          <FileText size={15} color="var(--b400)" /> {doc.title}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--b400)', fontWeight: 500 }}>Embed →</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No matching documents found.
                    </div>
                  )
                ) : (
                  filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleAttachToTask(task.id)}
                        className="dropdown-item"
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                          <CheckSquare size={15} color="var(--b400)" /> {task.title}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--b400)', fontWeight: 500 }}>Attach →</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No matching tasks found.
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

