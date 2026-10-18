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
  ["Telecom & Internet",/telecom|internet|broadband|wi-?fi|mobile|recharge|software|subscription/i,[["exp-tel-mob","Mobile recharge"],["exp-tel-net","Broadband / Wi-Fi"],["exp-tel-soft","Software & POS subscriptions"]]],
  ["Gas & Fuels",/\bgas\b|lpg|fuel|petrol|diesel|charcoal|coal|firewood/i,[["exp-fuel-petrol","Petrol & diesel"],["exp-fuel-coal","Charcoal & firewood"]]],
  ["Staff costs",/salary|wage|overtime|perk|bonus|welfare|staff meal|late|penalt/i,[]],
  ["Packaging & consumables",/packag|tissue|disposable|consumable/i,[]],
  ["Marketing",/marketing|promotion|advert/i,[]],
  ["Bank & finance charges",/charge|fee|interest|returns paid/i,[]],
  ["Other",/misc/i,[]]];
J.EXP_CATS=CATS.map(c=>c[0]);
J.EXP_CAT_ORDER=c=>{const i=J.EXP_CATS.indexOf(c);return i<0?99:i};
const guess=a=>{for(const [c,re] of CATS)if(re.test(a.name))return c;if(a.sys==="purch"||a.sys==="cogs")return "Groceries";if(["salary","ot","perks","salded"].includes(a.sys))return "Staff costs";return ""};
J.expCatOf=a=>a?.cat||guess(a||{})||"Other";

// ---------- owner / admin session: categorise ledgers, add the suggested sub-categories, fix Hyperpure postings ----------
let busy=false;
async function upkeep(){if(busy||!S.ready||S.mode!=="cloud"||J.readOnly?.()||J.limited?.()||J.isCC?.())return;if(!(S.me.owner||["Super Admin","Admin"].includes(J.myRole?.())))return;busy=true;
  try{const done=J.get("meta","expcat")?.v||0;
    for(const a of J.all("accounts"))if(a.kind==="expense"&&a.cat===undefined){const c=guess(a);if(c)await J.store.patch("accounts",a.id,{cat:c})}
    if(done<1){
      for(const [cat,,subs] of CATS)for(const [id,name] of subs)if(!J.get("accounts",id)&&!J.all("accounts").some(x=>x.name.toLowerCase()===name.toLowerCase()))await J.store.put("accounts",{id,name,kind:"expense",cat,opening:0,active:true});
      await J.store.put("meta",{id:"expcat",v:1,at:Date.now(),by:S.me.email})}
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
    const c=J.expCatOf(a);const C=(R[c]??={tot:0,subs:{},m:{}});const s=(C.subs[a.id]??={tot:0,pay:{},via:{},n:0});
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
  ${J.EXP_CATS.filter(c=>R[c]||CATS.find(x=>x[0]===c)[2].length).concat(cats.filter(c=>!J.EXP_CATS.includes(c))).map(c=>{const C=R[c]||{tot:0,subs:{}};const ledgers=J.all("accounts").filter(a=>a.kind==="expense"&&a.active!==false&&J.expCatOf(a)===c);const ids=[...new Set([...Object.keys(C.subs),...ledgers.map(a=>a.id)])].sort((a,b)=>(C.subs[b]?.tot||0)-(C.subs[a]?.tot||0));
    return `<section class="panel" id="cat-${esc(c.replace(/\W+/g,"-"))}"><div class="row" style="justify-content:space-between;padding:10px 12px"><h2 style="padding:0">${esc(c)} <span class="muted" style="font-weight:400">${money0(C.tot)}</span></h2><button class="btn small w" data-a="expSubNew" data-x="${esc(c)}">+ Sub-category</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>Sub-category</th><th class="num">Amount</th><th>Vendors / payees</th><th>Paid via</th></tr></thead><tbody>${ids.map(id=>{const s=C.subs[id];return `<tr><td><button class="linkbtn" data-a="openLedger" data-x="${id}">${esc(J.accName(id))}</button> <button class="linkbtn muted" data-a="editAcc" data-x="${id}" aria-label="Edit ledger">edit</button></td><td class="num">${s?inr.format(s.tot):'<span class="muted">—</span>'}</td><td>${s?top(s.pay).map(([p,v])=>`<span class="chip plain">${esc(p)} ${money0(v)}</span>`).join(" "):""}</td><td>${s?top(s.via,3).map(([p,v])=>`<span class="chip plain">${esc(p)} ${money0(v)}</span>`).join(" "):""}</td></tr>`}).join("")||`<tr><td colspan="4" class="muted">No sub-categories yet.</td></tr>`}</tbody></table></div></section>`}).join("")}`};
J.act("expSubNew",el=>{const cat=el.dataset.x;J.accDrawer(null,"expense",{title:"New sub-category under "+cat,after:async id=>{await J.store.patch("accounts",id,{cat});toast("Sub-category added under "+cat)}});setTimeout(()=>{const s=document.getElementById("f-cat");if(s)s.value=cat;const b=document.getElementById("catBox");if(b)b.style.display=""},60)});
J.act("expCatCsv",()=>{const U=J.ui("acc.report");const [from,to]=J.periodRange(U.period,U);const {R}=crunch(from,to);const rows=[["Category","Sub-category","Amount","Top payees","Paid via"]];
  for(const [c,C] of Object.entries(R))for(const [id,s] of Object.entries(C.subs))rows.push([c,J.accName(id),s.tot,top(s.pay,6).map(([p,v])=>p+" "+v).join("; "),top(s.via,4).map(([p,v])=>p+" "+v).join("; ")]);
  J.saveFile("expenses-by-category-"+from+"-to-"+to+".csv",J.toCSV(rows))});
})();
