// Leagues, friends, followers, suggestions, activity feed, and the profile / avatar editor.
/* ---------- leagues ---------- */
const TIERS=[['Bronze'],['Silver'],['Gold'],['Sapphire'],['Ruby'],['Emerald'],['Amethyst'],['Pearl'],['Obsidian'],['Diamond']];
const tierIc=(t,s=40,cls='')=>ic('lg_'+TIERS[t][0].toLowerCase(),s,cls);
const LSIZE=30,promoN=t=>t<TIERS.length-1?7:0,demoN=t=>t>0?5:0;
const RIVAL_NAMES=['Penny','Leo','Zara','Milo','Ava','Kai','Nora','Theo','Ivy','Omar','Luna','Finn','Maya','Ravi','Ella','Sam','Hugo','Iris','Jay','Rosa','Ben','Lily','Max','Ana','Noah','Mia','Eli','Zoe','Arlo','Sofia','Tariq','Yuki','Diego','Amara','Felix','Nina'];
// Practice rivals fill the league until enough real learners join. They're labelled as rivals in the UI.
// Each rival's week is fixed by a seed, and their XP grows through the week the way a learner's would.
function rivals(week,tier,n){const r=rng(week+'|'+tier+'|'+(user?.uid||S.joined+S.name)),names=shuf2([...RIVAL_NAMES],r);
 return [...Array(Math.max(0,n))].map((_,i)=>{const fin=Math.round((35+tier*28)*(.12+2*r()**1.7)),w=[...Array(7)].map(()=>r()**2+.05),tot=w.reduce((a,b)=>a+b);
  return{bot:1,uid:'bot'+i,username:names[i%names.length],fin,share:w.map(x=>x/tot),avMode:'char',char:{skin:r()*6|0,hair:r()*9|0,hairC:r()*6|0,eyes:r()*3|0,mouth:r()*3|0,acc:r()*3|0,top:r()*2|0,shirt:r()*8|0,bg:r()*7|0},streak:r()*40|0}})}
const shuf2=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=r()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function botXp(b,week){const el=week===wk()?Math.max(0,Math.min(7,(Date.now()-new Date(week+'T00:00'))/864e5)):7;let x=0;for(let d=0;d<7;d++)x+=b.fin*b.share[d]*Math.max(0,Math.min(1,el-d));return Math.round(x)}
let LG=null; // real learners in my league this week: {key, rows, at}
const realLeague=()=>!!(user&&S.social&&S.username);
async function loadLeague(){const key=wk()+'|'+S.league.tier;if(!realLeague()||(LG?.key===key&&Date.now()-LG.at<6e4))return;LG={key,rows:LG?.key===key?LG.rows:null,at:Date.now()};
 try{const rows=(await cloud.league(S.league.tier,wk())).filter(p=>p.uid!==user.uid);LG={key,rows,at:Date.now()};S.league.snap=rows.slice(0,LSIZE-1).map(p=>[p.uid,p.weekXp||0]);save()}catch(e){console.error(e);LG={key,rows:[],at:Date.now()}}
 if(tab==='league')go()}
function leagueRows(week=wk(),final){const t=S.league.tier,me={me:1,uid:'me',username:S.username||S.name,...myAv(),xp:week===wk()?weekXP():S.week.id===week?S.week.xp:0,streak:streakNow()};
 const real=final?(S.league.snap||[]).map(([uid,xp])=>({uid,xp})):(LG?.key===week+'|'+t&&LG.rows||[]).map(p=>({...p,xp:p.weekXp||0}));
 const bots=rivals(week,t,LSIZE-1-real.length).map(b=>({...b,xp:botXp(b,week)}));
 return [me,...real,...bots].sort((a,b)=>b.xp-a.xp||(b.me?1:0)-(a.me?1:0))}
// once per new week: settle last week's league
function leagueRollover(){const L=S.league;if(!L.week){L.week=wk();return}if(L.week===wk())return;const old=L.week,myXp=S.week.id===old?S.week.xp:0;
 if(myXp>0){const rows=leagueRows(old,1),rank=rows.findIndex(r=>r.me)+1,n=rows.length,t=L.tier,res=rank<=promoN(t)?'up':rank>n-demoN(t)?'down':'stay',g=[60,40,25][rank-1]||0;
  L.tier=Math.max(0,Math.min(TIERS.length-1,t+(res==='up'?1:res==='down'?-1:0)));L.best=Math.max(L.best||0,L.tier);if(rank===1)L.wins=(L.wins||0)+1;if(rank<=3){L.top3=(L.top3||0)+1;pushEvent('top3',rank)}
  if(res==='up')pushEvent('promo',L.tier);S.gems+=g;L.last={week:old,rank,res,from:t,to:L.tier};
  celebrate({art:tierIc(L.tier,130),title:res==='up'?`Promoted to ${TIERS[L.tier][0]}!`:res==='down'?`Back to ${TIERS[L.tier][0]}`:`You stayed in ${TIERS[L.tier][0]}`,
   text:`You finished #${rank} in the ${TIERS[t][0]} League last week${res==='down'?'. Earn more XP this week to climb back up!':'.'}`,gems:g,btn:'Continue'})}
 L.week=wk();L.snap=[];LG=null;checkAch?.()}
function daysLeft(){const d=new Date(wk()+'T00:00');d.setDate(d.getDate()+7);const h=Math.ceil((d-Date.now())/36e5);return h>48?Math.ceil(h/24)+' days':h+' hours'}
function league(){const t=S.league.tier,rows=leagueRows(),pz=promoN(t),dz=demoN(t),n=rows.length,me=rows.findIndex(r=>r.me);
 const row=(r,i)=>`${i===pz&&pz?'<div class="zone up">'+ic('up',18)+' PROMOTION ZONE '+ic('up',18)+'</div>':''}${i===n-dz&&dz?'<div class="zone dn">'+ic('down',18)+' DEMOTION ZONE '+ic('down',18)+'</div>':''}
  <button class="fr ${r.me?'me':''} ${i<pz?'pz':i>=n-dz?'dz':''}" ${r.bot||r.me?'':`data-prof="${r.uid}"`}><b class="rk">${i<3?ic('medal',30,'m'+i):i+1}</b>${avatarHTML(r,42)}<div><b>${r.me?'You':'@'+esc(r.username||'learner')}</b>${r.bot?`<small class="muted">${ic('bot',14)} Practice rival</small>`:`<small class="muted">${ic('fire',14)} ${r.streak||0} day streak</small>`}</div><b>${r.xp} XP</b></button>`;
 return `<div class="lghead"><div class="tiers">${TIERS.map((_,i)=>`<span class="${i===t?'on':i>t?'off':''}">${tierIc(i,i===t?64:38)}</span>`).join('')}</div>
 <h1>${TIERS[t][0]} League</h1><p class="muted">${pz?`Top ${pz} advance to ${TIERS[t+1][0]}`:'The top league. Stay on top!'} · ${ic('clock',16)} ${daysLeft()} left</p></div>
 ${weekXP()?'':`<div class="tip">${ic('bolt',28)}<span>Finish a lesson to climb this week’s leaderboard!</span></div>`}
 <div class="list board">${rows.map(row).join('')}</div>
 <p class="note">${realLeague()?(LG?.rows?`${LG.rows.length} learner${LG.rows.length===1?'':'s'} in your league this week. `:'Loading learners… '):'You’re racing practice rivals. Sign in and turn on friends (with a grown-up’s OK) to race real learners too. '}Rivals marked ${ic('bot',14)} keep the league busy until more learners join.</p>
 ${me>=0?'':''}${classBoard()}${friendsBoard()}`}

/* ---------- friends ---------- */
let FR=null,FOL=null,SUG=null; // following profiles, follower profiles, suggestions (cached per session)
function myAv(){return{avatar:S.avatar,avMode:S.avMode,char:S.char,photo:S.photo}}
function friendsBoard(){const H=`<h2 class="sec">${ic('users',28)} Friends this week</h2>`;const gate=socialGate();if(gate)return H+gate;
 const me={uid:user.uid,...pub(),me:1},rows=[me,...new Map((FR||[]).filter(f=>S.friends.includes(f.uid)).map(f=>[f.uid,f])).values()].map(f=>({...f,w:f.weekId===wk()?f.weekXp:0})).sort((a,b)=>b.w-a.w);
 return H+`<div class="list">${FR?rows.map((f,i)=>`<button class="fr ${f.me?'me':''}" ${f.me?'':`data-prof="${f.uid}"`}><b class="rk">${i+1}</b>${avatarHTML(f.me?myAv():f,40)}<div><b>${f.me?'You':'@'+esc(f.username)}</b><small class="muted">${ic('fire',14)} ${f.streak||0} · ${tierIc(f.league||0,14)} ${TIERS[f.league||0][0]}</small></div><b>${f.w} XP</b></button>`).join('')+(rows.length<2?'<p class="muted" style="padding:14px 0">Follow friends to race them here.</p>':''):'<p class="muted" style="padding:16px 0">Loading friends…</p>'}</div>
 <button class="btn ghost wide" data-addf style="margin-top:12px">${ic('userplus',22)} Add friends</button>`}
function socialGate(){if(!user)return `<div class="hero">${chip(100)}<div><h2>Sign in to add friends</h2><p class="muted">Follow friends, see their progress and race them each week.</p></div></div>`;
 if(!S.username)return `<div class="hero">${chip(100)}<div><h2>Pick a username first</h2><p class="muted">Friends find you by username.</p><button class="btn sm" id="setU" style="margin-top:10px">Edit profile</button></div></div>`;
 if(!S.social)return `<div class="hero">${chip(100)}<div><h2>Ask a grown-up first</h2><p class="muted">Turning on friends shares your username, avatar, XP and streak with other signed-in learners. Your real name and bio stay private.</p>
  ${S.parentEmail?(parentOK?`<button class="btn sm" id="son" style="margin-top:10px">Turn on friends</button>`:`<p class="note">Waiting for ${esc(S.parentEmail)} to allow friends in the Chip parent dashboard.</p><button class="btn ghost sm" id="pchk" style="margin-top:10px">Check again</button>`)
  :`<label class="optin"><input type="checkbox" id="pok"> A parent or guardian says it’s OK</label><button class="btn sm" id="son" disabled>Turn on friends</button>`}</div></div>`;return ''}
async function loadFriends(){try{FR=await cloud.profiles(S.friends)}catch(e){console.error(e);FR=[]}if($('.shell')&&['league','profile'].includes(tab))go()}
async function loadFollowers(){try{FOL=await cloud.followersList(user.uid)}catch(e){console.error(e);FOL=[]}SUG=null;if($('.shell')&&tab==='profile')go()}
// suggestions: people who follow you back-less, friends of friends, then league-mates
async function loadSuggest(){if(!FR||!FOL)return;const mine=new Set([user.uid,...S.friends]),score=new Map(),why=new Map();
 FOL.forEach(f=>{if(!mine.has(f.uid)){score.set(f.uid,(score.get(f.uid)||0)+5);why.set(f.uid,'Follows you')}});
 FR.forEach(f=>(f.following||[]).forEach(u=>{if(!mine.has(u)){score.set(u,(score.get(u)||0)+1);if(!why.has(u))why.set(u,`Followed by @${f.username}`)}}));
 (LG?.rows||[]).forEach(p=>{if(!mine.has(p.uid)&&!score.has(p.uid)){score.set(p.uid,.5);why.set(p.uid,'In your league')}});
 const ids=[...score].sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]),known=[...FOL,...(LG?.rows||[])];
 try{const miss=ids.filter(u=>!known.find(p=>p.uid===u)),got=miss.length?await cloud.profiles(miss):[];SUG=ids.map(u=>known.find(p=>p.uid===u)||got.find(p=>p.uid===u)).filter(Boolean).map(p=>({...p,why:why.get(p.uid)}))}catch(e){console.error(e);SUG=[]}
 if($('.shell')&&tab==='profile')go()}
function follow(p){if(S.friends.includes(p.uid)||p.uid===user?.uid)return;S.friends=[...S.friends,p.uid];FR=[...(FR||[]),p];SUG=SUG?.filter(x=>x.uid!==p.uid);save();SFX.coin();checkAch()}
function unfollow(uid){S.friends=S.friends.filter(x=>x!==uid);FR=FR?.filter(f=>f.uid!==uid);save()}
function suggestCard(){if(!realLeague())return '';if(!SUG)return `<div class="card"><h3>Friend suggestions</h3><p class="muted" style="margin-top:8px">Finding people you may know…</p></div>`;
 return `<div class="card"><div class="chead"><h3>Friend suggestions</h3><button class="link" data-addf>Search</button></div>${SUG.length?`<div class="sugs">${SUG.slice(0,6).map(p=>`<div class="sug">${avatarHTML(p,56)}<b>@${esc(p.username)}</b><small class="muted">${esc(p.why||'')}</small><button class="btn sm" data-fol="${p.uid}">Follow</button></div>`).join('')}</div>`:'<p class="muted" style="margin-top:8px">No suggestions yet. Search for friends by username.</p>'}</div>`}
const ago=t=>{const s=(Date.now()-t)/1e3;return s<3600?Math.max(1,Math.round(s/60))+'m':s<86400?Math.round(s/3600)+'h':Math.round(s/86400)+'d'};
function feedItems(){const ev=[];(FR||[]).filter(f=>S.friends.includes(f.uid)).forEach(f=>(f.feed||[]).slice(0,10).forEach(e=>e&&FEEDTXT[e.k]&&ev.push({...e,p:f})));
 (FOL||[]).filter(f=>!S.seenFol.includes(f.uid)).forEach(f=>ev.push({k:'follow',t:f.updatedAt||Date.now(),p:f,isNew:1}));return ev.sort((a,b)=>b.t-a.t).slice(0,20)}
function feedCard(){const fr=realLeague(),ev=fr?feedItems():[],mine=(S.feed||[]).filter(e=>FEEDTXT[e.k]).slice(0,5);
 const line=(e,me)=>{const[txt,icn]=FEEDTXT[e.k](me?'You':'@'+esc(e.p.username),e.v);return `<div class="feed ${e.isNew?'new':''}" ${me?'':`data-prof="${e.p.uid}"`}>${me?avatarHTML(myAv(),40):avatarHTML(e.p,40)}<div><p>${txt}</p><small class="muted">${ago(e.t)} ago</small></div>${ic(icn,26)}</div>`};
 return `<div class="card"><div class="chead"><h3>${ic('bell',22)} ${fr?'Friend updates':'Your activity'}</h3></div>${fr?(FR?ev.length?ev.map(e=>line(e)).join(''):'<p class="muted" style="margin-top:8px">When friends hit streaks, get promoted or come back to learn, you’ll see it here.</p>':'<p class="muted" style="margin-top:8px">Loading…</p>')
 :mine.length?mine.map(e=>line(e,1)).join(''):'<p class="muted" style="margin-top:8px">Finish lessons, earn badges and climb leagues to fill this up!</p>'}</div>`}
function addFriends(){const m=modal(`<h2>Add friends</h2>${socialGate()||`<p class="muted">You are @${esc(S.username)}. Ask friends to search for you!</p><div class="srow"><input class="name" id="fq" placeholder="Search username" autocomplete="off" autocapitalize="none"><button class="btn sm" id="fgo">Follow</button></div><p class="err" id="ferr"></p>
 ${SUG?.length?`<div class="sugs">${SUG.slice(0,4).map(p=>`<div class="sug">${avatarHTML(p,48)}<b>@${esc(p.username)}</b><small class="muted">${esc(p.why||'')}</small><button class="btn sm" data-fol="${p.uid}">Follow</button></div>`).join('')}</div>`:''}`}<button class="link" data-close>Close</button>`);
 bindSocial(m);const fq=$('#fq',m),err=$('#ferr',m);if(!fq)return;fq.focus();fq.onkeydown=e=>e.key==='Enter'&&$('#fgo',m).click();
 $('#fgo',m).onclick=async()=>{const u=fq.value.trim().toLowerCase().replace(/^@/,'');if(!u)return;err.textContent='';
  try{const f=await cloud.findUser(u);if(!f)return err.textContent='No one with that username.';if(f.uid===user.uid)return err.textContent='That’s you!';if(S.friends.includes(f.uid))return err.textContent='Already following.';
   follow(f);err.style.color='var(--ok-d)';err.textContent=`Following @${f.username}!`;fq.value='';go()}catch(e){console.error(e);err.textContent='Couldn’t search right now.'}}}
function peopleModal(which){const list=which==='following'?(FR||[]).filter(f=>S.friends.includes(f.uid)):FOL||[];
 const m=modal(`<div class="segs"><button class="${which==='following'?'on':''}" data-w="following">Following ${S.friends.length}</button><button class="${which==='followers'?'on':''}" data-w="followers">Followers ${FOL?.length??'…'}</button></div>
 <div class="plist">${list.length?list.map(p=>`<div class="fr" data-prof="${p.uid}">${avatarHTML(p,44)}<div><b>@${esc(p.username)}</b><small class="muted">${nf(p.xp||0)} XP</small></div>${S.friends.includes(p.uid)?`<button class="btn ghost sm" data-unf="${p.uid}">Following</button>`:`<button class="btn sm" data-fol="${p.uid}">Follow</button>`}</div>`).join(''):`<p class="muted" style="padding:20px 0">${which==='following'?'You’re not following anyone yet.':'No followers yet.'}</p>`}</div><button class="link" data-close>Close</button>`);
 $$('[data-w]',m).forEach(b=>b.onclick=()=>{m.remove();peopleModal(b.dataset.w)});bindSocial(m,()=>{m.remove();peopleModal(which)})}
function profModal(uid){const p=[...(FR||[]),...(FOL||[]),...(SUG||[]),...(LG?.rows||[])].find(x=>x.uid===uid);if(!p)return;const on=S.friends.includes(uid);
 const m=modal(`${avatarHTML(p,110)}<h2>@${esc(p.username)}</h2><div class="grid2 mini">${[['fire',p.streak||0,'Day streak'],['bolt',nf(p.xp||0),'Total XP'],['lg_'+TIERS[p.league||0][0].toLowerCase(),TIERS[p.league||0][0],'League'],['starg',p.level||1,'Level']].map(([i,v,l])=>`<div class="sc2">${ic(i,30)}<div><b>${v}</b><small>${l}</small></div></div>`).join('')}</div>
 ${on?`<button class="btn ghost wide" data-unf="${uid}">Unfollow</button>`:`<button class="btn wide" data-fol="${uid}">${ic('userplus',22)} Follow</button>`}<button class="link" data-close>Close</button>`);bindSocial(m,()=>{m.remove();go()})}
function bindSocial(r=document,after=go){
 $$('[data-fol]',r).forEach(b=>b.onclick=e=>{e.stopPropagation();const p=[...(SUG||[]),...(FOL||[]),...(LG?.rows||[])].find(x=>x.uid===b.dataset.fol);if(p){follow(p);after()}});
 $$('[data-unf]',r).forEach(b=>b.onclick=e=>{e.stopPropagation();unfollow(b.dataset.unf);after()});
 $$('[data-prof]',r).forEach(b=>b.onclick=()=>profModal(b.dataset.prof));$$('[data-addf]',r).forEach(b=>b.onclick=addFriends);
 $('#setU',r)&&($('#setU',r).onclick=editProfile);$('#pchk',r)&&($('#pchk',r).onclick=()=>cloud.load(user.uid).then(x=>{parentOK=!!x?.parentOK;go()}));
 if($('#son',r)){$('#pok',r)&&($('#pok',r).onchange=e=>$('#son',r).disabled=!e.target.checked);$('#son',r).onclick=()=>{S.social=true;save();$$('.modal').forEach(x=>x.remove());go()}}}

/* ---------- profile ---------- */
function profile(){const lb=levelBar(),hist=[...Array(7)].map((_,i)=>[day(i-6),S.hist[day(i-6)]||0]),mx=Math.max(S.goal,...hist.map(h=>h[1]));
 const stats=[['fire',streakNow(),'Day streak'],['bolt',nf(S.xp),'Total XP'],['lg_'+TIERS[S.league.tier][0].toLowerCase(),TIERS[S.league.tier][0],'Current league'],['medal',S.league.top3||0,'Top 3 finishes'],
  ['starg',lb.n,'Level'],['book',S.lessons,'Lessons'],['cards',wordsLearned(),'Words learned'],['clock',Math.round((S.secs||0)/60),'Minutes learned']];
 return `<div class="phero"><button class="gear" id="toSet" aria-label="Settings">${ic('gear',26)}</button><button class="pav" id="edp" aria-label="Edit avatar">${avatarHTML(myAv(),120)}<span class="pen">${ic('pencil',18)}</span></button>
 <div class="pinfo"><h1>${esc(S.name)}</h1>${S.username?`<p class="muted">@${esc(S.username)}</p>`:''}${S.bio?`<p class="bio">${esc(S.bio)}</p>`:''}<p class="muted small">${ic('calendar',16)} Joined ${new Date(S.joined+'T00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'})} · ${ic('flag',16)} Stocks</p>
 <div class="fcount"><button data-people="following"><b>${S.friends.length}</b> Following</button><button data-people="followers"><b>${FOL?FOL.length:realLeague()?'…':0}</b> Followers</button></div>
 <div class="acts"><button class="btn ghost sm" id="edp2">${ic('pencil',18)} Edit profile</button><button class="btn sm" data-addf>${ic('userplus',20)} Add friends</button></div></div></div>
 <div class="card lvl"><div class="chead"><h3>Level ${lb.n}</h3><small class="muted">${nf(lb.left)} XP to level ${lb.n+1}</small></div><div class="qbar big"><i style="width:${Math.max(4,lb.pct)}%"></i></div><p class="note">New avatar styles unlock as you level up.</p></div>
 <h2 class="sec">Statistics</h2><div class="grid2">${stats.map(([i,v,l])=>`<div class="sc2">${ic(i,32)}<div><b>${v}</b><small>${l}</small></div></div>`).join('')}</div>
 <h2 class="sec">This week</h2><div class="card"><div class="xpchart">${hist.map(([d,x])=>`<div><em>${x||''}</em><i style="height:${Math.max(4,x/mx*100)}%" class="${x>=S.goal?'hit':''}"></i><small>${new Date(d+'T00:00').toLocaleDateString(undefined,{weekday:'narrow'})}</small></div>`).join('')}</div><p class="note">Bars turn gold on days you hit your ${S.goal} XP goal.</p></div>
 <div class="mob">${realLeague()?`<div style="margin-top:20px">${suggestCard()}</div>`:''}<div style="margin-top:16px">${feedCard()}</div></div>
 <h2 class="sec">Achievements</h2><div class="card">${achList()}</div>
 <h2 class="sec">Monthly badges</h2><div class="card"><div class="badges">${S.badges.length?S.badges.map(b=>`<div>${monthBadge(b,64)}<small>${new Date(b+'-01T00:00').toLocaleDateString('en',{month:'short',year:'numeric'})}</small></div>`).join(''):`<div class="empty">${monthBadge(mon(),64,1)}<p class="muted">Finish ${MTARGET} quests in a month to earn its badge.</p></div>`}</div></div>
 <h2 class="sec">Chip’s outfit</h2><div class="hero">${chip(100)}<div class="grow"><h2>${S.wear.length?S.wear.map(w=>SHOP.find(i=>i.id===w)?.n).filter(Boolean).join(', '):'No outfit yet'}</h2><p class="muted">Buy outfits for Chip in the shop.</p><button class="btn sm" data-tab="shop" style="margin-top:10px">${ic('bag',20)} Shop</button></div></div>`}
function bindProfile(){$('#toSet').onclick=()=>go('settings');$('#edp').onclick=$('#edp2').onclick=editProfile;$$('[data-people]').forEach(b=>b.onclick=()=>realLeague()?peopleModal(b.dataset.people):addFriends());
 bindSocial();if(realLeague()){if(!FR)loadFriends();if(!FOL)loadFollowers();else if(!SUG&&FR)loadSuggest();
  // new followers stay highlighted for this visit, then count as seen
  if(FOL){const ids=FOL.map(f=>f.uid);if(ids.some(u=>!S.seenFol.includes(u))){setTimeout(()=>{S.seenFol=ids.slice(0,300);save()},1500)}}}}

/* ---------- edit profile + avatar builder ---------- */
const AVATARS=['🐂','🐻','🦊','🐼','🦁','🐯','🐸','🐵','🦉','🐙','🦄','🐲','🚀','💎','🌟','🐢'];
function editProfile(){let av={avatar:S.avatar,avMode:S.avMode,char:S.char,photo:S.photo,photoPublic:S.photoPublic};
 const m=modal(`<h2>Edit profile</h2><div class="avprev">${avatarHTML(av,110)}</div>
 <div class="segs"><button data-mode="emoji">Emoji</button><button data-mode="char">Character</button><button data-mode="photo">Photo</button></div><div class="avpane" id="avp"></div>
 <label><span>Name</span><input class="name" id="pn" maxlength="20" value="${esc(S.name)}"></label>
 <label><span>Username${user?'':' (sign in to pick one)'}</span><input class="name" id="pu" maxlength="20" placeholder="e.g. bullrunner" value="${esc(S.username)}" autocomplete="off" autocapitalize="none" ${user?'':'disabled'}></label>
 <label><span>Bio</span><textarea class="name" id="pbio" maxlength="120" placeholder="Tell friends about you">${esc(S.bio)}</textarea></label>
 <p class="err" id="perr"></p><button class="btn wide" id="psv">Save</button><button class="link" data-close>Cancel</button>`,'tall');
 const prev=()=>{$('.avprev',m).innerHTML=avatarHTML(av,110);$$('[data-mode]',m).forEach(b=>b.classList.toggle('on',b.dataset.mode===(av.avMode||'emoji')))};
 const pane=mode=>{const p=$('#avp',m);
  if(mode==='emoji'){p.innerHTML=`<div class="avs">${AVATARS.map(a=>`<button data-av="${a}" class="${a===av.avatar?'sel':''}">${a}</button>`).join('')}</div>`;
   $$('[data-av]',p).forEach(b=>b.onclick=()=>{av.avatar=b.dataset.av;av.avMode='emoji';$$('[data-av]',p).forEach(x=>x.classList.toggle('sel',x===b));prev()})}
  if(mode==='char'){p.innerHTML=`<button class="btn wide sky" id="bld">${ic('sparkle',22)} ${av.char?'Edit my character':'Create my character'}</button><p class="note">Level ${level()}: more hair, eyes and outfits unlock as you level up.</p>`;
   $('#bld',p).onclick=()=>builder(av.char,c=>{av.char=c;av.avMode='char';prev()});if(av.char){av.avMode='char';prev()}}
  if(mode==='photo'){p.innerHTML=`<label class="btn wide ghost upl">${ic('camera',24)} ${av.photo?'Choose a different photo':'Upload a photo'}<input type="file" accept="image/*" id="pf" hidden></label>
   <p class="note">Tip: a drawing, your pet or a favourite thing works great. Photos stay on your account${realLeague()?'':' and aren’t shown to anyone else'}.</p>
   ${realLeague()?`<label class="optin"><input type="checkbox" id="ppub" ${av.photoPublic?'checked':''}> Show my photo to friends (otherwise they see my character)</label>`:''}<p class="err" id="ferr2"></p>`;
   if(av.photo){av.avMode='photo';prev()}
   $('#pf',p).onchange=async e=>{const f=e.target.files[0];$('#ferr2',p).textContent='';try{av.photo=await readPhoto(f);av.avMode='photo';prev();SFX.coin()}catch(x){$('#ferr2',p).textContent=x.message==='type'?'That file isn’t a picture.':x.message==='big'?'That picture is too big (15 MB max).':'Couldn’t read that picture. Try another one.'}};
   $('#ppub',p)&&($('#ppub',p).onchange=e=>av.photoPublic=e.target.checked)}};
 $$('[data-mode]',m).forEach(b=>b.onclick=()=>{pane(b.dataset.mode);prev()});pane(av.avMode||'emoji');prev();
 $('#psv',m).onclick=async()=>{const n=$('#pn',m).value.trim(),u=$('#pu',m).value.trim().toLowerCase(),err=$('#perr',m);
  if(!n)return err.textContent='Name can’t be empty.';if(u&&!/^[a-z0-9_]{3,20}$/.test(u))return err.textContent='Username: 3–20 letters, numbers or _.';
  if(u!==S.username&&user){try{await cloud.claimUsername(user.uid,u,S.username)}catch(e){return err.textContent=e.message==='taken'?'That username is taken.':'Couldn’t save username right now.'}}
  if(!u&&S.social&&user){S.social=false;cloud.deleteProfile(user.uid).catch(console.error)}
  if(av.avMode==='photo'&&!av.photo)av.avMode='emoji';if(av.avMode==='char'&&!av.char)av.avMode='emoji';
  Object.assign(S,{name:n,username:u,bio:$('#pbio',m).value.trim(),...av});save();m.remove();SFX.coin();go()}}
// square-crop and shrink to 192px so the picture fits comfortably in the profile document
function readPhoto(file){return new Promise((ok,no)=>{if(!file||!/^image\//.test(file.type))return no(new Error('type'));if(file.size>15e6)return no(new Error('big'));
 const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const s=192,c=document.createElement('canvas'),k=Math.min(im.naturalWidth,im.naturalHeight);c.width=c.height=s;
  c.getContext('2d').drawImage(im,(im.naturalWidth-k)/2,(im.naturalHeight-k)/2,k,k,0,0,s,s);URL.revokeObjectURL(u);let d=c.toDataURL('image/webp',.8);if(!d.startsWith('data:image/webp'))d=c.toDataURL('image/jpeg',.8);ok(d)};
 im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('bad'))};im.src=u})}
const BCATS=[['skin','Skin',SKIN.map(()=>['',1])],['hair','Hair',AVP.hair],['hairC','Hair colour',HAIRC.map(h=>['',h[1]])],['eyes','Eyes',AVP.eyes],['mouth','Mouth',AVP.mouth],['top','Top',AVP.top],['shirt','Top colour',SHIRT.map(()=>['',1])],['acc','Extras',AVP.acc],['bg','Background',BGC.map(()=>['',1])]];
function builder(start,done){let c={...DEFCHAR,...start},cat=1;const lv=level();
 const m=modal(`<h2>Create your character</h2><div class="bprev" id="bp"></div><div class="bcats">${BCATS.map(([k,n],i)=>`<button data-cat="${i}">${n}</button>`).join('')}</div><div class="bopts" id="bo"></div><button class="btn wide" id="bsv">Done</button><button class="link" id="brnd">${ic('sparkle',18)} Surprise me</button>`,'tall');
 const draw=()=>{$('#bp',m).innerHTML=`<span class="avc" style="width:140px;height:140px">${charSVG(c,140)}</span>`;$$('[data-cat]',m).forEach(b=>b.classList.toggle('on',+b.dataset.cat===cat));
  const[k,,opts]=BCATS[cat];$('#bo',m).innerHTML=opts.map(([lbl,need],i)=>{const lock=need>lv,sw=['skin','hairC','shirt','bg'].includes(k);
   return `<button data-o="${i}" class="${c[k]===i?'sel':''} ${lock?'lock':''}" ${lock?'disabled':''} title="${lock?'Unlocks at level '+need:lbl}">${sw?`<i style="background:${k==='skin'?SKIN[i]:k==='hairC'?HAIRC[i][0]:k==='shirt'?SHIRT[i]:BGC[i]}"></i>`:`<span class="avc" style="width:60px;height:60px">${charSVG({...c,[k]:i},60)}</span>`}${lock?`<em>${ic('lock',14)} Lv ${need}</em>`:sw?'':`<small>${lbl}</small>`}</button>`}).join('');
  $$('[data-o]',m).forEach(b=>b.onclick=()=>{c[k]=+b.dataset.o;SFX.tap();draw();gsap.fromTo('#bp .avc',{scale:.92},{scale:1,duration:.3,ease:'back.out(3)'})})};
 $$('[data-cat]',m).forEach(b=>b.onclick=()=>{cat=+b.dataset.cat;draw()});
 $('#brnd',m).onclick=()=>{for(const[k,,o]of BCATS){const ok=o.map((x,i)=>x[1]<=lv?i:-1).filter(i=>i>=0);c[k]=ok[Math.random()*ok.length|0]}draw()};
 $('#bsv',m).onclick=()=>{m.remove();done(c)};draw()}
