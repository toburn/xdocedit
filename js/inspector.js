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
            <div class="properties">
                ${Object.entries(node.pt).map(([prop, value]) => `
                    <div class="prop-row pt-row">
                        <label>${prop}
                            <input
                                type="number"
                                data-section="pt"
                                data-prop="${prop}"
                                value="${value}">
                        </label>
                        <button class="delete-btn" data-section="pt" data-prop="${prop}">✕</button>
                    </div>
                `).join('')}
            </div>

            <div class="add-row">
                <input type="text" id="new-pt-name" placeholder="Property name">
                <input type="number" id="new-pt-value" placeholder="Value">
                <button id="add-pt">Add</button>
            </div>
        </div>

        <div class="group">
            <h4>Other Properties (no)</h4>
            <div class="properties">
                ${Object.entries(node.no).map(([prop, value]) => `
                    <div class="prop-row no-row">
                        <label>${prop}
                            <input
                                type="text"
                                data-section="no"
                                data-prop="${prop}"
                                value="${value}">
                        </label>
                        <button class="delete-btn" data-section="no" data-prop="${prop}">✕</button>
                    </div>
                `).join('')}
            </div>

            <div class="add-row">
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

    // ---- Wiring ----

    // ID
    inspector.querySelector('#node-id')?.addEventListener('input', e => {
        node.id = e.target.value;
        onUpdate?.(node);
    });

    // Property value changes (pt + no)
    inspector.querySelectorAll('.prop-row input').forEach(input => {
        input.addEventListener('input', e => {
            const section = e.target.dataset.section;
            const prop = e.target.dataset.prop;
            const value = section === 'pt'
                ? Number(e.target.value)
                : e.target.value;

            node[section][prop] = value;
            onUpdate?.(node);
        });
    });

    // Delete buttons (pt + no)
    inspector.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const section = btn.dataset.section;
            const prop = btn.dataset.prop;
            delete node[section][prop];
            renderInspector(el, onUpdate);
            onUpdate?.(node);
        });
    });

    // Add pt
    inspector.querySelector('#add-pt')?.addEventListener('click', () => {
        const name = inspector.querySelector('#new-pt-name').value.trim();
        const value = Number(inspector.querySelector('#new-pt-value').value);
        if (!name) return;

        node.pt[name] = value;
        renderInspector(el, onUpdate);
        onUpdate?.(node);
    });

    // Add no
    inspector.querySelector('#add-no')?.addEventListener('click', () => {
        const name = inspector.querySelector('#new-no-name').value.trim();
        const value = inspector.querySelector('#new-no-value').value;
        if (!name) return;

        node.no[name] = value;
        renderInspector(el, onUpdate);
        onUpdate?.(node);
    });

    // Text
    inspector.querySelector('#node-text')?.addEventListener('input', e => {
        node.content = e.target.value;
        onUpdate?.(node);
    });
}

export function initInspector(onUpdate, onSelect) {
    clearInspector();

    onSelectionChange(el => {
        renderInspector(el, onUpdate);
        if (onSelect && el?.__node) {
            onSelect(el.__node);
        }
    });
}
