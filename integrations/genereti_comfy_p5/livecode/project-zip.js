import {zipSync,strToU8} from 'fflate';
export function projectZip(files){return zipSync(Object.fromEntries(Object.entries(files).map(([name,text])=>[name,typeof text==='string'?strToU8(text):text])),{level:6});}
