import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mixerChannelCount} from '../integrations/genereti_comfy_chop/web/mixer-layout.js';
test('mixer strips follow connected inputs and retain sparse socket numbering',()=>{
 const inputs=Array.from({length:8},(_,i)=>({name:`input_${i+1}`,link:null}));
 assert.equal(mixerChannelCount(inputs),1);
 inputs[2].link=17;assert.equal(mixerChannelCount(inputs),3);
 inputs[6].link=18;assert.equal(mixerChannelCount(inputs),7);
 inputs[6].link=null;assert.equal(mixerChannelCount(inputs),3);
 inputs[2].link=null;assert.equal(mixerChannelCount(inputs),1);
});
