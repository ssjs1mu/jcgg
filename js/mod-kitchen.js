/* Kitchen: the menu master — item, category, Ground Floor / Mezzanine / breakfast / staff rates, online availability (online sells at Mezzanine rate). Uploaded from Excel. */
(()=>{
const J=window.J,{S,esc,inr,inr0,r2,money0,fmtDate,today,uid,fld,txt,num,selO,toast}=J;
const ui=()=>J.ui("kit",{q:"",cat:"",only:""});
const RATES=[["gr","Ground Floor"],["mez","Mezzanine Floor"],["grBf","Gr. Flr. Breakfast"],["mezBf","Mez. Flr. Breakfast"],["staff","Staff rate"]];
const rate=(m,k)=>{const v=m.rates?.[k];return v===""||v==null?(k==="gr"&&m.price?+m.price:null):+v};
J.menuRate=rate;J.MENU_RATES=RATES;
// staff KOT price: the staff rate when the item carries one, otherwise the Ground Floor rate
J.staffPrice=m=>{const s=rate(m,"staff");if(s!=null&&s>0)return {rate:s,basis:"staff"};const g=rate(m,"gr");return {rate:g||0,basis:"gr"}};
const items=()=>J.all("menu").filter(m=>m.active!==false).sort((a,b)=>(a.cat||"").localeCompare(b.cat||"")||a.name.localeCompare(b.name));
J.menuItems=items;
function vMenu(){const U=ui();const q=(U.q||"").toLowerCase();const all=items();const cats=[...new Set(all.map(m=>m.cat||"Other"))].sort();
  const list=all.filter(m=>(!U.cat||(m.cat||"Other")===U.cat)&&(!q||(m.name+" "+(m.cat||"")).toLowerCase().includes(q))&&(U.only!=="online"||m.online)&&(U.only!=="staff"||rate(m,"staff")>0));
  const f=v=>v==null?'<span class="muted">—</span>':inr0.format(v);
  return `<div class="filters">${fld("Search",`<input id="km-q" data-ui="kit.q" value="${esc(U.q)}" placeholder="Dish or category" style="min-width:220px">`)}${fld("Category",`<select id="km-cat" data-ui="kit.cat"><option value="">All (${all.length})</option>${cats.map(c=>`<option ${U.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select>`)}
    <div class="seg">${[["","All"],["online","Online"],["staff","Staff items"]].map(([k,l])=>`<button data-set="kit.only=${k}" aria-pressed="${(U.only||"")===k}">${l}</button>`).join("")}</div>
    <div class="row" style="margin-left:auto;flex-wrap:wrap"><button class="btn w" data-a="kitUpload">Upload menu (Excel)</button><button class="btn" data-a="kitExport">Download menu</button><button class="btn" data-a="kitPrint">Print / PDF</button><button class="btn primary w" data-a="kitNew">+ New item</button></div></div>
  <div class="kpis">${J.kpi("Menu items",String(all.length),cats.length+" categories")}${J.kpi("Online",String(all.filter(m=>m.online).length),"sold at Mezzanine rates")}${J.kpi("Staff items",String(all.filter(m=>rate(m,"staff")>0).length),"others bill staff at Gr. Floor rate")}</div>
  <div class="panel"><div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Category</th>${RATES.map(([,l])=>`<th class="num">${l}</th>`).join("")}<th>Online</th><th class="num">Online rate</th><th></th></tr></thead><tbody>
  ${list.map(m=>`<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.cat||"")}</td>${RATES.map(([k])=>`<td class="num">${f(rate(m,k))}</td>`).join("")}<td><label class="row" style="gap:4px"><input type="checkbox" data-ach="kitOnline" data-x="${m.id}" id="ko-${m.id}" ${m.online?"checked":""} aria-label="Available online"> ${m.online?"Yes":"No"}</label></td><td class="num">${m.online?f(rate(m,"mez")):'<span class="muted">—</span>'}</td><td><button class="btn small w" data-a="kitEdit" data-x="${m.id}">Edit</button></td></tr>`).join("")||J.emptyRow(10,"No menu items yet","Upload your menu from Excel: Item name, Category, Ground Floor, Mezzanine Floor, Gr.Flr.Breakfast, Mez.Flr.Breakfast, Staff Rates, Online.")}
  </tbody></table></div></div><p class="hint">Online orders are priced at the Mezzanine Floor rate. Staff KOTs use the staff rate when an item has one; otherwise the Ground Floor rate applies.</p>`}
function itemDrawer(id){const m=id?J.get("menu",id):{rates:{},online:false};const cats=[...new Set(J.all("menu").map(x=>x.cat).filter(Boolean))];
  J.drawer({title:id?"Edit · "+m.name:"New menu item",submit:"Save item",danger:id?`<button type="button" class="btn small danger w" data-a="kitDel" data-x="${id}">Remove from menu</button>`:"",body:`<div class="form">${fld("Item name",txt("name",m.name,"","required"))}${fld("Category",`<input name="cat" id="f-cat" list="kcats" value="${esc(m.cat||"")}"><datalist id="kcats">${cats.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>`)}</div>
    <div class="form">${RATES.map(([k,l])=>fld(l+" (₹)",num("r_"+k,m.rates?.[k]??(k==="gr"?m.price:"")))).join("")}</div>
    <label class="row" style="gap:6px"><input type="checkbox" name="online" id="f-online" ${m.online?"checked":""}> Available online (sold at the Mezzanine Floor rate)</label>`,
    onSubmit:async fd=>{const name=fd.name.trim();if(!name)return "Enter the item name.";if(J.all("menu").some(x=>x.id!==id&&x.active!==false&&x.name.toLowerCase()===name.toLowerCase()))return "This item is already on the menu.";const rates={};for(const [k] of RATES)rates[k]=fd["r_"+k]===""?"":+fd["r_"+k];
      await J.store.put("menu",{...(id?m:{}),id:id||"mi-"+uid(),name,cat:fd.cat.trim()||"Other",rates,price:rates.gr===""?0:rates.gr,online:!!fd.online,active:true,updatedAt:Date.now()});toast("Saved "+name)}})}
J.act("kitNew",()=>itemDrawer(null));J.act("kitEdit",el=>itemDrawer(el.dataset.x));J.act("editDish",el=>{J.go("kitchen","menu");itemDrawer(el.dataset.x)});
J.act("kitDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to remove";return}await J.safe(()=>J.store.patch("menu",el.dataset.x,{active:false}),"Removed from menu");J.closeDrawer();J.render()});
J.act("kitOnline",async el=>{await J.safe(()=>J.store.patch("menu",el.dataset.x,{online:el.checked}))});
J.act("kitUpload",()=>J.openImport("menu"));
J.act("kitExport",()=>{const rows=[["Item name","Category",...RATES.map(r=>r[1]),"Online (Y/N)"],...items().map(m=>[m.name,m.cat||"",...RATES.map(([k])=>rate(m,k)??""),m.online?"Y":"N"])];J.saveFile("menu-"+today()+".csv",J.toCSV(rows))});
J.act("kitPrint",()=>{const by={};for(const m of items())(by[m.cat||"Other"]??=[]).push(m);const f=v=>v==null?"":inr0.format(v);
  J.printDoc("Menu",`<div class="hd"><div><h1>${esc(J.settings().business||"JCGG")}</h1><div class="sub">Kitchen menu master · ${items().length} items</div></div><div class="sub">${fmtDate(today())}</div></div>${Object.entries(by).map(([c,l])=>`<h2>${esc(c)}</h2><table><thead><tr><th>Item</th>${RATES.map(([,x])=>`<th class="num">${x}</th>`).join("")}<th>Online</th></tr></thead><tbody>${l.map(m=>`<tr><td>${esc(m.name)}</td>${RATES.map(([k])=>`<td class="num">${f(rate(m,k))}</td>`).join("")}<td>${m.online?"Yes · "+f(rate(m,"mez")):""}</td></tr>`).join("")}</tbody></table>`).join("")}`,true)});
J.mod({id:"kitchen",label:"Kitchen",group:"Operations",icon:'<path d="M6 3v8a3 3 0 0 0 6 0V3M9 3v18M17 3c-1.7 1.5-2 4-2 6s.8 3 2 3v9"/>',sub:"Menu master: categories, floor-wise, breakfast, staff and online rates. Staff KOTs price from here.",
  headBtns:()=>`<button class="btn w" data-a="kitUpload">Upload menu (Excel)</button><button class="btn primary w" data-a="kitNew">+ New item</button>`,
  tabs:[["menu","Menu",vMenu]]});
})();
