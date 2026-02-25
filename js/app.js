import { render } from './renderer.js';
import { initToolbar } from './toolbar.js';
import { makeViewportZoomable } from './viewport.js';
import { initInspector } from './inspector.js';

export let MODEL = {};
export let DOCS = {};          // All loaded docs keyed by name
export let CURRENT_DOC = null; // Currently selected doc name

const editor = document.getElementById('editor');
const output = document.getElementById('output');
const LOCAL_KEY = 'jsonDomDocs';

// --- Render & persist current model ---
export function refresh() {
    editor.innerHTML = '';
    render(MODEL.content || {}, editor);

    // Highlight JSON nodes with spans
    const jsonText = JSON.stringify(MODEL, null, 2);

    const jsonWithSpans = jsonText.replace(
        /"id":\s*"([^"]+)"/g,
        (_, id) => `"id": "<span class='json-node' data-id='${id}'>${id}</span>"`
    );

    output.innerHTML = jsonWithSpans;
    if (CURRENT_DOC) {
        DOCS[CURRENT_DOC] = MODEL;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(DOCS));
    }
}

// --- Load all docs from localStorage ---
function loadFromStorage() {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
        try {
            DOCS = JSON.parse(stored);
        } catch (e) {
            console.error('Invalid JSON in localStorage', e);
            DOCS = {};
        }
    }
}

// --- Load a specific doc by name ---
export function loadDoc(name) {
    if (!DOCS[name]) return;
    CURRENT_DOC = name;
    MODEL = JSON.parse(JSON.stringify(DOCS[name])); // deep copy
    refresh();
}

// --- Save currently active doc ---
export function saveCurrentDoc() {
    // If no name or missing metadata, prompt
    if (!CURRENT_DOC || !MODEL.aname) {
        let name = prompt("Enter document name:", CURRENT_DOC || "");
        if (!name) return; // user cancelled
        CURRENT_DOC = name;
        MODEL.aname = name; // add metadata
        if (!MODEL.puzzle) MODEL.puzzle = { pt: { left: 0, top: 0 } }; // default puzzle position
        if (!MODEL.classList) MODEL.classList = {}; // default classList
        if (!MODEL.content) MODEL.content = { id: "root", pt: { left: 0, top: 0, width: 595, height: 842 }, no: {}, content: [] }; // default root content
    }

    DOCS[CURRENT_DOC] = MODEL;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(DOCS));
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
            CURRENT_DOC = null; // reset, so save will ask for name
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
        CURRENT_DOC = null; // reset, so save will ask for name
        refresh();
    } catch (err) {
        // ignore non-JSON pastes
    }
}

// --- Clear model ---
function clearModel() {
    MODEL = {};
    if (CURRENT_DOC) delete DOCS[CURRENT_DOC];
    CURRENT_DOC = null;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(DOCS));
    refresh();
}

// --- Inspector helper ---
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

    // Auto-load first doc if available
    const firstDoc = Object.keys(DOCS)[0];
    if (firstDoc) loadDoc(firstDoc);

    refresh();

    makeViewportZoomable('editor', 'editor-viewport');

    // Drag & drop
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', handleDrop);

    // Paste
    document.addEventListener('paste', handlePaste);

    // Output toolbar
    const outputToolbar = document.createElement('div');
    outputToolbar.id = "output-toolbar";
    output.appendChild(outputToolbar);

    // Clear button
    const btnClear = document.createElement('button');
    btnClear.dataset.tooltip = "Clear";
    btnClear.onclick = clearModel;
    outputToolbar.appendChild(btnClear);

    // Copy JSON button
    const btnCopy = document.createElement('button');
    btnCopy.dataset.tooltip = "Copy to clipboard";
    btnCopy.onclick = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(MODEL, null, 2));
            btnCopy.textContent = 'Copied!';
            setTimeout(() => btnCopy.textContent = '⎘', 1000);
        } catch (err) {
            alert('Failed to copy JSON: ' + err);
        }
    };

    btnClear.className = 'fixed-button clear';
    btnClear.textContent = '✖';

    btnCopy.className = 'fixed-button copy';
    btnCopy.textContent = '⎘';

    outputToolbar.appendChild(btnCopy);
});