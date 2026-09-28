// Chip streak emails. Runs hourly; reads users/* from Firestore and sends at most one email per user per run.
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
    [{ ...base, lastDay: '2026-09-20', streak: 4, emailOptIn: false }, null],
  ];
  cases.forEach(([d, want], i) => { const got = (decide(d, now) || {}).kind || null; if (got !== want) throw new Error(`case ${i}: want ${want} got ${got}`); });
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

/** Decides which (if any) email a user gets right now. Dates are compared in the user's own timezone. */
function decide(d, now) {
  const mail = d.mail || {}, tz = d.tz || 'Etc/UTC', streak = d.streak || 0;
  const day = o => Utilities.formatDate(new Date(now.getTime() + o * 864e5), tz, 'yyyy-MM-dd');
  const today = day(0), yday = day(-1), hour = +Utilities.formatDate(now, tz, 'H');
  if (!d.email || d.emailOptIn === false) return null;
  if (!mail.welcome) return { kind: 'welcome', set: { welcome: true } };
  if (d.lastDay === yday && streak > 0 && hour >= 18 && mail.reminder !== today) return { kind: 'risk', set: { reminder: today } };
  if (d.lastDay === today && MILESTONES.includes(streak) && mail.milestone !== streak) return { kind: 'milestone', set: { milestone: streak } };
  if (d.lastDay && d.lastDay < yday && streak >= 3 && hour >= 9 && mail.lost !== d.lastDay) return { kind: 'lost', set: { lost: d.lastDay } };
  return null;
}

function handle(u, now) {
  const d = u.data, x = decide(d, now);
  if (!x) return;
  send(d.email, x.kind, esc(d.name || 'friend'), d.streak || 0);
  patchMail(u.id, Object.assign({}, d.mail || {}, x.set)); // record first so a crash can't cause repeats
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
