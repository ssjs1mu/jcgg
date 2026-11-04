/* Pending sheet (Accounts → Pending sheet): one month, one row per date, Business and Personal in separate column groups.
   Shows what is still to be done or settled that day: sales not imported / posted / counted, supplier bills unpaid, dues, attendance,
   staff KOT unpaid, register entries waiting for the bank statement, personal-account payments to Joshi's Corner not yet matched to KOT days. */
(()=>{
const J=window.J,{esc,fmtDate,money0}=J;
const arr=x=>Array.isArray(x)?x:[];
const r2=n=>Math.round(n*100)/100;
const today=()=>new Date(Date.now()+19800000).toISOString().slice(0,10);
const ui=()=>J.ui("pend",{m:today().slice(0,7),only:true});
const mAdd=(m,n)=>{const [y,mo]=m.split("-").map(Number);const d=new Date(Date.UTC(y,mo-1+n,1));return d.toISOString().slice(0,7)};
const daysOf=m=>{const [y,mo]=m.split("-").map(Number);const n=new Date(Date.UTC(y,mo,0)).getUTCDate();return [...Array(n)].map((_,i)=>m+"-"+String(i+1).padStart(2,"0"))};
const B=n=>J.bal?J.bal(n):money0(n);
const isMoney=a=>!!a&&["bank","cash","card","wallet"].includes(a.kind);
const divOfV=v=>{for(const l of arr(v.lines)){const a=J.get("accounts",l.a);if(isMoney(a))return J.divOf?J.divOf(a):"jcgg"}return "jcgg"};

function build(m){const t=today(),days=daysOf(m),R={};for(const d of days)R[d]={sales:[],bills:0,billN:[],dues:[],staff:[],kot:0,regB:0,regP:0,jc:0};
  const have=d=>d<=t;
  // sales: Petpooja day missing / not posted; cash count missing
  const cash=new Set(J.all("cashday").map(c=>c.date));
  for(const d of days){if(d>=t)continue;const pp=J.get("ppday",d);
    if(!pp)R[d].sales.push("No Petpooja upload");else{if(!pp.vid)R[d].sales.push("Not posted");if(!cash.has(d))R[d].sales.push("Cash count")}}
  // supplier bills not yet matched to a payment
  for(const b of J.all("bills")){if(!b.date||!R[b.date]||b.pay)continue;R[b.date].bills=r2(R[b.date].bills+(+b.total||0));R[b.date].billN.push(b.vendorName||"")}
  // dues / EMIs / licences coming due
  try{for(const a of J.duesAlerts?.()||[])if(a.d&&R[a.d])R[a.d].dues.push(String(a.text||"").replace(/\s+/g," ").slice(0,70))}catch(e){}
  // staff: attendance not marked, payroll not run once the month has ended
  const att=J.get("attendance",m)?.days||{};for(const d of days){if(d>=t)continue;if(!att[d]||!Object.keys(att[d]).length)R[d].staff.push("Attendance")}
  if(days.at(-1)<t&&!J.get("payroll",m))R[days.at(-1)].staff.push("Payroll not run");
  // staff KOT unpaid
  try{for(const x of J.skDueSummary?.()?.due||[])if(R[x.d])R[x.d].kot=r2(R[x.d].kot+x.a)}catch(e){}
  // register entries still waiting for the statement, split business / personal
  for(const v of J.all("vouchers")){if(!v.f?.reg||!R[v.date])continue;if(v.bank||v.imp||Object.keys(v.rec||{}).length)continue;const a=arr(v.lines).reduce((s,l)=>s+(+l.dr||0),0);
    if(divOfV(v)==="jcgg")R[v.date].regB=r2(R[v.date].regB+a);else R[v.date].regP=r2(R[v.date].regP+a)}
  // personal-account payments to Joshi's Corner not yet matched to staff KOT days
  try{for(const c of J.skUnusedPers?.()||[])if(R[c.d])R[c.d].jc=r2(R[c.d].jc+c.a)}catch(e){}
  return R}

function view(){const U=ui(),R=build(U.m),t=today();
  const has=r=>r.sales.length||r.bills||r.dues.length||r.staff.length||r.kot||r.regB||r.regP||r.jc;
  const rows=Object.entries(R).filter(([d,r])=>!U.only||has(r));
  const tot={bills:0,kot:0,regB:0,regP:0,jc:0,sales:0,dues:0,staff:0};for(const r of Object.values(R)){tot.bills+=r.bills;tot.kot+=r.kot;tot.regB+=r.regB;tot.regP+=r.regP;tot.jc+=r.jc;tot.sales+=r.sales.length;tot.dues+=r.dues.length;tot.staff+=r.staff.length}
  const ch=a=>a.map(x=>`<span class="chip warn" style="margin:1px">${esc(x)}</span>`).join("");
  const cell=(n,cr)=>n?`<td class="num">${B(cr?-n:n)}</td>`:`<td></td>`;
  const mn=new Date(U.m+"-01T00:00:00Z").toLocaleDateString("en-IN",{month:"long",year:"numeric",timeZone:"UTC"});
  return `<div class="filters"><button class="btn w" data-set="pend.m=${mAdd(U.m,-1)}" aria-label="Previous month">‹</button><b style="min-width:120px;text-align:center">${esc(mn)}</b><button class="btn w" data-set="pend.m=${mAdd(U.m,1)}" aria-label="Next month">›</button>
   <button class="btn w" data-set="pend.only=${!U.only}" aria-pressed="${U.only}">${U.only?"Show every date":"Only dates with pending"}</button>
   <span class="hint">${rows.length} date${rows.length===1?"":"s"} with pending items. Business and Personal are separate; nothing here is posted — it lists what still needs doing.</span></div>
  <div class="panel"><div class="tbl-wrap"><table class="grid-x fit"><thead>
   <tr><th rowspan="2">Date</th><th colspan="6" style="text-align:center">Business (JCGG)</th><th colspan="2" style="text-align:center">Personal</th></tr>
   <tr><th>Sales &amp; cash</th><th class="num">Supplier bills unpaid</th><th>Dues / vendors</th><th>Staff</th><th class="num">Staff KOT unpaid</th><th class="num">Register: waiting for statement</th><th class="num">Register: waiting for statement</th><th class="num">Payments to Joshi's Corner not matched to KOT</th></tr></thead>
   <tbody>${rows.map(([d,r])=>`<tr${d===t?' style="outline:1px solid var(--accent,#888)"':""}><td style="white-space:nowrap"><b>${fmtDate(d)}</b></td>
    <td>${ch(r.sales)}</td>${cell(r.bills,true)}<td class="hint">${r.dues.map(esc).join("<br>")}</td><td>${ch(r.staff)}</td>${cell(r.kot,false)}${cell(r.regB,false)}${cell(r.regP,false)}${cell(r.jc,false)}</tr>`).join("")||'<tr><td colspan="9" class="muted">Nothing pending in this month.</td></tr>'}
   </tbody><tfoot><tr><th>Month</th><th>${tot.sales} item${tot.sales===1?"":"s"}</th><th class="num">${tot.bills?B(-tot.bills):""}</th><th>${tot.dues||""}</th><th>${tot.staff||""}</th><th class="num">${tot.kot?B(tot.kot):""}</th><th class="num">${tot.regB?B(tot.regB):""}</th><th class="num">${tot.regP?B(tot.regP):""}</th><th class="num">${tot.jc?B(tot.jc):""}</th></tr></tfoot></table></div></div>`}
const acc=J.MODS.find(m=>m.id==="accounts");if(acc){const i=acc.tabs.findIndex(t=>t[0]==="register");acc.tabs.splice(i<0?acc.tabs.length:i+1,0,["pending","Pending sheet",view])}
})();
