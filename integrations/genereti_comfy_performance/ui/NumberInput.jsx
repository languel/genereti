import React,{useState} from 'react';

// Preserve a text draft while typing; the running patch keeps its last value
// until the draft is a finite number inside the declared range.
export default function NumberInput({value,onChange,...props}){
 const [draft,setDraft]=useState(null);
 const valid=text=>text.trim()!==''&&Number.isFinite(Number(text))&&(props.min===undefined||Number(text)>=Number(props.min))&&(props.max===undefined||Number(text)<=Number(props.max));
 return <input {...props} type="number" value={draft??value} onFocus={()=>setDraft(String(value))} onChange={e=>{setDraft(e.target.value);if(valid(e.target.value))onChange?.(e);}} onBlur={()=>setDraft(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')e.currentTarget.blur();}}/>;
}
