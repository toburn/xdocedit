// selection.js
let selectedEl = null;
let selectionCallback = null;

export function setSelection(el) {
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedEl = el;
    if (selectedEl) selectedEl.classList.add('selected');

    if (selectionCallback) selectionCallback(selectedEl);
}

export function getSelection() {
    return selectedEl;
}

export function clearSelection() {
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedEl = null;

    if (selectionCallback) selectionCallback(null);
}

export function onSelectionChange(cb) {
    selectionCallback = cb;
}
