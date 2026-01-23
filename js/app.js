// app.js
import { render } from './renderer.js';
import { initToolbar } from './toolbar.js';
import { makeViewportZoomable } from './viewport.js';
import { initInspector } from './inspector.js';

export let MODEL = {};

const editor = document.getElementById('editor');
const output = document.getElementById('output');
const LOCAL_KEY = 'jsonDomModel';

// --- Render & persist ---
// app.js
export function refresh() {
    editor.innerHTML = '';
    render(MODEL.content || {}, editor);

    // Highlight JSON nodes with spans
    const jsonText = JSON.stringify(MODEL, null, 2);

    // Wrap all "id": "someId" occurrences with span
    const jsonWithSpans = jsonText.replace(
        /"id":\s*"([^"]+)"/g,
        (_, id) => `"id": "<span class='json-node' data-id='${id}'>${id}</span>"`
    );

    output.innerHTML = jsonWithSpans;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(MODEL));
}


// --- Load model from localStorage ---
function loadFromStorage() {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
        try {
            MODEL = JSON.parse(stored);
        } catch (e) {
            console.error('Invalid JSON in localStorage', e);
        }
    }
}

// --- Drag & drop JSON file ---
function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            MODEL = JSON.parse(reader.result);
            refresh();
        } catch (err) {
            alert('Invalid JSON file');
        }
    };
    reader.readAsText(file);
}

// --- Paste JSON from clipboard ---
function handlePaste(e) {
    const text = e.clipboardData.getData('text');
    if (!text) return;

    try {
        MODEL = JSON.parse(text);
        refresh();
    } catch (err) {
        // Ignore non-JSON pastes
    }
}

// --- Clear model ---
function clearModel() {
    MODEL = {};
    localStorage.removeItem(LOCAL_KEY);
    refresh();
}

// --- Inspector ---
function scrollJsonToSelection(node) {
    if (!node?.id) return;

    const el = document.querySelector(`#output .json-node[data-id="${node.id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}



// --- Initialize app ---
window.addEventListener('DOMContentLoaded', () => {
    initToolbar();

    initInspector(
        () => {
            refresh(); // re-render editor and JSON output
        },
        scrollJsonToSelection
    );

    loadFromStorage();
    refresh();

    makeViewportZoomable('editor', 'editor-viewport');

    // Drag & drop
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', handleDrop);

    // Paste
    document.addEventListener('paste', handlePaste);

    // Clear button
    const btn = document.createElement('button');
    btn.textContent = 'Clear';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.right = '10px';
    btn.onclick = clearModel;
    document.body.appendChild(btn);
});
