/* Kitchen staff logins and the login log.
   - A staff member who is in service and works in the kitchen gets a login automatically:
     user ID = the Gmail address in the staff record, password = PAN (upper case). They see the Kitchen module only, read-only.
   - When they are relieved (exit date reached), moved out of the kitchen, or the login is switched off, access closes at once.
     The exit date is also written into the access record, so the database itself refuses them after that day even if nobody opens the app.
   - Every sign-in, app open, sign-out, failed or refused attempt is written to the login log with device, browser, IP, date and time.
     Log entries cannot be edited or deleted by anyone. */
(()=>{
const J=window.J,{S,esc,fmtDate,today,toast}=J;
const KITCHEN_RE=/kitchen|tandoor|chef|cook|curry|chinese|tawa|momo|south indian|commis|kot/i;
const PAN_RE=/^[A-Z]{5}[0-9]{4}[A-Z]$/,MAIL_RE=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const isAdmin=()=>S.me.owner||["Super Admin","Admin"].includes(J.myRole());
const canAudit=()=>isAdmin()||J.myRole()==="Auditor";
J.kitchenEligible=s=>{const H=J.H;const cur=H?.current?.(s);const dept=(cur?.dept||s.dept||"")+" "+(cur?.desig||s.desig||"");const mode=s.kitLogin||"auto";
  const email=String(s.email||"").trim().toLowerCase(),pan=String(s.pan||"").trim().toUpperCase();const t=today();
  const inService=!!cur&&(!cur.join||cur.join<=t)&&(!cur.exit||cur.exit>=t);
  const kitchen=mode==="always"||(mode==="auto"&&KITCHEN_RE.test(dept));
  const why=mode==="never"?"Login switched off":!kitchen?"Not in a kitchen department":!inService?(cur?.exit&&cur.exit<t?"Relieved on "+fmtDate(cur.exit):"Not in service"):!MAIL_RE.test(email)?"No Gmail ID in the staff record":!PAN_RE.test(pan)?"No valid PAN in the staff record":"";
  // access ends at the end of the exit day (India time)
  const until=inService&&cur?.exit?Date.parse(cur.exit+"T23:59:59+05:30"):null;
  return {ok:!why,why,email,pan,until,code:cur?.code||s.code||"",kitchen,inService}};
J.kitchenStatus=s=>{const e=J.kitchenEligible(s);const d=e.email?J.get("kitchenusers",e.email):null;return {...e,doc:d}};
// create (or confirm) the Firebase sign-in account without disturbing the owner's own session
let provApp=null;
async function provision(email,pan){const cfg=window.JCGG_CONFIG||{};provApp=provApp||firebase.apps.find(a=>a.name==="provision")||firebase.initializeApp(cfg.firebase,"provision");
  const a=provApp.auth();try{await a.setPersistence(firebase.auth.Auth.Persistence.NONE)}catch(e){}
  try{const c=await a.createUserWithEmailAndPassword(email,pan);const uid=c.user.uid;await a.signOut();return {uid,pw:"PAN"}}
  catch(e){if(e.code==="auth/email-already-in-use"){try{const c=await a.signInWithEmailAndPassword(email,pan);const uid=c.user.uid;await a.signOut();return {uid,pw:"PAN"}}catch(e2){return {uid:"",pw:"other"}}}
    if(e.code==="auth/operation-not-allowed"){const er=new Error("Email/Password sign-in is switched off in Firebase.");er.fix="https://console.firebase.google.com/project/"+(cfg.firebase?.projectId||"")+"/authentication/providers";throw er}throw e}}
const logAdmin=(event,k,extra={})=>J.logLogin(event,{for:k.email,forName:k.name||"",forCode:k.code||"",...extra});
let busy=false,lastSig="",lastErr=null;J.kitchenSyncErr=()=>lastErr;
J.kitchenSync=async(force)=>{if(busy||!S.ready||J.limited()||!isAdmin()||S.mode!=="cloud")return;const staff=J.staffList?.(true)||[];
  const sig=today()+"|"+staff.map(s=>{const e=J.kitchenEligible(s);return s.id+e.ok+e.email+e.pan+e.until+e.code}).join(",")+"|"+J.all("kitchenusers").map(k=>k.id+k.active+k.until+k.uid+k.staffId).join(",");
  if(!force&&sig===lastSig)return;busy=true;let changed=0;
  try{const want=new Map();for(const s of staff){const e=J.kitchenEligible(s);if(e.ok)want.set(e.email,{s,e})}
    for(const [email,{s,e}] of want){const d=J.get("kitchenusers",email);
      const needAcct=!d?.uid||d.pan!==e.pan;let acct={uid:d?.uid||"",pw:d?.pw||""};if(needAcct)acct=await provision(email,e.pan);
      const rec={id:email,email,staffId:s.id,name:s.name,code:e.code,active:true,until:e.until,uid:acct.uid,pw:acct.pw,pan:e.pan,dept:J.H.current(s)?.dept||s.dept||"",updatedAt:Date.now(),updatedBy:S.me.email,grantedAt:d?.active?d.grantedAt:Date.now(),revokedAt:null,revokeWhy:""};
      if(!d||!d.active||d.until!==rec.until||d.uid!==rec.uid||d.staffId!==s.id||d.code!==rec.code||d.pan!==rec.pan){await J.store.put("kitchenusers",rec);changed++;
        await logAdmin(d?.active?"access-updated":"access-granted",rec,{until:rec.until?new Date(rec.until).toISOString():"",pw:rec.pw})}}
    for(const d of J.all("kitchenusers")){if(!d.active||want.has(d.id))continue;const s=J.get("accounts",d.staffId);const why=s?J.kitchenEligible(s).why||"Gmail ID changed":"Staff record removed";
      await J.store.put("kitchenusers",{...d,active:false,revokedAt:Date.now(),revokeWhy:why,updatedAt:Date.now(),updatedBy:S.me.email});changed++;await logAdmin("access-revoked",d,{reason:why})}
    lastErr=null;lastSig=sig;if(changed)toast("Kitchen logins updated ("+changed+")")}
  catch(e){lastErr=e;console.warn("kitchen sync",e)}finally{busy=false}};
setInterval(()=>J.kitchenSync(),20000);J.onDerive?.(()=>setTimeout(()=>J.kitchenSync(),1500));
J.act("kitSyncNow",async()=>{await J.kitchenSync(true);J.render();const e=lastErr;if(e)toast(e.message)});
J.act("kitReset",async el=>{try{await firebase.auth().sendPasswordResetEmail(el.dataset.x);toast("Password reset email sent to "+el.dataset.x)}catch(e){toast(e.message)}});
// staff profile block
J.kitchenLoginHtml=s=>{const k=J.kitchenStatus(s);const d=k.doc;const t=fmtDate;
  const state=d?.active&&k.ok?`<span class="chip ok">Active</span> User ID <b class="mono">${esc(k.email)}</b> · password: PAN${d.pw==="other"?` <span class="chip warn">This Gmail already had a different password — they can use “Sign in with Google”, or</span> <button type="button" class="btn small" data-a="kitReset" data-x="${esc(k.email)}">Send password reset email</button>`:""}${d.until?` · closes after ${t(new Date(d.until).toISOString().slice(0,10))}`:""}`
    :d&&!d.active?`<span class="chip bad">Closed</span> ${esc(d.revokeWhy||"")}${d.revokedAt?" · "+new Date(d.revokedAt).toLocaleString("en-IN"):""}${k.ok?` <span class="hint">— will reopen automatically</span>`:""}`
    :k.ok?`<span class="chip warn">Being created…</span> <span class="hint">An owner or admin session creates it within a minute.</span>`:`<span class="chip plain">No login</span> <span class="hint">${esc(k.why)}</span>`;
  return `<div class="kitacc"><b>Kitchen app login</b> ${state}${lastErr&&isAdmin()?`<div class="err" style="margin-top:6px">${esc(lastErr.message)}${lastErr.fix?` <a href="${lastErr.fix}" target="_blank" rel="noopener">Open Firebase sign-in settings ↗</a> → enable “Email/Password”.`:""}</div>`:""}</div>`};
// ---------- Settings → Logins & devices ----------
const L={rows:null,loading:false,err:"",q:"",ev:"",from:"",to:""};
async function loadLog(){if(L.loading)return;L.loading=true;L.err="";try{const s=await J.fdb().collection("loginlog").orderBy("at","desc").limit(1500).get();L.rows=s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){L.err=e.code==="permission-denied"?"The login log can only be read after the new security rules are published (see the steps below).":e.message}L.loading=false;J.render()}
const EV={login:["Signed in","ok"],open:["Opened app","plain"],logout:["Signed out","plain"],failed:["Wrong ID / PAN","bad"],denied:["Refused","bad"],revoked:["Access closed","bad"],expired:["Access expired","bad"],"access-granted":["Login created","ok"],"access-updated":["Login updated","plain"],"access-revoked":["Login closed","warn"]};
const when=r=>{const d=new Date(r.srv?.toDate?r.srv.toDate():r.at);return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})};
function filtered(){const q=L.q.toLowerCase();return (L.rows||[]).filter(r=>(!L.ev||r.event===L.ev)&&(!q||[r.email,r.name,r.for,r.forName,r.deviceName,r.ip,r.os,r.browser,r.role].join(" ").toLowerCase().includes(q))&&(!L.from||new Date(r.at).toISOString().slice(0,10)>=L.from)&&(!L.to||new Date(r.at).toISOString().slice(0,10)<=L.to))}
J.vLogins=()=>{if(!canAudit())return `<div class="panel pb"><p>Only the owner, admins and auditors can see logins.</p></div>`;if(!L.rows&&!L.loading&&!L.err)setTimeout(loadLog,0);
  const ku=J.all("kitchenusers").sort((a,b)=>(b.active-a.active)||String(a.name).localeCompare(b.name));const rows=filtered();let myName="";try{myName=localStorage.getItem("jcgg-device-name")||""}catch(e){}
  const pend=J.staffList?.(true).map(s=>[s,J.kitchenEligible(s)]).filter(([s,e])=>e.kitchen&&e.inService&&!e.ok)||[];
  return `<section class="panel"><h2>Kitchen staff logins · ${ku.filter(k=>k.active).length} active</h2><div class="pb"><p class="hint" style="margin:0 0 8px">Created automatically for staff in service in a kitchen department with a Gmail ID and PAN in their staff record. User ID = Gmail, password = PAN. They see only the Kitchen module and cannot change anything. Closed automatically when relieved.</p>
    ${J.kitchenSyncErr()?`<div class="err">${esc(J.kitchenSyncErr().message)}${J.kitchenSyncErr().fix?` <a href="${J.kitchenSyncErr().fix}" target="_blank" rel="noopener">Open Firebase sign-in settings ↗</a> and enable “Email/Password”.`:""}</div>`:""}
    <div class="tbl-wrap"><table><thead><tr><th>Staff</th><th>Gmail ID</th><th>Status</th><th>Access until</th><th>Last change</th></tr></thead><tbody>${ku.map(k=>`<tr><td><b>${esc(k.name)}</b> <span class="hint mono">${esc(k.code||"")}</span></td><td class="mono">${esc(k.email)}</td><td>${k.active?`<span class="chip ok">Active</span>${k.pw==="other"?' <span class="chip warn">own password</span>':""}`:`<span class="chip bad">Closed</span> <span class="hint">${esc(k.revokeWhy||"")}</span>`}</td><td>${k.until?fmtDate(new Date(k.until).toISOString().slice(0,10)):k.active?"While in service":"—"}</td><td class="hint">${new Date(k.updatedAt||0).toLocaleString("en-IN")}<br>${esc(k.updatedBy||"")}</td></tr>`).join("")||`<tr><td colspan="5" class="muted">No kitchen logins yet.</td></tr>`}</tbody></table></div>
    ${pend.length?`<p class="hint" style="margin:10px 0 4px"><b>Kitchen staff without a login:</b> ${pend.map(([s,e])=>esc(s.name)+" ("+esc(e.why)+")").join(" · ")}</p>`:""}
    ${isAdmin()?`<button type="button" class="btn small" data-a="kitSyncNow" style="margin-top:8px">Check now</button>`:""}</div></section>
  <section class="panel"><h2>Login log ${L.rows?`· ${rows.length} of ${L.rows.length}`:""}</h2><div class="pb">
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><input type="search" placeholder="Search user, device, IP…" value="${esc(L.q)}" data-ach="logQ" style="max-width:240px"><select data-a="logEv"><option value="">All events</option>${Object.entries(EV).map(([k,[l]])=>`<option value="${k}" ${L.ev===k?"selected":""}>${l}</option>`).join("")}</select>
      <label class="row" style="gap:4px">From <input type="date" value="${L.from}" data-ach="logFrom"></label><label class="row" style="gap:4px">To <input type="date" value="${L.to}" data-ach="logTo"></label>
      <button type="button" class="btn small" data-a="logReload">Refresh</button><button type="button" class="btn small" data-a="logCsv" ${rows.length?"":"disabled"}>Download CSV</button></div>
    ${L.err?`<div class="err">${esc(L.err)}</div>`:L.loading&&!L.rows?`<p class="hint">Loading…</p>`:""}
    <div class="tbl-wrap"><table class="loglog"><thead><tr><th>Date &amp; time</th><th>Event</th><th>User</th><th>Device</th><th>Browser · OS</th><th>IP</th><th>Details</th></tr></thead><tbody>${rows.slice(0,500).map(r=>{const e=EV[r.event]||[r.event,"plain"];return `<tr><td class="nowrap">${when(r)}</td><td><span class="chip ${e[1]}">${esc(e[0])}</span></td><td><b>${esc(r.name||r.email)}</b><br><span class="hint mono">${esc(r.email)}</span>${r.role?`<br><span class="hint">${esc(r.role)} · ${esc(r.method==="password"?"Gmail + PAN":r.method==="google"?"Google":r.method||"")}</span>`:""}</td><td>${esc(r.deviceName||"")}<br><span class="hint">${esc(r.deviceType||"")}${r.deviceId?" · ID "+esc(String(r.deviceId).slice(0,8)):""}</span></td><td>${esc(r.browser||"")}<br><span class="hint">${esc(r.os||"")} · ${esc(r.screen||"")}</span></td><td class="mono">${esc(r.ip||"—")}</td><td class="hint">${r.for?`For <b>${esc(r.forName||r.for)}</b> (${esc(r.for)})${r.until?" · until "+esc(r.until.slice(0,10)):""} `:""}${r.reason?esc(r.reason)+" ":""}${esc(r.tz||"")}${r.online===false?" · offline":""}</td></tr>`}).join("")||(L.rows?`<tr><td colspan="7" class="muted">No entries match.</td></tr>`:"")}</tbody></table></div>
    ${rows.length>500?`<p class="hint">Showing the latest 500; download the CSV for all ${rows.length}.</p>`:""}
    <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><span class="hint">Name this device in the log:</span><input type="text" value="${esc(myName)}" placeholder="e.g. Kitchen tablet, Owner's phone" data-ach="devName" style="max-width:260px"></div>
    <p class="hint">Entries are written by the app at every sign-in, app open, sign-out, wrong password and refused attempt, with the server's own time. Nobody — including the owner — can edit or delete them.</p></div></section>`};
J.act("logQ",el=>{L.q=el.value;J.render()});J.act("logEv",el=>{L.ev=el.value;J.render()});J.act("logFrom",el=>{L.from=el.value;J.render()});J.act("logTo",el=>{L.to=el.value;J.render()});
J.act("logReload",()=>{L.rows=null;loadLog()});
J.act("devName",el=>{try{localStorage.setItem("jcgg-device-name",el.value.trim())}catch(e){}toast("Device name saved for this browser")});
J.act("logCsv",()=>{const cols=["date_time","event","email","name","role","method","deviceName","deviceType","deviceId","model","os","browser","screen","ip","tz","lang","for","forName","reason","ua"];
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';const csv=[cols.join(",")].concat(filtered().map(r=>cols.map(c=>q(c==="date_time"?when(r):r[c])).join(","))).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv"}));a.download="jcgg-login-log-"+today()+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)});
})();
