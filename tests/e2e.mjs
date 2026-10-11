// End-to-end + stress tests for the app, run against a local static server in headless Chromium.
// Firebase is blocked; social tests swap in an in-memory `cloud` so leagues, followers and the feed can be exercised.
// Run: npm i --no-save playwright gsap@3.12.5 && node tests/e2e.mjs   (SHOTS=dir to save screenshots)
import {chromium} from 'playwright';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),SHOTS=process.env.SHOTS,PORT=8123;
const require=createRequire(import.meta.url);let GSAP;try{GSAP=require.resolve('gsap/dist/gsap.min.js',{paths:[process.cwd(),ROOT]})}catch{}
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p==='/')p='/index.html';const f=path.join(ROOT,p);
 if(!f.startsWith(ROOT))return r.writeHead(403).end();fs.readFile(f,(e,d)=>{if(e)return r.writeHead(404).end();r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'text/plain'});r.end(d)})}).listen(PORT);
const browser=await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')?{executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}:{});
let fails=0,passes=0;const ok=(c,n)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n)}};
const MOCK=()=>{const P={u2:{username:'sam_k',avatar:'🦊',avMode:'emoji',xp:900,streak:12,weekId:'',weekXp:140,league:0,level:8,following:['me','u3'],feed:[{k:'back',v:35,t:Date.now()-36e5},{k:'streak',v:30,t:Date.now()-72e5}]},
 u3:{username:'zoe_b',avatar:'🐼',avMode:'char',char:{hair:6,skin:4},xp:300,streak:3,weekId:'',weekXp:60,league:0,level:4,following:['me'],feed:[{k:'promo',v:1,t:Date.now()-5e6}]},
 u4:{username:'kai_r',avatar:'🦁',xp:120,streak:1,weekId:'',weekXp:20,league:0,level:2,following:[],feed:[]}};
 const wk=()=>{const d=new Date();d.setDate(d.getDate()-(d.getDay()+6)%7);return d.toLocaleDateString('en-CA')};Object.values(P).forEach(p=>p.weekId=wk());
 const N={sam_k:'u2',zoe_b:'u3',kai_r:'u4'},A=Object.entries;
 window.cloud={google:async()=>{},signUp:async()=>{},signIn:async()=>{},reset:async()=>{},signOut:async()=>window.onAuth(null),load:async()=>window.__userDoc||null,save:async(u,d)=>{window.__saved=d},
  saveProfile:async(u,d)=>{window.__pub=d},deleteProfile:async()=>{},claimUsername:async(u,n)=>{if(N[n])throw new Error('taken');N[n]=u},
  findUser:async u=>N[u]&&P[N[u]]?{uid:N[u],...P[N[u]]}:null,profiles:async ids=>ids.filter(i=>P[i]).map(i=>({uid:i,...P[i]})),
  followersList:async uid=>A(P).filter(([,p])=>p.following.includes(uid)).map(([i,p])=>({uid:i,...p})),league:async(t,w)=>A(P).filter(([,p])=>p.league===t&&p.weekId===w).map(([i,p])=>({uid:i,...p})),
  track:async()=>{},getClass:async()=>null,members:async()=>[],saveMember:async()=>{},leaveClass:async()=>{}};
 addEventListener('DOMContentLoaded',()=>setTimeout(()=>window.onAuth({uid:'me',email:'kid@x.y',displayName:'Ava'}),50))};
async function page({state,mock,vp={width:430,height:900},theme}={}){const ctx=await browser.newContext({viewport:vp,colorScheme:theme||'light'}),pg=await ctx.newPage();pg.errors=[];
 pg.on('pageerror',e=>/firebasejs/.test(e.message)||pg.errors.push(e.message));pg.on('console',m=>m.type()==='error'&&!/Failed to (load resource|fetch dynamically)|ERR_FAILED/.test(m.text())&&pg.errors.push(m.text()));
 await pg.route(/gsap/,r=>GSAP?r.fulfill({path:GSAP,contentType:'text/javascript'}):r.continue());await pg.route(/gstatic|googleapis/,r=>r.abort());
 await pg.addInitScript(([s,doc])=>{if(!localStorage.getItem('chip-stocks-v1')&&s)localStorage.setItem('chip-stocks-v1',JSON.stringify(s));if(doc)window.__userDoc=doc;
  window.SpeechSynthesisUtterance=function(t){this.text=t};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak:u=>(window.__said=window.__said||[]).push(u.text),cancel(){}}})},[state,mock?{...state}:null]);
 if(mock)await pg.addInitScript(MOCK);
 await pg.goto(`http://localhost:${PORT}/`);return pg}
const shot=async(pg,n)=>SHOTS&&pg.screenshot({path:`${SHOTS}/${n}.png`});
const dismiss=async pg=>{for(let i=0;i<10&&await pg.isVisible('.modal [data-close]');i++){await pg.click('.modal [data-close]');await pg.waitForTimeout(200)}};
const settle=pg=>pg.waitForTimeout(450);
// answer whatever the current lesson item is, correctly (or wrongly) by reading engine state
async function answer(pg,right=true){return pg.evaluate(async right=>{const it=L.cur,ck=document.querySelector('#check');
 if(['info','line','read','card'].includes(it.t)){ck.click();return it.t}
 if(it.t==='mc'){const want=right?it.ans:it.opts.map(o=>o.l).find(l=>l!==it.ans);[...document.querySelectorAll('#stage .opt')].find(b=>b.dataset.v===want).click()}
 if(it.t==='build'){const words=right?it.answer.split(' '):[it.extra[0]];for(const w of words){[...document.querySelectorAll('#bank .chipw:not(.used)')].find(b=>b.textContent===w).click()}}
 if(it.t==='speak'){const t=document.querySelector('#typed');if(t){t.value=right?it.text:'nope';t.dispatchEvent(new Event('input'))}else{L.heard=right?it.text:'nope';ck.disabled=false}}
 if(it.t==='match'){if(!right){const l=document.querySelector('[data-s=l]'),r=[...document.querySelectorAll('[data-s=r]')].find(x=>x.dataset.k!==l.dataset.k);l.click();r.click()}
  for(let i=0;i<it.pairs.length;i++){document.querySelector(`[data-s=l][data-k="${i}"]`).click();document.querySelector(`[data-s=r][data-k="${i}"]`).click()}await new Promise(r=>setTimeout(r,500));return 'match'}
 ck.click();return it.t},right)}
async function playThrough(pg,{wrong=0}={}){let n=0,w=wrong;while(n++<80){const st=await pg.evaluate(()=>L&&!L.finished?(document.querySelector('#cont')&&L.locked?'cont':'item'):'done');
 if(st==='done')break;if(st==='cont'){await pg.click('#cont');continue}const g=await pg.evaluate(()=>!['info','line','read','card'].includes(L.cur.t));await answer(pg,!(g&&w-->0));await pg.waitForTimeout(30)}}
const base={name:'Ava',level:1,coins:300,gems:500,lastOpen:new Date().toLocaleDateString('en-CA')};
const today=()=>new Date().toLocaleDateString('en-CA');

/* 1. onboarding from a fresh install */
{const pg=await page();await pg.waitForSelector('#nx');await shot(pg,'01-welcome');await pg.click('#nx');await pg.fill('#nm','Ava');await pg.click('#nx');await pg.click('[data-l="1"]');await pg.click('#nx');
 await pg.click('[data-g="20"]');await shot(pg,'02-goal');await pg.click('#nx');await pg.waitForSelector('#go');ok(await pg.isVisible('#gg'),'onboarding reaches sign-up');
 ok(!pg.errors.length,'onboarding: no errors '+pg.errors.join(' | '));await pg.context().close()}

/* 2. Jump here: the popup sits above the next chapter's banner and its button works */
{const pg=await page({state:base});await pg.waitForSelector('.node.jump',{timeout:9000});await settle(pg);await pg.click('.node.jump');await pg.waitForTimeout(700);await shot(pg,'03-jump-pop');
 const hit=await pg.evaluate(()=>{const b=document.querySelector('.pop .btn').getBoundingClientRect(),e=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return !!e?.closest('.pop')&&b.bottom<=innerHeight});
 ok(hit,'jump popup button is on top and on screen');await pg.click('.pop .btn');ok(await pg.isVisible('#lesson'),'jump button starts the review');
 await playThrough(pg);await shot(pg,'04-jump-finish');ok(/skipped/.test(await pg.textContent('.fin h1')),'passing the review skips the chapter');
 await pg.click('#check');if(await pg.isVisible('#lesson'))await pg.click('#check');await settle(pg);
 ok(await pg.evaluate(()=>COURSE[0].lessons.every(l=>S.done[l.id])),'chapter 1 marked done');
 ok(await pg.isVisible('.celebm'),'chapter-complete celebration');await dismiss(pg);
 // every popup on every visible node: never covered, never off screen
 const bad=await pg.evaluate(async()=>{const out=[];for(const n of [...document.querySelectorAll('.node')].slice(0,14)){n.scrollIntoView({block:'center'});n.click();await new Promise(r=>setTimeout(r,450));const p=document.querySelector('.pop');if(!p){out.push('nopop');continue}
  const b=p.querySelector('.btn').getBoundingClientRect(),e=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);if(!e?.closest('.pop'))out.push(n.dataset.id+' covered');if(b.right>innerWidth+1||b.left<-1)out.push(n.dataset.id+' offscreen x');document.body.click()}return out});
 ok(!bad.length,'all node popups clickable '+bad.join(','));ok(!pg.errors.length,'jump: no errors '+pg.errors.join(' | '));await pg.context().close()}

/* 3. lessons, hearts, quests, gems, level-ups, achievements */
{const pg=await page({state:{...base,level:0,gems:100}});await pg.waitForSelector('.node.cur');await settle(pg);
 await pg.click('.node.cur');await pg.click('.pop .btn');await playThrough(pg,{wrong:1});
 const s=await pg.evaluate(()=>({xp:S.xp,h:S.hearts,done:Object.keys(S.done).length,str:S.streak,q:Q().c.xp,mist:S.mistakes.length,ach:S.ach.scholar}));
 ok(s.xp>=10&&s.done===1&&s.str===1&&s.h===4,'lesson awards XP, streak, costs a heart '+JSON.stringify(s));ok(s.q>=10&&s.mist===1&&s.ach===1,'quests, mistakes and achievements tracked');
 await pg.click('#check');await pg.waitForTimeout(300);await shot(pg,'05-streak');await pg.click('#check');await pg.waitForTimeout(600);
 ok(await pg.isVisible('.celebm'),'achievement celebration shown after lesson');await shot(pg,'06-celebrate');
 await dismiss(pg);
 // out of hearts → refill with gems
 await pg.evaluate(()=>{S.hearts=1;S.gems=200});await pg.click('.node.cur');await pg.click('.pop .btn');
 while(await pg.evaluate(()=>L.cur.t==='info'))await answer(pg);await answer(pg,false);await pg.click('#cont');ok(await pg.isVisible('#refill'),'no-hearts screen');await pg.click('#refill');
 ok(await pg.evaluate(()=>S.hearts===5&&S.gems===120),'refill costs 80 gems');await playThrough(pg);await pg.click('#check');
 await pg.evaluate(()=>closeLesson());await settle(pg);
 // claim quests
 await pg.evaluate(()=>{const q=Q();q.list.forEach(([k,n])=>q.c[k]=n);go('quests')});await settle(pg);await shot(pg,'07-quests');
 const g0=await pg.evaluate(()=>S.gems);for(let i=0;i<3;i++){await pg.click('[data-claim]:not([disabled])');await pg.waitForTimeout(200)}
 ok(await pg.evaluate(g=>S.gems>g&&Q().claimed.length===3&&MO().n===3,g0),'claiming quests pays gems and counts toward the monthly badge');
 await dismiss(pg);await pg.click('#openChest');await pg.waitForTimeout(900);await shot(pg,'08-chest');await pg.click('.modal [data-close]');ok(await pg.evaluate(()=>Q().chest>0),'chest opens once all quests claimed');
 await pg.evaluate(()=>{MO().n=29;monthBump();save()});await pg.waitForTimeout(500);ok(await pg.evaluate(()=>S.badges.includes(mon())),'monthly badge earned at 30 quests');
 await dismiss(pg);
 await pg.evaluate(()=>{S.xp=140;S.done.c1l2=0;delete S.done.c1l2});await pg.click('[data-tab="learn"]');await pg.click('.node.cur');await pg.click('.pop .btn');await playThrough(pg);
 ok(await pg.evaluate(()=>level()>=3),'level up');await pg.click('#check');await pg.waitForTimeout(500);ok(/Level/.test(await pg.textContent('body')),'level-up celebration');
 ok(!pg.errors.length,'lessons: no errors '+pg.errors.join(' | '));await pg.context().close()}

/* 4. shop, streak protection */
{const y=d=>{const x=new Date();x.setDate(x.getDate()+d);return x.toLocaleDateString('en-CA')};
 const pg=await page({state:{...base,gems:2000,streak:9,best:9,lastDay:y(-3),freezes:1}});await pg.waitForSelector('.shell');await pg.waitForTimeout(600);
 ok(await pg.evaluate(()=>S.streak===0&&S.lostStreak?.n===9),'streak ends when freezes run out');await shot(pg,'09-lost-streak');
 await pg.click('#rpr');ok(await pg.evaluate(()=>S.streak===9&&S.gems===1750&&streakNow()===9),'streak repair restores it');
 await dismiss(pg);
 await pg.click('[data-tab="shop"]');await settle(pg);await shot(pg,'10-shop');
 for(const id of ['freeze','amulet','boost','crown','shades']){await pg.click(`[data-buy="${id}"]`);await pg.waitForTimeout(120)}
 ok(await pg.evaluate(()=>S.freezes===2&&S.amulet&&boosted()&&S.wear.includes('crown')&&S.wear.includes('shades')),'power-ups and outfits bought');
 await pg.click('[data-buy="party"]');ok(await pg.evaluate(()=>S.wear.includes('party')&&!S.wear.includes('crown')),'one hat at a time');
 await pg.click('#stF');await pg.waitForTimeout(400);await shot(pg,'11-streak-pop');await pg.click('.modal [data-close]');
 ok(!pg.errors.length,'shop: no errors '+pg.errors.join(' | '));await pg.context().close()}

/* 5. weekend amulet + freeze cover gaps */
{const y=d=>{const x=new Date();x.setDate(x.getDate()+d);return x.toLocaleDateString('en-CA')};
 const pg=await page({state:{...base,streak:5,lastDay:y(-2),freezes:1}});await pg.waitForSelector('.shell');await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>streakNow()===5&&S.freezes===0),'freeze covers a missed day');await pg.context().close()}

/* 6. practice hub: workout, words, listen, speak, story, reading */
{const done=Object.fromEntries(['c1l1','c1l2','c1l3','c1l4','c1l5','c2l1','c2l2','c2l3','c2l4','c2l5','c2l6','c3l1','c4l1','c7l1','c9l1','c13l1','c17l1','c19l1'].map(k=>[k,1]));
 const pg=await page({state:{...base,done}});await pg.waitForSelector('.shell');await pg.click('[data-tab="practice"]');await settle(pg);await shot(pg,'12-practice');
 for(const m of ['workout','words','listen','speak']){await pg.click(`[data-mode="${m}"]`);await pg.waitForTimeout(250);if(m==='words'){await pg.evaluate(()=>document.querySelector('#flash')?.click());await pg.waitForTimeout(600);await shot(pg,'13-flash')}
  if(m==='listen')await shot(pg,'14-listen');if(m==='speak')await shot(pg,'15-speak');await playThrough(pg);ok(await pg.evaluate(()=>L?.finished),`${m} session completes`);await pg.click('#check');await pg.waitForTimeout(250);if(await pg.isVisible('#lesson'))await pg.click('#check');await settle(pg);
  await dismiss(pg)}
 ok(await pg.evaluate(()=>(window.__said||[]).length>0),'listening uses speech synthesis');ok(await pg.evaluate(()=>wordsLearned()>0||Object.keys(S.words).length>0),'words tracked');
 const ids=await pg.evaluate(()=>storiesOpen().map(s=>s.id));for(const id of ids){await pg.click(`[data-story="${id}"]`);await pg.waitForTimeout(200);if(id==='s1'){await answer(pg);await answer(pg);await answer(pg);await pg.waitForTimeout(400);await shot(pg,'16-story')}if(id==='r1')await shot(pg,'17-reading');
  await playThrough(pg);await pg.click('#check');await pg.waitForTimeout(250);if(await pg.isVisible('#lesson'))await pg.click('#check');await settle(pg);await dismiss(pg)}
 ok(await pg.evaluate(n=>Object.keys(S.stories).length===n&&n>=6,ids.length),`all ${ids.length} unlocked stories/readings complete`);
 ok(!pg.errors.length,'practice: no errors '+pg.errors.join(' | '));await pg.context().close()}

/* 7. leagues: rivals, zones, promotion at week end */
{const lastWk=(()=>{const d=new Date();d.setDate(d.getDate()-(d.getDay()+6)%7-7);return d.toLocaleDateString('en-CA')})();
 const pg=await page({state:{...base,week:{id:lastWk,xp:2000},league:{tier:0,week:lastWk,snap:[],best:0,wins:0,top3:0}}});await pg.waitForSelector('.shell');await pg.waitForTimeout(700);
 ok(await pg.evaluate(()=>S.league.tier===1&&S.league.wins===1&&S.league.last.rank===1),'week rollover promotes the winner');await shot(pg,'18-promoted');
 await dismiss(pg);
 await pg.click('[data-tab="league"]');await settle(pg);await shot(pg,'19-league');
 ok(await pg.evaluate(()=>document.querySelectorAll('.board .fr').length===30&&document.querySelector('.zone.up')&&document.querySelector('.zone.dn')),'league shows 30 with promotion and demotion zones');
 ok(await pg.evaluate(()=>JSON.stringify(rivals(wk(),1,5))===JSON.stringify(rivals(wk(),1,5))),'rivals are deterministic');
 ok(!pg.errors.length,'league: no errors '+pg.errors.join(' | '));await pg.context().close()}

/* 8. social with a mock backend: follow, followers, suggestions, feed, photo upload, avatar builder */
{const pg=await page({state:{...base,username:'ava_b',social:true,friends:['u2']},mock:true,vp:{width:1300,height:900}});await pg.waitForSelector('.shell');await pg.click('[data-tab="profile"]');await pg.waitForTimeout(900);await shot(pg,'20-profile-desktop');
 ok(await pg.evaluate(()=>FOL?.length===2&&SUG?.some(s=>s.uid==='u3')),'followers load and suggest who follows you back');
 ok(/came back to learn about stocks after 1 month/.test(await pg.textContent('.side')),'friend comeback shows in the feed');
 await pg.click('.side [data-fol="u3"]');ok(await pg.evaluate(()=>S.friends.includes('u3')),'follow from a suggestion');await pg.waitForTimeout(400);await dismiss(pg);
 await pg.click('[data-people="followers"]');await pg.waitForTimeout(300);await shot(pg,'21-followers');await pg.click('.modal [data-close]');
 await pg.click('[data-tab="league"]');await pg.waitForTimeout(600);ok(await pg.evaluate(()=>[...document.querySelectorAll('.board .fr b')].some(b=>/@sam_k/.test(b.textContent))),'real learners appear in the league');
 await pg.click('[data-tab="profile"]');await pg.waitForTimeout(300);await pg.click('#edp2');await pg.click('[data-mode="photo"]');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAF0lEQVR4nGNk+M+AFTBhF2YYFYYKAwAPUwEPLiH0UgAAAABJRU5ErkJggg==','base64');
 await pg.setInputFiles('#pf',{name:'me.png',mimeType:'image/png',buffer:png});await pg.waitForTimeout(400);await pg.check('#ppub');await shot(pg,'22-photo');await pg.click('#psv');await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>S.avMode==='photo'&&okPhoto(S.photo)&&S.photo.length<60000&&document.querySelector('.pav img')),'photo upload resized and shown');
 await pg.evaluate(()=>save());await pg.waitForTimeout(900);ok(await pg.evaluate(()=>window.__pub?.avMode==='photo'&&window.__pub.photo.length>100),'public profile carries photo only when opted in');
 await pg.click('#edp2');await pg.click('[data-mode="char"]');await pg.click('#bld');await pg.click('[data-cat="1"]');await pg.click('#bo [data-o="3"]');await shot(pg,'23-builder');
 ok(await pg.evaluate(()=>document.querySelector('#bo [data-o="8"]').disabled),'high-level avatar styles locked');await pg.click('#bsv');await pg.click('#psv');
 ok(await pg.evaluate(()=>S.avMode==='char'&&S.char.hair===3),'character saved');
 await pg.click('#toSet');await settle(pg);await shot(pg,'24-settings');await pg.click('#thm');ok(await pg.evaluate(()=>document.documentElement.dataset.theme==='dark'),'dark theme');
 for(const t of ['learn','practice','league','quests','shop','fund','profile']){await pg.click(`[data-tab="${t}"]`);await pg.waitForTimeout(250);await shot(pg,'25-dark-'+t)}
 ok(!pg.errors.length,'social: no errors '+pg.errors.join(' | '));await pg.context().close()}

/* 9. every page at phone and desktop widths: no horizontal overflow */
for(const vp of [{width:360,height:780},{width:768,height:1000},{width:1440,height:900}]){const pg=await page({state:{...base,done:{c1l1:1,c1l2:1}},vp});await pg.waitForSelector('.shell');
 for(const t of ['learn','practice','league','quests','shop','fund','profile','settings']){await pg.evaluate(t=>go(t),t);await pg.waitForTimeout(150);
  const o=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(o<=1,`${vp.width}px ${t}: no horizontal scroll (${o})`);if(vp.width===360)await shot(pg,`26-${t}-360`)}
 ok(!pg.errors.length,`${vp.width}px: no errors `+pg.errors.join(' | '));await pg.context().close()}

/* 10. stress: 60 lessons back to back, 300 tab switches, memory and timing */
{const pg=await page({state:{...base,gems:0}});await pg.waitForSelector('.shell');const t0=Date.now();
 const n=await pg.evaluate(async()=>{let c=0;for(let i=0;i<60;i++){const id=curLesson()||'c1l1';startLesson(id);let g=0;while(L&&!L.finished&&g++<200){const it=L.cur;
  if(L.locked){next();continue}if(['info','line','read','card'].includes(it.t)){L.done++;next();continue}result(true,'')}closeLesson();c++}return c});
 ok(n===60,`60 lessons in ${((Date.now()-t0)/1e3).toFixed(1)}s`);
 const r=await pg.evaluate(()=>{const tabs=['learn','practice','league','quests','shop','fund','profile'],t=performance.now();for(let i=0;i<300;i++)go(tabs[i%7]);
  return{ms:(performance.now()-t)/300,nodes:document.getElementsByTagName('*').length,tweens:gsap.globalTimeline.getChildren(true,true,true).length,state:JSON.stringify(S).length}});
 let tw=1e9;for(let i=0;i<20&&tw>=40;i++){await pg.waitForTimeout(500);tw=await pg.evaluate(()=>gsap.globalTimeline.getChildren(true,true,true).length)}
 ok(r.ms<60,`tab render ${r.ms.toFixed(1)} ms avg`);ok(tw<40,`animations drain after the burst (${tw} left)`);ok(r.state<200000,`saved state stays small (${r.state} bytes)`);
 await pg.evaluate(()=>go('learn'));const lr=await pg.evaluate(()=>{const t=performance.now();for(let i=0;i<20;i++)go('learn');return (performance.now()-t)/20});ok(lr<120,`learn path render ${lr.toFixed(1)} ms`);
 ok(!pg.errors.length,'stress: no errors '+pg.errors.join(' | '));await pg.context().close()}

await browser.close();srv.close();console.log(`\n${passes} passed, ${fails} failed`);process.exit(fails?1:0);
