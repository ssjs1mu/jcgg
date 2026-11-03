/* Card reconciliation — Accounts → Reconcile, when the ledger is a credit card that has statements in Bills → Credit cards.
   Per statement cycle: what the statement says (due, spends, payments received) against what the books hold for that card
   (balance at the statement date, charges and bank payments booked inside the cycle), so the gap shows up as entries still to book. */
(()=>{
const J=window.J,{S,esc,inr,r2,fmtDate}=J;
const arr=x=>Array.isArray(x)?x:[];
function panel(accId){const a=J.get("accounts",accId);if(!a||a.kind!=="card")return "";
  const doc=J.all("meta").find(m=>m.kind==="cc"&&m.ledger===accId);if(!doc)return "";
  const st=Object.values(doc.stmts||{}).filter(s=>s&&s.date).sort((x,y)=>x.date.localeCompare(y.date));if(!st.length)return "";
  const P=J.D.post.get(accId)||[];const B=n=>J.bal(n);
  const rows=st.map(s=>{const from=s.from||"0000-00-00",to=s.to||s.date;const inC=P.filter(p=>p.date>=from&&p.date<=to);
    const ch=r2(inC.reduce((t,p)=>t+p.cr,0)),pay=r2(inC.reduce((t,p)=>t+p.dr,0));const bk=J.balanceOf(accId,s.date);const due=-(+s.total||0);
    const posted=!!J.get("vouchers","cc-"+doc.last4+"-"+s.period);
    return {s,from,to,ch,pay,bk,due,gap:r2(bk-due),unb:r2((+s.purch||0)-ch),pdiff:r2(pay-(+s.credits||0)),posted}});
  const last=rows.at(-1);const unbTot=r2(rows.reduce((t,r)=>t+Math.max(0,r.unb),0));
  return `<section class="panel"><h2>Card statements vs books · ${esc(a.name)}</h2>
  <p class="hint pb" style="margin:0">Books now: ${B(J.balanceOf(accId))}. At the latest statement (${fmtDate(last.s.date)}) the card owed ${B(last.due)} but the books show ${B(last.bk)} — a gap of ${B(last.gap)}. The gap is spends printed on the statements that are not yet booked on this card (see "Spends not booked").</p>
  <div class="tbl-wrap"><table class="fit"><thead><tr><th>Statement</th><th>Cycle</th><th class="num">Statement due</th><th class="num">Books at that date</th><th class="num">Gap</th><th class="num">Spends on statement</th><th class="num">Charges in books</th><th class="num">Spends not booked</th><th class="num">Payments on statement</th><th class="num">Payments in books</th><th class="num">Payment diff</th><th>Business share</th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td>${fmtDate(r.s.date)}</td><td>${fmtDate(r.from)} – ${fmtDate(r.to)}</td><td class="num">${B(r.due)}</td><td class="num">${B(r.bk)}</td><td class="num">${B(r.gap)}</td><td class="num">${inr.format(+r.s.purch||0)}</td><td class="num">${inr.format(r.ch)}</td><td class="num">${r.unb>0.5?`<b>${inr.format(r.unb)}</b>`:"—"}</td><td class="num">${inr.format(+r.s.credits||0)}</td><td class="num">${inr.format(r.pay)}</td><td class="num">${Math.abs(r.pdiff)<0.5?"—":(r.pdiff>0?"+":"−")+inr.format(Math.abs(r.pdiff))}</td><td>${r.posted?'<span class="chip ok">Posted</span>':'<span class="chip warn">Not posted</span>'}</td></tr>`).join("")}</tbody>
  <tfoot><tr><td colspan="7">Spends not booked, all statements</td><td class="num"><b>${inr.format(unbTot)}</b></td><td colspan="4"></td></tr></tfoot></table></div>
  <p class="hint pb">To close the gap: Bills, taxes &amp; due → Credit cards → open the card → "Book the business share" for each statement not yet posted; personal spends go to the owner's drawings journal.</p></section>`}
J.cardReconPanel=panel;
const acc=J.MODS.find(m=>m.id==="accounts");const t=acc?.tabs.find(x=>x[0]==="recon");
if(t){const orig=t[2];t[2]=()=>{let h=orig();try{const id=J.ui("acc",{}).recon?.acc;h+=panel(id)}catch(e){console.error(e)}return h}}
})();
