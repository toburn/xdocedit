// model.js

/**
 * Recursively remove a node from the JSON DOM
 * @param {object} parentNode - the node whose content may contain targetNode
 * @param {object} targetNode - node to remove
 * @returns {boolean} - true if removed
 */
export function removeNode(parentNode, targetNode) {
    if (!parentNode || !parentNode.content) return false;

    // Normalize content into array
    let children = parentNode.content;
    if (!Array.isArray(children)) {
        if (children === targetNode) {
            // If single child matches target, remove by setting content to null
            parentNode.content = null;
            return true;
        } else {
            children = [children];
        }
    }

    // Search in array
    const index = children.indexOf(targetNode);
    if (index !== -1) {
        children.splice(index, 1);
        parentNode.content = children.length === 1 ? children[0] : children;
        return true;
    }

    // Recursively check children
    for (const child of children) {
        if (child && removeNode(child, targetNode)) return true;
    }

    return false;
}

/**
 * Ensure node.content is an array so we can safely push new children
 * @param {object} node
 * @returns {Array} node.content as array
 */
export function ensureContentArray(node) {
    if (!node.content) node.content = [];
    else if (!Array.isArray(node.content)) node.content = [node.content];
    return node.content;
}
