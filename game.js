// Game systems: gems, levels, daily quests + chest, monthly challenge badges, tiered achievements,
// streak protection (freeze, weekend amulet, repair), the shop, and the small UI helpers they share.
/* ---------- helpers ---------- */
const hashStr=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
// mulberry32: deterministic randomness, so quests and rivals look the same on every device for a given day
const rng=seed=>{let a=hashStr(seed);return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const mon=()=>day().slice(0,7);
const GEMI=(s=18)=>ic('gem',s,'ci');
const nf=n=>Number(n).toLocaleString('en-US');
function modal(html,cls=''){const m=document.createElement('div');m.className='modal '+cls;m.innerHTML=`<div role="dialog" aria-modal="true">${html}</div>`;
 (document.querySelector('#lesson:not([hidden])')||document.body).appendChild(m);ensureDefs();animateChips(m);
 m.onclick=e=>{if(e.target===m)closeModal(m)};m.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(m));
 window.gsap&&gsap.from(m.firstChild,{yPercent:innerWidth<700?100:0,scale:innerWidth<700?1:.9,opacity:innerWidth<700?1:0,duration:.35,ease:'power3.out'});return m}
function closeModal(m){if(!m?.isConnected)return;m.remove();setTimeout(showNext,60)}
// slide-down banner for things that happen outside a lesson
function notify(icon,title,sub=''){const d=document.createElement('div');d.className='notify';d.innerHTML=`${icon}<div><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div>`;document.body.appendChild(d);
 if(!window.gsap)return setTimeout(()=>d.remove(),2600);gsap.timeline({onComplete:()=>d.remove()}).from(d,{y:-90,duration:.45,ease:'back.out(1.6)'}).to(d,{y:-90,opacity:0,delay:2.4,duration:.35})}
// gems fly from a button to the counter in the top bar
function gemFly(from,n=6){const to=document.querySelector('.stat.gems');if(!from||!to||!window.gsap)return;const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
 for(let i=0;i<Math.min(n,10);i++){const g=document.createElement('div');g.className='fly';g.innerHTML=GEMI(22);document.body.appendChild(g);
  gsap.fromTo(g,{x:a.left+a.width/2-11+(Math.random()-.5)*40,y:a.top+a.height/2-11+(Math.random()-.5)*20,scale:.4},{x:b.left+6,y:b.top+4,scale:1,duration:.7+i*.05,delay:i*.04,ease:'power2.in',onComplete:()=>{g.remove();gsap.fromTo(to,{scale:1.25},{scale:1,duration:.3})}})}}
// celebrations queue up and show one at a time once the learner is back on the main screens
const CELEB=[];
function celebrate(c){CELEB.push(c);if($('#lesson').hidden&&!$('.modal'))setTimeout(showNext,250)}
function showNext(){if(!CELEB.length||!$('#lesson').hidden||$('.modal')||!$('.shell'))return;const c=CELEB.shift();
 const m=modal(`<div class="celeb-art">${c.art}</div><h2>${c.title}</h2><p class="muted">${c.text||''}</p>${c.gems?`<div class="earn">+${c.gems} ${GEMI(22)}</div>`:''}${c.extra||''}<button class="btn wide" data-close>${c.btn||'Nice!'}</button>`,'celebm');
 if(!c.sad){SFX.win();confetti()}window.gsap&&gsap.from($('.celeb-art',m),{scale:0,rotation:-20,duration:.8,ease:'elastic.out(1,.45)'});c.after?.(m)}

/* ---------- levels ---------- */
const lvlXP=n=>25*n*(n-1); // 0, 50, 150, 300, 500…
const level=(x=S.xp)=>{let n=1;while(lvlXP(n+1)<=x)n++;return n};
function levelBar(){const n=level(),a=lvlXP(n),b=lvlXP(n+1);return{n,pct:(S.xp-a)/(b-a)*100,left:b-S.xp}}

/* ---------- friend-visible events ---------- */
function pushEvent(k,v){S.feed=[{k,v,t:Date.now()},...(S.feed||[]).filter(e=>!(e.k===k&&e.v===v))].slice(0,10)}
const FEEDTXT={back:(n,v)=>[`${n} came back to learn about stocks after ${v>=28?Math.round(v/30)+' month'+(v>=45?'s':''):v+' days'}`,'wave'],
 streak:(n,v)=>[`${n} reached a ${v}-day streak`,'fire'],promo:(n,v)=>[`${n} was promoted to the ${TIERS[v]?.[0]||''} League`,'lg_'+(TIERS[v]?.[0]||'bronze').toLowerCase()],
 top3:(n,v)=>[`${n} finished #${v} in their league`,'trophy'],chapter:(n,v)=>[`${n} finished Chapter ${v+1}: ${COURSE[v]?.title||''}`,'book'],
 badge:(n,v)=>[`${n} earned the ${new Date(v+'-01T00:00').toLocaleDateString('en',{month:'long'})} badge`,'medal'],
 ach:(n,v)=>[`${n} unlocked ${v}`,'starg'],level:(n,v)=>[`${n} reached level ${v}`,'bolt'],join:n=>[`${n} started learning with Chip`,'sparkle'],
 follow:n=>[`${n} started following you`,'userplus']};

/* ---------- daily quests ---------- */
// [icon, label, target(), gems, available()]
const QPOOL={xp:['bolt',n=>`Earn ${n} XP`,()=>Math.max(20,Math.round(S.goal*1.5/10)*10),10],
 lessons:['book',n=>`Complete ${n} lessons`,()=>2,10],perfects:['target',()=>'Finish a lesson with no mistakes',()=>1,15],
 combo:['fire',n=>`Get ${n} answers right in a row`,r=>[5,8,10][r()*3|0],10],acc90:['starg',n=>`Score 90% or more in ${n} lessons`,()=>2,15],
 minutes:['clock',n=>`Learn for ${n} minutes`,()=>5,10],practice:['refresh',()=>'Finish a practice session',()=>1,10,()=>doneCount()>0],
 story:['story',()=>'Finish a story or reading',()=>1,15,()=>storiesOpen().length>0],listen:['headphones',()=>'Finish a listening session',()=>1,15,()=>doneCount()>0],
 speak:['mic',()=>'Finish a speaking session',()=>1,15,()=>doneCount()>0],words:['cards',n=>`Review ${n} words`,()=>8,10,()=>wordsOpen().length>=4]};
const doneCount=()=>Object.keys(S.done).length;
function Q(){if(S.quests?.day===day()&&S.quests.list)return S.quests;const r=rng(day()+S.name),keys=Object.keys(QPOOL).filter(k=>k!=='xp'&&(!QPOOL[k][4]||QPOOL[k][4]()));
 const pickd=[];while(pickd.length<2&&keys.length)pickd.push(keys.splice(r()*keys.length|0,1)[0]);
 return S.quests={day:day(),list:['xp',...pickd].map(k=>[k,QPOOL[k][2](r),QPOOL[k][3]]),c:{},claimed:[],chest:0}}
const qv=k=>Q().c[k]||0;
function qbump(k,n=1){Q().c[k]=(Q().c[k]||0)+n}
function qmax(k,v){const q=Q();q.c[k]=Math.max(q.c[k]||0,v)}
const qready=()=>Q().list.filter(([k,n])=>qv(k)>=n&&!Q().claimed.includes(k)).length;
const msLeft=()=>{const d=new Date();d.setHours(24,0,0,0);return d-Date.now()};
const hLeft=()=>{const m=Math.ceil(msLeft()/6e4);return m>=60?Math.floor(m/60)+' hours':m+' min'};
function questRows(mini){const q=Q();return q.list.map(([k,n,g])=>{const[icn,lbl]=QPOOL[k],v=Math.min(Math.floor(qv(k)),n),got=q.claimed.includes(k),done=v>=n;
 return `<div class="quest ${got?'got':''}">${ic(icn,mini?30:40)}<div><b>${lbl(n)}</b><div class="qbar"><i style="width:${Math.max(6,v/n*100)}%"></i><em>${v} / ${n}</em></div></div>
 ${mini?(got?`<span class="qok">${ic('check',20)}</span>`:ic(done?'chestopen':'chest',30)):got?`<span class="qok">${ic('check',22)}</span>`:`<button class="btn ${done?'gold':'ghost'} sm" data-claim="${k}" ${done?'':'disabled'}>${GEMI()} ${g}</button>`}</div>`}).join('')}
function questCard(mini){const q=Q(),all=q.claimed.length===q.list.length;return `<div class="card">${mini?`<div class="chead"><h3>Daily Quests</h3><button class="link" data-tab="quests">View all</button></div>`:''}${questRows(mini)}
 ${!mini&&all?`<div class="chestrow">${ic(q.chest?'chestopen':'chest',56)}<div><b>${q.chest?'Chest opened':'All quests done!'}</b><p class="muted">${q.chest?`You found ${q.chest} gems. New quests in ${hLeft()}.`:'Open your bonus chest.'}</p></div>${q.chest?'':'<button class="btn gold sm" id="openChest">Open</button>'}</div>`:''}</div>`}
function claim(k,btn){const q=Q(),x=q.list.find(z=>z[0]===k);if(!x||q.claimed.includes(k)||qv(k)<x[1])return;q.claimed.push(k);S.gems+=x[2];S.qdone=(S.qdone||0)+1;
 gemFly(btn,x[2]/2);SFX.coin();monthBump();checkAch();save();go()}
function openChest(btn){const q=Q();if(q.chest||q.claimed.length<q.list.length)return;const g=15+(rng(day()+'chest'+S.name)()*26|0);q.chest=g;S.gems+=g;save();
 const m=modal(`<div class="celeb-art">${ic('chest',120)}</div><h2>Quest chest</h2><p class="muted">For finishing every daily quest.</p><div class="earn" style="opacity:0">+${g} ${GEMI(22)}</div><button class="btn wide" data-close>Collect</button>`);
 const a=$('.celeb-art',m);gsap.timeline().to(a,{rotation:-8,duration:.08,repeat:5,yoyo:true}).add(()=>{a.innerHTML=ic('chestopen',120);SFX.win();confetti()}).from(a,{scale:.6,duration:.5,ease:'back.out(3)'}).to($('.earn',m),{opacity:1,duration:.3});
 $('[data-close]',m).onclick=()=>{gemFly($('[data-close]',m),8);m.remove();go()}}

/* ---------- monthly challenge ---------- */
const MTARGET=30;
const MO=()=>S.monthly?.id===mon()?S.monthly:(S.monthly={id:mon(),n:0});
function monthBump(){const m=MO();m.n++;if(m.n===MTARGET&&!S.badges.includes(m.id)){S.badges=[...S.badges,m.id];S.gems+=50;pushEvent('badge',m.id);
 celebrate({art:monthBadge(m.id,140),title:`${new Date(m.id+'-01T00:00').toLocaleDateString('en',{month:'long'})} badge earned!`,text:`You finished ${MTARGET} quests this month.`,gems:50})}}
function monthCard(){const m=MO(),dn=new Date(),left=new Date(dn.getFullYear(),dn.getMonth()+1,0).getDate()-dn.getDate(),got=S.badges.includes(m.id);
 return `<div class="card month"><div class="mhead">${monthBadge(m.id,72,!got)}<div><small class="muted">MONTHLY CHALLENGE</small><h3>${got?'Badge earned!':`Complete ${MTARGET} quests`}</h3><p class="muted">${left} day${left===1?'':'s'} left · earn the ${dn.toLocaleDateString('en',{month:'long'})} badge</p></div></div>
 <div class="qbar big"><i style="width:${Math.max(4,Math.min(1,m.n/MTARGET)*100)}%"></i><em>${Math.min(m.n,MTARGET)} / ${MTARGET}</em></div></div>`}
function quests(){return `<div class="pagehead">${ic('chest',56)}<div><h1>Quests</h1><p class="muted">New daily quests in ${hLeft()}</p></div></div>
 ${monthCard()}<h2 class="sec">Daily quests</h2>${questCard()}
 <h2 class="sec">Badges</h2><div class="card"><div class="badges">${S.badges.length?S.badges.map(b=>`<div>${monthBadge(b,72)}<small>${new Date(b+'-01T00:00').toLocaleDateString('en',{month:'short',year:'numeric'})}</small></div>`).join(''):`<div class="empty">${monthBadge(mon(),72,1)}<p class="muted">Finish ${MTARGET} quests in a month to earn that month’s badge.</p></div>`}</div></div>`}

/* ---------- achievements (tiered) ---------- */
const chaptersDone=()=>COURSE.filter(c=>c.lessons.every(l=>S.done[l.id])).length;
const ACH=[['wildfire','Wildfire','fire',['#FF8A1F','#E5600A'],n=>`Reach a ${n}-day streak`,()=>S.best,[3,7,14,30,60,100,180,365]],
 ['sage','Sage','bolt',['#FFC800','#E5A100'],n=>`Earn ${nf(n)} XP`,()=>S.xp,[100,250,500,1000,2000,4000,7500,12000]],
 ['scholar','Scholar','book',['#4CC417','#3A9E0F'],n=>`Complete ${n} lesson${n>1?'s':''}`,()=>S.lessons,[1,10,25,50,100,200,350,500]],
 ['sharp','Sharpshooter','target',['#FF4B6E','#DE2F55'],n=>`Finish ${n} lesson${n>1?'s':''} with no mistakes`,()=>S.perfects,[1,5,10,25,50,100,200]],
 ['champ','Champion','trophy',['#FFC800','#E5A100'],n=>`Finish ${n} chapter${n>1?'s':''}`,chaptersDone,[1,3,5,10,15,22]],
 ['quest','Overachiever','chest',['#E8913E','#B8641F'],n=>`Complete ${n} daily quests`,()=>S.qdone||0,[3,10,30,75,150,300]],
 ['story','Storyteller','story',['#C77DFF','#AF5CF0'],n=>`Finish ${n} ${n>1?'stories or readings':'story or reading'}`,()=>Object.keys(S.stories).length,[1,3,5,8]],
 ['words','Wordsmith','cards',['#2EC4FF','#159BE0'],n=>`Learn ${n} words`,()=>wordsLearned(),[10,25,50,75]],
 ['invest','Investor','chart',['#4CC417','#3A9E0F'],n=>`Own ${n} different compan${n>1?'ies':'y'} in Chip’s Fund`,()=>Object.keys(S.fund.h).length,[1,3,5,10]],
 ['friend','Friendly','users',['#2EC4FF','#159BE0'],n=>`Follow ${n} friend${n>1?'s':''}`,()=>S.friends.length,[1,3,5,10,20]],
 ['climb','League climber','lg_gold',['#8B5CF6','#6D3FE0'],n=>`Reach the ${TIERS[n][0]} League`,()=>S.league.best||0,[1,2,3,4,5,6,7,8,9]],
 ['winner','Conqueror','crown',['#FFC800','#E5A100'],n=>`Finish #1 in a league ${n} time${n>1?'s':''}`,()=>S.league.wins||0,[1,3,5,10]]];
const achTier=a=>a[6].filter(t=>a[5]()>=t).length;
function checkAch(){for(const a of ACH){const t=achTier(a),had=S.ach[a[0]]||0;if(t>had){S.ach[a[0]]=t;const g=5*t+5;S.gems+=g;pushEvent('ach',`${a[1]} level ${t}`);
 celebrate({art:badge(a[2],a[3],t,120),title:'Achievement unlocked!',text:`<b>${a[1]}</b> level ${t}: ${a[4](a[6][t-1])}.`,gems:g})}}}
function achList(n){return `<div class="achs">${ACH.slice(0,n).map(a=>{const t=achTier(a),max=t>=a[6].length,goal=a[6][Math.min(t,a[6].length-1)],v=a[5]();
 return `<div class="ach ${t?'':'no'}">${badge(a[2],a[3],t||1,58,!t)}<div><div class="achh"><h3>${a[1]}</h3><small class="muted">${max?'MAX':`${Math.min(v,goal)}/${goal}`}</small></div><div class="qbar"><i style="width:${Math.max(5,max?100:v/goal*100)}%"></i></div><p class="muted">${a[4](goal)}</p></div></div>`}).join('')}</div>`}

/* ---------- streak protection ---------- */
const dowOf=s=>new Date(s+'T00:00').getDay();
// runs whenever the app renders: weekend amulet, then freezes, cover missed days; otherwise the streak ends (repairable for 3 days)
function streakCheck(){if(!S.lastDay||S.lastDay>=day(-1)||!S.streak)return;const miss=[];
 for(let d=new Date(S.lastDay+'T00:00');;){d.setDate(d.getDate()+1);const s=d.toLocaleDateString('en-CA');if(s>=day()||miss.length>400)break;miss.push(s)}
 let left=miss;if(S.amulet&&miss.some(s=>[0,6].includes(dowOf(s)))){const we=miss.filter(s=>[0,6].includes(dowOf(s)));if(we.length<=2){left=miss.filter(s=>!we.includes(s));S.amulet=0;S.frozen=[...S.frozen,...we].slice(-30)}}
 if(left.length<=S.freezes){S.freezes-=left.length;S.frozen=[...S.frozen,...left].slice(-30);S.lastDay=day(-1);save();
  if(miss.length)notify(ic('ice',36),'Your streak was protected!',`${miss.length} missed day${miss.length>1?'s':''} covered`);return}
 S.lostStreak={n:S.streak,day:day(),miss};S.streak=0;save();
 celebrate({sad:1,art:chip(130,S.wear,'sad'),title:`Your ${S.lostStreak.n}-day streak ended`,text:'Repair it in the shop in the next 3 days, or start a new one today.',btn:'Got it',
  extra:`<button class="btn gold wide" id="rpr" ${S.gems<250?'disabled':''}>${ic('repair',22)} Repair for ${GEMI()} 250</button>`,after:m=>{$('#rpr',m).onclick=()=>{buy('repair');m.remove();setTimeout(showNext,60)}}})}
const canRepair=()=>S.lostStreak?.n&&S.lostStreak.day>=day(-2);
function repair(){const l=S.lostStreak;S.streak=l.n+(S.lastDay===day()?S.streak:0);if(S.lastDay!==day())S.lastDay=day(-1);S.frozen=[...S.frozen,...(l.miss||[])].slice(-30);S.best=Math.max(S.best,S.streak);S.lostStreak=null}

/* ---------- top-bar popovers ---------- */
function streakPop(){const n=streakNow(),days=[...Array(7)].map((_,i)=>day(i-6));
 modal(`<div class="flame">${ic(S.lastDay===day()?'fire':'fireoff',90)}</div><h2>${n} day streak</h2><p class="muted">${S.lastDay===day()?'You’ve learned today. See you tomorrow!':n?`Do a lesson today to keep it going! ${hLeft()} left.`:'Do a lesson to start a streak.'}</p>
 <div class="week">${days.map(d=>`<div>${new Date(d+'T00:00').toLocaleDateString(undefined,{weekday:'narrow'})}<i class="${S.days.includes(d)?'on':S.frozen.includes(d)?'frz':''}">${S.days.includes(d)?ic('check',16):S.frozen.includes(d)?ic('ice',18):''}</i></div>`).join('')}</div>
 <div class="pills"><span>${ic('ice',20)} ${S.freezes}/2 freezes</span><span>${ic('amulet',20)} ${S.amulet?'Amulet on':'No amulet'}</span><span>${ic('trophy',20)} Best ${S.best}</span></div>
 <button class="btn wide" data-close>${S.lastDay===day()?'Great':'Let’s go'}</button>`)}
function heartPop(){regen();const m=modal(`<div class="hrow">${[...Array(5)].map((_,i)=>ic(i<S.hearts?'heart':'heartoff',40)).join('')}</div><h2>${S.hearts===5?'Full hearts':`${S.hearts} hearts`}</h2>
 <p class="muted">${S.hearts<5?`Next heart in ${nextHeartMin()} min. Practice earns hearts back without losing any.`:'You lose a heart for each mistake in a lesson. Practice never costs hearts.'}</p>
 ${S.hearts<5?`<button class="btn wide" id="hb" ${S.gems<80?'disabled':''}>${ic('refill',22)} Refill for ${GEMI()} 80</button><button class="btn ghost wide" id="hp">Practice to earn hearts</button>`:''}<button class="link" data-close>Close</button>`);
 $('#hb',m)&&($('#hb',m).onclick=()=>{buy('refill');m.remove()});$('#hp',m)&&($('#hp',m).onclick=()=>{m.remove();go('practice')})}
function gemPop(){const m=modal(`<div class="celeb-art">${ic('gem',90)}</div><h2>${nf(S.gems)} gems</h2><p class="muted">Earn gems from quests, chests, achievements, streak milestones and league finishes. Spend them in the shop.</p><p class="muted" style="font-size:14px">${ic('coin',18)} Coins are different: you earn them from lessons and invest them in Chip’s Fund.</p><button class="btn wide" id="gs">Go to shop</button><button class="link" data-close>Close</button>`);$('#gs',m).onclick=()=>{m.remove();go('shop')}}

/* ---------- shop ---------- */
const POWER=[{id:'refill',n:'Heart refill',d:'Fill all 5 hearts right now',p:80,i:'refill'},{id:'freeze',n:'Streak freeze',d:'Covers one missed day automatically. Hold up to 2.',p:120,i:'ice'},
 {id:'amulet',n:'Weekend amulet',d:'Skip Saturday and Sunday without losing your streak',p:150,i:'amulet'},{id:'repair',n:'Streak repair',d:'Bring back a streak you lost in the last 3 days',p:250,i:'repair'},
 {id:'boost',n:'Double XP',d:'Earn 2× XP for the next 15 minutes',p:100,i:'potion'}];
const SHOP=[{id:'tie',n:'Bow tie',d:'A dapper deal-maker',p:100,e:'tie'},{id:'shades',n:'Cool shades',d:'For bright bull markets',p:150,e:'shades'},{id:'party',n:'Party hat',d:'Celebrate every green day',p:150,e:'party'},
 {id:'scarf',n:'Cozy scarf',d:'Warm in a bear market',p:160,e:'scarf'},{id:'monocle',n:'Monocle',d:'Read the fine print',p:180,e:'monocle'},{id:'cap',n:'Ball cap',d:'Game-day investor',p:180,e:'cap'},
 {id:'hat',n:'Top hat',d:'Very fancy investor',p:220,e:'hat'},{id:'phones',n:'Headphones',d:'Tune out the noise',p:250,e:'phones'},{id:'cape',n:'Hero cape',d:'Saves the day (and money)',p:300,e:'cape'},{id:'crown',n:'Gold crown',d:'King of the market',p:400,e:'crown'}];
const SLOTS=[['hat','crown','party','cap'],['shades','monocle'],['tie','scarf'],['phones']];
function powerState(id){return id==='refill'?S.hearts>=5&&'Full':id==='freeze'?S.freezes>=2&&'2 / 2':id==='amulet'?S.amulet&&'Equipped':id==='repair'?!canRepair()&&'None':id==='boost'?boosted()&&'Active':false}
function shop(){return `<div class="pagehead">${ic('bag',56)}<div><h1>Shop</h1><p class="muted">Spend gems on power-ups and outfits for Chip</p></div></div>
 <div class="hero" id="shopHero">${chip(120)}<div class="grow"><h2>${nf(S.gems)} gems</h2><p class="muted">Earn gems from quests, chests, achievements and leagues.</p></div></div>
 <h2 class="sec">Power-ups</h2><div class="list">${POWER.map(i=>{const st=powerState(i.id);const d=i.id==='repair'&&canRepair()?`Bring back your ${S.lostStreak.n}-day streak`:i.d;
  return `<div class="shopitem"><span class="ae">${ic(i.i,40)}</span><div><h3>${i.n}</h3><p class="muted">${d}</p></div><button class="btn ${st?'ghost':'gold'} sm" data-buy="${i.id}" ${st||S.gems<i.p?'disabled':''}>${st||GEMI()+' '+i.p}</button></div>`}).join('')}</div>
 <h2 class="sec">Outfits for Chip</h2><div class="outfits">${SHOP.map(i=>{const own=S.owned.includes(i.id),on=S.wear.includes(i.id);
  return `<div class="ocard ${on?'on':''}"><span class="oprev">${chip(84,[i.e])}</span><h3>${i.n}</h3><p class="muted">${i.d}</p>${own?`<button class="btn ${on?'ghost':''} sm" data-buy="${i.id}">${on?'Take off':'Wear'}</button>`:`<button class="btn gold sm" data-buy="${i.id}" ${S.gems<i.p?'disabled':''}>${GEMI()} ${i.p}</button>`}</div>`}).join('')}</div>
 <div class="tip">${ic('coin',28)}<span>Coins aren’t spent here. You earn them from lessons and invest them in Chip’s Fund.</span></div>`}
function buy(id,btn){const i=SHOP.find(x=>x.id===id)||POWER.find(x=>x.id===id);if(!i)return;const pay=()=>{if(S.gems<i.p)return false;S.gems-=i.p;return true};
 if(POWER.includes(i)){if(powerState(id)||!pay())return;
  if(id==='refill')S.hearts=5;if(id==='freeze')S.freezes++;if(id==='amulet')S.amulet=1;if(id==='boost')S.boostUntil=Date.now()+15*60e3;if(id==='repair'){repair();notify(ic('fire',36),'Streak repaired!',`Back to ${S.streak} days`)}}
 else if(!S.owned.includes(id)){if(!pay())return;S.owned.push(id);S.wear.push(id)}
 else S.wear=S.wear.includes(id)?S.wear.filter(x=>x!==id):[...S.wear,id];
 const sl=SLOTS.find(g=>g.includes(id));if(sl&&S.wear.includes(id))S.wear=S.wear.filter(x=>x===id||!sl.includes(x));
 save();SFX.coin();go();chipJump($('#shopHero .chip'))}
