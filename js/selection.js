// selection.js
let selectedEl = null;
const selectionCallbacks = new Set();

export function setSelection(el) {
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedEl = el;
    if (selectedEl) selectedEl.classList.add('selected');

    // Notify all subscribers
    selectionCallbacks.forEach(cb => cb(selectedEl));
}

export function getSelection() {
    return selectedEl;
}

export function clearSelection() {
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedEl = null;

    selectionCallbacks.forEach(cb => cb(null));
}

/**
 * Subscribe to selection changes.
 * Returns a function to unsubscribe.
 */
export function onSelectionChange(cb) {
    selectionCallbacks.add(cb);
    // Return unsubscribe function
    return () => selectionCallbacks.delete(cb);
}