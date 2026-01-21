import { applyStyles } from './styles.js';
import { enableInteraction } from './interaction.js';
import { MODEL } from './app.js';

export function render(node, parentEl) {
    const el = document.createElement('div');
    el.className = 'node';
    el.__node = node;

    if (node.id) el.id = node.id;

    parentEl.appendChild(el);
    applyStyles(el, node, MODEL.classList);
    enableInteraction(el);

    if (node.contenteditable) {
        el.contentEditable = true;
        el.innerText = node.content || '';
        el.oninput = () => node.content = el.innerText;
    } else if (typeof node.content === 'string') {
        el.innerText = node.content;
    }

    if (Array.isArray(node.content)) {
        node.content.forEach(child => render(child, el));
    } else if (node.content && typeof node.content === 'object') {
        render(node.content, el);
    }
}
