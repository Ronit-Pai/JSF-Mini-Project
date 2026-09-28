export const newId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const drawingEvent = (drawing, sessionId) => {
    const points = drawing.points || [
        { x: drawing.x0, y: drawing.y0 },
        { x: drawing.x1, y: drawing.y1 }
    ];
    const tool = drawing.tool || drawing.instrument;
    let colour = drawing.colour || drawing.color;
    if (typeof colour === 'string' && /^#[0-9a-f]{3}$/i.test(colour)) {
        colour = '#' + colour.slice(1).split('').map(value => value + value).join('');
    }
    const width = drawing.width === undefined ? drawing.lineWidth : drawing.width;
    if (!Array.isArray(points) || !points.length || points.length > 5000 ||
        points.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) ||
        !['pencil', 'eraser'].includes(tool) || !/^#[0-9a-f]{6}$/i.test(colour) ||
        !Number.isInteger(width) || width < 1 || width > 100) {
        throw new Error('Invalid drawing file: expected points, pencil/eraser, hex colour and width 1–100.');
    }
    return { operationId: newId(), sessionId, tool, points, colour, width };
};

export const applyDrawingEvent = (drawings, event) => {
    if (event.type === 'board_cleared') return [];
    const index = drawings.findIndex(drawing => drawing.operationId === event.operationId);
    if (index === -1) return [...drawings, event];
    const result = drawings.slice();
    result[index] = event;
    return result;
};

export const mergeDrawingHistory = (history, events) => {
    // A clear received during replay invalidates the REST snapshot.
    const lastClear = events.reduce((index, event, current) => event.type === 'board_cleared' ? current : index, -1);
    return events.slice(lastClear + 1).reduce(applyDrawingEvent, lastClear === -1 ? history : []);
};
