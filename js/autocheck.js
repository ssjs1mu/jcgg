/* Auto-check: (1) keeps an error log on this device — any screen or script error is caught, shown as a short message
   and listed in Accounts → Freeze & checks; (2) runs the books health check by itself (cached for half a minute)
   so its failures show in Home reminders without pressing "Run check". Read-only: it never posts anything. */
(()=>{
const J=window.J,{esc}=J;const KEY="jcgg.errlog";
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return []}};
const write=a=>{try{localStorage.setItem(KEY,JSON.stringify(a.slice(0,50)))}catch(e){}};
let lastMsg="",lastAt=0;
J.logErr=(e,where)=>{try{const msg=String(e?.message||e||"Unknown error").slice(0,300);const now=Date.now();if(msg===lastMsg&&now-lastAt<5000)return;lastMsg=msg;lastAt=now;
  const L=read();L.unshift({at:now,msg,where:where||location.hash||"",src:String(e?.stack||"").split("\n").slice(0,3).join(" | ").slice(0,400),v:(document.querySelector('script[src*="core.js"]')?.src.split("v=")[1])||""});write(L)}catch(x){}};
J.errLog=read;
window.addEventListener("error",ev=>{if(!ev.message||/ResizeObserver|Script error/i.test(ev.message))return;J.logErr(ev.error||ev.message,location.hash);J.toast?.("Something went wrong on this screen — noted in the error log (Accounts → Freeze & checks).")});
window.addEventListener("unhandledrejection",ev=>{const r=ev.reason;if(r?.locked||r?.frozen||r?.code)return;J.logErr(r,location.hash)});
J.act("errClear",()=>{write([]);J.render()});
J.errPanel=()=>{const L=read();return `<section class="panel"><div class="row" style="justify-content:space-between;padding:10px 12px"><h2 style="padding:0">Error log · ${L.length}</h2>${L.length?'<button class="btn w" data-a="errClear">Clear</button>':""}</div>
  ${L.length?`<div class="tbl-wrap"><table><thead><tr><th>When</th><th>Screen</th><th>Error</th><th>Version</th></tr></thead><tbody>${L.map(x=>`<tr><td>${esc(new Date(x.at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}))}</td><td>${esc(x.where||"")}</td><td style="white-space:normal">${esc(x.msg)}<div class="hint mono" style="white-space:normal">${esc(x.src||"")}</div></td><td>${esc(x.v||"")}</td></tr>`).join("")}</tbody></table></div>`:'<p class="hint pb" style="margin:0">No errors recorded on this device. If a screen fails, it is listed here with the time and the screen, so it can be fixed.</p>'}</section>`};
// health check that runs by itself
let hc=null,hcAt=0;
J.hcAuto=()=>{if(!J.healthCheck||!J.S?.ready)return hc||[];const now=Date.now();if(!hc||now-hcAt>30000){try{hc=J.healthCheck();hcAt=now}catch(e){J.logErr(e,"health check");hc=hc||[]}}return hc};
// ---- look-alike guards (warn once at save time; saving again goes through) ----
const amtOf=ls=>Math.round((ls||[]).reduce((t,l)=>t+(+l.dr||0),0)*100)/100;
J.dupLike=spec=>{const amt=amtOf(spec.lines);if(!(amt>0)||!spec.date)return [];const acs=new Set((spec.lines||[]).map(l=>l.a));const lo=J.addDays(spec.date,-3),hi=J.addDays(spec.date,3);
  return J.all("vouchers").filter(v=>v.id!==spec.id&&v.date>=lo&&v.date<=hi&&Math.abs(amtOf(v.lines)-amt)<0.01&&((spec.party&&v.party===spec.party)||(v.lines||[]).filter(l=>acs.has(l.a)).length>=2)).slice(0,5)};
let okKey="";
J.dupGuard=spec=>{if(spec.id)return null;const L=J.dupLike(spec);if(!L.length)return null;const key=[spec.date,amtOf(spec.lines),(spec.lines||[]).map(l=>l.a).sort().join()].join("|");if(okKey===key){okKey="";return null}okKey=key;return {list:L,
  text:"Looks like an entry already in the books: "+L.map(v=>v.no+" · "+J.fmtDate(v.date)+" · ₹"+J.inr0.format(amtOf(v.lines))+(v.narr?" · "+String(v.narr).slice(0,40):"")).join("; ")+". If this is a separate entry, press Save / Post again."}};
const nk=n=>String(n||"").toLowerCase().replace(/\b(pvt|private|ltd|limited|llp|and|the|m\/s|co|company|enterprises?|traders?|stores?)\b/g,"").replace(/[^a-z0-9]/g,"").replace(/s$/,"");
let okName="";
J.nameLike=(col,name,id)=>{const k=nk(name);if(k.length<4)return null;if(okName===col+k){okName="";return null}const hit=J.all(col).find(x=>x.id!==id&&x.active!==false&&(()=>{const y=nk(x.name);return y.length>=4&&(y===k||(Math.min(y.length,k.length)>=6&&(y.includes(k)||k.includes(y))))})());if(hit)okName=col+k;return hit||null};
// ---- count-up numbers: any element with data-count animates from 0 to its value when a screen is drawn ----
let cuKey="";
J.afterRender?.push(()=>{const els=[...document.querySelectorAll("#view [data-count]")];if(!els.length){cuKey="";return}const key=location.hash+els.map(e=>e.dataset.count).join();if(key===cuKey)return;cuKey=key;
  if(window.matchMedia?.("(prefers-reduced-motion:reduce)").matches)return;const t0=performance.now(),D=700;const fin=els.map(e=>e.textContent);
  const step=now=>{const k=Math.min(1,(now-t0)/D),ez=1-Math.pow(1-k,3);els.forEach((e,i)=>{if(!e.isConnected)return;e.textContent=k>=1?fin[i]:"₹"+J.inr0.format(Math.round((+e.dataset.count||0)*ez))});if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)});
})();
