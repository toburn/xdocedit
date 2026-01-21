# JSON Layout Editor

A small, browser-based visual editor that lets you **build and manipulate a JSON-based layout model** by directly interacting with rendered DOM nodes.

The editor renders a JSON structure as absolutely positioned elements, allows selection, dragging, zooming and panning, and keeps the JSON model in sync in real time.

---

## Features

- Visual rendering of a JSON layout model
- Click to select elements
- Drag elements to reposition them
- Zoom and pan the editor canvas
- Add and remove child nodes
- Inspector panel for editing selected element properties
- Inline text editing for content-editable nodes
- Live JSON output preview
- Persist model in `localStorage`
- Import JSON via drag & drop or paste

---

## Project Structure

```
.  
├── index.html  
├── css/  
│   ├── editor.css       # Editor canvas & selection styling  
│   ├── inspector.css    # Inspector panel styling  
│   ├── toolbar.css      # Toolbar layout  
│   └── output.css       # JSON output panel styling  
└── js/  
    ├── app.js           # App bootstrap, state, persistence  
    ├── renderer.js      # Render JSON nodes into DOM  
    ├── interaction.js   # Selection and dragging logic  
    ├── selection.js     # Selection state handling  
    ├── inspector.js     # Inspector UI & property editing  
    ├── model.js         # JSON model manipulation helpers  
    ├── styles.js        # Apply JSON-defined styles to DOM  
    ├── toolbar.js       # UI toolbar actions  
    └── viewport.js      # Zoom & pan behavior  
```

---

## How It Works

### JSON Model

The editor operates on a single JSON object (`MODEL`) with this general shape:

```js
{
  content: {
    id: "root",
    pt: { left: 10, top: 10, width: 100, height: 40 },
    no: { position: "absolute" },
    content: "Hello"
  },
  classList: {
    // optional shared styles
  }
}
```

Key concepts:
- `content` can be:
    - a string (text)
    - a single child node
    - an array of child nodes
- `pt` = positional / dimensional styles (numbers → px)
- `no` = non-positional styles
- `cls` = reference to shared styles in `MODEL.classList`

---

### Rendering

- Each node is rendered as a `<div class="node">`
- All nodes are positioned absolutely by default
- Styles are derived from JSON via `styles.js`
- Nested content produces nested DOM elements
- Each DOM node keeps a reference to its JSON node via `el.__node`

---

### Interaction

- **Click** a node to select it
- **Drag** a node to update its `pt.left` / `pt.top`
- **Scroll** to zoom the canvas
- **Space + drag** to pan the canvas
- **Edit text** if `contenteditable` is enabled on the node
- Selection state is reflected visually with an editor-style outline

---

### Inspector Panel

The Inspector panel displays and edits properties of the currently selected element.

Currently editable:
- `id`
- Position: `left`, `top`
- Size: `width`, `height`
- Text content (for string-based nodes)

All changes update the JSON model immediately and trigger a re-render.

---

### Toolbar

The bottom toolbar allows you to:
- ➕ Add a child node to the selected element
- 🗑 Remove the selected node (if removable)
- See live selection status

---

### Persistence & Import

- The model is automatically saved to `localStorage`
- Reloading the page restores the last state
- You can:
    - **Drag & drop** a `.json` file onto the page
    - **Paste** valid JSON from the clipboard
- A **Clear** button resets the model and storage

---

## Running the Project

No build step required.

Just open `index.html` in a modern browser:

```bash
open index.html
```

Or serve it via a simple local server if needed.

---

## Status

This project is currently a **prototype / experimental editor**.

Things not yet implemented:
- Schema validation
- Undo / redo
- Keyboard shortcuts
- Resizable elements
- Export / import UI (beyond drag & paste)

---

## Goals / Next Steps (Ideas)

- Define a formal JSON schema
- Add resize handles
- Improve class/style management UI
- Add keyboard navigation
- Export rendered HTML/CSS

---

## License

Unlicensed / experimental — do whatever you want with it.
