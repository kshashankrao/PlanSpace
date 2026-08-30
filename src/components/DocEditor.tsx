import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Image as ImageIcon, MoreVertical, CheckSquare, Share2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

interface DocEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
}

const ReferenceModal = ({ 
  isOpen, 
  onClose, 
  type, 
  onSelect 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  type: 'task' | 'mindmap', 
  onSelect: (id: string, title: string) => void 
}) => {
  const [search, setSearch] = useState('');
  
  const items = useLiveQuery(async () => {
    if (type === 'task') {
      const tasks = await db.tasks.toArray();
      return tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())).map(t => ({ id: t.id, title: t.title }));
    } else {
      const maps = await db.mindMaps.toArray();
      return maps.filter(m => m.title.toLowerCase().includes(search.toLowerCase())).map(m => ({ id: m.id, title: m.title }));
    }
  }, [type, search]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--n0)', borderRadius: '8px', padding: '16px', 
        width: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px 0' }}>Link to {type === 'task' ? 'Task' : 'Mind Map'}</h3>
        <input 
          autoFocus
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ marginBottom: '16px' }}
        />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items?.map(item => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id, item.title); onClose(); }}
              style={{
                padding: '8px 12px', textAlign: 'left', background: 'transparent', 
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                color: 'var(--text-primary)'
              }}
              className="dropdown-item"
            >
              {type === 'task' ? <CheckSquare size={16} color="var(--prio-medium)" /> : <Share2 size={16} color="var(--prio-high)" />}
              {item.title}
            </button>
          ))}
          {items?.length === 0 && <div style={{ padding: '8px', color: 'var(--n500)', fontSize: '14px' }}>No matches found.</div>}
        </div>
      </div>
    </div>
  );
};

const MenuBar = ({ editor }: { editor: any }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<'task' | 'mindmap' | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const handleSelect = (id: string, title: string) => {
    const url = modalType === 'task' ? `#task-${id}` : `#mindmap-${id}`;
    editor.chain().focus().setLink({ href: url, target: '_self' }).insertContent(title).run();
  };

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-board)' }}>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
        title="Heading 1"
        style={toolbarBtnStyle(editor.isActive('heading', { level: 1 }))}
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
        title="Heading 2"
        style={toolbarBtnStyle(editor.isActive('heading', { level: 2 }))}
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
        title="Heading 3"
        style={toolbarBtnStyle(editor.isActive('heading', { level: 3 }))}
      >
        <Heading3 size={18} />
      </button>
      
      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />

      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
        title="Bold"
        style={toolbarBtnStyle(editor.isActive('bold'))}
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
        title="Italic"
        style={toolbarBtnStyle(editor.isActive('italic'))}
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
        title="Strikethrough"
        style={toolbarBtnStyle(editor.isActive('strike'))}
      >
        <Strikethrough size={18} />
      </button>
      
      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
        title="Bullet List"
        style={toolbarBtnStyle(editor.isActive('bulletList'))}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
        title="Ordered List"
        style={toolbarBtnStyle(editor.isActive('orderedList'))}
      >
        <ListOrdered size={18} />
      </button>

      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />

      <button
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                  editor.chain().focus().setImage({ src: result }).run();
                }
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }}
        className={`toolbar-btn`}
        title="Insert Image"
        style={toolbarBtnStyle(false)}
      >
        <ImageIcon size={18} />
      </button>

      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          className={`toolbar-btn ${isMenuOpen ? 'active' : ''}`}
          title="More Options"
          style={toolbarBtnStyle(isMenuOpen)}
        >
          <MoreVertical size={18} />
        </button>
        {isMenuOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, background: 'var(--n0)', 
            border: '1px solid var(--border-color)', borderRadius: '4px', boxShadow: 'var(--shadow-dropdown)', 
            padding: '4px 0', zIndex: 10, minWidth: '240px', display: 'flex', flexDirection: 'column',
            marginTop: '4px'
          }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setModalType('task'); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <CheckSquare size={16} /> Add reference to task
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setModalType('mindmap'); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <Share2 size={16} /> Add reference to mind map
            </button>
          </div>
        )}
      </div>

      <ReferenceModal 
        isOpen={modalType !== null} 
        onClose={() => setModalType(null)} 
        type={modalType!} 
        onSelect={handleSelect} 
      />
    </div>
  );
};

const toolbarBtnStyle = (isActive: boolean): React.CSSProperties => ({
  background: isActive ? 'var(--b50)' : 'transparent',
  color: isActive ? 'var(--b500)' : 'var(--n500)',
  border: 'none',
  padding: '6px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.1s'
});

export default function DocEditor({ initialContent, onUpdate }: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: var(--b500); text-decoration: underline; cursor: pointer;',
          target: '_self',
        }
      })
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        style: 'outline: none; min-height: 100%; font-size: 15px; line-height: 1.6; color: var(--text-primary);'
      },
    },
  });

  const handleEditorClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const a = target.closest('a');
    if (a) {
      const href = a.getAttribute('href');
      if (href?.startsWith('#task-')) {
        e.preventDefault();
        const taskId = href.replace('#task-', '');
        const task = await db.tasks.get(taskId);
        if (task) {
          window.dispatchEvent(new CustomEvent('edit-task', { detail: task }));
        }
      } else if (href?.startsWith('#mindmap-')) {
        e.preventDefault();
        const mindmapId = href.replace('#mindmap-', '');
        window.location.hash = `#/mindmap?map=${mindmapId}`;
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden', backgroundColor: 'var(--n0)', boxShadow: 'var(--shadow-card)' }}>
      <MenuBar editor={editor} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }} className="tiptap-container" onClick={handleEditorClick}>
        <EditorContent editor={editor} style={{ minHeight: '100%' }} />
      </div>
    </div>
  );
}
