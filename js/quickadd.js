/* Quick add / edit / remove from any picker.
   Every item list and every ledger list (vendor, bank, card, wallet, cash, expense head…) ends with
   "＋ Add new…" and "✎ Edit / remove selected…". Choosing either opens a small window on top of the
   form you are in, so a new item, vendor, bank, card or wallet can be created without leaving the bill.
   After saving, every matching picker on the screen is refreshed and the new record is selected. */
(()=>{
const J=window.J,{esc,toast,uid}=J;
const QK=["vendor","cash","bank","card","wallet","customer","expense","income","aggregator","tax","loan","capital","asset","invest","deprec","deppaid"];
const addable=kinds=>(kinds||[]).filter(k=>QK.includes(k));
J.qaOpts=(type,kinds)=>{const ks=type==="item"?[]:addable(kinds);if(type!=="item"&&!ks.length)return "";
  const key=type==="item"?"item":ks.join(",");
  return `<optgroup label="──────────"><option value="__new__" data-qa="${type}" data-qk="${esc(key)}">＋ Add new ${type==="item"?"item":ks.length===1?(J.KINDS[ks[0]]?.l||"").toLowerCase().replace(/ \/.*$/,""):ks.every(k=>J.MONEY.includes(k))?"bank / card / wallet / cash":"ledger (vendor, bank, card, wallet…)"}…</option><option value="__edit__" data-qa="${type}" data-qk="${esc(key)}">✎ Edit / remove selected…</option></optgroup>`};

// remember the value before the user picks one of the special options
document.addEventListener("focusin",e=>{const s=e.target;if(s?.tagName==="SELECT"&&s.querySelector('option[value="__new__"]'))s.dataset.prev=s.value},true);
document.addEventListener("change",e=>{const s=e.target;if(s?.tagName!=="SELECT")return;const v=s.value;if(v!=="__new__"&&v!=="__edit__"){s.dataset.prev=v;return}
  e.stopImmediatePropagation();const o=s.selectedOptions[0];const type=o.dataset.qa,key=o.dataset.qk;const prev=s.dataset.prev||"";s.value=prev;
  if(v==="__edit__"&&!prev){toast("Choose an entry first, then pick ✎ Edit.");return}
  open(type,key,v==="__edit__"?prev:null,s)},true);

function refreshPickers(type,key,newId,origin){
  document.querySelectorAll("select").forEach(sel=>{const o=sel.querySelector('option[value="__new__"]');if(!o||o.dataset.qa!==type||o.dataset.qk!==key)return;
    const keep=sel===origin?newId:sel.value;const blank=sel.querySelector('option[value=""]')?.textContent;
    sel.innerHTML=type==="item"?J.itemOpts(keep):J.optAcc(key.split(","),keep,blank!=null?blank:undefined);sel.value=keep||"";sel.dataset.prev=sel.value;
    if(sel===origin)sel.dispatchEvent(new Event("change",{bubbles:true}))})}

function close(){document.getElementById("qa-ov")?.remove()}
function open(type,key,id,origin){close();const isItem=type==="item";const rec=id?J.get(isItem?"items":"accounts",id):null;const kinds=isItem?[]:key.split(",");
  const U=J.INV?.UNITS||["KG","GM","LTR","ML","PCS","PKT","BOX"],C=J.INV?.CATS||["Other"];
  const used=id?(isItem?J.all("moves").some(m=>(m.lines||[]).some(l=>l.item===id)):(J.D.post?.get(id)||[]).length>0):false;
  const sys=!isItem&&rec?.sys;
  const body=isItem?`<label class="f">Item name<input id="qa-name" value="${esc(rec?.name||"")}" placeholder="e.g. Amul Butter 500 g"></label>
      <div class="form"><label class="f">Unit<select id="qa-unit">${U.map(u=>`<option ${(rec?.unit||"PCS")===u?"selected":""}>${u}</option>`).join("")}</select></label>
      <label class="f">Category<select id="qa-cat">${C.map(c=>`<option ${(rec?.cat||"Other")===c?"selected":""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="f">GST %<select id="qa-gst">${["0","5","12","18","28"].map(g=>`<option ${String(rec?.gst??0)===g?"selected":""}>${g}</option>`).join("")}</select></label></div>`
    :`<label class="f">Name<input id="qa-name" value="${esc(rec?.name||"")}" placeholder="e.g. HDFC Bank — Current a/c, SBI Card 1234, Paytm wallet, Sharma Traders"></label>
      <div class="form"><label class="f">Type<select id="qa-kind" ${sys?"disabled":""}>${[...new Set([...(rec?[rec.kind]:[]),...kinds.filter(k=>QK.includes(k))])].map(k=>`<option value="${k}" ${(rec?.kind||kinds.find(x=>QK.includes(x)))===k?"selected":""}>${esc(J.KINDS[k]?.l||k)}</option>`).join("")}</select></label>
      ${rec?"":`<label class="f">Opening balance ₹ (optional)<input id="qa-open" type="number" step="any" placeholder="0"></label>`}
      <label class="f">Phone / account no. / card last 4 (optional)<input id="qa-ref" value="${esc(rec?.ref||rec?.phone||"")}"></label></div>`;
  const ov=document.createElement("div");ov.id="qa-ov";ov.className="qa-ov";
  ov.innerHTML=`<div class="qa-box" role="dialog" aria-modal="true" aria-label="${rec?"Edit":"Add"}"><h3>${rec?"Edit":"Add new"} ${isItem?"item":"ledger"}</h3>${body}
    ${rec?`<p class="hint" style="margin:6px 0 0">${used?`This ${isItem?"item":"ledger"} is used in saved entries, so it can be hidden from lists but not deleted.`:"Not used anywhere yet — it can be deleted."}${sys?" System ledger: only the name can be changed.":""}</p>`:""}
    <div class="row" style="justify-content:space-between;margin-top:12px">${rec&&!sys?`<button type="button" class="btn small danger" id="qa-del">${used?"Hide from lists":"Delete"}</button>`:"<span></span>"}<span class="row" style="gap:8px"><button type="button" class="btn w" id="qa-x">Cancel</button><button type="button" class="btn primary" id="qa-ok">${rec?"Save":"Add"}</button></span></div></div>`;
  document.body.appendChild(ov);setTimeout(()=>ov.querySelector("#qa-name")?.focus(),30);
  ov.addEventListener("click",e=>{if(e.target===ov)close()});ov.querySelector("#qa-x").onclick=close;
  ov.addEventListener("keydown",e=>{if(e.key==="Escape")close();if(e.key==="Enter"&&e.target.tagName==="INPUT"){e.preventDefault();ov.querySelector("#qa-ok").click()}});
  const col=isItem?"items":"accounts";
  const setCache=d=>{try{J.S.c[col].set(d.id,d)}catch(e){}};
  ov.querySelector("#qa-ok").onclick=async()=>{const name=ov.querySelector("#qa-name").value.trim();if(!name){toast("Enter a name.");return}
    const dup=J.all(col).find(x=>x.name.toLowerCase()===name.toLowerCase()&&x.id!==id);if(dup&&!rec){refreshPickers(type,key,dup.id,origin);close();toast("“"+dup.name+"” already exists — selected it.");return}
    let d;if(isItem){d={...(rec||{id:uid(),active:true,reorder:0}),name,unit:ov.querySelector("#qa-unit").value,cat:ov.querySelector("#qa-cat").value,gst:+ov.querySelector("#qa-gst").value}}
    else{const kind=sys?rec.kind:ov.querySelector("#qa-kind").value;const ref=ov.querySelector("#qa-ref").value.trim();d={...(rec||{id:kind+"-"+uid(),opening:+(ov.querySelector("#qa-open")?.value)||0,active:true}),name,kind,...(ref?{ref}:{})}}
    const ok=await J.safe(()=>J.store.put(col,d));if(!ok)return;setCache(d);close();refreshPickers(type,key,d.id,origin);toast((rec?"Updated ":"Added ")+"“"+name+"”")};
  ov.querySelector("#qa-del")?.addEventListener("click",async()=>{if(used){const d={...rec,active:false};await J.safe(()=>J.store.put(col,d));setCache(d);toast("“"+rec.name+"” hidden from lists (history kept)")}
    else{await J.safe(()=>J.store.del(col,id));try{J.S.c[col].delete(id)}catch(e){}toast("Deleted “"+rec.name+"”")}
    close();refreshPickers(type,key,"",origin)})}
J.quickAdd=open;
})();
