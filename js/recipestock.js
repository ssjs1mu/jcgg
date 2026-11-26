/* Recipe → stock: every dish sold in Petpooja (Sales & Cash → Daily sales) that has a recipe in the Kitchen takes its ingredients out of stock,
   one consumption entry per day ("Sales (Recipes)"), quantity only — no vouchers, so the books are not touched.
   Ingredient quantities come from the recipe (per serve, Kitchen → recipe cost); each ingredient is matched to an Inventory item by name
   (change it in Inventory → Recipe → stock). Beverages already handled by Sales → stock are skipped, so nothing goes out twice.
   Switch it on with a "from" date: stop logging daily kitchen consumption for these items from that date and use Adjust stock for count
   differences and wastage; the report on the same tab compares recipe consumption, hand-logged issues and wastage item by item. */
(()=>{
const J=window.J,{S,esc,toast,fmtDate}=J;
const arr=x=>Array.isArray(x)?x:[];
const r3=n=>Math.round(n*1000)/1000;
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
const base=s=>String(s||"").replace(/\[[^\]]*\]/g,"").replace(/-e\s*$/i,"").replace(/\bstaff\b/gi,"").replace(/\s+/g," ").trim();
const live=o=>!/cancel|saved|void|deleted/i.test(o.status||"");
const cfg=()=>({on:false,from:"",ing:{},dish:{},...(J.get("meta","rcStock")||{})});
const saveCfg=async patch=>{const c=J.get("meta","rcStock")||{id:"rcStock"};await J.store.put("meta",{...c,id:"rcStock",...patch})};
// grams / ml / pieces → the item's own stock unit (null when the two do not match, e.g. grams of an item counted in pieces)
const toUnit=(amt,b,unit)=>{const u=String(unit||"").toUpperCase();
  if(b==="g")return u==="KG"?amt/1000:(u==="GM"||u==="G")?amt:null;
  if(b==="ml")return (u==="LTR"||u==="L")?amt/1000:u==="ML"?amt:null;
  if(b==="pc")return /^(PC|PCS|NOS|NO|UNIT|EACH)/.test(u)?amt:null;return null};

// dishes sold, with counts per day (beverages handled by Sales → stock are left out)
function sold(){const c={};for(const d of J.all("ppday"))for(const o of arr(d.orders)){if(!live(o))continue;for(const i of arr(o.items)){const b=base(i);if(!b)continue;if(J.ssCovers?.(b))continue;const k=norm(b);const e=c[k]??={name:b,n:0,days:{}};e.n++;e.days[d.id]=(e.days[d.id]||0)+1}}return c}
// recipe of a sold dish (menu item with a recipe, or the built-in library recipe of the same name), read once per sync
function recipeOf(name,cache){if(cache.has(name))return cache.get(name);let r=null;try{const m=J.KIT?.itemOf(name);if(m){const L=J.recipeStock(m);if(L.length)r={m,L}}}catch(e){console.warn("recipe",name,e)}cache.set(name,r);return r}
const ikey=n=>norm(n);
// strict automatic match: every word of the ingredient must be a whole word of exactly one best stock item, and the item may not be a different
// product form (powder / paste / sauce / oil / flakes … the ingredient did not ask for). Anything less clear is left for you to choose.
const STOP=new Set(["fresh","chopped","sliced","diced","whole","raw","boiled","ripe","small","big","medium","large","fine","thick","thin","the","and","with","for","finely","roughly"]);
const FORM=new Set(["powder","paste","sauce","oil","flake","sprinkler","masala","mix","seasoning","cream","puree","essence","syrup","cube","ketchup","vinegar","juice","pickle","chutney","soup","biscuit","cake","chip"]);
const tok=s=>String(s||"").toLowerCase().replace(/[^a-z ]+/g," ").split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)).map(w=>w.replace(/chilly/,"chilli").replace(/ies$/,"y").replace(/oes$/,"o").replace(/s$/,w.length>3?"":"s"));
const mcache=new Map();
const NOTSTOCK=/^(hot |cold |warm |lukewarm |boiling |ice |crushed )*(water|ice)$|^ice( cubes?)?$/i;   // tap water and ice are never a stock item
const PACKX=/\b(sachet|combo|sample|assorted|trial)\b/i;                                          // portion sachets and mixed packs are not recipe ingredients
function strict(name){const k=ikey(name);if(mcache.has(k))return mcache.get(k);const w=tok(name);let res={id:null,n:0};
  if(w.length&&!NOTSTOCK.test(String(name).trim())){const D=J.D?.inv?.items||{};const cand=[];
    for(const it of J.all("items")){if(it.active===false||PACKX.test(it.name||""))continue;const t=tok(it.name);if(!w.every(x=>t.includes(x)))continue;
      if(t.some(x=>FORM.has(x)&&!w.includes(x)))continue;cand.push({id:it.id,x:t.filter(y=>!w.includes(y)).length,b:arr(D[it.id]?.buys).length})}
    const stocked=cand.filter(c=>c.b>0);const pool=stocked.length?stocked:cand;pool.sort((a,b)=>a.x-b.x);
    res={id:pool.length&&(pool.length===1||pool[1].x>pool[0].x)?pool[0].id:null,n:pool.length}}
  mcache.set(k,res);return res}
// pack-sized items ("… 1 kg", "… 200 ml") counted in pieces: one piece = the pack size
const packOf=name=>{const m=String(name||"").match(/(\d+(?:\.\d+)?)\s*(kg|gm|g|ltr|litre|l|ml)\b/i);if(!m)return null;let q=+m[1];const u=m[2].toLowerCase();if(u==="kg"||u==="ltr"||u==="litre"||u==="l")q*=1000;return {amt:q,base:(u==="ml"||u==="l"||u==="ltr"||u==="litre")?"ml":"g"}};
const toStock=(amt,b,it)=>{const q=toUnit(amt,b,it.unit);if(q!=null)return q;if(/^(PC|PCS|NOS|NO|UNIT|EACH|PKT|PACK|BOTTLE|TIN|BOX)/i.test(String(it.unit||""))){const p=packOf(it.name);if(p&&p.base===b&&p.amt>0)return amt/p.amt}return null};
// resolved stock item of one recipe line: your choice, otherwise the automatic name match
function itemOfLine(l,c){const u=c.ing[ikey(l.name)];if(u)return u.item&&u.item!=="-"?u.item:null;return strict(l.name).id}
function plan(){const c=cfg(),S0=sold(),cache=new Map(),byDay={},dishes=[],ings={};let units=0;
  const first=id=>{const b=J.D?.inv?.items[id]?.buys||[];return b.length?b.map(x=>x.date).sort()[0]:null};
  for(const [k,e] of Object.entries(S0)){const rc=recipeOf(e.name,cache);const per=+(c.dish[k]?.per)||1;
    const row={k,name:e.name,n:e.n,per,rc,mapped:0,total:0,skip:0};dishes.push(row);if(!rc)continue;
    for(const l of rc.L){row.total++;const id=itemOfLine(l,c);const ik=ikey(l.name);const g=ings[ik]??={key:ik,name:l.name,base:l.base,amt:0,item:id,by:c.ing[ik]?"you":"auto",n:c.ing[ik]?0:strict(l.name).n,dishes:new Set()};g.amt+=l.amt*e.n*per;g.dishes.add(e.name);
      if(!id)continue;const it=J.get("items",id);const q=it?toStock(l.amt,l.base,it):null;if(q==null){row.skip++;g.unit=true;continue}row.mapped++;
      const f=first(id);if(!f)continue;
      for(const [d,n] of Object.entries(e.days)){if(d<f)continue;if(c.from&&d<c.from)continue;const day=byDay[d]??={};day[id]=(day[id]||0)+q*n*per;units+=q*n*per}}}
  return {c,dishes,ings,byDay,units}}

let busy=false;
async function sync(){if(busy)return null;busy=true;try{
  const c=cfg();void J.all("ppday");void J.all("moves");void J.all("menu");if(!(J.loaded("ppday")&&J.loaded("moves")&&J.loaded("menu")&&J.D?.inv))return null;
  const have=new Map(J.all("moves").filter(m=>m.rcp).map(m=>[m.id,m]));let put=0,del=0,days=0,units=0;
  if(c.on&&c.from){const P=plan();units=r3(P.units);days=Object.keys(P.byDay).length;
    for(const [d,items] of Object.entries(P.byDay)){const id="rcp-"+d;const lines=Object.entries(items).map(([item,qty])=>({item,qty:r3(qty)})).filter(l=>l.qty>0).sort((a,b)=>a.item<b.item?-1:1);if(!lines.length)continue;const old=have.get(id);have.delete(id);
      if(old&&JSON.stringify(arr(old.lines).map(l=>({item:l.item,qty:l.qty})).sort((a,b)=>a.item<b.item?-1:1))===JSON.stringify(lines))continue;
      await J.store.put("moves",{id,type:"consume",date:d,m:d.slice(0,7),dept:"Sales (Recipes)",note:"Auto — recipes of dishes sold in Petpooja",rcp:1,lines,createdAt:old?.createdAt||Date.now()+3000});put++}}
  for(const id of have.keys()){await J.store.del("moves",id);del++}
  return {days,units,put,del}
}catch(e){console.error("recipe→stock",e);return null}finally{busy=false}}
J.recipeToStock=sync;
let t=null;J.afterRender.push(mid=>{if(mid!=="inventory"||!cfg().on)return;clearTimeout(t);t=setTimeout(async()=>{const r=await sync();if(r&&(r.put||r.del))toast(`Stock updated from recipes: ${r.put} day${r.put===1?"":"s"} refreshed${r.del?`, ${r.del} removed`:""}`)},2500)});

J.act("rcOn",async el=>{const on=el.checked;const c=cfg();if(on&&!c.from){el.checked=false;return toast("Choose the \"from\" date first — consumption is posted from that day onwards")}
  await saveCfg({on});const r=await sync();toast(on?"Recipe consumption is on":`Recipe consumption is off — ${r?.del||0} day entr${(r?.del||0)===1?"y":"ies"} removed, stock restored`);J.render()});
J.act("rcFrom",async el=>{if(!el.value)return;await saveCfg({from:el.value});if(cfg().on)await sync();J.render()});
J.act("rcRefresh",async()=>{const r=await sync();toast(r?`Recipes read: ${r.days} days, ${r.units} units out of stock · ${r.put} updated, ${r.del} removed`:"Turn it on and choose the from date first, or wait for sales to load");J.render()});
J.act("rcPer",async el=>{const q=+el.value;if(!(q>0))return toast("Enter a quantity above 0");const c=cfg();await saveCfg({dish:{...c.dish,[el.dataset.x]:{per:q}}});if(c.on)await sync();J.render()});
J.act("rcItem",async el=>{const c=cfg();const ing={...c.ing};if(el.value==="auto")delete ing[el.dataset.x];else ing[el.dataset.x]={item:el.value};await saveCfg({ing});if(c.on)await sync();J.render()});

const ui=()=>J.ui("rs",{m:J.today().slice(0,7),q:""});
const fmtB=(a,b)=>b==="pc"?r3(a)+" pc":b==="ml"?(a>=1000?r3(a/1000)+" L":Math.round(a)+" ml"):(a>=1000?r3(a/1000)+" kg":Math.round(a)+" g");
function vRS(){const U=ui(),P=plan(),c=P.c,need=Object.values(P.ings).filter(g=>!g.item&&!c.ing[g.key]).length,ro=J.readOnly?.();const items=J.all("items").filter(i=>i.active!==false).sort((a,b)=>a.name.localeCompare(b.name));
  const dl=P.dishes.slice().sort((a,b)=>b.n-a.n);const withR=dl.filter(d=>d.rc),noR=dl.filter(d=>!d.rc);
  const ig=Object.values(P.ings).sort((a,b)=>b.dishes.size-a.dishes.size||b.amt-a.amt);
  const opts=sel=>`<option value="auto" ${sel==="auto"?"selected":""}>Automatic match</option><option value="-" ${sel==="-"?"selected":""}>Not a stock item</option>`+items.map(i=>`<option value="${esc(i.id)}" ${sel===i.id?"selected":""}>${esc(i.name)} (${esc(i.unit||"")})</option>`).join("");
  // month report: where stock went — recipes, beverage sales, hand-logged issues, adjustments / wastage
  const m=U.m,mv=J.all("moves").filter(x=>(x.date||"").startsWith(m)),R={};
  const add=(id,k,q)=>{(R[id]??={rc:0,bev:0,man:0,adj:0})[k]+=q};
  for(const x of mv){if(x.type==="consume"){const k=x.rcp?"rc":x.ppc?"bev":x.auto?null:"man";if(k)for(const l of arr(x.lines))add(l.item,k,+l.qty||0)}else if(x.type==="adjust"){for(const l of arr(x.lines))if((+l.qty||0)<0)add(l.item,"adj",-(+l.qty))}}
  const rows=Object.entries(R).map(([id,v])=>({id,it:J.get("items",id),...v,tot:v.rc+v.bev+v.man+v.adj})).filter(r=>r.it&&r.tot>0&&(!U.q||r.it.name.toLowerCase().includes(U.q.toLowerCase()))).sort((a,b)=>b.tot-a.tot);
  const val=(r,q)=>J.itemCost?.(r.id,q)||0;const money=n=>"₹"+Math.round(n).toLocaleString("en-IN");const cell=q=>q?`<td class="num">${r3(q)}</td>`:'<td class="num muted">–</td>';
  const tw=rows.reduce((s,r)=>s+val(r,r.adj),0),tr=rows.reduce((s,r)=>s+val(r,r.rc),0);
  return `<div class="filters"><label class="row" style="gap:6px"><input type="checkbox" data-ach="rcOn" ${c.on?"checked":""} ${ro?"disabled":""}> <b>Take stock out automatically from recipes of dishes sold</b></label>
   <label class="f" style="width:170px">From date<input type="date" value="${esc(c.from||"")}" max="${J.today()}" data-ach="rcFrom" ${ro?"disabled":""}></label>
   <button class="btn primary w" data-a="rcRefresh">Refresh from sales</button><span class="hint">${J.all("moves").filter(x=>x.rcp).length} days posted · ${withR.length} dishes with a recipe · ${noR.length} sold without a recipe · ${need} ingredient${need===1?"":"s"} not matched to stock yet (nothing is taken out for them)</span></div>
  <div class="note">Quantity only — no vouchers. From the "from" date, stop logging daily kitchen consumption for these items (otherwise stock goes out twice) and use <b>Adjust stock</b> for count differences and wastage. Recipe quantities are the Kitchen's per-serve amounts; a sold name counts one serve per time it appears on a bill (change "Serves per sale" for halves or combos).</div>
  <h2 class="ph" style="padding:12px 0 6px">Consumption &amp; wastage — <input type="month" value="${esc(m)}" data-ui="rs.m" style="width:160px"> <input data-ui="rs.q" value="${esc(U.q)}" placeholder="Search item" style="max-width:180px"></h2>
  <div class="panel"><div class="tbl-wrap"><table class="grid-x fit"><thead><tr><th>Item</th><th>Unit</th><th class="num" title="Taken out by recipes of dishes sold">From recipes</th><th class="num" title="Beverages / chiller sold (Sales → stock)">Beverage sales</th><th class="num" title="Daily issues logged by hand">Logged by hand</th><th class="num" title="Negative Adjust stock entries — wastage, spoilage, count differences">Wastage / adjust</th><th class="num">Total out</th><th class="num" title="At last purchase rate">Wastage ₹</th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td>${esc(r.it.name)}</td><td>${esc(r.it.unit||"")}</td>${cell(r.rc)}${cell(r.bev)}${cell(r.man)}${cell(r.adj)}<td class="num"><b>${r3(r.tot)}</b></td><td class="num">${r.adj?money(val(r,r.adj)):""}</td></tr>`).join("")||`<tr><td colspan="8" class="muted">No stock went out in ${esc(m)} yet.</td></tr>`}</tbody>
  ${rows.length?`<tfoot><tr><td colspan="2">Total value at last purchase rate</td><td class="num" colspan="3">Recipes ${money(tr)}</td><td class="num" colspan="3">Wastage / adjust ${money(tw)}</td></tr></tfoot>`:""}</table></div></div>
  <h2 class="ph" style="padding:12px 0 6px">Dishes sold — ${withR.length} with a recipe</h2>
  <div class="panel"><div class="tbl-wrap"><table class="grid-x fit"><thead><tr><th>Dish sold in Petpooja</th><th class="num">Times sold</th><th class="num">Serves per sale</th><th>Ingredients in stock</th></tr></thead><tbody>
  ${withR.slice(0,80).map(d=>`<tr><td>${esc(d.name)}</td><td class="num">${d.n}</td><td class="num"><input type="number" step="any" min="0" value="${d.per}" data-ach="rcPer" data-x="${esc(d.k)}" style="width:70px" ${ro?"disabled":""}></td>
   <td>${d.mapped===d.total?`<span class="chip ok">${d.mapped} of ${d.total}</span>`:`<span class="chip warn">${d.mapped} of ${d.total}</span>`}${d.skip?` <span class="chip warn" title="Recipe unit (grams / ml / pieces) does not match the item's stock unit">${d.skip} unit mismatch</span>`:""}</td></tr>`).join("")||'<tr><td colspan="4" class="muted">No sold dish has a recipe yet. Add recipes in Kitchen.</td></tr>'}</tbody></table></div></div>
  ${noR.length?`<p class="hint">Sold without a recipe (nothing is taken out for them): ${esc(noR.slice(0,25).map(d=>d.name+" ("+d.n+")").join(", "))}${noR.length>25?" …":""}</p>`:""}
  <h2 class="ph" style="padding:12px 0 6px">Ingredients → stock items</h2>
  <div class="panel"><div class="tbl-wrap"><table class="grid-x fit"><thead><tr><th>Ingredient in recipes</th><th class="num">Dishes</th><th class="num" title="Estimated over every sale in Petpooja">Used in sales</th><th>Stock item</th><th>Status</th></tr></thead><tbody>
  ${ig.slice(0,120).map(g=>{const u=c.ing[g.key];const it=g.item?J.get("items",g.item):null;return `<tr><td>${esc(g.name)}</td><td class="num">${g.dishes.size}</td><td class="num">${fmtB(g.amt,g.base)}</td>
   <td><select data-ach="rcItem" data-x="${esc(g.key)}" style="min-width:240px" ${ro?"disabled":""}>${opts(u?u.item:"auto")}</select></td>
   <td>${!it?(u?'<span class="chip">Not stock</span>':g.n>1?`<span class="chip warn" title="Several stock items fit — pick the one you use">Choose · ${g.n} fit</span>`:'<span class="chip">No match</span>'):g.unit?'<span class="chip warn">Unit mismatch</span>':`<span class="chip ok">${u?"Set":"Auto"}</span> <span class="hint">${esc(it.name)}</span>`}</td></tr>`}).join("")||'<tr><td colspan="5" class="muted">Nothing to map yet.</td></tr>'}</tbody></table></div></div>`}
const inv=J.MODS.find(m=>m.id==="inventory");if(inv){const i=inv.tabs.findIndex(t=>t[0]==="salesstock");inv.tabs.splice(i<0?inv.tabs.length:i+1,0,["recipestock","Recipe → stock",vRS])}
})();
