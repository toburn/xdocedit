import { getSelection } from './selection.js';
import { removeNode, ensureContentArray } from './model.js';
import { MODEL, refresh, DOCS, loadDoc, saveCurrentDoc, CURRENT_DOC } from './app.js';

export function initToolbar() {
    const bar = document.getElementById('toolbar');

    if (!bar) {
        console.error('Toolbar element not found');
        return;
    }

    // Toolbar HTML
    bar.innerHTML = `
    <select id="docSelect" data-tooltip="Select document"></select>
    <button id="saveDoc" data-tooltip="Save document">💾</button>
    <button id="addChild" data-tooltip="Add child">+</button>
    <button id="removeNode" data-tooltip="Remove node">🗑</button>
    <span id="status" style="margin-left:10px;opacity:.7"></span>
    <button id="togglePanel" data-tooltip="Toggle Inspector & JSON Output">🛈</button>
`;

    const status = bar.querySelector('#status');
    const docSelect = bar.querySelector('#docSelect');
    const saveBtn = bar.querySelector('#saveDoc');

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

    docSelect.addEventListener('change', () => {
        const name = docSelect.value;
        loadDoc(name);
        updateDocSelect();
    });

    // ---- Save button ----
    saveBtn.addEventListener('click', () => {
        saveCurrentDoc();
        updateDocSelect();
        if (CURRENT_DOC) status.textContent = `Saved: ${CURRENT_DOC}`;
    });

    // Add child button
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

    // Remove selected node
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

    // Toggle side panel
    const togglePanelBtn = bar.querySelector('#togglePanel');
    togglePanelBtn.addEventListener('click', () => {
        document.body.classList.toggle('side-panel-hidden');
    });

    // Live status update
    setInterval(() => {
        const sel = getSelection();
        status.textContent = sel
            ? `Selected: ${sel.id || '(no id)'}`
            : `Document: ${CURRENT_DOC || '(none)'}`;
    }, 200);
}