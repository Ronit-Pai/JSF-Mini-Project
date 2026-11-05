export const DARK_INK = '#1a1a2e';
export const LIGHT_INK = '#ffffff';

export const getCanvasColour = (colour, dark) => {
    // Neutral ink adapts at render time; saved operation colours stay unchanged.
    if (!colour || [DARK_INK, LIGHT_INK, '#fff', '#000000', '#000'].includes(colour.toLowerCase())) {
        return dark ? LIGHT_INK : DARK_INK;
    }
    return colour;
};
