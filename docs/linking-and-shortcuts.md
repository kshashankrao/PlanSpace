# Cross-Linking, Keyboard Shortcuts & Data Management

← [Back to Main README](../README.md)

PlanSpace is designed around **zero-friction navigation** and **bi-directional linking** so you can move seamlessly between brainstorming, documentation, and sprint execution.

---

## 1. Global `Ctrl+K` Command Palette

Press **`Ctrl+K`** (or **`Cmd+K`** on macOS, or click **`Search or jump to...`** in the top window titlebar) from anywhere in the app to open the **Command Palette**.

### What You Can Do from `Ctrl+K`
- **Instant Search & Jump**: Type any keyword or task ID (`TSK-...`) to filter across all **Tasks**, **Docs**, **Mind Maps**, **Flowcharts**, and **Daily Notes**, then press `Enter` to open the item immediately.
- **Instant Task Creation**: Type any text in `Ctrl+K` and select **`+ Quick create task "..."`** to add a task directly to your Backlog without leaving your current view.
- **Quick View Switching**: Jump straight to the Kanban Board, Backlog, Gantt Timeline, Mind Maps, Flowcharts, Docs, or Today's Daily Note.

---

## 2. Cross-Component Linking Matrix

Every component in PlanSpace can link to or embed other components:

| From → To | **Tasks** | **Docs & Daily Notes** | **Mind Maps** | **Flowcharts** |
| :--- | :--- | :--- | :--- | :--- |
| **From a Mind Map** | Click `☑️` on any node to convert it to a Task, or click **`Add to Doc / Task`** in the header to attach the whole map to a Task. | Click **`Add to Doc / Task`** in the header to embed the Mind Map into an existing Doc or create a new Doc. | — | Link both in the same Doc or Task. |
| **From a Flowchart** | Click `☑️` on any step to convert it to a Task, or click **`Add to Doc / Task`** in the header to attach the flowchart to a Task. | Click **`Add to Doc / Task`** in the header to embed the Flowchart into an existing Doc or create a new Doc. | Link both in the same Doc or Task. | — |
| **From a Doc / Daily Note** | Type `/task` or click **`Link` → `Link Task`** to insert a clickable task pill (`☑️`) that opens the Task Modal. | Type `/docs` or `/dailynotes` (or use **`Link`**) to insert a clickable page/date pill. | Type `//mindmap` or click **`Embed Diagram`** for a live card, or `/mindmap` for a pill link. | Type `//flowchart` or click **`Embed Diagram`** for a live card, or `/flowchart` for a pill link. |
| **From a Task (`TaskModal`)** | — | Click **`+ Link`** → select a **Document**, then click `↗` to open it. | Click **`+ Link`** → select a **Mind Map**, then click `👁` to preview or `↗` to edit. | Click **`+ Link`** → select a **Flowchart**, then click `👁` to preview or `↗` to edit. |

---

## 3. Keyboard Shortcuts Reference

### Global Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Global Command Palette & Quick Search |
| `Escape` | Close active modal, dropdown, or command palette |

### Mind Map Canvas Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Tab` / `Insert` | Create a **Child Idea** from the selected node (works while editing or when selected) |
| `Enter` | Save label (when editing) or create a **Sibling Idea** (when a node is selected) |
| `Double-Click Canvas` | Create a new connected idea at the cursor position |
| `Double-Click Node` / `F2` | Edit the selected node's label inline |
| `Delete` / `Backspace` | Delete the selected node and all of its descendant nodes |

### Flowchart Canvas Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Tab` (while editing) | Save current step label and spawn + focus the next connected step |
| `Enter` (while editing) | Save step label (`Shift + Enter` inserts a line break) |
| `Double-Click Canvas` | Create a new step at the cursor position |
| `Double-Click Node` | Edit step label inline |
| `Double-Click Connector` | Edit connector label (`Yes`, `No`, etc.) |
| `Right-Click Connector` | Open Connector Options menu (Edit Label, Reverse Direction, Double Arrow, Delete) |
| `Alt + Drag Node` | Snap-connect dragged node to the nearest step within range |
| `Delete` / `Backspace` | Delete selected step(s) or connector(s) |

### Docs & Daily Notes Editor Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `/` | Open interactive Slash Command menu (`↑`/`↓` to navigate, `Enter` to insert) |
| `//mindmap` / `//flowchart` | Embed a live interactive Mind Map or Flowchart card |
| `/task`, `/docs`, `/mindmap`, `/flowchart`, `/dailynotes`, `/date` | Insert an inline smart reference pill or date badge |
| `Ctrl + 1` / `2` / `3` | Toggle Heading 1, Heading 2, or Heading 3 |
| `Ctrl + B` / `I` / `U` | Toggle Bold, Italic, or Underline |
| `Ctrl + F` | Find text inside the current document |
| `F2` (in Docs view) | Rename the currently active document |

---

## 4. Local Database Backup & Restore (`Settings`)

All PlanSpace data is stored locally in your desktop app's IndexedDB database (`TaskAppDatabase`).

To back up or migrate your workspace:
1. Click the **Settings (`⚙`)** icon at the bottom of the left navigation sidebar.
2. Click **`Export to JSON`** to download a complete snapshot (`planspace-backup-YYYY-MM-DD.json`) of your Tasks, Sprints, Mind Maps, Flowcharts, Docs, Comments, and Daily Notes.
3. Click **`Import from JSON`** to restore a backup file into PlanSpace.
