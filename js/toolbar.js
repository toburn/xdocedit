// toolbar.js
import { getSelection, clearSelection, setSelection } from './selection.js';
import { removeNode, ensureContentArray } from './model.js';
import { MODEL, refresh, DOCS, loadDoc, CURRENT_DOC } from './app.js';

// ---- Distribute children horizontally ----
function distributeChildrenEdgeToEdge(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;

    // Sort children left to right
    children.sort((a, b) => (a.pt.left || 0) - (b.pt.left || 0));

    const parentWidth = parentNode.pt?.width || 0;

    // Leftmost and rightmost children
    const leftChild = children[0];
    const rightChild = children[children.length - 1];

    // Move leftmost to parent's left
    leftChild.pt.left = 0;

    // Move rightmost to parent's right
    rightChild.pt.left = parentWidth - (rightChild.pt.width || 0);

    // Space available for the remaining children
    const remainingChildren = children.slice(1, -1);
    const totalRemainingWidth = remainingChildren.reduce((sum, c) => sum + (c.pt.width || 0), 0);
    const spaceBetween = (rightChild.pt.left - (leftChild.pt.left + (leftChild.pt.width || 0)) - totalRemainingWidth);
    const spacing = remainingChildren.length > 0 ? spaceBetween / (remainingChildren.length + 1) : 0;

    // Position remaining children
    let currentX = leftChild.pt.left + (leftChild.pt.width || 0) + spacing;
    remainingChildren.forEach(c => {
        c.pt.left = currentX;
        currentX += (c.pt.width || 0) + spacing;
    });
}

function distributeChildrenHorizontally(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;

    // Sort children by left
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

// ---- Align top of children ----
function alignTop(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length === 0) return;

    // Use top of leftmost child
    const leftmostChild = children.reduce((min, c) => {
        return (c.pt.left || 0) < (min.pt.left || 0) ? c : min;
    }, children[0]);

    const top = leftmostChild.pt.top || 0;
    children.forEach(c => c.pt.top = top);
}

// ---- Add toolbar buttons ----
export function initToolbar() {
    const bar = document.getElementById('toolbar');
    if (!bar) return;

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

    // Populate doc dropdown
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

    // ---- Existing doc selection, save, delete, addChild, removeNode logic ----
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

    saveBtn.addEventListener('click', () => {
        saveCurrentDoc();
        updateDocSelect();
        if (CURRENT_DOC) status.textContent = `Saved: ${CURRENT_DOC}`;
    });

    deleteBtn.addEventListener('click', () => {
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

    bar.querySelector('#removeNode').onclick = () => {
        const sel = getSelection();
        if (!sel) { status.textContent = 'No selection'; return; }

        const success = removeNode(MODEL.content, sel.__node);
        if (!success) { status.textContent = 'Cannot remove this node'; return; }

        refresh();
    };

    const togglePanelBtn = bar.querySelector('#togglePanel');
    togglePanelBtn.addEventListener('click', () => {
        document.body.classList.toggle('side-panel-hidden');
    });

    // ---- NEW: Distribute and Align Buttons ----
    const distributeBtn = document.createElement('button');
    distributeBtn.dataset.tooltip = "Distribute children horizontally";
    distributeBtn.textContent = '⇔';
    distributeBtn.onclick = () => {
        const sel = getSelection();
        if (!sel || !Array.isArray(sel.__node.content)) return;
        distributeChildrenHorizontally(sel.__node);
        refresh();
    };
    bar.appendChild(distributeBtn);

    const distributeBtn2 = document.createElement('button');
    distributeBtn2.dataset.tooltip = "Distribute children edge to edge";
    distributeBtn2.textContent = '⇔';
    distributeBtn2.onclick = () => {
        const sel = getSelection();
        if (!sel || !Array.isArray(sel.__node.content)) return;
        distributeChildrenEdgeToEdge(sel.__node);
        refresh();
    };
    bar.appendChild(distributeBtn2);

    const alignTopBtn = document.createElement('button');
    alignTopBtn.dataset.tooltip = "Align top of children";
    alignTopBtn.textContent = '⬆';
    alignTopBtn.onclick = () => {
        const sel = getSelection();
        if (!sel || !Array.isArray(sel.__node.content)) return;
        alignTop(sel.__node);
        refresh();
    };
    bar.appendChild(alignTopBtn);

    // ---- Live status update ----
    setInterval(() => {
        const sel = getSelection();
        status.textContent = sel
            ? `Selected: ${sel.id || '(no id)'}`
            : `Document: ${CURRENT_DOC || '(none)'}`;
    }, 200);
}