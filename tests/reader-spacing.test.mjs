import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('hosted title readers retain the shared compact intro spacing',()=>{
  for(const title of ['mumbaimasa','sakura-no-uta','black-sheep-town']){
    const css=readFileSync(new URL(`../public/${title}/mao-reader-template.css`,import.meta.url),'utf8');
    const heading=css.match(/\.reader-page \.reader-intro h1\s*\{([^}]+)\}/)[1];
    assert.match(heading,/line-height:\s*1\.02;/,title);
    const description=css.match(/\.reader-page \.reader-intro > p:last-of-type\s*\{([^}]+)\}/)[1];
    assert.match(description,/margin:\s*18px 0 0;/,title);
    assert.match(description,/font-size:\s*18px;/,title);
    assert.match(description,/line-height:\s*1\.6;/,title);
    const theme=readFileSync(new URL(`../public/${title}/styles.css`,import.meta.url),'utf8');
    for(const rule of theme.matchAll(/([^{}]*\.reader-intro[^{}]*)\{([^}]+)\}/g)){
      assert.doesNotMatch(rule[2],/(?:font(?:-size)?|line-height|margin(?:-block)?|padding-block)\s*:/,`${title}: ${rule[1]}`);
    }
  }
});
