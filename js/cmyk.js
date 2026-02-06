export function cmyk2rgb (cmyk) {
    if (!cmyk)
        return null;
    const c = cmyk[0] / 100;
    const m = cmyk[1] / 100;
    const y = cmyk[2] / 100;
    const k = cmyk[3] / 100;
    const r = 1 - Math.min(1, c * (1 - k) + k);
    const g = 1 - Math.min(1, m * (1 - k) + k);
    const b = 1 - Math.min(1, y * (1 - k) + k);

    return [r * 255, g * 255, b * 255];
};

export function rgb2hex(args) {
    if (!args)
        return null;
    var integer = ((Math.round(args[0]) & 0xFF) << 16)
        + ((Math.round(args[1]) & 0xFF) << 8)
        + (Math.round(args[2]) & 0xFF);

    var string = integer.toString(16).toUpperCase();
    return '000000'.substring(string.length) + string;
};

export function cmyk2hex(cmyk) {
    return rgb2hex(cmyk2rgb(cmyk));
};

export function cmyk2hhex(cmyk) {
    if (!cmyk)
        return null;
    return cmyk ? "#" + rgb2hex(cmyk2rgb(cmyk)) : null;
};