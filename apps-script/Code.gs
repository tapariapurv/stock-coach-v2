// Chip streak emails + push reminders + weekly parent emails. Runs hourly; reads users/* from Firestore and sends at most one of each per user per run.
const PROJECT = 'chip-stocks';
const APP_URL = 'https://chip-stock-coach.vercel.app';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const MILESTONES = [3, 7, 14, 30, 50, 100, 365];

/** Manual check: proves Firestore access, sends you one sample of every email, and tests the decision rules. */
function selfTest() {
  const me = Session.getActiveUser().getEmail(), users = listUsers();
  console.log(`Firestore OK: ${users.length} user doc(s)`);
  ['welcome', 'risk', 'milestone', 'lost'].forEach(k => send(me, k, 'Tester', 7));
  const now = new Date('2026-09-28T19:00:00Z'), base = { email: 'x@y.z', tz: 'Etc/UTC', mail: { welcome: true } };
  const cases = [
    [{ email: 'x@y.z' }, 'welcome'],
    [{ ...base, lastDay: '2026-09-27', streak: 5 }, 'risk'],
    [{ ...base, lastDay: '2026-09-27', streak: 5, mail: { welcome: true, reminder: '2026-09-28' } }, null],
    [{ ...base, lastDay: '2026-09-28', streak: 7 }, 'milestone'],
    [{ ...base, lastDay: '2026-09-20', streak: 4 }, 'lost'],
    [{ ...base, lastDay: '2026-09-20', streak: 4, emailOptIn: false }, 'lost'], // still decided; handle() skips email but may push
  ];
  cases.forEach(([d, want], i) => { const got = (decide(d, now) || {}).kind || null; if (got !== want) throw new Error(`case ${i}: want ${want} got ${got}`); });
  const sun = new Date('2026-09-27T18:00:00Z'), kid = { parentEmail: 'p@x.y', tz: 'Etc/UTC', summary: {} };
  if (!wantsParentMail(kid, sun) || wantsParentMail({ ...kid, mail: { parentWeek: '2026-09-27' } }, sun) || wantsParentMail(kid, now)) throw new Error('parent mail rule');
  sendParent(me, { name: 'Tester', summary: { streak: 5, active7: 4, weekXp: 120, lessons: 18, chapter: 'Bonds', strong: ['Dividends'], weak: ['Inflation'], fund: { value: 130, cost: 100 } } });
  console.log(`decide(): ${cases.length} cases pass. Sent 4 sample emails to ${me}.`);
}

/** Run once: installs the hourly trigger and does a first pass. */
function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('run').timeBased().everyHours(1).create();
  run();
}

function run() {
  listUsers().forEach(u => { try { handle(u, new Date()); } catch (e) { console.error(u.id, e); } });
}

/** Decides which (if any) streak nudge a user gets right now. Dates are compared in the user's own timezone. */
function decide(d, now) {
  const mail = d.mail || {}, tz = d.tz || 'Etc/UTC', streak = d.streak || 0;
  const day = o => Utilities.formatDate(new Date(now.getTime() + o * 864e5), tz, 'yyyy-MM-dd');
  const today = day(0), yday = day(-1), hour = +Utilities.formatDate(now, tz, 'H');
  if (!mail.welcome && d.email) return { kind: 'welcome', set: { welcome: true } };
  if (d.lastDay === yday && streak > 0 && hour >= 18 && mail.reminder !== today) return { kind: 'risk', set: { reminder: today } };
  if (d.lastDay === today && MILESTONES.includes(streak) && mail.milestone !== streak) return { kind: 'milestone', set: { milestone: streak } };
  if (d.lastDay && d.lastDay < yday && streak >= 3 && hour >= 9 && mail.lost !== d.lastDay) return { kind: 'lost', set: { lost: d.lastDay } };
  return null;
}

function handle(u, now) {
  const d = u.data, x = decide(d, now), mail = Object.assign({}, d.mail || {});
  if (x) {
    const canMail = d.email && d.emailOptIn !== false;
    patchMail(u.id, Object.assign(mail, x.set)); // record first so a crash can't cause repeats
    if (canMail) send(d.email, x.kind, esc(d.name || 'friend'), d.streak || 0);
    if (x.kind !== 'welcome') push(u.id, d.push || [], x.kind, d.name || 'friend', d.streak || 0);
  }
  if (wantsParentMail(d, now)) { patchMail(u.id, Object.assign(mail, { parentWeek: Utilities.formatDate(now, d.tz || 'Etc/UTC', 'yyyy-MM-dd') })); sendParent(d.parentEmail, d); }
}

/* ---------- push (Firebase Cloud Messaging HTTP v1) ---------- */
function push(id, tokens, kind, name, n) {
  const T = { risk: [`🔥 ${n}-day streak ends tonight!`, `Quick, ${name}! One lesson keeps it alive.`], milestone: [`🎉 ${n} days in a row!`, `Chip is so proud of you, ${name}.`], lost: ['Chip misses you 🐂', 'Start a fresh streak today!'] }[kind];
  if (!T || !tokens.length) return;
  const dead = tokens.filter(token => {
    const r = UrlFetchApp.fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({ message: { token, notification: { title: T[0], body: T[1] }, webpush: { fcm_options: { link: APP_URL } } } }) });
    return r.getResponseCode() === 404 || /UNREGISTERED/.test(r.getContentText()); // uninstalled or revoked
  });
  if (dead.length) api('patch', `${BASE}/users/${id}?updateMask.fieldPaths=push`, { fields: { push: enc(tokens.filter(t => !dead.includes(t))) } });
}

/* ---------- weekly parent email: Sundays from 5pm in the child's timezone ---------- */
function wantsParentMail(d, now) {
  if (!d.parentEmail) return false;
  const tz = d.tz || 'Etc/UTC', today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  return Utilities.formatDate(now, tz, 'u') === '7' && +Utilities.formatDate(now, tz, 'H') >= 17 && (d.mail || {}).parentWeek !== today;
}
function sendParent(to, d) {
  const s = d.summary || {}, f = s.fund || {}, name = esc(d.name || 'Your child'), gain = (f.value || 0) - (f.cost || 0);
  const ask = s.weak && s.weak[0] ? `Ask ${name}: “What does ${esc(s.weak[0].toLowerCase())} mean? Can you teach me?”` : `Ask ${name} what they learned in Chip this week.`;
  const stat = (v, l) => `<td style="padding:10px;background:#F4F2FB;border-radius:12px;text-align:center"><b style="font-size:22px;color:#5B4CF5">${v}</b><br><span style="font-size:12px;color:#625F7A">${l}</span></td>`;
  MailApp.sendEmail({ to, name: 'Chip the Bull', subject: `${d.name || 'Your child'}'s week in Chip 🐂`,
    htmlBody: `<div style="font-family:Nunito,Arial,sans-serif;max-width:520px;margin:auto;color:#27253A;padding:24px">
      <h1 style="color:#5B4CF5;margin:0 0 6px">${name}'s week</h1><p style="color:#625F7A;margin:0 0 16px">Currently learning: <b>${esc(s.chapter || 'getting started')}</b></p>
      <table style="width:100%;border-spacing:6px"><tr>${stat((s.active7 || 0) + '/7', 'days active')}${stat('🔥 ' + (s.streak || 0), 'day streak')}${stat(s.weekXp || 0, 'XP this week')}</tr>
      <tr>${stat(s.lessons || 0, 'lessons total')}${stat('🪙 ' + (f.value || 0), 'fund value')}${stat((gain >= 0 ? '+' : '') + gain, 'fund gain')}</tr></table>
      ${s.strong && s.strong.length ? `<p><b>Strong at:</b> ${s.strong.map(esc).join(', ')}</p>` : ''}${s.weak && s.weak.length ? `<p><b>Practising:</b> ${s.weak.map(esc).join(', ')}</p>` : ''}
      <p style="background:#EFEDFF;border-radius:14px;padding:12px 14px">💬 ${ask}</p>
      <a href="${APP_URL}/dashboard.html" style="display:inline-block;background:#5B4CF5;color:#fff;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:14px">Open the parent dashboard</a>
      <p style="font-size:12px;color:#afafaf;margin-top:24px">${name} added this email in Chip. They can remove it in Profile → Parent or guardian.</p></div>` });
}

function send(to, kind, name, n) {
  const T = {
    welcome:   ['Welcome to Chip! 🐂', '🐂', `Hi ${name}, let's grow!`, `I'm Chip, your money buddy. Do one quick lesson a day to build your streak and learn how stocks work.`, 'Start learning'],
    risk:      [`🔥 Your ${n}-day streak ends tonight!`, '🔥', `Don't break the chain, ${name}!`, `You've learned ${n} days in a row. One 3-minute lesson keeps your streak alive.`, 'Save my streak'],
    milestone: [`🎉 ${n}-day streak, ${name}!`, '🏆', `${n} days in a row!`, `That's what patient investors do: show up every day. Chip is SO proud of you, ${name}.`, 'Keep it going'],
    lost:      ['Chip misses you 🐂', '🥺', `Your ${n}-day streak ended`, `No worries, ${name}! Even the best investors have down days. Start a fresh streak today.`, 'Start a new streak'],
  }[kind];
  MailApp.sendEmail({
    to, subject: T[0], name: 'Chip the Bull',
    htmlBody: `<div style="font-family:Nunito,Arial,sans-serif;max-width:480px;margin:auto;text-align:center;color:#27253A;padding:24px">
      <div style="font-size:72px;line-height:1">${T[1]}</div>
      <h1 style="color:#5B4CF5;margin:14px 0 8px">${T[2]}</h1>
      <p style="font-size:17px;line-height:1.5;margin:0 0 20px">${T[3]}</p>
      <a href="${APP_URL}" style="display:inline-block;background:#5B4CF5;color:#fff;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:16px;border-bottom:5px solid #4031D4">${T[4]}</a>
      <p style="font-size:12px;color:#afafaf;margin-top:28px">You're getting this because streak emails are on. Turn them off in Chip → Profile → Streak emails.</p></div>`,
  });
}

/* ---------- Firestore REST ---------- */
function api(method, url, body) {
  const o = { method, muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': PROJECT } };
  if (body) { o.contentType = 'application/json'; o.payload = JSON.stringify(body); }
  const r = UrlFetchApp.fetch(url, o);
  if (r.getResponseCode() >= 300) throw new Error(r.getResponseCode() + ' ' + r.getContentText());
  return JSON.parse(r.getContentText() || '{}');
}
function listUsers() {
  const out = []; let tok = '';
  do {
    const r = api('get', `${BASE}/users?pageSize=300${tok ? '&pageToken=' + tok : ''}`);
    (r.documents || []).forEach(doc => out.push({ id: doc.name.split('/').pop(), data: dec({ mapValue: { fields: doc.fields || {} } }) }));
    tok = r.nextPageToken;
  } while (tok);
  return out;
}
function patchMail(id, mail) { api('patch', `${BASE}/users/${id}?updateMask.fieldPaths=mail`, { fields: { mail: enc(mail) } }); }
function dec(v) {
  if ('mapValue' in v) { const o = {}; Object.entries(v.mapValue.fields || {}).forEach(([k, x]) => o[k] = dec(x)); return o; }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('integerValue' in v) return +v.integerValue;
  if ('nullValue' in v) return null;
  return Object.values(v)[0];
}
function enc(x) {
  if (typeof x === 'string') return { stringValue: x };
  if (typeof x === 'boolean') return { booleanValue: x };
  if (typeof x === 'number') return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (x && typeof x === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, v]) => [k, enc(v)])) } };
  return { nullValue: null };
}
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
