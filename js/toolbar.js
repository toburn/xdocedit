// toolbar.js
import { getSelection, clearSelection, setSelection } from './selection.js';
import { removeNode, ensureContentArray } from './model.js';
import { MODEL, refresh, DOCS, loadDoc, CURRENT_DOC } from './app.js';

// ---- Distribute children horizontally ----
function distributeChildrenHorizontally(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;
    children.sort((a, b) => (a.pt.left || 0) - (b.pt.left || 0));
    const leftMost = children[0].pt.left || 0;
    const rightMost = children[children.length - 1].pt.left + (children[children.length - 1].pt.width || 0);
    const totalWidth = rightMost - leftMost;
    const totalChildrenWidth = children.reduce((sum, c) => sum + (c.pt.width || 0), 0);
    const spacing = (totalWidth - totalChildrenWidth) / (children.length - 1);
    let currentX = leftMost;
    children.forEach(c => {
        c.pt.left = currentX;
        currentX += (c.pt.width || 0) + spacing;
    });
}

function distributeChildrenEdgeToEdge(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;
    children.sort((a, b) => (a.pt.left || 0) - (b.pt.left || 0));
    const parentWidth = parentNode.pt?.width || 0;
    const leftChild = children[0];
    const rightChild = children[children.length - 1];
    leftChild.pt.left = 0;
    rightChild.pt.left = parentWidth - (rightChild.pt.width || 0);
    const remainingChildren = children.slice(1, -1);
    const totalRemainingWidth = remainingChildren.reduce((sum, c) => sum + (c.pt.width || 0), 0);
    const spaceBetween = (rightChild.pt.left - (leftChild.pt.left + (leftChild.pt.width || 0)) - totalRemainingWidth);
    const spacing = remainingChildren.length > 0 ? spaceBetween / (remainingChildren.length + 1) : 0;
    let currentX = leftChild.pt.left + (leftChild.pt.width || 0) + spacing;
    remainingChildren.forEach(c => {
        c.pt.left = currentX;
        currentX += (c.pt.width || 0) + spacing;
    });
}

// ---- Align top of children ----
function alignTop(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length === 0) return;
    const leftmostChild = children.reduce((min, c) => (c.pt.left || 0) < (min.pt.left || 0) ? c : min, children[0]);
    const top = leftmostChild.pt.top || 0;
    children.forEach(c => c.pt.top = top);
}

// ---- Clone node recursively ----
function cloneNode(node) {
    const copy = JSON.parse(JSON.stringify(node));
    copy.id = copy.id + '_copy_' + Math.random().toString(36).slice(2);
    // Offset slightly to the right
    if (copy.pt) copy.pt.left = (copy.pt.left || 0) + 10;
    return copy;
}

// ---- Init toolbar ----
export function initToolbar() {
    const bar = document.getElementById('toolbar');
    if (!bar) return;

    // All buttons in innerHTML
    bar.innerHTML = `
        <select id="docSelect" data-tooltip="Select document"></select>
        <button id="saveDoc" data-tooltip="Save as...">💾</button>
        <button id="deleteDoc" data-tooltip="Delete document">🗑️</button>
        <button id="addChild" data-tooltip="Add child">+</button>
        <button id="removeNode" data-tooltip="Remove node">🗑</button>
        <button id="distributeHoriz" data-tooltip="Distribute children horizontally">⇔</button>
        <button id="distributeEdge" data-tooltip="Distribute children edge to edge">⇔|</button>
        <button id="alignTop" data-tooltip="Align top of children">⬆</button>
        <button id="duplicateNode" data-tooltip="Duplicate selected node">⎘</button>
        <button id="togglePanel" data-tooltip="Toggle Inspector & JSON Output">🛈</button>
        <span id="status" style="margin-left:10px;opacity:.7"></span>
    `;

    const status = bar.querySelector('#status');
    const docSelect = bar.querySelector('#docSelect');

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
        const rootId = MODEL.content?.id;
        if (rootId) {
            const rootEl = document.getElementById(rootId);
            if (rootEl) setSelection(rootEl);
        } else {
            clearSelection();
        }
        updateDocSelect();
    });

    // ---- Save ----
    bar.querySelector('#saveDoc').addEventListener('click', () => {
        import('./app.js').then(m => {
            m.saveCurrentDoc();
            updateDocSelect();
            if (CURRENT_DOC) status.textContent = `Saved: ${CURRENT_DOC}`;
        });
    });

    // ---- Delete ----
    bar.querySelector('#deleteDoc').addEventListener('click', () => {
        if (!CURRENT_DOC) return;
        const confirmDelete = confirm(`Delete document "${CURRENT_DOC}"?`);
        if (!confirmDelete) return;
        delete DOCS[CURRENT_DOC];
        localStorage.setItem('jsonDomDocs', JSON.stringify(DOCS));
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

    // ---- Add child ----
    bar.querySelector('#addChild').onclick = () => {
        const sel = getSelection();
        if (!sel) { status.textContent = 'No selection'; return; }
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

    // ---- Remove node ----
    bar.querySelector('#removeNode').onclick = () => {
        const sel = getSelection();
        if (!sel) { status.textContent = 'No selection'; return; }
        const success = removeNode(MODEL.content, sel.__node);
        if (!success) { status.textContent = 'Cannot remove this node'; return; }
        refresh();
    };

    // ---- Distribute & Align ----
    bar.querySelector('#distributeHoriz').onclick = () => {
        const sel = getSelection();
        if (!sel || !Array.isArray(sel.__node.content)) return;
        distributeChildrenHorizontally(sel.__node);
        refresh();
    };
    bar.querySelector('#distributeEdge').onclick = () => {
        const sel = getSelection();
        if (!sel || !Array.isArray(sel.__node.content)) return;
        distributeChildrenEdgeToEdge(sel.__node);
        refresh();
    };
    bar.querySelector('#alignTop').onclick = () => {
        const sel = getSelection();
        if (!sel || !Array.isArray(sel.__node.content)) return;
        alignTop(sel.__node);
        refresh();
    };

    // ---- Duplicate node ----
    bar.querySelector('#duplicateNode').onclick = () => {
        const sel = getSelection();
        if (!sel) { status.textContent = 'No selection'; return; }
        const parentEl = sel.parentElement;
        const parentNode = parentEl?.__node || MODEL.content;
        const arr = ensureContentArray(parentNode);
        const clone = cloneNode(sel.__node);
        const index = arr.indexOf(sel.__node);
        arr.splice(index + 1, 0, clone);
        refresh();
        // Select newly duplicated node
        const clonedEl = Array.from(parentEl.children).find(c => c.__node === clone);
        if (clonedEl) setSelection(clonedEl);
    };

    // ---- Toggle panel ----
    bar.querySelector('#togglePanel').addEventListener('click', () => {
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