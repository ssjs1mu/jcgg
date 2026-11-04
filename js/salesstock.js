/* Sales → stock: every item sold in Petpooja (Sales & Cash → Daily sales) that is a beverage / chiller line in Inventory
   is taken out of stock automatically, one consumption entry per day ("Sales (Petpooja)"), costed first-expiry-first-out.
   Sold names are matched to stock items by name and size (auto), and can be changed in Inventory → Sales → stock.
   Sales before an item's first purchase are not deducted (stock did not exist yet).  The Refresh button re-reads all sales. */
(()=>{
const J=window.J,{S,esc,toast,fmtDate}=J;
const arr=x=>Array.isArray(x)?x:[];
const r3=n=>Math.round(n*1000)/1000;
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
const base=s=>String(s||"").replace(/\[[^\]]*\]/g,"").replace(/-e\s*$/i,"").replace(/\bstaff\b/gi,"").replace(/\s+/g," ").trim();
const live=o=>!/cancel|saved|void|deleted/i.test(o.status||"");
const BEV=/water|sprite|thum|coke|coca|cola|soda|limca|fanta|pepsi|7up|mirinda|aamras|paper ?boat|banta|mocktail|boba|iced tea|juice|slice|maaza|frooti|red bull|energy|kinley|bisleri|aquafina|lemoneez|nata de coco|sparkling|chiller|lassi bottle/i;
const SIZE=/(\d+(?:\.\d+)?)\s*(ltr|litre|l|ml|gm|g|kg)\b/gi;
const sizes=s=>{const out=new Set();let m;SIZE.lastIndex=0;while((m=SIZE.exec(String(s)))){let q=+m[1],u=m[2].toLowerCase();if(u==="l"||u==="ltr"||u==="litre")q*=1000;if(u==="kg")q*=1000;out.add(String(Math.round(q)))}return out};
const words=s=>String(s).toLowerCase().replace(SIZE," ").split(/[^a-z]+/).filter(w=>w.length>2&&!/^(the|and|with|pack|pcs|bottle|can|tin|drink|ltd|new|fresh|soda|tea|water|juice|mocktail|iced|sparkling)$/.test(w));
const ALIAS=[[/boba/i,"boba"],[/mocktail/i,"mocktail"],[/iced tea/i,"icedtea"],[/aamras|aam ras/i,"aamras"],[/juice/i,"juice"],[/thum/i,"thums"],[/coke|coca/i,"coca"],[/papeboat|paper ?boat/i,"paperboat"],[/packaged water|bisleri|aquafina/i,"waterpack"]];
const toks=s=>{const w=words(s);for(const [re,t] of ALIAS)if(re.test(s))w.push(t);return w};
const doc=()=>J.get("meta","sellMap")||{id:"sellMap",map:{}};
const stockItems=()=>J.all("items").filter(it=>it.active!==false&&/bever/i.test(it.cat||""));

// best stock item for a sold name (null when nothing is close enough)
function suggest(name){const w=toks(name),sz=sizes(name);if(!w.length)return null;let best=null,bs=0;
  for(const it of stockItems()){const iw=toks(it.name);if(!iw.length)continue;const isz=sizes(it.name);
    if(sz.size&&isz.size&&![...sz].some(x=>isz.has(x)))continue;
    const hit=w.filter(x=>iw.includes(x)).length;let s=hit/Math.max(w.length,iw.length);if(hit&&sz.size&&isz.size)s+=0.15;if(it.sub==="Chiller")s+=0.05;
    if(s>bs){bs=s;best=it}}
  return bs>=0.5?best:null}

// sold names with counts, from every Petpooja day
function sold(){const c={};for(const d of J.all("ppday"))for(const o of arr(d.orders)){if(!live(o))continue;for(const i of arr(o.items)){const b=base(i);if(!b)continue;const k=norm(b);const e=c[k]??={name:b,n:0,days:{}};e.n++;(e.days[d.id]??=0);e.days[d.id]++}}return c}

// effective mapping: your choice, otherwise the automatic match; "-" = not a stock item
function resolve(sd){const m=doc().map||{},out={};
  for(const [k,e] of Object.entries(sd)){const u=m[k];
    if(u){out[k]=u.item==="-"?{item:null,per:+u.per||1,by:"you"}:{item:u.item,per:+u.per||1,by:"you"};continue}
    if(!BEV.test(e.name))continue;const it=suggest(e.name);let per=1;if(it&&/^(LTR|KG)$/i.test(it.unit)&&!sizes(it.name).size){const z=[...sizes(e.name)][0];if(z)per=r3(+z/1000)}out[k]={item:it?.id||null,per,by:"auto"}}
  return out}

let busy=false;
async function sync(force){if(busy)return null;busy=true;try{
  const inv=J.D?.inv;if(!inv)return null;const sd=sold();const rs=resolve(sd);
  const first=id=>{const b=inv.items[id]?.buys||[];return b.length?b.map(x=>x.date).sort()[0]:null};
  const byDay={};let units=0;
  for(const [k,r] of Object.entries(rs)){if(!r.item)continue;const f=first(r.item);if(!f)continue;
    for(const [d,n] of Object.entries(sd[k].days)){if(d<f)continue;const day=byDay[d]??={};day[r.item]=r3((day[r.item]||0)+n*r.per);units+=n*r.per}}
  const have=new Map(J.all("moves").filter(m=>m.ppc).map(m=>[m.id,m]));
    let put=0,del=0;
  for(const [d,items] of Object.entries(byDay)){const id="ppc-"+d;const lines=Object.entries(items).map(([item,qty])=>({item,qty})).sort((a,b)=>a.item<b.item?-1:1);const old=have.get(id);have.delete(id);
    if(old&&JSON.stringify(arr(old.lines).map(l=>({item:l.item,qty:l.qty})).sort((a,b)=>a.item<b.item?-1:1))===JSON.stringify(lines))continue;
    await J.store.put("moves",{id,type:"consume",date:d,m:d.slice(0,7),dept:"Sales (Petpooja)",note:"Auto — items sold in Petpooja",ppc:1,lines,createdAt:old?.createdAt||Date.now()+2000});put++}
  for(const id of have.keys()){await J.store.del("moves",id);del++}
  return {days:Object.keys(byDay).length,units:r3(units),put,del}
}catch(e){console.error("sales→stock",e);return null}finally{busy=false}}
J.salesToStock=sync;

// keep stock current whenever Inventory is open
let t=null;J.afterRender.push(mid=>{if(mid!=="inventory")return;clearTimeout(t);t=setTimeout(async()=>{const r=await sync(false);if(r&&(r.put||r.del))toast(`Stock updated from sales: ${r.put} day${r.put===1?"":"s"} refreshed`)},1500)});

J.act("ssRefresh",async()=>{const r=await sync(true);toast(r?`Sales read: ${r.days} days, ${r.units} units out of stock · ${r.put} updated, ${r.del} removed`:"Nothing to refresh yet");J.render()});
const save=async(k,patch)=>{const d=doc();const map={...(d.map||{})};map[k]={...(map[k]||{item:"-",per:1}),...patch};await J.store.put("meta",{...d,id:"sellMap",map});await sync(true)};
J.act("ssItem",async el=>{const k=el.dataset.x;const v=el.value;if(v==="auto"){const d=doc();const map={...(d.map||{})};delete map[k];await J.store.put("meta",{...d,id:"sellMap",map});await sync(true);return J.render()}await save(k,{item:v});J.render()});
J.act("ssPer",async el=>{const q=+el.value;if(!(q>0))return toast("Enter a quantity above 0");await save(el.dataset.x,{per:q});J.render()});

const ui=()=>J.ui("ss",{all:false,q:""});
function vSS(){const U=ui(),sd=sold(),rs=resolve(sd),inv=J.D?.inv;const used=new Map();for(const m of J.all("moves").filter(m=>m.ppc))for(const l of arr(m.lines))used.set(l.item,(used.get(l.item)||0)+(+l.qty||0));
  const keys=Object.keys(sd).filter(k=>U.all||rs[k]).filter(k=>!U.q||sd[k].name.toLowerCase().includes(U.q.toLowerCase())).sort((a,b)=>sd[b].n-sd[a].n);
  const opts=sel=>`<option value="auto" ${sel==="auto"?"selected":""}>Automatic match</option><option value="-" ${sel==="-"?"selected":""}>Not a stock item</option>`+["Chiller","Beverages"].map(g=>{const its=stockItems().filter(i=>(g==="Chiller")===(i.sub==="Chiller")).sort((a,b)=>a.name.localeCompare(b.name));return its.length?`<optgroup label="${g==="Chiller"?"Chiller":"Other beverages"}">${its.map(i=>`<option value="${esc(i.id)}" ${sel===i.id?"selected":""}>${esc(i.name)} (${esc(i.unit)})</option>`).join("")}</optgroup>`:""}).join("");
  const rows=keys.map(k=>{const e=sd[k],r=rs[k],u=doc().map?.[k];const it=r?.item?J.get("items",r.item):null;const f=it?(inv?.items[it.id]?.buys||[]).map(x=>x.date).sort()[0]:null;
    const sel=u?u.item:"auto";
    return `<tr><td>${esc(e.name)}</td><td class="num">${e.n}</td><td><select data-ach="ssItem" data-x="${esc(k)}" style="min-width:230px">${opts(sel)}</select></td>
    <td><input type="number" step="any" min="0" value="${r?.per||1}" data-ach="ssPer" data-x="${esc(k)}" style="width:70px" ${it?"":"disabled"}> <span class="hint">${esc(it?.unit||"")}</span></td>
    <td class="num">${it?(used.get(it.id)||0):""}</td>
    <td>${!r?'<span class="chip">Not mapped</span>':!it?'<span class="chip">Not stock</span>':f?`<span class="chip">${r.by==="auto"?"Auto":"Set"}</span> <span class="hint">from ${fmtDate(f)}</span>`:'<span class="chip warn">No purchase yet</span>'}</td></tr>`}).join("");
  const tot=[...used.values()].reduce((s,x)=>s+x,0);
  return `<div class="filters"><button class="btn primary w" data-a="ssRefresh">Refresh from sales</button><button class="btn w" data-set="ss.all=${!U.all}" aria-pressed="${U.all}">${U.all?"Beverages only":"Show every sold item"}</button>
   <input data-ui="ss.q" value="${esc(U.q)}" placeholder="Search sold item" style="max-width:200px"><span class="hint">${J.all("moves").filter(m=>m.ppc).length} days posted · ${r3(tot)} units taken out of stock so far</span></div>
  <p class="hint">Items sold in Petpooja are matched to beverage / chiller stock by name and size, and taken out of stock each day (first expiry first). Sales before an item's first purchase are not counted. Change a match below if it is wrong; the quantity is stock units used per item sold.</p>
  <div class="panel"><div class="tbl-wrap"><table class="grid-x fit"><thead><tr><th>Sold in Petpooja</th><th class="num">Times sold</th><th>Stock item</th><th>Used per sale</th><th class="num">Out of stock</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="muted">No beverage sales found yet — upload Petpooja orders in Sales &amp; Cash.</td></tr>'}</tbody></table></div></div>`}
const inv=J.MODS.find(m=>m.id==="inventory");if(inv){const i=inv.tabs.findIndex(t=>t[0]==="consumption");inv.tabs.splice(i<0?inv.tabs.length:i+1,0,["salesstock","Sales → stock",vSS]);
  const hb=inv.headBtns;inv.headBtns=()=>`<button class="btn w" data-a="ssRefresh">Refresh from sales</button>`+hb()}
})();
