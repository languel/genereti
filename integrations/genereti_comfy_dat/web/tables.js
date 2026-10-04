export function parseCSV(source,delimiter=','){
 const rows=[],row=[];let cell='',quoted=false;
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&c===delimiter){row.push(cell);cell='';}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);rows.push(row.splice(0));cell='';}else cell+=c;}
 if(quoted)throw Error('Unterminated CSV quote');if(cell||row.length||source&&!/[\r\n]$/.test(source)){row.push(cell);rows.push(row);}return {rows};
}
export function csv(data){return data.rows.map(row=>row.map(cell=>/[",\n\r]/.test(cell)?'"'+String(cell).replaceAll('"','""')+'"':cell).join(',')).join('\n')+(data.rows.length?'\n':'');}
const cell=v=>v===null||typeof v==='object'||typeof v==='boolean'?JSON.stringify(v):String(v);
export function fromJSON(source){const value=JSON.parse(source);if(Array.isArray(value)){if(value.length&&value.every(v=>v&&typeof v==='object'&&!Array.isArray(v))){const keys=[...new Set(value.flatMap(Object.keys))];return {rows:[keys,...value.map(row=>keys.map(k=>cell(Object.hasOwn(row,k)?row[k]:'')))]};}return {rows:value.map(v=>(Array.isArray(v)?v:[v]).map(cell))};}if(value&&typeof value==='object')return {rows:[['key','value'],...Object.entries(value).map(([k,v])=>[k,cell(v)])]};return {rows:[[cell(value)]]};}
