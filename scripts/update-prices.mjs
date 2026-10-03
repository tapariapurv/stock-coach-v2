// Fetches ~60 daily closes per ticker from Yahoo Finance and writes prices.json.
// Tickers that fail keep their previous data so one bad fetch never blanks the fund.
import fs from 'fs';
const T=['SPY','AAPL','NKE','DIS','RBLX','MCD','KO','NFLX','MSFT','AMZN','NVDA','TSLA','SBUX','GOOGL'],N=60;
const old=fs.existsSync('prices.json')?JSON.parse(fs.readFileSync('prices.json','utf8')):{p:{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function yahoo(t){
 for(const host of ['query1','query2','query1']){
  const r=await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${t}?range=6mo&interval=1d`,{headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}});
  if(r.ok){const q=(await r.json()).chart.result[0],c=q.indicators.quote[0].close;
   const rows=q.timestamp.map((s,i)=>[new Date(s*1e3).toISOString().slice(0,10),c[i]]).filter(x=>x[1]!=null);
   if(rows.length>=20)return rows.slice(-N)}
  console.error(t,host,r.status);await sleep(1500)}
 throw new Error('yahoo failed')}
const p={};let ok=0,last='';
for(const t of T){try{const rows=await yahoo(t);p[t]=rows.map(x=>+x[1].toFixed(2));if(rows.at(-1)[0]>last)last=rows.at(-1)[0];ok++}catch(e){console.error(t,e.message);if(old.p[t]&&!old.sample)p[t]=old.p[t]}await sleep(400)}
if(ok<T.length/2)throw new Error(`only ${ok}/${T.length} tickers fetched`);
fs.writeFileSync('prices.json',JSON.stringify({updated:last,source:'Yahoo Finance',sample:false,p})+'\n');
console.log(`updated ${ok}/${T.length}, last close ${last}`);
