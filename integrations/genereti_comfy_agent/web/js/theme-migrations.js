// Upgrade shipped defaults field by field so deliberate user palette edits survive.
export function upgradeDarkPalette(saved,current,previous){
 if(!saved||saved.id!=='genereti-dark')return saved;
 const result=structuredClone(saved);
 for(const [group,colors] of Object.entries(current.colors)){
  result.colors??={};result.colors[group]??={};
  for(const [key,value] of Object.entries(colors))if(result.colors[group][key]===undefined||result.colors[group][key]===previous.colors[group]?.[key])result.colors[group][key]=value;
 }
 result.genereti={...result.genereti,revision:3};return result;
}
