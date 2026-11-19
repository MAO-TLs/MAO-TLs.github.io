import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

test('Sakura links to its independent project without shadowing its Pages site',()=>{
  const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(home,/href="\/sakura-no-uta\/"/);
  const card=home.match(/<article class="release-card release-card-sakura">[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.match(card,/English translation · v1\.1\.4<\/p>/);
  assert.ok(existsSync(new URL('../public/sakura-no-uta-box-art.webp',import.meta.url)));
  assert.equal(existsSync(new URL('../public/sakura-no-uta',import.meta.url)),false,
    'Sakura now belongs to MAO-TLs/sakura-no-uta; do not republish a stale homepage copy');
});
