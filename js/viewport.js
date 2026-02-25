// viewport.js
import { SettingsManager } from './settings.js';

export let currentScale = 1;

export function makeViewportZoomable(editorId, viewportId) {
    const editor = document.getElementById(editorId);
    const viewport = document.getElementById(viewportId);

    let scale = 1;
    let offsetX = 0, offsetY = 0;
    let isPanning = false, startX, startY;

    // --- Initial zoom sensitivity ---
    let zoomSensitivity = SettingsManager.get('zoomSensitivity', 0.002);

    // --- Subscribe to changes ---
    SettingsManager.subscribe('zoomSensitivity', value => {
        zoomSensitivity = value;
        console.log('Viewport: zoom sensitivity updated', value);
    });

    // --- Transform updater ---
    function updateTransform() {
        editor.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    // --- Zoom ---
    viewport.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        const newScale = Math.min(Math.max(0.1, scale + delta * zoomSensitivity), 5);

        const rect = viewport.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        offsetX -= (mx - offsetX) * (newScale / scale - 1);
        offsetY -= (my - offsetY) * (newScale / scale - 1);

        scale = newScale;
        currentScale = scale;
        updateTransform();
    });

    // --- Pan start ---
    viewport.addEventListener('mousedown', e => {
        const onNode = e.target.closest('.node');

        // Start panning if space pressed or clicked outside a node
        if (window.spacePressed || !onNode) {
            isPanning = true;
            startX = e.clientX - offsetX;
            startY = e.clientY - offsetY;
            viewport.style.cursor = 'grabbing';
            e.preventDefault(); // prevent text selection
        }
    });

    // --- Pan move ---
    window.addEventListener('mousemove', e => {
        if (!isPanning) return;
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        updateTransform();
    });

    // --- Pan end ---
    window.addEventListener('mouseup', e => {
        if (!isPanning) return;
        isPanning = false;
        viewport.style.cursor = window.spacePressed ? 'grab' : 'default';
    });

    // --- Space key handling for pan anywhere ---
    // --- Force cursor on nodes while space is pressed ---
    function updateNodeCursors() {
        const nodes = editor.querySelectorAll('.node');
        nodes.forEach(node => {
            node.style.cursor = window.spacePressed ? 'grab' : '';
        });
    }

    // Call it whenever space is pressed/released
    window.addEventListener('keydown', e => {
        if (e.code === 'Space' && !window.spacePressed) {
            window.spacePressed = true;
            if (!isPanning) viewport.style.cursor = 'grab';
            updateNodeCursors();          // 🔹 update nodes
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', e => {
        if (e.code === 'Space') {
            window.spacePressed = false;
            if (!isPanning) viewport.style.cursor = 'default';
            updateNodeCursors();          // 🔹 restore nodes
        }
    });

    updateTransform();
}