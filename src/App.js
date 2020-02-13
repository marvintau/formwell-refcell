import React from 'react';

import Refcell, {Evaluatable} from './Refcell';
import {genCascadedNameEntries} from './nameGenerate';

const nameEntries = genCascadedNameEntries(100);
console.log(nameEntries);

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
  </div>
}