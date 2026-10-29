/* Card spend mapping & posting.  Map a merchant once to Expense ledger › Micro-category (or Personal); every similar
   spend — on any card statement — is then posted to accounts automatically:  Dr mapped expense ledger (micro tagged) /
   Cr the card ledger, one entry per spend.  Spends not yet mapped go to the suspense ledger “Card spends to classify”;
   Personal spends go to ONE owner-drawings journal per statement (amount only, no merchants).  A spend that is already
   booked on the card ledger (same amount, within 4 days) is recognised and never posted twice.  Mapping also teaches
   the merchant name to the ledger so later bank / UPI imports route there, and can re-point existing bank / UPI suspense
   lines.  Rules are kept in meta/maprules (no new collection). */
(()=>{
const J=window.J,{S,esc,money,money0,fmtDate,toast,fld}=J;const C=J._cc;const arr=x=>Array.isArray(x)?x:[];const r2=x=>Math.round(x*100)/100;
const RID="maprules";const rules=()=>J.get("meta",RID)?.rules||{};
const saveRules=async r=>{const d={id:RID,kind:"maprules",rules:r,at:Date.now()};await J.store.put("meta",d);S.c.meta.set(RID,d)};
const hsh=s=>{let x=7;for(const ch of s)x=(x*31+ch.charCodeAt(0))>>>0;return x.toString(36)};
const isPay=d=>/PAYMENT|BPPY|CC PAY|AUTOPAY|NEFT|IMPS/i.test(d)&&!/REFUND|REVERS/i.test(d);
const cards=()=>C.docs();
const adm=()=>["Super Admin","Admin","Manager","Accountant"].includes(J.myRole?.());
function plan(c){const L=c.ledger;const out={items:[],personal:{},cnt:{posted:0,matched:0,fresh:0,classify:0,personal:0},amt:{posted:0,matched:0,fresh:0,classify:0,personal:0}};if(!L)return out;
  const R=rules();const claimed=new Set();
  const mine=id=>String(id).startsWith("cct-"+c.last4+"-")||String(id).startsWith("cc-p-"+c.last4+"-");
  const cand=J.all("vouchers").filter(v=>!mine(v.id)&&v.lines.some(l=>l.a===L&&l.cr>0));
  const days=(a,b)=>Math.abs((new Date(a)-new Date(b))/864e5);
  for(const per of Object.keys(c.stmts||{}).sort()){const st=c.stmts[per];const occ={};
    arr(st.tx).forEach((t,i)=>{if(t.cr&&isPay(t.desc))return;const key=C.mkey(t.desc);const sig=t.d+"|"+(t.t||"")+"|"+t.amt+"|"+t.desc;occ[sig]=(occ[sig]||0)+1;const id="cct-"+c.last4+"-"+hsh(sig)+"-"+occ[sig];
      const rule=t.map||R[key]||null;const own=t.own||rule?.own||"";const sign=t.cr?-1:1;
      let ex=null;if(!t.cr){ex=cand.find(v=>!claimed.has(v.id)&&Math.abs(v.lines.filter(l=>l.a===L).reduce((a,l)=>a+l.cr-l.dr,0)-t.amt)<0.011&&days(v.date,t.d)<=4)||null;if(ex)claimed.add(ex.id)}
      const cur=J.get("vouchers",id);let state=ex?"matched":cur?"posted":"fresh";let tgt="";
      if(own==="per")tgt="personal";else if(rule?.a)tgt=rule.a;else tgt="classify";
      const it={per,i,t,id,key,rule,own,tgt,state,ex:ex?.id||"",sign};out.items.push(it);
      const bucket=ex?"matched":tgt==="personal"?"personal":tgt==="classify"?"classify":(cur?"posted":"fresh");out.cnt[bucket]++;out.amt[bucket]=r2(out.amt[bucket]+t.amt*sign);
      if(!ex&&tgt==="personal")out.personal[per]=r2((out.personal[per]||0)+t.amt*sign)});}
  return out}
async function push(c){const L=c.ledger;const P=plan(c);const keep=new Set();let wrote=0,del=0;
  const sus=P.items.some(x=>!x.ex&&x.tgt==="classify")?await J.ensureAcc("Card spends to classify","suspense"):"";
  for(const it of P.items){if(it.ex||it.tgt==="personal")continue;const acc=it.tgt==="classify"?sus:it.tgt;if(!J.get("accounts",acc))continue;keep.add(it.id);
    const s=it.tgt==="classify"?"":(it.t.map?.s||it.rule?.s||"");const cur=J.get("vouchers",it.id);
    const dl=it.sign>0?{a:acc,dr:it.t.amt,cr:0,n:it.t.desc,...(s?{s}:{})}:{a:L,dr:it.t.amt,cr:0,n:"Refund · "+it.t.desc};const cl=it.sign>0?{a:L,dr:0,cr:it.t.amt,n:it.t.desc}:{a:acc,dr:0,cr:it.t.amt,n:it.t.desc,...(s?{s}:{})};
    const same=cur&&cur.date===it.t.d&&cur.lines.some(l=>l.a===acc&&(s?l.s===s:!l.s))&&cur.lines.some(l=>l.a===L)&&Math.abs(J.vAmount(cur)-it.t.amt)<0.011;if(same)continue;
    await J.postVoucher({id:it.id,type:"journal",noTwin:true,date:it.t.d,lines:[dl,cl],party:L,narr:"Card …"+c.last4+" · "+it.t.desc,ref:it.per,src:{col:"meta",id:c.id,label:"Card statement"}});wrote++}
  const pa=Object.keys(P.personal).length?await J.ensureAcc("Owner's drawings – personal card spends","capital"):"";
  for(const per of Object.keys(c.stmts||{})){const id="cc-p-"+c.last4+"-"+per;const amt=P.personal[per]||0;const cur=J.get("vouchers",id);
    if(amt>0.004){keep.add(id);if(cur&&Math.abs(J.vAmount(cur)-amt)<0.011)continue;const st=c.stmts[per];await J.postVoucher({id,type:"journal",noTwin:true,date:st.date,lines:[{a:pa,dr:amt,cr:0,n:"Personal spends · card …"+c.last4+" · "+per},{a:L,dr:0,cr:amt,n:"Personal spends · statement "+fmtDate(st.date)}],party:L,narr:"Personal spends on card …"+c.last4+" · "+per,ref:per,src:{col:"meta",id:c.id,label:"Card statement"}});wrote++}}
  for(const v of J.all("vouchers"))if((String(v.id).startsWith("cct-"+c.last4+"-")||String(v.id).startsWith("cc-p-"+c.last4+"-"))&&!keep.has(v.id)){await J.deleteVoucher(v.id);del++}
  return {wrote,del}}
J._ccAutoPost=async()=>{for(const c of cards())if(c.autoPost&&c.ledger)await push(C.getDoc(c.id))};
// ---------- row helper ----------
const nm=id=>id==="personal"?"Personal":id==="classify"?"To classify":(J.get("accounts",id)?.name||"?");
J._ccRowExtra=(c,s,t,i)=>{const P=J._ccPlanCache?.[c.id]||(J._ccPlanCache={...(J._ccPlanCache||{}),[c.id]:plan(c)})[c.id];const it=P.items.find(x=>x.per===s.period&&x.i===i);if(!it)return"";
  const st=it.ex?`<span class="chip ok">already booked</span>`:it.tgt==="personal"?`<span class="chip">personal</span>`:it.tgt==="classify"?`<span class="chip warn">to classify</span>`:`<span class="chip ok">→ ${esc(nm(it.tgt))}${it.rule?.s?" › "+esc(arr(J.get("accounts",it.tgt)?.svc).find(x=>x.id===it.rule.s)?.name||""):""}</span>`;
  return ` <button class="btn small" data-a="ccMap" data-x="${s.period}|${i}">Map</button> ${st}`};
// ---------- map dialog ----------
J.act("ccMap",el=>{const c=C.getDoc(C.ui().id);const [per,ix]=el.dataset.x.split("|");const t=c.stmts[per].tx[+ix];const key=C.mkey(t.desc);const r=t.map||rules()[key]||{};
  J.drawer({title:"Map “"+t.desc.slice(0,40)+"”",submit:"Save & push",body:`<p class="hint" style="margin-top:0">Spend ${money(t.amt)} · merchant key “${esc(key)}”. Every similar spend on every card is posted to the chosen ledger automatically.</p>
  <div class="form">${fld("Belongs to",`<select name="own"><option value="biz" ${r.own!=="per"?"selected":""}>Business</option><option value="per" ${r.own==="per"?"selected":""}>Personal (amount only, not in business expenses)</option></select>`)}
  ${fld("Expense ledger (category › sub-category)",J.selA("head",["expense"],r.a||"","— choose —"))}${J.svcField?J.svcField(r.s||"",r.a||""):""}
  ${fld("Apply to",`<select name="scope"><option value="all">All similar spends (this merchant)</option><option value="one">Only this spend</option></select>`)}</div>
  <p class="hint">Not in the list? Choose “＋ Add new” in the ledger list to create the expense ledger and its category, then add micro-categories (restaurant, meter, branch…) from Accounts.</p>`,
  onSubmit:async fd=>{if(fd.own!=="per"&&!fd.head)return "Choose the expense ledger (or Personal).";const rule={a:fd.own==="per"?"":fd.head,s:fd.own==="per"?"":(fd.svc||""),own:fd.own,label:t.desc.slice(0,50),at:Date.now()};
    if(fd.scope==="one"){const tx=c.stmts[per].tx.slice();tx[+ix]={...t,map:rule,own:fd.own};await C.save({...c,stmts:{...c.stmts,[per]:{...c.stmts[per],tx}}})}
    else{const R={...rules(),[key]:rule};await saveRules(R);
      for(const cc of cards()){const st={...cc.stmts};let ch=false;for(const p of Object.keys(st)){const tx=st[p].tx.map(x=>!x.cr&&C.mkey(x.desc)===key&&x.own!==rule.own?(ch=true,{...x,own:rule.own}):x);st[p]={...st[p],tx}}if(ch)await C.save({...cc,stmts:st})}
      if(rule.a){const a=J.get("accounts",rule.a);const al=key;if(a&&!arr(a.aliases).includes(al)&&al.length>=4)try{await J.store.patch("accounts",a.id,{aliases:[...arr(a.aliases),al].slice(-12)});S.c.accounts.set(a.id,{...a,aliases:[...arr(a.aliases),al].slice(-12)})}catch(e){}}}
    J._ccPlanCache=null;const c2=C.getDoc(c.id);if(c2.autoPost){let n=0;for(const cc of cards()){if(cc.autoPost&&cc.ledger){const r=await push(C.getDoc(cc.id));n+=r.wrote}}toast("Mapped · "+n+" entries posted to accounts")}else toast("Mapped — open Mapping & posting and press Push to accounts")}})});
// ---------- view ----------
function vMap(c){J._ccPlanCache=null;const P=plan(c);const R=rules();const keys=Object.keys(R);const ro=J.readOnly?.();const n=k=>P.cnt[k],a=k=>money0(P.amt[k]);const total=P.items.length;
  const count=k=>Object.values(cards()).reduce((s,cc)=>s+Object.values(cc.stmts||{}).reduce((q,st)=>q+arr(st.tx).filter(t=>!t.cr&&C.mkey(t.desc)===k).length,0),0);
  return `<section class="panel pb"><h3 style="margin-top:0">Posting to accounts — ${esc(c.name)}</h3><div class="row" style="gap:22px;flex-wrap:wrap"><div><div class="hint">Already booked (recognised)</div><b>${n("matched")}</b> · ${a("matched")}</div><div><div class="hint">Posted by this screen</div><b>${n("posted")}</b> · ${a("posted")}</div><div><div class="hint">New — ready to push</div><b>${n("fresh")}</b> · ${a("fresh")}</div><div><div class="hint">To classify (suspense)</div><b>${n("classify")}</b> · ${a("classify")}</div><div><div class="hint">Personal (one journal per statement)</div><b>${n("personal")}</b> · ${a("personal")}</div></div>
  <p class="hint" style="margin:8px 0">Each spend is posted as Dr the mapped expense ledger (micro-category tagged) / Cr ${esc(J.get("accounts",c.ledger)?.name||"the card ledger")}. Spends already booked on the card ledger (same amount, within 4 days) are never posted twice. Payments to the card are booked from the bank side and are not touched here.</p>
  ${ro||!adm()?"":`<button class="btn primary w" data-a="ccPush">Preview &amp; push to accounts</button> <label class="row" style="gap:6px;display:inline-flex"><input type="checkbox" data-ach="ccAuto" ${c.autoPost?"checked":""}> Post automatically after every upload and every mapping</label>`}</section>
  <section class="panel"><div class="row" style="padding:8px 12px;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>Mapping rules (all cards, utilities, wallets and UPI)</b>${ro||!adm()?"":`<button class="btn small" data-a="ccBank">Apply rules to bank / UPI entries…</button>`}</div><div class="tbl-wrap"><table class="t"><thead><tr><th>Merchant</th><th>Goes to</th><th class="num">Card spends</th><th></th></tr></thead><tbody>${keys.map(k=>{const r=R[k];const acc=J.get("accounts",r.a);const mic=arr(acc?.svc).find(x=>x.id===r.s);return `<tr><td>${esc(r.label||k)}<div class="hint">${esc(k)}</div></td><td>${r.own==="per"?"Personal":esc((acc?.name||"?")+(mic?" › "+mic.name:""))}</td><td class="num">${count(k)}</td><td>${ro?"":`<button class="btn small danger" data-a="ccRuleDel" data-x="${esc(k)}">Remove</button>`}</td></tr>`}).join("")||`<tr><td colspan="4" class="muted">No rules yet. Open Business / personal and press <b>Map</b> next to a spend.</td></tr>`}</tbody></table></div></section>`}
J._ccMapView=vMap;
J.act("ccAuto",async el=>{const c=C.getDoc(C.ui().id);await C.save({...c,autoPost:el.checked});toast(el.checked?"Automatic posting on":"Automatic posting off")});
J.act("ccRuleDel",async el=>{const R={...rules()};delete R[el.dataset.x];await saveRules(R);J._ccPlanCache=null;const c=C.getDoc(C.ui().id);if(c.autoPost)await push(c);toast("Rule removed");J.render()});
J.act("ccPush",()=>{const c=C.getDoc(C.ui().id);const P=plan(c);const w=P.items.filter(x=>!x.ex&&x.tgt!=="personal"&&x.state==="fresh").length;const pj=Object.values(P.personal).filter(x=>x>0).length;
  J.drawer({title:"Push "+c.name+" to accounts",submit:"Post now",body:`<p>This will create <b>${w}</b> entries (${money(P.amt.fresh+P.amt.classify)} in all, of which ${money(P.amt.classify)} goes to “Card spends to classify”) and <b>${pj}</b> personal journal${pj===1?"":"s"} (${money(P.amt.personal)}).</p><p><b>${P.cnt.matched}</b> spends (${money(P.amt.matched)}) are already booked on this ledger and are left alone.</p><p class="hint">Afterwards the card ledger shows every statement spend one by one, and its balance follows the statements. You can delete any posted entry from the ledger.</p>`,
  onSubmit:async()=>{const r=await push(C.getDoc(c.id));await C.save({...C.getDoc(c.id),autoPost:true});J._ccPlanCache=null;toast(r.wrote+" entries posted"+(r.del?", "+r.del+" removed":"")+" · automatic posting on");J.render()}})});
// ---------- bank / UPI suspense lines ----------
function bankHits(){const R=rules();const out=[];const sus=new Set(J.all("accounts").filter(a=>a.kind==="suspense").map(a=>a.id));
  for(const v of J.all("vouchers")){if(String(v.id).startsWith("cct-")||String(v.id).startsWith("cc-p-"))continue;for(const l of v.lines){if(!sus.has(l.a)||J.get("accounts",l.a)?.name==="Card spends to classify")continue;const hay=C.mkey((J.get("accounts",l.a)?.name||"")+" "+(v.narr||"")+" "+(l.n||""));
      const k=Object.keys(R).find(k=>k.length>=4&&R[k].a&&hay.includes(k));if(k)out.push({v,l,k,r:R[k]})}}return out}
J.act("ccBank",()=>{const H=bankHits();J.drawer({title:"Apply rules to bank / UPI entries",submit:H.length?"Move "+H.length+" lines":"Close",body:H.length?`<p>${H.length} bank / UPI lines now sitting in suspense match your merchant rules and will be moved to the mapped ledgers:</p><ul style="margin:0 0 0 18px;max-height:260px;overflow:auto">${H.slice(0,40).map(h=>`<li>${fmtDate(h.v.date)} · ${esc((h.v.narr||"").slice(0,44))} · ${money(r2(h.l.dr+h.l.cr))} → <b>${esc(nm(h.r.a))}</b></li>`).join("")}</ul>${H.length>40?`<p class="hint">… and ${H.length-40} more</p>`:""}`:`<p>No bank / UPI lines in suspense match your rules. New imports are routed automatically because each mapped merchant is remembered on its ledger.</p>`,
  onSubmit:async()=>{let n=0;for(const h of H){const v=J.get("vouchers",h.v.id);if(!v)continue;const lines=v.lines.map(l=>l.a===h.l.a&&l.dr===h.l.dr&&l.cr===h.l.cr?{...l,a:h.r.a,...(h.r.s?{s:h.r.s}:{})}:l);await J.store.patch("vouchers",v.id,{lines});S.c.vouchers.set(v.id,{...v,lines});n++}toast(n+" lines moved");J.render()}})});
})();
