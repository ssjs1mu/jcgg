/* Petpooja bill corrections & upload log.
   Petpooja does not allow back-dated changes, so a bill changed here no longer matches the Petpooja report for that day. Every change therefore carries a mandatory note,
   keeps the original Petpooja figures on the bill, and is written to a log. A day with no bill can be given a new (manual) bill with its own note.
   A later re-upload of the Petpooja file never overwrites an edited bill or a manual bill — it only records that the file differs. */
(()=>{
const J=window.J,{S,esc,inr,inr0,r2,money0,fmtDate,today,monthLabel,fld,txt,num,selO,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const live=o=>!/cancel|saved|void|deleted/i.test(o.status||"");
const MODES=[["cash","Cash"],["upi","UPI"],["card","Card"],["online","Online (aggregator)"],["comp","Complimentary"]];
const ML={cash:"Cash",upi:"UPI",card:"Card",online:"Online",due:"Due",comp:"Complimentary"};
const snap=o=>({name:o.name||"",phone:o.phone||"",amt:o.amt,disc:o.disc,deliv:o.deliv,cont:o.cont,tax:o.tax,round:o.round,net:o.net,pays:arr(o.pays).map(p=>({m:p.m,amt:p.amt})),status:o.status||""});
const show=s=>`${s.name||s.phone?(s.name||"")+(s.phone?" "+s.phone:"")+" · ":""}${live(s)?"":"[cancelled] "}${inr0.format(s.net)} · ${arr(s.pays).map(p=>(ML[p.m]||p.m)+" "+inr0.format(p.amt)).join(" + ")||"no payment"}${s.disc?" · disc "+inr0.format(s.disc):""}`;
// ---- log ----
let mem=null,chain=Promise.resolve();
J.ppLogItems=()=>mem||arr(J.get("meta","ppLog")?.items);
J.ppLogAdd=e=>{chain=chain.then(async()=>{const items=[{at:Date.now(),by:S.me?.email||"",...e},...J.ppLogItems()].slice(0,1500);mem=items;try{await J.store.put("meta",{id:"ppLog",items})}catch(x){console.warn("log",x)}});return chain};
const locked=async day=>{const fv=J.get("vouchers",day?.vid||"");if(fv&&J.lock?.isFrozen(fv)){await J.lock.guard(fv,"change a bill on this day")}};
const posting=day=>!!day.vid||J.all("ppday").some(d=>d.vid);
async function save(date,orders,file){const cur=J.get("ppday",date);const day={...(cur||{id:date,m:date.slice(0,7),vid:""}),orders,at:Date.now(),by:S.me.email,file:cur?.file||file||"Manual bill"};await J.store.put("ppday",day);
  if(J.ppRepost&&posting(day)){try{await J.ppRepost(date)}catch(e){toast("Saved, but could not repost the day: "+(e.message||e))}}}
// ---- customer search / add / edit ----
const ph10=v=>String(v||"").replace(/\D/g,"").slice(-10);
const clientList=()=>J.all("clients").map(c=>({c,ph:ph10(c.phone||c.wa),label:(c.name||"")+(ph10(c.phone||c.wa)?" · "+ph10(c.phone||c.wa):"")})).filter(x=>x.label.trim());
const custFields=(name,phone)=>`<div class="form" style="grid-column:1/-1">${fld("Find customer (type name or mobile)",`<input id="f-cfind" list="pp-cl" data-ach="ppCust" autocomplete="off" placeholder="Search saved customers…"><datalist id="pp-cl">${clientList().map(x=>`<option value="${esc(x.label)}">`).join("")}</datalist>`)}${fld("Customer name",txt("name",name||""))}${fld("Mobile (10 digits)",txt("phone",phone||"","","inputmode=\"numeric\" maxlength=\"10\""))}</div>
  <label class="row" style="gap:8px"><input type="checkbox" name="saveCl" id="f-saveCl" checked> Save this name &amp; mobile in the client list (adds a new client or updates the existing one)</label>`;
J.act("ppCust",el=>{const v=el.value.trim();const hit=clientList().find(x=>x.label===v)||clientList().find(x=>x.ph&&x.ph===ph10(v));if(!hit)return;document.getElementById("f-name").value=hit.c.name||"";document.getElementById("f-phone").value=hit.ph});
const readCust=fd=>{const phone=ph10(fd.phone);if(String(fd.phone||"").replace(/\D/g,"").length&&phone.length!==10)return {err:"Mobile number must be 10 digits."};return {name:(fd.name||"").trim(),phone}};
async function saveClient(name,phone){if(!phone)return;const cl=J.all("clients").find(c=>ph10(c.phone||c.wa)===phone);
  if(cl){if(name&&cl.name!==name)await J.store.put("clients",{...cl,name});return}
  let mx=0;for(const c of J.all("clients")){const n=+String(c.code||"").replace(/\D/g,"");if(n>mx)mx=n}
  await J.store.put("clients",{id:"cl-"+J.uid(),code:"CL-"+String(mx+1).padStart(4,"0"),name:name||"Guest "+phone.slice(-4),phone,wa:phone,pts:[],family:[],createdAt:Date.now(),src:"bill",since:today()})}
// ---- day drawer ----
J.ppDayDrawer=date=>{const d=J.get("ppday",date);if(!d)return;const os=arr(d.orders);
  const orig=r2(os.filter(o=>!o.manual&&live(o)||!o.manual&&o.edit&&live(o.edit.orig)).reduce((s,o)=>s+(o.edit?.orig?o.edit.orig.net:o.net),0));const now=r2(os.filter(live).reduce((s,o)=>s+o.net,0));
  const ed=os.filter(o=>o.edit).length;
  J.drawer({title:"Orders · "+fmtDate(date),wide:true,submit:"Close",onSubmit:()=>{},body:`<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button class="btn primary w" type="button" data-a="ppAddBill" data-x="${date}">+ Add a bill for this day</button>
    <span class="hint">Petpooja file total ${money0(orig)} · after your corrections ${money0(now)}${Math.abs(now-orig)>0.5?` · <b>difference ${money0(r2(now-orig))}</b> (explained by the notes below)`:""}${ed?` · ${ed} bill${ed>1?"s":""} corrected`:""}</span></div>
   <div class="tbl-wrap"><table><thead><tr><th>Time</th><th>No.</th><th>Where</th><th>Customer</th><th>Items</th><th class="num">Bill</th><th>Paid by</th><th></th></tr></thead><tbody>${os.map(o=>`<tr style="${live(o)?"":"opacity:.5"}"><td>${esc(o.time||"")}</td><td class="mono">${esc(o.no)}</td><td>${esc(o.ch==="dine"?([o.table,o.area].filter(Boolean).join(" · ")||"Dine-in"):o.agg||o.ch||"")}</td><td>${esc(o.name||"")}${o.phone?`<div class="hint mono">${esc(o.phone)}</div>`:""}${o.house?' <span class="chip plain">house</span>':""}</td>
     <td class="hint">${esc(arr(o.items).join(", "))}${o.edit?`<div style="margin-top:4px">${o.manual?'<span class="chip warn">New bill</span>':'<span class="chip warn">Corrected</span>'} <b>${esc(o.edit.note)}</b><div>${esc(fmtDate(new Date(o.edit.at).toISOString().slice(0,10)))} · ${esc(o.edit.by||"")}${o.edit.orig?` · Petpooja had: ${esc(show(o.edit.orig))}`:""}</div></div>`:""}</td>
     <td class="num">${inr.format(o.net)}${o.disc?`<div class="hint">disc ${inr.format(o.disc)}</div>`:""}</td><td>${live(o)?o.pays.map(p=>`<span class="chip ${p.m==="due"?"warn":"plain"}">${ML[p.m]||p.m} ${inr0.format(p.amt)}</span>`).join(" "):esc(o.status)}</td>
     <td>${J.readOnly?.()?"":`<button class="btn small" type="button" data-a="ppEdit" data-x="${date}|${esc(o.no)}">Edit</button>`}</td></tr>`).join("")}</tbody></table></div>`})};
J.act("ppDay",el=>J.ppDayDrawer(el.dataset.x));
const payFields=(pays,net)=>`<div class="form">${MODES.map(([k,l])=>fld(l,num("p_"+k,pays.filter(p=>p.m===k).reduce((s,p)=>s+p.amt,0)||""))).join("")}</div><p class="hint" style="margin:0">Whatever of the bill is not entered above stays as <b>due</b> on the customer’s ledger.</p>`;
const readPays=(fd,net)=>{const pays=[];for(const [k] of MODES){const v=r2(+fd["p_"+k]||0);if(v>0)pays.push({m:k,amt:v})}const paid=r2(pays.reduce((s,p)=>s+p.amt,0));if(paid>net+0.5)return {err:`Payments (${inr0.format(paid)}) are more than the bill (${inr0.format(net)}).`};const due=r2(net-paid);if(due>0.5)pays.push({m:"due",amt:due});return {pays}};
const noteOk=n=>String(n||"").trim().length>=5;
// ---- edit a bill ----
J.act("ppEdit",el=>{if(J.readOnly?.())return;const [date,no]=el.dataset.x.split("|");const day=J.get("ppday",date);const o=arr(day?.orders).find(x=>String(x.no)===no);if(!o)return;
  const orig=o.edit?.orig;const cancelled=!live(o);
  J.drawer({title:"Correct bill #"+o.no+" · "+fmtDate(date),submit:"Save correction",body:`<p class="hint" style="margin:0">${o.manual?"This is a bill you added.":"Petpooja shows: <b>"+esc(show(orig||snap(o)))+"</b>. Petpooja cannot be changed for a past date, so this correction is kept here with your note and logged."}</p>
   <div class="form">${fld("Item value",num("amt",o.amt))}${fld("Discount",num("disc",o.disc||""))}${fld("Tax",num("tax",o.tax||""))}${fld("Delivery",num("deliv",o.deliv||""))}${fld("Container",num("cont",o.cont||""))}${fld("Round off (+/−)",num("round",o.round||""))}${fld("Status",selO("status",[["Printed","Billed"],["Cancelled","Cancelled"]],cancelled?"Cancelled":"Printed"))}</div>
   ${custFields(o.name,o.phone)}
   <b>Paid by</b>${payFields(o.pays,o.net)}
   ${fld("Why is this being changed? (required — shown against the bill and in the log)",`<textarea name="note" id="f-note" rows="2" placeholder="e.g. Guest paid by UPI, Petpooja showed cash; cannot edit back-dated bill">${esc(o.edit?.note||"")}</textarea>`)}
   ${orig?`<label class="row" style="gap:8px"><input type="checkbox" name="restore" id="f-restore"> Undo my correction — go back to what Petpooja shows</label>`:""}`,
  onSubmit:async fd=>{if(!noteOk(fd.note))return "Write a note (at least a few words) saying why the bill is changed.";
    const u={...o};const before=snap(o);
    if(fd.restore&&orig){Object.assign(u,orig);delete u.edit;await J.ppLogAdd({kind:"restore",date,no:o.no,note:fd.note.trim(),before:show(before),after:show(orig)})}
    else{const cu=readCust(fd);if(cu.err)return cu.err;u.name=cu.name;u.phone=cu.phone;for(const k of ["amt","disc","tax","deliv","cont","round"])u[k]=r2(+fd[k]||0);u.net=r2(u.amt-u.disc+u.deliv+u.cont+u.tax+u.round);
      if(fd.status==="Cancelled"){if(live(o))u.status="Cancelled";u.pays=[]}else{if(!live(o))u.status="Printed";const r=readPays(fd,u.net);if(r.err)return r.err;u.pays=r.pays}
      if(!(u.net>0)&&live(u))return "The bill total must be more than zero.";
      u.edit={at:Date.now(),by:S.me.email||"",note:fd.note.trim(),...(o.manual?{}:{orig:o.edit?.orig||before})};
      const after=snap(u);if(JSON.stringify(after)===JSON.stringify(before)&&fd.note.trim()===(o.edit?.note||""))return "Nothing has changed.";
      await J.ppLogAdd({kind:o.manual?"manual-edit":"edit",date,no:o.no,note:fd.note.trim(),before:show(before),after:show(after)})}
    try{await locked(day)}catch(e){return e?.frozen||/frozen|passcode/i.test(e?.message||"")?"This day is frozen — unlock it with the passcode first.":(e.message||"Could not unlock")}
    const orders=day.orders.map(x=>String(x.no)===no?u:x);if(fd.saveCl&&!fd.restore)await J.safe(()=>saveClient(u.name,u.phone));await J.safe(()=>save(date,orders),"Correction saved");setTimeout(()=>J.ppDayDrawer(date),250)}})});
// ---- add a bill ----
J.act("ppAddBill",el=>{if(J.readOnly?.())return;const [date0,amt0,mode0]=(el.dataset.x||"").split("|");const date=date0||today();
  J.drawer({title:"Add a bill",submit:"Add bill",body:`<p class="hint" style="margin:0">Use this when money came in for a day but no Petpooja bill was raised (or the day was never uploaded). The bill is marked <b>New bill</b> with your note, posts into that day’s sales entry, and is logged.</p>
   <div class="form">${fld("Date",`<input type="date" name="date" id="f-date" value="${esc(date)}" max="${today()}">`)}${fld("What was sold / for",txt("what","","e.g. Table 4 — missed bill"))}${fld("Where",selO("ch",[["dine","Dine-in"],["takeaway","Takeaway"],["delivery","Delivery"]],"dine"))}${fld("Item value",num("amt",amt0||""))}${fld("Discount",num("disc",""))}</div>
   ${custFields("","")}
   <b>Paid by</b>${payFields(mode0&&amt0?[{m:mode0,amt:+amt0}]:[],0)}
   ${fld("Why is this bill being added? (required)",`<textarea name="note" id="f-note" rows="2" placeholder="e.g. UPI received on 12 Oct but the bill was not punched in Petpooja"></textarea>`)}`,
  onSubmit:async fd=>{if(!noteOk(fd.note))return "Write a note saying why this bill is being added.";const date=fd.date;if(!date||date>today())return "Pick a valid date.";const amt=r2(+fd.amt||0),disc=r2(+fd.disc||0);const net=r2(amt-disc);if(!(net>0))return "Enter the bill amount.";if(!fd.what.trim())return "Say what the bill is for.";
    const r=readPays(fd,net);if(r.err)return r.err;const cu=readCust(fd);if(cu.err)return cu.err;
    const day=J.get("ppday",date);try{await locked(day)}catch(e){return "This day is frozen — unlock it with the passcode first."}
    const ds=date.replace(/-/g,"");const n=arr(day?.orders).filter(x=>x.manual).length+1;const no="MB-"+ds+"-"+String(n).padStart(2,"0");const t=new Date();
    const o={no,date,time:String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0"),name:cu.name,phone:cu.phone,items:[fd.what.trim()],amt,disc,deliv:0,cont:0,tax:0,round:0,total:net,net,payType:"Manual",mode:r.pays.length===1?r.pays[0].m:"part",status:"Printed",pays:r.pays,part:r.pays.length>1,ch:fd.ch,table:"",area:"",agg:"",house:false,manual:true,edit:{at:Date.now(),by:S.me.email||"",note:fd.note.trim()}};
    await J.ppLogAdd({kind:"add",date,no,note:fd.note.trim(),before:"",after:show(o)+" · "+o.items[0]});
    if(fd.saveCl)await J.safe(()=>saveClient(cu.name,cu.phone));await J.safe(()=>save(date,[...arr(day?.orders),o]),"Bill "+no+" added");setTimeout(()=>J.ppDayDrawer(date),250)}})});
// ---- log view ----
const KL={upload:"Petpooja file uploaded",edit:"Bill corrected",restore:"Correction undone","manual-edit":"New bill changed",add:"New bill added",gpay:"Google Pay file uploaded",other:"Note"};
J.ppLogView=()=>{const U=J.ui("pplog",{m:"",k:""});const all=J.ppLogItems();const ms=[...new Set(all.map(e=>new Date(e.at).toISOString().slice(0,7)))].sort().reverse();
  const L=all.filter(e=>(!U.m||new Date(e.at).toISOString().slice(0,7)===U.m)&&(!U.k||e.kind===U.k));
  return `<div class="filters"><button class="btn primary w" data-a="ppAddBill" data-x="">+ Add a bill for a date</button>${fld("Month logged",`<select data-ui="pplog.m"><option value="">All</option>${ms.map(m=>`<option value="${m}" ${U.m===m?"selected":""}>${monthLabel(m)}</option>`).join("")}</select>`)}${fld("Type",`<select data-ui="pplog.k"><option value="">All</option>${Object.entries(KL).map(([k,l])=>`<option value="${k}" ${U.k===k?"selected":""}>${l}</option>`).join("")}</select>`)}<button class="btn" data-a="ppLogCsv">Download (CSV)</button><span class="hint" style="margin-left:auto">${L.length} entries</span></div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>When</th><th>By</th><th>What</th><th>Bill date</th><th>Bill</th><th>Change</th><th>Note</th></tr></thead><tbody>${L.slice(0,300).map(e=>`<tr><td class="num">${esc(new Date(e.at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}))}</td><td class="hint">${esc((e.by||"").split("@")[0])}</td><td>${esc(KL[e.kind]||e.kind)}</td><td>${e.date?fmtDate(e.date):""}</td><td class="mono">${esc(e.no||"")}</td>
   <td class="hint">${e.kind==="upload"||e.kind==="gpay"?esc(e.detail||""):`${e.before?"<s>"+esc(e.before)+"</s><br>":""}${esc(e.after||"")}`}</td><td>${esc(e.note||"")}</td></tr>`).join("")||'<tr><td colspan="7" class="muted">Nothing logged yet. Every upload and every bill correction will appear here.</td></tr>'}</tbody></table></div></section>`};
J.act("ppLogCsv",()=>J.saveFile("bill-change-log.csv",J.toCSV([["When","By","What","Bill date","Bill","Before","After / detail","Note"],...J.ppLogItems().map(e=>[new Date(e.at).toISOString(),e.by,KL[e.kind]||e.kind,e.date||"",e.no||"",e.before||"",e.after||e.detail||"",e.note||""])])));
})();
