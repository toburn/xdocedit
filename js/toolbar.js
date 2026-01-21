// toolbar.js
import { getSelection } from './selection.js';
import { removeNode, ensureContentArray } from './model.js';
import { MODEL, refresh } from './app.js';

export function initToolbar() {
    const bar = document.getElementById('toolbar');

    if (!bar) {
        console.error('Toolbar element not found');
        return;
    }

    // Toolbar HTML
    bar.innerHTML = `
    <button id="addChild">+ Child</button>
    <button id="removeNode">🗑 Remove</button>
    <span id="status" style="margin-left:10px;opacity:.7"></span>
  `;

    const status = bar.querySelector('#status');

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

    // Live status update
    setInterval(() => {
        const sel = getSelection();
        status.textContent = sel
            ? `Selected: ${sel.id || '(no id)'}`
            : 'Nothing selected';
    }, 200);
}
