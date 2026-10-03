// Fetches ~60 daily closes per ticker (Yahoo, falling back to Stooq) and writes prices.json.
// Tickers that fail keep their previous data so one bad fetch never blanks the fund.
import fs from 'fs';
const T=['SPY','AAPL','NKE','DIS','RBLX','MCD','KO','NFLX','MSFT','AMZN','NVDA','TSLA','SBUX','GOOGL'],N=60;
const old=fs.existsSync('prices.json')?JSON.parse(fs.readFileSync('prices.json','utf8')):{p:{}};
const yahoo=async t=>{const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=6mo&interval=1d`,{headers:{'User-Agent':'Mozilla/5.0'}});const j=await r.json(),q=j.chart.result[0];return q.indicators.quote[0].close.filter(x=>x!=null)};
const stooq=async t=>{const r=await fetch(`https://stooq.com/q/d/l/?s=${t.toLowerCase()}.us&i=d`);return (await r.text()).trim().split('\n').slice(1).map(l=>+l.split(',')[4]).filter(x=>x>0)};
const p={};let ok=0;
for(const t of T){for(const f of [yahoo,stooq]){try{const c=await f(t);if(c.length>=20){p[t]=c.slice(-N).map(x=>+x.toFixed(2));ok++;break}}catch(e){console.error(t,f.name,e.message)}}
 if(!p[t]&&old.p[t])p[t]=old.p[t]}
if(!ok)throw new Error('no prices fetched');
fs.writeFileSync('prices.json',JSON.stringify({updated:new Date().toISOString().slice(0,10),sample:false,p})+'\n');
console.log(`updated ${ok}/${T.length}`);
