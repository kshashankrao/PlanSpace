import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import DocEditor from '../components/DocEditor';
import { FileText, Plus, Trash2, ChevronDown, ChevronRight, MoreVertical, Edit2, ChevronLeft } from 'lucide-react';
import type { Doc } from '../db/db';

const DocTreeNode = ({
  doc,
  docs,
  activeDocId,
  setActiveDocId,
  createDoc,
  handleDelete,
  renamingDocId,
  setRenamingDocId,
  handleUpdateTitle
}: {
  doc: Doc;
  docs: Doc[];
  activeDocId: string | null;
  setActiveDocId: (id: string) => void;
  createDoc: (parentId?: string) => void;
  handleDelete: (id: string, e: React.MouseEvent) => void;
  renamingDocId: string | null;
  setRenamingDocId: (id: string | null) => void;
  handleUpdateTitle: (id: string, title: string) => void;
}) => {
  const children = docs.filter(d => d.parentId === doc.id);
  const [expanded, setExpanded] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tempTitle, setTempTitle] = useState(doc.title);
  const isRenaming = renamingDocId === doc.id;

  useEffect(() => {
    if (isRenaming) {
      setTempTitle(doc.title);
    }
  }, [isRenaming, doc.title]);

  const commitRename = () => {
    if (tempTitle.trim() && tempTitle !== doc.title) {
      handleUpdateTitle(doc.id, tempTitle.trim());
    }
    setRenamingDocId(null);
  };

  useEffect(() => {
    const handleClickOutside = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div style={{ paddingLeft: doc.parentId ? '16px' : '0' }}>
      <div
        onClick={() => setActiveDocId(doc.id)}
        onDoubleClick={() => { if (children.length > 0) setExpanded(!expanded); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: '7px 8px',
          borderRadius: '6px',
          cursor: 'pointer',
          backgroundColor: activeDocId === doc.id ? 'var(--b50)' : isHovered ? 'var(--n20)' : 'transparent',
          color: activeDocId === doc.id ? 'var(--b500)' : 'var(--n800)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2px',
          fontWeight: activeDocId === doc.id ? 600 : 500,
          transition: 'background 0.1s'
        }}
        className="doc-tree-node"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', flex: 1 }}>
          {children.length > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--n500)' }}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <FileText size={13} color={activeDocId === doc.id ? 'var(--b400)' : 'var(--n300)'} style={{ flexShrink: 0 }} />}
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
            {isRenaming ? (
              <input
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingDocId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: 'var(--n0)',
                  border: '1px solid var(--b400)',
                  borderRadius: '3px',
                  padding: '2px 4px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  color: 'var(--n800)'
                }}
              />
            ) : (
              doc.title
            )}
          </div>
        </div>
        <div className="doc-actions" style={{ position: 'relative', display: 'flex', gap: '2px', opacity: activeDocId === doc.id || isMenuOpen || isHovered ? 1 : 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            style={{ background: 'none', border: 'none', color: 'var(--n500)', cursor: 'pointer', padding: '2px' }}
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'var(--bg-board)',
                boxShadow: 'var(--shadow-dropdown)',
                borderRadius: 'var(--radius)',
                zIndex: 10,
                minWidth: '150px',
                display: 'flex',
                flexDirection: 'column',
                padding: '4px 0',
                border: '1px solid var(--border-color)'
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); createDoc(doc.id); setExpanded(true); setIsMenuOpen(false); }}
                style={{ background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
                className="dropdown-item"
              >
                <Plus size={14} /> Add Subpage
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setRenamingDocId(doc.id); setIsMenuOpen(false); }}
                style={{ background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
                className="dropdown-item"
              >
                <Edit2 size={14} /> Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); handleDelete(doc.id, e); }}
                style={{ background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--r500)' }}
                className="dropdown-item"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {expanded && children.map(child => (
        <DocTreeNode
          key={child.id}
          doc={child}
          docs={docs}
          activeDocId={activeDocId}
          setActiveDocId={setActiveDocId}
          createDoc={createDoc}
          handleDelete={handleDelete}
          renamingDocId={renamingDocId}
          setRenamingDocId={setRenamingDocId}
          handleUpdateTitle={handleUpdateTitle}
        />
      ))}
    </div>
  );
};

export default function Docs() {
  const docs = useLiveQuery(() => db.docs.orderBy('createdAt').reverse().toArray());
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [localTitle, setLocalTitle] = useState('');

  // Handle URL deep links
  useEffect(() => {
    const urlDocId = searchParams.get('id');
    if (urlDocId) {
      setActiveDocId(urlDocId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle global F2 shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && activeDocId && !renamingDocId) {
        e.preventDefault();
        setRenamingDocId(activeDocId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDocId, renamingDocId]);

  // Set default active doc
  useEffect(() => {
    if (docs && docs.length > 0 && (!activeDocId || !docs.some(d => d.id === activeDocId))) {
      setActiveDocId(docs[0].id);
    }
  }, [docs, activeDocId]);

  const activeDoc = docs?.find(d => d.id === activeDocId);

  useEffect(() => {
    if (activeDoc) {
      setLocalTitle(activeDoc.title);
    }
  }, [activeDoc?.id, activeDoc?.title]);

  const createDoc = async (parentId?: string) => {
    const newId = crypto.randomUUID();
    await db.docs.add({
      id: newId,
      title: 'Untitled Document',
      content: '',
      parentId: parentId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setActiveDocId(newId);
  };

  const handleUpdateContent = useCallback((content: string) => {
    if (activeDocId) {
      db.docs.update(activeDocId, { content, updatedAt: Date.now() });
    }
  }, [activeDocId]);

  const handleUpdateTitle = (id: string, title: string) => {
    db.docs.update(id, { title, updatedAt: Date.now() });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      // Collect doc and any nested subpages so no orphans remain
      const toDelete = new Set<string>([id]);
      const allDocs = docs || [];
      const queue = [id];
      while (queue.length > 0) {
        const cur = queue.shift()!;
        allDocs.filter(d => d.parentId === cur).forEach(child => {
          if (!toDelete.has(child.id)) {
            toDelete.add(child.id);
            queue.push(child.id);
          }
        });
      }
      await db.docs.bulkDelete(Array.from(toDelete));
      if (activeDocId && toDelete.has(activeDocId)) {
        setActiveDocId(null);
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: 'var(--bg-board)', position: 'relative' }}>
      {/* Sidebar */}
      <div style={{
        width: isSidebarCollapsed ? '0px' : '270px',
        minWidth: isSidebarCollapsed ? '0px' : '270px',
        backgroundColor: 'var(--n0)',
        borderRight: isSidebarCollapsed ? 'none' : '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '14px 16px', height: '54px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '270px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--n800)' }}>
            <FileText size={18} color="var(--prio-medium)" /> Docs
          </h2>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button onClick={() => createDoc()} className="btn btn-secondary" style={{ height: '28px', padding: '0 10px', fontSize: '12px', gap: '4px' }} title="New Document">
              <Plus size={14} /> New
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="btn btn-ghost"
              style={{ height: '28px', width: '28px', padding: 0 }}
              title="Collapse Docs list"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', minWidth: '270px' }}>
          {(docs?.filter(d => !d.parentId) || []).map(doc => (
            <DocTreeNode
              key={doc.id}
              doc={doc}
              docs={docs || []}
              activeDocId={activeDocId}
              setActiveDocId={setActiveDocId}
              createDoc={createDoc}
              handleDelete={handleDelete}
              renamingDocId={renamingDocId}
              setRenamingDocId={setRenamingDocId}
              handleUpdateTitle={handleUpdateTitle}
            />
          ))}
          {docs?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No documents yet.
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeDoc ? (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              {isSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="btn btn-secondary"
                  style={{ height: '30px', padding: '0 8px', fontSize: '12px', flexShrink: 0 }}
                  title="Expand Docs list"
                >
                  <ChevronRight size={15} /> Docs
                </button>
              )}
              <input
                value={localTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalTitle(val);
                  handleUpdateTitle(activeDoc.id, val);
                }}
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: 'var(--n800)',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  flex: 1,
                  padding: '4px 0'
                }}
                placeholder="Document Title..."
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Type <kbd style={{ background: 'var(--n20)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--n40)' }}>/</kbd> for commands & diagrams
              </span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <DocEditor key={activeDoc.id} initialContent={activeDoc.content} onUpdate={handleUpdateContent} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Select or create a document to get started.
          </div>
        )}
      </div>
    </div>
  );
}
