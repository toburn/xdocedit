// app.js
import { render } from './renderer.js';
import { initToolbar } from './toolbar.js';
import { makeViewportZoomable } from './viewport.js';


function refreshWrapper() {
    editor.innerHTML = '';
    render(MODEL.content || {}, editor);
    output.textContent = JSON.stringify(MODEL, null, 2);
    localStorage.setItem('jsonDomModel', JSON.stringify(MODEL));
}




export let MODEL = {}; // Your layout JSON

const editor = document.getElementById('editor');
const output = document.getElementById('output');
const LOCAL_KEY = 'jsonDomModel';

// Render editor and output
export function refresh() {
    editor.innerHTML = '';
    render(MODEL.content || {}, editor);
    output.textContent = JSON.stringify(MODEL, null, 2);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(MODEL));
}

// Load MODEL from localStorage if available
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

// Handle drag & drop JSON files
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

// Handle paste JSON from clipboard
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

// Clear the model
function clearModel() {
    MODEL = {};
    localStorage.removeItem(LOCAL_KEY);
    refresh();
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    initToolbar();
    loadFromStorage();
    refresh();

    // Zoom & pan
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

