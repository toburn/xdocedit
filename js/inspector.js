import { onSelectionChange } from './selection.js';

const inspector = document.getElementById('inspector');

function clearInspector() {
    inspector.innerHTML = '<em style="opacity:.6">No selection</em>';
}

function renderInspector(el, onUpdate) {
    if (!el || !el.__node) {
        clearInspector();
        return;
    }

    const node = el.__node;
    node.pt ||= {};
    node.no ||= {};

    inspector.innerHTML = `
    <h3>Inspector</h3>

    <div class="group">
        <label>
            ID
            <input type="text" id="node-id" value="${node.id || ''}">
        </label>
    </div>

    <div class="group">
        <h4>Position (pt)</h4>
        ${['left','top','width','height'].map(prop => `
            <label>${prop}
                <input type="number" data-prop="pt.${prop}" value="${node.pt[prop] ?? ''}">
            </label>
        `).join('')}
    </div>

    <div class="group">
        <h4>Other Properties (no)</h4>
        <div id="no-properties">
            ${Object.entries(node.no).map(([prop, value]) => `
                <div class="no-row">
                    <input type="text" class="no-name" value="${prop}">
                    <input type="text" class="no-value" value="${value}">
                    <button class="delete-no">✕</button>
                </div>
            `).join('')}
        </div>
        <div class="no-add-row">
            <input type="text" id="new-no-name" placeholder="Property name">
            <input type="text" id="new-no-value" placeholder="Value">
            <button id="add-no">Add</button>
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

    // ID
    inspector.querySelector('#node-id')?.addEventListener('input', e => {
        node.id = e.target.value;
        onUpdate?.(node);
    });

    // pt properties
    inspector.querySelectorAll('input[data-prop]').forEach(input => {
        input.addEventListener('input', e => {
            const [section, prop] = e.target.dataset.prop.split('.');
            node[section][prop] = Number(e.target.value);
            onUpdate?.(node);
        });
    });

    // no properties: update on change
    inspector.querySelectorAll('#no-properties .no-row').forEach(row => {
        const nameInput = row.querySelector('.no-name');
        const valueInput = row.querySelector('.no-value');
        const deleteBtn = row.querySelector('.delete-no');

        // Update property name or value
        nameInput.addEventListener('input', e => {
            const oldName = Object.keys(node.no).find(k => k === nameInput.dataset.oldName);
            if (oldName && oldName !== nameInput.value) {
                node.no[nameInput.value] = node.no[oldName];
                delete node.no[oldName];
                nameInput.dataset.oldName = nameInput.value;
            }
            onUpdate?.(node);
        });
        valueInput.addEventListener('input', e => {
            node.no[nameInput.value] = valueInput.value;
            onUpdate?.(node);
        });

        // Delete property
        deleteBtn.addEventListener('click', e => {
            delete node.no[nameInput.value];
            renderInspector(el, onUpdate); // re-render
            onUpdate?.(node);
        });

        nameInput.dataset.oldName = nameInput.value;
    });

    // Add new no property
    inspector.querySelector('#add-no')?.addEventListener('click', e => {
        const newName = inspector.querySelector('#new-no-name').value.trim();
        const newValue = inspector.querySelector('#new-no-value').value.trim();
        if (newName) {
            node.no[newName] = newValue;
            inspector.querySelector('#new-no-name').value = '';
            inspector.querySelector('#new-no-value').value = '';
            renderInspector(el, onUpdate);
            onUpdate?.(node);
        }
    });

    // Text content
    inspector.querySelector('#node-text')?.addEventListener('input', e => {
        node.content = e.target.value;
        onUpdate?.(node);
    });
}

/**
 * Initialize inspector
 * @param {Function} onUpdate - called when any property changes
 * @param {Function} onSelect - called when selection changes
 */
export function initInspector(onUpdate, onSelect) {
    clearInspector();

    onSelectionChange(el => {
        renderInspector(el, onUpdate);
        if (onSelect && el?.__node) {
            onSelect(el.__node);
        }
    });
}
