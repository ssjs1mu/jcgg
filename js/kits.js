/* Promotions → Concept kits.  Every promotion concept registers itself with J.promoConcept({id,label,file,desc,render,settings,link}); this screen gives each
   one a dropdown entry, then lets you pick a colour set (4 vibrant gradients) and a size (banner, standee, 1.5×2 ft poster, A4, A5, Instagram, Facebook),
   preview, download (print 2×) or save to files — one picture, a whole colour's kit, or one size in every colour. */
(()=>{
const J=window.J,{S,esc,toast}=J;const KIT=window.KIT;const concepts=[];
J.promoConcept=c=>{const i=concepts.findIndex(x=>x.id===c.id);if(i>=0)concepts[i]=c;else concepts.push(c)};
const ui=()=>J.ui("kit",{c:"",pal:"gold",size:"standee"});
const cur=()=>{const U=ui();const C=concepts.find(c=>c.id===U.c)||concepts[0];const sz=KIT.SIZES.find(s=>s.id===U.size)||KIT.SIZES[0];const pal=KIT.PALS.find(p=>p.id===U.pal)||KIT.PALS[0];return {U,C,sz,pal}};
J.vKits=()=>{const {U,C,sz,pal}=cur();if(!C)return `<p class="hint">No promotion concepts yet.</p>`;U.c=C.id;
  const sw=p=>`<button type="button" class="btn small" data-set="kit.pal=${p.id}" aria-pressed="${p.id===pal.id}" title="${esc(p.name)}" style="display:inline-flex;align-items:center;gap:6px;${p.id===pal.id?"outline:2px solid var(--ink,#222);":""}"><span style="width:44px;height:18px;border-radius:9px;background:linear-gradient(90deg,${p.bg.join(",")});border:1px solid rgba(0,0,0,.25)"></span>${esc(p.name)}</button>`;
  return `<div class="filters" style="gap:10px;flex-wrap:wrap"><label class="row" style="gap:6px"><b>Concept</b><select data-ui="kit.c" aria-label="Promotion concept">${concepts.map(c=>`<option value="${esc(c.id)}" ${c.id===C.id?"selected":""}>${esc(c.label)}</option>`).join("")}</select></label>
   <label class="row" style="gap:6px"><b>Size</b><select data-ui="kit.size" aria-label="Size">${KIT.SIZES.map(s=>`<option value="${s.id}" ${s.id===sz.id?"selected":""}>${esc(s.label)}</option>`).join("")}</select></label></div>
  <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0"><b>Colours</b>${KIT.PALS.map(sw).join("")}</div>
  <p class="hint" style="margin:4px 0 8px">${esc(C.desc||"")}${C.link?` <a href="#${C.link.mod}-${C.link.tab}" data-go="${C.link.mod}" data-tab="${C.link.tab}">${esc(C.link.label)}</a>`:""}</p>
  <div class="promo-grid" style="align-items:start"><section class="panel pb"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px"><b>${esc(sz.label)} · ${esc(pal.name)}</b><span class="row" style="gap:6px;flex-wrap:wrap"><button class="btn w small" data-a="kitPng">⬇ Download (print 2×)</button><button class="btn small" data-a="kitSave">Save to files</button></span></div>
    <div style="margin-top:8px;text-align:center"><canvas id="kit-cv" style="max-width:100%;max-height:75vh;border-radius:8px" aria-label="Preview"></canvas></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn small" data-a="kitBulk" data-x="sizes">Save all sizes in ${esc(pal.name)}</button><button class="btn small" data-a="kitBulk" data-x="pals">Save ${esc(sz.label.split(" · ")[0])} in all 4 colours</button><span class="hint" id="kit-prog"></span></div></section>
  <section class="panel pb">${C.settings?C.settings():""}</section></div>`};
async function draw(cv,C,size,pal,scale){return C.render(cv,{size,pal,scale})}
let busy=false,again=false;async function preview(){if(busy){again=true;return}busy=true;try{do{again=false;const {C,sz,pal}=cur();const cv=document.getElementById("kit-cv");if(cv&&C)await draw(cv,C,sz.id,pal.id,Math.min(1,1000/Math.max(sz.w,sz.h)))}while(again)}catch(e){console.warn(e);toast(e.message||"Could not draw the picture")}finally{busy=false}}
J.kitRedraw=preview;J.afterRender.push(m=>{if(m==="promo"&&S.route.tab==="kits")preview()});
const blobOf=async(C,size,pal,sc)=>{const cv=document.createElement("canvas");await draw(cv,C,size,pal,sc);return new Promise(r=>cv.toBlob(r,"image/png"))};
const fname=(C,size,pal)=>(C.file||C.id)+"-"+size+"-"+pal+".png";
J.act("kitPng",async el=>{const {C,sz,pal}=cur();try{el.disabled=true;const b=await blobOf(C,sz.id,pal.id,2);const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=fname(C,sz.id,pal.id);a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}catch(e){toast(e.message||"Could not make the picture")}finally{el.disabled=false}});
J.act("kitSave",async el=>{const {C,sz,pal}=cur();try{el.disabled=true;const b=await blobOf(C,sz.id,pal.id,1);await J.fileSave(new File([b],fname(C,sz.id,pal.id),{type:"image/png"}),"files");toast("Saved to files"+(J.driveReady?.()?" and Google Drive":""))}catch(e){toast(e.message||"Could not save")}finally{el.disabled=false}});
J.act("kitBulk",async el=>{const {C,sz,pal}=cur();const list=el.dataset.x==="sizes"?KIT.SIZES.map(s=>[s.id,pal.id]):KIT.PALS.map(p=>[sz.id,p.id]);const pr=document.getElementById("kit-prog");try{el.disabled=true;let n=0;for(const [s,p] of list){if(pr)pr.textContent=`Saving ${++n} of ${list.length}…`;const b=await blobOf(C,s,p,1);await J.fileSave(new File([b],fname(C,s,p),{type:"image/png"}),"files")}if(pr)pr.textContent="";toast(list.length+" pictures saved to files"+(J.driveReady?.()?" and Google Drive":""))}catch(e){toast(e.message||"Could not save")}finally{el.disabled=false}});
})();
