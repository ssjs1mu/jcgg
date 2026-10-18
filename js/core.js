/* JCGG Suite — core: utilities, data layer, routing, shared UI */
"use strict";
window.J=(()=>{
const J={};
// ---------- utils ----------
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const inr=new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const inr0=new Intl.NumberFormat("en-IN",{maximumFractionDigits:0});
const qf=new Intl.NumberFormat("en-IN",{maximumFractionDigits:3});
const r2=n=>Math.round((+n||0)*100)/100;
const r3=n=>Math.round((+n||0)*1000)/1000;
const money=n=>(n<0?"−":"")+"₹"+inr.format(Math.abs(r2(n)));
const money0=n=>(n<0?"−":"")+"₹"+inr0.format(Math.abs(Math.round(n||0)));
const bal=n=>{n=r2(n);if(Math.abs(n)<0.005)return "₹0.00";return "₹"+inr.format(Math.abs(n))+(n>0?" Dr":" Cr")};
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>iso(new Date());
const parseISO=s=>{const [y,m,d]=String(s).split("-").map(Number);return new Date(y,(m||1)-1,d||1)};
const addDays=(s,n)=>{const d=parseISO(s);d.setDate(d.getDate()+n);return iso(d)};
const daysBetween=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
const fmtDate=s=>{if(!s)return"";const d=parseISO(s);return pad(d.getDate())+" "+d.toLocaleString("en-IN",{month:"short"})+" "+String(d.getFullYear()).slice(2)};
const monthLabel=m=>{if(!m)return"";const [y,mm]=m.split("-");return new Date(+y,+mm-1,1).toLocaleString("en-IN",{month:"short"})+" "+y.slice(2)};
const monthEnd=m=>iso(new Date(+m.slice(0,4),+m.slice(5,7),0));
const daysInMonth=m=>new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();
const fyOf=s=>{const [y,m]=s.split("-").map(Number);const a=m>=4?y:y-1;return {start:a+"-04-01",end:(a+1)+"-03-31",label:"FY "+a+"-"+String(a+1).slice(2),short:String(a).slice(2)+String(a+1).slice(2),y:a}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const monthsBetween=(a,b)=>{const out=[];let [y,m]=a.split("-").map(Number);const [by,bm]=b.split("-").map(Number);while(y<by||(y===by&&m<=bm)){out.push(y+"-"+pad(m));m++;if(m>12){m=1;y++}}return out};
const initials=s=>String(s||"?").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2800)}
Object.assign(J,{$,esc,inr,inr0,qf,r2,r3,money,money0,bal,pad,iso,today,parseISO,addDays,daysBetween,fmtDate,monthLabel,monthEnd,daysInMonth,fyOf,uid,monthsBetween,initials,toast});

const PERIODS=[["today","Today"],["7d","7 days"],["month","This month"],["lastmonth","Last month"],["fy","This FY"],["all","All"],["custom","Custom"]];
function periodRange(p,c){const t=today(),fy=fyOf(t);
  if(p==="today")return [t,t];if(p==="7d")return [addDays(t,-6),t];if(p==="month")return [t.slice(0,8)+"01",t];
  if(p==="lastmonth"){const d=parseISO(t);d.setDate(1);d.setMonth(d.getMonth()-1);return [iso(d),monthEnd(iso(d).slice(0,7))]}
  if(p==="fy")return [fy.start,fy.end];if(p==="all")return ["0000-01-01","9999-12-31"];
  if(p==="custom")return [c?.from||"0000-01-01",c?.to||"9999-12-31"];return [fy.start,fy.end]}
const periodSeg=(path,cur,c)=>`<div class="seg" role="group" aria-label="Period">${PERIODS.map(([k,l])=>`<button data-set="${path}.period=${k}" aria-pressed="${cur===k}">${l}</button>`).join("")}</div>${cur==="custom"?fld("From",`<input type="date" id="${path.replace(/\W/g,"-")}-from" data-ui="${path}.from" value="${esc(c?.from||"")}">`)+fld("To",`<input type="date" id="${path.replace(/\W/g,"-")}-to" data-ui="${path}.to" value="${esc(c?.to||"")}">`):""}`;
Object.assign(J,{PERIODS,periodRange,periodSeg});

// ---------- form helpers ----------
const fld=(label,inner,cls="")=>`<label class="f ${cls}">${label}${inner}</label>`;
const txt=(n,v,ph="",extra="")=>`<input name="${n}" id="f-${n}" value="${esc(v??"")}" placeholder="${esc(ph)}" ${extra}>`;
const num=(n,v,ph="0.00",extra="")=>`<input name="${n}" id="f-${n}" type="number" inputmode="decimal" step="any" value="${esc(v??"")}" placeholder="${esc(ph)}" ${extra}>`;
const dateI=(n,v)=>`<input type="date" name="${n}" id="f-${n}" value="${esc(v??"")}">`;
const selO=(n,opts,v,blank)=>`<select name="${n}" id="f-${n}">${blank!=null?`<option value="">${esc(blank)}</option>`:""}${opts.map(o=>{const [val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}" ${String(val)===String(v??"")?"selected":""}>${esc(lab)}</option>`}).join("")}</select>`;
const area=(n,v,rows=2,ph="")=>`<textarea name="${n}" id="f-${n}" rows="${rows}" placeholder="${esc(ph)}">${esc(v??"")}</textarea>`;
function formData(form){const f={};for(const el of form.elements){if(!el.name)continue;if(el.type==="checkbox")f[el.name]=el.checked;else if(el.type==="file")continue;else f[el.name]=el.value}return f}
Object.assign(J,{fld,txt,num,dateI,selO,area,formData});

// ---------- collections & state ----------
// monthly collections are partitioned by field `m` (YYYY-MM) and subscribed per month
const COLS={accounts:"full",vouchers:"monthly",items:"full",moves:"monthly",menu:"full",kotday:"monthly",recipes:"full",contacts:"full",attendance:"full",trades:"full",ohlc:"full",watch:"full",assets:"full",policies:"full",payroll:"full",clients:"full",kitchenusers:"full",meta:"full"};
const S={c:{},monthDocs:{},route:{mod:"home",tab:""},mode:"connecting",ready:false,ui:{},err:null,me:{role:"Super Admin",id:null,name:""}};
for(const k in COLS)S.c[k]=new Map();S.c.kots=new Map();
// kots are stored grouped per day in `kotday` (one record per day keeps the book far under the 25,000-record cap)
const DATA_KEYS=Object.keys(COLS).filter(k=>k!=="kotday"&&k!=="kitchenusers").concat("kots");
J.S=S;J.COLS=COLS;J.DATA_KEYS=DATA_KEYS;
const WINDOW={vouchers:1,moves:3,kotday:24};
function rebuildKots(){const m=new Map();for(const d of S.c.kotday.values())for(const [id,o] of Object.entries(d.orders||{}))if(o)m.set(id,{...o,id});S.c.kots=m}
J.all=col=>[...S.c[col].values()];
J.get=(col,id)=>S.c[col].get(id);
J.settings=()=>({business:"JCGG",startMonth:"2026-04",tables:12,targetFood:32,pfOn:false,esicOn:false,ptOn:true,otRate:1,payrollFrom:"2023-06",bizStart:"2023-06-22",lateDed:0,...(S.c.meta.get("settings")||{})});
J.bookFrom=()=>{const s=J.settings();return [s.startMonth||"2026-04",s.payrollFrom||s.startMonth||"2026-04"].sort()[0]};
let db=null,fdb=null;J.cap={};J.fdb=()=>fdb;
// Firestore cannot hold arrays directly inside arrays, so nested arrays are wrapped as {__a:[...]} on write and unwrapped on read
const enc=v=>Array.isArray(v)?v.map(x=>Array.isArray(x)?{__a:enc(x)}:enc(x)):v&&typeof v==="object"?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,enc(x)])):v;
const dec=v=>Array.isArray(v)?v.map(x=>x&&typeof x==="object"&&!Array.isArray(x)&&Object.keys(x).length===1&&"__a" in x?dec(x.__a):dec(x)):v&&typeof v==="object"?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,dec(x)])):v;
J.enc=enc;J.dec=dec;
const fsAdapter=f=>{const wrapQ=q=>({where:(a,o,b)=>wrapQ(q.where(a,o,b)),orderBy:(a,d)=>wrapQ(q.orderBy(a,d)),limit:n=>wrapQ(q.limit(n)),
    onSnapshot:(next,err)=>q.onSnapshot(s=>next({size:s.size,fromCache:s.metadata.fromCache,docs:s.docs.map(d=>({id:d.id,data:()=>dec(d.data())}))}),e=>err&&err({code:e.code==="permission-denied"?"not_allowed":e.code,message:e.message}))});
  return {collection:c=>({...wrapQ(f.collection(c)),doc:id=>{const r=f.collection(c).doc(id);return {set:d=>r.set(enc(d)),update:d=>r.set(enc(d),{merge:true}),delete:()=>r.delete()}}}),doc:p=>{const r=f.doc(p);return {set:d=>r.set(enc(d)),update:d=>r.set(enc(d),{merge:true}),delete:()=>r.delete(),onSnapshot:(n,e)=>r.onSnapshot(s=>n({id:s.id,exists:s.exists,data:()=>dec(s.data())}),e)}}}};
const local={key:"jcgg-suite-local-v1",
  load(){try{const j=JSON.parse(localStorage.getItem(this.key)||"null");if(j)for(const k of DATA_KEYS)if(Array.isArray(j[k]))S.c[k]=new Map(j[k].map(d=>[d.id,d]))}catch(e){}},
  save(){try{const o={};for(const k of DATA_KEYS)o[k]=[...S.c[k].values()];localStorage.setItem(this.key,JSON.stringify(o))}catch(e){}}};
const clean=o=>JSON.parse(JSON.stringify(o));
function deepMerge(t,p){for(const k in p){if(p[k]&&typeof p[k]==="object"&&!Array.isArray(p[k])){t[k]=t[k]&&typeof t[k]==="object"?t[k]:{};deepMerge(t[k],p[k])}else t[k]=p[k]}return t}
const store={
  async put(col,doc){doc=clean(doc);if(db&&col==="kots"){S.c.kots.set(doc.id,doc);return store.patch("kotday",doc.date,{m:doc.date.slice(0,7),date:doc.date,orders:{[doc.id]:doc}})}if(db)await db.collection(col).doc(doc.id).set(doc);else{S.c[col].set(doc.id,doc);local.save();J.refresh()}},
  async patch(col,id,patch){patch=clean(patch);if(db){await db.collection(col).doc(id).update({id,...patch})}
    else{const cur=S.c[col].get(id)||{id};S.c[col].set(id,deepMerge(cur,patch));local.save();J.refresh()}},
  async del(col,id){if(db&&col==="kots"){const o=S.c.kots.get(id);if(o){S.c.kots.delete(id);return store.patch("kotday",o.date,{orders:{[id]:null}})}return}if(db)await db.collection(col).doc(id).delete();else{S.c[col].delete(id);local.save();J.refresh()}}
};
J.store=store;
// one-off read of records in a collection that is not kept in memory (e.g. attached files)
J.fetchWhere=(col,field,val)=>new Promise((ok,no)=>{if(!db)return ok([]);let un=null;un=db.collection(col).where(field,"==",val).onSnapshot(s=>{if(s.fromCache&&!s.size)return;ok(s.docs.map(d=>({id:d.id,...d.data()})));setTimeout(()=>un&&un(),0)},e=>no(e))});
async function safe(fn,okMsg){try{const r=await fn();if(okMsg)toast(okMsg);return r??true}catch(e){toast(e?.message&&!e.code?e.message:"Could not save ("+(e?.code||"error")+"). Check the connection and try again.");return false}}
J.safe=safe;

// ---------- boot & subscriptions ----------
let renderQ=false;
const derivers=[];J.onDerive=fn=>derivers.push(fn);
J.D={};
function derive(){for(const fn of derivers){try{fn(J.D)}catch(e){console.error(e)}}}
J.derive=derive;
J.refresh=()=>{derive();if(renderQ)return;renderQ=true;requestAnimationFrame(()=>{renderQ=false;J.render()})};
let unsubs=[],mUnsubs=[];
function subscribe(){
  const got=new Set();
  for(const [col,kind] of Object.entries(COLS)){if(kind!=="full")continue;
    unsubs.push(db.collection(col).limit(1000).onSnapshot(s=>{const prevStart=J.settings().startMonth;S.c[col]=new Map(s.docs.map(d=>[d.id,{id:d.id,...d.data()}]));got.add(col);
      if(col==="meta"&&prevStart!==J.settings().startMonth)subMonthly();
      if(col==="accounts"&&!s.size&&!s.fromCache&&S.me.owner&&!J._seeded&&J.seedCloud){J._seeded=true;J.seedCloud()}if(got.has("accounts")&&got.has("meta"))S.ready=true;J.refresh()},onErr))}
  subMonthly();
}
function subscribeKitchen(){let got=0;const done=()=>{if(++got>=2&&!S.ready){S.ready=true}J.refresh()};
  unsubs.push(fdb.collection("menu").limit(1000).onSnapshot(s=>{S.c.menu=new Map(s.docs.map(d=>[d.id,{id:d.id,...d.data()}]));done()},onErr));
  unsubs.push(fdb.collection("meta").doc("settings").onSnapshot(d=>{if(d.exists)S.c.meta.set("settings",{id:"settings",...d.data()});done()},()=>done()));
  unsubs.push(fdb.collection("kitchenusers").doc(S.me.email).onSnapshot(d=>{const k=d.exists?d.data():null;if(k)S.me.kitUntil=k.until||0;if(!k||k.active!==true||(k.until&&Date.now()>=k.until)||(S.me.method==="password"&&k.uid!==S.me.id)){J._gateMsg="Your kitchen login has been closed. Contact the owner.";J.signOut("revoked")}},()=>{}));
  if(J._kitTimer)clearInterval(J._kitTimer);J._kitTimer=setInterval(()=>{if(S.me.kitUntil&&Date.now()>=S.me.kitUntil){J._gateMsg="Your kitchen login has been closed. Contact the owner.";J.signOut("expired")}},60000)}
function subMonthly(){mUnsubs.forEach(u=>u());mUnsubs=[];
  const end=(()=>{const d=new Date();d.setMonth(d.getMonth()+2);return iso(d).slice(0,7)})();const months=monthsBetween(J.bookFrom(),end);
  for(const [col,kind] of Object.entries(COLS)){if(kind!=="monthly")continue;S.monthDocs[col]={};const w=WINDOW[col]||1;
    for(let i=0;i<months.length;i+=w){const win=months.slice(i,i+w),key=win[0];const q=win.length===1?db.collection(col).where("m","==",win[0]):db.collection(col).where("m",">=",win[0]).where("m","<=",win.at(-1));
      mUnsubs.push(q.limit(1000).onSnapshot(s=>{S.monthDocs[col][key]=s.docs.map(d=>({id:d.id,...d.data()}));if(s.size>=1000)toast("More than 1,000 "+col+" records in "+key+": some may not show. Archive older entries.");S.c[col]=new Map(Object.values(S.monthDocs[col]).flat().map(v=>[v.id,v]));if(col==="kotday")rebuildKots();J.refresh()},onErr))}}
}
function onErr(e){S.err=e?.code||"unavailable";updateSync();if(e?.code==="not_allowed"){J.denied();return}toast(e?.code==="quota_exceeded"?"Storage is full. Download a backup and remove old records.":"Lost connection to the book. Reload the page to reconnect.")}
function updateSync(){const el=$("#syncState");if(el)el.textContent=S.mode==="cloud"?(S.err?"Sync problem — reload":(navigator.onLine===false?"Offline — changes will sync":"Synced across your devices")):S.mode==="local"?"Saved on this device only":"Connecting…"}
J.boot=async()=>{
  derive();
  const cfg=window.JCGG_CONFIG||{};
  if(!window.firebase||!cfg.firebase||!cfg.firebase.apiKey||/PASTE/.test(cfg.firebase.apiKey)){J.gate("setup");return}
  firebase.initializeApp(cfg.firebase);fdb=firebase.firestore();try{await fdb.enablePersistence({synchronizeTabs:true})}catch(e){}
  const auth=firebase.auth();auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
  auth.getRedirectResult().catch(e=>J.gate("login",e.message));
  auth.onAuthStateChanged(async u=>{
    if(!u){S.ready=false;let gm="";try{gm=sessionStorage.getItem("jcgg-gate-msg")||""}catch(e){}J.gate("login",J._gateMsg||gm);J._gateMsg="";return}
    const prov=u.providerData.map(p=>p.providerId);const google=prov.includes("google.com")&&u.emailVerified;const pw=prov.includes("password");
    const email=(u.email||"").toLowerCase();
    S.me={id:u.uid,email,name:u.displayName||email,photo:u.photoURL||"",method:google?"google":pw?"password":"other",owner:google&&!!cfg.ownerHash&&(await J.sha256(email))===cfg.ownerHash};
    // kitchen staff: access comes from kitchenusers/<gmail>, created when they join the kitchen and closed when they are relieved
    let kit=null;if(email&&!S.me.owner){try{const d=await fdb.collection("kitchenusers").doc(email).get();if(d.exists)kit=d.data()}catch(e){}}
    const kitOk=!!kit&&kit.active===true&&(!kit.until||Date.now()<kit.until)&&(google||(pw&&kit.uid===u.uid));
    if(kitOk){S.me.kitchen=true;S.me.name=kit.name||S.me.name;S.me.staffId=kit.staffId||"";S.me.kitCode=kit.code||"";S.me.kitUntil=kit.until||0}
    if(!google&&!kitOk){const why=kit&&kit.active!==true?"revoked":kit&&kit.until&&Date.now()>=kit.until?"expired":"no-access";
      await J.logLogin("denied",{reason:why});await auth.signOut();J.gate("login",why==="no-access"?"This login has no access. Kitchen staff sign in with the Gmail ID and PAN registered in their staff record.":"Your kitchen login has been closed. Contact the owner.");return}
    await J.logLogin(sessionStorage.getItem("jcgg-login-pending")?"login":"open");sessionStorage.removeItem("jcgg-login-pending");
    try{sessionStorage.removeItem("jcgg-gate-msg")}catch(e){}J.gate(null);db=fsAdapter(fdb);J.cap={db};S.mode="cloud";if(S.me.kitchen)subscribeKitchen();else subscribe();updateSync();J.render()});
  window.addEventListener("online",updateSync);window.addEventListener("offline",updateSync);
};
// ---------- login log: every sign-in, app open, sign-out, failed or refused attempt, with device details ----------
J.deviceInfo=async()=>{const ua=navigator.userAgent||"";const o={ua:ua.slice(0,300)};let hi={};
  try{if(navigator.userAgentData?.getHighEntropyValues)hi=await navigator.userAgentData.getHighEntropyValues(["model","platform","platformVersion","fullVersionList"])}catch(e){}
  const m=(re)=>(ua.match(re)||[])[1]||"";
  let os=hi.platform||"",osv=hi.platformVersion||"";
  if(/Android/.test(ua)){os="Android";osv=m(/Android ([\d.]+)/)||osv}else if(/iPhone|iPad|iPod/.test(ua)){os=/iPad/.test(ua)?"iPadOS":"iOS";osv=m(/OS ([\d_]+)/).replace(/_/g,".")}
  else if(/Windows NT/.test(ua)){os="Windows";osv=hi.platformVersion?(+hi.platformVersion.split(".")[0]>=13?"11":"10"):m(/Windows NT ([\d.]+)/)}else if(/Mac OS X/.test(ua)){os="macOS";osv=m(/Mac OS X ([\d_]+)/).replace(/_/g,".")}else if(/CrOS/.test(ua))os="ChromeOS";else if(/Linux/.test(ua))os="Linux";
  const bl=(hi.fullVersionList||[]).find(b=>!/Not.?A.?Brand|Chromium/i.test(b.brand));
  const br=bl?[bl.brand.replace("Google ",""),bl.version.split(".")[0]]:/Edg\//.test(ua)?["Edge",m(/Edg\/(\d+)/)]:/OPR\//.test(ua)?["Opera",m(/OPR\/(\d+)/)]:/SamsungBrowser/.test(ua)?["Samsung Internet",m(/SamsungBrowser\/(\d+)/)]:/CriOS/.test(ua)?["Chrome",m(/CriOS\/(\d+)/)]:/FxiOS|Firefox/.test(ua)?["Firefox",m(/(?:FxiOS|Firefox)\/(\d+)/)]:/Chrome\//.test(ua)?["Chrome",m(/Chrome\/(\d+)/)]:/Safari/.test(ua)?["Safari",m(/Version\/(\d+)/)]:["Browser",""];
  const model=hi.model||m(/Android [\d.]+; (?:[a-z]{2}-[a-z]{2}; )?([^;)]+?)(?: Build|\))/i).replace(/^K$/,"")||(/iPhone/.test(ua)?"iPhone":/iPad/.test(ua)?"iPad":"");
  const type=/iPad|Tablet/.test(ua)||(/Android/.test(ua)&&!/Mobile/.test(ua))?"Tablet":/Mobi|iPhone|Android/.test(ua)?"Mobile":"Desktop";
  let id="",label="";try{id=localStorage.getItem("jcgg-device-id")||"";if(!id){id=(crypto.randomUUID?.()||String(Math.random()).slice(2)).slice(0,18);localStorage.setItem("jcgg-device-id",id)}label=localStorage.getItem("jcgg-device-name")||""}catch(e){}
  Object.assign(o,{deviceId:id,deviceName:label||[model||type,os].filter(Boolean).join(" · "),deviceType:type,model,os:[os,osv].filter(Boolean).join(" "),browser:br.filter(Boolean).join(" "),
    screen:screen.width+"×"+screen.height,tz:Intl.DateTimeFormat().resolvedOptions().timeZone||"",lang:navigator.language||"",online:navigator.onLine,localTime:new Date().toString().slice(0,33)});
  try{const c=new AbortController();setTimeout(()=>c.abort(),2500);const r=await fetch("https://api.ipify.org?format=json",{signal:c.signal,cache:"no-store"});o.ip=(await r.json()).ip||""}catch(e){o.ip=""}
  return o};
J.logLogin=async(event,extra={})=>{try{if(!fdb)return;const me=S.me||{};const d=await J.deviceInfo();
  const rec={...d,...extra,event,email:String(extra.email||me.email||"").toLowerCase().slice(0,120),uid:event==="failed"?"":(me.id||""),name:event==="failed"?"":(me.name||""),
    role:event==="failed"?"":me.owner?"Super Admin":me.kitchen?"Kitchen Staff":(J.get?.("meta","roles")?.map?.[me.email]||"Google account"),method:me.method||(event==="failed"?"password":""),at:Date.now(),srv:firebase.firestore.FieldValue.serverTimestamp()};
  await fdb.collection("loginlog").add(rec)}catch(e){console.warn("login log not written",e?.code||e)}};
J.pwSignIn=async f=>{const email=f.email.value.trim().toLowerCase(),pan=f.pan.value.trim().toUpperCase();const err=f.querySelector(".err");const btn=f.querySelector("button");const show=m=>{err.hidden=false;err.textContent=m};err.hidden=true;
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return show("Enter your Gmail ID.");if(!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))return show("Enter your 10-character PAN, e.g. ABCDE1234F.");
  btn.disabled=true;const old=btn.textContent;btn.textContent="Signing in…";sessionStorage.setItem("jcgg-login-pending","1");
  try{await firebase.auth().signInWithEmailAndPassword(email,pan)}catch(e){sessionStorage.removeItem("jcgg-login-pending");const c=(e.code||"").replace("auth/","");await J.logLogin("failed",{email,reason:c||"error"});
    show(/invalid-credential|wrong-password|user-not-found|invalid-login|invalid-email/.test(c)?"Gmail ID or PAN is not correct, or this login has not been created yet.":c==="too-many-requests"?"Too many tries. Wait a few minutes and try again.":c==="operation-not-allowed"?"Kitchen staff login is not switched on yet. Ask the owner.":c==="network-request-failed"?"No internet connection.":e.message);btn.disabled=false;btn.textContent=old}};
document.addEventListener("submit",ev=>{if(ev.target.id==="kitLogin"){ev.preventDefault();J.pwSignIn(ev.target)}});
J.sha256=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("");
J.signIn=async()=>{sessionStorage.setItem("jcgg-login-pending","1");const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});try{await firebase.auth().signInWithPopup(p)}catch(e){if(/popup-blocked|operation-not-supported|cancelled-popup/.test(e.code||""))return firebase.auth().signInWithRedirect(p);if(!/popup-closed/.test(e.code||""))J.gate("login",e.message)}};
J.signOut=async(why)=>{if(J._out)return;J._out=true;try{if(J._gateMsg)sessionStorage.setItem("jcgg-gate-msg",J._gateMsg)}catch(e){}try{await Promise.race([J.logLogin(why||"logout"),new Promise(r=>setTimeout(r,2500))])}catch(e){}unsubs.forEach(u=>u());mUnsubs.forEach(u=>u());unsubs=[];mUnsubs=[];for(const k in S.c)S.c[k]=new Map();S.ready=false;try{await fdb.terminate();await fdb.clearPersistence()}catch(e){}await firebase.auth().signOut();location.reload()};
J.denied=()=>{if(J._denied)return;J._denied=true;J.gate("denied")};
J.gate=(kind,msg)=>{const g=$("#gate");if(!kind){g.hidden=true;document.querySelector(".app").hidden=false;$("#mnav").hidden=false;return}
  document.querySelector(".app").hidden=true;$("#mnav").hidden=true;g.hidden=false;const biz=esc((S.c.meta.get("settings")||{}).business||"JCGG");
  const body={setup:`<h1>Almost ready</h1><p>This copy of the app has no Firebase project connected yet. Fill in <span class="mono">js/firebase-config.js</span> as described in the README, then reload.</p>`,
    login:`<h1>${biz}</h1><p>Operations, stock, payroll and books. Sign in with the Google account your administrator has approved.</p>${msg?`<div class="err">${esc(msg)}</div>`:""}<button class="gbtn" data-a="signIn"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Sign in with Google</button><p class="hint">Owner, managers and office staff sign in with Google.</p>
      <form class="kitlogin" id="kitLogin" autocomplete="on"><h2>Kitchen staff <span lang="hi">· रसोई स्टाफ़</span> <span lang="bn">· রান্নাঘর</span></h2>
      <label>Gmail ID <span class="hint" lang="hi">(जीमेल)</span><input type="email" name="email" autocomplete="username" inputmode="email" required></label>
      <label>Password = your PAN number <span class="hint" lang="hi">(पैन नंबर)</span> <span class="hint" lang="bn">(প্যান নম্বর)</span><input type="password" name="pan" autocomplete="current-password" required maxlength="10" style="text-transform:uppercase"></label>
      <div class="err" hidden></div><button class="btn w" type="submit">Sign in · लॉग इन · লগ ইন</button></form>`,
    denied:S.me.kitchen?`<h1>Login closed</h1><p>Your kitchen login is no longer active. Contact the owner.</p><button class="btn" data-a="signOut">Sign out</button>`:`<h1>No access yet</h1><p>You are signed in as <b>${esc(S.me.email||"")}</b>, but this account has not been given access. Ask the owner to add it under Settings → Users &amp; roles.</p><button class="btn" data-a="signOut">Sign out and use another account</button>`}[kind];
  g.innerHTML=`<div class="gcard">${body}</div>`};


// ---------- roles ----------
const ROLES=["Super Admin","Admin","Manager","Accountant","Chef","Auditor"];
const ACCESS={"Super Admin":"*","Admin":"*","Manager":["home","accounts","inventory","kitchen","kot","staff","directory","assets","insurance"],"Accountant":["home","accounts","staff","assets","insurance","invest","directory"],"Chef":["home","inventory","kitchen","kot","directory"],"Auditor":"*","Kitchen Staff":["kitchen"]};
J.ROLES=ROLES;
function myRole(){if(S.me.owner)return "Super Admin";if(S.me.kitchen)return "Kitchen Staff";return J.get("meta","roles")?.map?.[S.me.email]||"Manager"}
J.myRole=myRole;
J.limited=()=>!!S.me.kitchen;
J.canSee=mod=>{const r=myRole();if(mod==="jdash")return r==="Super Admin"||r==="Admin";const a=ACCESS[r]||[];return a==="*"||a.includes(mod)||(mod==="settings"&&!S.me.kitchen)};
J.readOnly=()=>myRole()==="Auditor"||!!S.me.kitchen;

// ---------- modules & routing ----------
const MODS=[];J.MODS=MODS;
J.mod=m=>{MODS.push(m);return m};
const actions={};J.act=(name,fn)=>{actions[name]=fn};J.run=(name,x,extra={})=>actions[name]?.({dataset:{x,...extra}});
const GROUPS=["Home","Operations","Finance","Governance"];
const ICON=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
J.ICON=ICON;
J.go=(mod,tab)=>{const m=MODS.find(x=>x.id===mod);if(!m)return;S.route={mod,tab:tab||m.tabs[0][0]};S.hold=null;S.confirm=null;J.render();window.scrollTo(0,0);try{history.replaceState(null,"","#"+mod+(tab?"-"+tab:""))}catch(e){}};
function renderRail(){
  const vis=MODS.filter(m=>J.canSee(m.id));
  let h="";for(const g of GROUPS){const ms=vis.filter(m=>m.group===g);if(!ms.length)continue;if(g!=="Home")h+=`<div class="ng">${g}</div>`;
    h+=ms.map(m=>{const b=m.badge?.();return `<button data-go="${m.id}" ${S.route.mod===m.id?'aria-current="page"':""}>${ICON(m.icon)}<span>${esc(m.label)}</span>${b?`<span class="count">${b}</span>`:""}</button>`}).join("")}
  $("#nav").innerHTML=h;const who=$("#who");if(who&&S.me.email)who.innerHTML=(S.me.photo?`<img src="${esc(S.me.photo)}" alt="" referrerpolicy="no-referrer">`:"")+`<span>${esc((S.me.name||S.me.email).split(" ")[0])} · ${esc(myRole())}</span>`;$("#bizName").textContent=J.settings().business||"JCGG";
  $("#mnav").innerHTML=[["home","Home"],["accounts","Accounts"],["inventory","Stock"],["kot","Staff KOT"]].filter(([k])=>J.canSee(k)).map(([k,l])=>{const m=MODS.find(x=>x.id===k);return `<button data-go="${k}" ${S.route.mod===k?'aria-current="page"':""}>${ICON(m.icon)}<span>${l}</span></button>`}).join("")+`<button data-a="modmenu">${ICON('<path d="M4 6h16M4 12h16M4 18h16"/>')}<span>More</span></button>`;
}
J.render=()=>{
  document.documentElement.classList.toggle("ro",J.readOnly());
  renderRail();
  const v=$("#view");
  if(S.hold&&document.getElementById(S.hold)){J.holdRefresh?.forEach(f=>f());return}
  if(!S.ready){v.innerHTML=`<div class="empty" style="padding:80px 16px"><strong>Opening the books…</strong><span>Loading ledgers, stock, staff and records.</span></div>`;return}
  let m=MODS.find(x=>x.id===S.route.mod);if(!m||!J.canSee(m.id)){m=MODS.find(x=>J.canSee(x.id))||MODS[0];S.route={mod:m.id,tab:m.tabs[0][0]}}
  let tab=m.tabs.find(t=>t[0]===S.route.tab)||m.tabs[0];S.route.tab=tab[0];document.documentElement.dataset.mod=m.id;
  const vis=MODS.filter(x=>J.canSee(x.id));
  const mtop=`<div class="mtop"><select id="m-switch" aria-label="Module" data-a="switchmod">${vis.map(x=>`<option value="${x.id}" ${x.id===m.id?"selected":""}>${esc(x.label)}</option>`).join("")}</select></div>`;
  const bar=m.tabs.length>1?`<nav class="modbar" aria-label="${esc(m.label)} sections">${m.tabs.map(t=>`<button data-go="${m.id}" data-tab="${t[0]}" ${t[0]===tab[0]?'aria-current="page"':""}>${esc(t[1])}</button>`).join("")}</nav>`:"";
  let body;try{body=tab[2]()}catch(e){console.error(e);body=`<div class="err">This screen hit a problem: ${esc(e.message)}. Your data is safe; try another section or reload.</div>`}
  v.innerHTML=mtop+(m.id!=="home"?`<div class="head"><div><h1>${esc(m.label)}</h1>${m.sub?`<p>${esc(typeof m.sub==="function"?m.sub():m.sub)}</p>`:""}</div><div class="row">${m.headBtns?.()||""}</div></div>`:"")+bar+body;
  tab[3]?.();J.afterRender.forEach(f=>{try{f(m.id)}catch(e){console.error(e)}});
};
J.afterRender=[];
J.holdRefresh=[];

// ---------- drawers ----------
J.drawer=({title,body,submit="Save",onSubmit,danger,wide,docs})=>{if(docs&&J.docsPanel)body+=docs[1]?J.docsPanel(docs[0],docs[1]):`<p class="hint" style="margin:0">📎 Supporting documents (bills, receipts, photos, PDFs) can be attached once this is saved.</p>`;
  $("#overlay").innerHTML=`<div class="drawer-bg" data-a="closeDrawer"><form class="drawer" id="drawerForm" role="dialog" aria-label="${esc(title)}" ${wide?'style="width:min(1100px,100%)"':""}><h2>${esc(title)}</h2>${body}<div id="drawerErr"></div><div class="row" style="margin-top:4px">${onSubmit?`<button class="btn primary w" type="submit">${esc(submit)}</button>`:""}<button class="btn" type="button" data-a="closeDrawer">${onSubmit?"Cancel":"Close"}</button>${danger?`<span style="margin-left:auto">${danger}</span>`:""}</div></form></div>`;
  const f=$("#drawerForm");f.querySelector("input,select,textarea")?.focus();
  f.addEventListener("submit",async ev=>{ev.preventDefault();if(!onSubmit)return;const fd=formData(f);const btn=f.querySelector("button[type=submit]");btn.disabled=true;
    try{const r=await onSubmit(fd,f);if(r===false){btn.disabled=false;return}if(typeof r==="string"){J.drawerErr(r);btn.disabled=false;return}J.closeDrawer();J.render()}catch(e){btn.disabled=false;J.drawerErr(e.message||("Could not save ("+(e.code||"error")+")"))}});
  return f;
};
J.drawerErr=msg=>{const e=$("#drawerErr");if(e)e.innerHTML=msg?`<div class="err">${esc(msg)}</div>`:""};
J.closeDrawer=()=>{$("#overlay").innerHTML=""};
J.act("closeDrawer",(el,ev)=>{if(ev.target===el||el.tagName==="BUTTON")J.closeDrawer()});

// ---------- downloads & csv ----------
const csvCell=v=>{v=String(v??"");return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
J.toCSV=rows=>rows.map(r=>r.map(csvCell).join(",")).join("\n");
J.saveFile=async(name,data,type="text/csv")=>{try{const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast("Saved "+name)}catch(e){toast("Could not save the file")}};
J.parseCSV=text=>{const rows=[];let row=[],cur="",q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}else if(c==='"')q=true;else if(c===","||c==="\t"){row.push(cur);cur=""}else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cur);rows.push(row);row=[];cur=""}else cur+=c}if(cur||row.length){row.push(cur);rows.push(row)}return rows.filter(r=>r.some(x=>String(x).trim()))};
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
J.parseDate=s=>{s=String(s||"").trim();let m;
  if(m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))return m[1]+"-"+pad(m[2])+"-"+pad(m[3]);
  if(m=s.match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})/)){const y=m[3].length===2?"20"+m[3]:m[3];return y+"-"+pad(m[2])+"-"+pad(m[1])}
  if(m=s.match(/^(\d{1,2})[\/\-. ]([A-Za-z]{3})[A-Za-z]*[\/\-. ,]+(\d{2,4})/)){const mo=MON[m[2].toLowerCase()];if(mo){const y=m[3].length===2?"20"+m[3]:m[3];return y+"-"+pad(mo)+"-"+pad(m[1])}}
  return null};
J.numOf=s=>{s=String(s??"").replace(/[₹,\s]/g,"");let neg=false;if(/^\(.*\)$/.test(s)){neg=true;s=s.slice(1,-1)}if(/dr$/i.test(s)){neg=true;s=s.slice(0,-2)}s=s.replace(/cr$/i,"");const n=parseFloat(s);return isNaN(n)?0:(neg?-n:n)};
J.headerMap=(rows,need)=>{const hi=rows.findIndex(r=>r.some(c=>need.test(String(c))));if(hi<0)return null;const h=rows[hi].map(c=>String(c).trim().toLowerCase());return {hi,col:re=>h.findIndex(c=>re.test(c))}};
J.readFileInput=(id)=>new Promise(res=>{const f=document.getElementById(id)?.files?.[0];if(!f)return res(null);const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>res(null);r.readAsText(f)});

// ---------- UI state binding ----------
const getPath=(o,p)=>p.split(".").reduce((a,k)=>a?.[k],o);
const setPath=(o,p,v)=>{const ks=p.split(".");let a=o;for(const k of ks.slice(0,-1))a=a[k]??=({});a[ks.at(-1)]=v};
J.ui=(path,def)=>{let v=getPath(S.ui,path);if(v===undefined&&def!==undefined){setPath(S.ui,path,def);v=def}return v};
J.setUI=(path,v)=>setPath(S.ui,path,v);

// ---------- events ----------
document.addEventListener("click",async ev=>{
  const t=ev.target.closest("[data-go],[data-a],[data-set]");if(!t)return;
  const d=t.dataset;
  if(d.a&&t.tagName==="SELECT")return;
  if(d.go){J.go(d.go,d.tab);return}
  if(d.set){const [p,v]=d.set.split("=");J.setUI(p,v);S.confirm=null;J.render();return}
  if(d.a&&actions[d.a]){ev.stopPropagation();await actions[d.a](t,ev)}
});
document.addEventListener("change",ev=>{const t=ev.target;
  if(t.dataset.a&&t.tagName==="SELECT"&&actions[t.dataset.a]){actions[t.dataset.a](t,ev);return}
  if(t.dataset.ach&&actions[t.dataset.ach]){actions[t.dataset.ach](t,ev);return}
  if(t.dataset.ui){J.setUI(t.dataset.ui,t.type==="checkbox"?t.checked:t.value);J.render()}});
document.addEventListener("input",ev=>{const t=ev.target;
  if(t.closest("form[data-hold]")){S.hold=t.closest("form[data-hold]").id;J.holdRefresh.forEach(f=>f());return}
  if(t.dataset.ui&&(t.tagName==="TEXTAREA"||(t.tagName==="INPUT"&&!["date","month","checkbox","file"].includes(t.type)))){J.setUI(t.dataset.ui,t.value);clearTimeout(J._ft);J._ft=setTimeout(()=>{const id=t.id,pos=t.selectionStart;J.render();const el=document.getElementById(id);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(e){}}},280)}});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&$("#overlay").innerHTML)J.closeDrawer()});
J.act("switchmod",el=>J.go(el.value));
J.act("modmenu",()=>{J.drawer({title:"All modules",body:`<div class="nav">${MODS.filter(m=>J.canSee(m.id)).map(m=>`<button type="button" data-go="${m.id}" data-a2="close">${ICON(m.icon)}<span>${esc(m.label)}</span></button>`).join("")}</div>`});document.querySelectorAll("#drawerForm [data-go]").forEach(b=>b.addEventListener("click",()=>J.closeDrawer()))});
J.act("noconfirm",()=>{S.confirm=null;J.render()});
J.act("ask",el=>{S.confirm=el.dataset.x;J.render()});
J.confirmBtn=(key,label,yesAct,x)=>S.confirm===key?`<span class="confirm">${esc(label)}? <button class="btn small danger" data-a="${yesAct}" data-x="${esc(x)}">Delete</button><button class="btn small" data-a="noconfirm">Keep</button></span>`:`<button class="btn small w" data-a="ask" data-x="${esc(key)}" aria-label="${esc(label)}">✕</button>`;

// ---------- small shared view helpers ----------
J.emptyRow=(cols,title,sub)=>`<tr><td colspan="${cols}"><div class="empty"><strong>${esc(title)}</strong>${sub?`<span>${sub}</span>`:""}</div></td></tr>`;
J.kpi=(l,v,s,go)=>`<button class="kpi" ${go?`data-go="${go.split("/")[0]}" data-tab="${go.split("/")[1]||""}"`:""}><small>${esc(l)}</small><strong>${v}</strong><em>${s||""}</em></button>`;
// print any report (browser print dialog → Save as PDF)
const PRINT_CSS=`*{box-sizing:border-box}body{font:11px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111;margin:0}h1{font-size:17px;margin:0}h2{font-size:13px;margin:14px 0 6px}.sub{color:#555;margin:2px 0 10px}table{width:100%;border-collapse:collapse;margin:4px 0 8px}th,td{border:1px solid #bbb;padding:3px 5px;text-align:left;vertical-align:top}th{background:#f1f1f1;font-weight:600}.num{text-align:right;white-space:nowrap}tfoot td{font-weight:700;background:#f7f7f7}.muted{color:#666}.sig{display:flex;justify-content:space-between;margin-top:36px}.sig div{border-top:1px solid #333;padding-top:4px;width:28%;text-align:center}.hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:6px;margin-bottom:8px}tr{page-break-inside:avoid}.pb{page-break-before:always}ul{margin:4px 0 8px 18px;padding:0}li{margin:2px 0}p{margin:4px 0 8px}h2{border-bottom:1px solid #ccc;padding-bottom:2px}`;
J.PRINT_CSS=PRINT_CSS;
J.printDoc=(title,html,landscape)=>{const f=document.createElement("iframe");f.setAttribute("aria-hidden","true");f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";document.body.appendChild(f);const d=f.contentDocument;d.open();
  d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4 ${landscape?"landscape":"portrait"};margin:10mm}${PRINT_CSS}</style></head><body>${html}<p class="muted" style="margin-top:14px">Printed ${new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})} · ${esc(J.settings().business||"JCGG")}</p></body></html>`);d.close();
  setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){console.error(e)}setTimeout(()=>f.remove(),120000)},350)};
J.act("printSlip",()=>{document.body.classList.add("print-slip");window.print();setTimeout(()=>document.body.classList.remove("print-slip"),500)});
J.act("signIn",()=>J.signIn());J.act("signOut",()=>J.signOut());
return J;
})();
