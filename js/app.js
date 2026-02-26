import { render } from './renderer.js';
import { initToolbar } from './toolbar.js';
import { makeViewportZoomable } from './viewport.js';
import { initInspector } from './inspector.js';
import { getSelection, setSelection } from './selection.js';

export let MODEL = {};
export let DOCS = {};
export let CURRENT_DOC = null;

const editor = document.getElementById('editor');
const output = document.getElementById('output');
const outputToolbar = document.getElementById('output-toolbar');
const LOCAL_KEY = 'jsonDomDocs';

// --- Render & persist ---
export function refresh() {
    const prevSelectedEl = getSelection();
    const prevSelectedId = prevSelectedEl?.id;

    editor.innerHTML = '';
    render(MODEL.content || {}, editor);

    const jsonText = JSON.stringify(MODEL, null, 2);
    const jsonWithSpans = jsonText.replace(
        /"id":\s*"([^"]+)"/g,
        (_, id) => `"id": "<span class='json-node' data-id='${id}'>${id}</span>"`
    );
    output.innerHTML = jsonWithSpans;

    if (prevSelectedId) {
        const newSelectedEl = document.getElementById(prevSelectedId);
        if (newSelectedEl) setSelection(newSelectedEl);
    }

    if (CURRENT_DOC) {
        DOCS[CURRENT_DOC] = MODEL;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(DOCS));
    }
}

// --- Load all docs ---
function loadFromStorage() {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
        try { DOCS = JSON.parse(stored); }
        catch(e) { console.error('Invalid JSON', e); DOCS={}; }
    }
}

// --- Load a doc ---
export function loadDoc(name) {
    if (!DOCS[name]) return;
    CURRENT_DOC = name;
    MODEL = JSON.parse(JSON.stringify(DOCS[name]));
    refresh();
}

// --- Save current doc ---
export function saveCurrentDoc() {
    if (!CURRENT_DOC || !MODEL.aname) {
        let name = prompt("Enter document name:", CURRENT_DOC || "");
        if (!name) return;
        CURRENT_DOC = name;
        MODEL.aname = name;
        if (!MODEL.puzzle) MODEL.puzzle = { pt: { left:0, top:0 } };
        if (!MODEL.classList) MODEL.classList = {};
        if (!MODEL.content) MODEL.content = { id:"root", pt:{left:0,top:0,width:595,height:842}, no:{}, content:[] };
    }
    DOCS[CURRENT_DOC] = MODEL;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(DOCS));
}

// --- Drag & Drop ---
function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try { MODEL = JSON.parse(reader.result); CURRENT_DOC=null; refresh(); }
        catch { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
}

// --- Paste ---
function handlePaste(e) {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    try { MODEL = JSON.parse(text); CURRENT_DOC=null; refresh(); } catch{}
}

// --- Clear model ---
function clearModel() {
    MODEL = {};
    if (CURRENT_DOC) delete DOCS[CURRENT_DOC];
    CURRENT_DOC = null;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(DOCS));
    refresh();
}

// --- Scroll JSON to selection ---
function scrollJsonToSelection(node) {
    if (!node?.id) return;
    const el = document.querySelector(`#output .json-node[data-id="${node.id}"]`);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
}

// --- Initialize app ---
window.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initToolbar();
    initInspector(
        node => {
            const jsonText = JSON.stringify(MODEL,null,2);
            const jsonWithSpans = jsonText.replace(
                /"id":\s*"([^"]+)"/g,
                (_, id) => `"id": "<span class='json-node' data-id='${id}'>${id}</span>"`
            );
            output.innerHTML = jsonWithSpans;
            saveCurrentDoc();
        },
        scrollJsonToSelection
    );

    const firstDoc = Object.keys(DOCS)[0];
    if (firstDoc) loadDoc(firstDoc);

    refresh();
    makeViewportZoomable('editor','editor-viewport');

    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', handleDrop);
    document.addEventListener('paste', handlePaste);

    // ---- JSON output toolbar buttons ----
    const btnClear = document.createElement('button');
    btnClear.dataset.tooltip = "Clear JSON";
    btnClear.className = 'fixed-button clear';
    btnClear.textContent = '✖';
    btnClear.onclick = clearModel;
    outputToolbar.appendChild(btnClear);

    const btnCopy = document.createElement('button');
    btnCopy.dataset.tooltip = "Copy JSON";
    btnCopy.className = 'fixed-button copy';
    btnCopy.textContent = '⎘';
    btnCopy.onclick = async () => {
        try {
            await navigator.clipboard.writeText(output.textContent);
            btnCopy.textContent = 'Copied!';
            setTimeout(()=>btnCopy.textContent='⎘',1000);
        } catch(err) { alert('Failed to copy JSON: '+err); }
    };
    outputToolbar.appendChild(btnCopy);
});