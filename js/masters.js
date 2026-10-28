/* Category masters — the full ladder for money in and out:
     Category  ›  Sub-category (ledger)  ›  Micro-category (ledger.svc[], tagged on entry lines as line.s)
   e.g. Expenses · Dineout › Restaurant › Hotel Swagath / Hotel Aston International / Bonophool
        Income   · Food sales › Delivery sales › Swiggy / Zomato / Toing
   - Income categories work exactly like expense categories (meta/cats.inc, ledger.cat).
   - Micro-categories can be added / edited / removed right from the entry form ("＋ Add micro-category…"),
     from Accounts → Categories (Micro-categories button) and carry an optional monthly budget.
   - Reports → Micro-categories & budget: every level by month with actual vs budget.
   - The ledger quick-add window and the ledger form take a category (pick or type a new one). */
(()=>{
const J=window.J,{S,esc,inr,money0,r2,fmtDate,monthLabel,today,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const DEFI=["Food sales","Other income"];
// ---------- income categories ----------
J.incCats=()=>{const own=arr(J.get("meta","cats")?.inc);const base=own.length?own:DEFI;const extra=[...new Set(J.all("accounts").filter(a=>a.kind==="income"&&a.cat&&!base.includes(a.cat)).map(a=>a.cat))];return [...base,...extra]};
J.incCatOf=a=>a?.cat||(a?.cat===""?"Uncategorised":(/sale|dine|takeaway|delivery|party|banquet/i.test(a?.name||"")||a?.sys==="sales"?"Food sales":"Other income"));
J.catEnsure=async(kind,c)=>{c=String(c||"").trim();if(!c||!J.saveCats)return;const inc=kind==="income";const list=inc?J.incCats():J.expCatsAll();if(list.some(x=>x.toLowerCase()===c.toLowerCase()))return;await J.saveCats({[inc?"inc":"exp"]:[...list,c]})};

// ---------- micro-categories: picker on the entry form ----------
const getA=id=>J.get("accounts",id);
const svcOf=id=>arr(getA(id)?.svc).map(c=>({...c}));
async function saveSvc(id,list){const a=getA(id);const n={...a,svc:list};await J.store.put("accounts",n);try{S.c.accounts.set(n.id,n)}catch(e){}}
const usedCount=sid=>{let n=0;for(const v of J.D?.vs||J.all("vouchers"))for(const l of arr(v.lines))if(l.s===sid)n++;return n};
function refillPicker(head,sel){const el=document.getElementById("f-svc");if(!el)return;el.innerHTML=J._microOpts(head,sel||"");el.value=sel||"";el.dataset.prev=el.value;el.dispatchEvent(new Event("change",{bubbles:true}))}
function closeOv(){document.getElementById("mc-ov")?.remove()}
function microDialog(head,id){closeOv();const a=getA(head);if(!a)return;const list=svcOf(head);const c=id?list.find(x=>x.id===id):null;if(id&&!c)return;const used=c?usedCount(c.id):0;
  const ov=document.createElement("div");ov.id="mc-ov";ov.className="qa-ov";
  ov.innerHTML=`<div class="qa-box" role="dialog" aria-modal="true"><h3>${c?"Edit":"Add"} micro-category</h3><p class="hint" style="margin-top:0">Under <b>${esc(a.name)}</b>${a.cat?` · ${esc(a.cat)}`:""}</p>
   <label class="f">Name<input id="mc-name" value="${esc(c?.name||"")}" placeholder="e.g. Hotel Swagath"></label>
   <div class="form"><label class="f">Monthly budget ₹ (optional)<input id="mc-bud" type="number" step="any" min="0" value="${c?.budget||""}"></label>
   <label class="f">Number / ID (optional)<input id="mc-no" value="${esc(c?.no||"")}"></label></div>
   <label class="f">Match words in bank narrations (optional, comma separated)<input id="mc-words" value="${esc(c?.words||"")}" placeholder="e.g. swagath, hotel swagath"></label>
   ${c?`<p class="hint" style="margin:6px 0 0">${used?`Used in ${used} entr${used===1?"y":"ies"} — it can be hidden from lists but not deleted.`:"Not used in any entry — it can be deleted."}</p>`:""}
   <div class="row" style="justify-content:space-between;margin-top:12px">${c?`<button type="button" class="btn small danger" id="mc-del">${used?"Hide from lists":"Delete"}</button>`:"<span></span>"}<span class="row" style="gap:8px"><button type="button" class="btn w" id="mc-x">Cancel</button><button type="button" class="btn primary" id="mc-ok">${c?"Save":"Add"}</button></span></div></div>`;
  document.body.appendChild(ov);setTimeout(()=>ov.querySelector("#mc-name").focus(),30);
  ov.addEventListener("click",e=>{if(e.target===ov)closeOv()});ov.querySelector("#mc-x").onclick=closeOv;
  ov.addEventListener("keydown",e=>{if(e.key==="Escape")closeOv();if(e.key==="Enter"&&e.target.tagName==="INPUT"){e.preventDefault();ov.querySelector("#mc-ok").click()}});
  ov.querySelector("#mc-ok").onclick=async()=>{const name=ov.querySelector("#mc-name").value.trim();if(!name)return toast("Enter a name.");
    const dup=list.find(x=>x.name.toLowerCase()===name.toLowerCase()&&x.id!==c?.id);if(dup&&!c){closeOv();refillPicker(head,dup.id);return toast("“"+dup.name+"” already exists — selected it.")}
    const rec={...(c||{id:"svc-"+J.uid(),active:true,provider:""}),name,no:ov.querySelector("#mc-no").value.trim(),words:ov.querySelector("#mc-words").value.trim(),budget:+ov.querySelector("#mc-bud").value||0,active:true};
    const out=c?list.map(x=>x.id===c.id?rec:x):[...list,rec];const ok=await J.safe(()=>saveSvc(head,out));if(ok===false)return;closeOv();refillPicker(head,rec.id);toast((c?"Updated ":"Added ")+"“"+name+"”")};
  ov.querySelector("#mc-del")?.addEventListener("click",async()=>{const out=used?list.map(x=>x.id===c.id?{...x,active:false}:x):list.filter(x=>x.id!==c.id);await J.safe(()=>saveSvc(head,out));closeOv();refillPicker(head,"");toast(used?"“"+c.name+"” hidden (history kept)":"Deleted “"+c.name+"”")})}
J.microDialog=microDialog;
document.addEventListener("focusin",e=>{const s=e.target;if(s?.id==="f-svc")s.dataset.prev=s.value},true);
document.addEventListener("change",e=>{const s=e.target;if(!s)return;
  if(s.id==="f-head"&&document.getElementById("f-svc")){refillPicker(s.value,"");return}
  if(s.id==="f-svc"){const v=s.value;if(v!=="__mnew__"&&v!=="__medit__"){s.dataset.prev=v;return}e.stopImmediatePropagation();const prev=s.dataset.prev||"";s.value=prev;const head=document.getElementById("f-head")?.value;
    if(!head){toast("Choose the head first.");return}if(v==="__medit__"&&!prev){toast("Choose a micro-category first, then pick ✎ Edit.");return}microDialog(head,v==="__medit__"?prev:null)}},true);

// ---------- Categories tab: income categories ----------
const adm=()=>!J.readOnly?.();
const saveInc=list=>J.saveCats({inc:list});
function incFY(){const fy=J.fyOf(today());const R={};for(const v of J.D?.vs||J.all("vouchers")){if(v.date<fy.start||v.date>today())continue;for(const l of arr(v.lines)){const a=getA(l.a);if(a?.kind!=="income")continue;R[a.id]=r2((R[a.id]||0)+(+l.cr||0)-(+l.dr||0))}}return R}
function incSection(){const cats=J.incCats();const inc=J.all("accounts").filter(a=>a.kind==="income");const R=incFY();const A=adm();
  const sec=c=>{const list=inc.filter(a=>J.incCatOf(a)===c).sort((a,b)=>(R[b.id]||0)-(R[a.id]||0)||a.name.localeCompare(b.name));const i=cats.indexOf(c);const tot=list.reduce((s,a)=>s+(R[a.id]||0),0);
    const sel=a=>`<select data-ach="incMove" data-x="${a.id}" aria-label="Move ${esc(a.name)} to category" ${A?"":"disabled"}>${[...cats,...(J.incCatOf(a)==="Uncategorised"?["Uncategorised"]:[])].map(x=>`<option ${x===J.incCatOf(a)?"selected":""}>${esc(x)}</option>`).join("")}</select>`;
    return `<section class="panel"><div class="row" style="justify-content:space-between;padding:10px 12px;flex-wrap:wrap;gap:6px"><h2 style="padding:0">${esc(c)} <span class="muted" style="font-weight:400">${list.length} sub-categor${list.length===1?"y":"ies"} · ${money0(tot)} this FY</span></h2>
      ${A&&c!=="Uncategorised"?`<div class="row" style="gap:6px"><button class="btn small" data-a="incUp" data-x="${esc(c)}" ${i<=0?"disabled":""} aria-label="Move up">↑</button><button class="btn small" data-a="incRen" data-x="${esc(c)}">Rename</button><button class="btn small danger" data-a="incDel" data-x="${esc(c)}">Delete</button><button class="btn small primary w" data-a="incSub" data-x="${esc(c)}">+ Sub-category</button></div>`:""}</div>
      <div class="tbl-wrap"><table><thead><tr><th>Sub-category</th><th class="num">This FY</th><th>Category</th><th></th></tr></thead><tbody>${list.map(a=>`<tr><td><button class="linkbtn" data-a="openLedger" data-x="${a.id}">${esc(a.name)}</button>${a.active===false?' <span class="chip plain">inactive</span>':""}</td><td class="num">${R[a.id]?inr.format(R[a.id]):'<span class="muted">—</span>'}</td><td>${sel(a)}</td><td style="white-space:nowrap;text-align:right">${A?`<button class="btn small" data-a="svcEdit" data-x="${a.id}" title="Third level: platforms, branches, parties…">Micro-categories${arr(a.svc).length?" ("+arr(a.svc).length+")":""}</button> <button class="btn small" data-a="editAcc" data-x="${a.id}">Edit</button> ${J.delBtn?J.delBtn("accounts",a.id):""}`:""}</td></tr>`).join("")||`<tr><td colspan="4" class="muted">No sub-categories yet.</td></tr>`}</tbody></table></div></section>`};
  const unc=inc.filter(a=>J.incCatOf(a)==="Uncategorised");
  return `<div class="row" style="justify-content:space-between;align-items:center;margin-top:14px"><h2 class="ph" style="padding:6px 0">Income categories</h2>${A?`<button class="btn primary w" data-a="incNew">+ New category</button>`:""}</div>
    <p class="hint" style="margin-top:0">Income ledgers (sales heads, interest, rent received…) are the sub-categories. Under each sub-category add micro-categories — e.g. Delivery sales › Swiggy, Zomato, Toing.</p>${cats.map(sec).join("")}${unc.length?sec("Uncategorised"):""}`}
J.act("incNew",()=>J.drawer({title:"New income category",submit:"Create",body:J.fld("Category name",J.txt("name","","e.g. Food sales"))+`<p class="hint">Then add its sub-categories with “+ Sub-category”.</p>`,onSubmit:async fd=>{const n=fd.name.trim();if(!n)return "Give it a name.";if(J.incCats().some(c=>c.toLowerCase()===n.toLowerCase()))return "That category already exists.";await saveInc([...J.incCats(),n]);toast("Category added")}}));
J.act("incRen",el=>{const c=el.dataset.x;J.drawer({title:"Rename category",submit:"Save",body:J.fld("Category name",J.txt("name",c)),onSubmit:async fd=>{const n=fd.name.trim();if(!n)return "Give it a name.";if(n!==c&&J.incCats().some(x=>x.toLowerCase()===n.toLowerCase()))return "That category already exists.";
  await saveInc(J.incCats().map(x=>x===c?n:x));for(const a of J.all("accounts"))if(a.kind==="income"&&J.incCatOf(a)===c)await J.store.patch("accounts",a.id,{cat:n});toast("Renamed to "+n)}})});
J.act("incDel",el=>{const c=el.dataset.x;const subs=J.all("accounts").filter(a=>a.kind==="income"&&J.incCatOf(a)===c);const others=J.incCats().filter(x=>x!==c);
  J.drawer({title:"Delete category "+c,submit:"Delete category",body:subs.length?`<p>${subs.length} sub-categor${subs.length===1?"y is":"ies are"} in ${esc(c)}. They are kept and moved to:</p>${J.fld("Move them to",J.selO("to",others.map(x=>[x,x]),others[0]))}`:`<p>${esc(c)} has no sub-categories.</p>`,
    onSubmit:async fd=>{if(subs.length&&!fd.to)return "Add another category first.";for(const a of subs)await J.store.patch("accounts",a.id,{cat:fd.to});await saveInc(others);toast("Category "+c+" deleted")}})});
J.act("incUp",async el=>{const c=el.dataset.x;const l=J.incCats().slice();const i=l.indexOf(c);if(i>0){[l[i-1],l[i]]=[l[i],l[i-1]];await J.safe(()=>saveInc(l))}});
J.act("incMove",async el=>{await J.safe(()=>J.store.patch("accounts",el.dataset.x,{cat:el.value}),J.accName(el.dataset.x)+" moved to "+el.value)});
J.act("incSub",el=>{const cat=el.dataset.x;J.accDrawer(null,"income",{title:"New sub-category under "+cat,after:async id=>{const a=getA(id);if(!a?.cat)await J.store.patch("accounts",id,{cat});toast("Sub-category added")}});setTimeout(()=>{const s=document.getElementById("f-cat");if(s)s.value=cat},60)});
{const acc=J.MODS.find(m=>m.id==="accounts");const t=acc?.tabs.find(x=>x[0]==="cats");if(t){const orig=t[2];t[2]=()=>orig()+incSection();J.vCats=t[2]}}

// ---------- report: micro-categories & budget ----------
function crunch(){const fy=J.fyOf(today());const months=J.monthsBetween(fy.start.slice(0,7),today().slice(0,7));const M={};
  for(const v of J.D?.vs||J.all("vouchers")){if(v.date<fy.start||v.date>today())continue;const m=v.date.slice(0,7);for(const l of arr(v.lines)){const a=getA(l.a);if(!a||(a.kind!=="expense"&&a.kind!=="income"))continue;const amt=a.kind==="expense"?r2((+l.dr||0)-(+l.cr||0)):r2((+l.cr||0)-(+l.dr||0));if(!amt)continue;
    const k=l.s&&arr(a.svc).some(c=>c.id===l.s)?l.s:"";const X=(M[a.id]??={});const Y=(X[k]??={});Y[m]=r2((Y[m]||0)+amt)}}
  return {months,M,fy}}
const tot=o=>r2(Object.values(o||{}).reduce((s,x)=>s+x,0));
J.microReport=U=>{const {months,M}=crunch();const kinds=[["expense","Expenses",J.expCats(),J.expCatOf],["income","Income",J.incCats(),J.incCatOf]];const elapsed=months.length;
  const th=`<thead><tr><th>Category › sub-category › micro-category</th>${months.map(m=>`<th class="num">${esc(monthLabel(m))}</th>`).join("")}<th class="num">FY total</th><th class="num">Budget / month</th><th class="num">FY budget</th><th class="num">vs budget</th></tr></thead>`;
  const rowH=(label,ms,bud,lvl,opt={})=>{const t=tot(ms);const fb=bud?bud*elapsed:0;const diff=fb?r2(t-fb):null;const over=diff!=null&&diff>0;
    return `<tr${lvl===0?' style="font-weight:700"':""}><td style="padding-left:${8+lvl*16}px">${opt.btn||esc(label)}</td>${months.map(m=>`<td class="num">${ms[m]?inr.format(ms[m]):'<span class="muted">·</span>'}</td>`).join("")}<td class="num"><b>${t?inr.format(t):"—"}</b></td><td class="num">${bud?inr.format(bud):""}</td><td class="num">${fb?inr.format(fb):""}</td><td class="num" style="${diff==null?"":"color:var(--"+(over===(opt.kind==="expense")?"bad":"ok")+")"}">${diff==null?"":(diff>0?"+":"−")+inr.format(Math.abs(diff))}</td></tr>`};
  const addM=(a,b)=>{for(const [k,v] of Object.entries(b))a[k]=r2((a[k]||0)+v);return a};
  let body="";
  for(const [kind,title,cats,catOf] of kinds){const leds=J.all("accounts").filter(a=>a.kind===kind&&(a.active!==false||M[a.id]));let rows="";let grand={};
    const order=[...cats,...new Set(leds.map(catOf).filter(c=>!cats.includes(c)))];
    for(const c of order){const L=leds.filter(a=>catOf(a)===c).filter(a=>M[a.id]||arr(a.svc).length||true);if(!L.length)continue;const cm={};let cb=0;let sub="";
      for(const a of L.sort((x,y)=>tot(Object.values(M[y.id]||{}).reduce((s,o)=>addM(s,o),{}))-tot(Object.values(M[x.id]||{}).reduce((s,o)=>addM(s,o),{}))||x.name.localeCompare(y.name))){const X=M[a.id]||{};const am={};for(const o of Object.values(X))addM(am,o);addM(cm,am);
        const micros=arr(a.svc).filter(m=>m.active!==false||X[m.id]);const lb=micros.reduce((s,m)=>s+(+m.budget||0),0);cb+=lb;
        sub+=rowH(a.name,am,lb,1,{kind,btn:`<button class="linkbtn" data-a="openLedger" data-x="${a.id}">${esc(a.name)}</button> <button class="btn small" data-a="svcEdit" data-x="${a.id}">${micros.length?"Micro-categories ("+micros.length+")":"+ Micro-category"}</button>`});
        for(const m of micros)sub+=rowH(m.name,X[m.id]||{},+m.budget||0,2,{kind});
        const un=X[""];if(un&&micros.length)sub+=rowH("Not tagged to a micro-category",un,0,2,{kind})}
      addM(grand,cm);rows+=rowH(c,cm,cb,0,{kind})+sub}
    body+=`<section class="panel"><h2 style="padding:10px 12px">${title} <span class="muted" style="font-weight:400">· FY to date ${money0(tot(grand))}</span></h2><div class="tbl-wrap"><table class="t">${th}<tbody>${rows||`<tr><td class="muted" colspan="${months.length+5}">Nothing booked yet.</td></tr>`}</tbody></table></div></section>`}
  return `<div class="filters"><button class="btn" data-a="microCsv">Export CSV</button></div>
   <p class="hint" style="margin-top:0">Three levels: category › sub-category (ledger) › micro-category. Tag a micro-category on any expense, purchase or sale entry (“Micro-category” picker; “＋ Add micro-category…” creates one on the spot), then watch it month by month. Set a monthly budget on a micro-category (Micro-categories button) and it is compared with the actual here — over-budget expenses show in red.</p>${body}`};
J.act("microCsv",()=>{const {months,M}=crunch();const rows=[["Type","Category","Sub-category","Micro-category",...months,"FY total","Monthly budget"]];
  for(const a of J.all("accounts").filter(a=>a.kind==="expense"||a.kind==="income")){const X=M[a.id];if(!X)continue;const catOf=a.kind==="expense"?J.expCatOf:J.incCatOf;for(const [k,o] of Object.entries(X)){const m=arr(a.svc).find(c=>c.id===k);rows.push([a.kind,catOf(a),a.name,m?m.name:"(not tagged)",...months.map(x=>o[x]||0),tot(o),m?.budget||""])}}
  J.saveFile("micro-categories-"+today()+".csv",J.toCSV(rows))});
})();
