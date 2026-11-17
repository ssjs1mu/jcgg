/* Ledger popup: any ledger name in the MIS report opens its statement for the report's period in a popup (date, entry, narration,
   Dr, Cr, running Dr/Cr balance). Reads only; "Open full ledger" jumps to Accounts → Ledgers. */
(()=>{
const J=window.J,{esc,fmtDate,today}=J;
const inr=x=>Number(x).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const r2=x=>Math.round(x*100)/100;
J.ledLink=(id,name,from,to)=>`<button type="button" class="linkbtn" data-a="ledPop" data-x="${esc(id)}|${from||""}|${to||""}">${esc(name)}</button>`;
J.ledAmt=(id,html,from,to,tip)=>id?`<button type="button" class="linkbtn" title="${esc(tip||"Open ledger")}" data-a="ledPop" data-x="${esc(id)}|${from||""}|${to||""}">${html}</button>`:html;
J.ledPop=(id,from,to)=>{const a=J.get("accounts",id);if(!a)return;const fy=J.fyOf(today()).start;from=from||fy;to=to||today();
  const day=J.addDays?J.addDays(from,-1):from;const open=r2(J.balanceOf(id,day));let run=open,tdr=0,tcr=0;
  const rows=(J.D.post?.get(id)||[]).filter(p=>p.date>=from&&p.date<=to).sort((x,y)=>x.date.localeCompare(y.date)).map(p=>{run=r2(run+p.dr-p.cr);tdr+=p.dr;tcr+=p.cr;return {p,run}});
  J.drawer({title:a.name,wide:true,submit:"Close",onSubmit:()=>{},body:`<p class="hint" style="margin:0 0 8px">${fmtDate(from)} – ${fmtDate(to)} · ${rows.length} entries · <button type="button" class="linkbtn" data-a="openLedger" data-x="${esc(id)}">Open full ledger</button></p>
  <div class="tbl-wrap"><table class="sheet"><thead><tr><th>Date</th><th>Entry</th><th>Narration</th><th class="num">Dr</th><th class="num">Cr</th><th class="num">Balance</th></tr></thead><tbody>
  <tr><td colspan="5"><i>Opening balance</i></td><td class="num">${J.bal(open)}</td></tr>
  ${rows.map(({p,run})=>`<tr><td style="white-space:nowrap">${fmtDate(p.date)}</td><td class="mono">${esc(p.v.no||"")}</td><td>${esc((p.v.narr||"").slice(0,90))}</td><td class="num">${p.dr?inr(p.dr):""}</td><td class="num">${p.cr?inr(p.cr):""}</td><td class="num">${J.bal(run)}</td></tr>`).join("")||'<tr><td colspan="6" class="muted">No entries in this period.</td></tr>'}
  </tbody><tfoot><tr><td colspan="3">Total / closing</td><td class="num">${inr(tdr)}</td><td class="num">${inr(tcr)}</td><td class="num">${J.bal(run)}</td></tr></tfoot></table></div>`})};
J.act("ledPop",el=>{const [id,f,t]=el.dataset.x.split("|");J.ledPop(id,f,t)});
})();
