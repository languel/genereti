import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analysisSettings,saveAnalysisSetting,hydrateAnalysisSettings} from '../integrations/genereti_comfy_chop/web/analysis-settings.js';
import {axisSample} from '../integrations/genereti_comfy_chop/web/audio-analysis.js';
test('axis changes survive a missing server widget and migrate when its schema arrives',()=>{
 const node={widgets:[],properties:{},graph:{change(){}}};
 saveAnalysisSetting(node,'x_axis','left_delta');saveAnalysisSetting(node,'y_axis','time');
 const restored={widgets:[],properties:JSON.parse(JSON.stringify(node.properties))};
 assert.equal(analysisSettings(restored).x_axis,'left_delta');
 assert.equal(axisSample([.2,.8],[.4,.2],analysisSettings(restored).x_axis,1),.8-.2);
 restored.widgets=[{name:'x_axis',value:'left'},{name:'y_axis',value:'right'}];hydrateAnalysisSettings(restored);
 assert.equal(restored.widgets[0].value,'left_delta');assert.equal(restored.widgets[1].value,'time');assert.deepEqual(analysisSettings(restored),{});
 saveAnalysisSetting(restored,'x_axis','side');assert.equal(restored.widgets[0].value,'side');
});
