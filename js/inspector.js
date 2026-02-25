// inspector.js
import { onSelectionChange, setSelection } from './selection.js';
import { MODEL } from './app.js';

const inspector = document.getElementById('inspector');
let currentEl = null;

// ---- Clear inspector UI ----
function clearInspector() {
    inspector.innerHTML = `
        <div style="opacity:.7">No selection</div>
        <div style="margin-top:10px;">
            <button id="select-root">Select root</button>
        </div>
    `;

    const btn = inspector.querySelector('#select-root');
    btn?.addEventListener('click', () => {
        if (!MODEL?.content) return;
        const rootId = MODEL.content.id;
        if (!rootId) return;
        const rootEl = document.getElementById(rootId);
        if (rootEl) setSelection(rootEl);
    });
}

// ---- Helper functions ----
function findParent(el) {
    let p = el?.parentElement;
    while (p && !p.__node) p = p.parentElement;
    return p;
}

function findSibling(el, dir) {
    let sib = dir === 'next' ? el?.nextElementSibling : el?.previousElementSibling;
    while (sib && !sib.__node) {
        sib = dir === 'next' ? sib.nextElementSibling : sib.previousElementSibling;
    }
    return sib;
}

function findFirstChild(el) {
    return [...el.children].find(c => c.__node);
}

function getPropertyValue(section, value) {
    if (section === 'pt') return Number(value);
    if (section === 'no') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : value;
        } catch {
            return value;
        }
    }
    return value;
}

// ---- Render inspector UI for a selected element ----
function renderInspector(el, onUpdate) {
    currentEl = el;

    if (!el || !el.__node) {
        clearInspector();
        return;
    }

    const node = el.__node;
    node.pt ||= {};
    node.no ||= {};

    inspector.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items: center;">
            <h3>Inspector</h3>
        </div>

        <div class="group nav-group">
            <button id="nav-parent">⤴</button>
            <button id="nav-child">⤵</button>
            <button id="nav-prev">←</button>
            <button id="nav-next">→</button>
        </div>

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
                    <div class="prop-row">
                        <label>${prop}
                            <input type="number"
                                   data-section="pt"
                                   data-prop="${prop}"
                                   value="${value}">
                        </label>
                        <button class="delete-btn"
                                data-section="pt"
                                data-prop="${prop}">✕</button>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="group">
            <h4>Other Properties (no)</h4>
            <div class="properties">
                ${Object.entries(node.no).map(([prop, value]) => `
                    <div class="prop-row">
                        <label>${prop}
                            <input type="text"
                                   data-section="no"
                                   data-prop="${prop}"
                                   value="${value}">
                        </label>
                        <button class="delete-btn"
                                data-section="no"
                                data-prop="${prop}">✕</button>
                    </div>
                `).join('')}
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

    // ---- Navigation buttons ----
    inspector.querySelector('#nav-parent')?.addEventListener('click', () => {
        const p = findParent(currentEl);
        if (p) setSelection(p);
    });
    inspector.querySelector('#nav-child')?.addEventListener('click', () => {
        const c = findFirstChild(currentEl);
        if (c) setSelection(c);
    });
    inspector.querySelector('#nav-prev')?.addEventListener('click', () => {
        const s = findSibling(currentEl, 'prev');
        if (s) setSelection(s);
    });
    inspector.querySelector('#nav-next')?.addEventListener('click', () => {
        const s = findSibling(currentEl, 'next');
        if (s) setSelection(s);
    });

    // ---- ID change ----
    inspector.querySelector('#node-id')?.addEventListener('input', e => {
        node.id = e.target.value;
        onUpdate?.(node);
    });

    // ---- Property input changes ----
    inspector.querySelectorAll('.prop-row input').forEach(input => {
        input.addEventListener('input', e => {
            const section = e.target.dataset.section;
            const prop = e.target.dataset.prop;
            node[section][prop] = getPropertyValue(section, e.target.value);
            onUpdate?.(node);
        });
    });

    // ---- Delete property buttons ----
    inspector.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const { section, prop } = btn.dataset;
            delete node[section][prop];
            renderInspector(el, onUpdate);
            onUpdate?.(node);
        });
    });

    // ---- Text content changes ----
    inspector.querySelector('#node-text')?.addEventListener('input', e => {
        node.content = e.target.value;
        onUpdate?.(node);
    });
}

// ---- Initialize inspector ----
export function initInspector(onUpdate, onSelect) {
    clearInspector();

    // Subscribe to multiple selection changes
    onSelectionChange(el => {
        renderInspector(el, onUpdate);
        if (onSelect && el?.__node) onSelect(el.__node);
    });
}