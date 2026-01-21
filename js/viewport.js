// viewport.js
export function makeViewportZoomable(editorId, viewportId) {
    const editor = document.getElementById(editorId);
    const viewport = document.getElementById(viewportId);

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    let isPanning = false;
    let startX, startY;

    let mouseX = 0, mouseY = 0;

    // Track mouse position globally
    window.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Update cursor dynamically when not panning
        if (!isPanning) {
            viewport.style.cursor = window.spacePressed ? 'grab' : 'default';
        }
    });

    // Track spacebar globally
    window.spacePressed = false;
    window.addEventListener('keydown', e => {
        if (e.code === 'Space' && !window.spacePressed) {
            window.spacePressed = true;
            e.preventDefault(); // prevent page scroll

            // Force cursor update on element under mouse
            const el = document.elementFromPoint(mouseX, mouseY);
            if (el) el.style.cursor = 'grab';
            viewport.style.cursor = 'grab';
        }
    });

    window.addEventListener('keyup', e => {
        if (e.code === 'Space') {
            window.spacePressed = false;

            // Restore cursor on element under mouse
            const el = document.elementFromPoint(mouseX, mouseY);
            if (el) el.style.cursor = '';
            viewport.style.cursor = 'default';
        }
    });

    // --- Update transform ---
    function updateTransform() {
        editor.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    // --- Zoom ---
    viewport.addEventListener('wheel', e => {
        e.preventDefault();
        const zoomFactor = 0.1;
        const delta = e.deltaY < 0 ? 1 : -1;
        const newScale = Math.min(Math.max(0.1, scale + delta * zoomFactor), 5);

        const rect = viewport.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        offsetX -= (mx - offsetX) * (newScale / scale - 1);
        offsetY -= (my - offsetY) * (newScale / scale - 1);

        scale = newScale;
        updateTransform();
    });

    // --- Pan ---
    viewport.addEventListener('mousedown', e => {
        const onNode = e.target.closest('.node');

        if (window.spacePressed || !onNode) {
            isPanning = true;
            startX = e.clientX - offsetX;
            startY = e.clientY - offsetY;
            viewport.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', e => {
        if (!isPanning) return;
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener('mouseup', e => {
        if (!isPanning) return;
        isPanning = false;
        viewport.style.cursor = window.spacePressed ? 'grab' : 'default';
    });

    // Initialize
    updateTransform();
}
