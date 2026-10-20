/* Attachments (identity, bank, policy documents): stored in Firestore in pieces (each record is limited to 1 MB),
   a small thumbnail kept on the owner record, full view in a lightbox. Also: automatic backup of the book to Google Drive. */
(()=>{
const J=window.J,{S,esc,toast,uid,today}=J;
const CH=700000;
const readB64=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=no;r.readAsDataURL(f)});
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});
function scaleTo(img,max,q){const k=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));const c=document.createElement("canvas");c.width=Math.round((img.naturalWidth||img.width)*k);c.height=Math.round((img.naturalHeight||img.height)*k);const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/jpeg",q)}
async function pdfThumb(dataUrl){try{const lib=await J.loadPdfJs();const bin=atob(dataUrl.split(",")[1]);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const pdf=await lib.getDocument({data:u}).promise;const pg=await pdf.getPage(1);const vp0=pg.getViewport({scale:1});const vp=pg.getViewport({scale:320/vp0.width});const c=document.createElement("canvas");c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;return {thumb:c.toDataURL("image/jpeg",0.7),pages:pdf.numPages}}catch(e){return {thumb:"",pages:0}}}
// save a File: images are resized to 2000 px on the long side (sharp enough to read an ID card), PDFs kept as they are
J.fileSave=async(file,col="files",onStep)=>{if(file.size>15e6)throw new Error(file.name+" is over 15 MB");let url=await readB64(file);let type=file.type||"application/octet-stream";let thumb="",pages=0;
  if(/^image\//.test(type)){const img=await loadImg(url);thumb=scaleTo(img,320,0.7);if(file.size>600e3||!/jpe?g|png/.test(type)){url=scaleTo(img,2000,0.85);type="image/jpeg"}}
  else if(type==="application/pdf"){const t=await pdfThumb(url);thumb=t.thumb;pages=t.pages}
  else if(/sheet|excel|csv/i.test(type)||/\.(xlsx?|xlsm|ods|csv)$/i.test(file.name)){try{const X=await J.loadXLSX();const wb=X.read(await file.arrayBuffer(),{type:"array"});const rows=X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:""}).slice(0,9);pages=wb.SheetNames.length;
    const c=document.createElement("canvas");c.width=320;c.height=220;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,320,220);x.fillStyle="#1D6F42";x.fillRect(0,0,320,22);x.fillStyle="#fff";x.font="bold 12px sans-serif";x.fillText((wb.SheetNames[0]||"Sheet").slice(0,40),6,15);x.font="11px sans-serif";
    rows.forEach((r,i)=>{x.fillStyle=i===0?"#E8F2EC":i%2?"#fff":"#F7F9F8";x.fillRect(0,22+i*22,320,22);x.fillStyle="#222";r.slice(0,4).forEach((v,j)=>{x.fillText(String(v).slice(0,12),4+j*80,37+i*22)});x.strokeStyle="#ddd";x.beginPath();x.moveTo(0,44+i*22);x.lineTo(320,44+i*22);x.stroke()});
    for(let j=1;j<4;j++){x.beginPath();x.moveTo(j*80,22);x.lineTo(j*80,220);x.stroke()}thumb=c.toDataURL("image/jpeg",0.75)}catch(e){}}
  const b64=url.split(",")[1];const fid="f-"+uid();const of=Math.ceil(b64.length/CH)||1;
  for(let i=0;i<of;i++){onStep&&onStep(i+1,of);await J.store.put(col,{id:fid+"-"+i,fid,i,of,data:b64.slice(i*CH,(i+1)*CH)})}
  return {fid,col,name:file.name,type,size:Math.round(b64.length*0.75),of,thumb,pages,at:Date.now(),by:S.me?.name||S.me?.email||""}};
J.fileBlob=async f=>{const parts=await J.fetchWhere(f.col||"files","fid",f.fid);if(parts.length<(f.of||1))throw new Error("This file is incomplete — attach it again");const b64=parts.sort((a,b)=>a.i-b.i).map(x=>x.data).join("");const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:f.type})};
J.fileDrop=async f=>{try{const parts=await J.fetchWhere(f.col||"files","fid",f.fid);for(const p of parts)await J.store.del(f.col||"files",p.id)}catch(e){}};
// thumbnails grid; each opens the full document
// records that live inside a settings document (licences, service plans, repair log…) register a host so they can carry documents too
J.docHosts=J.docHosts||{};const getR=(col,id)=>J.docHosts[col]?J.docHosts[col].get(id):J.get(col,id);
const patchR=async(col,id,p)=>{if(J.docHosts[col])return J.docHosts[col].patch(id,p);await J.store.patch(col,id,p);if(S.c[col]?.get(id))S.c[col].set(id,{...S.c[col].get(id),...p})};
J.docGet=getR;J.docPatch=patchR;
const SHEET=/sheet|excel|spreadsheet|csv|\.(xlsx?|xlsm|ods|csv)$/i;const isSheet=f=>SHEET.test(f.type||"")||SHEET.test(f.name||"");
J.thumbsHtml=(list,opt={})=>`<div class="thumbs">${(list||[]).map((f,i)=>`<figure class="thumb"><button type="button" class="thumb-img" data-a="fileView" data-src="${esc(opt.src||"")}" data-x="${esc(opt.owner||"")}" data-i="${i}" aria-label="Open ${esc(f.cat||f.name)}">${f.thumb?`<img src="${f.thumb}" alt="">`:`<span class="thumb-ph ${isSheet(f)?"xls":/pdf/.test(f.type)?"pdf":""}">${isSheet(f)?"XLS":/pdf/.test(f.type)?"PDF":"FILE"}</span>`}</button><figcaption><b>${esc(f.cat||"Document")}</b><span class="hint">${esc(f.name)}${f.pages?" · "+f.pages+" page"+(f.pages>1?"s":""):""}</span>${opt.del?`<button type="button" class="linkbtn danger" data-a="${opt.del}" data-x="${esc(opt.owner||"")}" data-i="${i}">Remove</button>`:""}</figcaption></figure>`).join("")||`<p class="muted" style="margin:0">${esc(opt.empty||"Nothing attached yet.")}</p>`}</div>`;
// where each kind of owner keeps its list of files
const SRC={staff:id=>({rec:J.get("accounts",id),col:"accounts",key:"docs"}),policy:id=>({rec:J.get("policies",id),col:"policies",key:"files",fcol:"polfiles"})};
SRC.rec=o=>{const k=o.indexOf("|");const c=o.slice(0,k),i=o.slice(k+1);return {rec:getR(c,i),col:c,key:"docs"}};
J.fileSrc=SRC;
// ---------- supporting documents on any record (entries, ledgers, stock, assets, policies, clients, contacts, trades, menu) ----------
J.docsPanel=(col,id,title)=>{if(J.limited?.()||J.isCC?.())return "";const r=getR(col,id);const docs=r?.docs||[];const key=col+"|"+id;const dom=("dp-"+col+"-"+id).replace(/[^\w-]/g,"_");
  return `<section class="docs-panel" id="${dom}"><h3 class="ph" style="padding:6px 0 0">${esc(title||"Supporting documents")} ${docs.length?`<span class="chip plain">${docs.length}</span>`:""}</h3>
  <div class="row" style="flex-wrap:wrap;gap:8px;align-items:flex-end;margin-top:6px"><label class="f">Describe<input id="${dom}-cat" placeholder="Bill, receipt, quotation, warranty…" list="doc-kinds" style="min-width:200px"></label><datalist id="doc-kinds">${["Bill / invoice","Payment receipt","Quotation","Delivery challan","Warranty card","Agreement","Bank proof","Photo","Claim form","Survey report","Statement","Other"].map(x=>`<option value="${x}">`).join("")}</datalist>
  <label class="btn w" style="cursor:pointer">📎 Attach file<input type="file" multiple accept="image/*,application/pdf,.xls,.xlsx,.xlsm,.ods,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" data-ach="docAdd" data-x="${esc(key)}" id="${dom}-f" style="display:none"></label><label class="btn" style="cursor:pointer">📷 Take photo<input type="file" accept="image/*" capture="environment" data-ach="docAdd" data-x="${esc(key)}" id="${dom}-c" style="display:none"></label><span id="${dom}-p" class="hint"></span></div>
  ${J.thumbsHtml(docs,{src:"rec",owner:key,del:"docDel",empty:"No supporting documents yet."})}</section>`};
const repaint=(col,id)=>{const dom=("dp-"+col+"-"+id).replace(/[^\w-]/g,"_");const el=document.getElementById(dom);if(el)el.outerHTML=J.docsPanel(col,id,el.querySelector("h3")?.firstChild?.textContent?.trim());J.render()};
const splitKey=k=>{const i=k.indexOf("|");return [k.slice(0,i),k.slice(i+1)]};
J.act("docAdd",async el=>{const fs=[...(el.files||[])];if(!fs.length)return;const [col,id]=splitKey(el.dataset.x);const dom=("dp-"+col+"-"+id).replace(/[^\w-]/g,"_");const cat=(document.getElementById(dom+"-cat")?.value||"").trim();const prog=document.getElementById(dom+"-p");const add=[];
  const ok=await J.safe(async()=>{for(const f of fs){const x=await J.fileSave(f,"files",(i,n)=>{if(prog)prog.textContent="Saving "+f.name+" ("+i+"/"+n+")…"});add.push({...x,cat:cat||(/^image/.test(x.type)?"Photo":"Document")})}
    const cur=getR(col,id);const docs=[...(cur?.docs||[]),...add];await patchR(col,id,{docs,docsAt:Date.now()})},add.length>1?add.length+" files attached":"Attached");
  if(ok)repaint(col,id)});
J.act("docDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to remove";return}const [col,id]=splitKey(el.dataset.x);const cur=getR(col,id);const i=+el.dataset.i;const f=cur?.docs?.[i];if(!f)return;await J.fileDrop(f);const docs=cur.docs.filter((_,k)=>k!==i);
  if(await J.safe(()=>patchR(col,id,{docs,docsAt:Date.now()}),"Removed"))repaint(col,id)});
// attach files straight from a form (e.g. the receipt while recording a renewal)
J.attachFiles=async(col,id,files,cat)=>{const add=[];for(const f of [...(files||[])]){const x=await J.fileSave(f,"files");add.push({...x,cat:cat||(/^image/.test(x.type)?"Photo":isSheet(x)?"Sheet":"Document")})}if(!add.length)return 0;const cur=getR(col,id);await patchR(col,id,{docs:[...(cur?.docs||[]),...add],docsAt:Date.now()});return add.length};
J.attachInput=(id,label)=>`<label class="f">${label||"Attach documents (photo, PDF, Excel)"}<input type="file" id="${id}" multiple accept="image/*,application/pdf,.xls,.xlsx,.xlsm,.ods,.csv"></label>`;
// compact thumbnail strip for cards and table rows; click opens the large view
J.miniThumbs=(col,id,docs)=>(docs||[]).length?`<div class="thumbs mini">${docs.map((f,i)=>`<button type="button" class="thumb-img" data-a="fileView" data-src="rec" data-x="${esc(col+"|"+id)}" data-i="${i}" title="${esc((f.cat||"")+" · "+f.name)}" aria-label="Open ${esc(f.cat||f.name)}">${f.thumb?`<img src="${f.thumb}" alt="">`:`<span class="thumb-ph ${isSheet(f)?"xls":/pdf/.test(f.type)?"pdf":""}">${isSheet(f)?"XLS":/pdf/.test(f.type)?"PDF":"FILE"}</span>`}</button>`).join("")}</div>`:"";
J.docsDrawer=(col,id,title)=>J.drawer({title:"📎 "+(title||"Supporting documents"),wide:true,body:J.docsPanel(col,id,"Supporting documents")});
J.act("docsOpen",el=>{const [col,id]=splitKey(el.dataset.x);J.docsDrawer(col,id,el.dataset.t||"")});
// small button for list rows: shows the count, opens the documents
J.docsBtn=(col,r,title)=>J.limited?.()||J.isCC?.()?"":`<button type="button" class="btn small ${(r.docs||[]).length?"w":""}" data-a="docsOpen" data-x="${esc(col+"|"+r.id)}" data-t="${esc(title||r.name||r.no||"")}" title="Supporting documents" aria-label="Supporting documents${(r.docs||[]).length?" ("+r.docs.length+")":""}">📎${(r.docs||[]).length?" "+r.docs.length:""}</button>`;
let lbUrl=null;
function closeLb(){document.getElementById("lightbox")?.remove();if(lbUrl){URL.revokeObjectURL(lbUrl);lbUrl=null}document.removeEventListener("keydown",lbKey)}
function lbKey(e){if(e.key==="Escape")closeLb()}
J.fileView=async(f,title)=>{closeLb();const box=document.createElement("div");box.id="lightbox";box.className="lightbox";box.setAttribute("role","dialog");box.setAttribute("aria-label",title||f.name);
  box.innerHTML=`<div class="lb-bar"><b>${esc(title||f.cat||f.name)}</b><span class="hint">${esc(f.name)}</span><span style="margin-left:auto" class="row"><a class="btn small" id="lb-open" target="_blank" rel="noopener" hidden>Open in new tab</a><a class="btn small" id="lb-dl" hidden>Download</a><button type="button" class="btn small" id="lb-x">Close ✕</button></span></div><div class="lb-body" id="lb-body"><p class="hint" style="color:#fff">Loading…</p></div>`;
  document.body.appendChild(box);box.querySelector("#lb-x").onclick=closeLb;box.addEventListener("click",e=>{if(e.target===box||e.target.id==="lb-body")closeLb()});document.addEventListener("keydown",lbKey);
  try{const blob=await J.fileBlob(f);lbUrl=URL.createObjectURL(blob);const body=box.querySelector("#lb-body");
    if(isSheet(f)){try{const X=await J.loadXLSX();const wb=X.read(await blob.arrayBuffer(),{type:"array"});const show=n=>{body.querySelector(".lb-sheet").innerHTML=X.utils.sheet_to_html(wb.Sheets[n],{header:"",footer:""}).replace(/^[\s\S]*?<table/,"<table").replace(/<\/table>[\s\S]*$/,"</table>");body.querySelectorAll("[data-sh]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.sh===n)))};
        body.innerHTML=`<div class="lb-xls">${wb.SheetNames.length>1?`<div class="seg" style="margin-bottom:8px">${wb.SheetNames.map(n=>`<button type="button" data-sh="${esc(n)}">${esc(n)}</button>`).join("")}</div>`:""}<div class="lb-sheet"></div></div>`;body.querySelectorAll("[data-sh]").forEach(b=>b.onclick=e=>{e.stopPropagation();show(b.dataset.sh)});show(wb.SheetNames[0])}catch(e){body.innerHTML=`<p style="color:#fff">Could not read the sheet — use Download.</p>`}}
    else body.innerHTML=/^image\//.test(f.type)?`<img src="${lbUrl}" alt="${esc(f.name)}" class="lb-img">`:/pdf/.test(f.type)?`<iframe src="${lbUrl}" title="${esc(f.name)}" class="lb-pdf"></iframe>`:`<p style="color:#fff">Preview not available — use Download.</p>`;
    const o=box.querySelector("#lb-open"),d=box.querySelector("#lb-dl");o.href=lbUrl;o.hidden=false;d.href=lbUrl;d.download=f.name;d.hidden=false}
  catch(e){box.querySelector("#lb-body").innerHTML=`<p style="color:#fff">${esc(e.message||"Could not open the file")}</p>`}};
J.act("fileView",el=>{const s=SRC[el.dataset.src]?.(el.dataset.x);const f0=s?.rec?.[s.key]?.[+el.dataset.i];const f=f0&&{col:s.fcol||"files",...f0};if(f)J.fileView(f,(s.rec.name||s.rec.type||"")+" · "+(f.cat||f.name))});

// ---------- Google Drive backup ----------
// The signed-in Google account grants this app access to the files it creates in Drive (drive.file scope only).
// Every change to the book is backed up a couple of minutes later: one "latest" file, plus one file per day.
const DS="https://www.googleapis.com/auth/drive.file";const TK="jcgg-drive-token";
const tok=()=>{try{const t=JSON.parse(sessionStorage.getItem(TK)||"null");return t&&t.exp>Date.now()+60e3?t.t:null}catch(e){return null}};
const meta=()=>J.get("meta","driveSync")||{};
let dirty=false,timer=null,running=false,lastErr="",lastFix="";
J.driveStatus=()=>{const m=meta();return {on:!!tok(),last:m.lastAt,by:m.by,err:lastErr,fix:lastFix,folder:m.folderId}};
function paint(){const el=document.getElementById("driveState");if(!el)return;el.hidden=!!(J.limited?.()||J.isCC?.());if(el.hidden)return;const st=J.driveStatus();el.textContent=st.on?(running?"Drive: backing up…":st.last?"Drive backup "+new Date(st.last).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"Drive: connected"):(lastErr?"Drive backup paused — tap":"Back up to Drive — tap");el.title=st.on?"Backed up to Google Drive (JCGG Suite Backups)":"Connect Google Drive to back up automatically"}
J.driveConnect=async()=>{const p=new firebase.auth.GoogleAuthProvider();p.addScope(DS);p.setCustomParameters({login_hint:S.me?.email||""});
  try{const u=firebase.auth().currentUser;const r=u?await u.reauthenticateWithPopup(p):await firebase.auth().signInWithPopup(p);const t=r.credential?.accessToken;if(!t)throw new Error("Google did not return Drive access");sessionStorage.setItem(TK,JSON.stringify({t,exp:Date.now()+55*60e3}));lastErr="";paint();await J.driveBackup(true);return true}
  catch(e){lastErr=e.message||e.code||"cancelled";paint();toast("Drive not connected: "+(e.code==="auth/popup-blocked"?"allow pop-ups for this site":lastErr));return false}};
async function api(path,opt={}){const t=tok();if(!t)throw new Error("Drive not connected");const r=await fetch("https://www.googleapis.com/"+path,{...opt,headers:{Authorization:"Bearer "+t,...(opt.headers||{})}});if(r.status===401){sessionStorage.removeItem(TK);throw new Error("Drive access expired — reconnect")}if(!r.ok){let j={};try{j=await r.json()}catch(e){}const er=j.error||{};const why=(er.errors||[])[0]?.reason||(er.details||[]).find(d=>d.reason)?.reason||er.status||"";const pid=firebase.app().options.projectId;
    if(/accessNotConfigured|SERVICE_DISABLED/i.test(why+" "+er.message))throw Object.assign(new Error("Google Drive API is switched off for this app's Google project. Turn it on once, then tap again."),{fix:"https://console.cloud.google.com/apis/library/drive.googleapis.com?project="+pid});
    if(/insufficient|ACCESS_TOKEN_SCOPE_INSUFFICIENT|PERMISSION_DENIED/i.test(why+" "+er.status)){sessionStorage.removeItem(TK);throw new Error("Drive permission was not given. Tap again and tick the Google Drive box on Google's screen.")}
    throw new Error("Drive error "+r.status+(er.message?": "+er.message:""))}return r.status===204?null:r.json()}
async function ensureFolder(){const m=meta();if(m.folderId){try{const f=await api("drive/v3/files/"+m.folderId+"?fields=id,trashed");if(f&&!f.trashed)return m.folderId}catch(e){if(/expired|connected/.test(e.message))throw e}}
  const f=await api("drive/v3/files?fields=id",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"JCGG Suite Backups",mimeType:"application/vnd.google-apps.folder"})});await J.store.patch("meta","driveSync",{folderId:f.id});return f.id}
async function putFile(id,name,folder,body){const b="jcgg"+uid();const metaPart=id?{name}:{name,parents:[folder],mimeType:"application/json"};
  const data=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metaPart)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
  try{return await api("upload/drive/v3/files"+(id?"/"+id:"")+"?uploadType=multipart&fields=id",{method:id?"PATCH":"POST",headers:{"Content-Type":"multipart/related; boundary="+b},body:data})}catch(e){if(id&&/404/.test(e.message))return putFile(null,name,folder,body);throw e}}
J.driveBackup=async manual=>{if(!tok()){paint();if(manual)return J.driveConnect();return}if(running){dirty=true;return}running=true;dirty=false;paint();
  try{const folder=await ensureFolder();const o={exported:new Date().toISOString(),app:"JCGG Suite",version:2,by:S.me?.email||""};for(const k of J.DATA_KEYS)o[k]=J.all(k);const body=JSON.stringify(o);const m=meta();const day=today();
    const latest=await putFile(m.latestId,"jcgg-suite-latest.json",folder,body);const daily=await putFile(m.days?.[day],"jcgg-suite-"+day+".json",folder,body);
    await J.store.patch("meta","driveSync",{folderId:folder,latestId:latest.id,days:{[day]:daily.id},lastAt:Date.now(),by:S.me?.name||S.me?.email||"",size:body.length});lastErr="";if(manual)toast("Backed up to Google Drive · JCGG Suite Backups")}
  catch(e){lastErr=e.message;lastFix=e.fix||"";if(manual)toast(e.message)}finally{running=false;paint();if(dirty)schedule()}};
function schedule(){clearTimeout(timer);timer=setTimeout(()=>J.driveBackup(false),120e3)}
// any saved change marks the book dirty; the backup follows two minutes after the last change
const put0=J.store.put,patch0=J.store.patch,del0=J.store.del;
const keepDocs=(c,d)=>{const cur=c!=="kots"&&S.c[c]?.get?.(d.id);if(cur&&cur.docs&&(cur.docsAt||0)>(d.docsAt||0)){d={...d,docs:cur.docs,docsAt:cur.docsAt}}else if(cur&&cur.docs&&d.docs===undefined){d={...d,docs:cur.docs,docsAt:cur.docsAt||0}}return d};
const mark=col=>{if(col!=="files"&&col!=="polfiles"&&!(col==="meta"))if(tok()){dirty=true;schedule()}};
J.store.put=async(c,d)=>{d=keepDocs(c,d);const r=await put0(c,d);mark(c);return r};J.store.patch=async(c,i,p)=>{const r=await patch0(c,i,p);if(!(c==="meta"&&i==="driveSync"))mark(c);return r};J.store.del=async(c,i)=>{const r=await del0(c,i);mark(c);return r};
J.act("driveSync",()=>J.driveBackup(true));
setInterval(paint,30e3);document.addEventListener("DOMContentLoaded",paint);setTimeout(paint,1500);
})();
