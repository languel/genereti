// Transform only explicit selections; no selection means the whole document.
export async function transformEditorSelection(editor,transform){
 const source=editor.state.doc.toString(),ranges=editor.state.selection.ranges;
 const selected=ranges.filter(range=>!range.empty&&range.from!==range.to);
 const targets=selected.length?selected:[{from:0,to:source.length}];
 const signature=JSON.stringify(ranges.map(({from,to})=>[from,to]));
 const changes=await Promise.all(targets.map(async({from,to})=>({from,to,insert:await transform(source.slice(from,to))})));
 if(editor.state.doc.toString()!==source||JSON.stringify(editor.state.selection.ranges.map(({from,to})=>[from,to]))!==signature)throw Error('Draft or selection changed · format again');
 let offset=0;const selections=changes.map(change=>{const anchor=change.from+offset;offset+=change.insert.length-(change.to-change.from);return {anchor,head:anchor+change.insert.length};});
 editor.replaceRanges(changes,selections);
}
