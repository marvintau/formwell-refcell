import React from 'react';
import List from 'formwell-viewport';
import Refcell, {Evaluatable} from './Refcell';
import {genCascadedNameEntries} from './nameGenerate';

const nameEntries = genCascadedNameEntries(100);
console.log(nameEntries);

const ColRenderer = ({children}) => 
  <div style={{margin:'0.5rem'}}>{children}</div>;

const HistColRenderer = ({children}) =>
  <div style={{margin:'0.5rem'}}>{children}</div>;

const HeaderColRenderer = ({children}) =>
  <div style={{margin:'0.5rem'}}>{children}</div>;

const colSpecs = {
  name: {desc: '名称', width: 2, isSortable: false, isFilterable: false, ColRenderer, HistColRenderer, HeaderColRenderer},
  desc: {desc: '描述', width: 6, isSortable:  true, isFilterable:  true, ColRenderer, HistColRenderer, HeaderColRenderer},
  mb: {desc: '期初', width: 1, isSortable:  true, isFilterable:  true, ColRenderer, HistColRenderer, HeaderColRenderer},
  mc: {desc: '贷方', width: 1, isSortable:  true, isFilterable:  true, ColRenderer, HistColRenderer, HeaderColRenderer},
  md: {desc: '借方', width: 1, isSortable:  true, isFilterable:  true, ColRenderer, HistColRenderer, HeaderColRenderer},
  me: {desc: '期末', width: 1, isSortable:  true, isFilterable:  true, ColRenderer, HistColRenderer, HeaderColRenderer},
}


const table = [
  {desc: 'example', value: 'exmaple1', children: []},
  {desc: 'example2', value: 'example2', children: []}
]

const evalColumnDict = {
  借方 : 'md',
  贷方 : 'mc',
  期初 : 'mb',
  期末 : 'me'
}

export default () => {
  return <div className="App">
    <Evaluatable {...{table, referredTable:nameEntries, pathColumn:'desc', evalColumnDict}}>
      {table.map((rec, i) => <Refcell key={i} path={[i]} disabled={false} />)}
    </Evaluatable>
    <List data={nameEntries} colSpecs={colSpecs} />
  </div>
}