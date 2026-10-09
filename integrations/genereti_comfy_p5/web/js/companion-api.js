// Public, versioned browser bridge: companions do not import extension aliases.
import {app} from '/scripts/app.js';
import {publishLive,attachExecutionMode} from './live-runtime.js';
import {visualNodeControls} from '/extensions/genereti_comfy_stream/js/node-output-view.js';
import {ensureControlStyle} from './control-style.js';
app.registerExtension({name:'Genereti.CompanionAPI',setup(){
 window.generetiCompanion={version:1,publishLive,attachExecutionMode,visualNodeControls,ensureControlStyle};
 window.dispatchEvent(new Event('genereti-companion-ready'));
}});
