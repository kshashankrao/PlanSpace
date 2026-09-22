import { useState, useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Extension, Node, mergeAttributes, InputRule } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import SearchAndReplace from '@sereneinserenade/tiptap-search-and-replace';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { 
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ListTodo,
  Heading1, Heading2, Heading3, TextQuote, Minus,
  Image as ImageIcon, Table as TableIcon,
  MoreVertical, CheckSquare, Share2, FileDown, FileText, Highlighter, Search, BookOpen, Network, FileImage, CalendarDays
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { MathExtension } from '@aarkue/tiptap-math-extension';
import 'katex/dist/katex.min.css';
import EmbeddedDiagramNodeComponent from './EmbeddedDiagramNode';

const EmbeddedDiagramNode = Node.create({
  name: 'embeddedDiagram',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      diagramId: { default: null },
      diagramType: { default: 'mindmap' },
      title: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="embedded-diagram"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'embedded-diagram' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(EmbeddedDiagramNodeComponent);
  },
});

const ReferenceNode = Node.create({
  name: 'reference',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      href: { default: null },
      title: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a.smart-reference',
        priority: 1000,
        getAttrs: (dom) => {
          if (typeof dom === 'string') return {};
          return {
            href: (dom as HTMLElement).getAttribute('href'),
            title: (dom as HTMLElement).textContent,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, { class: 'smart-reference', target: '_self' }),
      HTMLAttributes.title,
    ];
  },
});

const DateNode = Node.create({
  name: 'dateNode',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      date: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.date-badge',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return {};
          return {
            date: (dom as HTMLElement).getAttribute('data-date'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 
        class: 'date-badge', 
        'data-date': HTMLAttributes.date,
        style: 'display: inline-flex; align-items: center; gap: 4px; background-color: var(--n100); color: var(--n800); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: 500; user-select: none;'
      }),
      `📅 ${HTMLAttributes.date}`,
    ];
  },
});

interface DocEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  hideToolbar?: boolean;
  borderless?: boolean;
  onEditorReady?: (editor: any) => void;
  onFocus?: (editor: any) => void;
}

const TocComponent = (props: any) => {
  const getHeadings = () => {
    const headings: { text: string; level: number; pos: number }[] = [];
    props.editor.state.doc.descendants((node: any, pos: number) => {
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

  return (
    <NodeViewWrapper className="toc-node" contentEditable={false}>
      <div style={{ padding: '16px', backgroundColor: 'var(--n50)', border: '1px solid var(--n100)', borderRadius: '8px', margin: '16px 0', userSelect: 'none' }}>
        <h4 style={{ margin: '0 0 8px 0', textTransform: 'uppercase', fontSize: '12px', color: 'var(--n500)' }}>Table of Contents</h4>
        {getHeadings().length === 0 ? (
           <div style={{ color: 'var(--n400)', fontSize: '13px' }}>No headings found.</div>
        ) : (
          getHeadings().map((h, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.preventDefault();
                props.editor.commands.focus();
                props.editor.commands.setTextSelection(h.pos);
                const view = props.editor.view;
                const coords = view.coordsAtPos(h.pos);
                window.scrollTo({ top: coords.top + window.scrollY - 100, behavior: 'smooth' });
              }}
              style={{
                paddingLeft: `${(h.level - 1) * 16}px`,
                cursor: 'pointer',
                color: 'var(--b500)',
                textDecoration: 'underline',
                paddingTop: '4px',
                paddingBottom: '4px',
                fontSize: '14px'
              }}
            >
              {h.text}
            </div>
          ))
        )}
      </div>
    </NodeViewWrapper>
  );
};

const TocNode = Node.create({
  name: 'toc',
  group: 'block',
  atom: true,
  parseHTML() {
    return [{ tag: 'div[data-type="toc"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toc' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TocComponent);
  },
});


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

const getDisplayDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const MiniCalendar = ({ onSelect }: { onSelect: (date: string) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div style={{ padding: '8px', width: '250px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: '4px' }}>&lt;</button>
        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>
        <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: '4px' }}>&gt;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {days.map((day, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            {day ? (
              <button 
                onClick={() => {
                  const d = new Date(year, month, day);
                  const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  onSelect(formatted);
                }}
                style={{ 
                  width: '100%', padding: '6px 0', fontSize: '13px', 
                  background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--n100)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {day}
              </button>
            ) : <div />}
          </div>
        ))}
      </div>
    </div>
  );
};

const ReferenceModal = ({ 
  isOpen, 
  onClose, 
  type, 
  onSelect 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  type: 'task' | 'mindmap' | 'flowchart' | 'embed_mindmap' | 'embed_flowchart' | 'doc' | 'daily_note' | 'date_picker', 
  onSelect: (id: string, title: string) => void 
}) => {
  const [search, setSearch] = useState('');
  
  const items = useLiveQuery(async () => {
    if (type === 'task') {
      const tasks = await db.tasks.toArray();
      return tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())).map(t => ({ id: t.id, title: t.title }));
    } else if (type === 'mindmap' || type === 'embed_mindmap') {
      const maps = await db.mindMaps.toArray();
      return maps.filter(m => m.title.toLowerCase().includes(search.toLowerCase())).map(m => ({ id: m.id, title: m.title }));
    } else if (type === 'flowchart' || type === 'embed_flowchart') {
      const flowcharts = await db.flowcharts.toArray();
      return flowcharts.filter(f => f.title.toLowerCase().includes(search.toLowerCase())).map(f => ({ id: f.id, title: f.title }));
    } else if (type === 'doc') {
      const docs = await db.docs.toArray();
      return docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase())).map(d => ({ id: d.id, title: d.title }));
    } else if (type === 'daily_note') {
      const notes = await db.dailyNotes.toArray();
      return notes.filter(n => n.date.includes(search) || n.content.toLowerCase().includes(search.toLowerCase())).map(n => ({ id: n.date, title: getDisplayDate(n.date) }));
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
        {type === 'date_picker' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MiniCalendar 
              onSelect={(dateStr) => {
                const date = new Date(dateStr);
                const userDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                const formatted = userDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                onSelect('', formatted);
                onClose();
              }}
            />
          </div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 16px 0' }}>{type.includes('embed') ? 'Embed' : 'Link to'} {
              type.includes('task') ? 'Task' : 
              type.includes('mindmap') ? 'Mind Map' : 
              type === 'doc' ? 'Document' :
              type === 'daily_note' ? 'Daily Note' :
              'Flowchart'
            }</h3>
            <input 
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
              className="input-field"
              style={{ marginBottom: '16px' }}
            />
          </>
        )}
        {type !== 'date_picker' && (
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
              {type.includes('task') ? <CheckSquare size={16} color="var(--prio-medium)" /> : 
               type.includes('mindmap') ? <Network size={16} color="var(--prio-high)" /> : 
               type === 'doc' ? <FileText size={16} color="var(--prio-high)" /> :
               type === 'daily_note' ? <CalendarDays size={16} color="var(--prio-medium)" /> :
               <Share2 size={16} color="var(--prio-high)" />}
              {item.title}
            </button>
          ))}
            {items?.length === 0 && <div style={{ padding: '8px', color: 'var(--n500)', fontSize: '14px' }}>No matches found.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export const MenuBar = ({ editor }: { editor: any }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<'task' | 'mindmap' | 'flowchart' | 'embed_mindmap' | 'embed_flowchart' | 'doc' | 'daily_note' | 'date_picker' | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Listen for custom event to open reference modal from shortcuts
  useEffect(() => {
    const handleOpenModal = (e: any) => {
      setModalType(e.detail.type);
    };
    window.addEventListener('open-reference-modal', handleOpenModal);
    return () => window.removeEventListener('open-reference-modal', handleOpenModal);
  }, []);

  const handleSelect = (id: string, title: string) => {
    if (modalType === 'date_picker') {
      editor.chain().focus().insertContent({
        type: 'dateNode',
        attrs: { date: title }
      }).insertContent(' ').run();
    } else if (modalType?.startsWith('embed_')) {
      const diagramType = modalType === 'embed_mindmap' ? 'mindmap' : 'flowchart';
      editor.chain().focus().insertContent({
        type: 'embeddedDiagram',
        attrs: { diagramId: id, diagramType, title }
      }).run();
    } else {
      const url = modalType === 'task' ? `#task-${id}` : 
                  modalType === 'mindmap' ? `#mindmap-${id}` : 
                  modalType === 'doc' ? `#doc-${id}` :
                  modalType === 'daily_note' ? `#dailynote-${id}` :
                  `#flowchart-${id}`;
      editor.chain().focus().insertContent({
        type: 'reference',
        attrs: { href: url, title }
      }).insertContent(' ').run();
    }
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
    <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-board)', flexWrap: 'wrap' }}>
      
      {/* Group 1: Inline Styles */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`} title="Bold" style={toolbarBtnStyle(editor.isActive('bold'))}><Bold size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`} title="Italic" style={toolbarBtnStyle(editor.isActive('italic'))}><Italic size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`} title="Underline" style={toolbarBtnStyle(editor.isActive('underline'))}><UnderlineIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`} title="Strikethrough" style={toolbarBtnStyle(editor.isActive('strike'))}><Strikethrough size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`toolbar-btn ${editor.isActive('superscript') ? 'active' : ''}`} title="Superscript" style={toolbarBtnStyle(editor.isActive('superscript'))}><SuperscriptIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleSubscript().run()} className={`toolbar-btn ${editor.isActive('subscript') ? 'active' : ''}`} title="Subscript" style={toolbarBtnStyle(editor.isActive('subscript'))}><SubscriptIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`toolbar-btn ${editor.isActive('highlight') ? 'active' : ''}`} title="Highlight" style={toolbarBtnStyle(editor.isActive('highlight'))}><Highlighter size={18} /></button>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '4px' }} title="Text Color">
          <input type="color" onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()} value={editor.getAttributes('textStyle').color || '#000000'} style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }} />
        </div>
      </div>

      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

      {/* Group 2: Block Styles */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`} title="Heading 1" style={toolbarBtnStyle(editor.isActive('heading', { level: 1 }))}><Heading1 size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} title="Heading 2" style={toolbarBtnStyle(editor.isActive('heading', { level: 2 }))}><Heading2 size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`} title="Heading 3" style={toolbarBtnStyle(editor.isActive('heading', { level: 3 }))}><Heading3 size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`} title="Blockquote" style={toolbarBtnStyle(editor.isActive('blockquote'))}><TextQuote size={18} /></button>
      </div>

      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

      {/* Group 3: Alignment */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`} title="Align Left" style={toolbarBtnStyle(editor.isActive({ textAlign: 'left' }))}><AlignLeft size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`} title="Align Center" style={toolbarBtnStyle(editor.isActive({ textAlign: 'center' }))}><AlignCenter size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`} title="Align Right" style={toolbarBtnStyle(editor.isActive({ textAlign: 'right' }))}><AlignRight size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`} title="Justify" style={toolbarBtnStyle(editor.isActive({ textAlign: 'justify' }))}><AlignJustify size={18} /></button>
      </div>

      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

      {/* Group 4: Lists */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`} title="Bullet List" style={toolbarBtnStyle(editor.isActive('bulletList'))}><List size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`} title="Ordered List" style={toolbarBtnStyle(editor.isActive('orderedList'))}><ListOrdered size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`toolbar-btn ${editor.isActive('taskList') ? 'active' : ''}`} title="Task List" style={toolbarBtnStyle(editor.isActive('taskList'))}><ListTodo size={18} /></button>
      </div>

      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

      {/* Group 5: Inserts */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="toolbar-btn" title="Insert Table" style={toolbarBtnStyle(false)}><TableIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="toolbar-btn" title="Insert Divider" style={toolbarBtnStyle(false)}><Minus size={18} /></button>
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
        <button onClick={(e) => { e.stopPropagation(); editor.chain().focus().insertContent({ type: 'toc' }).run(); }} className="toolbar-btn" title="Insert Table of Contents" style={toolbarBtnStyle(false)}><BookOpen size={18} /></button>
      </div>

      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

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
            <button 
              onClick={(e) => { e.stopPropagation(); setModalType('flowchart'); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <Share2 size={16} /> Add reference to flowchart
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setModalType('doc'); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <FileText size={16} /> Add reference to document
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setModalType('daily_note'); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <CalendarDays size={16} /> Add reference to daily note
            </button>
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
            <button 
              onClick={(e) => { e.stopPropagation(); setModalType('embed_mindmap'); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <Network size={16} /> Embed mind map
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setModalType('embed_flowchart'); setIsMenuOpen(false); }}
              style={{ background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
              className="dropdown-item"
            >
              <FileImage size={16} /> Embed flowchart
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

export default function DocEditor({ initialContent, onUpdate, hideToolbar, borderless, onEditorReady, onFocus }: DocEditorProps) {
  const [showSearch, setShowSearch] = useState(false);
  
  const editor = useEditor({
    extensions: [
      SmartTabExtension,
      TocNode,
      EmbeddedDiagramNode,
      ReferenceNode,
      DateNode,
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      MathExtension.configure({ evaluation: true }),
      SearchAndReplace.configure({ searchResultClass: 'search-result' }),
      Extension.create({
        name: 'customShortcuts',
        addInputRules() {
          const createModalRule = (trigger: RegExp, type: string) => {
            return new InputRule({
              find: trigger,
              handler: ({ state, range, match }) => {
                // We use setTimeout to ensure the transaction completes before opening the modal,
                // preventing focus loss issues.
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('open-reference-modal', { detail: { type } }));
                }, 10);
                
                const fullMatch = match[0];
                const spaceMatch = fullMatch.match(/^\s/);
                // Delete the shortcut text, preserving any leading space
                if (spaceMatch) {
                  state.tr.delete(range.from + spaceMatch[0].length, range.to);
                } else {
                  state.tr.delete(range.from, range.to);
                }
              }
            });
          };

          return [
            createModalRule(/(?:^|\s)\/date$/, 'date_picker'),
            createModalRule(/(?:^|\s)\/task$/, 'task'),
            createModalRule(/(?:^|\s)\/docs$/, 'doc'),
            createModalRule(/(?:^|\s)\/mindmap$/, 'mindmap'),
            createModalRule(/(?:^|\s)\/flowchart$/, 'flowchart'),
            createModalRule(/(?:^|\s)\/dailynotes$/, 'daily_note'),
            createModalRule(/(?:^|\s)\/\/mindmap$/, 'embed_mindmap'),
            createModalRule(/(?:^|\s)\/\/flowchart$/, 'embed_flowchart')
          ];
        }
      }),
      ImageResize.configure({
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'smart-reference',
          target: '_self',
        }
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Superscript,
      Subscript
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onFocus: ({ editor }) => {
      if (onFocus) onFocus(editor);
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
          } else if (href?.startsWith('#flowchart-')) {
            event.preventDefault();
            const flowchartId = href.replace('#flowchart-', '');
            window.location.hash = `#/flowchart?map=${flowchartId}`;
            return true;
          } else if (href?.startsWith('#doc-')) {
            event.preventDefault();
            const docId = href.replace('#doc-', '');
            window.location.hash = `#/docs?id=${docId}`;
            return true;
          } else if (href?.startsWith('#dailynote-')) {
            event.preventDefault();
            const dateStr = href.replace('#dailynote-', '');
            window.location.hash = `#/daily-notes?date=${dateStr}`;
            return true;
          }
        }
        return false;
      }
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: borderless ? 'auto' : '100%', 
      border: borderless ? 'none' : '1px solid var(--border-color)', 
      borderRadius: borderless ? '0' : 'var(--radius)', 
      overflow: borderless ? 'visible' : 'hidden', 
      backgroundColor: 'var(--n0)', 
      boxShadow: borderless ? 'none' : 'var(--shadow-card)' 
    }}>
      {!hideToolbar && <MenuBar editor={editor} />}
      <div 
        style={{ flex: borderless ? 'none' : 1, overflowY: borderless ? 'visible' : 'auto', padding: borderless ? '0' : '32px 40px', cursor: 'text', position: 'relative' }} 
        className="tiptap-container"
        onClick={() => editor?.commands.focus()}
        onKeyDown={(e) => {
          if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            if (e.key === '1') { e.preventDefault(); editor?.commands.toggleHeading({ level: 1 }); }
            else if (e.key === '2') { e.preventDefault(); editor?.commands.toggleHeading({ level: 2 }); }
            else if (e.key === '3') { e.preventDefault(); editor?.commands.toggleHeading({ level: 3 }); }
            else if (e.key.toLowerCase() === 'f') { e.preventDefault(); setShowSearch(true); }
          }
        }}
      >
        {showSearch && (
          <div style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 50,
            display: 'flex', alignItems: 'center', backgroundColor: 'var(--n0)', 
            border: '1px solid var(--b400)', borderRadius: '4px', padding: '4px 8px', 
            boxShadow: 'var(--shadow-dropdown)', gap: '6px'
          }} onClick={e => e.stopPropagation()}>
            <Search size={16} color="var(--b500)" />
            <input 
              autoFocus
              type="text" 
              placeholder="Find in document..." 
              onChange={(e) => editor?.commands.setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSearch(false);
                  editor?.commands.setSearchTerm('');
                  editor?.commands.focus();
                }
              }}
              style={{ border: 'none', outline: 'none', width: '160px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--n800)' }}
            />
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
