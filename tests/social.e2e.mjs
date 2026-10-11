// Multi-user test: the real app + real Firebase SDK + real security rules, against the local Auth and Firestore
// emulators, with hundreds of seeded learners. Checks leagues, cohorts, practice rivals, follows, followers,
// suggestions and the feed — and that practice rivals never leave the device (no Firestore writes, no follows).
//   npm i --no-save playwright gsap@3.12.5 firebase @firebase/rules-unit-testing firebase-tools
//   npx firebase emulators:exec --only auth,firestore --project demo-chip "node tests/social.e2e.mjs"
import {chromium} from 'playwright';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {doc,getDoc} from 'firebase/firestore';
import {testEnv,seed,allProfiles,PROJECT,wk} from './seed.mjs';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),PORT=8125,SHOTS=process.env.SHOTS,N=+(process.env.SEED_N||300);
const require=createRequire(import.meta.url),res=m=>{try{return require.resolve(m,{paths:[process.cwd(),ROOT]})}catch{}};
const GSAP=res('gsap/dist/gsap.min.js'),FB=path.dirname(res('firebase/package.json'));
const env=await testEnv();await env.clearFirestore();
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p==='/')p='/index.html';const f=path.join(ROOT,p);
 if(!f.startsWith(ROOT))return r.writeHead(403).end();fs.readFile(f,(e,d)=>{if(e)return r.writeHead(404).end();r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'text/plain'});r.end(d)})}).listen(PORT);
const browser=await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')?{executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}:{});
let fails=0,passes=0;const ok=(c,n)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n)}};
const shot=(pg,n)=>SHOTS&&pg.screenshot({path:`${SHOTS}/s-${n}.png`});
const CONFIG=`self.FIREBASE_CONFIG={apiKey:"demo-key",authDomain:"localhost",projectId:"${PROJECT}",appId:"demo"};self.FIREBASE_VAPID_KEY="";`;
async function page(vp={width:430,height:900}){const ctx=await browser.newContext({viewport:vp}),pg=await ctx.newPage();pg.errors=[];pg.hosts=new Set();
 pg.on('pageerror',e=>pg.errors.push(e.message));pg.on('request',q=>pg.hosts.add(new URL(q.url()).host));
 await pg.route(/gsap/,r=>r.fulfill({path:GSAP,contentType:'text/javascript'}));
 // the app imports the SDK from gstatic; serve the same ESM bundles from the npm package
 // the app imports the SDK from gstatic; serve the npm package's ESM bundles, re-exporting the app's pinned version
 // from the bundle's own version so the browser loads a single SDK instance
 const FBV=JSON.parse(fs.readFileSync(path.join(FB,'package.json'))).version;
 await pg.route(/gstatic\.com\/firebasejs\/([^/]+)\/([\w-]+\.js)$/,r=>{const[,v,f]=r.request().url().match(/firebasejs\/([^/]+)\/([\w-]+\.js)$/);
  return v===FBV?r.fulfill({path:path.join(FB,f),contentType:'text/javascript'}):r.fulfill({body:`export * from 'https://www.gstatic.com/firebasejs/${FBV}/${f}';`,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}})});
 await pg.route(/firebase-config\.js$/,r=>r.fulfill({body:CONFIG,contentType:'text/javascript'}));
 await pg.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
 await pg.addInitScript(()=>localStorage.setItem('chip-emu','1'));
 await pg.goto(`http://localhost:${PORT}/`);return pg}
const dismiss=async pg=>{for(let i=0;i<12&&await pg.isVisible('.modal [data-close]');i++){await pg.click('.modal [data-close]');await pg.waitForTimeout(200)}};
// sign up through the real onboarding + auth UI, pick a username, and turn friends on (with the grown-up checkbox)
async function signUp(pg,name,username){await pg.click('#nx');await pg.fill('#nm',name);await pg.click('#nx');await pg.click('[data-l="0"]');await pg.click('#nx');await pg.click('[data-g="20"]');await pg.click('#nx');
 await pg.fill('#em',`${username}@test.local`);await pg.fill('#pw','secret123');await pg.click('#go');await pg.waitForSelector('.shell',{timeout:15000}).catch(async e=>{console.log('signup stuck:',await pg.textContent('#err').catch(()=>''),pg.errors,await pg.evaluate(()=>typeof cloud));throw e});await dismiss(pg);
 await pg.click('[data-tab="profile"]');await pg.click('#edp2');await pg.fill('#pu',username);await pg.click('#psv');await pg.waitForFunction(u=>S.username===u,username);
 await pg.click('[data-tab="league"]');await pg.check('#pok');await pg.click('#son');await pg.waitForFunction(()=>S.social);
 await pg.evaluate(()=>{flush()});await pg.waitForTimeout(800);return pg.evaluate(()=>user.uid)}
const reloadLeague=async pg=>{await pg.evaluate(()=>{LG=null;go('league')});await pg.waitForFunction(()=>LG?.rows,null,{timeout:10000});await pg.waitForTimeout(300)};
const boardInfo=pg=>pg.evaluate(()=>{const rows=[...document.querySelectorAll('.board .fr')];return{n:rows.length,rivals:rows.filter(r=>r.querySelector('small')?.textContent.includes('Practice rival')).length,
 rivalClickable:rows.filter(r=>r.textContent.includes('Practice rival')&&r.hasAttribute('data-prof')).length,real:rows.filter(r=>r.hasAttribute('data-prof')).length,me:rows.filter(r=>r.classList.contains('me')).length,
 up:!!document.querySelector('.zone.up'),dn:!!document.querySelector('.zone.dn'),group:LG.rows.map(r=>r.uid),seed:LG.seed}});

/* 1. two real learners sign up through the UI */
const A=await page(),B=await page();
const aUid=await signUp(A,'Alice','alice_t'),bUid=await signUp(B,'Bob','bob_t');
ok(aUid&&bUid&&aUid!==bUid,'two learners signed up through the auth emulator');
ok(!A.errors.length&&!B.errors.length,'sign-up: no errors '+[...A.errors,...B.errors].join(' | '));

/* 2. seed hundreds of learners: 140 in Bronze (several leagues' worth), 20 in Silver (needs rivals), rest spread out */
const t0=Date.now(),seeded=await seed(env,{n:N,followTargets:[aUid],followers:25});const seedMs=Date.now()-t0;
ok(seeded.length===N,`seeded ${N} learners through the security rules in ${seedMs} ms`);
const bronze=seeded.filter(u=>u.tier===0&&!u.stale).length;

/* 3. Bronze: more than 30 learners → balanced cohorts of at most 30, no rivals needed */
let t1=Date.now();await A.click('[data-tab="league"]');await reloadLeague(A);const loadMs=Date.now()-t1;
let a=await boardInfo(A);await shot(A,'bronze');
const groups=Math.ceil((bronze+2)/30);
ok(a.n<=30&&a.n>=Math.floor((bronze+2)/groups),`Bronze board is one cohort: ${a.n} rows for ${bronze+2} learners in ${groups} groups (loaded in ${loadMs} ms)`);
ok(a.rivals===0,'no practice rivals when the cohort is full of real learners');ok(a.me===1&&a.up&&!a.dn,'me shown once, promotion zone, no demotion in Bronze');
await reloadLeague(B);const b=await boardInfo(B);
const aGroupForB=await B.evaluate(([all,aUid])=>leagueGroup(all,aUid,wk()),[await A.evaluate(()=>cloud.league(0,wk())),aUid]);
ok(JSON.stringify([...aGroupForB].sort())===JSON.stringify([...a.group,aUid].sort()),'Bob’s device computes exactly the same cohort for Alice');
ok(b.group.includes(aUid)===a.group.includes(bUid),'cohort membership is symmetric');

/* 4. Silver: 20 real learners → 9 rivals fill the board, and they're inert */
await A.evaluate(()=>{S.league.tier=1;save()});await reloadLeague(A);a=await boardInfo(A);await shot(A,'silver');
const silver=seeded.filter(u=>u.tier===1&&!u.stale).length;
ok(a.n===30&&a.rivals===29-silver,`Silver: ${silver} real + ${a.rivals} rivals + me = ${a.n}`);
ok(a.rivalClickable===0,'rival rows have no profile or follow action');ok(a.up&&a.dn,'promotion and demotion zones in Silver');
const rivalNames=await A.evaluate(()=>leagueRows().filter(r=>r.bot).map(r=>r.username));
ok(!rivalNames.some(n=>/^@/.test(n)),'rivals have no @handle');
ok(await A.evaluate(()=>{const before=S.friends.length;follow(leagueRows().find(r=>r.bot));return S.friends.length===before}),'follow() refuses a rival even if called directly');

/* 5. followers, suggestions, follows, feed */
await A.evaluate(()=>{FR=FOL=SUG=null;go('profile')});await A.waitForFunction(()=>FOL&&SUG,null,{timeout:10000});await A.waitForTimeout(400);await shot(A,'profile');
const fol=await A.evaluate(()=>FOL.length);ok(fol===25,`Alice has ${fol} seeded followers`);
const sug=await A.evaluate(()=>SUG.map(s=>s.uid));ok(sug.length>0&&sug.every(u=>u.startsWith('seed_')),'suggestions are real seeded learners only');
await A.click(`.mob [data-fol="${sug[0]}"]`);await dismiss(A);
await A.evaluate(()=>{FR=null;go('profile')});await A.waitForFunction(()=>FR,null,{timeout:10000});await A.waitForTimeout(300);
const feedTxt=await A.textContent('.side');ok(/came back|streak|promoted|finished|reached|earned|started following/.test(feedTxt),'friend + follower events show in Alice’s feed');
// Bob finds Alice by username through the search box
await B.click('[data-tab="profile"]');await B.click('[data-addf]');await B.fill('#fq','alice_t');await B.click('#fgo');await B.waitForFunction(a=>S.friends.includes(a),aUid);await B.evaluate(()=>flush());await B.waitForTimeout(800);
await A.evaluate(()=>{FOL=SUG=null;go('profile')});await A.waitForFunction(()=>FOL,null,{timeout:10000});
ok(await A.evaluate(b=>FOL.some(f=>f.uid===b),bUid),'Bob’s follow reaches Alice as a follower');
ok(/@bob_t (and \d+ others )?started following you|and \d+ others started following you/.test(await A.textContent('.side')),'new followers grouped into one “started following you” line');
await A.click('[data-people="followers"]');await A.waitForTimeout(300);ok(await A.locator('.plist .fr').count()===26,'followers list shows 26');await shot(A,'followers');await dismiss(A);

/* 6. week rollover with a mix of real learners and rivals */
const last=wk(-1);await A.evaluate(([last])=>{S.week={id:last,xp:5000};S.league={...S.league,tier:1,week:last};save();booted=true;go('learn')},[last]);await A.waitForTimeout(600);
ok(await A.evaluate(()=>S.league.last?.rank===1&&S.league.tier===2),'rollover: top of Silver is promoted to Gold');await dismiss(A);

/* 7. nothing fake ever leaves the device */
await A.evaluate(()=>flush());await B.evaluate(()=>flush());await A.waitForTimeout(1500);
const profs=await allProfiles(env),uids=new Set(profs.map(p=>p.uid));
ok(profs.length===N+2,`Firestore holds exactly ${N} seeded + 2 real profiles (${profs.length})`);
ok(profs.every(p=>!p.uid.startsWith('bot')&&!/^bot/.test(p.username)),'no rival profile was ever written');
ok(profs.every(p=>(p.following||[]).every(u=>uids.has(u)||u===aUid||u===bUid)),'nobody follows a rival or a missing learner');
let aDoc;await env.withSecurityRulesDisabled(async c=>{aDoc=(await getDoc(doc(c.firestore(),'users',aUid))).data()});
ok(aDoc&&(aDoc.league.snap||[]).every(s=>uids.has(s.u))&&aDoc.friends.every(u=>uids.has(u)),'Alice’s saved league snapshot and friends hold real learners only');
ok(!JSON.stringify(aDoc.summary||{}).includes('rival'),'parent summary has no league rivals');
const pubA=profs.find(p=>p.uid===aUid);ok(pubA&&Object.keys(pubA).every(k=>k==='uid'||['username','avatar','avMode','char','photo','xp','streak','weekId','weekXp','league','level','feed','following','updatedAt'].includes(k)),'public profile carries only allowed fields');
const hosts=[...A.hosts,...B.hosts].filter(h=>!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h));
ok(hosts.every(h=>/gstatic|jsdelivr|googleapis/.test(h)),'test browsers only talked to localhost (CDNs were served locally): '+hosts.join(','));

/* 8. performance with hundreds of learners */
const r=await A.evaluate(()=>{const t=performance.now();for(let i=0;i<50;i++)go(['league','profile','learn'][i%3]);return (performance.now()-t)/50});ok(r<80,`render with ${N} learners loaded: ${r.toFixed(1)} ms`);
ok(!A.errors.length&&!B.errors.length,'no page errors '+[...A.errors,...B.errors].join(' | '));

await browser.close();srv.close();await env.cleanup();console.log(`\n${passes} passed, ${fails} failed`);process.exit(fails?1:0);
