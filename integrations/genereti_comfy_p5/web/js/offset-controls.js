import {app} from '../../../scripts/app.js';
import {migrateOffsetControls} from './offset-control-migration.js';
app.registerExtension({name:'Genereti.OffsetControls',beforeConfigureGraph(graph){
 for(const node of graph.nodes??[])migrateOffsetControls(node);
}});
