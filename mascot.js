// Chip the bull (shaded "3D" SVG with moods) and the learner avatar builder.
// Gradients live once in a hidden <svg> so every Chip on the page shares them (and none breaks inside display:none).
const CHIP_DEFS=`<svg id="cdefs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<radialGradient id="cb-body" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#FFB877"/><stop offset=".55" stop-color="#EC9348"/><stop offset="1" stop-color="#C46A28"/></radialGradient>
<radialGradient id="cb-head" cx=".38" cy=".28" r=".85"><stop offset="0" stop-color="#FFBE80"/><stop offset=".5" stop-color="#EE954A"/><stop offset="1" stop-color="#C8692A"/></radialGradient>
<radialGradient id="cb-arm" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#F0A060"/><stop offset="1" stop-color="#B8601F"/></radialGradient>
<radialGradient id="cb-muz" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#FFF0DD"/><stop offset=".7" stop-color="#FFD5A8"/><stop offset="1" stop-color="#EDB27E"/></radialGradient>
<linearGradient id="cb-horn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFBF0"/><stop offset="1" stop-color="#E8C88C"/></linearGradient>
<linearGradient id="cb-leg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D47A36"/><stop offset=".5" stop-color="#C46A28"/><stop offset="1" stop-color="#A9561C"/></linearGradient>
<radialGradient id="cb-eye" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#E6E3F0"/></radialGradient>
<radialGradient id="cb-pup" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#4A3A40"/><stop offset="1" stop-color="#151018"/></radialGradient>
<radialGradient id="cb-shadow"><stop offset="0" stop-color="#1F1D33" stop-opacity=".22"/><stop offset="1" stop-color="#1F1D33" stop-opacity="0"/></radialGradient>
</defs></svg>`;
function ensureDefs(){if(!document.getElementById('cdefs')&&document.body)document.body.insertAdjacentHTML('afterbegin',CHIP_DEFS)}
document.addEventListener('DOMContentLoaded',ensureDefs);
let chipN=0;
// mood: '' (happy), 'sad', 'wow', 'cheer', 'think', 'sleep'
function chip(size=140,wear=(typeof S!=='undefined'?S.wear:[]),mood=''){ensureDefs();const w=k=>wear.includes(k),d=-((chipN++*1.37)%5).toFixed(2);
return `<svg class="chip ${mood?'mood-'+mood:''}" viewBox="0 0 200 212" width="${size}" height="${Math.round(size*1.06)}" style="--d:${d}s" aria-hidden="true">
<ellipse class="m-shadow" cx="100" cy="203" rx="58" ry="9" fill="url(#cb-shadow)"/>
<g class="m-root">
 <g class="m-tail"><path d="M148 166q26 -4 30 -28" stroke="#C46A28" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M178 138q-6 -6 -2 -14q6 4 9 10q-3 6 -7 4z" fill="#8A4A1E"/></g>
 <rect x="68" y="166" width="23" height="36" rx="11" fill="url(#cb-leg)"/><rect x="109" y="166" width="23" height="36" rx="11" fill="url(#cb-leg)"/>
 <path d="M68 192h23v4a7 7 0 01-7 7h-9a7 7 0 01-7-7zM109 192h23v4a7 7 0 01-7 7h-9a7 7 0 01-7-7z" fill="#6B3A1A"/>
 <ellipse cx="100" cy="158" rx="55" ry="37" fill="url(#cb-body)"/>
 <ellipse cx="100" cy="168" rx="33" ry="23" fill="url(#cb-muz)"/>
 <ellipse cx="80" cy="140" rx="18" ry="7" fill="#fff" opacity=".18" transform="rotate(-18 80 140)"/>
 <g class="m-armL"><ellipse cx="49" cy="157" rx="12.5" ry="21" fill="url(#cb-arm)"/><ellipse cx="49" cy="174" rx="9" ry="6" fill="#6B3A1A"/></g>
 <g class="m-armR"><ellipse cx="151" cy="157" rx="12.5" ry="21" fill="url(#cb-arm)"/><ellipse cx="151" cy="174" rx="9" ry="6" fill="#6B3A1A"/></g>
 <g class="m-head">
  <path d="M55 64Q26 52 33 19Q46 43 69 49Z" fill="url(#cb-horn)" stroke="#D9B577" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M145 64Q174 52 167 19Q154 43 131 49Z" fill="url(#cb-horn)" stroke="#D9B577" stroke-width="2.5" stroke-linejoin="round"/>
  <g class="m-earL"><ellipse cx="41" cy="86" rx="19" ry="10.5" fill="url(#cb-arm)" transform="rotate(-22 41 86)"/><ellipse cx="43" cy="86" rx="11" ry="5" fill="#FF9DB0" opacity=".7" transform="rotate(-22 43 86)"/></g>
  <g class="m-earR"><ellipse cx="159" cy="86" rx="19" ry="10.5" fill="url(#cb-arm)" transform="rotate(22 159 86)"/><ellipse cx="157" cy="86" rx="11" ry="5" fill="#FF9DB0" opacity=".7" transform="rotate(22 157 86)"/></g>
  <ellipse cx="100" cy="92" rx="59" ry="55" fill="url(#cb-head)"/>
  <ellipse cx="76" cy="58" rx="20" ry="9" fill="#fff" opacity=".22" transform="rotate(-20 76 58)"/>
  <path d="M83 44Q89 24 100 39Q108 22 117 44Z" fill="#B85E22"/>
  <g class="m-eyes"><ellipse cx="78" cy="82" rx="13.5" ry="15.5" fill="url(#cb-eye)"/><ellipse cx="122" cy="82" rx="13.5" ry="15.5" fill="url(#cb-eye)"/>
   <g class="m-pupils"><circle cx="80" cy="85" r="8" fill="url(#cb-pup)"/><circle cx="124" cy="85" r="8" fill="url(#cb-pup)"/>
   <circle cx="83" cy="81.5" r="3" fill="#fff"/><circle cx="127" cy="81.5" r="3" fill="#fff"/><circle cx="77.5" cy="88.5" r="1.3" fill="#fff" opacity=".8"/><circle cx="121.5" cy="88.5" r="1.3" fill="#fff" opacity=".8"/></g></g>
  <g class="m-happy"><path d="M66 88q12 -13 24 0M110 88q12 -13 24 0" stroke="#5A2E12" stroke-width="5" fill="none" stroke-linecap="round"/></g>
  <g class="m-closed"><path d="M66 85q12 8 24 0M110 85q12 8 24 0" stroke="#5A2E12" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>
  <path class="m-brow" d="M65 61Q78 54 89 61M111 61Q122 54 135 61" stroke="#7A3F18" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path class="m-brow-sad" d="M64 68Q76 62 88 56M112 56Q124 62 136 68" stroke="#7A3F18" stroke-width="5" stroke-linecap="round" fill="none"/>
  <circle cx="57" cy="107" r="9.5" fill="#FF7E9D" opacity=".45"/><circle cx="143" cy="107" r="9.5" fill="#FF7E9D" opacity=".45"/>
  <ellipse cx="100" cy="119" rx="37" ry="25" fill="url(#cb-muz)"/>
  <ellipse cx="88" cy="113" rx="4.6" ry="6.2" fill="#9C4F22"/><ellipse cx="112" cy="113" rx="4.6" ry="6.2" fill="#9C4F22"/>
  <path class="m-smile" d="M85 127Q100 140 115 127" stroke="#7A3F18" stroke-width="4.2" fill="none" stroke-linecap="round"/>
  <path class="m-frown" d="M88 134Q100 125 112 134" stroke="#7A3F18" stroke-width="4.2" fill="none" stroke-linecap="round"/>
  <g class="m-open"><path d="M86 126Q100 146 114 126Z" fill="#7A2E1A"/><path d="M92 136Q100 131 108 136Q104 141 100 141Q96 141 92 136Z" fill="#FF7E9D"/></g>
  <g class="m-zz"><text x="150" y="40" font-family="Fredoka,sans-serif" font-size="22" fill="#8B5CF6">z</text><text x="166" y="22" font-family="Fredoka,sans-serif" font-size="16" fill="#8B5CF6">z</text></g>
  ${w('shades')?'<g><rect x="60" y="72" width="36" height="22" rx="9" fill="#1d1d1d"/><rect x="104" y="72" width="36" height="22" rx="9" fill="#1d1d1d"/><rect x="94" y="78" width="12" height="4" fill="#1d1d1d"/><rect x="66" y="76" width="10" height="4" fill="#fff" opacity=".5"/><rect x="110" y="76" width="10" height="4" fill="#fff" opacity=".5"/></g>':''}
  ${w('hat')?'<g><rect x="60" y="38" width="80" height="11" rx="5" fill="#2B2B3A"/><rect x="73" y="0" width="54" height="42" rx="6" fill="#2B2B3A"/><rect x="73" y="28" width="54" height="8" fill="#FF4B4B"/><rect x="78" y="4" width="8" height="22" rx="3" fill="#fff" opacity=".12"/></g>':''}
  ${w('monocle')?'<g><circle cx="122" cy="83" r="17" fill="#fff" fill-opacity=".25" stroke="#E5A500" stroke-width="4"/><path d="M138 90Q146 120 140 150" stroke="#E5A500" stroke-width="2" fill="none"/></g>':''}
  ${w('phones')?'<g><path d="M44 92Q44 30 100 30Q156 30 156 92" stroke="#2B2B3A" stroke-width="9" fill="none"/><rect x="30" y="80" width="22" height="36" rx="10" fill="#FF5470"/><rect x="148" y="80" width="22" height="36" rx="10" fill="#FF5470"/></g>':''}
  ${w('party')?'<g><path d="M76 46L100 -2L124 46Z" fill="#1FA2FF"/><path d="M85 28L115 28M80 38L120 38" stroke="#FFC800" stroke-width="5"/><circle cx="100" cy="-2" r="7" fill="#FF5470"/></g>':''}
  ${w('crown')?'<path d="M68 46L72 14L87 30L100 6L113 30L128 14L132 46Z" fill="#FFC800" stroke="#E5A500" stroke-width="3" stroke-linejoin="round"/>':''}
  ${w('cap')?'<g><path d="M54 52Q56 18 100 18Q144 18 146 52Z" fill="#1FA2FF"/><path d="M100 52Q140 46 170 56Q150 64 120 58Z" fill="#0B84DB"/><circle cx="100" cy="20" r="5" fill="#0B84DB"/></g>':''}
 </g>
 ${w('scarf')?'<g><path d="M56 136Q100 158 144 136L146 150Q100 172 54 150Z" fill="#FF5470"/><rect x="112" y="146" width="16" height="34" rx="6" fill="#DE3355"/></g>':''}
 ${w('tie')?'<g><path d="M100 152L78 140V164ZM100 152L122 140V164Z" fill="#5B4CF5"/><circle cx="100" cy="152" r="7" fill="#4031D4"/></g>':''}
 ${w('cape')?'<path d="M58 138Q100 150 142 138L160 196Q100 206 40 196Z" fill="#8B5CF6" opacity=".9" style="mix-blend-mode:multiply"/>':''}
</g></svg>`}
// GSAP reactions on top of the CSS idle loop (bob, blink, look-around, ear twitch, tail swish)
function setMood(c,m,ms){if(!c)return;c.classList.remove('mood-sad','mood-wow','mood-cheer','mood-think','mood-sleep');if(m)c.classList.add('mood-'+m);if(ms)setTimeout(()=>c.isConnected&&setMood(c,''),ms)}
function chipJump(c){if(!c||!window.gsap)return;setMood(c,'cheer',1300);
 gsap.timeline().to(c,{scaleY:.86,scaleX:1.1,y:4,transformOrigin:'50% 100%',duration:.12,ease:'power2.in'})
  .to(c,{scaleY:1.08,scaleX:.94,y:-30,duration:.22,ease:'power2.out'}).to(c,{scaleY:1,scaleX:1,y:0,duration:.55,ease:'bounce.out'});
 gsap.fromTo(c.querySelectorAll('.m-armL,.m-armR'),{rotation:0},{rotation:i=>i?-55:55,transformOrigin:'50% 15%',duration:.18,repeat:3,yoyo:true})}
// fake a 3D turn by squashing scaleX through zero and back
function chipSpin(c){if(!c||!window.gsap)return;setMood(c,'cheer',1200);gsap.timeline().to(c,{y:-24,duration:.25,ease:'power2.out'}).to(c,{scaleX:-1,duration:.25,ease:'sine.inOut'},0).to(c,{scaleX:1,duration:.25,ease:'sine.inOut'}).to(c,{y:0,duration:.4,ease:'bounce.out'},'-=.1')}
function chipDance(c,n=3){if(!c||!window.gsap)return;setMood(c,'cheer',n*600);gsap.timeline({repeat:n-1}).to(c,{rotation:-8,y:-8,transformOrigin:'50% 100%',duration:.15}).to(c,{rotation:8,y:0,duration:.15}).to(c,{rotation:0,duration:.1});
 gsap.fromTo(c.querySelectorAll('.m-armL,.m-armR'),{rotation:0},{rotation:i=>i?-40:40,transformOrigin:'50% 15%',duration:.15,repeat:n*2-1,yoyo:true})}
function chipSad(c){if(!c||!window.gsap)return;setMood(c,'sad',1600);const h=c.querySelector('.m-head');gsap.timeline().to(h,{rotation:-8,y:6,transformOrigin:'50% 90%',duration:.2}).to(h,{rotation:8,duration:.12,repeat:3,yoyo:true}).to(h,{rotation:0,y:0,duration:.3})}
function chipWave(c,n=3){if(!c||!window.gsap)return;gsap.fromTo(c.querySelector('.m-armR'),{rotation:0},{rotation:-55,transformOrigin:'30% 10%',duration:.18,repeat:n*2-1,yoyo:true})}

/* ---------- avatar builder ---------- */
// every option is [label, level needed]; colours are free, styles unlock as you level up
const SKIN=['#FFE0C2','#F6C9A0','#E8AD7E','#C98B5E','#9A6440','#6B4228'];
const HAIRC=[['#2B1D14',1],['#6B3E1F',1],['#C88A3E',1],['#F2D27A',1],['#B33A2A',1],['#9AA0B0',1],['#FF7EB6',4],['#4F8BFF',5],['#2FD07F',7],['#B26BFF',9]];
const SHIRT=['#5B4CF5','#10B981','#1FA2FF','#FF5470','#FF7A1A','#FFB31A','#2B2B3A','#F4F2FB'];
const BGC=['#EFEDFF','#DCF8EC','#DDF1FF','#FFE6EB','#FFF0E2','#FFF5DC','#E9E6F4','#2B2752'];
const AVP={hair:[['None',1],['Short',1],['Curly',1],['Long',1],['Bun',1],['Mohawk',3],['Afro',4],['Ponytail',5],['Spiky',6]],
 eyes:[['Dots',1],['Happy',1],['Big',1],['Wink',3],['Stars',8]],mouth:[['Smile',1],['Grin',1],['Wow',2],['Tongue',4]],
 acc:[['None',1],['Glasses',1],['Shades',3],['Cap',5],['Headphones',6],['Bull horns',8],['Crown',10]],top:[['T-shirt',1],['Hoodie',4],['Suit',7]]};
const DEFCHAR={skin:1,hair:1,hairC:0,eyes:2,mouth:0,acc:0,top:0,shirt:0,bg:0};
function charSVG(c,s=96){c={...DEFCHAR,...c};const sk=SKIN[c.skin]||SKIN[0],hc=(HAIRC[c.hairC]||HAIRC[0])[0],sh=SHIRT[c.shirt]||SHIRT[0],h=+c.hair;
 const shade='rgba(0,0,0,.12)';
 const back={3:`<path d="M30 52Q30 20 60 20Q90 20 90 52L94 98Q60 106 26 98Z" fill="${hc}"/>`,6:`<circle cx="60" cy="48" r="38" fill="${hc}"/>`,7:`<path d="M84 40Q104 50 98 84Q92 70 84 66Z" fill="${hc}"/>`}[h]||'';
 const front={1:`<path d="M33 52Q32 24 60 24Q88 24 87 52Q78 36 60 36Q42 36 33 52Z" fill="${hc}"/>`,
  2:`<g fill="${hc}">${[[38,40],[46,31],[57,27],[68,28],[78,33],[84,43],[34,50],[86,52]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`,
  3:`<path d="M32 56Q30 24 60 24Q90 24 88 56Q80 38 64 36Q54 44 34 56Z" fill="${hc}"/>`,
  4:`<path d="M33 52Q32 24 60 24Q88 24 87 52Q78 36 60 36Q42 36 33 52Z" fill="${hc}"/><circle cx="60" cy="18" r="10" fill="${hc}"/>`,
  5:`<path d="M52 40Q50 12 60 6Q70 12 68 40Z" fill="${hc}"/>`,
  6:`<path d="M30 50Q34 26 60 26Q86 26 90 50Q76 38 60 38Q44 38 30 50Z" fill="${hc}"/>`,
  7:`<path d="M33 52Q32 24 60 24Q88 24 87 52Q78 36 60 36Q42 36 33 52Z" fill="${hc}"/>`,
  8:`<path d="M32 50L36 30L44 38L50 20L58 34L64 18L70 34L78 22L80 38L88 30L88 50Q76 38 60 38Q44 38 32 50Z" fill="${hc}"/>`}[h]||'';
 const eyes=[`<circle cx="49" cy="58" r="3.6" fill="#2B1D14"/><circle cx="71" cy="58" r="3.6" fill="#2B1D14"/>`,
  `<path d="M44 59Q49 53 54 59M66 59Q71 53 76 59" stroke="#2B1D14" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  `<ellipse cx="49" cy="58" rx="5.5" ry="6.5" fill="#fff"/><ellipse cx="71" cy="58" rx="5.5" ry="6.5" fill="#fff"/><circle cx="50" cy="59" r="3.6" fill="#2B1D14"/><circle cx="72" cy="59" r="3.6" fill="#2B1D14"/><circle cx="51.4" cy="57.4" r="1.3" fill="#fff"/><circle cx="73.4" cy="57.4" r="1.3" fill="#fff"/>`,
  `<ellipse cx="49" cy="58" rx="5.5" ry="6.5" fill="#fff"/><circle cx="50" cy="59" r="3.6" fill="#2B1D14"/><circle cx="51.4" cy="57.4" r="1.3" fill="#fff"/><path d="M66 59Q71 54 76 59" stroke="#2B1D14" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  `<path d="M49 51l2 4.6 5 .5-3.8 3.3 1.1 4.9L49 61.8l-4.3 2.5 1.1-4.9-3.8-3.3 5-.5zM71 51l2 4.6 5 .5-3.8 3.3 1.1 4.9L71 61.8l-4.3 2.5 1.1-4.9-3.8-3.3 5-.5z" fill="#FFC800" stroke="#E5A100" stroke-width="1"/>`][c.eyes]||'';
 const mouth=[`<path d="M52 71Q60 78 68 71" stroke="#7A3F18" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  `<path d="M50 69Q60 82 70 69Z" fill="#7A2E1A"/><path d="M52 70h16l-1 3H53z" fill="#fff"/>`,
  `<ellipse cx="60" cy="73" rx="5" ry="6" fill="#7A2E1A"/>`,
  `<path d="M51 70Q60 80 69 70Z" fill="#7A2E1A"/><path d="M56 74q4 7 8 0z" fill="#FF7E9D"/>`][c.mouth]||'';
 const acc=['',`<g fill="none" stroke="#2B2B3A" stroke-width="2.6"><circle cx="49" cy="58" r="8.5"/><circle cx="71" cy="58" r="8.5"/><path d="M57.5 58h5M40.5 56l-6-2M79.5 56l6-2"/></g>`,
  `<g><rect x="39" y="51" width="19" height="13" rx="5" fill="#1d1d1d"/><rect x="62" y="51" width="19" height="13" rx="5" fill="#1d1d1d"/><path d="M58 56h4" stroke="#1d1d1d" stroke-width="3"/><rect x="43" y="54" width="6" height="2.5" fill="#fff" opacity=".5"/></g>`,
  `<g><path d="M32 46Q32 20 60 20Q88 20 88 46Z" fill="#FF5470"/><path d="M60 46Q92 42 104 50Q90 56 72 52Z" fill="#DE3355"/><circle cx="60" cy="21" r="3.5" fill="#DE3355"/></g>`,
  `<g><path d="M30 60Q30 22 60 22Q90 22 90 60" stroke="#2B2B3A" stroke-width="6" fill="none"/><rect x="24" y="52" width="12" height="20" rx="6" fill="#1FA2FF"/><rect x="84" y="52" width="12" height="20" rx="6" fill="#1FA2FF"/></g>`,
  `<g fill="#FFF1D0" stroke="#D9B577" stroke-width="2"><path d="M38 38Q22 30 26 12Q34 28 44 30Z"/><path d="M82 38Q98 30 94 12Q86 28 76 30Z"/></g>`,
  `<path d="M40 30L42 12L51 21L60 8L69 21L78 12L80 30Z" fill="#FFC800" stroke="#E5A100" stroke-width="2" stroke-linejoin="round"/>`][c.acc]||'';
 const top=[`<path d="M16 122Q16 92 60 88Q104 92 104 122Z" fill="${sh}"/><path d="M48 89Q60 98 72 89" stroke="${shade}" stroke-width="4" fill="none"/>`,
  `<path d="M16 122Q16 90 60 86Q104 90 104 122Z" fill="${sh}"/><path d="M38 92Q60 108 82 92" stroke="${shade}" stroke-width="6" fill="none"/><path d="M52 100v12M68 100v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  `<path d="M16 122Q16 92 60 88Q104 92 104 122Z" fill="#2B2B3A"/><path d="M50 89L60 122L70 89Z" fill="#fff"/><path d="M60 94l-4 6 4 20 4-20z" fill="${sh}"/><path d="M50 89L56 108L44 96ZM70 89L64 108L76 96Z" fill="#3E3E52"/>`][c.top]||'';
 return `<svg class="charav" width="${s}" height="${s}" viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" fill="${BGC[c.bg]||BGC[0]}"/>
 <g>${back}${top}<rect x="52" y="76" width="16" height="14" rx="6" fill="${sk}"/><rect x="52" y="76" width="16" height="6" fill="${shade}"/>
 <circle cx="34" cy="60" r="6" fill="${sk}"/><circle cx="86" cy="60" r="6" fill="${sk}"/><ellipse cx="60" cy="56" rx="26" ry="28" fill="${sk}"/><ellipse cx="50" cy="40" rx="10" ry="5" fill="#fff" opacity=".18"/>
 ${front}<circle cx="43" cy="68" r="4.5" fill="#FF7E9D" opacity=".35"/><circle cx="77" cy="68" r="4.5" fill="#FF7E9D" opacity=".35"/>${eyes}${mouth}${acc}</g></svg>`}
const okPhoto=p=>typeof p==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p);
// any learner, friend, classmate or rival: photo, built character, or emoji
function avatarHTML(p,s=48){const st=`width:${s}px;height:${s}px`;
 if(p?.avMode==='photo'&&okPhoto(p.photo))return `<span class="avc" style="${st}"><img src="${p.photo}" alt="" width="${s}" height="${s}" loading="lazy"></span>`;
 if(p?.avMode==='char'&&p.char)return `<span class="avc" style="${st}">${charSVG(p.char,s)}</span>`;
 return `<span class="avc emo" style="${st};font-size:${Math.round(s*.58)}px">${String(p?.avatar||'🐂').replace(/[<>&"']/g,'')}</span>`}
