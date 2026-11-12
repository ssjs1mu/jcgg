/* Home → Bill audit: one row per vendor — when its last bill was uploaded, how many purchases still have no bill file,
   the oldest missing one and the vendor's balance — so pending uploads are easy to spot. Click a vendor for the bill-by-bill list.
   A purchase "has its bill" when its entry carries an attached file or a read bill (Inventory → Bills). Reads only; posts nothing. */
(()=>{
const J=window.J,{S,esc,fmtDate,today,daysBetween}=J;
const inr=x=>"₹"+Number(x).toLocaleString("en-IN",{maximumFractionDigits:2});
function data(from){const bills=new Set(J.all("bills").filter(b=>b.file||b.fileName).map(b=>b.vid).filter(Boolean));
  const vend=J.all("accounts").filter(a=>a.kind==="vendor"&&a.active!==false);const by=new Map(vend.map(a=>[a.id,{a,all:[]}]));
  for(const v of J.all("vouchers")){if(v.type!=="purchase"||!by.has(v.party))continue;if(from&&v.date<from)continue;
    by.get(v.party).all.push({v,amt:J.vAmount(v),has:(v.docs||[]).length>0||bills.has(v.id)})}
  return [...by.values()].map(({a,all})=>{all.sort((x,y)=>x.v.date.localeCompare(y.v.date));const done=all.filter(x=>x.has),miss=all.filter(x=>!x.has);const last=done[done.length-1];
    return {a,all,miss,last,lastAny:all[all.length-1],missAmt:miss.reduce((s,x)=>s+x.amt,0),days:last?daysBetween(last.v.date,today()):null,oldest:miss[0]}})
   .sort((x,y)=>(y.miss.length>0)-(x.miss.length>0)||(x.oldest?.v.date||"9").localeCompare(y.oldest?.v.date||"9")||x.a.name.localeCompare(y.a.name))}
function vAudit(){const fy=J.fyOf(today()).start;const U=J.ui("ba",{q:"",only:false,from:fy});const w=String(U.q||"").toLowerCase().split(/\s+/).filter(Boolean);
  const D=data(U.from).filter(x=>w.every(t=>x.a.name.toLowerCase().includes(t))&&(!U.only||x.miss.length));
  const totMiss=D.reduce((s,x)=>s+x.miss.length,0),totAmt=D.reduce((s,x)=>s+x.missAmt,0),pend=D.filter(x=>x.miss.length).length;
  const chip=x=>!x.all.length?`<span class="chip plain">No purchases</span>`:!x.miss.length?`<span class="chip ok">Up to date</span>`:`<span class="chip ${daysBetween(x.oldest.v.date,today())>30?"bad":"warn"}">${x.miss.length} pending</span>`;
  return `<p class="hint" style="margin-top:0">Per vendor: the last bill uploaded and what is still waiting for a bill file. Click a vendor to see each purchase. Vendors with pending bills are listed first, oldest first.</p>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input data-ui="ba.q" value="${esc(U.q)}" placeholder="Search vendor…" style="max-width:220px" aria-label="Search vendor">${J.fld("Purchases from",`<input type="date" data-ui="ba.from" value="${U.from||fy}">`)}
   <label class="row" style="gap:6px"><input type="checkbox" data-ui="ba.only" ${U.only?"checked":""}> Only vendors with pending bills</label><button class="btn primary w" data-a="billUpload" style="margin-left:auto">Upload bill</button></div>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="chip ${pend?"warn":"ok"}">${pend} vendors pending</span><span class="chip plain">${totMiss} purchases without a bill · ${inr(totAmt)}</span></div>
  <div class="tbl-wrap"><table class="fit"><thead><tr><th>Vendor</th><th>Last bill uploaded</th><th class="r">Days ago</th><th>Last purchase booked</th><th class="r">No bill</th><th>Oldest without bill</th><th class="r">Balance</th><th>Status</th></tr></thead><tbody>
  ${D.map(x=>`<tr class="clk" data-a="baOpen" data-x="${esc(x.a.id)}" tabindex="0"><td><b>${esc(x.a.name)}</b></td><td>${x.last?fmtDate(x.last.v.date)+`<div class="hint">${esc(x.last.v.ref||x.last.v.no||"")}</div>`:"—"}</td><td class="r">${x.days==null?"—":x.days}</td><td>${x.lastAny?fmtDate(x.lastAny.v.date):"—"}</td><td class="r">${x.miss.length?x.miss.length+` · ${inr(x.missAmt)}`:"0"}</td><td>${x.oldest?fmtDate(x.oldest.v.date):"—"}</td><td class="r">${J.bal(J.balanceOf(x.a.id),x.a.kind)}</td><td>${chip(x)}</td></tr>`).join("")||`<tr><td colspan="8" class="hint">No vendors match.</td></tr>`}</tbody></table></div>`}
J.act("baOpen",el=>{const U=J.ui("ba",{});const x=data(U.from).find(d=>d.a.id===el.dataset.x);if(!x)return;
  J.drawer({title:x.a.name+" · bills",wide:true,body:`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="chip ${x.miss.length?"warn":"ok"}">${x.miss.length} without a bill</span><span class="chip plain">${x.all.length-x.miss.length} with a bill</span><button type="button" class="btn small primary w" data-a="billUpload">Upload bill</button></div>
   <div class="tbl-wrap"><table class="fit"><thead><tr><th>Date</th><th>Entry</th><th>Bill / invoice no.</th><th class="r">Amount</th><th>Bill file</th></tr></thead><tbody>${x.all.slice().sort((a,b)=>(a.has-b.has)||b.v.date.localeCompare(a.v.date)).map(r=>`<tr><td>${fmtDate(r.v.date)}</td><td>${esc(r.v.no||"")}</td><td>${esc(r.v.ref||"")}</td><td class="r">${inr(r.amt)}</td><td>${r.has?`<span class="chip ok">uploaded</span>`:`<span class="chip bad">missing</span>`}</td></tr>`).join("")||`<tr><td colspan="5" class="hint">No purchases in this period.</td></tr>`}</tbody></table></div>`})});
{let k=0;const add=()=>{const m=J.MODS.find(x=>x.id==="home");if(m&&m.tabs.some(t=>t[0]==="mis")){if(!m.tabs.some(t=>t[0]==="baudit")){const i=m.tabs.findIndex(t=>t[0]==="mis");m.tabs.splice(i+1,0,["baudit","Bill audit",vAudit])}return}if(++k<40)setTimeout(add,250)};add()}
})();
