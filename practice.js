// Practice hub: personalised workout, mistakes review, words (flashcards), listening, speaking, stories and reading.
// Content unlocks as the matching chapter starts. Item shapes match the lesson engine in index.html.
/* ---------- words: [term, meaning, chapter index] ---------- */
const WORDS=[['Stock','A small piece of ownership in a company',0],['Share','One unit of a company’s stock',0],['Shareholder','Someone who owns shares of a company',0],['IPO','When a company sells shares to the public for the first time',0],
 ['Dividend','Part of a company’s profit paid to shareholders',0],['Gain','Money you make by selling for more than you paid',0],['Loss','Money you lose by selling for less than you paid',0],
 ['Stock market','Where people buy and sell stocks',1],['Exchange','A marketplace, like the NYSE, where stocks are traded',1],['Ticker symbol','A short code for a stock, like AAPL for Apple',1],
 ['Supply','How much of something is for sale',1],['Demand','How much people want to buy something',1],['Risk','The chance that you could lose money',1],['Diversify','Spread money across many different investments',1],
 ['Saving','Keeping money safe for later',2],['Investing','Using money to buy things that can grow in value',2],['Emergency fund','Savings kept for surprise costs',2],
 ['Interest','Extra money paid for letting someone use your money',3],['Compound interest','Earning interest on your interest',3],['Rule of 72','72 divided by the growth rate is about how many years money takes to double',3],
 ['Budget','A plan for how you will use your money',4],['Need','Something you must have, like food or a home',4],['Want','Something nice to have but not necessary',4],
 ['Fund','A basket that holds many investments at once',5],['ETF','A fund that trades on the stock market like a single stock',5],
 ['Index','A list that tracks a group of stocks, like the S&P 500',6],['Index fund','A fund that buys every company in an index',6],
 ['Bond','A loan you give to a company or government that pays you interest',7],['Revenue','All the money a company takes in from sales',8],['Profit','The money left after a company pays all its costs',8],
 ['Earnings','A company’s profit over a period of time',9],['P/E ratio','A stock’s price divided by its earnings per share',10],['Valuation','How much a company is worth',10],
 ['Bull market','A long stretch when stock prices are rising',11],['Bear market','A long stretch when stock prices are falling',11],['Crash','A sudden, big drop in prices',12],['Recovery','When prices climb back after a drop',12],
 ['FOMO','Fear of missing out, which can lead to rushed choices',13],['Panic selling','Selling in a hurry because prices dropped',13],['Fee','Money you pay for a service, which shrinks what you keep',14],
 ['Expense ratio','The yearly fee a fund charges, as a percent',14],['Brokerage account','An account used to buy and sell investments',15],['Custodial account','An investing account a grown-up manages for a kid',15],
 ['Inflation','When prices rise over time, so money buys less',16],['Sector','A group of companies in the same kind of business',17],['Scam','A trick to take your money',18],
 ['Dollar-cost averaging','Investing the same amount on a regular schedule',19],['Cryptocurrency','Digital money that isn’t run by a government',20],['Money goal','Something specific you are saving or investing for',21]];
const chOpen=c=>COURSE[c]&&COURSE[c].lessons.some(l=>S.done[l.id]);
const wordsOpen=()=>WORDS.filter(w=>chOpen(w[2]));
const wordsLearned=()=>Object.values(S.words||{}).filter(b=>b>=2).length;
/* ---------- phrases to say out loud ---------- */
const PHRASES=[['A stock is a piece of a company',0],['Shareholders own part of the company',0],['Buy low and sell high',1],['Do not put all your eggs in one basket',1],['Diversify to lower your risk',1],
 ['Save first and spend what is left',2],['Compound interest grows your money',3],['A budget is a plan for your money',4],['An index fund owns many companies',6],['Profit is money left after costs',8],
 ['Bulls charge up and bears swipe down',11],['Stay calm when the market drops',12],['Time in the market beats timing the market',13],['Low fees leave more money for you',14],
 ['Inflation makes things cost more',16],['If it sounds too good to be true it probably is',18],['Invest a little every month',19]];
/* ---------- stories & reading ---------- */
const CAST={Maya:{skin:2,hair:3,hairC:0,eyes:2,mouth:0,acc:0,top:0,shirt:5,bg:5},Leo:{skin:0,hair:2,hairC:3,eyes:2,mouth:1,acc:1,top:1,shirt:2,bg:2},
 Zara:{skin:4,hair:6,hairC:0,eyes:1,mouth:0,acc:0,top:0,shirt:3,bg:3},Grandpa:{skin:1,hair:0,hairC:5,eyes:0,mouth:0,acc:1,top:2,shirt:1,bg:1},Sam:{skin:3,hair:1,hairC:1,eyes:2,mouth:2,acc:3,top:0,shirt:4,bg:4}};
let STORY_CACHE=null;
function STORIES(){if(STORY_CACHE)return STORY_CACHE;const ln=(who,text)=>({t:'line',who,text}),rd=(title,text)=>({t:'read',title,text});
 return STORY_CACHE=[
 {id:'s1',kind:'story',title:'Maya’s Lemonade Shares',icon:'🍋',ch:0,items:[ln('Maya','My lemonade stand sold out again! I want to open a second stand at the park.'),ln('Leo','Cool! What’s stopping you?'),ln('Maya','A second stand costs $100. I only have $20.'),
  M('What does Maya need?',['💵|Money to grow her business','🍋|More lemons for today','🎨|A new sign'],0,'She needs $100 to open a second stand.'),
  ln('Chip','You could sell shares! Split the business into 10 pieces and sell some to friends.'),ln('Leo','I’ll buy 4 shares for $10 each!'),ln('Maya','Thanks, Leo! Now you own part of my lemonade business.'),
  T('Leo is now a part-owner of the lemonade stand.',true,'Buying shares makes Leo a shareholder.'),
  ln('Maya','The new stand made $50 profit this month. Leo owns 4 out of 10 shares…'),ln('Leo','So I get 4 tenths of the profit as a dividend? That’s $20!'),
  M('Why did Leo get $20?',['🎁|A dividend from the profit','🎂|It was his birthday','🏦|He borrowed it'],0,'Shareholders can get a slice of the profit, called a dividend.')]},
 {id:'s2',kind:'story',title:'The Hot Toy',icon:'🧸',ch:1,items:[ln('Zara','Everyone at school wants a RoboPup, but the store only has five left.'),ln('Sam','I saw one online for twice the price!'),
  M('Why is the RoboPup price going up?',['📈|Lots of buyers, few for sale','📉|Nobody wants it','🎲|Prices are random'],0,'High demand and low supply push prices up.'),
  ln('Chip','Stocks work the same way. When more people want to buy than sell, the price climbs.'),ln('Zara','And after the holidays, when nobody wants RoboPups anymore?'),ln('Sam','Then sellers will lower the price to find buyers.'),
  T('When lots of people want to sell and few want to buy, prices usually fall.',true,'More sellers than buyers pushes prices down.'),ln('Zara','So prices are like a tug of war between buyers and sellers!')]},
 {id:'s3',kind:'story',title:'Leo’s Snowball',icon:'⛄',ch:3,items:[ln('Grandpa','Leo, I put $100 in a savings account for you. It earns 10% a year.'),ln('Leo','So next year I’ll have $110?'),ln('Grandpa','Right. And the year after, you earn 10% on $110, not just on $100.'),
  M('How much will Leo have after two years?',['💵|$121','💵|$120','💵|$200'],0,'$110 plus 10% of $110 ($11) is $121.'),ln('Leo','It’s like a snowball rolling downhill, getting bigger as it goes!'),ln('Grandpa','That’s compound interest. And the earlier you start, the bigger the snowball gets.'),
  T('Starting to save early gives compound interest more time to work.',true,'Time is what makes the snowball big.'),ln('Leo','Then I’m starting today!')]},
 {id:'r1',kind:'read',title:'What Is the S&P 500?',icon:'📊',ch:6,items:[rd('What Is the S&P 500?','The <b>S&P 500</b> is a list of about 500 of the biggest companies in the United States, like Apple, Microsoft and Coca-Cola. People use it to see how the whole stock market is doing. When the news says “the market went up today,” they often mean the S&P 500.<br><br>You can’t buy the list itself, but you can buy an <b>index fund</b> that owns every company on it. One share of that fund gives you a tiny piece of all 500 companies at once. That spreads out your risk: if one company has a bad year, the other 499 can make up for it.'),
  M('What is the S&P 500?',['📋|A list of about 500 big U.S. companies','🏦|A bank','🪙|A type of coin'],0,'It tracks about 500 large U.S. companies.'),
  M('How can you own a piece of all 500 companies?',['🧺|Buy an S&P 500 index fund','🎟️|Buy a ticket','📮|Mail each company'],0,'An index fund owns every company in the index.'),
  T('An index fund spreads your risk across many companies.',true,'One company’s bad year matters less when you own hundreds.')]},
 {id:'s4',kind:'story',title:'The Scary Week',icon:'🎢',ch:12,items:[ln('Zara','Grandpa! My fund dropped 10% this week. Should I sell everything?'),ln('Grandpa','Let me ask you something. Did the companies in your fund stop making things people want?'),ln('Zara','No… people still buy iPhones and Nikes.'),
  ln('Grandpa','Markets drop sometimes. In the past, they have always recovered over the years, though nobody knows exactly when.'),
  M('What was Grandpa’s advice?',['🧘|Stay calm and think long-term','😱|Sell everything right away','🎰|Buy a lottery ticket'],0,'Short drops are normal for long-term investors.'),
  ln('Zara','If I sell now, I lock in the loss. If I wait, it has time to come back.'),ln('Chip','That’s the difference between a paper loss and a real one!'),
  T('Selling in a panic when prices drop can turn a temporary dip into a real loss.',true,'A loss only becomes real when you sell.')]},
 {id:'r2',kind:'read',title:'How Nike Makes Money',icon:'👟',ch:8,items:[rd('How Nike Makes Money','Nike designs shoes and clothes, but it doesn’t make most of them itself. Factories around the world make them, and Nike sells them in its own stores, on its app, and through other shops.<br><br>All the money Nike takes in from selling is called <b>revenue</b>. But Nike also has to pay for factories, shipping, ads and its workers. What’s left after paying all those costs is <b>profit</b>. Investors care a lot about profit, because a company that earns more can grow and may pay bigger dividends.'),
  M('What is revenue?',['💰|All the money from sales','🧾|Money left after costs','🏷️|The price of one shoe'],0,'Revenue is everything a company takes in from sales.'),
  M('What is profit?',['✅|Money left after paying costs','📦|The number of shoes sold','🏭|A kind of factory'],0,'Profit = revenue minus costs.'),
  T('Nike makes most of its shoes in its own factories.',false,'Other factories make most of them; Nike designs and sells.')]},
 {id:'r3',kind:'read',title:'Why Does Everything Cost More?',icon:'🎈',ch:16,items:[rd('Why Does Everything Cost More?','Your grandparents might remember when a candy bar cost 10 cents. Today it can cost more than a dollar. This slow rise in prices is called <b>inflation</b>.<br><br>Because of inflation, money hidden under a mattress slowly buys less and less. That’s one reason people invest: if your investments grow faster than prices rise, your money keeps its power, or even gains some.'),
  M('What is inflation?',['🎈|Prices rising over time','🎉|A big party','📉|A stock crash'],0,'Inflation is the general rise in prices.'),
  T('Money kept under a mattress buys less over time because of inflation.',true,'Prices rise but the cash stays the same.'),
  M('Why do people invest, according to the passage?',['🌱|To grow faster than prices rise','🛏️|To keep money under the mattress','🍬|To buy more candy today'],0,'Investing can help money keep up with inflation.')]},
 {id:'s5',kind:'story',title:'Too Good to Be True',icon:'🚩',ch:18,items:[ln('Sam','Look at this message: “Send me $50 and I’ll turn it into $5,000 by Friday! Guaranteed!”'),ln('Leo','Whoa, that’s 100 times your money!'),
  ln('Chip','Red flag! Real investments can go down too. Nobody can guarantee a huge return.'),
  M('What’s the biggest red flag in the message?',['🚩|It promises guaranteed huge returns','📅|It mentions Friday','💬|It was a message'],0,'Promises of guaranteed, huge, fast returns are a classic scam sign.'),
  ln('Sam','They also said to hurry before the deal ends.'),ln('Leo','Rushing you is another trick. Scammers don’t want you to stop and think.'),
  T('If an investment sounds too good to be true, it probably is.',true,'Slow down and ask a trusted grown-up.'),ln('Sam','I’m deleting it and telling my mom.')]}]}
const storiesOpen=()=>STORIES().filter(s=>chOpen(s.ch));
/* ---------- session builders ---------- */
const doneItems=()=>gradable(FLAT.filter(l=>S.done[l.id]));
function mcFrom(q,right,wrongs,why,extra={}){const opts=shuf([right,...shuf(wrongs).slice(0,3)]).map(l=>({e:'',l}));return{t:'mc',q,opts,ans:right,why,...extra}}
function wordItems(n=8){const pool=wordsOpen(),b=w=>S.words[w[0]]||0;const pick8=[...pool].sort((x,y)=>b(x)-b(y)||Math.random()-.5).slice(0,n),other=t=>pool.filter(w=>w[0]!==t);
 return pick8.flatMap(w=>{const[t,d]=w,qs=Math.random()<.5?mcFrom(`What does “${t}” mean?`,d,other(t).map(x=>x[1]),`${t}: ${d}.`,{word:t}):mcFrom(`Which word means: “${d}”?`,t,other(t).map(x=>x[0]),`${t}: ${d}.`,{word:t});
  return b(w)?[qs]:[{t:'card',term:t,def:d,word:t},qs]})}
function listenItems(){const bs=shuf(doneItems().filter(i=>i.t==='build')).slice(0,3).map(i=>({...i,audio:i.answer,key:i.key})),pool=wordsOpen();
 const ws=shuf(pool).slice(0,6-bs.length).map(([t,d])=>mcFrom('What word did you hear?',t,pool.filter(x=>x[0]!==t).map(x=>x[0]),`You heard: “${d}”. That’s ${t}.`,{audio:d,word:t}));
 return shuf([...bs,...ws])}
function speakItems(){const ph=PHRASES.filter(p=>chOpen(p[1])).map(p=>p[0]),bs=doneItems().filter(i=>i.t==='build').map(i=>i.answer);return shuf([...new Set([...ph,...bs])]).slice(0,5).map(text=>({t:'speak',text}))}
function mistakeItems(){return S.mistakes.map(k=>ITEM[k]).filter(Boolean).slice(0,8)}
const MODES=[['workout','target','Smart workout','Questions picked for what you need most',()=>doneCount()>0],
 ['mistakes','refresh','Mistakes review','Fix questions you got wrong',()=>mistakeItems().length>0],
 ['words','cards','Words','Flashcards for money words',()=>wordsOpen().length>=4],
 ['listen','headphones','Listen','Hear it, then pick or build the answer',()=>doneCount()>0],
 ['speak','mic','Speak','Say money phrases out loud',()=>doneCount()>0]];
function practice(){const n=doneCount(),w=weakTags().slice(0,3);
 return `<div class="pagehead">${ic('target',56)}<div><h1>Practice Hub</h1><p class="muted">No hearts lost · each session earns +1 ${ic('heart',16)}</p></div></div>
 <div class="hero">${chip(100,S.wear,n?'':'think')}<div class="grow"><h2>${n?`Hey ${esc(S.name)}! Pick a workout 💪`:'Finish your first lesson!'}</h2><p class="muted">${n?'I’ll pick questions based on what you’ve missed and what’s due for review.':'Then I’ll unlock practice, stories and more.'}</p></div></div>
 <div class="modes">${MODES.map(([k,i,t,d,ok])=>{const on=ok();return `<button class="mode ${on?'':'off'}" data-mode="${k}" ${on?'':'disabled'}>${ic(on?i:'lock',44,on?'':'lk')}<div><b>${t}</b><small>${on?d:k==='mistakes'?'No mistakes to fix. Nice!':'Unlocks after your first lesson'}</small></div>${k==='words'&&on?`<em>${wordsLearned()}/${wordsOpen().length}</em>`:''}</button>`}).join('')}</div>
 ${n&&w.length?`<div class="card" style="margin-top:12px"><h3>Focus skills</h3>${w.map(k=>{const s=strength(k);return `<div class="skill"><b>${TAGS[k]}</b><div class="sbar"><i style="width:${Math.max(6,s*100)}%;background:${s>.6?'var(--ok)':s>.2?'var(--gold)':'var(--bad)'}"></i></div></div>`}).join('')}</div>`:''}
 <h2 class="sec">${ic('story',30)} Stories & reading</h2><div class="stories">${STORIES().map(s=>{const on=chOpen(s.ch),dn=S.stories[s.id];
  return `<button class="story ${on?'':'off'} ${dn?'done':''}" data-story="${s.id}" ${on?'':'disabled'}><span class="sart">${on?s.icon:ic('lock',34)}${dn?`<i>${ic('check',14)}</i>`:''}</span><b>${s.title}</b><small class="muted">${on?(s.kind==='read'?'Reading':'Story')+' · +15 XP':`Unlocks in Chapter ${s.ch+1}`}</small></button>`}).join('')}</div>
 <div class="mob" style="margin-top:16px">${goalCard()}</div>`}
function bindPractice(){$$('[data-mode]').forEach(b=>b.onclick=()=>startLesson(b.dataset.mode==='workout'?'practice':b.dataset.mode));$$('[data-story]').forEach(b=>b.onclick=()=>startLesson('story',b.dataset.story))}
// speech recognition: Chrome/Edge/Safari expose webkitSpeechRecognition; others fall back to typing
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const words=s=>s.toLowerCase().replace(/[^a-z0-9' ]/g,' ').split(/\s+/).filter(Boolean);
function speakScore(said,target){const t=words(target),s=new Set(words(said));const hit=t.map(w=>s.has(w));return{hit,score:hit.filter(Boolean).length/t.length}}
