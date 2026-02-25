import { getSelection, clearSelection, setSelection, onSelectionChange } from './selection.js';
import { removeNode, ensureContentArray } from './model.js';
import { MODEL, refresh, DOCS, loadDoc, CURRENT_DOC } from './app.js';
import { SettingsManager } from './settings.js';
import * as Layout from './layout.js';

// Helper to apply a layout function to the selected node
function withSelectedNode(fn) {
    const sel = getSelection();
    if (!sel || !Array.isArray(sel.__node.content)) return;
    fn(sel.__node);
    refresh();
}

export function initToolbar() {
    const bar = document.getElementById('toolbar');
    if (!bar) return;

    bar.innerHTML = `
        <select id="docSelect" data-tooltip="Select document"></select>
        <button id="saveDoc" data-tooltip="Save as...">💾</button>
        <button id="deleteDoc" data-tooltip="Delete document">🗑️</button>
        <button id="addChild" data-tooltip="Add child">+</button>
        <button id="removeNode" data-tooltip="Remove node">🗑</button>
        <button id="distributeHoriz" data-tooltip="Distribute children horizontally">⇔</button>
        <button id="distributeEdge" data-tooltip="Distribute children edge to edge">⇔|</button>
        <button id="distributeVert" data-tooltip="Distribute children vertically">⇕</button>
        <button id="distributeVertEdge" data-tooltip="Distribute children vertically edge to edge">⇕|</button>
        <button id="alignLeft" data-tooltip="Align left of children">⬅</button>
        <button id="alignTop" data-tooltip="Align top of children">⬆</button>
        <button id="duplicateNode" data-tooltip="Duplicate selected node">⎘</button>
        <label style="margin-left:10px; color: blanchedalmond">
            Zoom sensitivity
            <input type="range" id="zoomSensitivity" min="0.0005" max="0.01" step="0.0005">
        </label>
        <span id="status" style="margin-left:10px;opacity:.7;color: blanchedalmond"></span>
        <button id="togglePanel" data-tooltip="Toggle Inspector & JSON Output">🛈</button>
    `;

    const status = bar.querySelector('#status');
    const docSelect = bar.querySelector('#docSelect');
    const zoomInput = bar.querySelector('#zoomSensitivity');

    // ---- Initialize zoom slider ----
    zoomInput.value = SettingsManager.get('zoomSensitivity', 0.002);
    zoomInput.addEventListener('input', () => {
        SettingsManager.set('zoomSensitivity', parseFloat(zoomInput.value));
    });

    // ---- Update doc select ----
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

    // ---- Event listeners ----
    docSelect.addEventListener('change', () => {
        const name = docSelect.value;
        loadDoc(name);
        const rootEl = document.getElementById(MODEL.content?.id);
        if (rootEl) setSelection(rootEl);
        else clearSelection();
        updateDocSelect();
    });

    bar.querySelector('#saveDoc').addEventListener('click', async () => {
        const m = await import('./app.js');
        m.saveCurrentDoc();
        updateDocSelect();
        status.textContent = `Saved: ${CURRENT_DOC}`;
    });

    bar.querySelector('#deleteDoc').addEventListener('click', () => {
        if (!CURRENT_DOC) return;
        if (!confirm(`Delete document "${CURRENT_DOC}"?`)) return;
        delete DOCS[CURRENT_DOC];
        localStorage.setItem('jsonDomDocs', JSON.stringify(DOCS));
        CURRENT_DOC = Object.keys(DOCS)[0] || null;
        if (CURRENT_DOC) loadDoc(CURRENT_DOC);
        else MODEL = {};
        refresh();
        clearSelection();
        updateDocSelect();
        status.textContent = CURRENT_DOC
            ? `Deleted. Now showing: ${CURRENT_DOC}`
            : `Deleted. No documents left`;
    });

    bar.querySelector('#addChild').onclick = () => {
        const sel = getSelection();
        if (!sel) { status.textContent = 'No selection'; return; }
        const arr = ensureContentArray(sel.__node);
        arr.push({
            id: 'node_' + Math.random().toString(36).slice(2),
            pt: { left: 0, top: 0, width: 60, height: 30 },
            no: { position: 'absolute' },
            content: 'New'
        });
        refresh();
    };

    bar.querySelector('#removeNode').onclick = () => {
        const sel = getSelection();
        if (!sel) { status.textContent = 'No selection'; return; }
        const success = removeNode(MODEL.content, sel.__node);
        if (!success) { status.textContent = 'Cannot remove this node'; return; }
        refresh();
    };

    // ---- Distribute & Align ----
    bar.querySelector('#distributeHoriz').onclick = () => withSelectedNode(Layout.distributeChildrenHorizontally);
    bar.querySelector('#distributeEdge').onclick = () => withSelectedNode(Layout.distributeChildrenEdgeToEdge);
    bar.querySelector('#distributeVert').onclick = () => withSelectedNode(Layout.distributeChildrenVertically);
    bar.querySelector('#distributeVertEdge').onclick = () => withSelectedNode(Layout.distributeChildrenVerticallyEdgeToEdge);
    bar.querySelector('#alignLeft').onclick = () => withSelectedNode(Layout.alignLeftOfChildren);
    bar.querySelector('#alignTop').onclick = () => withSelectedNode(Layout.alignTop);

    // ---- Duplicate node ----
    bar.querySelector('#duplicateNode').onclick = () => {
        const sel = getSelection();
        if (!sel) { status.textContent = 'No selection'; return; }
        const parentEl = sel.parentElement;
        const parentNode = parentEl?.__node || MODEL.content;
        const arr = ensureContentArray(parentNode);
        const clone = JSON.parse(JSON.stringify(sel.__node));
        function regenerateIdsRecursively(n) {
            if (!n || typeof n !== 'object') return;
            if (n.id) n.id = n.id + '_copy_' + Math.random().toString(36).slice(2);
            const content = n.content;
            if (Array.isArray(content)) content.forEach(regenerateIdsRecursively);
            else if (content && typeof content === 'object') regenerateIdsRecursively(content);
        }
        regenerateIdsRecursively(clone);
        if (clone.pt) {
            clone.pt.left = (clone.pt.left || 0) + 10;
            clone.pt.top = (clone.pt.top || 0) + 10;
        }
        const index = arr.indexOf(sel.__node);
        arr.splice(index + 1, 0, clone);
        refresh();
        const clonedEl = Array.from(parentEl.children).find(c => c.__node === clone);
        if (clonedEl) setSelection(clonedEl);
    };

    bar.querySelector('#togglePanel').addEventListener('click', () => {
        document.body.classList.toggle('side-panel-hidden');
    });

    onSelectionChange(sel => {
        status.textContent = sel
            ? `Selected: ${sel.id || '(no id)'}`
            : `Document: ${CURRENT_DOC || '(none)'}`;
    });
}