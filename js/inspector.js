import { onSelectionChange, setSelection } from './selection.js';

const inspector = document.getElementById('inspector');

let currentEl = null;

function clearInspector() {
    inspector.innerHTML = '<em style="opacity:.6">No selection</em>';
}

function findParent(el) {
    let p = el?.parentElement;
    while (p && !p.__node) p = p.parentElement;
    return p;
}

function findSibling(el, dir) {
    let sib = dir === 'next'
        ? el?.nextElementSibling
        : el?.previousElementSibling;

    while (sib && !sib.__node) {
        sib = dir === 'next'
            ? sib.nextElementSibling
            : sib.previousElementSibling;
    }
    return sib;
}

function getPropertyValue(section, value) {
    if (section === 'pt')
        return Number(value);
    if (section === 'no') {
        return extractArray(value) || value;
    }
    return value
}

function extractArray(value) {
    if (typeof value !== "string") return null;

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function findFirstChild(el) {
    return [...el.children].find(c => c.__node);
}

function renderInspector(el, onUpdate) {
    currentEl = el;

    function updateNavButtons() {
        const parent = findParent(currentEl);
        const child = findFirstChild(currentEl);
        const prev = findSibling(currentEl, 'prev');
        const next = findSibling(currentEl, 'next');

        const btnParent = inspector.querySelector('#nav-parent');
        const btnChild  = inspector.querySelector('#nav-child');
        const btnPrev   = inspector.querySelector('#nav-prev');
        const btnNext   = inspector.querySelector('#nav-next');

        btnParent.disabled = !parent;
        btnChild.disabled  = !child;
        btnPrev.disabled   = !prev;
        btnNext.disabled   = !next;
    }


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
            <button id="toggle-output" title="Show/Hide JSON" style="font-size:12px;padding:2px 6px;">⇅</button>
        </div>

        <!-- Traversal -->
        <div class="group nav-group">
            <button id="nav-parent" title="Parent">⤴</button>
            <button id="nav-child" title="First child">⤵</button>
            <button id="nav-prev" title="Previous sibling">←</button>
            <button id="nav-next" title="Next sibling">→</button>
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
                <button id="add-pt">+</button>
            </div>
        </div>

        <div class="group">
            <h4>Other Properties (no)</h4>
            <div class="properties">
                ${Object.entries(node.no).map(([prop, value]) => `
                    <div class="prop-row">
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
                <button id="add-no">+</button>
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

    // ---- Toggle json output wiring ----
    const btnToggle = inspector.querySelector('#toggle-output');
    btnToggle.addEventListener('click', () => {
        const output = document.getElementById('output');
        const inspectorEl = document.getElementById('inspector');
        if (!output || !inspectorEl) return;

        const hidden = output.style.display === 'none';

        if (hidden) {
            output.style.display = 'block';
            inspectorEl.style.right = output.offsetWidth + 'px'; // position inspector left of output
        } else {
            output.style.display = 'none';
            inspectorEl.style.right = '0px'; // inspector takes the place of output
        }
    });

    // ---- Traversal wiring ----

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


    // ---- Data wiring ----

    inspector.querySelector('#node-id')?.addEventListener('input', e => {
        node.id = e.target.value;
        onUpdate?.(node);
    });

    inspector.querySelectorAll('.prop-row input').forEach(input => {
        input.addEventListener('input', e => {
            const section = e.target.dataset.section;
            const prop = e.target.dataset.prop;
            node[section][prop] = getPropertyValue(section, e.target.value);
            onUpdate?.(node);
        });
    });

    inspector.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const { section, prop } = btn.dataset;
            delete node[section][prop];
            renderInspector(el, onUpdate);
            onUpdate?.(node);
        });
    });

    inspector.querySelector('#add-pt')?.addEventListener('click', () => {
        const n = inspector.querySelector('#new-pt-name').value.trim();
        const v = Number(inspector.querySelector('#new-pt-value').value);
        if (!n) return;
        node.pt[n] = v;
        renderInspector(el, onUpdate);
        onUpdate?.(node);
    });

    inspector.querySelector('#add-no')?.addEventListener('click', () => {
        const n = inspector.querySelector('#new-no-name').value.trim();
        const v = inspector.querySelector('#new-no-value').value;
        if (!n) return;
        node.no[n] = v;
        renderInspector(el, onUpdate);
        onUpdate?.(node);
    });

    inspector.querySelector('#node-text')?.addEventListener('input', e => {
        node.content = e.target.value;
        onUpdate?.(node);
    });

    updateNavButtons();

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
