// Extract measurements, not prose, for the optional compact node readout.
export function compactStatus(text){
 const source=String(text??'').replace(/\s+/g,' ').replace(/(\d(?:\.\d+)?)\s+(?:delivered|rendered)\s+fps\b/gi,'$1 fps'),matches=[],seen=new Set();
 const add=value=>{const key=value.toLowerCase();if(!seen.has(key)){seen.add(key);matches.push(value);}};
 const pattern=/\b(?:RMS|peak|FPS|updates\/s|jitter|delay|interval|count)\s*[:=]?\s*-?(?:\d+(?:\.\d+)?|\.\d+)(?:\s*(?:ms|Hz|dB|%|fps))?|\b\d+(?:\.\d+)?\s*[×x]\s*\d+(?:\.\d+)?|\b-?\d+(?:\.\d+)?\s*(?:BPM|fps|kHz|Hz|ms|dB|samples\/s|blocks\/s|channels|samples|px|seconds|sec)\b|\b-?\d+(?:\.\d+)?\s*%/gi;
 for(const match of source.matchAll(pattern)){let part=match[0].replace(/\s+/g,' ').trim().replace(/\bBPM\b/gi,'bpm').replace(/\bchannels\b/gi,'ch').replace(/\bsamples\b/gi,'smp').replace(/\bseconds\b/gi,'s').replace(/\bFPS\s*:\s*/i,'');if(/^\d+(?:\.\d+)?$/.test(part)&&/^fps/i.test(match[0]))part+=' fps';add(part);if(matches.length>=4)break;}
 return matches.join(' · ');
}
