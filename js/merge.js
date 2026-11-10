/* Merge two ledgers: every entry on the "from" ledger is moved to the "into" ledger; the old ledger is then hidden.
   Use it when one party or expense was opened under two names (Somnath Giri / Shakti South Indian Foods), or to fold
   several small ledgers into one head (for example House Hold Expenses). The old name can be kept as a micro-category
   on the merged ledger, so Reports → Bills by connection still shows it separately.
   Allowed for expense, income, vendor and customer ledgers that are not built-in. Safe to run again if it stops midway. */
(()=>{
const J=window.J,{esc,toast,today,fld,r2,inr}=J;const arr=x=>Array.isArray(x)?x:[];
const OKK=["expense","income","vendor","customer"];
const cands=()=>J.all("accounts").filter(a=>OKK.includes(a.kind)&&!a.sys).sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name));
const vsOf=id=>{const seen=new Set();return (J.D.post?.get(id)||[]).map(p=>p.v).filter(v=>!seen.has(v.id)&&seen.add(v.id))};
const opts=(sel,act)=>`<option value="">Choose…</option>${OKK.map(k=>{const l=cands().filter(a=>a.kind===k&&(act?a.active!==false:true));return l.length?`<optgroup label="${esc(J.KINDS[k].l)}">${l.map(a=>`<option value="${esc(a.id)}" ${a.id===sel?"selected":""}>${esc(a.name)}${a.active===false?" (hidden)":""} · ${vsOf(a.id).length} entries</option>`).join("")}</optgroup>`:""}).join("")}`;
J.act("accMerge",el=>{const pre=el?.dataset?.x||"";
  J.drawer({title:"Merge two ledgers",submit:"Merge",body:`<p class="hint" style="margin-top:0">All entries of the first ledger move to the second one. The first ledger is then hidden (not deleted), so nothing is lost. Balances, reports and bank matching follow the merged ledger.</p>
   <div class="form">${fld("Merge this ledger (it will be hidden)",`<select name="from" id="f-from">${opts(pre,false)}</select>`)}${fld("Into this ledger (it stays)",`<select name="into" id="f-into">${opts("",true)}</select>`)}</div>
   <label class="f" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="keep" checked style="width:auto"> Keep the old name as a micro-category on the merged ledger (shows separately in Reports → Bills by connection)</label>
   <p class="hint">Entries matched with a bank statement are frozen: if any are found you will be asked to unlock first (Accounts → Freeze &amp; checks).</p>`,
   onSubmit:async fd=>{const A=J.get("accounts",fd.from),B=J.get("accounts",fd.into);if(!A||!B)return "Choose both ledgers.";if(A.id===B.id)return "Choose two different ledgers.";
    if(!OKK.includes(A.kind)||!OKK.includes(B.kind)||A.sys)return "Only expense, income, vendor and customer ledgers can be merged.";
    const vs=vsOf(A.id);const frozen=vs.filter(v=>J.lock?.isFrozen?.(v));if(frozen.length&&!J.lock?.open?.())return frozen.length+" of the "+vs.length+" entries are matched or frozen. Unlock first in Accounts → Freeze & checks (Unlock to edit), then press Merge again.";
    if(A.kind!==B.kind){if(J._mergeAsk!==A.id+B.id){J._mergeAsk=A.id+B.id;return "“"+A.name+"” is a "+J.KINDS[A.kind].l+" and “"+B.name+"” is a "+J.KINDS[B.kind].l+". Merging different kinds changes where these entries show in the reports. Press Merge again to go ahead."}}
    J._mergeAsk="";let tag="";const keep=!!fd.keep;let svc=arr(B.svc).map(c=>({...c}));
    for(const c of arr(A.svc))if(!svc.some(x=>x.id===c.id))svc.push({...c});
    if(keep){const ex=svc.find(c=>c.name.toLowerCase()===A.name.toLowerCase());if(ex)tag=ex.id;else{tag="svc-"+J.uid();svc.push({id:tag,name:A.name,no:"",provider:"",words:A.name,active:true})}}
    let n=0,skip=0;J.busy.start("Merging "+A.name+" into "+B.name,vs.length);
    try{if(svc.length!==arr(B.svc).length||keep)await J.store.patch("accounts",B.id,{svc});
      for(const v0 of vs){const v=J.get("vouchers",v0.id);if(!v)continue;
        const lines=v.lines.map(l=>l.a!==A.id?l:{...l,a:B.id,...(l.s?{}:tag?{s:tag}:{})});
        const f=v.f?Object.fromEntries(Object.entries(v.f).map(([k,x])=>[k,x===A.id?B.id:x])):v.f;const rec={...(v.rec||{})};if(rec[A.id]){rec[B.id]=rec[A.id];delete rec[A.id]}
        try{await J.postVoucher({...v,id:v.id,lines,party:v.party===A.id?B.id:v.party,...(f?{f}:{}),rec});n++}catch(e){skip++}J.busy.tick?.()}
      if(!skip){const op=r2((+A.opening||0)+(+B.opening||0));if(+A.opening)await J.store.patch("accounts",B.id,{opening:op});
        for(const m of J.all("moves"))if(m.vendor===A.id)await J.store.patch("moves",m.id,{vendor:B.id});
        const rl=J.get("meta","rules")?.list;if(arr(rl).some(r=>r[1]===A.id))await J.store.put("meta",{...J.get("meta","rules"),id:"rules",list:rl.map(r=>r[1]===A.id?[r[0],B.id,...r.slice(2)]:r)});
        await J.store.patch("accounts",A.id,{active:false,opening:0,mergedInto:B.id,mergedAt:Date.now()})}
    }finally{J.busy.end()}
    toast(skip?n+" entries moved · "+skip+" could not be changed (frozen or locked) — unlock and merge again; the old ledger is kept until then":n+" entries moved to “"+B.name+"”. “"+A.name+"” is now hidden.")}})});
// button on the Accounts header
{const m=J.MODS.find(x=>x.id==="accounts");if(m){const old=m.headBtns;m.headBtns=()=>(old?old():"").replace('<button class="btn w" data-a="impOpen"','<button class="btn w" data-a="accMerge">Merge ledgers</button><button class="btn w" data-a="impOpen"')}}
})();
