/* Match everything — one button in Accounts → Bank check. It looks across ALL imported bank statements and hand entries and
   lists what it would do before it does anything (nothing changes until you press Apply):
   1. Same UTR / reference in two entries → the same payment booked twice (one bank's leg counted twice) → one entry.
   2. Both banks' lines of one transfer waiting in Suspense → one bank-to-bank transfer.
   3. Doubles the Bank check already finds (statement imported twice, hand entry + bank line, transfer from both banks).
   4. A bank payment sitting in Suspense whose amount and date match one pending bill in Bills, taxes & dues → posted to that bill's ledger.
   Entries that are right (e.g. the owner's capital in one bank and drawings from the other) are left alone. */
(()=>{
const J=window.J,{esc,inr,r2,fmtDate,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const kind=a=>J.get("accounts",a)?.kind;const loose=a=>kind(a)==="suspense";
const days=(a,b)=>Math.abs((new Date(a)-new Date(b))/864e5);
const shape=J.bankShape,xfer=J.bankXfer;
const texts=v=>[v.narr,v.ref,v.bank?.narr,v.bank?.ref,...arr(v.lines).map(l=>l.n)].join(" ");
const toks=v=>[...new Set(texts(v).match(/\d{12,16}/g)||[])];
const rec=(a,b)=>({...(a||{}),...(b||{})});
async function put(v,over){const m={...v,...over};await J.postVoucher({id:m.id,type:m.type,date:m.date,lines:m.lines,party:m.party,narr:m.narr,ref:m.ref,f:m.f,rec:m.rec,gst:m.gst,src:m.src,imp:m.imp,bank:m.bank})}
J.matchAllPlan=()=>{const P=[];const used=new Set();const V=J.all("vouchers");
  const add=(o)=>{P.push(o);for(const id of o.ids)used.add(id)};
  // 1. same UTR in two entries
  const by={};for(const v of V){if(!arr(v.lines).some(l=>kind(l.a)==="bank"))continue;for(const t of toks(v))(by[t]??=[]).push(v)}
  const seen=new Set();
  for(const [t,list] of Object.entries(by)){if(list.length<2||list.length>4)continue;
    for(let i=0;i<list.length;i++)for(let j=0;j<list.length;j++){if(i===j)continue;const X=list[i],Y=list[j];const k=X.id+">"+Y.id;if(seen.has(k)||used.has(X.id)||used.has(Y.id))continue;seen.add(k);
      const x=xfer(X),sy=shape(Y.lines);if(!x||!sy||Math.abs(x.amt-sy.amt)>0.01)continue;
      const side=sy.acc===x.to?"in":sy.acc===x.from?"out":"";if(!side||side!==sy.side)continue;
      const otherBank=sy.acc===x.to?x.from:x.to;
      if(sy.others.every(loose)){add({ids:[X.id,Y.id],tag:"Same UTR",title:`${X.no} and ${Y.no} · ${fmtDate(X.date)} · ${inr.format(x.amt)}`,
        what:`The transfer is in both statements (UTR ${t}). ${Y.no} is removed; ${X.no} stays with the cleared dates of both banks.`,
        run:async()=>{const Xn=J.get("vouchers",X.id),Yn=J.get("vouchers",Y.id);await J.store.patch("vouchers",Xn.id,{rec:rec(Yn.rec,Xn.rec)});await J.store.del("vouchers",Yn.id)}});
      }else if(sy.others.length===1){const cp=sy.others[0];
        add({ids:[X.id,Y.id],tag:"Same UTR",title:`${X.no} and ${Y.no} · ${fmtDate(X.date)} · ${inr.format(x.amt)}`,
          what:`${J.accName(sy.acc)} is counted twice (UTR ${t}): once in ${Y.no} (against ${J.accName(cp)}) and again in ${X.no}. ${X.no} will go only to ${J.accName(otherBank)} against ${J.accName(cp)}; ${Y.no} stays as it is.`,
          run:async()=>{const Xn=J.get("vouchers",X.id);const lines=arr(Xn.lines).map(l=>l.a===sy.acc?{...l,a:cp}:l);const r={...(Xn.rec||{})};delete r[sy.acc];
            const bankLeg=lines.find(l=>l.a===otherBank);const pay=+bankLeg.cr>0;
            await put(Xn,{type:pay?"payment":"receipt",party:Y.party||cp,lines,rec:r,f:pay?{amount:String(x.amt),from:otherBank,to:cp}:{amount:String(x.amt),from:cp,into:otherBank}})}})}}}
  // 1b. same bank, same side, same amount, same UTR in two entries → one payment booked twice
  for(const [t,list] of Object.entries(by)){if(list.length<2||list.length>4)continue;
    for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const A=list[i],B=list[j];if(used.has(A.id)||used.has(B.id))continue;const a=shape(A.lines),b=shape(B.lines);
      if(!a||!b||a.acc!==b.acc||a.side!==b.side||Math.abs(a.amt-b.amt)>0.01||days(A.date,B.date)>3||(A.imp&&A.imp===B.imp))continue;
      const keep=(A.createdAt||0)<=(B.createdAt||0)?A:B,ex=keep===A?B:A;
      add({ids:[A.id,B.id],tag:"Same UTR",title:`${keep.no} and ${ex.no} · ${fmtDate(keep.date)} · ${inr.format(a.amt)}`,what:`One ${a.side==="out"?"payment from":"receipt into"} ${J.accName(a.acc)} booked twice (UTR ${t}). ${ex.no} is removed.`,
        run:async()=>{const k=J.get("vouchers",keep.id),e=J.get("vouchers",ex.id);await J.store.patch("vouchers",k.id,{rec:rec(e.rec,k.rec)});await J.store.del("vouchers",e.id)}})}}
  // 2. both halves of a transfer waiting in Suspense (no UTR needed: same amount, ≤3 days, opposite sides, two different banks, each the only candidate)
  const half=V.filter(v=>v.imp&&!used.has(v.id)&&!v.bank?.from).map(v=>({v,s:shape(v.lines)})).filter(x=>x.s&&kind(x.s.acc)==="bank"&&x.s.others.every(loose));
  for(const a of half){if(used.has(a.v.id)||a.s.side!=="out")continue;
    const c=half.filter(b=>!used.has(b.v.id)&&b.s.side==="in"&&b.s.acc!==a.s.acc&&Math.abs(b.s.amt-a.s.amt)<0.01&&days(b.v.date,a.v.date)<=3);if(c.length!==1)continue;const b=c[0];
    const back=half.filter(o=>o.s.side==="out"&&o.s.acc===a.s.acc&&Math.abs(o.s.amt-a.s.amt)<0.01&&days(o.v.date,b.v.date)<=3&&!used.has(o.v.id));if(back.length!==1)continue;
    add({ids:[a.v.id,b.v.id],tag:"Suspense pair",title:`${a.v.no} and ${b.v.no} · ${fmtDate(a.v.date)} · ${inr.format(a.s.amt)}`,what:`${J.accName(a.s.acc)} paid and ${J.accName(b.s.acc)} received the same amount within 3 days, both waiting in Suspense → one transfer ${J.accName(a.s.acc)} → ${J.accName(b.s.acc)}.`,
      run:async()=>{const A=J.get("vouchers",a.v.id),B=J.get("vouchers",b.v.id);const lines=[{a:b.s.acc,dr:a.s.amt,cr:0,n:A.narr||""},{a:a.s.acc,dr:0,cr:a.s.amt,n:A.narr||""}];
        await put(A,{type:"contra",party:"",lines,rec:rec(B.rec,A.rec),f:{from:a.s.acc,to:b.s.acc,amount:String(a.s.amt)},bank:{...(A.bank||{}),from:A.bank?.from||"statement"}});await J.store.del("vouchers",B.id)}})}
  // 3. doubles the Bank check already knows
  const d=J.findDups();
  for(const x of d.xfer){if(used.has(x.keep.id)||used.has(x.extra.id))continue;add({ids:[x.keep.id,x.extra.id],tag:"Transfer twice",title:`${x.keep.no} and ${x.extra.no} · ${fmtDate(x.keep.date)} · ${inr.format(x.amt)}`,what:"The same bank-to-bank transfer came from both statements: one stays, the copy goes.",run:()=>J.mergeXfer(x.keep.id,x.extra.id)})}
  for(const x of d.twice){if(used.has(x.extra.id))continue;add({ids:[x.extra.id],tag:"Imported twice",title:`${x.extra.no} · ${fmtDate(x.extra.date)}`,what:`Same statement line as ${x.keep.no}: the copy goes.`,run:()=>J.store.del("vouchers",x.extra.id)})}
  for(const x of d.pairs){if(used.has(x.man.id)||used.has(x.bank.id))continue;add({ids:[x.man.id,x.bank.id],tag:"Hand + bank",title:`${x.man.no} and ${x.bank.no} · ${fmtDate(x.man.date)}`,what:"Your entry stays and takes the bank details; the imported copy goes.",run:()=>J.mergeBankPair(x.man.id,x.bank.id)})}
  // 4. Suspense payment ↔ pending bill (amount equal, date within 30 days of the due date, one candidate each way)
  const dues=(J.duesOpen?.()||[]);
  if(dues.length){const pays=V.filter(v=>v.imp&&!used.has(v.id)).map(v=>({v,s:shape(v.lines)})).filter(x=>x.s&&x.s.side==="out"&&kind(x.s.acc)==="bank"&&x.s.others.length===1&&loose(x.s.others[0]));
    for(const p of pays){const c=dues.filter(o=>Math.abs(o.left-p.s.amt)<0.01&&days(o.due,p.v.date)<=30);if(c.length!==1)continue;const o=c[0];
      if(pays.filter(q=>Math.abs(q.s.amt-p.s.amt)<0.01&&days(o.due,q.v.date)<=30).length!==1)continue;
      add({ids:[p.v.id],tag:"Pending bill",title:`${p.v.no} · ${fmtDate(p.v.date)} · ${inr.format(p.s.amt)} from ${J.accName(p.s.acc)}`,what:`Same amount as the pending bill “${o.label}” (due ${fmtDate(o.due)}): posted to ${J.accName(o.party)} instead of Suspense, so the bill shows paid.`,
        run:async()=>{const v=J.get("vouchers",p.v.id);await put(v,{lines:arr(v.lines).map(l=>l.a===p.s.others[0]?{...l,a:o.party}:l),party:o.party})}})}}
  return P};
function panel(){let P=[];try{P=J.matchAllPlan()}catch(e){console.warn("matchAll",e)}
  const head=`<section class="panel"><h2>Match everything</h2><div class="pb"><p class="hint" style="margin:0 0 8px">One press checks every bank statement, hand entry and pending bill together: the same UTR booked twice, both halves of a transfer, doubles, and Suspense payments that settle a pending bill. Nothing changes until you press Apply.</p>`;
  if(!P.length)return head+`<span class="chip ok">All matched</span> <span class="muted">No double, unpaired transfer or pending-bill match found.</span></div></section>`;
  return head+`<div class="row" style="gap:8px;margin-bottom:8px"><span class="chip warn">${P.length} to fix</span><button class="btn small w" data-a="matchAll">Apply all ${P.length}</button></div>
   <div class="tbl-wrap"><table class="fit"><thead><tr><th>Found</th><th>Entries</th><th>What will happen</th><th></th></tr></thead><tbody>${P.map((o,i)=>`<tr><td><span class="chip">${esc(o.tag)}</span></td><td>${esc(o.title)}</td><td class="hint">${esc(o.what)}</td><td><button class="btn small" data-a="matchOne" data-x="${i}">Apply</button></td></tr>`).join("")}</tbody></table></div></div></section>`}
const tap=(el,fn)=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again";setTimeout(()=>{if(el.isConnected)delete el.dataset.armed},4000);return}fn()};
J.act("matchOne",el=>tap(el,()=>{const P=J.matchAllPlan();const o=P[+el.dataset.x];if(!o)return J.render();el.disabled=true;J.safe(()=>o.run(),"Matched").then(()=>J.render())}));
J.act("matchAll",el=>tap(el,async()=>{el.disabled=true;let n=0;await J.safe(async()=>{for(let guard=0;guard<40;guard++){const P=J.matchAllPlan();if(!P.length)break;J.busy.start("Matching",P.length,"entries");await P[0].run();n++;J.busy.tick();await new Promise(r=>setTimeout(r,150))}},"Matched — "+n+" fixed");J.busy.end?.();J.render()}));
const acc=J.MODS.find(m=>m.id==="accounts");const t=acc&&acc.tabs.find(x=>x[0]==="dups");if(t){const o=t[2];t[2]=()=>panel()+o()}
})();
