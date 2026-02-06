import { cmyk2hhex } from './cmyk.js';

// styles.js
export function styleFrom(obj = {}) {
    const s = {};
    for (const k in obj) {
        console.log(`Style from ${k}: ${obj[k]}`)
        if (k === 'background-color' ) {
            console.log("Styling background-color")
        };
        if (!obj.hasOwnProperty(k)) continue;

        // ignore properties starting with '_'
        if (k.startsWith('_')) continue;

        const cssKey = k.replace(/_/g, '');
        const v = obj[k];

        if (Array.isArray(v) && v.length === 4) {
            s[cssKey] = cmyk2hhex(v)
        } else if (typeof v === 'number') {
            s[cssKey] = v + 'pt';
        } else {
            s[cssKey] = v;
        }
    }
    return s;
}

export function applyStyles(el, node, classList = {}) {
    el.style.position = 'absolute';

    if (node.no?.position) {
        el.style.position = node.no.position;
    }

    if (node.cls) {
        node.cls.split(' ').forEach(cls => {
            const def = classList[cls];
            if (!def) return;
            Object.assign(el.style, styleFrom(def.pt));
            Object.assign(el.style, styleFrom(def.no));
        });
    }

    Object.assign(el.style, styleFrom(node.pt));
    Object.assign(el.style, styleFrom(node.no));
}
