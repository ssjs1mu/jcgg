/* Directory → "Morning snapshot": today's phone-size Morning Pulse (2 pages) from the stock-analyst terminal,
   a saved broadcast list taken from the Directory, one-tap WhatsApp to each person, and the phone's share sheet
   for WhatsApp / Instagram / Facebook posts. Free: no WhatsApp Business API, no Meta API, no server. */
(()=>{
const J=window.J,{S,esc,fmtDate,today,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const SRC="https://ssjs1mu.github.io/jc-stock-analyst/";
const ui=()=>J.ui("snap",{cat:"",q:"",loading:false,err:"",run:null,caption:null,only:false});
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
const links=()=>{const U=ui();return U.run?U.run.imgs.map((i,k)=>"Page "+(k+1)+": "+i.url).join("\n"):""};

function vSnap(){
  const U=ui();if(!U.run&&!U.loading&&!U.err)setTimeout(()=>load(),0);
  const all=people(),C=cfgDoc(),sel=new Set(arr(C.ids)),sent=new Set(sentDoc().ids);
  const cats=[...new Set(all.map(p=>p.cat))].filter(Boolean).sort();
  const q=(U.q||"").toLowerCase();
  const list=all.filter(p=>(!U.cat||p.cat===U.cat)&&(!q||(p.name+" "+p.sub+" "+p.num).toLowerCase().includes(q)));
  const chosen=all.filter(p=>sel.has(p.id));
  const stale=U.run&&U.run.date!==today();
  const prev=U.loading?`<div class="empty"><strong>Loading today's snapshot…</strong></div>`:U.err?`<div class="empty"><strong>${esc(U.err)}</strong><button class="btn small w" data-a="snapReload">Try again</button></div>`:
    U.run?`<div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-start">${U.run.imgs.map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener"><img src="${esc(i.url)}" alt="${esc(i.name)}" style="width:210px;max-width:44vw;border-radius:10px;border:1px solid #0002"></a>`).join("")}</div>
      <p class="hint" style="margin:6px 0 0">${stale?`<b style="color:#B45309">This is the ${fmtDate(U.run.date)} snapshot — today's has not been published yet.</b> `:""}Published ${esc(String(U.run.at||"").replace("T"," ").slice(0,16))} IST · 2 phone pages (1080×1350).</p>`:"";
  return `<div class="panel pb"><h3 style="margin-top:0">Morning snapshot — phone version</h3>${prev}
    <div class="form" style="margin-top:10px">${J.fld?J.fld("Caption (used for WhatsApp messages and posts)",`<textarea id="snap-cap" data-ui="snap.caption" rows="4">${esc(U.caption||"")}</textarea>`,"wide"):""}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
      <button class="btn primary w" data-a="snapShare" ${U.run?"":"disabled"}>Share images — WhatsApp / Instagram / Facebook</button>
      <button class="btn w" data-a="snapDownload" ${U.run?"":"disabled"}>Download images</button>
      <button class="btn w" data-a="snapCopyCap">Copy caption</button>
      <button class="btn w" data-a="snapReload">Refresh</button></div>
    <p class="hint" style="margin:8px 0 0">The share button opens your phone's own share sheet with both pages attached: pick <b>WhatsApp</b> (choose a chat, group, Status or your <b>Broadcast list</b>), <b>Instagram</b> or <b>Facebook</b>. Posting straight into those apps without a tap needs Meta's paid business API, so this stays free and one-tap.</p></div>
  <div class="panel pb"><h3 style="margin-top:0">Broadcast list <span class="chip plain">${chosen.length} selected</span></h3>
    <p class="hint" style="margin:0 0 8px">Tick the people from your Directory (clients, suppliers, staff with a WhatsApp or mobile number). The list is saved. Then send one by one with the button below — the message is ready, you only press Send in WhatsApp.</p>
    <div class="filters"><div class="seg" style="flex-wrap:wrap"><button data-set="snap.cat=" aria-pressed="${!U.cat}">All</button>${cats.map(c=>`<button data-set="snap.cat=${esc(c)}" aria-pressed="${U.cat===c}">${esc(c)}</button>`).join("")}</div>
      <input id="snap-q" data-ui="snap.q" value="${esc(U.q||"")}" placeholder="Search name or number" style="min-width:200px"></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:6px 0"><button class="btn small w" data-a="snapAll" data-x="1">Select all shown (${list.length})</button><button class="btn small" data-a="snapAll" data-x="0">Clear shown</button><button class="btn small" data-a="snapCopyNums">Copy selected numbers</button></div>
    <div class="tbl-wrap" style="max-height:340px;overflow:auto"><table><thead><tr><th></th><th>Name</th><th>Category</th><th>WhatsApp</th></tr></thead><tbody>${list.map(p=>`<tr><td><input type="checkbox" data-a="snapTick" data-x="${esc(p.id)}" ${sel.has(p.id)?"checked":""}></td><td>${esc(p.name)} ${p.sub?`<small>${esc(p.sub)}</small>`:""}</td><td>${esc(p.cat)}</td><td class="mono">${esc(p.num)}</td></tr>`).join("")||`<tr><td colspan="4"><div class="empty">No people with a mobile number here.</div></td></tr>`}</tbody></table></div></div>
  <div class="panel pb"><h3 style="margin-top:0">Send to the broadcast list <span class="chip ${chosen.length&&chosen.every(p=>sent.has(p.id))?"ok":"plain"}">${chosen.filter(p=>sent.has(p.id)).length} / ${chosen.length} sent today</span></h3>
    ${chosen.length?`<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary w" data-a="snapNext" ${U.run?"":"disabled"}>Send next → ${esc((chosen.find(p=>!sent.has(p.id))||{name:"all done"}).name)}</button><button class="btn small" data-a="snapResetSent">Start again</button></div>
    <div class="tbl-wrap" style="margin-top:8px"><table><tbody>${chosen.map(p=>`<tr><td>${esc(p.name)}</td><td class="mono">${esc(p.num)}</td><td style="text-align:right">${sent.has(p.id)?`<span class="chip ok">Sent</span> `:""}<a class="btn small ${sent.has(p.id)?"":"w"}" target="_blank" rel="noopener" href="${esc(waHref(p))}" data-a="snapMark" data-x="${esc(p.id)}">${sent.has(p.id)?"Resend":"WhatsApp"}</a></td></tr>`).join("")}</tbody></table></div>
    <p class="hint" style="margin:8px 0 0">WhatsApp can't attach images from a link, so each message carries the caption plus the two page links (they open as pictures). To send the actual images to everyone at once, create a WhatsApp <b>Broadcast list</b> once with "Copy selected numbers", then use the share button above and choose that list.</p>`:`<div class="empty"><strong>No one selected yet</strong><span>Tick people above to build the list.</span></div>`}</div>`;
}
const msg=()=>{const U=ui();return (U.caption||"")+"\n\n"+links()};
const waHref=p=>"https://wa.me/"+p.num+"?text="+encodeURIComponent(msg());

async function files(){const U=ui();return Promise.all(U.run.imgs.map(async i=>{const b=await (await fetch(i.url,{cache:"no-store"})).blob();return new File([b],i.name,{type:"image/png"})}))}
J.act("snapReload",()=>load(true));
J.act("snapCopyCap",async()=>{try{await navigator.clipboard.writeText(ui().caption||"");toast("Caption copied")}catch(e){toast("Copy not allowed here")}});
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
J.vSnap=vSnap;
})();
