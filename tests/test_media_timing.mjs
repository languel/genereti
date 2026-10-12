import test from 'node:test';
import assert from 'node:assert/strict';
import {playbackSpeed,gifDelay} from '../integrations/genereti_comfy_inputs/web/js/media-timing.js';
import {frameSize,sampleDue} from '../integrations/genereti_comfy_inputs/web/js/capture-frame.js';
test('playback speed changes GIF time independently of sampling rate',()=>{assert.equal(gifDelay(100000,2),50);assert.equal(gifDelay(100000,.5),200);assert.equal(playbackSpeed(0),1);assert.equal(playbackSpeed(10),4);assert.equal(sampleDue(2000,0,.5,false,true),true);assert.equal(sampleDue(1000,0,.5,false,true),false);assert.equal(sampleDue(10000,0,0,false,true),false);});
test('sampling resolution preserves aspect and does not upscale',()=>{assert.deepEqual(frameSize(1920,1080,512),[512,288]);assert.deepEqual(frameSize(184,142,512),[184,142]);});
