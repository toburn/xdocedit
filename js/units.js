export const PX_PER_IN = 96;
export const PT_PER_IN = 72;

export const pxToPt = px => px * (PT_PER_IN / PX_PER_IN);
export const ptToPx = pt => pt * (PX_PER_IN / PT_PER_IN);