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
export function refresh() {
    editor.innerHTML = '';
    render(MODEL.content || {}, editor);
    output.textContent = JSON.stringify(MODEL, null, 2);
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

// --- Initialize app ---
window.addEventListener('DOMContentLoaded', () => {
    initToolbar();
    initInspector();       // <--- inspector added here
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
