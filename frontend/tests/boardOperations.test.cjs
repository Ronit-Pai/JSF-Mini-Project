const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '../utils/boardOperations.js'), 'utf8');
const helpers = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const legacy = { x0: -1.25, y0: 2, x1: 3.5, y1: 4, color: '#fff', lineWidth: 3, instrument: 'pencil' };

test('legacy coordinates become modern world-coordinate operations', async () => {
    const { drawingEvent } = await helpers;
    const event = drawingEvent(legacy, 'session-one');
    assert.deepEqual(event.points, [{ x: -1.25, y: 2 }, { x: 3.5, y: 4 }]);
    assert.equal(event.colour, '#ffffff');
    assert.equal(event.width, 3);
    assert.equal(event.tool, 'pencil');
    assert.equal(event.sessionId, 'session-one');
    assert.ok(event.operationId.length <= 80);
    assert.notEqual(drawingEvent(legacy, 'session-one').operationId, event.operationId);
});

test('modern eraser imports retain their tool and receive fresh identity', async () => {
    const { drawingEvent } = await helpers;
    const event = drawingEvent({ operationId: 'old', points: [{ x: 1, y: 2 }], tool: 'eraser', colour: '#123abc', width: 40 }, 'new-session');
    assert.equal(event.tool, 'eraser');
    assert.equal(event.colour, '#123abc');
    assert.notEqual(event.operationId, 'old');
    assert.equal(event.sessionId, 'new-session');
});

test('invalid coordinates, tools, colours and widths fail before publishing', async () => {
    const { drawingEvent } = await helpers;
    for (const override of [
        { x0: NaN }, { x1: Infinity }, { y0: '2' }, { points: [] },
        { points: [null] }, { points: Array(5001).fill({ x: 0, y: 0 }) },
        { color: 'white' }, { instrument: 'clear' }, { lineWidth: 0 },
        { lineWidth: 101 }, { lineWidth: 1.5 }
    ]) {
        assert.throws(() => drawingEvent({ ...legacy, ...override }, 'session'));
    }
});

test('server echoes replace optimistic operations without duplicates', async () => {
    const { applyDrawingEvent } = await helpers;
    const first = { operationId: 'one', sessionId: 'same-name-session-1' };
    const second = { operationId: 'two', sessionId: 'same-name-session-2' };
    const drawings = [first, second];
    const echo = { ...first, timestamp: 'saved' };
    const updated = applyDrawingEvent(drawings, echo);
    assert.deepEqual(updated, [echo, second]);
    assert.deepEqual(drawings, [first, second]);
    assert.deepEqual(applyDrawingEvent(updated, { type: 'board_cleared' }), []);
});

test('history merges live events once and preserves remote operations', async () => {
    const { mergeDrawingHistory } = await helpers;
    const first = { operationId: 'one' };
    const second = { operationId: 'two' };
    const third = { operationId: 'three' };
    assert.deepEqual(mergeDrawingHistory([first, second], [second, third]), [first, second, third]);
});

test('a clear during replay discards the stale snapshot and earlier buffered strokes', async () => {
    const { mergeDrawingHistory } = await helpers;
    const old = { operationId: 'old' };
    const discarded = { operationId: 'discarded' };
    const current = { operationId: 'current' };
    const clear = { type: 'board_cleared' };
    assert.deepEqual(mergeDrawingHistory([old], [discarded, clear, current]), [current]);
    assert.deepEqual(mergeDrawingHistory([old], [clear, discarded, clear, current]), [current]);
});
