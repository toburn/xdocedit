// toolbar.js
import { getSelection, clearSelection, setSelection } from './selection.js';
import { removeNode, ensureContentArray } from './model.js';
import { MODEL, refresh, DOCS, loadDoc, CURRENT_DOC } from './app.js';

export function initToolbar() {
    const bar = document.getElementById('toolbar');

    if (!bar) {
        console.error('Toolbar element not found');
        return;
    }

    // Toolbar HTML
    bar.innerHTML = `
        <select id="docSelect" data-tooltip="Select document"></select>
        <button id="saveDoc" data-tooltip="Save as...">💾</button>
        <button id="deleteDoc" data-tooltip="Delete document">🗑️</button>
        <button id="addChild" data-tooltip="Add child">+</button>
        <button id="removeNode" data-tooltip="Remove node">🗑</button>
        <span id="status" style="margin-left:10px;opacity:.7"></span>
        <button id="togglePanel" data-tooltip="Toggle Inspector & JSON Output">🛈</button>
    `;

    const status = bar.querySelector('#status');
    const docSelect = bar.querySelector('#docSelect');
    const saveBtn = bar.querySelector('#saveDoc');
    const deleteBtn = bar.querySelector('#deleteDoc');

    // ---- Populate doc dropdown ----
    function updateDocSelect() {
        docSelect.innerHTML = '';
        for (const name of Object.keys(DOCS)) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            if (name === CURRENT_DOC) opt.selected = true;
            docSelect.appendChild(opt);
        }
    }

    updateDocSelect();

    // ---- Doc selection ----
    docSelect.addEventListener('change', () => {
        const name = docSelect.value;
        loadDoc(name);

        // Auto-select root node for safety
        const rootId = MODEL.content?.id;
        if (rootId) {
            const rootEl = document.getElementById(rootId);
            if (rootEl) setSelection(rootEl);
        } else {
            clearSelection();
        }

        updateDocSelect();
    });

    // ---- Save As button ----
    saveBtn.addEventListener('click', () => {
        const name = prompt("Enter document name:", CURRENT_DOC || "");
        if (!name) return;

        CURRENT_DOC = name;
        MODEL.aname = name;

        // Ensure default properties exist
        if (!MODEL.puzzle) MODEL.puzzle = { pt: { left: 0, top: 0 } };
        if (!MODEL.classList) MODEL.classList = {};
        if (!MODEL.content) MODEL.content = { id: "root", pt: { left: 0, top: 0, width: 595, height: 842 }, no: {}, content: [] };

        DOCS[CURRENT_DOC] = MODEL;
        localStorage.setItem('jsonDomDocs', JSON.stringify(DOCS));

        updateDocSelect();
        status.textContent = `Saved as: ${CURRENT_DOC}`;
    });

    // ---- Delete button ----
    deleteBtn.addEventListener('click', () => {
        if (!CURRENT_DOC) return;
        const confirmDelete = confirm(`Delete document "${CURRENT_DOC}"?`);
        if (!confirmDelete) return;

        // Delete doc
        delete DOCS[CURRENT_DOC];
        localStorage.setItem('jsonDomDocs', JSON.stringify(DOCS));

        // Determine new current doc
        const names = Object.keys(DOCS);
        CURRENT_DOC = names[0] || null;

        if (CURRENT_DOC) {
            loadDoc(CURRENT_DOC);
            const rootId = MODEL.content?.id;
            if (rootId) {
                const rootEl = document.getElementById(rootId);
                if (rootEl) setSelection(rootEl);
            }
        } else {
            MODEL = {};
            refresh();
            clearSelection();
        }

        updateDocSelect();
        status.textContent = CURRENT_DOC
            ? `Deleted. Now showing: ${CURRENT_DOC}`
            : `Deleted. No documents left`;
    });

    // ---- Add child button ----
    bar.querySelector('#addChild').onclick = () => {
        const sel = getSelection();
        if (!sel) {
            status.textContent = 'No selection';
            return;
        }

        const parent = sel.__node;
        const arr = ensureContentArray(parent);

        arr.push({
            id: 'node_' + Math.random().toString(36).slice(2),
            pt: { left: 0, top: 0, width: 60, height: 30 },
            no: { position: 'absolute' },
            content: 'New'
        });

        refresh();
    };

    // ---- Remove selected node ----
    bar.querySelector('#removeNode').onclick = () => {
        const sel = getSelection();
        if (!sel) {
            status.textContent = 'No selection';
            return;
        }

        const success = removeNode(MODEL.content, sel.__node);
        if (!success) {
            status.textContent = 'Cannot remove this node';
            return;
        }

        refresh();
    };

    // ---- Toggle side panel ----
    const togglePanelBtn = bar.querySelector('#togglePanel');
    togglePanelBtn.addEventListener('click', () => {
        document.body.classList.toggle('side-panel-hidden');
    });

    // ---- Live status update ----
    setInterval(() => {
        const sel = getSelection();
        status.textContent = sel
            ? `Selected: ${sel.id || '(no id)'}`
            : `Document: ${CURRENT_DOC || '(none)'}`;
    }, 200);
}