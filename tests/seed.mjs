// Seeds the LOCAL Firestore emulator with hundreds of test learners for league / friends testing.
// Every learner is written as itself through the real security rules, so the seed doubles as a rules load test.
// It refuses to run against anything but the emulator with a `demo-` project id, which can never reach production.
//   npx firebase emulators:exec --only auth,firestore --project demo-chip "node tests/seed.mjs 300"
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDocs,collection} from 'firebase/firestore';
import fs from 'node:fs';

export const PROJECT='demo-chip';
export function guard(){const host=process.env.FIRESTORE_EMULATOR_HOST;
 if(!host||!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host))throw new Error('Refusing to seed: FIRESTORE_EMULATOR_HOST is not a local emulator. Run through `firebase emulators:exec`.');return host}
export async function testEnv(){const[host,port]=guard().split(/:(?=\d+$)/);
 return initializeTestEnvironment({projectId:PROJECT,firestore:{host,port:+port,rules:fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}})}

// small deterministic PRNG so a seed run is reproducible
const rng=s=>{let a=[...String(s)].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619),2166136261)>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
export const wk=(o=0)=>{const d=new Date();d.setDate(d.getDate()-(d.getDay()+6)%7+o*7);return d.toLocaleDateString('en-CA')};
const WORDS=['bull','bear','coin','gem','pip','dip','moon','stock','fund','bond','chart','tick','penny','nugget','acorn','piggy','vault','sprout','rocket','comet'];
const EVENTS=[['back',35],['back',9],['streak',7],['streak',30],['promo',1],['promo',3],['top3',1],['chapter',2],['level',5],['badge','2026-09'],['join',0]];

/** Creates `n` learners. tiers: array of [tier, count] filled first, the rest spread over all tiers.
 *  followTargets: uids that `followers` of the seeded learners should follow (to give real test users followers). */
export async function seed(env,{n=300,tiers=[[0,140],[1,20]],followTargets=[],followers=25,stale=0.1,tag='seed'}={}){
 const r=rng(tag+n),week=wk(),plan=[];for(const[t,c]of tiers)for(let i=0;i<c;i++)plan.push(t);while(plan.length<n)plan.push(2+(r()*8|0));
 const users=plan.slice(0,n).map((tier,i)=>({uid:`${tag}_${String(i).padStart(4,'0')}`,username:`t_${WORDS[i%WORDS.length]}${i}`,tier,
  stale:r()<stale}));
 const ids=users.map(u=>u.uid);
 // write in batches of 25 learners at a time
 for(let i=0;i<users.length;i+=25)await Promise.all(users.slice(i,i+25).map(async(u,k)=>{const db=env.authenticatedContext(u.uid).firestore(),j=i+k;
  const following=[...new Set([...Array(r()*12|0)].map(()=>ids[r()*ids.length|0]).filter(x=>x!==u.uid).concat(j<followers?followTargets:[]))];
  const feed=[...Array(r()*4|0)].map((_,q)=>{const[k2,v]=EVENTS[r()*EVENTS.length|0];return{k:k2,v,t:Date.now()-(q+1)*36e5*(1+r()*20|0)}});
  const xp=r()*4000|0;
  await setDoc(doc(db,'usernames',u.username),{uid:u.uid});
  await setDoc(doc(db,'profiles',u.uid),{username:u.username,avatar:'🐂',avMode:'char',char:{skin:r()*6|0,hair:r()*9|0,hairC:r()*6|0,eyes:r()*3|0,mouth:r()*3|0,acc:r()*3|0,top:r()*2|0,shirt:r()*8|0,bg:r()*7|0},
   xp,streak:r()*60|0,weekId:u.stale?wk(-1):week,weekXp:u.stale?0:(r()**1.6)*400|0,league:u.tier,level:1+(Math.sqrt(xp/25)|0),feed,following,updatedAt:Date.now()})}));
 return users}

export async function allProfiles(env){let out;await env.withSecurityRulesDisabled(async c=>{out=(await getDocs(collection(c.firestore(),'profiles'))).docs.map(d=>({uid:d.id,...d.data()}))});return out}

if(import.meta.url===`file://${process.argv[1]}`){const env=await testEnv(),n=+(process.argv[2]||300),t0=Date.now();const u=await seed(env,{n});
 console.log(`Seeded ${u.length} test learners into ${PROJECT} on ${process.env.FIRESTORE_EMULATOR_HOST} in ${Date.now()-t0} ms`);await env.cleanup()}
