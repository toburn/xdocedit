// layout.js
// Functions to distribute and align children of a parent node
export function distributeChildrenHorizontally(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;

    children.sort((a, b) => (a.pt.left || 0) - (b.pt.left || 0));
    const leftMost = children[0].pt.left || 0;
    const rightMost = children[children.length - 1].pt.left + (children[children.length - 1].pt.width || 0);
    const totalWidth = rightMost - leftMost;
    const totalChildrenWidth = children.reduce((sum, c) => sum + (c.pt.width || 0), 0);
    const spacing = (totalWidth - totalChildrenWidth) / (children.length - 1);

    let currentX = leftMost;
    children.forEach(c => {
        c.pt.left = currentX;
        currentX += (c.pt.width || 0) + spacing;
    });
}

export function distributeChildrenEdgeToEdge(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;

    children.sort((a, b) => (a.pt.left || 0) - (b.pt.left || 0));
    const parentWidth = parentNode.pt?.width || 0;
    const leftChild = children[0];
    const rightChild = children[children.length - 1];

    leftChild.pt.left = 0;
    rightChild.pt.left = parentWidth - (rightChild.pt.width || 0);

    const remainingChildren = children.slice(1, -1);
    const totalRemainingWidth = remainingChildren.reduce((sum, c) => sum + (c.pt.width || 0), 0);
    const spaceBetween = rightChild.pt.left - (leftChild.pt.left + (leftChild.pt.width || 0)) - totalRemainingWidth;
    const spacing = remainingChildren.length > 0 ? spaceBetween / (remainingChildren.length + 1) : 0;

    let currentX = leftChild.pt.left + (leftChild.pt.width || 0) + spacing;
    remainingChildren.forEach(c => {
        c.pt.left = currentX;
        currentX += (c.pt.width || 0) + spacing;
    });
}

export function distributeChildrenVertically(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;

    children.sort((a, b) => (a.pt.top || 0) - (b.pt.top || 0));
    const topMost = children[0].pt.top || 0;
    const bottomMost = (children[children.length - 1].pt.top || 0) + (children[children.length - 1].pt.height || 0);
    const totalHeight = bottomMost - topMost;
    const totalChildrenHeight = children.reduce((sum, c) => sum + (c.pt.height || 0), 0);
    const spacing = (totalHeight - totalChildrenHeight) / (children.length - 1);

    let currentY = topMost;
    children.forEach(c => {
        c.pt.top = currentY;
        currentY += (c.pt.height || 0) + spacing;
    });
}

export function distributeChildrenVerticallyEdgeToEdge(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length < 2) return;

    children.sort((a, b) => (a.pt.top || 0) - (b.pt.top || 0));
    const parentHeight = parentNode.pt?.height || 0;
    const topChild = children[0];
    const bottomChild = children[children.length - 1];

    topChild.pt.top = 0;
    bottomChild.pt.top = parentHeight - (bottomChild.pt.height || 0);

    const remainingChildren = children.slice(1, -1);
    const totalRemainingHeight = remainingChildren.reduce((sum, c) => sum + (c.pt.height || 0), 0);
    const spaceBetween = bottomChild.pt.top - (topChild.pt.top + (topChild.pt.height || 0)) - totalRemainingHeight;
    const spacing = remainingChildren.length > 0 ? spaceBetween / (remainingChildren.length + 1) : 0;

    let currentY = topChild.pt.top + (topChild.pt.height || 0) + spacing;
    remainingChildren.forEach(c => {
        c.pt.top = currentY;
        currentY += (c.pt.height || 0) + spacing;
    });
}

export function alignTop(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length === 0) return;

    const top = children.reduce((minTop, c) => Math.min(minTop, c.pt.top || 0), children[0].pt.top || 0);
    children.forEach(c => c.pt.top = top);
}

export function alignLeftOfChildren(parentNode) {
    const children = parentNode.content;
    if (!Array.isArray(children) || children.length === 0) return;

    const left = children.reduce((minLeft, c) => Math.min(minLeft, c.pt.left || 0), children[0].pt.left || 0);
    children.forEach(c => c.pt.left = left);
}