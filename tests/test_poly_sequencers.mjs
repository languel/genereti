import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseNoteSteps,formatNoteSteps,parseDrumPattern,formatDrumPattern} from '../integrations/genereti_comfy_chop/web/audio-ui-core.js';
import {pattern,events,noteFrame,heldNotes,transformPattern} from '../integrations/genereti_comfy_chop/web/audio-sequence.js';
import {readTracks,writeTracks,trackRows,readPianoRoll,pianoRows} from '../integrations/genereti_comfy_chop/web/multitrack-sequence.js';
test('velocity edits round-trip while existing note and drum patterns remain valid',()=>{
 const notes=parseNoteSteps('60@0.35 - 67');assert.equal(formatNoteSteps(notes),'60@0.35 - 67');assert.equal(events(pattern('60@0.35 - 67'),0,0,.2,.8)[0].velocity,.8*.35);
 let drums=parseDrumPattern('kick:1003;snare:0010');drums[0].steps[0]=.65;const encoded=formatDrumPattern(drums);assert.equal(parseDrumPattern(encoded)[0].steps[0],.65);assert.equal(events(pattern(encoded,true),0,0,.1,1)[0].velocity,.65);
 assert.equal(parseDrumPattern('kick:v0.65')[0].steps[0],.65);
 assert.equal(transformPattern('60@0.35 - 67@0.8','reverse'),'67@0.8 - 60@0.35');
});
test('independent Euclidean and circle tracks produce simultaneous notes with per-track velocities',()=>{
 const tracks=[{steps:4,pulses:2,rotation:0,note:36,velocity:.5},{steps:3,pulses:1,rotation:0,note:38,velocity:.8}];const saved=writeTracks(tracks),read=readTracks(saved);assert.equal(read.length,2);
 const rows=trackRows(read);const hit=events(rows,0,0,.25,1);assert.deepEqual(hit.map(e=>e.note),[36,38]);assert.deepEqual(hit.map(e=>e.velocity),[.5,.8]);assert.equal(events(rows,2,0,.25,1).length,1);
 const circle=readTracks(JSON.stringify({version:1,tracks:[{steps:4,note:42,pattern:'0101'}]}),'circle');assert.equal(events(trackRows(circle,'circle'),1,0,.1,1)[0].note,42);
 circle[0].velocities[1]=.4;assert.equal(events(trackRows(readTracks(writeTracks(circle),'circle'),'circle'),1,0,.1,1)[0].velocity,.4);
 const old=readTracks('','euclidean',{steps:8,pulses:3,rotation:1,note:60});assert.equal(old.length,1);assert.equal(old[0].note,60);
});
test('piano roll schedules chords and durations and exposes sustained notes',()=>{
 const doc=readPianoRoll(JSON.stringify({version:1,steps:8,notes:[{pitch:60,start:0,length:4,velocity:.5},{pitch:64,start:0,length:2,velocity:.8}]})),rows=pianoRows(doc);const hit=events(rows,0,3,.1,1,1,.25);
 assert.deepEqual(hit.map(e=>[e.note,e.duration,e.velocity]),[[60,1,.5],[64,.5,.8]]);
 const at1=heldNotes(noteFrame(rows,1,true,1,0,4));assert.deepEqual(at1.map(n=>n.note),[60,64]);const at2=heldNotes(noteFrame(rows,2,true,1,0,4));assert.deepEqual(at2.map(n=>n.note),[60]);
 assert.deepEqual(events(pianoRows(readPianoRoll('{"version":1,"steps":8,"notes":[]}')),0,0,.1,1),[]);
 assert.throws(()=>readPianoRoll('{"version":1,"steps":8,"notes":null}'));
});
