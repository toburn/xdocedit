// app.js
import { render } from './renderer.js';
import { initToolbar } from './toolbar.js';
import { makeViewportZoomable } from './viewport.js';
import { initInspector } from './inspector.js';

export let MODEL = {};

const editor = document.getElementById('editor');
const output = document.getElementById('output');
const LOCAL_KEY = 'jsonDomModel';

export function refresh() {
    editor.innerHTML = '';
    render(MODEL.content || {}, editor);
    output.textContent = JSON.stringify(MODEL, null, 2);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(MODEL));
}

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

window.addEventListener('DOMContentLoaded', () => {
    initToolbar();
    initInspector();
    loadFromStorage();
    refresh();

    makeViewportZoomable('editor', 'editor-viewport');
});
