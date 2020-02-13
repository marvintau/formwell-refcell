const vowels = ['ar', 'ra', 're', 'co', 'mo', 'ge', 'be', 'ti'],
      ends = ['ll', 'st', 'lt', 'sch', 'ius'];

function genName(vowelMinLen=4, vowelMaxLen=8, {end=true, capital=true}={}){
  let len = Math.floor(Math.random()*(vowelMaxLen-vowelMinLen) + vowelMinLen);

  // avoiding same vowel repeats too many times in a name.
  let vowelMarked = vowels.map(e => ({key:e, rem:2}));

  let name = '';
  for (let i = 0; i < len; i++){
    const vowelIndex = Math.floor(Math.random()*vowels.length);
    const {key, rem} = vowelMarked[vowelIndex];
    if(rem > 0){
      vowelMarked[vowelIndex].rem --;
      name += key;
    }
  }

  // Both to make it looks more like a real name.
  if (end) {
    let endVowel = ends[Math.floor(Math.random()*ends.length)];
    name += endVowel;
  }

  if (capital){
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return name;
}

const PROB = 0.1;
function recursivePush(list, field, entry){
  let listRef = list,
      prefix = '';
  
  while(true) notFoundClosestAncestorYet:{
    for (let {[field]: col, children} of listRef){
      if(Math.random() < PROB){
        listRef = children;
        prefix = col;
        break notFoundClosestAncestorYet;
      }
    }

    // When for loop ends and we reach here, we have
    // found the closest ancestor: the owner of listRef.
    let randAdd = Math.random().toString(36).substring(11);
    listRef.push({...entry, [field]:`${prefix}${randAdd}`});
    break;
  }
}

export function genCascadedNameEntries(length){

  let entries = [];
  for (let i = 0; i < length; i++){
    recursivePush(entries, 'name', {
      desc: genName(3, 6),
      key:i,
      mb:Math.random()*10,
      me:Math.random()*10,
      mc:Math.random()*10,
      md:Math.random()*10,
      children:[]
    });
  }

  return entries;
}