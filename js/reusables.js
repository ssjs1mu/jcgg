/* Reusable items — decorative pieces, catering utensils and other things used now and then and sent back to storage.
   Inventory → Reusable items. The list shows only the item name with totals; clicking an item opens where it is now and its
   full shifting log. Every move (new stock, to storage, out for an event, back, lost/damaged) is one line in that log.
   Posts nothing to the books. Stored in the "meta" collection: one document per item (ritem-…) with its log, and one for the locations (stlocs). */
(()=>{
const J=window.J,{S,esc,fmtDate,today,toast,fld}=J;
const NEW="NEW",OUT="OUT",LOST="LOST";
const CATS=["Decorative","Catering utensils","Crockery & cutlery","Linen & drapes","Lighting","Furniture","Stage & props","Other"];
const items=()=>J.all("meta").filter(m=>String(m.id).startsWith("ritem-")).sort((a,b)=>a.name.localeCompare(b.name));
const locs=()=>(J.get("meta","stlocs")?.list||[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
const lname=id=>id===NEW?"New stock":id===OUT?"Out — in use":id===LOST?"Lost / damaged":(locs().find(l=>l.id===id)?.name||"(removed location)");
const num=x=>+x||0;
function stock(it){const m={};for(const e of it.log||[]){const q=num(e.qty);if(e.from!==NEW)m[e.from]=(m[e.from]||0)-q;if(e.to!==LOST)m[e.to]=(m[e.to]||0)+q}
  const rows=Object.entries(m).filter(([,q])=>Math.abs(q)>1e-9);return {rows,total:rows.reduce((s,[,q])=>s+q,0),out:m[OUT]||0,at:id=>m[id]||0}}
async function addLoc(name){name=String(name||"").trim();if(!name)return "";const ex=locs().find(l=>l.name.toLowerCase()===name.toLowerCase());if(ex)return ex.id;
  const id="loc-"+J.uid();await J.store.put("meta",{id:"stlocs",list:[...(J.get("meta","stlocs")?.list||[]),{id,name}]});return id}
const locOpts=(sel,extra)=>`<option value="">Choose…</option>${(extra||[]).map(([v,l])=>`<option value="${v}" ${v===sel?"selected":""}>${l}</option>`).join("")}${locs().map(l=>`<option value="${esc(l.id)}" ${l.id===sel?"selected":""}>${esc(l.name)}</option>`).join("")}`;

function vList(){const U=J.ui("rz",{q:"",loc:""});const w=String(U.q||"").toLowerCase().split(/\s+/).filter(Boolean);
  const L=items().map(it=>({it,s:stock(it)})).filter(x=>w.every(t=>(x.it.name+" "+(x.it.cat||"")).toLowerCase().includes(t))&&(!U.loc||x.s.at(U.loc)>0));
  const tot=L.reduce((a,x)=>a+x.s.total,0);
  return `<p class="hint" style="margin-top:0">Occasionally used items (decor, utensils). Click an item to see where it is and its full shifting log. Nothing here posts to the accounts.</p>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input data-ui="rz.q" value="${esc(U.q)}" placeholder="Search item or category…" style="max-width:240px" aria-label="Search items">
   <select data-ui="rz.loc" aria-label="Location"><option value="">All locations</option><option value="${OUT}" ${U.loc===OUT?"selected":""}>Out — in use</option>${locs().map(l=>`<option value="${esc(l.id)}" ${U.loc===l.id?"selected":""}>${esc(l.name)}</option>`).join("")}</select>
   <button class="btn primary w" data-a="rzNew">Add item</button><button class="btn w" data-a="rzLocs">Locations</button></div>
  ${L.length?`<div class="tbl-wrap"><table class="fit"><thead><tr><th>Item</th><th>Category</th><th class="r">${U.loc?"Qty here":"Total"}</th><th class="r">Out now</th><th></th></tr></thead><tbody>${L.map(({it,s})=>`<tr class="clk" data-a="rzOpen" data-x="${esc(it.id)}" tabindex="0"><td><b>${esc(it.name)}</b></td><td>${esc(it.cat||"")}</td><td class="r">${U.loc?s.at(U.loc):s.total} ${esc(it.unit||"")}</td><td class="r">${s.out?`<span class="chip warn">${s.out}</span>`:"—"}</td><td><button class="btn small w" data-a="rzMove" data-x="${esc(it.id)}">Move</button></td></tr>`).join("")}</tbody><tfoot><tr><td colspan="2"><b>${L.length} items</b></td><td class="r"><b>${tot}</b></td><td colspan="2"></td></tr></tfoot></table></div>`:`<p class="hint">${items().length?"Nothing matches.":"No items yet — press Add item."}</p>`}`}

function openItem(id){const it=J.get("meta",id);if(!it)return;const s=stock(it);const log=(it.log||[]).slice().sort((a,b)=>(b.date.localeCompare(a.date))||((b.at||0)-(a.at||0)));
  J.drawer({title:it.name,wide:true,body:`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="chip plain">${esc(it.cat||"Uncategorised")}</span><span class="chip ok">Total ${s.total} ${esc(it.unit||"")}</span>${s.out?`<span class="chip warn">${s.out} out now</span>`:""}
    <button type="button" class="btn small primary w" data-a="rzMove" data-x="${esc(id)}">Move / shift</button><button type="button" class="btn small w" data-a="rzEdit" data-x="${esc(id)}">Edit item</button></div>
   ${it.note?`<p class="hint">${esc(it.note)}</p>`:""}
   <h4 style="margin:10px 0 4px">Where it is now</h4>
   <div class="tbl-wrap"><table class="fit"><thead><tr><th>Location</th><th class="r">Qty</th></tr></thead><tbody>${s.rows.length?s.rows.sort((a,b)=>lname(a[0]).localeCompare(lname(b[0]))).map(([l,q])=>`<tr><td>${esc(lname(l))}</td><td class="r"><b>${q}</b></td></tr>`).join(""):`<tr><td colspan="2" class="hint">Nothing recorded yet.</td></tr>`}</tbody></table></div>
   <h4 style="margin:12px 0 4px">Shifting log (${log.length})</h4>
   <div class="tbl-wrap"><table class="fit"><thead><tr><th>Date</th><th class="r">Qty</th><th>From</th><th>To</th><th>Event / note</th><th>By</th></tr></thead><tbody>${log.map(e=>`<tr><td>${fmtDate(e.date)}</td><td class="r">${e.qty}</td><td>${esc(lname(e.from))}</td><td>${esc(lname(e.to))}</td><td>${esc(e.note||"")}</td><td>${esc(e.by||"")}</td></tr>`).join("")||`<tr><td colspan="6" class="hint">No movements yet.</td></tr>`}</tbody></table></div>
   <p style="margin:12px 0 0"><button type="button" class="btn small danger w" data-a="rzDel" data-x="${esc(id)}">Delete this item</button></p>`})}

function itemForm(it){return `<div class="form">${fld("Item name",`<input name="name" value="${esc(it?.name||"")}" required placeholder="e.g. Brass urli, Chafing dish 5 L">`)}
  ${fld("Category",`<input name="cat" list="rz-cats" value="${esc(it?.cat||"")}" placeholder="Choose or type"><datalist id="rz-cats">${CATS.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>`)}
  ${fld("Unit",`<input name="unit" value="${esc(it?.unit||"pcs")}">`)}${fld("Note (size, colour, condition)",`<input name="note" value="${esc(it?.note||"")}">`)}</div>`}
J.act("rzNew",()=>J.drawer({title:"Add reusable item",submit:"Add item",body:itemForm()+`<div class="form" style="margin-top:8px"><p class="hint" style="margin:0">Opening stock (optional) — how many you have now and where they are kept.</p>
  ${fld("Quantity",`<input name="qty" type="number" min="0" step="1" value="">`)}${fld("Kept at",`<select name="loc">${locOpts("",[[OUT,"Out — in use"]])}</select>`)}${fld("or a new location",`<input name="newloc" placeholder="Type to add a location">`)}</div>`,
  onSubmit:async fd=>{const name=String(fd.name||"").trim();if(!name)return "Enter the item name.";if(items().some(i=>i.name.toLowerCase()===name.toLowerCase()))return "An item with this name already exists — open it and use Move to add stock.";
   const q=num(fd.qty);if(q<0)return "Quantity cannot be negative.";let loc=fd.loc;if(String(fd.newloc||"").trim())loc=await addLoc(fd.newloc);if(q>0&&!loc)return "Choose where these are kept (or type a new location).";
   const id="ritem-"+J.uid();const it={id,name,cat:String(fd.cat||"").trim(),unit:String(fd.unit||"pcs").trim()||"pcs",note:String(fd.note||"").trim(),log:q>0?[{id:J.uid(),date:today(),qty:q,from:NEW,to:loc,note:"Opening stock",by:S.me?.name||"",at:Date.now()}]:[]};
   await J.store.put("meta",it);toast("Item added");setTimeout(()=>openItem(id),50)}}));
J.act("rzEdit",el=>{const it=J.get("meta",el.dataset.x);if(!it)return;J.drawer({title:"Edit item",submit:"Save",body:itemForm(it),onSubmit:async fd=>{const name=String(fd.name||"").trim();if(!name)return "Enter the item name.";if(items().some(i=>i.id!==it.id&&i.name.toLowerCase()===name.toLowerCase()))return "Another item has this name.";
  await J.store.patch("meta",it.id,{name,cat:String(fd.cat||"").trim(),unit:String(fd.unit||"pcs").trim()||"pcs",note:String(fd.note||"").trim()});toast("Saved");setTimeout(()=>openItem(it.id),50)}})});
J.act("rzMove",el=>{const it=J.get("meta",el.dataset.x);if(!it)return;const s=stock(it);const froms=[[NEW,"New stock (bought / gifted / found)"],...s.rows.filter(([,q])=>q>0).map(([l,q])=>[l,lname(l)+" — "+q+" here"])];
  J.drawer({title:"Move · "+it.name,submit:"Record move",body:`<div class="form">${fld("From",`<select name="from">${froms.map(([v,l],i)=>`<option value="${esc(v)}" ${i===(froms.length>1?1:0)?"selected":""}>${esc(l)}</option>`).join("")}</select>`)}
   ${fld("To",`<select name="to">${locOpts("",[[OUT,"Out — in use (event / outside)"],[LOST,"Lost / damaged (write off)"]])}</select>`)}${fld("or a new location",`<input name="newloc" placeholder="Type to add a location">`)}
   ${fld("Quantity ("+esc(it.unit||"pcs")+")",`<input name="qty" type="number" min="1" step="1" required>`)}${fld("Date",`<input name="date" type="date" value="${today()}">`)}
   ${fld("Event / note",`<input name="note" placeholder="e.g. Sharma wedding 14 Nov, returned washed">`)}</div>`,
  onSubmit:async fd=>{const q=num(fd.qty);if(!(q>0))return "Enter the quantity.";let to=fd.to;if(String(fd.newloc||"").trim())to=await addLoc(fd.newloc);if(!to)return "Choose where it is going (or type a new location).";if(fd.from===to)return "From and To are the same.";
   const cur=J.get("meta",it.id);if(fd.from!==NEW&&q>stock(cur).at(fd.from)+1e-9)return "Only "+stock(cur).at(fd.from)+" available at "+lname(fd.from)+".";
   const e={id:J.uid(),date:fd.date||today(),qty:q,from:fd.from,to,note:String(fd.note||"").trim(),by:S.me?.name||"",at:Date.now()};
   await J.store.patch("meta",it.id,{log:[...(cur.log||[]),e]});toast(q+" "+(it.unit||"pcs")+" · "+lname(e.from)+" → "+lname(to));setTimeout(()=>openItem(it.id),50)}})});
J.act("rzOpen",el=>{if(el.tagName==="BUTTON")return;openItem(el.dataset.x)});
J.act("rzDel",async el=>{const it=J.get("meta",el.dataset.x);if(!it)return;if(J._rzDel!==it.id){J._rzDel=it.id;return toast("Press Delete again to remove “"+it.name+"” and its "+(it.log||[]).length+" log lines")}J._rzDel="";await J.safe(()=>J.store.del("meta",it.id),"Item deleted");J.closeDrawer();J.render()});
J.act("rzLocs",()=>{const L=locs();const its=items().map(i=>({i,s:stock(i)}));
  J.drawer({title:"Storage locations",submit:"Add location",body:`<div class="tbl-wrap"><table class="fit"><thead><tr><th>Location</th><th class="r">Items</th><th class="r">Pieces</th></tr></thead><tbody>${L.length?L.map(l=>{const h=its.filter(x=>x.s.at(l.id)>0);return `<tr><td>${esc(l.name)}</td><td class="r">${h.length}</td><td class="r">${h.reduce((a,x)=>a+x.s.at(l.id),0)}</td></tr>`}).join(""):`<tr><td colspan="3" class="hint">No locations yet.</td></tr>`}</tbody></table></div>
   <div class="form" style="margin-top:10px">${fld("New location",`<input name="name" placeholder="e.g. Terrace store, Godown 2, Banquet hall loft" required>`)}</div>`,
  onSubmit:async fd=>{const n=String(fd.name||"").trim();if(!n)return "Type the location name.";if(locs().some(l=>l.name.toLowerCase()===n.toLowerCase()))return "This location already exists.";await addLoc(n);toast("Location added");J.render()}})});
{let k=0;const add=()=>{const m=J.MODS.find(x=>x.id==="inventory");if(m){if(!m.tabs.some(t=>t[0]==="reuse"))m.tabs.splice(1,0,["reuse","Reusable items",vList]);return}if(++k<40)setTimeout(add,250)};add()}
})();
