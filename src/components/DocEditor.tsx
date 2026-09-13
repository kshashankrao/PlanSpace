import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import SearchAndReplace from '@sereneinserenade/tiptap-search-and-replace';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Image as ImageIcon, MoreVertical, CheckSquare, Share2, FileDown, FileText, Highlighter, Search, BookOpen } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { MathExtension } from '@aarkue/tiptap-math-extension';
import 'katex/dist/katex.min.css';

interface DocEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
}

const SmartTabExtension = Extension.create({
  name: 'smartTab',
  addKeyboardShortcuts() {
    return {
      'Tab': () => {
        if (this.editor.isActive('orderedList')) {
           const canSink = this.editor.can().sinkListItem('listItem');
           if (canSink) {
             const state = this.editor.state;
             const { $from } = state.selection;
             let prevItemHasList = false;
             
             try {
               let listItemDepth = -1;
               for (let d = $from.depth; d > 0; d--) {
                 if ($from.node(d).type.name === 'listItem') {
                   listItemDepth = d;
                   break;
                 }
               }
               
               if (listItemDepth > 0) {
                 const listDepth = listItemDepth - 1;
                 const listNode = $from.node(listDepth);
                 const index = $from.index(listDepth);
                 
                 if (index > 0) {
                   const prevItem = listNode.child(index - 1);
                   if (prevItem.childCount > 1) {
                     const lastChild = prevItem.lastChild;
                     if (lastChild?.type.name === 'orderedList' || lastChild?.type.name === 'bulletList') {
                       prevItemHasList = true;
                     }
                   }
                 }
               }
             } catch (err) {
               console.error("Error inspecting Prosemirror state:", err);
             }

             this.editor.commands.sinkListItem('listItem');

             if (!prevItemHasList && this.editor.isActive('orderedList')) {
               this.editor.commands.toggleList('bulletList', 'listItem');
             }
             return true; 
           }
        }
        return false;
      }
    };
  }
});

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
  const [showToc, setShowToc] = useState(false);
  const [modalType, setModalType] = useState<'task' | 'mindmap' | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false);
      setShowToc(false);
    };
    if (isMenuOpen || showToc) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen, showToc]);

  const getHeadings = () => {
    const headings: { text: string; level: number; pos: number }[] = [];
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        headings.push({
          text: node.textContent || 'Empty Heading',
          level: node.attrs.level,
          pos,
        });
      }
    });
    return headings;
  };

  const handleSelect = (id: string, title: string) => {
    const url = modalType === 'task' ? `#task-${id}` : `#mindmap-${id}`;
    editor.chain().focus().setLink({ href: url, target: '_self' }).insertContent(title).run();
  };

  const exportToPDF = () => {
    const element = document.querySelector('.tiptap-container .ProseMirror') as HTMLElement;
    if (element) {
      const opt: any = {
        margin:       0.5,
        filename:     'document.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  const exportToWord = () => {
    const element = document.querySelector('.tiptap-container .ProseMirror');
    if (element) {
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
      const footer = "</body></html>";
      const sourceHTML = header + element.innerHTML + footer;
      
      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = 'document.doc';
      fileDownload.click();
      document.body.removeChild(fileDownload);
    }
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

      {/* Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--n0)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0 8px', marginLeft: 'auto', gap: '4px' }}>
        <Search size={14} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Find..." 
          onChange={(e) => editor.commands.setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '120px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--n800)' }}
        />
      </div>

      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`toolbar-btn ${editor.isActive('highlight') ? 'active' : ''}`}
        title="Highlight"
        style={toolbarBtnStyle(editor.isActive('highlight'))}
      >
        <Highlighter size={18} />
      </button>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Text Color">
        <input
          type="color"
          onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          style={{
            width: '24px',
            height: '24px',
            padding: 0,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: 'transparent'
          }}
        />
      </div>
      
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
          onClick={(e) => { e.stopPropagation(); setShowToc(!showToc); setIsMenuOpen(false); }}
          className="toolbar-btn"
          title="Table of Contents"
          style={toolbarBtnStyle(false)}
        >
          <BookOpen size={18} />
        </button>
        {showToc && (
          <div 
            style={{ 
              position: 'absolute', top: '100%', left: 0, marginTop: '8px',
              backgroundColor: 'var(--n0)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius)', padding: '8px', minWidth: '250px',
              boxShadow: 'var(--shadow-dropdown)', zIndex: 100,
              maxHeight: '300px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '4px 8px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Table of Contents
            </div>
            {getHeadings().length === 0 ? (
              <div style={{ padding: '8px', color: 'var(--n500)', fontSize: '13px' }}>No headings found</div>
            ) : (
              getHeadings().map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    editor.commands.focus();
                    editor.commands.setTextSelection(h.pos);
                    // scroll into view
                    const view = editor.view;
                    const coords = view.coordsAtPos(h.pos);
                    window.scrollTo({ top: coords.top + window.scrollY - 100, behavior: 'smooth' });
                    setShowToc(false);
                  }}
                  className="dropdown-item"
                  style={{
                    padding: '6px 8px', paddingLeft: `${(h.level - 1) * 12 + 8}px`,
                    cursor: 'pointer', fontSize: '13px', color: 'var(--n800)',
                    borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}
                  title={h.text}
                >
                  {h.text}
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
            <button 
              onClick={(e) => { e.stopPropagation(); exportToPDF(); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <FileDown size={16} /> Export to PDF
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); exportToWord(); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <FileText size={16} /> Export to Word
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
      SmartTabExtension,
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      MathExtension.configure({ evaluation: true }),
      SearchAndReplace.configure({ searchResultClass: 'search-result' }),
      ImageResize.configure({
        inline: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'smart-reference',
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
        style: 'outline: none; min-height: 100%; font-size: 15px; line-height: 1.6; color: var(--text-primary);',
        spellcheck: 'true'
      },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement;
        const a = target.closest('a');
        if (a) {
          const href = a.getAttribute('href');
          if (href?.startsWith('#task-')) {
            event.preventDefault();
            const taskId = href.replace('#task-', '');
            db.tasks.get(taskId).then(task => {
              if (task) window.dispatchEvent(new CustomEvent('edit-task', { detail: task }));
            });
            return true;
          } else if (href?.startsWith('#mindmap-')) {
            event.preventDefault();
            const mindmapId = href.replace('#mindmap-', '');
            window.location.hash = `#/mindmap?map=${mindmapId}`;
            return true;
          }
        }
        return false;
      }
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden', backgroundColor: 'var(--n0)', boxShadow: 'var(--shadow-card)' }}>
      <MenuBar editor={editor} />
      <div 
        style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', cursor: 'text' }} 
        className="tiptap-container"
        onClick={() => editor?.commands.focus()}
        onKeyDown={(e) => {
          if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            if (e.key === '1') { e.preventDefault(); editor?.commands.toggleHeading({ level: 1 }); }
            else if (e.key === '2') { e.preventDefault(); editor?.commands.toggleHeading({ level: 2 }); }
            else if (e.key === '3') { e.preventDefault(); editor?.commands.toggleHeading({ level: 3 }); }
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
