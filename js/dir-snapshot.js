/* Directory → "Morning snapshot": today's phone-size Morning Pulse (2 pages) from the stock-analyst terminal,
   a saved broadcast list taken from the Directory, one-tap WhatsApp to each person, and the phone's share sheet
   for WhatsApp / Instagram / Facebook posts. Free: no WhatsApp Business API, no Meta API, no server. */
(()=>{
const J=window.J,{S,esc,fmtDate,today,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const SRC="https://ssjs1mu.github.io/jc-stock-analyst/";
const BOOK=SRC+"morning/";
const ui=()=>J.ui("snap",{cat:"",q:"",loading:false,err:"",run:null,caption:null,only:false,bs:50,bl:1,bulk:false});
const digits=p=>{let d=String(p||"").replace(/\D/g,"");if(d.length===10)d="91"+d;return d.length>=11?d:""};
const cfgDoc=()=>J.get("meta","snapBcast")||{id:"snapBcast",ids:[]};
const sentDoc=()=>{const d=J.get("meta","snapSent")||{id:"snapSent",date:"",ids:[]};return d.date===today()?d:{id:"snapSent",date:today(),ids:[]}};
const save=async(doc)=>{await J.store.put("meta",doc);S.c.meta?.set(doc.id,doc)};

/* every directory person who has a WhatsApp / mobile number */
function people(){
  const out=[];
  for(const c of J.all("contacts")){
    const ph=arr(c.phones).find(p=>p.type==="WhatsApp"&&digits(p.num))||arr(c.phones).find(p=>p.type==="Primary"&&digits(p.num))||arr(c.phones).find(p=>digits(p.num));
    if(ph)out.push({id:"c:"+c.id,name:c.name,sub:c.company||c.sub||"",cat:c.cat||"",num:digits(ph.num)});
  }
  for(const c of J.all("clients")){const n=digits(c.wa||c.phone);if(n)out.push({id:"k:"+c.id,name:c.name,sub:c.code||"",cat:"Clients",num:n})}
  const seen=new Set();return out.filter(p=>{if(seen.has(p.num))return false;seen.add(p.num);return true}).sort((a,b)=>a.name.localeCompare(b.name));
}

async function load(force){
  const U=ui();if(U.loading||(U.run&&!force))return;U.loading=true;U.err="";
  try{
    const r=await fetch(SRC+"reports/morning-pulse/index.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const j=await r.json();
    const run=(j.runs||[]).find(x=>x.status==="ok"&&arr(x.files).some(f=>/Mobile_.*_\d\.png$/.test(f.name)));
    if(!run)throw new Error("No phone-size Morning Pulse has been published yet.");
    const imgs=run.files.filter(f=>/Mobile_.*_\d\.png$/.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name)).map(f=>({name:f.name,url:SRC+f.path}));
    U.run={date:run.date,at:run.generated_at,imgs};
    if(U.caption===null)U.caption=defCaption(run);
  }catch(e){U.err="Could not load the snapshot ("+(e.message||e)+"). Check the internet connection and try again."}
  U.loading=false;J.render();
}
const defCaption=run=>"Joshi's Corner - Morning Market Pulse, "+fmtDate(run.date)+"\nWhat to expect at the open, key levels and stocks to watch.\nFor information only. Not investment advice. Markets carry risk.";
const links=()=>BOOK+(ui().run?ui().run.date+"/":"");

function vSnap(){
  const U=ui();if(!U.run&&!U.loading&&!U.err)setTimeout(()=>load(),0);
  const all=people(),C=cfgDoc(),sel=new Set(arr(C.ids)),sent=new Set(sentDoc().ids);
  const cats=[...new Set(all.map(p=>p.cat))].filter(Boolean).sort();
  const q=(U.q||"").toLowerCase();
  const list=all.filter(p=>(!U.cat||p.cat===U.cat)&&(!q||(p.name+" "+p.sub+" "+p.num).toLowerCase().includes(q)));
  const chosen=all.filter(p=>sel.has(p.id));
  const stale=U.run&&U.run.date!==today();
  const prev=U.loading?`<div class="empty"><strong>Loading today's snapshot…</strong></div>`:U.err?`<div class="empty"><strong>${esc(U.err)}</strong><button class="btn small w" data-a="snapReload">Try again</button></div>`:
    U.run?`<iframe src="${BOOK}${esc(U.run.date)}/" title="Morning Pulse booklet" style="width:min(100%,360px);height:520px;border:1px solid #0002;border-radius:12px;background:#0d0a18"></iframe>
      <p class="hint" style="margin:6px 0 0">${stale?`<b style="color:#B45309">This is the ${fmtDate(U.run.date)} booklet — today's has not been published yet.</b> `:""}Published ${esc(String(U.run.at||"").replace("T"," ").slice(0,16))} IST · ${U.run.imgs.length} pages — tap the page to turn it, like a book.</p>`:"";
  return `<div class="panel pb"><h3 style="margin-top:0">Morning snapshot — phone version</h3>${prev}
    <div class="form" style="margin-top:10px">${J.fld?J.fld("Caption (used for WhatsApp messages and posts)",`<textarea id="snap-cap" data-ui="snap.caption" rows="4">${esc(U.caption||"")}</textarea>`,"wide"):""}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
      <button class="btn primary w" data-a="snapShareBook" ${U.run?"":"disabled"}>Share booklet — WhatsApp / Facebook / Instagram</button>
      <button class="btn w" data-a="snapShare" ${U.run?"":"disabled"}>Share as pictures</button>
      <button class="btn w" data-a="snapDownload" ${U.run?"":"disabled"}>Download images</button>
      <button class="btn w" data-a="snapCopyCap">Copy caption</button>
      <button class="btn w" data-a="snapReload">Refresh</button></div>
    <p class="hint" style="margin:8px 0 0"><b>Share booklet</b> sends one picture card (cover + title) that opens as a page-turning booklet — new pages added later appear in the same booklet. <b>Share as pictures</b> attaches the pages themselves, for Status, Instagram or Facebook posts. Posting into those apps with no tap at all needs Meta's paid business API, so this stays free and one-tap.</p></div>
  <div class="panel pb"><h3 style="margin-top:0">Broadcast list <span class="chip plain">${chosen.length} selected</span></h3>
    <p class="hint" style="margin:0 0 8px">Tick the people from your Directory (clients, suppliers, staff with a WhatsApp or mobile number). The list is saved. Then send one by one with the button below — the message is ready, you only press Send in WhatsApp.</p>
    <div class="filters"><div class="seg" style="flex-wrap:wrap"><button data-set="snap.cat=" aria-pressed="${!U.cat}">All</button>${cats.map(c=>`<button data-set="snap.cat=${esc(c)}" aria-pressed="${U.cat===c}">${esc(c)}</button>`).join("")}</div>
      <input id="snap-q" data-ui="snap.q" value="${esc(U.q||"")}" placeholder="Search name or number" style="min-width:200px"></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:6px 0"><button class="btn small w" data-a="snapAll" data-x="1">Select all shown (${list.length})</button><button class="btn small" data-a="snapAll" data-x="0">Clear shown</button><button class="btn small" data-a="snapCopyNums">Copy selected numbers</button></div>
    <div class="tbl-wrap" style="max-height:340px;overflow:auto"><table><thead><tr><th></th><th>Name</th><th>Category</th><th>WhatsApp</th></tr></thead><tbody>${list.map(p=>`<tr><td><input type="checkbox" data-a="snapTick" data-x="${esc(p.id)}" ${sel.has(p.id)?"checked":""}></td><td>${esc(p.name)} ${p.sub?`<small>${esc(p.sub)}</small>`:""}</td><td>${esc(p.cat)}</td><td class="mono">${esc(p.num)}</td></tr>`).join("")||`<tr><td colspan="4"><div class="empty">No people with a mobile number here.</div></td></tr>`}</tbody></table></div></div>
  <div class="panel pb"><h3 style="margin-top:0">Send to the broadcast list <span class="chip ${chosen.length&&chosen.every(p=>sent.has(p.id))?"ok":"plain"}">${chosen.filter(p=>sent.has(p.id)).length} / ${chosen.length} sent today</span></h3>
    ${chosen.length?bulkHtml(chosen,sent,U):`<div class="empty"><strong>No one selected yet</strong><span>Tick people above to build the list.</span></div>`}</div>`;
}
function bulkHtml(chosen,sent,U){
  const bs=Number(U.bs)||50,n=Math.max(1,Math.ceil(chosen.length/bs)),bl=Math.min(Math.max(1,Number(U.bl)||1),n);
  const part=chosen.slice((bl-1)*bs,bl*bs),left=part.filter(p=>!sent.has(p.id)).length;
  const nums=Array.from({length:n},(_,i)=>{const c=chosen.slice(i*bs,(i+1)*bs);const d=c.filter(p=>sent.has(p.id)).length;return `<button data-set="snap.bl=${i+1}" aria-pressed="${bl===i+1}">List ${i+1} <small>${d}/${c.length}</small></button>`}).join("");
  return `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><label class="hint" style="margin:0">People per list</label>
      <select data-ui="snap.bs">${[20,25,50,100,200,256].map(v=>`<option value="${v}" ${bs===v?"selected":""}>${v}</option>`).join("")}</select></div>
    <div class="seg" style="flex-wrap:wrap;margin:8px 0">${nums}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <button class="btn primary w" data-a="snapBulk" ${U.run&&left?"":"disabled"}>${U.bulk?"Bulk push running…":"Bulk push List "+bl+" ("+left+" left)"}</button>
      <button class="btn small" data-a="snapStop" ${U.bulk?"":"disabled"}>Stop</button>
      <button class="btn small" data-a="snapNext" ${U.run?"":"disabled"}>Send next one</button>
      <button class="btn small" data-a="snapResetSent">Start again</button></div>
    <p class="hint" style="margin:8px 0">One tap starts the push: the first chat opens with the message ready. Press Send in WhatsApp and come back — the next chat opens by itself after a 2-second countdown, and so on to the end of the list. If your phone blocks the automatic open, a big “Send next” button appears instead. WhatsApp itself will not let any app press Send for you, and this stays free (no business API).</p>
    <div class="tbl-wrap" style="margin-top:8px;max-height:320px;overflow:auto"><table><tbody>${part.map((p,i)=>`<tr><td class="mono">${(bl-1)*bs+i+1}</td><td>${esc(p.name)}</td><td class="mono">${esc(p.num)}</td><td style="text-align:right">${sent.has(p.id)?`<span class="chip ok">Sent</span> `:""}<a class="btn small ${sent.has(p.id)?"":"w"}" target="_blank" rel="noopener" href="${esc(waHref(p))}" data-a="snapMark" data-x="${esc(p.id)}">${sent.has(p.id)?"Resend":"WhatsApp"}</a></td></tr>`).join("")}</tbody></table></div>
    <p class="hint" style="margin:8px 0 0">To send the actual picture pages instead of the link, create a WhatsApp Broadcast list (max 256 people each — use the same numbered lists) with “Copy selected numbers”, then use Share as pictures above.</p>`;
}
const msg=()=>{const U=ui();return (U.caption||"")+"\n\n"+links()};
const waHref=p=>"https://wa.me/"+p.num+"?text="+encodeURIComponent(msg());

async function files(){const U=ui();return Promise.all(U.run.imgs.map(async i=>{const b=await (await fetch(i.url,{cache:"no-store"})).blob();return new File([b],i.name,{type:"image/png"})}))}
J.act("snapReload",()=>load(true));
J.act("snapCopyCap",async()=>{try{await navigator.clipboard.writeText(ui().caption||"");toast("Caption copied")}catch(e){toast("Copy not allowed here")}});
J.act("snapShareBook",async()=>{const d={title:"Joshi's Corner - Morning Market Pulse",text:ui().caption||"",url:links()};try{if(navigator.share)await navigator.share(d);else{await navigator.clipboard.writeText((ui().caption||"")+"\n"+links());toast("Caption and booklet link copied")}}catch(e){if(e&&e.name!=="AbortError")toast("Could not share: "+(e.message||e))}});
J.act("snapShare",async()=>{
  try{const f=await files();const data={files:f,text:ui().caption||"",title:"Morning Market Pulse"};
    if(navigator.canShare&&navigator.canShare({files:f})){await navigator.share(data)}
    else{toast("This browser can't share pictures directly — downloading them instead");f.forEach(download)}}
  catch(e){if(e&&e.name!=="AbortError")toast("Could not share: "+(e.message||e))}});
const download=f=>{const a=document.createElement("a");a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)};
J.act("snapDownload",async()=>{try{(await files()).forEach(download);toast("Images downloaded — post them to Instagram / Facebook / WhatsApp from your gallery")}catch(e){toast("Download failed: "+(e.message||e))}});
J.act("snapTick",async el=>{const id=el.dataset.x;const C=cfgDoc();const s=new Set(arr(C.ids));s.has(id)?s.delete(id):s.add(id);await J.safe(()=>save({...C,id:"snapBcast",ids:[...s]}));J.render()});
J.act("snapAll",async el=>{const U=ui();const q=(U.q||"").toLowerCase();const shown=people().filter(p=>(!U.cat||p.cat===U.cat)&&(!q||(p.name+" "+p.sub+" "+p.num).toLowerCase().includes(q))).map(p=>p.id);
  const C=cfgDoc();const s=new Set(arr(C.ids));shown.forEach(id=>el.dataset.x==="1"?s.add(id):s.delete(id));await J.safe(()=>save({...C,id:"snapBcast",ids:[...s]}));J.render()});
J.act("snapCopyNums",async()=>{const s=new Set(arr(cfgDoc().ids));const n=people().filter(p=>s.has(p.id)).map(p=>"+"+p.num).join("\n");try{await navigator.clipboard.writeText(n);toast("Numbers copied")}catch(e){toast("Copy not allowed here")}});
const mark=async id=>{const d=sentDoc();if(d.ids.includes(id))return;await J.safe(()=>save({...d,ids:[...d.ids,id]}))};
J.act("snapMark",async el=>{await mark(el.dataset.x);J.render()});
J.act("snapNext",async()=>{const s=new Set(arr(cfgDoc().ids)),sent=new Set(sentDoc().ids);const p=people().find(x=>s.has(x.id)&&!sent.has(x.id));if(!p)return toast("Everyone on the list has been sent today");
  window.open(waHref(p),"_blank");await mark(p.id);J.render()});
J.act("snapResetSent",async()=>{await J.safe(()=>save({id:"snapSent",date:today(),ids:[]}));J.render()});
let bt=null,cd=0;
const part=()=>{const U=ui(),bs=Number(U.bs)||50,s=new Set(arr(cfgDoc().ids)),sent=new Set(sentDoc().ids);const ch=people().filter(p=>s.has(p.id));const bl=Math.max(1,Number(U.bl)||1);return ch.slice((bl-1)*bs,bl*bs).filter(p=>!sent.has(p.id))};
function bar(html){let b=document.getElementById("snapbar");if(!html){b&&b.remove();return}
  if(!b){b=document.createElement("div");b.id="snapbar";b.style.cssText="position:fixed;left:8px;right:8px;bottom:10px;z-index:99999;background:#111827;color:#fff;border:2px solid #25D366;border-radius:14px;padding:10px 12px;display:flex;gap:8px;align-items:center;justify-content:space-between;box-shadow:0 8px 30px #0008";document.body.appendChild(b)}b.innerHTML=html}
async function openNext(manual){const U=ui();const p=part()[0];
  if(!p){U.bulk=false;bar("");toast("List finished — everyone sent");J.render();return}
  const w=window.open(waHref(p),"_blank");await mark(p.id);
  if(!w&&!manual){bar('<span><b>'+esc(p.name)+'</b> — tap to open WhatsApp</span><button class="btn primary" id="snapGo">Send next ('+part().length+' left)</button><button class="btn small" id="snapX">Stop</button>');
    document.getElementById("snapGo").onclick=()=>{bar("");window.open(waHref(p),"_blank")};document.getElementById("snapX").onclick=stop;return}
  if(U.bulk)bar('<span>Sent to <b>'+esc(p.name)+'</b>. Come back here for the next one.</span><button class="btn small" id="snapX">Stop</button>');
  const x=document.getElementById("snapX");if(x)x.onclick=stop;J.render()}
function stop(){const U=ui();U.bulk=false;clearInterval(bt);bar("");J.render()}
document.addEventListener("visibilitychange",()=>{const U=ui();if(!U.bulk||document.hidden)return;
  if(!part().length){stop();toast("List finished — everyone sent");return}
  cd=2;clearInterval(bt);bar('<span>Next chat opens in <b id="snapcd">2</b>s…</span><button class="btn small" id="snapX">Stop</button>');document.getElementById("snapX").onclick=stop;
  bt=setInterval(()=>{cd--;const e=document.getElementById("snapcd");if(e)e.textContent=cd;if(cd<=0){clearInterval(bt);openNext(false)}},1000)});
J.act("snapBulk",async()=>{const U=ui();if(!part().length)return toast("This list is already sent");U.bulk=true;await openNext(true)});
J.act("snapStop",stop);
J.vSnap=vSnap;
})();
