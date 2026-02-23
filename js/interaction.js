import { setSelection } from './selection.js';
import { refresh } from './app.js';
import { currentScale } from './viewport.js';

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
            const pxToPt = 72 / 96;
            const ptToPx = 96 / 72;

            // compensate for zoom scale
            const dxScreen = ev.clientX - startX;
            const dyScreen = ev.clientY - startY;

            const dxLayoutPx = dxScreen / currentScale;
            const dyLayoutPx = dyScreen / currentScale;

            const dxPt = dxLayoutPx * pxToPt;
            const dyPt = dyLayoutPx * pxToPt;

            pt.left = (pt.left || 0) + dxPt;
            pt.top  = (pt.top  || 0) + dyPt;

            startX = ev.clientX;
            startY = ev.clientY;

            // render in layout px (not scaled px)
            el.style.left = (pt.left * ptToPx) + 'px';
            el.style.top  = (pt.top  * ptToPx) + 'px';
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
