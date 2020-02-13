import React, {createContext, useState, useContext, useEffect} from 'react';
// import {Input} from 'reactstrap';
import Autosuggest from 'react-autosuggest';

import 'bootstrap/dist/css/bootstrap.min.css';
import './react-autosuggest.css';
import './refcell.css';

export const EvaluatableContext = createContext({
  
  // update the value of whole table
  evaluate: () => {},

  // get the cell data through cell path
  // the path should be an array of array index (integers);
  // if the path is empty or containing invalid index, return undefined.
  getCell: () => {},
  setCell: () => {},
  
  // get all suggestions with given input string
  getSugg:() => {},

  // get the actual value to be filled into the input, with
  // given input value and suggestion options.
  getSuggValue: () => {},
})

// Evaluatable Context
// -------------------
// provides methods of accessing evaluatable table.
// 
// Props:
// table:           The content of the evaluatable table. Evaluatable list is a recursive
//                  array, consisted of record that includes the properties, value, result,
//                  and children.
// referredTable:   The table referred by the evaluatable table.
// pathColumn:      The column as the path for looking up over the **referredTable**.
//                  Typically the human readable content, such as full name instead of code.
// evalColumnDict:  The columns participated calculation.

export const Evaluatable = ({table, referredTable, pathColumn, evalColumnDict, children}) => {

  const [vars, setVars] = useState({});

  const msg = {
    unsupp: '不支持的表达式，或者引用的数字并不存在',
    unrecog: '未识别',
    notfoundref: '未能按路径找到引用的记录'
  }

  // back traverse go through the whole table and apply
  // func to records in all levels. Notably the back traverse
  // doesn't return any value, and the func in parameter should
  // be an in-place operation as well.
  const backTraverse = (table, func) => {
    for (let record of table){
      backTraverse(record.children, func);
      func(record);
    }
  }

  const getRef = (path) => {
    let list = referredTable, ref;
    for (let seg of path) {
      ref = list.find(({[pathColumn]: pathCol}) => pathCol === seg);
      if (ref === undefined) break;
      list = ref.children;
    }
    return ref;
  }

  const evalRef = (value) => {
    const [path, expr] = value.split(':');
    const ref = getRef(path.split('/').slice(1));

    if (ref === undefined){
      return {status:'WARN', result: msg.notfoundref};
    } else if(expr.replace(/(\$([^()*/+-]+))/g, '').match(/^[()*/+-]*$/)){
      const result = eval(expr.replace(/(\$([^()*/+-]+))/g, (...args) => `(${ref[evalColumnDict[args[2]]]})` ))
      return result === undefined 
      ? {status:'WARN', result: msg.unsupp}
      : {status:'NORM', result}
    } else {
      return {status:'WARN', result: msg.unsupp}
    }
  }

  const evalFunc = (ref, value) => {
    const funcs = {
      sum(){
        let result = ref.children
          .filter(({status}) => status === 'NORM')
          .map(({result}) => result)
          .reduce((e, acc) => e + acc, 0);
        let status = ref.children.every(({status}) => status !== 'NORM') ? 'WARN' : 'NORM';
        return {result, status};
      },
      get(i){
        let {result, status} = ref.children[i];
        return {result ,status};
      }
    }

    if (Object.keys(funcs).includes(value.replace(/([^)]*)/, ''))){
      return eval(`funcs.${value}`);
    } else {
      return {result: msg.unsupp, status:'WARN'}
    }
  }

  const evalExpr = (value) => {
    if(value.replace(/(\$([^()*/+-]+))/g, '').match(/^[()*/+-]*$/)){
      return eval(value.replace(/(\$([^()*/+-]+))/g, (...args) => `(${vars[args[2]]})` ))
    } else {
      return {status:'WARN', result: msg.unrecog}
    }
  }

  const evalSingle = (record) => {
    let {value} = record;
    value = value.replace(/\s/g, '');

    let varName;
    if (value.includes('=')){
      let splitted = value.includes('=');
      varName = splitted[0];
      value = splitted[1];
    }

    if(varName && !varName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)){
      record.result = '变量名不符合规则';
      record.status = 'WARN';
      return 
    }

    if (!isNaN(parseFloat(value))){
      record.result = parseFloat(value);
      record.status = 'NORM'
    } else if (value.startsWith('@')) {
      Object.assign(record, evalFunc(record, value.slice(1)));
    } else if(value.match(/(\/[^\/]+)+:/)) {
      Object.assign(record, evalRef(value));
    } else {
      Object.assign(record, evalExpr(value));
    }

    if(varName){
      setVars(Object.assign({}, vars, {[varName]: record.result}));
    }
  }


  // This handles auto-completing path
  const getPathSugg = (path) => {
    const splitted = path.split('/').slice(1);
    
    if (splitted.length === 0){
      return referredTable.map(({[pathColumn]:col}) => `${col}`);
    }
    
    const ref = getRef(splitted);
    if (ref !== undefined){
      return ref.children.map(({[pathColumn]:pathCol}) => `${pathCol}`);
    }

    return [];
  }

  // this handles auto-completing an identifier of expression
  const getEvalSugg = () => {
    return Object.keys(evalColumnDict);
  }

  const getSugg = (input) => {
    // if the input matches the non-slash-non-semicolon substring in the end,
    // this is an incomplete path, so we remove the last incomplete segment
    // of path, and get the possible candidates.
    if (input.match(/[/][^$/]*$/)) {
      const lastSeg = input.split('/').slice(-1)[0];
      return getPathSugg(input.replace(/[/][^$/]*$/, '')).filter(cand => cand.includes(lastSeg));

    // in this case we are matching an incomplete identifier.
    } else if (input.match(/[$][^$*/+-]*$/)) {
      return getEvalSugg()
    }

    return [];
  }

  const getSuggValue = (inputPath, sugg) => {
    return inputPath.replace(/(?<=[$/])([^$/]*)$/, sugg);
  }

  const getCell = (path) => {
    let list = table, cell;
    for (let index of path){
      cell = list[index];
      if (cell === undefined) break;
      list = cell.children;
    }
    return cell;
  }

  const setCell = (path, value) => {
    let list = table, cell;
    for (let index of path){
      cell = list[index];
      if (cell === undefined) throw Error(`invalid index ${index} in list ${list}`);
      list = cell.children;
    }
    cell.value = value;
  }

  const evaluate = () => {
    backTraverse(table, evalSingle);
  };

  evaluate();

  return <EvaluatableContext.Provider value={{evaluate, getCell, setCell, getSugg, getSuggValue}}>
    {children}
  </EvaluatableContext.Provider>
}

export default ({path, disabled}) => {

  const {getCell, setCell, getSugg, getSuggValue, evaluate} = useContext(EvaluatableContext);

  const {value:val, result, status} = getCell(path);
  
  const [editing, setEditing] = useState()
  const [value, setValue] = useState(val);
  const [suggestions, setSugg] = useState([]);
  
  // the method below will be directly used by Autosuggest
  // check: https://github.com/moroshko/react-autosuggest
  const funcs = {
    getSuggestionValue : (sugg) => getSuggValue(value, sugg),
    renderSuggestion : (sugg) => <div>{sugg.toString()}</div>,
    onSuggestionsFetchRequested : ({ value }) => setSugg(getSugg(value)),
    onSuggestionsClearRequested : () => setSugg([]),
    onSuggestionSelected : (e, {suggestionValue}) => {
      setValue(suggestionValue);
      setCell(path, suggestionValue);
    },
  }

  const inputProps = {
    value,
    id: 'sugg-input',
    autoFocus: true,
    onChange:(e, {newValue}) => {
      setValue(newValue);
    },
    onBlur:(e) => {
      setCell(path, value)
      setEditing(false);
      evaluate();
    }
  }

  return editing
  ? <div className="refcell-line"><Autosuggest {...{...funcs, suggestions, inputProps}} ref={() => { document.getElementById('sugg-input').focus(); }} /></div>
  : <div className="refcell-line" onClick={() => !disabled && setEditing(true)}>
      <div className="react-autosuggest__input" style={{width:'auto'}}>{val}</div>
      {result && <div className={`refcell-badge ${status.toLowerCase()}`}>{result}</div>}
    </div>
}