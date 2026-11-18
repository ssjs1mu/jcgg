/* Tallied / reconciled mark for bank, card and wallet balances in the MIS report. Press the mark beside a balance, enter the date and the
   balance in the bank statement / passbook / card app: if it agrees with the books the ledger is marked “tallied” on that date (even
   when there are no recent transactions). The mark turns amber as soon as any later entry changes the balance, so a stale tick never
   misleads. Kept in meta/tally; nothing is posted. */
(()=>{
const J=window.J,{esc,fmtDate,today,fld}=J;
const r2=x=>Math.round(x*100)/100;
const ID="tally";const all=()=>J.get("meta",ID)?.acc||{};
const save=async acc=>{const d={id:ID,kind:"tally",acc,at:Date.now()};await J.store.put("meta",d);try{J.S.c.meta.set(ID,d)}catch(e){}};
// cell for the MIS table: state from the recorded balance vs the balance now
J.tallyCell=(a,bal)=>{if(!["bank","card","wallet"].includes(a.kind))return "";const r=all()[a.id];
  const btn=(t,cls)=>`<button type="button" class="linkbtn ${cls||""}" data-a="tallyOpen" data-x="${esc(a.id)}" title="Mark this balance as tallied with the statement">${t}</button>`;
  if(!r)return btn("Mark tallied","muted");
  const same=Math.abs(r2(bal)-r2(r.bal))<0.005;
  return same?`<span class="chip ok" title="Tallied with the statement on ${esc(fmtDate(r.on))}: ${esc(J.inr?.format?.(r.sb)??r.sb)}${r.note?" · "+esc(r.note):""}">✓ ${esc(fmtDate(r.on))}</span> ${btn("↻")}`
    :`<span class="chip warn" title="Tallied on ${esc(fmtDate(r.on))} at ${esc(J.inr?.format?.(r.bal)??r.bal)}; the balance has changed since">⚠ ${esc(fmtDate(r.on))}</span> ${btn("Re-tally")}`};
J.act("tallyOpen",el=>{const id=el.dataset.x;const a=J.get("accounts",id);if(!a)return;const bal=r2(J.balanceOf(id));const r=all()[id];
  J.drawer({title:"Tally · "+a.name,submit:"Mark tallied",body:`<p class="hint" style="margin-top:0">Books balance now: <b>${J.bal(bal)}</b>. Enter the balance shown by the ${a.kind==="card"?"card statement / app":a.kind==="wallet"?"wallet":"bank statement or passbook"} for the date you checked. If both agree the ledger is marked tallied.</p>
   <div class="form">${fld("Tallied on",`<input type="date" name="on" value="${esc(today())}" max="${esc(today())}">`)}${fld("Balance per statement ₹ (positive = Dr, enter a card or overdrawn balance as negative)",`<input type="number" step="any" name="sb" inputmode="decimal" value="${bal}">`)}${fld("Note (optional)",`<input name="note" placeholder="e.g. Passbook updated, statement to 15 Nov" value="${esc(r?.note||"")}">`)}</div>
   ${r?`<p class="hint">Last tallied ${esc(fmtDate(r.on))} · <button type="button" class="linkbtn" data-a="tallyClear" data-x="${esc(id)}">Remove the mark</button></p>`:""}`,
  onSubmit:async fd=>{const sb=r2(+fd.sb);if(!fd.on)return "Choose the date.";if(isNaN(sb))return "Enter the statement balance.";const cur=r2(J.balanceOf(id,fd.on));
    if(Math.abs(cur-sb)>=0.005)return "Not tallied: books show "+(cur<0?"₹"+Math.abs(cur).toFixed(2)+" Cr":"₹"+cur.toFixed(2)+" Dr")+" on "+fmtDate(fd.on)+", statement says "+(sb<0?"₹"+Math.abs(sb).toFixed(2)+" Cr":"₹"+sb.toFixed(2)+" Dr")+" — difference ₹"+Math.abs(r2(cur-sb)).toFixed(2)+". Correct the entries first (Accounts → Reconcile).";
    await save({...all(),[id]:{on:fd.on,sb,bal:r2(J.balanceOf(id)),note:(fd.note||"").trim(),by:J.S?.me?.email||"",at:Date.now()}});J.toast?.("Marked tallied · "+a.name);J.render()}})});
J.act("tallyClear",async el=>{const A={...all()};delete A[el.dataset.x];await save(A);J.toast?.("Mark removed");J.render()});
})();
