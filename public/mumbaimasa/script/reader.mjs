const PAGE_SIZE = 80;
export function passageCount(count, matching = false) {
  return count.toLocaleString() + (matching ? ' matching ' : ' ') + (count === 1 ? 'passage' : 'passages');
}
export function passageScrollTop(top, scrollY, stickyHeight) {
  return Math.max(0, top + scrollY - stickyHeight - 16);
}
export function batchEnd(shown, total, corpusSearch) {
  return corpusSearch ? Math.min(shown + PAGE_SIZE, total) : total;
}
export function stateFromURL(url, scripts) {
  const p = new URL(url).searchParams;
  const fallback = scripts[0]?.id || 'ma00_000';
  const script = scripts.some(s => s.id === p.get('script')) ? p.get('script') : fallback;
  return {script, scope: p.get('scope') === 'corpus' ? 'corpus' : 'script',
    q: (p.get('q') || '').slice(0, 300), line: p.get('line') || '',
    highlight: (p.get('highlight') || '').slice(0, 300), back: p.get('back') || ''};
}
export function readerURL(base, state) {
  const url = new URL(base);
  url.search = ''; url.hash = '';
  for (const key of ['script','scope','q','line','highlight']) if (state[key]) url.searchParams.set(key, state[key]);
  if (state.back) {
    const back = new URL(state.back, base);
    // Back links stay in this reader, not an attacker-supplied external page.
    if (back.origin === url.origin && back.pathname === url.pathname) url.searchParams.set('back', back.pathname + back.search);
  }
  return url;
}
export function matchingRows(rows, query) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return rows;
  return rows.filter(row => ((typeof row.en === 'string' ? row.en : row.en.text) + '\n' +
    (typeof row.ja === 'string' ? row.ja : row.ja?.text || '')).toLocaleLowerCase().includes(q));
}
export function contextURL(base, script, key, query, back) {
  return readerURL(base, {script, line:key, scope:'script', highlight:query, back});
}

async function startReader() {
  const $ = id => document.getElementById(id);
  const results = $('script-results'), status = $('status');
  let index, state, currentRows = [], matches = [], shown = 0, request = 0, searchData;
  const cache = new Map();
  const dataURL = name => new URL('../data/' + name, import.meta.url);
  async function getJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Could not load reader data (' + response.status + ').');
    return response.json();
  }
  async function scriptRows(script) {
    if (!cache.has(script)) cache.set(script, getJSON(dataURL('scripts/' + encodeURIComponent(script) + '.json')));
    return (await cache.get(script)).rows;
  }
  function option(value, text) {
    const el = document.createElement('option'); el.value = value; el.textContent = text; return el;
  }
  function updateControls() {
    const section = index.scriptsIndex.find(s => s.id === state.script).section;
    $('section').value = section;
    $('scene').replaceChildren(...index.scriptsIndex.filter(s=>s.section===section).map(s=>option(s.id, s.id + (s.count ? ' · ' + passageCount(s.count) : ' · control file'))));
    $('scene').value = state.script;
    $('search').value = state.q;
    for (const input of document.querySelectorAll('input[name="scope"]')) input.checked = input.value === state.scope;
    const i = index.scriptsIndex.findIndex(s=>s.id===state.script);
    $('previous').disabled = i === 0; $('next').disabled = i === index.scriptsIndex.length-1;
    $('script-title').textContent = state.scope === 'corpus' && state.q.trim() ? 'All-script search' : state.script;
    $('script-position').textContent = 'Scene ' + (i+1) + ' of ' + index.scripts + ' · ' + index.passages.toLocaleString() + ' passages';
    const back = $('back-results'); back.hidden = true;
    if (state.back) {
      const b = new URL(state.back, location.href);
      if (b.origin === location.origin && b.pathname === location.pathname) {back.href = b; back.hidden = false;}
    }
  }
  function highlight(node, query) {
    if (!query.trim()) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
    const q = query.toLocaleLowerCase();
    for (const text of nodes) {
      const value = text.nodeValue, lower = value.toLocaleLowerCase();
      let at=0, next=lower.indexOf(q); if(next<0) continue;
      const fragment=document.createDocumentFragment();
      while(next>=0) {
        fragment.append(document.createTextNode(value.slice(at,next)));
        const mark=document.createElement('mark'); mark.textContent=value.slice(next,next+query.length); fragment.append(mark);
        at=next+query.length; next=lower.indexOf(q,at);
      }
      fragment.append(document.createTextNode(value.slice(at))); text.replaceWith(fragment);
    }
  }
  function passage(row, script, query) {
    const article=document.createElement('article'); article.className='script-line';
    article.id='line-'+script+'-'+row.key; article.tabIndex=-1;
    article.setAttribute('aria-label', script + ', passage ' + row.key);
    const ref=document.createElement('div'); ref.className='line-ref';
    const link=document.createElement('a'); link.textContent=row.key;
    link.href=readerURL(location.href,{script,scope:'script',line:row.key}); link.title='Link to passage '+row.key; ref.append(link); article.append(ref);
    for (const [edition,label,lang] of [['ja','Japanese','ja'],['en','MAO Hinglish','en']]) {
      const cell=document.createElement('div'); cell.className='line-cell '+(edition==='ja'?'line-japanese':'line-english'); cell.lang=lang;
      const hidden=document.createElement('span'); hidden.className='line-language'; hidden.textContent=label; cell.append(hidden);
      const content=document.createElement('div'); content.className='line-text';
      if (!row[edition]) throw new Error('Incomplete bilingual reader data.');
      content.innerHTML=row[edition].html; // exporter admits inert, escaped presentation markup only
      highlight(content,query); cell.append(content); article.append(cell);
    }
    if (row.key===state.line && script===state.script) article.classList.add('script-line-target');
    return article;
  }
  function empty(text) {
    const p=document.createElement('p'); p.className='empty-state'; p.textContent=text; results.replaceChildren(p);
  }
  async function appendMatches(token) {
    const corpus=state.scope==='corpus' && state.q.trim();
    const end=batchEnd(shown,matches.length,Boolean(corpus)), fragment=document.createDocumentFragment();
    for(let i=shown;i<end;i++) {
      if(token!==request) return;
      const hit=matches[i];
      if(corpus) {
        const rows=await scriptRows(hit.script); if(token!==request) return;
        const row=rows.find(r=>r.key===hit.key); if(!row) continue;
        const group=document.createElement('section'); group.className='concordance-hit';
        const heading=document.createElement('div'); heading.className='hit-heading';
        const title=document.createElement('span'); title.textContent=hit.script+' · passage '+hit.key;
        const a=document.createElement('a'); a.className='hit-context'; a.textContent='Open in context →';
        a.href=contextURL(location.href,hit.script,hit.key,state.q,location.href);
        heading.append(title,a); group.append(heading,passage(row,hit.script,state.q)); fragment.append(group);
      } else fragment.append(passage(hit,state.script,state.q || state.highlight));
    }
    if(token!==request)return;
    results.append(fragment); shown=end; $('more').hidden=shown>=matches.length;
    $('more').textContent='Show more ('+(matches.length-shown).toLocaleString()+' remaining)';
  }
  async function show() {
    const token=++request; updateControls(); results.setAttribute('aria-busy','true'); $('more').hidden=true;
    status.textContent='Loading…';
    try {
      currentRows=await scriptRows(state.script); if(token!==request)return;
      const corpus=state.scope==='corpus' && state.q.trim();
      if(corpus) {
        if(!searchData)searchData=await getJSON(dataURL('search.json'));
        if(token!==request)return;
        matches=matchingRows(searchData,state.q);
      } else matches=matchingRows(currentRows,state.q);
      results.replaceChildren(); shown=0;
      if(!matches.length) empty(state.q.trim()?'No matching passages. Try another phrase or search all scripts.':'This is a control-flow file with no prose passages.');
      else {
        // A deep link must load its actual passage even beyond the first page.
        if(!corpus && state.line && !state.q) {
          const at=matches.findIndex(r=>r.key===state.line);
          while(shown<=at && shown<matches.length) await appendMatches(token);
        } else await appendMatches(token);
      }
      if(token!==request)return;
      status.textContent=state.q.trim()?passageCount(matches.length,true)+(corpus?' across all scripts':' in this script'):
        passageCount(currentRows.length)+' · Japanese / MAO Hinglish';
      if(state.line)requestAnimationFrame(()=>{
        if(token!==request)return;
        const target=document.getElementById('line-'+state.script+'-'+state.line);
        if(!target)return;
        const controls=document.querySelector('.reader-controls');
        const stickyHeight=getComputedStyle(controls).position==='sticky'?controls.getBoundingClientRect().height:0;
        // A source block can contain a long exchange. Centering it hides the
        // beginning above the viewport and makes the passage look truncated.
        window.scrollTo({top:passageScrollTop(target.getBoundingClientRect().top,window.scrollY,stickyHeight)});
      });
    } catch(error) {
      if(token!==request)return;
      empty(error.message+' Please reload the page.'); status.textContent='Reader data could not be loaded.';
    } finally {if(token===request)results.setAttribute('aria-busy','false');}
  }
  function navigate(next, replace=false) {
    state={...state,...next};
    const url=readerURL(location.href,state);
    history[replace?'replaceState':'pushState']({},'',url); show();
  }
  try {
    index=await getJSON(dataURL('index.json'));
    $('section').replaceChildren(...index.sections.map(s=>option(s,s.toUpperCase())));
    state=stateFromURL(location.href,index.scriptsIndex);
    for(const id of ['section','scene','search'])$(id).disabled=false;
    $('section').addEventListener('change',()=>navigate({script:index.scriptsIndex.find(s=>s.section===$('section').value).id,line:'',back:'',highlight:''}));
    $('scene').addEventListener('change',()=>navigate({script:$('scene').value,line:'',back:'',highlight:''}));
    for(const [id,step] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{
      const i=index.scriptsIndex.findIndex(s=>s.id===state.script); const s=index.scriptsIndex[i+step];
      if(s)navigate({script:s.id,line:'',back:'',highlight:''});
    });
    for(const input of document.querySelectorAll('input[name="scope"]'))input.addEventListener('change',()=>navigate({scope:input.value,line:'',back:'',highlight:''}));
    let timer;
    $('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>navigate({q:$('search').value,line:'',back:'',highlight:''},true),180);});
    $('more').addEventListener('click',()=>appendMatches(request));
    window.addEventListener('popstate',()=>{state=stateFromURL(location.href,index.scriptsIndex);show();});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){event.preventDefault();$('search').focus();}});
    // Reader-internal links use real URLs; browser Back returns to the exact search.
    document.addEventListener('click',event=>{
      const a=event.target.closest('a'); if(!a||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button)return;
      const u=new URL(a.href,location.href);
      if(u.origin===location.origin&&u.pathname===location.pathname&&u.search){event.preventDefault();history.pushState({},'',u);state=stateFromURL(u,index.scriptsIndex);show();}
    });
    await show();
  } catch(error) {status.textContent='Reader unavailable.';empty(error.message);}
}
if (typeof document !== 'undefined') startReader();
