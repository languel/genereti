import {app} from '../../../scripts/app.js';
import {P5_VERSIONS,p5Assets} from './p5-project.js';
const id='Genereti.Livecode.p5Version';
export function p5Options(node){return {...node.properties?.generetiP5,version:node.properties?.generetiP5?.version||app.ui.settings.getSettingValue(id,P5_VERSIONS[0])};}
export function resolvedP5Assets(node){return p5Assets(p5Options(node));}
app.registerExtension({name:'Genereti.P5Defaults',settings:[{id,name:'Default p5 version',category:['Genereti','Livecode','p5 version'],type:'combo',options:P5_VERSIONS,defaultValue:P5_VERSIONS[0],tooltip:'Bundled p5 version for new runs and project exports. Existing working output keeps its evaluated version until Run.'}]});
