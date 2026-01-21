// inspector.js
import { onSelectionChange } from './selection.js';
import { refresh } from './app.js';

const inspector = document.getElementById('inspector');

function clearInspector() {
    inspector.innerHTML = '<em style="opacity:.6">No selection</em>';
}

function numberInput(label, value, onChange) {
    return `
    <label>
        ${label}
        <input type="number" value="${value ?? ''}" data-key="${label}">
    </label>
  `;
}

function renderInspector(el) {
    if (!el || !el.__node) {
        clearInspector();
        return;
    }

    const node = el.__node;
    node.pt ||= {};

    inspector.innerHTML = `
    <h3>Inspector</h3>

    <div class="group">
        <label>
            ID
            <input type="text" id="node-id" value="${node.id || ''}">
        </label>
    </div>

    <div class="group">
        <h4>Position</h4>
        <div class="row">
            <div>
                <label>Left
                    <input type="number" data-prop="left" value="${node.pt.left ?? 0}">
                </label>
            </div>
            <div>
                <label>Top
                    <input type="number" data-prop="top" value="${node.pt.top ?? 0}">
                </label>
            </div>
        </div>
        <div class="row">
            <div>
                <label>Width
                    <input type="number" data-prop="width" value="${node.pt.width ?? ''}">
                </label>
            </div>
            <div>
                <label>Height
                    <input type="number" data-prop="height" value="${node.pt.height ?? ''}">
                </label>
            </div>
        </div>
    </div>

    ${typeof node.content === 'string' ? `
    <div class="group">
        <label>
            Text
            <input type="text" id="node-text" value="${node.content}">
        </label>
    </div>
    ` : ''}
  `;

    // --- Wiring ---

    inspector.querySelector('#node-id')?.addEventListener('input', e => {
        node.id = e.target.value;
        refresh();
    });

    inspector.querySelectorAll('input[data-prop]').forEach(input => {
        input.addEventListener('input', e => {
            const prop = e.target.dataset.prop;
            const value = Number(e.target.value);
            node.pt[prop] = value;
            refresh();
        });
    });

    inspector.querySelector('#node-text')?.addEventListener('input', e => {
        node.content = e.target.value;
        refresh();
    });
}

export function initInspector() {
    clearInspector();
    onSelectionChange(renderInspector);
}
