/* Picture picker shared by Inventory and Kitchen: drag a picture from a search page (Hyperpure, Google Images)
   onto a [data-pic] card, or copy the image and paste it there. Every picture is centre-cropped and saved at the
   card's exact size (data-pic-size, e.g. 400 → strictly 400 × 400 JPEG). */
(()=>{
const J=window.J,{toast}=J;
const toSquare=(img,s)=>{const c=document.createElement("canvas");c.width=c.height=s;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,s,s);const m=Math.min(img.naturalWidth,img.naturalHeight);x.imageSmoothingQuality="high";x.drawImage(img,(img.naturalWidth-m)/2,(img.naturalHeight-m)/2,m,m,0,0,s,s);return c.toDataURL("image/jpeg",0.85)};
const load=(src,cors)=>new Promise((res,rej)=>{const i=new Image();if(cors)i.crossOrigin="anonymous";i.onload=()=>res(i);i.onerror=()=>rej(new Error("load"));i.src=src});
const fromFile=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>load(r.result).then(res,rej);r.onerror=rej;r.readAsDataURL(f)});
J.picFit=async(srcOrFile,s)=>{const img=typeof srcOrFile==="string"?await load(srcOrFile,!/^data:/.test(srcOrFile)):await fromFile(srcOrFile);try{return {data:toSquare(img,s),w:img.naturalWidth,h:img.naturalHeight}}catch(e){throw new Error("blocked")}};
const srcFrom=dt=>{const h=dt.getData("text/html");if(h){const m=h.match(/<img[^>]+src=["']([^"']+)["']/i);if(m&&/^(https?:|data:image)/.test(m[1]))return m[1].replace(/&amp;/g,"&")}
  const u=(dt.getData("text/uri-list")||dt.getData("text/plain")||"").split(/\s+/).find(x=>/^https?:\/\//.test(x));if(!u)return "";
  try{const q=new URL(u);const iu=q.searchParams.get("imgurl");if(iu)return iu}catch(e){}return u};
async function save(card,src){const col=card.dataset.picCol||"items",id=card.dataset.pic,s=+card.dataset.picSize||0;const rec=J.get(col,id);if(!rec)return;
  let img=src;if(s){card.classList.add("busy");try{const r=await J.picFit(src,s);img=r.data;if(Math.min(r.w,r.h)<s)toast(`Saved at ${s}×${s}, but the original was only ${r.w}×${r.h} — pick a larger picture for a sharper look.`)}
    catch(e){card.classList.remove("busy");if(!card.dataset.picStrict&&typeof src==="string"&&/^https?:/.test(src)){await J.store.patch(col,id,{img:src});toast("Picture saved for "+(rec.name||"item"));return}toast("That site doesn't allow the picture to be resized here. Right-click the picture → Copy image, then click the box and press Ctrl+V.");return}card.classList.remove("busy")}
  await J.store.patch(col,id,{img,imgSize:s||0});toast("Picture saved for "+(rec.name||"item")+(s?` (${s}×${s})`:""))}
async function take(card,dt){const f=[...(dt.files||[])].find(f=>/^image\//.test(f.type));if(f)return save(card,f);const s=srcFrom(dt);if(s)return save(card,s);toast("That was not a picture. Drag the photo itself, or copy the image and paste it.")}
document.addEventListener("dragover",e=>{const c=e.target.closest?.("[data-pic]");if(c){e.preventDefault();c.classList.add("over")}});
document.addEventListener("dragleave",e=>{e.target.closest?.("[data-pic]")?.classList.remove("over")});
document.addEventListener("drop",e=>{const c=e.target.closest?.("[data-pic]");if(!c)return;e.preventDefault();c.classList.remove("over");take(c,e.dataTransfer)});
document.addEventListener("paste",e=>{const c=document.activeElement?.closest?.("[data-pic]");if(!c)return;e.preventDefault();take(c,e.clipboardData)});
document.addEventListener("click",e=>{const b=e.target.closest?.(".pic-box");if(b)b.closest("[data-pic]")?.focus()});
J.act("picFile",async el=>{const f=el.files?.[0];const c=el.closest("[data-pic]");if(f&&c)await save(c,f)});
J.act("picClear",async el=>{const c=el.closest("[data-pic]");await J.store.patch(c.dataset.picCol||"items",c.dataset.pic,{img:""});toast("Picture removed")});
J.act("picOpen",(el,e)=>{e?.preventDefault?.();const w=Math.min(760,Math.round(screen.availWidth/2));window.open(el.href,"picsearch",`width=${w},height=${screen.availHeight-80},left=${screen.availWidth-w},top=0`)});
J.picCard=({id,col,size,strict,name,img,meta,search,searchLabel,extra})=>`<div class="pic-card" data-pic="${id}" data-pic-col="${col}" ${size?`data-pic-size="${size}"`:""} ${strict?"data-pic-strict=\"1\"":""} tabindex="0" aria-label="Picture for ${J.esc(name)} — drop or paste a picture here">
  <div class="pic-box">${img?`<img src="${J.esc(img)}" alt="">`:`<span>Drop or paste<br>picture here</span>`}</div>
  <div class="pic-meta"><b>${J.esc(name)}</b>${meta?`<span class="hint">${meta}</span>`:""}
   <div class="row" style="gap:6px;flex-wrap:wrap"><a class="btn small" href="${J.esc(search)}" target="picsearch" rel="noopener" data-a="picOpen">${searchLabel} ↗</a><label class="btn small">Photo<input type="file" accept="image/*" hidden data-ach="picFile"></label>${img?`<button class="btn small" data-a="picClear">Remove</button>`:""}</div>${extra||""}</div></div>`;
})();
