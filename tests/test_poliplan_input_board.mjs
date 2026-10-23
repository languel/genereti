import test from 'node:test';
import assert from 'node:assert/strict';
import {fitContain, toScreen} from '../integrations/genereti_comfy_poliplan/web/js/input-board.js';

test('the input underlay fits inside the image board without cropping or stretching and is centred', () => {
  assert.deepEqual(fitContain(100, 100, {x: 0, y: 0, width: 512, height: 512}), {x: 0, y: 0, width: 512, height: 512});
  assert.deepEqual(fitContain(200, 100, {x: 10, y: 20, width: 400, height: 400}), {x: 10, y: 120, width: 400, height: 200});   // wide: bars above and below
  assert.deepEqual(fitContain(100, 200, {x: 0, y: 0, width: 400, height: 400}), {x: 100, y: 0, width: 200, height: 400});       // tall
  assert.deepEqual(fitContain(64, 64, {x: -50, y: -50, width: 128, height: 128}), {x: -50, y: -50, width: 128, height: 128}); // scales up, negative origin
  for (const bad of [[0, 10], [10, 0], [NaN, 5]]) assert.equal(fitContain(...bad, {x: 3, y: 4, width: 100, height: 100}).width, 0);
  assert.equal(fitContain(10, 10, {x: 1, y: 2, width: 0, height: 5}).height, 0);
});

test('world rectangles map to the editor view as screen = world × z + (x, y)', () => {
  assert.deepEqual(toScreen({x: 100, y: 50, width: 200, height: 100}, {x: 10, y: 20, z: 2}), {x: 210, y: 120, width: 400, height: 200});
  assert.deepEqual(toScreen({x: 0, y: 0, width: 10, height: 10}, {x: 0, y: 0, z: 1}), {x: 0, y: 0, width: 10, height: 10});
  assert.deepEqual(toScreen({x: 4, y: 4, width: 8, height: 8}, undefined), {x: 4, y: 4, width: 8, height: 8});        // no camera yet: identity
  assert.equal(toScreen({x: 0, y: 0, width: 100, height: 100}, {x: 0, y: 0, z: 0.5}).width, 50);
});
