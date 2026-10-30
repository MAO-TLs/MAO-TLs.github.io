import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {matchingRows, stateFromURL, readerURL, contextURL, batchEnd} from '../public/sakura-no-uta/script/reader.mjs';
const root=new URL('../public/sakura-no-uta/',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

test('Sakura releases the complete verified corpus and patch instructions',()=>{
  const index=JSON.parse(read('data/index.json'));
  assert.equal(index.scripts,285);
  assert.equal(index.passages,65164);
  assert.equal(index.scriptsIndex.length,285);
  assert.equal(new Set(index.scriptsIndex.map(s=>s.id)).size,285);
  assert.equal(index.scriptsIndex.reduce((n,s)=>n+s.count,0),65164);
  const home=read('index.html'), reader=read('script/index.html');
  assert.match(home,/Download English patch/);
  assert.match(home,/<h1 id="title">SAKURA<br \/>NO UTA<\/h1>\s*<p class="dek">/);
  assert.doesNotMatch(home,/japanese-title/);
  assert.match(home,/Patch version v1\.0\.1/);
  assert.match(home,/href="#install"/);
  assert.match(home,/id="install"/);
  assert.match(reader,/Script version v1\.0\.1/);
  assert.match(home,/Updating an earlier MAO patch/);
  assert.match(home,/Removing the patch/);
  assert.match(home,/The game still shows Japanese or old text/);
  assert.match(home,/10th Anniversary edition/);
  assert.match(home,/Native Windows and a manual start-to-finish playthrough have not been verified/);
  assert.match(home+reader,/A legally acquired copy/);
  assert.doesNotMatch(home+reader,/MUMBAI|Hinglish|14,839|Complete draft|in development|Not released|not yet published/i);
});

test('every reader passage and search entry agrees, with only inert presentation HTML',()=>{
  const index=JSON.parse(read('data/index.json'));
  const search=JSON.parse(read('data/search.json'));
  const expected=[];
  let rubies=0, choices=0;
  for(const script of index.scriptsIndex) {
    const raw=read('data/scripts/'+script.id+'.json');
    assert.equal(createHash('sha256').update(raw).digest('hex'),script.sha256);
    const {rows}=JSON.parse(raw);
    assert.equal(rows.length,script.count);
    assert.equal(new Set(rows.map(r=>r.key)).size,rows.length);
    for(const row of rows) {
      for(const lang of ['ja','en']) {
        assert.ok(row[lang].text.trim());
        assert.ok(row[lang].html.trim());
        const tags=[...row[lang].html.matchAll(/<\/?([a-z]+)([^>]*)>/g)];
        for(const [,tag,attrs] of tags) {
          assert.ok(['span','div','ruby','rt','br','ul','li'].includes(tag),tag);
          assert.match(attrs,/^(?: class="[a-z0-9-]+")?$/);
        }
        assert.doesNotMatch(row[lang].html,/<script|onerror|source_ja_payload|revision_notes/);
      }
      rubies+=(row.ja.html.match(/<ruby>/g)||[]).length;
      choices+=row.en.html.includes('class="reader-choices"')?1:0;
      assert.doesNotMatch(row.en.html,/<ruby>/);
      expected.push({script:script.id,key:row.key,ja:row.ja.text,en:row.en.text});
    }
  }
  assert.equal(rubies,524);
  assert.equal(choices,17);
  assert.deepEqual(search,expected);
});

test('download metadata and instructions identify the accepted game patch',()=>{
  const patch=JSON.parse(read('patch-release.json'));
  const home=read('index.html'),guide=read('patch-installation.txt');
  assert.equal(patch.version,'1.0.1');
  assert.equal(patch.passages,65164);
  assert.equal(patch.patchSha256,'3f4e910566d6733f659fd68b43dea9adb33173858be9445b5c5c92b9154dd32b');
  assert.ok(home.includes(patch.downloadUrl));
  assert.ok(home.includes(patch.releaseUrl));
  assert.ok(guide.includes(patch.patchSha256));
  assert.match(guide,/UPDATE[\s\S]*REMOVE \/ RETURN TO JAPANESE[\s\S]*TROUBLESHOOTING/);
  assert.match(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),/href="\/sakura-no-uta\/"/);
});

test('Sakura retains the shared reader typography and working local assets',()=>{
  for(const file of ['mao-reader-template.css','mao-publication-template.css']) {
    assert.equal(read(file),readFileSync(new URL('../public/mumbaimasa/'+file,import.meta.url),'utf8'));
  }
  for(const page of ['index.html','script/index.html']) {
    const html=read(page), base=new URL(page,root);
    for(const [,link] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if(link.startsWith('/')||/^(?:https?:|mailto:)/.test(link))continue;
      const target=new URL(link,base);
      if(target.pathname.endsWith('/'))target.pathname+='index.html';
      assert.ok(existsSync(target),page+': '+link);
    }
  }
});

test('Sakura current and corpus schemas use whole-word English search',()=>{
  const rows=[{key:'1',en:{text:'Dora.'},ja:{text:'名前'}},{key:'2',en:{text:'Adorable.'},ja:{text:'可愛い'}}];
  assert.deepEqual(matchingRows(rows,'dora').map(r=>r.key),['1']);
  assert.equal(matchingRows([{en:'Dora’s name',ja:'名前'}],'dora').length,1);
  assert.equal(matchingRows([{en:'',ja:'桜の花が咲く'}],'桜の花').length,1);
  assert.equal(batchEnd(0,170,false),170);
  assert.equal(batchEnd(0,170,true),80);
});

test('Sakura navigation preserves search and rejects external back links',()=>{
  const base='https://mao-tls.github.io/sakura-no-uta/script/';
  assert.equal(stateFromURL(base,[]).script,'');
  const url=contextURL(base,'sample','99','Dora',base+'?scope=corpus&q=Dora');
  const state=stateFromURL(url,[{id:'sample'}]);
  assert.equal(state.line,'99');
  assert.equal(state.highlight,'Dora');
  assert.equal(state.back,'/sakura-no-uta/script/?scope=corpus&q=Dora');
  assert.equal(readerURL(base,{back:'https://example.com/'}).search,'');
});
