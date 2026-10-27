/* Expense categories and sub-categories.
   A category (Rent, Electricity, Maintenance, Telecom & Internet, Gas & Fuels, Groceries…) groups expense ledgers;
   each expense ledger is one sub-category (field `cat` on the ledger). Reports → Expenses by category totals
   category › sub-category and shows which vendors / payees and which bank, cash or card paid.
   Also: Hyperpure payments are grocery purchases (Kitchen Purchases, vendor Zomato Hyperpure) — any that an older
   statement import put on Zomato Settlement (which is for sales settlements) are moved automatically. */
(()=>{
const J=window.J,{S,esc,inr,money0,r2,fmtDate,monthLabel,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const CATS=[
  ["Groceries",/purch|raw material|grocer|vegetable|fruit|dairy|paneer|provision|spice|meat|fish|egg|beverage|bakery/i,
    [["exp-grc-veg","Vegetables & fruits"],["exp-grc-dairy","Dairy & paneer"],["exp-grc-prov","Provisions, spices & oil"],["exp-grc-bev","Beverages & bakery"]]],
  ["Rent",/\brent\b/i,[["exp-rent-store","Rent — Godown / storage"],["exp-rent-staff","Rent — Staff accommodation"]]],
  ["Electricity",/electric|cesc|power|wbsedcl/i,[["exp-pow-sub","Electricity — Sub-meter / landlord share"]]],
  ["Maintenance",/repair|mainten|pest|clean|housekeep|\bamc\b|plumb/i,[["exp-mnt-bldg","Building & society maintenance"],["exp-mnt-amc","Equipment service & AMC"]]],
  ["Telecom & Internet",/telecom|internet|broadband|wi-?fi|mobile|recharge/i,[["exp-tel-mob","Mobile recharge"],["exp-tel-net","Broadband / Wi-Fi"]]],
  ["Subscriptions",/subscri|software|licen[cs]e|membership|netflix|spotify|prime|workspace|domain|hosting/i,[["exp-tel-soft","Software & POS (Petpooja)"],["exp-sub-listing","Online listing & ads (Zomato / Swiggy / Google)"],["exp-sub-cloud","Cloud, email & website (Google Workspace, domain)"],["exp-sub-music","Music & streaming licences"],["exp-sub-member","Memberships & trade licences"]]],
  ["Gas & Fuels",/\bgas\b|lpg|fuel|petrol|diesel|charcoal|coal|firewood/i,[["exp-fuel-petrol","Petrol & diesel"],["exp-fuel-coal","Charcoal & firewood"]]],
  ["Staff costs",/salary|wage|overtime|perk|bonus|welfare|staff meal|late|penalt/i,[]],
  ["Packaging & consumables",/packag|tissue|disposable|consumable/i,[]],
  ["Marketing",/marketing|promotion|advert/i,[]],
  ["Bank & finance charges",/charge|fee|interest|returns paid/i,[]],
  ["Other",/misc/i,[]]];
const DEF=CATS.map(c=>c[0]);
// the category list is the owner's: meta/cats.exp (add, rename, reorder, delete); defaults until first saved
J.expCats=()=>{const own=arr(J.get("meta","cats")?.exp);const base=own.length?own:DEF;const extra=[...new Set(J.all("accounts").filter(a=>a.kind==="expense"&&a.cat&&!base.includes(a.cat)).map(a=>a.cat))];return [...base,...extra]};
Object.defineProperty(J,"EXP_CATS",{get:()=>J.expCats(),configurable:true});
J.EXP_CAT_ORDER=c=>{const i=J.expCats().indexOf(c);return i<0?99:i};
const guess=a=>{for(const [c,re] of CATS)if(re.test(a.name))return c;if(a.sys==="purch"||a.sys==="cogs")return "Groceries";if(["salary","ot","perks","salded"].includes(a.sys))return "Staff costs";return ""};
J.expCatOf=a=>a?.cat||(a?.cat===""?"Uncategorised":guess(a||{})||"Other");

// ---------- owner / admin session: categorise ledgers, add the suggested sub-categories, fix Hyperpure postings ----------
let busy=false;
async function upkeep(){if(busy||!S.ready||S.mode!=="cloud"||J.readOnly?.()||J.limited?.()||J.isCC?.())return;if(!(S.me.owner||["Super Admin","Admin"].includes(J.myRole?.())))return;busy=true;
  try{const done=J.get("meta","expcat")?.v||0;
    for(const a of J.all("accounts"))if(a.kind==="expense"&&a.cat===undefined){const c=guess(a);if(c)await J.store.patch("accounts",a.id,{cat:c})}
    if(done<1){
      for(const [cat,,subs] of CATS)for(const [id,name] of subs)if(!J.get("accounts",id)&&!J.all("accounts").some(x=>x.name.toLowerCase()===name.toLowerCase()))await J.store.put("accounts",{id,name,kind:"expense",cat,opening:0,active:true});
      await J.store.put("meta",{id:"expcat",v:1,at:Date.now(),by:S.me.email})}
    if((J.get("meta","expcat")?.v||0)<2){const sub=CATS.find(c=>c[0]==="Subscriptions");
      for(const [id,name] of sub[2]){const ex=J.get("accounts",id);if(ex){if(ex.cat!=="Subscriptions")await J.store.patch("accounts",id,{cat:"Subscriptions",name:ex.name==="Software & POS subscriptions"?name:ex.name})}else if(!J.all("accounts").some(x=>x.name.toLowerCase()===name.toLowerCase()))await J.store.put("accounts",{id,name,kind:"expense",cat:"Subscriptions",opening:0,active:true})}
      if(!J.get("meta","cats"))await J.store.put("meta",{id:"cats",exp:DEF,money:{},at:Date.now()});else if(!arr(J.get("meta","cats").exp).includes("Subscriptions")){const l=arr(J.get("meta","cats").exp).slice();l.splice(Math.max(0,l.indexOf("Gas & Fuels")+1),0,"Subscriptions");await J.store.patch("meta","cats",{exp:l})}
      await J.store.put("meta",{id:"expcat",v:2,at:Date.now(),by:S.me.email})}
    // Hyperpure payments booked to Zomato Settlement → grocery purchases with the Hyperpure vendor as party
    const zs=J.all("accounts").filter(a=>a.kind==="aggregator"&&/zomato/i.test(a.name)).map(a=>a.id);const pu=J.sysAcc("purch")?.id;let moved=0;
    if(zs.length&&pu){const vs=J.all("vouchers").filter(v=>/hyperpu|zomato internet/i.test(v.narr||"")&&arr(v.lines).some(l=>zs.includes(l.a)&&+l.dr>0)&&arr(v.lines).some(l=>J.MONEY.includes(J.get("accounts",l.a)?.kind)&&+l.cr>0));
      if(vs.length){const hp=J.all("accounts").find(a=>a.kind==="vendor"&&/hyperpure/i.test(a.name))?.id||await J.ensureAcc("Zomato Hyperpure","vendor");
        for(const v of vs){await J.postVoucher({...v,id:v.id,type:v.type==="receipt"?v.type:"expense",lines:v.lines.map(l=>zs.includes(l.a)&&+l.dr>0?{...l,a:pu}:l),party:hp,narr:(v.narr||"")+" [Hyperpure grocery purchase — moved from Zomato Settlement]"});moved++}
        await J.store.put("meta",{id:"hpfix",at:Date.now(),n:moved+(J.get("meta","hpfix")?.n||0),by:S.me.email});setTimeout(()=>J.billsReconcile?.(),1500)}}
    if(moved)toast(moved+" Hyperpure payment"+(moved===1?"":"s")+" moved from Zomato Settlement to grocery purchases")}
  catch(e){console.warn("expcat upkeep",e)}finally{busy=false}}
J.onDerive?.(()=>setTimeout(upkeep,4000));

// ---------- report ----------
const viaName=v=>{const m=arr(v.lines).filter(l=>J.MONEY.includes(J.get("accounts",l.a)?.kind)&&+l.cr>0).map(l=>J.accName(l.a));if(m.length)return [...new Set(m)].join(" + ");
  const p=J.get("accounts",v.party);if(p?.kind==="vendor")return "On credit — "+p.name;if(p?.kind==="staff"||p?.kind==="staffadv")return "Staff account";return v.type==="salary"?"Payroll":"Journal / adjustment"};
const payee=(v,l)=>{const p=J.get("accounts",v.party);if(p&&!["income","expense"].includes(p.kind)&&!J.MONEY.includes(p.kind))return p.name.replace(/ — capital$/i,"");
  const n=(l.n||arr(v.lines).find(x=>x.n)?.n||"").split(" · ");if(n.length>1&&/^(UPI|NEFT|IMPS|RTGS|CHRG|POS|ATM)/i.test(n[0]))return n[1];
  const m=/UPI\/([^/]+)\//i.exec(v.narr||"")||/(?:NEFT|IMPS)\/\s*([^/]+)\//i.exec(v.narr||"");return m?m[1].trim().replace(/\b\w/g,c=>c.toUpperCase()):"—"};
function crunch(from,to){const R={};let total=0;
  for(const v of J.D?.vs||J.all("vouchers")){if(v.date<from||v.date>to)continue;for(const l of arr(v.lines)){const a=J.get("accounts",l.a);if(a?.kind!=="expense")continue;const amt=r2((+l.dr||0)-(+l.cr||0));if(!amt)continue;
    const c=J.expCatOf(a);const C=(R[c]??={tot:0,subs:{},m:{}});const s=(C.subs[a.id]??={tot:0,pay:{},via:{},n:0,svc:{}});{const sv=l.s&&J.svcById?.(l.s);const k=sv?sv.name:(arr(a.svc).length?"untagged":"");if(k)s.svc[k]=r2((s.svc[k]||0)+amt)}
    C.tot=r2(C.tot+amt);s.tot=r2(s.tot+amt);s.n++;C.m[v.m||v.date.slice(0,7)]=r2((C.m[v.m||v.date.slice(0,7)]||0)+amt);const p=payee(v,l),w=viaName(v);s.pay[p]=r2((s.pay[p]||0)+amt);s.via[w]=r2((s.via[w]||0)+amt);total=r2(total+amt)}}
  return {R,total}}
J.expCatCrunch=crunch;
const top=(o,n=4)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
J.expCatReport=U=>{const [from,to]=J.periodRange(U.period,U);const {R,total}=crunch(from,to);const cats=Object.keys(R).sort((a,b)=>R[b].tot-R[a].tot);const mx=Math.max(1,...cats.map(c=>R[c].tot));
  const months=[...new Set(cats.flatMap(c=>Object.keys(R[c].m)))].sort();
  return `<div class="filters">${J.periodSeg("acc.report",U.period,U)}<button class="btn" data-a="expCatCsv">Export CSV</button></div>
  <p class="hint" style="margin-top:0">Each expense ledger is a sub-category of a category. Totals include everything booked to the ledger — bank, cash, card, credit bills and payroll. Set or change a ledger's category in its ledger form; add sub-categories with “+ Sub-category”.</p>
  <section class="panel"><h2>By category · ${fmtDate(from)} – ${fmtDate(to)}</h2><div class="pb">${cats.length?`<div class="bars">${cats.map(c=>`<div class="bar"><span><a href="#cat-${esc(c.replace(/\W+/g,"-"))}">${esc(c)}</a></span><span class="num">${money0(R[c].tot)} <span class="muted">${total?(R[c].tot/total*100).toFixed(1):0}%</span></span><i><b style="width:${(Math.max(0,R[c].tot)/mx*100).toFixed(1)}%"></b></i></div>`).join("")}</div><div class="row" style="justify-content:space-between;margin-top:8px"><b>Total expenses</b><b class="num">${money0(total)}</b></div>`:`<p class="muted">No expenses in this period.</p>`}</div></section>
  ${months.length>1?`<section class="panel"><h2>Month by month</h2><div class="tbl-wrap"><table><thead><tr><th>Category</th>${months.map(m=>`<th class="num">${esc(monthLabel(m))}</th>`).join("")}<th class="num">Total</th></tr></thead><tbody>${cats.map(c=>`<tr><td>${esc(c)}</td>${months.map(m=>`<td class="num">${R[c].m[m]?inr.format(Math.round(R[c].m[m])):""}</td>`).join("")}<td class="num"><b>${inr.format(Math.round(R[c].tot))}</b></td></tr>`).join("")}</tbody></table></div></section>`:""}
  ${J.expCats().filter(c=>R[c]||J.all("accounts").some(a=>a.kind==="expense"&&a.active!==false&&J.expCatOf(a)===c)).concat(cats.filter(c=>!J.expCats().includes(c))).map(c=>{const C=R[c]||{tot:0,subs:{}};const ledgers=J.all("accounts").filter(a=>a.kind==="expense"&&a.active!==false&&J.expCatOf(a)===c);const ids=[...new Set([...Object.keys(C.subs),...ledgers.map(a=>a.id)])].sort((a,b)=>(C.subs[b]?.tot||0)-(C.subs[a]?.tot||0));
    return `<section class="panel" id="cat-${esc(c.replace(/\W+/g,"-"))}"><div class="row" style="justify-content:space-between;padding:10px 12px"><h2 style="padding:0">${esc(c)} <span class="muted" style="font-weight:400">${money0(C.tot)}</span></h2><span class="row" style="gap:6px"><label class="row hint" style="gap:4px"><input type="checkbox" data-a="catPers" data-x="${esc(c)}" ${J.personalCats().includes(c)?"checked":""}> Personal</label><button class="btn small w" data-a="expSubNew" data-x="${esc(c)}">+ Sub-category</button></div></span></div>
    <div class="tbl-wrap"><table><thead><tr><th>Sub-category</th><th class="num">Amount</th><th>Vendors / payees</th><th>Paid via</th></tr></thead><tbody>${ids.map(id=>{const s=C.subs[id];return `<tr><td><button class="linkbtn" data-a="openLedger" data-x="${id}">${esc(J.accName(id))}</button> <button class="linkbtn muted" data-a="editAcc" data-x="${id}" aria-label="Edit ledger">edit</button></td><td class="num">${s?inr.format(s.tot):'<span class="muted">—</span>'}</td><td>${s&&Object.keys(s.svc).length?`<div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:4px">${top(s.svc,12).map(([p,v])=>`<span class="chip ${p==="untagged"?"warn":"ok"}">${esc(p)} ${money0(v)}</span>`).join(" ")}</div>`:""}${s?top(s.pay).map(([p,v])=>`<span class="chip plain">${esc(p)} ${money0(v)}</span>`).join(" "):""}</td><td>${s?top(s.via,3).map(([p,v])=>`<span class="chip plain">${esc(p)} ${money0(v)}</span>`).join(" "):""}</td></tr>`}).join("")||`<tr><td colspan="4" class="muted">No sub-categories yet.</td></tr>`}</tbody></table></div></section>`}).join("")}`};
J.act("expSubNew",el=>{const cat=el.dataset.x;J.accDrawer(null,"expense",{title:"New sub-category under "+cat,after:async id=>{await J.store.patch("accounts",id,{cat});toast("Sub-category added under "+cat)}});setTimeout(()=>{const s=document.getElementById("f-cat");if(s)s.value=cat;const b=document.getElementById("catBox");if(b)b.style.display=""},60)});
J.act("expCatCsv",()=>{const U=J.ui("acc.report");const [from,to]=J.periodRange(U.period,U);const {R}=crunch(from,to);const rows=[["Category","Sub-category","Amount","Top payees","Paid via"]];
  for(const [c,C] of Object.entries(R))for(const [id,s] of Object.entries(C.subs))rows.push([c,J.accName(id),s.tot,top(s.pay,6).map(([p,v])=>p+" "+v).join("; "),top(s.via,4).map(([p,v])=>p+" "+v).join("; ")]);
  J.saveFile("expenses-by-category-"+from+"-to-"+to+".csv",J.toCSV(rows))});
// ---------- Categories manager (Accounts → Categories) ----------
const MONEY_G=[["bank","Banks","+ Bank account"],["card","Credit cards","+ Credit card"],["wallet","Wallets","+ Wallet"],["cash","Cash","+ Cash box"],["aggregator","Settlements & UPI apps","+ Settlement / UPI app"]];
const gName=k=>J.get("meta","cats")?.money?.[k]||MONEY_G.find(g=>g[0]===k)?.[1]||k;
const saveCats=J.saveCats=async patch=>{const cur=J.get("meta","cats");if(cur)await J.store.patch("meta","cats",patch);else await J.store.put("meta",{id:"cats",exp:J.expCatsAll(),money:{},...patch})};
function vCats(){const fy=J.fyOf(J.today());const from=fy.start,to=J.today();const {R}=crunch(from,to);const adm=!J.readOnly();
  const accRow=a=>{const b=J.balanceOf(a.id);const det=[a.bankName,a.bankAc&&("A/c "+a.bankAc),a.ifsc,a.upi].filter(Boolean).join(" · ");
    return `<tr><td><button class="linkbtn" data-a="openLedger" data-x="${a.id}">${esc(a.name)}</button>${a.active===false?' <span class="chip plain">inactive</span>':""}${det?`<div class="hint">${esc(det)}</div>`:""}</td><td class="num">${J.bal(b)}</td><td style="white-space:nowrap;text-align:right">${adm?`<button class="btn small" data-a="editAcc" data-x="${a.id}">Edit</button> ${J.delBtn("accounts",a.id)}`:""}</td></tr>`};
  const money=MONEY_G.map(([k,,add])=>{const list=J.all("accounts").filter(a=>a.kind===k).sort((a,b)=>(b.active!==false)-(a.active!==false)||a.name.localeCompare(b.name));
    return `<section class="panel"><div class="row" style="justify-content:space-between;padding:10px 12px;flex-wrap:wrap;gap:6px"><h2 style="padding:0">${esc(gName(k))} <span class="muted" style="font-weight:400">${list.length} · ${J.bal(list.reduce((s,a)=>s+J.balanceOf(a.id),0))}</span></h2><div class="row" style="gap:6px">${adm?`<button class="btn small" data-a="catMoneyRen" data-x="${k}">Rename</button><button class="btn small primary w" data-a="catAddAcc" data-x="${k}">${esc(add)}</button>`:""}</div></div>
    <div class="tbl-wrap"><table><tbody>${list.map(accRow).join("")||`<tr><td class="muted">None yet.</td></tr>`}</tbody></table></div></section>`}).join("");
  const cats=J.expCats();const exp=J.all("accounts").filter(a=>a.kind==="expense");const unc=exp.filter(a=>J.expCatOf(a)==="Uncategorised");
  const catSel=(a)=>`<select data-ach="catMove" data-x="${a.id}" aria-label="Move ${esc(a.name)} to category" ${adm?"":"disabled"}>${[...cats,...(J.expCatOf(a)==="Uncategorised"?["Uncategorised"]:[])].map(c=>`<option ${c===J.expCatOf(a)?"selected":""}>${esc(c)}</option>`).join("")}</select>`;
  const expSec=c=>{const list=exp.filter(a=>J.expCatOf(a)===c).sort((a,b)=>(R[c]?.subs[b.id]?.tot||0)-(R[c]?.subs[a.id]?.tot||0)||a.name.localeCompare(b.name));const i=cats.indexOf(c);
    return `<section class="panel"><div class="row" style="justify-content:space-between;padding:10px 12px;flex-wrap:wrap;gap:6px"><h2 style="padding:0">${esc(c)} <span class="muted" style="font-weight:400">${list.length} sub-categor${list.length===1?"y":"ies"} · ${money0(R[c]?.tot||0)} this FY</span></h2>
      ${adm&&c!=="Uncategorised"?`<div class="row" style="gap:6px"><button class="btn small" data-a="catUp" data-x="${esc(c)}" ${i<=0?"disabled":""} aria-label="Move up">↑</button><button class="btn small" data-a="catRen" data-x="${esc(c)}">Rename</button><button class="btn small danger" data-a="catDel" data-x="${esc(c)}">Delete</button><button class="btn small primary w" data-a="expSubNew" data-x="${esc(c)}">+ Sub-category</button></div>`:""}</div>
      <div class="tbl-wrap"><table><thead><tr><th>Sub-category</th><th class="num">This FY</th><th>Category</th><th></th></tr></thead><tbody>${list.map(a=>`<tr><td><button class="linkbtn" data-a="openLedger" data-x="${a.id}">${esc(a.name)}</button>${a.active===false?' <span class="chip plain">inactive</span>':""}</td><td class="num">${R[c]?.subs[a.id]?inr.format(R[c].subs[a.id].tot):'<span class="muted">—</span>'}</td><td>${catSel(a)}</td><td style="white-space:nowrap;text-align:right">${adm?`<button class="btn small" data-a="svcEdit" data-x="${a.id}" title="Meters, phone numbers, broadband IDs, buildings…">Connections${arr(a.svc).length?" ("+arr(a.svc).length+")":""}</button> <button class="btn small" data-a="editAcc" data-x="${a.id}">Edit</button> ${J.delBtn("accounts",a.id)}`:""}</td></tr>`).join("")||`<tr><td colspan="4" class="muted">No sub-categories yet.</td></tr>`}</tbody></table></div></section>`};
  return `<p class="hint" style="margin-top:0">Every ledger sits in a category. Money accounts are grouped by type (banks, credit cards, wallets, cash, settlements); expense ledgers are sub-categories of your expense categories. Add, rename, move and delete here. A ledger that already has entries can't be deleted — mark it inactive (Edit) or move its entries first.</p>
  <h2 class="ph" style="padding:6px 0">Money accounts</h2>${money}
  <div class="row" style="justify-content:space-between;align-items:center;margin-top:14px"><h2 class="ph" style="padding:6px 0">Expense categories</h2>${adm?`<button class="btn primary w" data-a="catNew">+ New category</button>`:""}</div>
  ${cats.map(expSec).join("")}${unc.length?expSec("Uncategorised"):""}`}
J.act("catAddAcc",el=>J.accDrawer(null,el.dataset.x,{title:"New — "+gName(el.dataset.x)}));
J.act("catMoneyRen",el=>{const k=el.dataset.x;J.drawer({title:"Rename group",submit:"Save",body:J.fld("Group name",J.txt("name",gName(k))),onSubmit:async fd=>{const n=fd.name.trim();if(!n)return "Give it a name.";await saveCats({money:{...(J.get("meta","cats")?.money||{}),[k]:n}});toast("Renamed")}})});
J.act("catNew",()=>J.drawer({title:"New expense category",submit:"Create",body:J.fld("Category name",J.txt("name","","e.g. Subscriptions"))+`<p class="hint">Then add its sub-categories with “+ Sub-category”.</p>`,onSubmit:async fd=>{const n=fd.name.trim();if(!n)return "Give it a name.";if(J.expCatsAll().some(c=>c.toLowerCase()===n.toLowerCase()))return "That category already exists.";await saveCats({exp:[...J.expCatsAll(),n]});toast("Category "+n+" added")}}));
J.act("catRen",el=>{const c=el.dataset.x;J.drawer({title:"Rename category",submit:"Save",body:J.fld("Category name",J.txt("name",c)),onSubmit:async fd=>{const n=fd.name.trim();if(!n)return "Give it a name.";if(n!==c&&J.expCatsAll().some(x=>x.toLowerCase()===n.toLowerCase()))return "That category already exists.";
  await saveCats({exp:J.expCatsAll().map(x=>x===c?n:x),personal:J.personalCats().map(x=>x===c?n:x)});for(const a of J.all("accounts"))if(a.kind==="expense"&&J.expCatOf(a)===c)await J.store.patch("accounts",a.id,{cat:n});toast("Renamed to "+n)}})});
J.act("catDel",el=>{const c=el.dataset.x;const subs=J.all("accounts").filter(a=>a.kind==="expense"&&J.expCatOf(a)===c);const others=J.expCatsAll().filter(x=>x!==c);
  J.drawer({title:"Delete category "+c,submit:"Delete category",body:subs.length?`<p>${subs.length} sub-categor${subs.length===1?"y is":"ies are"} in ${esc(c)}. They are kept and moved to:</p>${J.fld("Move them to",J.selO("to",others.map(x=>[x,x]),others.includes("Other")?"Other":others[0]))}`:`<p>${esc(c)} has no sub-categories. Delete it?</p>`,
    onSubmit:async fd=>{for(const a of subs)await J.store.patch("accounts",a.id,{cat:fd.to});await saveCats({exp:others});toast("Category "+c+" deleted"+(subs.length?" — sub-categories moved to "+fd.to:""))}})});
J.act("catPers",async el=>{const c=el.dataset.x;const cur=J.personalCats();const next=el.checked?[...new Set([...cur,c])]:cur.filter(x=>x!==c);await J.safe(()=>saveCats({personal:next}),c+(el.checked?" is now personal — hidden from JCGG logins":" is no longer personal"))});
J.act("catUp",async el=>{const c=el.dataset.x;const l=J.expCatsAll().slice();const i=l.indexOf(c);if(i>0){[l[i-1],l[i]]=[l[i],l[i-1]];await J.safe(()=>saveCats({exp:l}))}});
J.act("catMove",async el=>{await J.safe(()=>J.store.patch("accounts",el.dataset.x,{cat:el.value}),J.accName(el.dataset.x)+" moved to "+el.value)});
J.vCats=vCats;
{const acc=J.MODS.find(m=>m.id==="accounts");if(acc){const i=acc.tabs.findIndex(t=>t[0]==="reports");acc.tabs.splice(i,0,["cats","Categories",vCats])}}

})();
