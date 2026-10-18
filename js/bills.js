/* Supplier bills: upload the PDF (Hyperpure tax invoices, bills of supply and service invoices are read automatically),
   map every line to a stock item or an expense head, post one accounting entry per bill, keep the PDF with the entry,
   then tally bills against the bank payments to the supplier. A payment that does not match the bills exactly has the
   difference parked in Suspense for verification. */
(()=>{
const J=window.J,{S,esc,inr,money,r2,r3,uid,today,addDays,fmtDate,fld,txt,num,toast}=J;
const CATS=["Vegetables","Fruits","Dairy","Grains & Pulses","Flour & Atta","Spices & Masala","Oils & Ghee","Dry Fruits","Sweeteners","Bakery Inputs","Beverages","Packaging","Cleaning","Gas & Fuel","Other"];
const EXP=[["delivch","Delivery & Platform Charges"],["subs","Subscriptions & Software"],["kitcons","Kitchen Consumables & Small Utensils"],["cleanexp","Cleaning & Housekeeping Supplies"],["packexp","Packaging Material"],["gasexp","Gas & Fuel"],["miscexp","Miscellaneous Kitchen Expenses"]];
// ---------------- reading the PDF ----------------
async function pdfItems(file){const lib=await J.loadPdfJs();const pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;const out=[];let off=0;
  for(let p=1;p<=pdf.numPages;p++){const pg=await pdf.getPage(p);const vp=pg.getViewport({scale:1});const tc=await pg.getTextContent();for(const it of tc.items){if(!it.str.trim())continue;out.push({s:it.str.trim(),x:Math.round(it.transform[4]),y:Math.round(it.transform[5])-off})}off+=vp.height}return out}
const rowsOf=items=>{const R=[];for(const i of [...items].sort((a,b)=>b.y-a.y||a.x-b.x)){const r=R.find(r=>Math.abs(r.y-i.y)<=2);if(r)r.t.push(i);else R.push({y:i.y,t:[i]})}R.forEach(r=>{r.t.sort((a,b)=>a.x-b.x);r.text=r.t.map(t=>t.s).join(" ")});return R};
const N=s=>+String(s).replace(/,/g,"");const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const isoDate=s=>{const m=String(s).match(/(\d{1,2})[ -]([A-Za-z]{3})[a-z]*[ -,]*(\d{4})/);if(m)return `${m[3]}-${String(MON[m[2].toLowerCase()]).padStart(2,"0")}-${m[1].padStart(2,"0")}`;const d=String(s).match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);return d?`${d[3]}-${d[2].padStart(2,"0")}-${d[1].padStart(2,"0")}`:""};
J.parseBill=items=>{const R=rowsOf(items);const all=R.map(r=>r.text).join("\n");const b={lines:[],charges:[],warnings:[]};
  b.docType=/BILL OF SUPPLY/i.test(all)?"Bill of supply":/TAX INVOICE/i.test(all)?"Tax invoice":"Invoice";
  b.vendorName=(all.match(/Bill From[^:\n]*:\s*([^\n]+)/i)?.[1]||"").replace(/\s*\(.*$/,"").replace(/Limted/i,"Limited").trim();
  if(/hyperpure/i.test(all))b.vendorKey="hyperpure";
  b.invNo=(all.match(/\b([A-Z]{3,}[A-Z0-9]*-\d{5,})\b(?!-)/)||[])[1]||"";b.orderNo=(all.match(/\b([A-Z0-9]+-OR-\d+)\b/)||[])[1]||"";
  const hdr=R.findIndex(r=>/Invoice Number/i.test(r.text));b.date=isoDate(hdr>=0?R[hdr+1]?.text:"")||isoDate(all);
  b.vendorGstin=(all.match(/GSTIN\s*:\s*([0-9]{2}[A-Z0-9]{13})/)||[])[1]||"";
  // columns: item rows carry a serial number at the left and an HSN/SAC code
  const head=R.find(r=>/S\s*No/i.test(r.text)&&/HSN/i.test(r.text));const xHsn=head?.t.find(t=>/HSN/i.test(t.s))?.x??220;const xDesc=head?.t.find(t=>/Description/i.test(t.s))?.x??64;
  const otherY=R.find(r=>/^Other Charges/i.test(r.text))?.y??-1e9;const totRow=R.find(r=>/^Total\b/i.test(r.text));
  const itemRows=R.filter(r=>r!==totRow&&r.t.length>=5&&/^\d{1,3}$/.test(r.t[0].s)&&r.t[0].x<Math.min(xDesc,xHsn-60)&&r.t.some(t=>/^\d{4,8}$/.test(t.s)&&t.x>=xHsn-20&&t.x<=xHsn+30));
  const snoX=itemRows.length?Math.max(...itemRows.map(r=>r.t[0].x)):50;const descFr=R.flatMap(r=>r.t.filter(t=>t.x>=snoX+6&&t.x<xHsn-8&&!/^(Other Charges|Total|Description)/i.test(t.s)).map(t=>({...t,y:r.y})));
  for(const r of itemRows){const desc=descFr.filter(f=>{const near=itemRows.reduce((a,x)=>Math.abs(x.y-f.y)<Math.abs(a.y-f.y)?x:a);return near===r&&Math.abs(f.y-r.y)<14}).sort((a,b)=>b.y-a.y).map(f=>f.s).join(" ").replace(/\s+/g," ").trim();
    const hi=r.t.findIndex(t=>/^\d{4,8}$/.test(t.s)&&t.x>=xHsn-20);const rest=r.t.slice(hi+1).map(t=>t.s);const hsn=r.t[hi].s;
    const nums=[],uom=[],plus=[];for(const s of rest){if(/^[\d.]+(\+[\d.]+)+$/.test(s))plus.push(s);else if(/^[\d,.]+$/.test(s))nums.push(N(s));else if(/^[A-Za-z]+$/.test(s))uom.push(s)}
    const pct=plus[0]?plus[0].split("+").reduce((a,x)=>a+ +x,0):0;const total=nums.at(-1);const qty=nums[0],price=nums[1],taxable=nums.length>=4?nums[2]:r2(qty*price);
    const ln={sno:+r.t[0].s,desc,hsn,qty,price,uom:uom[0]||"",taxable,gstPct:pct,tax:r2(total-taxable),total};
    (r.y<otherY||/^99/.test(hsn)?b.charges:b.lines).push(ln)}
  const tn=totRow?totRow.t.filter(t=>/^[\d,.]+$/.test(t.s)).map(t=>N(t.s)):[];b.total=tn.at(-1)||r2([...b.lines,...b.charges].reduce((s,l)=>s+l.total,0));b.taxable=tn[0]||0;
  const sum=r2([...b.lines,...b.charges].reduce((s,l)=>s+(l.total||0),0));if(Math.abs(sum-b.total)>1)b.warnings.push(`Lines add up to ${money(sum)} but the bill total is ${money(b.total)} — check the lines.`);
  if(!b.lines.length&&!b.charges.length)b.warnings.push("No item lines could be read from this PDF. Enter them by hand.");
  return b};
// ---------------- understanding a product line ----------------
const PACK=d=>{const s=d.replace(/,/g," ");let m=s.match(/\(\s*pack of\s*(\d+)\s*\)/i);const mult=m?+m[1]:1;
  m=s.match(/(\d+(?:\.\d+)?)\s*(kg|kgs|gm|gms|g|grams?|l|ltr|litres?|ml)\b(?!\s*\/)/i)||s.match(/(\d+(?:\.\d+)?)\s*(kg|gm|g|l|ml)\b/i);if(!m)return null;
  let q=+m[1];let u=m[2].toLowerCase();if(/^(gm|gms|g|gram)/.test(u)){q/=1000;u="KG"}else if(u==="ml"){q/=1000;u="LTR"}else if(/^kg/.test(u))u="KG";else u="LTR";return {q:r3(q*mult),unit:u}};
const nameOf=d=>{let s=d.replace(/\(\s*pack of.*?\)/i,"").replace(/,?\s*\d+(\.\d+)?\s*(kg|kgs|gm|gms|g|grams?|l|ltr|litres?|ml)\b.*$/i,"").replace(/\s+-\s+\d.*$/,"").trim().replace(/[,\s]+$/,"");
  const m=s.match(/^(.+?)\s+-\s+(.+)$/);return m?`${m[2].trim()} (${m[1].trim()})`:s};
const CATRE=[["Dairy",/paneer|curd|dahi|milk|milkmaid|cream|cheese|butter|ghee|khoya|yogurt/i],["Oils & Ghee",/oil\b|vanaspati/i],["Vegetables",/carrot|tomato|onion|potato|cucumber|coriander|dhonepata|baby corn|capsicum|cabbage|beans|chilli green|ginger|garlic|lemon|mushroom|spinach|palak|peas|cauliflower|brinjal|lettuce/i],
  ["Spices & Masala",/masala|chilli|chili|turmeric|haldi|jeera|cumin|pepper|spice|flakes|oregano|seasoning|salt/i],["Dry Fruits",/cashew|almond|raisin|pista|coconut powder|desiccated/i],["Flour & Atta",/atta|maida|besan|flour|suji|rava/i],["Grains & Pulses",/rice|dal|chana|rajma|poha|quinoa|lentil/i],
  ["Sweeteners",/sugar|jaggery|honey/i],["Bakery Inputs",/yeast|baking|cocoa|chocolate|bread|whipping|cooking rich|non.?dairy/i],["Beverages",/tea|coffee|juice|syrup|soda|water/i],["Packaging",/container|pouch|foil|box|bag|cup|plate|tissue|napkin/i],["Cleaning",/clean|detergent|soap|sanit|phenyl|scrub/i],["Gas & Fuel",/lpg|gas cylinder|charcoal/i]];
const catOf=(d,hsn)=>(CATRE.find(([,re])=>re.test(d))||[])[0]||(/^0[45]/.test(hsn)?"Dairy":/^07/.test(hsn)?"Vegetables":/^08/.test(hsn)?"Fruits":/^09/.test(hsn)?"Spices & Masala":/^1[01]/.test(hsn)?"Grains & Pulses":/^15/.test(hsn)?"Oils & Ghee":/^17/.test(hsn)?"Sweeteners":"Other");
const expOf=(d,hsn)=>/delivery|convenience|platform|handling|fee/i.test(d)?"delivch":/subscription|membership|plan/i.test(d)?"subs":/lighter|knife|ladle|spoon|utensil|tong|brush|apron|glove|cap\b|scrubber/i.test(d)?"kitcons":/clean|detergent|soap|phenyl/i.test(d)?"cleanexp":/container|foil|pouch|packag|box|bag/i.test(d)&&!/pouch \(pack/i.test(d)?"packexp":/^99/.test(hsn)?"delivch":/^9[0-7]|^8[2-5]|^39|^48/.test(hsn)?"kitcons":"";
const words=s=>String(s).toLowerCase().replace(/\(.*?\)/g," ").split(/[^a-z]+/).filter(w=>w.length>2&&!/^(the|and|with|economy|premium|fresh|desi|peeled|orange|indian|refined|pack|pouch)$/.test(w));
function matchItem(name){const w=words(name);let best=null,bs=0;for(const it of J.all("items")){const iw=words(it.name);const s=w.filter(x=>iw.includes(x)).length/Math.max(1,Math.max(w.length,iw.length));if(s>bs){bs=s;best=it}}return bs>=0.5?best:null}
// default mapping for a parsed line
function mapLine(l,isCharge){const exp=isCharge?expOf(l.desc,l.hsn)||"delivch":expOf(l.desc,l.hsn);if(exp)return {kind:"exp",exp};const pk=PACK(l.desc);const nm=nameOf(l.desc);const ex=matchItem(nm);
  return {kind:"stock",item:ex?.id||"new",newName:nm,cat:catOf(l.desc,l.hsn),unit:ex?.unit||pk?.unit||"PCS",perPack:pk&&(!ex||ex.unit===pk.unit)?pk.q:1}}
// ---------------- upload & review ----------------
const STG={bills:[]};
J.act("billUpload",()=>{const i=document.createElement("input");i.type="file";i.accept="application/pdf";i.multiple=true;i.onchange=async()=>{const files=[...i.files];if(!files.length)return;toast("Reading "+files.length+" bill"+(files.length>1?"s":"")+"…");STG.bills=[];
  for(const f of files){try{const b=J.parseBill(await pdfItems(f));b.file=f;b.fileName=f.name;b.dup=J.all("bills").find(x=>x.invNo&&x.invNo===b.invNo);b.lines.forEach(l=>l.map=mapLine(l,false));b.charges.forEach(l=>l.map=mapLine(l,true));STG.bills.push(b)}catch(e){STG.bills.push({file:f,fileName:f.name,err:e.message,lines:[],charges:[],warnings:[]})}}
  STG.bills.sort((a,b)=>(a.date||"").localeCompare(b.date||""));reviewDrawer()};i.click()});
const itemOptions=sel=>`<option value="new" ${sel==="new"?"selected":""}>＋ New stock item</option>${J.all("items").sort((a,b)=>a.name.localeCompare(b.name)).map(it=>`<option value="${esc(it.id)}" ${sel===it.id?"selected":""}>${esc(it.name)} (${esc(it.unit)})</option>`).join("")}`;
function lineRow(bi,kind,li,l){const m=l.map;const k=`${bi}-${kind}-${li}`;
  return `<tr><td>${esc(l.desc)}<div class="hint mono">HSN ${esc(l.hsn)} · ${l.qty} ${esc(l.uom)} × ₹${inr.format(l.price)}${l.gstPct?` · GST ${l.gstPct}%`:""}</div></td><td class="num">₹${inr.format(l.total)}</td>
  <td><select data-ach="billMap" data-k="${k}" data-f="kind"><option value="stock" ${m.kind==="stock"?"selected":""}>Stock item</option><option value="exp" ${m.kind==="exp"?"selected":""}>Expense</option></select>
  ${m.kind==="stock"?`<select data-ach="billMap" data-k="${k}" data-f="item" style="max-width:240px">${itemOptions(m.item)}</select>${m.item==="new"?`<div class="row" style="gap:4px;margin-top:4px;flex-wrap:wrap"><input value="${esc(m.newName)}" data-ach="billMap" data-k="${k}" data-f="newName" style="max-width:230px" aria-label="New item name"><select data-ach="billMap" data-k="${k}" data-f="cat">${CATS.map(c=>`<option ${m.cat===c?"selected":""}>${c}</option>`).join("")}</select><select data-ach="billMap" data-k="${k}" data-f="unit">${["KG","LTR","PCS","PKT","BOX"].map(u=>`<option ${m.unit===u?"selected":""}>${u}</option>`).join("")}</select></div>`:""}
    <div class="row" style="gap:4px;margin-top:4px"><span class="hint">Stock in:</span><input type="number" step="any" value="${r3(l.qty*(m.perPack||1))}" data-ach="billMap" data-k="${k}" data-f="stockQty" style="width:90px" aria-label="Quantity into stock"><span class="hint">${esc(m.item==="new"?m.unit:J.get("items",m.item)?.unit||"")} → ₹${inr.format(l.total/Math.max(0.0001,l.qty*(m.perPack||1)))}/${esc(m.item==="new"?m.unit:J.get("items",m.item)?.unit||"")}</span></div>`
  :`<select data-ach="billMap" data-k="${k}" data-f="exp">${EXP.map(([s,n])=>`<option value="${s}" ${m.exp===s?"selected":""}>${esc(n)}</option>`).join("")}</select>`}</td></tr>`}
function reviewDrawer(){const gstin=J.settings().gstin;
  J.drawer({title:"Review bills · "+STG.bills.length,wide:true,submit:"Save bills & post to accounts",body:`${gstin?"":`<p class="note" style="margin:0">Your business has no GSTIN in Settings, so GST on these bills cannot be claimed back — it is added to the cost of each item and expense.</p>`}
  ${STG.bills.map((b,bi)=>`<section class="bill-rv"><div class="row" style="gap:8px;flex-wrap:wrap;align-items:baseline"><b>${esc(b.vendorName||"Supplier not recognised")}</b><span class="chip plain">${esc(b.docType||"")}</span><span class="mono">${esc(b.invNo||b.fileName)}</span>${b.orderNo?`<span class="hint mono">Order ${esc(b.orderNo)}</span>`:""}<span>${b.date?fmtDate(b.date):""}</span><b style="margin-left:auto">${money(b.total||0)}</b></div>
    ${b.err?`<div class="err">${esc(b.err)}</div>`:""}${b.dup?`<div class="err">Already uploaded on ${fmtDate(new Date(b.dup.createdAt).toISOString().slice(0,10))} — this bill will be skipped.</div>`:""}${(b.warnings||[]).map(w=>`<div class="note">${esc(w)}</div>`).join("")}
    ${b.lines.length||b.charges.length?`<div class="tbl-wrap"><table class="bill-tbl"><thead><tr><th>Line on the bill</th><th class="num">Amount</th><th>Goes to</th></tr></thead><tbody>${b.lines.map((l,li)=>lineRow(bi,"lines",li,l)).join("")}${b.charges.map((l,li)=>lineRow(bi,"charges",li,l)).join("")}</tbody></table></div>`:""}</section>`).join("")}
  <p class="hint">Each bill is posted as one purchase entry (stock items to Kitchen Purchases, other lines to their expense heads, total to the supplier's ledger), its PDF is kept with the entry, and stock is added in Inventory. Bills are then matched to your bank payments to the supplier.</p>`,
  onSubmit:async()=>{const n=await saveAll();if(typeof n==="string")return n}})}
J.act("billMap",el=>{const [bi,kind,li]=el.dataset.k.split("-");const l=STG.bills[+bi][kind][+li];const f=el.dataset.f;
  if(f==="stockQty"){l.map.stockQty=+el.value;return}l.map[f]=el.value;if(f==="item"&&el.value!=="new"){const it=J.get("items",el.value);const pk=PACK(l.desc);l.map.perPack=pk&&pk.unit===it.unit?pk.q:1;l.map.unit=it.unit}
  if(f==="unit"){const pk=PACK(l.desc);l.map.perPack=pk&&pk.unit===el.value?pk.q:1}if(f==="kind"&&el.value==="exp"&&!l.map.exp)l.map.exp=expOf(l.desc,l.hsn)||"miscexp";
  const st=document.getElementById("drawerForm")?.scrollTop;reviewDrawer();const fm=document.getElementById("drawerForm");if(fm)fm.scrollTop=st});
async function vendorId(b){if(b.vendorKey==="hyperpure"){const v=J.all("accounts").find(a=>a.kind==="vendor"&&/hyperpure/i.test(a.name));if(v)return v.id}
  const nm=b.vendorName||"Supplier";const ex=J.all("accounts").find(a=>a.kind==="vendor"&&a.name.toLowerCase()===nm.toLowerCase());return ex?ex.id:J.ensureAcc(nm,"vendor")}
async function saveAll(){const todo=STG.bills.filter(b=>!b.err&&!b.dup&&(b.lines.length||b.charges.length));if(!todo.length)return "Nothing new to save.";let done=0;
  for(const b of todo){try{await saveBill(b);done++}catch(e){console.error(e);toast("Could not save "+(b.invNo||b.fileName)+": "+e.message)}}
  toast(done+" bill"+(done>1?"s":"")+" saved and posted");
  // wait until every saved bill is back from the database, so bills of one order are matched together
  const ids=todo.map(b=>"bill-"+(b.invNo||"").replace(/[^\w-]/g,""));for(let i=0;i<40&&!ids.every(id=>J.get("bills",id));i++)await new Promise(r=>setTimeout(r,250));
  await J.billsReconcile();J.go("inventory","bills")}
async function saveBill(b){const id="bill-"+(b.invNo||uid()).replace(/[^\w-]/g,"");const vend=await vendorId(b);
  let file=null;try{file=await J.fileSave(b.file,"files")}catch(e){console.warn("bill file",e)}
  const stock=[],exp={};let stockTotal=0;
  for(const l of [...b.lines,...b.charges]){const m=l.map;if(m.kind==="exp"){const nm=EXP.find(e=>e[0]===m.exp)?.[1]||"Miscellaneous Kitchen Expenses";exp[m.exp]=(exp[m.exp]||{n:nm,amt:0});exp[m.exp].amt=r2(exp[m.exp].amt+l.total);continue}
    let item=m.item;if(item==="new"){const nm=(m.newName||nameOf(l.desc)).trim();const ex=J.all("items").find(i=>i.name.toLowerCase()===nm.toLowerCase());item=ex?.id||uid();if(!ex)await J.store.put("items",{id:item,name:nm,cat:m.cat,sub:"",unit:m.unit,reorder:0,gst:0,shelf:0,vendor:vend,img:"",veg:true,active:true,src:"bill"})}
    const q=r3(m.stockQty??(l.qty*(m.perPack||1)))||l.qty;stock.push({item,qty:q,rate:r2(l.total/q),gst:0,batch:"BILL-"+(b.invNo||id).slice(-8)+"-"+(stock.length+1),exp:"",desc:l.desc});stockTotal=r2(stockTotal+l.total)}
  const L=[];if(stockTotal)L.push({a:J.sysAcc("purch")?.id||await J.ensureAcc("Kitchen Purchases (Raw Material)","expense","purch"),dr:stockTotal,cr:0});
  for(const [sys,e] of Object.entries(exp))L.push({a:await J.ensureAcc(e.n,"expense",sys),dr:e.amt,cr:0});
  const tot=r2(L.reduce((s,l)=>s+l.dr,0));L.push({a:vend,dr:0,cr:tot});
  const moveId=stock.length?"mv-"+id:"";
  const v=await J.postVoucher({newId:"v-"+id,type:"purchase",date:b.date||today(),lines:L,party:vend,ref:b.invNo,narr:`${b.docType} ${b.invNo}${b.orderNo?" · order "+b.orderNo:""} · ${[...b.lines,...b.charges].map(l=>nameOf(l.desc)).slice(0,4).join(", ")}${b.lines.length+b.charges.length>4?"…":""}`,src:{col:"bills",id,label:"Supplier bill"}});
  if(file)await J.store.patch("vouchers",v.id,{docs:[file],docsAt:Date.now()});
  if(moveId)await J.store.put("moves",{id:moveId,type:"purchase",date:b.date||today(),m:(b.date||today()).slice(0,7),vendor:vend,inv:b.invNo,due:"",paid:"",lines:stock.map(({desc,...x})=>x),note:"From bill "+b.invNo,vid:v.id,billId:id,createdAt:Date.now()});
  await J.store.put("bills",{id,vendor:vend,vendorName:b.vendorName,vendorGstin:b.vendorGstin,docType:b.docType,invNo:b.invNo,orderNo:b.orderNo,date:b.date||today(),total:tot,billTotal:b.total,lines:[...b.lines,...b.charges].map(l=>({desc:l.desc,hsn:l.hsn,qty:l.qty,uom:l.uom,price:l.price,taxable:l.taxable,gstPct:l.gstPct,total:l.total,map:l.map.kind==="exp"?{kind:"exp",exp:l.map.exp}:{kind:"stock"}})),
    stock:stock.map(s=>({item:s.item,qty:s.qty,rate:s.rate})),vid:v.id,moveId,file:file||null,fileName:b.fileName,createdAt:Date.now(),by:S.me.email,pay:null,verified:null})}
// ---------------- tally with payments ----------------
const vendWords=vid=>{const n=(J.get("accounts",vid)?.name||"").toLowerCase();return n.split(/[^a-z]+/).filter(w=>w.length>3&&!/^(private|limited|ltd|pvt|india|foods?|store)$/.test(w))};
let recBusy=false;
J.billsReconcile=async()=>{if(recBusy||J.readOnly())return;recBusy=true;let changed=0;try{
  const bills=J.all("bills");const groups={};for(const b of bills)(groups[b.vendor+"|"+(b.orderNo||b.invNo)]??=[]).push(b);
  const used=new Set(bills.map(b=>b.pay?.vid).filter(Boolean));const susId=J.sysAcc("suspense")?.id;
  for(const [key,g] of Object.entries(groups)){const vend=g[0].vendor;const tot=r2(g.reduce((s,b)=>s+b.total,0));const d0=g.map(b=>b.date).sort()[0],d1=g.map(b=>b.date).sort().at(-1);
    let pay=g.find(b=>b.pay)?.pay;
    if(!pay){const W=vendWords(vend);const cands=J.all("vouchers").filter(v=>v.type!=="purchase"&&!used.has(v.id)&&v.date>=addDays(d0,-7)&&v.date<=addDays(d1,7)&&(v.lines||[]).some(l=>(l.a===vend&&l.dr>0)||(l.a===susId&&l.dr>0&&W.some(w=>(v.narr||"").toLowerCase().includes(w)))))
        .map(v=>{const amt=r2((v.lines||[]).filter(l=>(l.a===vend||l.a===susId)&&l.dr>0).reduce((s,l)=>s+l.dr,0));return {v,amt,gap:Math.abs(amt-tot)}}).sort((a,b)=>a.gap-b.gap||Math.abs(+new Date(a.v.date)-+new Date(d0))-Math.abs(+new Date(b.v.date)-+new Date(d0)));
      const c=cands[0];if(c&&(c.gap<=1||cands.length===1)){
        // a payment the bank import parked in Suspense is moved to the supplier
        if(c.v.lines.some(l=>l.a===susId&&l.dr>0)&&!c.v.lines.some(l=>l.a===vend)){await J.postVoucher({...c.v,id:c.v.id,lines:c.v.lines.map(l=>l.a===susId&&l.dr>0?{...l,a:vend}:l),party:vend,narr:c.v.narr})}
        pay={vid:c.v.id,no:c.v.no,date:c.v.date,amt:c.amt};used.add(c.v.id)}}
    const diff=pay?r2(pay.amt-tot):0;const jid="v-bpd-"+key.replace(/[^\w-]/g,"").slice(-40);const old=J.get("vouchers",jid);
    if(pay&&Math.abs(diff)>=0.5){const sus=susId||await J.ensureAcc("Suspense (to classify)","suspense","suspense");
      const L=diff>0?[{a:sus,dr:diff,cr:0},{a:vend,dr:0,cr:diff}]:[{a:vend,dr:-diff,cr:0},{a:sus,dr:0,cr:-diff}];
      if(!old||Math.abs((old.lines||[])[0]?.dr-Math.abs(diff))>0.004){await J.postVoucher({id:old?jid:undefined,newId:jid,type:"journal",date:pay.date>d1?pay.date:d1,lines:L,party:vend,narr:`Bill vs payment difference · ${J.accName(vend)} ${g.map(b=>b.invNo).join(" + ")}: paid ${money(pay.amt)} (${pay.no}) against bills ${money(tot)} — held in Suspense for verification`,src:{col:"bills",id:g[0].id,label:"Bill tally"}});changed++}}
    else if(old){await J.store.del("vouchers",jid);changed++}
    const st=pay?(Math.abs(diff)<0.5?"matched":"mismatch"):"unpaid";
    for(const b of g){if(b.status!==st||JSON.stringify(b.pay||null)!==JSON.stringify(pay||null)||b.diff!==diff||b.groupTotal!==tot){await J.store.patch("bills",b.id,{pay:pay||null,status:st,diff,groupTotal:tot,diffVid:pay&&Math.abs(diff)>=0.5?jid:""});changed++}}}
  }finally{recBusy=false}if(changed)J.refresh();return changed};
J.act("billTally",async()=>{const n=await J.billsReconcile();toast(n?"Bills re-checked against payments":"Nothing new to match");J.render()});
J.act("billVerify",async el=>{const b=J.get("bills",el.dataset.x);await J.safe(()=>J.store.patch("bills",b.id,{verified:b.verified?null:{by:S.me.email,at:Date.now()}}),b.verified?"Verification removed":"Marked verified")});
J.act("billFile",el=>{const b=J.get("bills",el.dataset.x);if(b?.file)J.fileView(b.file,b.invNo)});
J.act("billPay",el=>{const b=J.get("bills",el.dataset.x);const g=J.all("bills").filter(x=>x.vendor===b.vendor&&(x.orderNo||x.invNo)===(b.orderNo||b.invNo));const tot=r2(g.reduce((s,x)=>s+x.total,0));
  J.drawer({title:"Record payment · "+J.accName(b.vendor),submit:"Post payment",body:`<p class="hint">Use this only if the payment is not in an uploaded bank statement (cash, card, or a bank not uploaded yet). Otherwise upload the statement and press “Match payments”.</p><div class="form">${fld("Date",`<input type="date" name="date" id="f-date" value="${b.date}">`)}${fld("Amount (₹)",num("amt",tot))}${fld("Paid from",J.selA("from",["bank","cash","card"],"","Choose"))}${fld("Reference",txt("ref",""))}</div>`,
    onSubmit:async fd=>{if(!fd.from)return "Choose where it was paid from.";if(!(+fd.amt>0))return "Enter the amount.";const v=await J.postVoucher({type:"payment",date:fd.date,lines:[{a:b.vendor,dr:+fd.amt,cr:0},{a:fd.from,dr:0,cr:+fd.amt}],party:b.vendor,ref:fd.ref,narr:"Payment for "+g.map(x=>x.invNo).join(" + ")});
      for(const x of g)await J.store.patch("bills",x.id,{pay:{vid:v.id,no:v.no,date:v.date,amt:+fd.amt}});await J.billsReconcile()}})});
J.act("billDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again — removes the entry and stock too";return}const b=J.get("bills",el.dataset.x);
  await J.safe(async()=>{if(b.vid)await J.store.del("vouchers",b.vid);if(b.moveId)await J.store.del("moves",b.moveId);if(b.diffVid&&J.all("bills").filter(x=>x.diffVid===b.diffVid).length<=1)await J.store.del("vouchers",b.diffVid);await J.store.del("bills",b.id)},"Bill removed");setTimeout(()=>J.billsReconcile(),800)});
// ---------------- Bills tab ----------------
const ST={matched:["ok","Paid · matched"],mismatch:["warn","Paid · difference in Suspense"],unpaid:["plain","Payment not found yet"]};
J.vBills=()=>{const U=J.ui("bills",{q:"",st:""});const q=(U.q||"").toLowerCase();const all=J.all("bills").sort((a,b)=>b.date.localeCompare(a.date)||(b.invNo||"").localeCompare(a.invNo||""));
  const list=all.filter(b=>(!U.st||b.status===U.st||(U.st==="unverified"&&!b.verified))&&(!q||[b.invNo,b.orderNo,b.vendorName,J.accName(b.vendor),...(b.lines||[]).map(l=>l.desc)].join(" ").toLowerCase().includes(q)));
  const sum=k=>all.filter(b=>b.status===k).length;const susp=all.filter(b=>b.status==="mismatch").reduce((s,b,i,arr)=>arr.findIndex(x=>x.diffVid===b.diffVid)===i?s+Math.abs(b.diff||0):s,0);
  setTimeout(()=>{if(!J._billRecAt||Date.now()-J._billRecAt>60000){J._billRecAt=Date.now();J.billsReconcile()}},500);
  return `<div class="kpis">${J.kpi("Bills",String(all.length),money(all.reduce((s,b)=>s+b.total,0)))}${J.kpi("Matched to payment",String(sum("matched")),"exact amount")}${J.kpi("Difference in Suspense",String(sum("mismatch")),money(susp))}${J.kpi("Payment not found",String(sum("unpaid")),"upload the bank statement")}</div>
  <div class="filters">${fld("Search",`<input data-ui="bills.q" id="bl-q" value="${esc(U.q)}" placeholder="Invoice, order, item…">`)}<div class="seg">${[["","All"],["matched","Matched"],["mismatch","Difference"],["unpaid","Unpaid"],["unverified","Not verified"]].map(([k,l])=>`<button data-set="bills.st=${k}" aria-pressed="${(U.st||"")===k}">${l}</button>`).join("")}</div>
    <div class="row" style="margin-left:auto;gap:6px"><button class="btn" data-a="billTally">Match payments</button>${J.readOnly()?"":`<button class="btn primary w" data-a="billUpload">Upload bills (PDF)</button>`}</div></div>
  ${list.length?`<div class="panel"><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Supplier · bill</th><th>Lines</th><th class="num">Amount</th><th>Accounts entry</th><th>Payment</th><th>Verified</th><th></th></tr></thead><tbody>
  ${list.map(b=>{const s=ST[b.status]||ST.unpaid;const v=J.get("vouchers",b.vid);return `<tr><td class="nowrap">${fmtDate(b.date)}</td><td><b>${esc(J.accName(b.vendor))}</b><div class="mono hint">${esc(b.invNo)}${b.orderNo?" · "+esc(b.orderNo):""}</div><span class="chip plain">${esc(b.docType||"")}</span></td>
    <td class="hint" style="max-width:320px">${(b.lines||[]).map(l=>esc(l.desc)).join(" · ")}</td><td class="num"><b>${money(b.total)}</b>${b.groupTotal&&Math.abs(b.groupTotal-b.total)>0.01?`<div class="hint">order ${money(b.groupTotal)}</div>`:""}</td>
    <td>${v?`<button class="linkbtn vno" data-a="editv" data-x="${v.id}">${esc(v.no)}</button>`:'<span class="chip bad">missing</span>'}${b.moveId?`<div class="hint">+ stock received</div>`:""}</td>
    <td><span class="chip ${s[0]}">${s[1]}</span>${b.pay?`<div class="hint">${esc(b.pay.no||"")} · ${fmtDate(b.pay.date)} · ${money(b.pay.amt)}</div>`:""}${b.status==="mismatch"?`<div class="hint">Difference ${money(Math.abs(b.diff))} ${b.diff>0?"paid extra":"short paid"} → <button class="linkbtn vno" data-a="editv" data-x="${b.diffVid}">${esc(J.get("vouchers",b.diffVid)?.no||"entry")}</button></div>`:""}${b.status==="unpaid"&&!J.readOnly()?`<div><button class="linkbtn" data-a="billPay" data-x="${b.id}">Record payment</button></div>`:""}</td>
    <td>${b.verified?`<button class="chip ok" data-a="billVerify" data-x="${b.id}" title="${esc(b.verified.by)}">✓ ${fmtDate(new Date(b.verified.at).toISOString().slice(0,10))}</button>`:J.readOnly()?"—":`<button class="btn small" data-a="billVerify" data-x="${b.id}">Mark verified</button>`}</td>
    <td class="nowrap">${b.file?`<button class="btn small" data-a="billFile" data-x="${b.id}">📄 Bill</button>`:""}${J.readOnly()?"":` <button class="btn small danger" data-a="billDel" data-x="${b.id}">Delete</button>`}</td></tr>`}).join("")}</tbody></table></div></div>`
  :`<div class="panel"><div class="empty"><strong>No bills yet</strong><span>Upload Hyperpure (or other supplier) PDF bills — items go into stock, charges to expenses, and the bill is matched to your bank payment.</span></div></div>`}
  <p class="hint">Hyperpure bills of one order (tax invoice + bill of supply) are matched together against one payment. Payments are looked for 7 days either side of the bill date, in the supplier's ledger and in Suspense (bank lines not yet classified). Item photos: open an item in Item master → “Find on Hyperpure”, copy the picture's address and paste it into the item's image.</p>`};
})();
