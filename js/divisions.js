/* Divisions — every ledger belongs to JCGG (business), Personal (MKJ) or Personal (Family).
   Accounts → Divisions sets it for many ledgers at once (search by word, tick, choose the division).
   Who may see each division is set in Settings → Users & roles. Unset ledgers follow the old rule (personal flag / MKJ account holder). */
(()=>{
const J=window.J,{S,esc,toast}=J;
const SEL=new Set();const KINDS=["income","expense","bank","card","wallet","cash"];
const KL={income:"Income",expense:"Expense",bank:"Bank",card:"Card",wallet:"Wallet",cash:"Cash"};
const words=q=>String(q||"").toLowerCase().split(/\s+/).filter(Boolean);
function list(){const U=J.ui("div",{q:"",k:"",d:""});const w=words(U.q);
  return J.allRaw("accounts").filter(a=>KINDS.includes(a.kind)&&(!U.k||a.kind===U.k)&&(!U.d||J.divOf(a)===U.d)&&w.every(x=>(a.name+" "+(a.holder||"")).toLowerCase().includes(x))).sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name))}
function vDiv(){if(!S.me.owner&&J.myRole()!=="Super Admin")return '<p class="hint">Only the Super Admin sets divisions.</p>';
  const U=J.ui("div",{q:"",k:"",d:""});const L=list();const cnt={};for(const a of J.allRaw("accounts")){if(KINDS.includes(a.kind)){const d=J.divOf(a);cnt[d]=(cnt[d]||0)+1}}
  const opt=(v,l,c)=>`<option value="${v}" ${c===v?"selected":""}>${l}</option>`;
  const n=L.filter(a=>SEL.has(a.id)).length;
  return `<p class="hint" style="margin-top:0">Choose the division of each income, expense, bank, card, wallet and cash ledger. Search by any word, tick the ledgers (or Tick all shown) and set the division in one go. Who can see each division: Settings → Users &amp; roles.</p>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">${J.DIVS.map(([d,l])=>`<span class="chip plain">${l}: <b>${cnt[d]||0}</b></span>`).join("")}</div>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input data-ui="div.q" value="${esc(U.q)}" placeholder="Search by word…" style="max-width:220px" aria-label="Search ledgers">
   <select data-ui="div.k"><option value="">All types</option>${KINDS.map(k=>opt(k,KL[k],U.k)).join("")}</select>
   <select data-ui="div.d"><option value="">All divisions</option>${J.DIVS.map(([d,l])=>opt(d,l,U.d)).join("")}</select>
   <button class="btn small" data-a="divAll">Tick all ${L.length} shown</button><button class="btn small" data-a="divNone">Clear</button></div>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><b>${n} ticked →</b>${J.DIVS.map(([d,l])=>`<button class="btn small w" data-a="divSet" data-x="${d}" ${n?"":"disabled"}>${l}</button>`).join("")}</div>
  <div class="tbl-wrap"><table class="fit"><thead><tr><th></th><th>Ledger</th><th>Type</th><th>Holder</th><th>Division</th></tr></thead><tbody>${L.map(a=>`<tr><td><input type="checkbox" data-ach="divTick" data-x="${a.id}" ${SEL.has(a.id)?"checked":""}></td><td>${esc(a.name)}</td><td>${KL[a.kind]}</td><td>${esc(a.holder||a.owner||"")}</td><td>${esc(J.DIVS.find(d=>d[0]===J.divOf(a))[1])}${a.div?"":' <span class="hint">(auto)</span>'}</td></tr>`).join("")||'<tr><td colspan="5" class="muted">Nothing matches.</td></tr>'}</tbody></table></div>`}
J.act("divTick",el=>{el.checked?SEL.add(el.dataset.x):SEL.delete(el.dataset.x);J.render()});
J.act("divAll",()=>{list().forEach(a=>SEL.add(a.id));J.render()});
J.act("divNone",()=>{SEL.clear();J.render()});
J.act("divSet",async el=>{const d=el.dataset.x,ids=[...SEL];if(!ids.length)return;J.busy.start("Setting division",ids.length,"ledgers");
  await J.safe(async()=>{for(const id of ids){await J.store.patch("accounts",id,{div:d});J.busy.tick()}},ids.length+" ledger"+(ids.length===1?"":"s")+" set to "+J.DIVS.find(x=>x[0]===d)[1]);J.busy.end();SEL.clear();J.render()});
const acc=J.MODS.find(m=>m.id==="accounts");if(acc){const i=acc.tabs.findIndex(t=>t[0]==="dups");acc.tabs.splice(i<0?acc.tabs.length:i+1,0,["divisions","Divisions",vDiv])}
})();
