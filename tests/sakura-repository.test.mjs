import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

test('Sakura links to its independent project without shadowing its Pages site',()=>{
  const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(home,/href="\/sakura-no-uta\/"/);
  assert.ok(existsSync(new URL('../public/sakura-no-uta-box-art.webp',import.meta.url)));
  assert.equal(existsSync(new URL('../public/sakura-no-uta',import.meta.url)),false,
    'Sakura now belongs to MAO-TLs/sakura-no-uta; do not republish a stale homepage copy');
});
