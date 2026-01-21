import { setSelection } from './selection.js';
import { refresh } from './app.js';

/**
 * Enable interaction (selection + drag) for a DOM element
 */
export function enableInteraction(el) {
    enableSelection(el);
    enableDrag(el);
}

/**
 * Click to select
 */
function enableSelection(el) {
    el.addEventListener('mousedown', e => {
        if (window.spacePressed) return; // allow viewport panning
        e.stopPropagation();
        setSelection(el);
    });
}

/**
 * Drag element by mouse
 */
function enableDrag(el) {
    let startX, startY;

    el.addEventListener('mousedown', e => {
        if (window.spacePressed) return; // allow viewport panning
        if (e.target !== el) return;

        const node = el.__node;
        if (!node.pt) node.pt = {};
        const pt = node.pt;

        startX = e.clientX;
        startY = e.clientY;

        function onMouseMove(ev) {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            pt.left = (pt.left || 0) + dx;
            pt.top = (pt.top || 0) + dy;

            startX = ev.clientX;
            startY = ev.clientY;

            el.style.left = pt.left + 'px';
            el.style.top = pt.top + 'px';
        }

        function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            refresh();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp, { once: true });
    });
}
