let selectedEl = null;

export function setSelection(el) {
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedEl = el;
    if (selectedEl) selectedEl.classList.add('selected');
}

export function getSelection() {
    return selectedEl;
}

export function clearSelection() {
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedEl = null;
}
