const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '../utils/canvasColours.js'), 'utf8');
const helpers = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('default ink contrasts with each theme', async () => {
    const { getCanvasColour, DARK_INK, LIGHT_INK } = await helpers;
    assert.equal(getCanvasColour(null, false), DARK_INK);
    assert.equal(getCanvasColour(null, true), LIGHT_INK);
    assert.notEqual(getCanvasColour(null, true), DARK_INK);
});

test('saved neutral strokes remain visible after switching themes', async () => {
    const { getCanvasColour, DARK_INK, LIGHT_INK } = await helpers;
    for (const colour of [DARK_INK, LIGHT_INK, '#fff', '#000000', '#000']) {
        assert.equal(getCanvasColour(colour, true), LIGHT_INK);
        assert.equal(getCanvasColour(colour, false), DARK_INK);
    }
});

test('neutral colour matching is case insensitive', async () => {
    const { getCanvasColour, DARK_INK, LIGHT_INK } = await helpers;
    assert.equal(getCanvasColour('#1A1A2E', true), LIGHT_INK);
    assert.equal(getCanvasColour('#FFFFFF', false), DARK_INK);
});

test('explicit accent colours stay unchanged across themes', async () => {
    const { getCanvasColour } = await helpers;
    for (const colour of ['#ff6b6b', '#ff922b', '#ffd93d', '#51cf66', '#6bcbff', '#cc5de8', '#123456']) {
        assert.equal(getCanvasColour(colour, true), colour);
        assert.equal(getCanvasColour(colour, false), colour);
    }
});

test('changing the rendered colour does not change exported or persisted operations', async () => {
    const { getCanvasColour, DARK_INK, LIGHT_INK } = await helpers;
    const operation = Object.freeze({ operationId: 'saved-stroke', colour: DARK_INK });
    const original = JSON.stringify(operation);
    assert.equal(getCanvasColour(operation.colour, true), LIGHT_INK);
    assert.equal(JSON.stringify(operation), original);
    assert.equal(getCanvasColour(operation.colour, false), DARK_INK);
});
