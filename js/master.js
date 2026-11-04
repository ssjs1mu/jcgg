/* Master lists (Inventory → Master lists): one place for the lists every entry should pick from, as editable sheets.
   Categories  Division → Category → Sub-category → Micro-categories (the items / connections)
   Vendors     every supplier, marketplace, service, aggregator, utility
   Utilities   one row per electricity meter, mobile, broadband, LPG connection (number, provider, user, division)
   Item catalog  every item as bought: category, sub-category, item, brand, weight, unit, pack — brands kept apart so rates compare
   Stock items   the items already in stock, with the new category / sub-category / brand, and whether they are in JCGG stock
   The supplied lists load once from data/master.json; after that everything is edited here (cells save as you leave them). */
(()=>{
const J=window.J,{S,esc,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ui=()=>J.ui("ml",{t:"stock",q:"",cat:"",only:"all"});
const M=()=>J.get("meta","master")||{id:"master",vendors:[],utils:[],tree:[]};
const MI=()=>J.get("meta","masterItems")||{id:"masterItems",items:[]};
const loaded=()=>!!J.get("meta","master");

// ---- rules that place a stock item in the new category / sub-category (market practice) ----
const R=[
 [/watch|t-?shirt|polo neck|shirt|slipper|legging|bandana|shoe wipes|towel|wash bag/,"Personal","Clothing & Accessories"],
 [/charger|usb|adapter|adaptor|speaker|smart ?watch|cable|phone|flip cover|gimbal|door chime|realme/,"Personal","Electronics & Gadgets"],
 [/lip balm|face wash|body wash|shampoo|toothpaste|toothbrush|sanitary|shilajit|sanjeevani|heating bag|walking stick|glucose-?d|handwash|nykaa|hair dryer/,"Personal","Health & Personal Care"],
 [/pencil|atlas|marker|toy|figurine|incywincy/,"Personal","Kids & Childcare"],
 [/statue|planter|decor|window film|water purifier|shade net|seat cover|gym ball|diwali|led (bulb|meteor)/,"Personal","Household & Groceries"],
 [/baygon|good knight|hit gel|mosquito/,"Cleaning & Housekeeping","Pest control"],
 [/detergent|dish ?wash|phynel|phenyl|floor|cleaner|cleaning|wd-?40|eraser|wash cloth|swab/,"Cleaning & Housekeeping","Chemicals & tools"],
 [/broom|duster|mop/,"Cleaning & Housekeeping","Chemicals & tools"],
 [/container|cling|foil|kitchen paper|tissue|hair cap|apron|napkin/,"Packaging & Disposables","Packing & table consumables"],
 [/knife|scissor|khunti|blade|pot\b|pan\b|strainer|lighter|organizer|bbq|tray|weighing|french press|cooker|jug|bottle|kool-?sip|holder rack|peeler|stand for kitchen|oven stand|inner stainless/,"Kitchenware & Equipment","Utensils & small appliances"],
 [/agarbatti|pooja|kumbh|wick|gulal|attar/,"Travel & Misc","Pooja & festival"],
 [/water \d|water pack|kinley|bisleri|aquafina|soda|sprite|thum|coca|cola|limca|fanta|pepsi|maaza|paper ?boat|boba|mocktail|iced tea|juice|aamras|ampanna|shake|chiller|banta|lemoneez|nata de coco|energy|sparkling/,"Beverages","Chiller & packaged"],
 [/tea\b|coffee|premix/,"Beverages","Tea & Coffee"],
 [/mustard oil|soya|soyabean|sunflower|palmolein|rice ?bran|cottonseed|peanut oil|vanaspati|refined oil|\boil\b/,"Oils & Fats","Cooking oils"],
 [/french fries|aloo tikki|cheese balls|frozen|bangur/,"Frozen & Canned","Frozen"],
 [/bread|cake|biscuit|cookie|cracker|chips|papad|boondi|chocolate|kinder|eclair|truffle|snack|noodles|mukhwas|hajmola|muesli|momo/,"Bakery, Snacks & Confectionery","Bakery, biscuits & snacks"],
 [/paneer|milk|curd|dahi|doi|cheese|butter|cream|ghee|margarine|fat spread|whitener|yogurt|yoghurt/,"Dairy","Dairy"],
 [/sauce|ketchup|mayo|puree|vinegar|dressing|chutney|jam\b|pickle|honey|msg|ajinomoto|syrup|essence/,"Sauces & Condiments","Sauces, pastes & jams"],
 [/pasta|penne|vermicell|sewai|atta|maida|besan|sooji|suji|sattu|corn ?flour|rice flour|dal\b|poha|soya chunk|matar|moong|chana|urad|sugar|\bsalt\b|baking|eno\b/,"Dry Grocery","Flour, pulses, pasta & sugar"],
 [/cashew|raisin|kismis|magaj|desiccated|coconut powder|almond|dry fruit/,"Dry Fruits & Nuts","Dry fruits"],
 [/masala|powder|seed|jeera|pepper|clove|cassia|cardamom|elaichi|hing|panch|seasoning|oregano|rosemary|sage|saunf|methi|tej patta|bay leaf|ajwain|javitri|jayphal|dalchini|star anise|kalonji|chilli (flakes|whole)|turmeric|spice|aromatic|mix\b/,"Spices & Seasonings","Spices & masala"],
 [/banana|papaya|mosambi|sweet lime|kinnow|apple|mango|grapes|melon|guava|orange\b|fruit/,"Fresh Produce","Fruits"],
 [/lettuce|broccoli|zucchini|parsley|leek|basil|cherry tomato|baby corn|avocado|jalapeno|arugula|mushroom|celery|iceberg|red cabbage|capsicum \((red|yellow)/,"Fresh Produce","Vegetables - Exotic & Herbs"],
 [/potato|onion|tomato|carrot|cabbage|capsicum|chilli|ginger|garlic|lemon|coriander|mint|spinach|palak|brinjal|bhindi|lady|bitter gourd|karela|cucumber|beans|beetroot|drumstick|methi|cauliflower|pumpkin|pumkin|peas|coconut|parwal|kundru|sprouts|curry leaves|green/,"Fresh Produce","Vegetables - Indian"]];
const cls=(name)=>{const l=String(name||"").toLowerCase();for(const [re,c,s] of R)if(re.test(l))return [c,s];return ["",""]};
const BRANDS=["Golden Crown","Pou Chong Kim","Pou Chong","Foodrite","Wingreens","Veeba","Cookme","Eastmade","Everest","MDH","Tata Sampann","Tata Tea","Aashirvaad","Fortune","Mayurank","Shuddh","Classic","Agro Fresh","Ganesh","Paper Boat","Rich's","Red Cow","Milky Mist","Mother Dairy","Keventer Metro","Keventer","Amul","Adya","Delish","Dabur","Kinley","Clear","Hershey's","Epigamia","Real","Charged","Kissan","Del Monte","Knorr","WeikField","Origami","Glen","Lijjat","Noice","Unibic","Springburst","Nutralite","Doctors' Choice","Kings","Mahakosh","Pou Chong","Himani","Moi Soi","Borecha","The Good Vibe","Bombay Banta","Coca Cola","Sprite"];
const brandOf=n=>{const l=String(n).toLowerCase();const m=String(n).match(/\(([^)]+)\)\s*$/);for(const b of BRANDS)if(l.startsWith(b.toLowerCase()+" ")||l.startsWith(b.toLowerCase()+" -"))return b;return m&&!/organic|economy|local|hybrid|medium|bold|mix|small|fresh|green|farm|premium|big|loose|forest|peeled|desi|bharta|farsi|sukhsagar|pack|\d/i.test(m[1])?m[1]:""};

// ---- save helpers ----
async function saveM(m){await J.store.put("meta",{...m,id:"master"})}
async function saveI(m){await J.store.put("meta",{...m,id:"masterItems"})}
J.act("mlLoad",async el=>{if(loaded()&&el?.tagName==="BUTTON"&&!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again — replaces your edits";setTimeout(()=>{if(el.isConnected){delete el.dataset.armed;el.textContent="Reload supplied lists"}},4000);return}try{const r=await fetch("data/master.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("List file not found ("+r.status+")");const d=await r.json();
  await saveM({vendors:d.vendors,utils:d.utils,tree:d.tree,v:d.v,loadedAt:Date.now()});await saveI({items:d.items});toast(`Master lists loaded: ${d.vendors.length} vendors, ${d.utils.length} connections, ${d.tree.length} sub-categories, ${d.items.length} items`);J.render()}catch(e){toast(e.message)}});
const SH={tree:["M","tree"],vendors:["M","vendors"],utils:["M","utils"],items:["I","items"]};
J.act("mlSet",async el=>{const {s,i,f}=el.dataset;const [w,k]=SH[s]||[];if(!w)return;const m=w==="M"?M():MI();const list=arr(m[k]).map(x=>({...x}));const row=list[+i];if(!row)return;
  row[f]=f==="micros"?String(el.value).split(",").map(x=>x.trim()).filter(Boolean):el.value.trim();list[+i]=row;await (w==="M"?saveM:saveI)({...m,[k]:list});if(f==="div"||s==="tree")J.render()});
J.act("mlAdd",async el=>{const s=el.dataset.x;const U=ui();const [w,k]=SH[s];const m=w==="M"?M():MI();const list=arr(m[k]).map(x=>({...x}));
  const blank={tree:{div:"JCGG",cat:"",sub:"",micros:[]},vendors:{id:"v"+uid(),name:"",type:"",div:"JCGG",cat:"",note:""},utils:{id:"u"+uid(),util:"",conn:"",no:"",prov:"",user:"",div:"JCGG",note:""},items:{div:"JCGG",cat:U.cat||"",sub:"",item:"",brand:"",wt:"",unit:"",packof:"",ptype:"",note:""}}[s];
  list.push(blank);await (w==="M"?saveM:saveI)({...m,[k]:list});J.render()});
J.act("mlDel",async el=>{const [s,i]=String(el.dataset.x).split("|");const [w,k]=SH[s];const m=w==="M"?M():MI();const list=arr(m[k]).filter((_,j)=>j!==+i);await (w==="M"?saveM:saveI)({...m,[k]:list});S.confirm=null;J.render()});
J.act("mlStock",async el=>{const it=J.get("items",el.dataset.x);if(!it)return;await J.store.put("items",{...it,[el.dataset.f]:el.value.trim()})});
J.act("mlApply",async()=>{let n=0;for(const it of J.all("items")){if(it.mcat&&it.msub&&(it.brand||it.mbrandDone))continue;const [c,s]=cls(it.name);const b=it.brand||brandOf(it.name);if(!c&&!b)continue;
  await J.store.put("items",{...it,mcat:it.mcat||c,msub:it.msub||s,...(b&&!it.brand?{brand:b}:{}),mbrandDone:true});n++}toast(n?`Suggested category / brand saved on ${n} stock items — check them in this sheet`:"Nothing new to suggest");J.render()});
J.act("mlCsv",()=>{const t=ui().t;const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';let rows=[];
  if(t==="tree")rows=[["Division","Category","Sub-category","Micro-categories"],...arr(M().tree).map(r=>[r.div,r.cat,r.sub,arr(r.micros).join(", ")])];
  else if(t==="vendors")rows=[["Vendor","Type","Division","Default category","Note"],...arr(M().vendors).map(r=>[r.name,r.type,r.div,r.cat,r.note])];
  else if(t==="utils")rows=[["Utility","Connection","Number","Provider","Used by","Division","Note"],...arr(M().utils).map(r=>[r.util,r.conn,r.no,r.prov,r.user,r.div,r.note])];
  else if(t==="items")rows=[["Division","Category","Sub-category","Item","Brand","Weight","Unit","Pack of","Pack type"],...arr(MI().items).map(r=>[r.div,r.cat,r.sub,r.item,r.brand,r.wt,r.unit,r.packof,r.ptype])];
  else rows=[["Item","Unit","Category (old)","Category","Sub-category","Brand","In JCGG stock"],...J.all("items").map(i=>[i.name,i.unit,i.cat,i.mcat,i.msub,i.brand,(J.D?.inv?.items[i.id]?.inInv)?"Yes":"No"])];
  J.saveFile?.("jcgg-master-"+t+".csv","﻿"+rows.map(r=>r.map(q).join(",")).join("\r\n"),"text/csv")});

// ---- views ----
const inp=(s,i,f,v,w)=>`<input data-ach="mlSet" data-s="${s}" data-i="${i}" data-f="${f}" value="${esc(v??"")}" style="min-width:${w||110}px">`;
const divSel=(s,i,v)=>`<select data-ach="mlSet" data-s="${s}" data-i="${i}" data-f="div">${["JCGG","Personal","Both"].map(o=>`<option ${/^personal/i.test(v)&&o==="Personal"||/^both/i.test(v)&&o==="Both"||/^jcgg/i.test(v)&&o==="JCGG"?"selected":""}>${o}</option>`).join("")}</select>`;
const del=(s,i)=>J.confirmBtn("ml:"+s+i,"Delete this row","mlDel",s+"|"+i);
const wrap=(s,head,body,foot)=>`<div class="panel"><div class="tbl-wrap"><table class="grid-x fit"><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${body||`<tr><td colspan="${head.length}" class="muted">Nothing here yet.</td></tr>`}</tbody></table></div>${foot||""}</div>`;
function vML(){const U=ui();
  const tabs=[["stock","Stock items"],["items","Item catalog"],["tree","Categories"],["vendors","Vendors"],["utils","Utilities"]];
  const nav=`<div class="filters">${tabs.map(([k,t])=>`<button class="btn w" data-set="ml.t=${k}" aria-pressed="${U.t===k}">${t}</button>`).join("")}<button class="btn w" data-a="mlCsv">Download sheet (CSV)</button>${loaded()?`<button class="btn w" data-a="mlLoad" title="Re-load the supplied lists (replaces your edits)">Reload supplied lists</button>`:""}</div>`;
  if(!loaded()&&U.t!=="stock")return nav+`<div class="panel"><h2>Master lists not loaded yet</h2><p class="hint">Load the supplied vendor, category, utility and item lists once. After that every cell is editable here and saves as you leave it.</p><button class="btn primary w" data-a="mlLoad">Load master lists</button></div>`;
  const add=s=>`<div class="filters"><button class="btn w" data-a="mlAdd" data-x="${s}">＋ Add row</button><span class="hint">Edit a cell and tap outside it to save.</span></div>`;
  if(U.t==="tree"){const L=arr(M().tree);const mb=L.map((r,i)=>`<tr><td>${divSel("tree",i,r.div)}</td><td>${inp("tree",i,"cat",r.cat,170)}</td><td>${inp("tree",i,"sub",r.sub,170)}</td><td>${inp("tree",i,"micros",arr(r.micros).join(", "),420)}<div class="hint">${arr(r.micros).length} micro-categories</div></td><td>${del("tree",i)}</td></tr>`).join("");return nav+add("tree")+wrap("tree",["Division","Category","Sub-category","Micro-categories (items / connections, comma separated)",""],mb)}
  if(U.t==="vendors"){const L=arr(M().vendors);const mb=L.map((r,i)=>`<tr><td>${inp("vendors",i,"name",r.name,210)}</td><td>${inp("vendors",i,"type",r.type,150)}</td><td>${divSel("vendors",i,r.div)}</td><td>${inp("vendors",i,"cat",r.cat,200)}</td><td>${inp("vendors",i,"note",r.note,220)}</td><td>${del("vendors",i)}</td></tr>`).join("");return nav+add("vendors")+wrap("vendors",["Vendor","Type","Division","Default category","Note",""],mb)}
  if(U.t==="utils"){const L=arr(M().utils);const mb=L.map((r,i)=>`<tr><td>${inp("utils",i,"util",r.util,110)}</td><td>${inp("utils",i,"conn",r.conn,170)}</td><td>${inp("utils",i,"no",r.no,130)}</td><td>${inp("utils",i,"prov",r.prov,100)}</td><td>${inp("utils",i,"user",r.user,130)}</td><td>${divSel("utils",i,r.div)}</td><td>${inp("utils",i,"note",r.note,150)}</td><td>${del("utils",i)}</td></tr>`).join("");return nav+add("utils")+wrap("utils",["Utility","Connection","Number / consumer no.","Provider","Used by","Division","Note",""],mb)}
  if(U.t==="items"){const L=arr(MI().items);const cats=[...new Set(L.map(r=>r.cat))].sort();const q=(U.q||"").toLowerCase();
    const rows=L.map((r,i)=>[r,i]).filter(([r])=>(!U.cat||r.cat===U.cat)&&(!q||(r.item+" "+r.brand+" "+r.sub).toLowerCase().includes(q)));
    const mb=rows.map(([r,i])=>`<tr><td>${esc(r.cat)}</td><td>${inp("items",i,"sub",r.sub,150)}</td><td>${inp("items",i,"item",r.item,200)}</td><td>${inp("items",i,"brand",r.brand,120)}${r.note?`<div class="hint">${esc(r.note)}</div>`:""}</td><td>${inp("items",i,"wt",r.wt,60)}</td><td>${inp("items",i,"unit",r.unit,50)}</td><td>${inp("items",i,"packof",r.packof,70)}</td><td>${inp("items",i,"ptype",r.ptype,90)}</td><td>${del("items",i)}</td></tr>`).join("");
    return nav+`<div class="filters"><select data-ui="ml.cat"><option value="">All categories</option>${cats.map(c=>`<option ${U.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select><input data-ui="ml.q" value="${esc(U.q||"")}" placeholder="Search item / brand" style="max-width:220px"><button class="btn w" data-a="mlAdd" data-x="items">＋ Add item</button><span class="hint">${rows.length} of ${L.length} items · same item, different brand = separate rows so rates can be compared</span></div>`+wrap("items",["Category","Sub-category","Item","Brand","Weight","Unit","Pack of","Pack type",""],mb)}
  // stock items
  const I=J.D?.inv?.items||{};const all=J.all("items").slice().sort((a,b)=>(a.mcat||"~").localeCompare(b.mcat||"~")||a.name.localeCompare(b.name));const q=(U.q||"").toLowerCase();
  const rows=all.filter(it=>(U.only==="all"||(U.only==="stock"?I[it.id]?.inInv:U.only==="out"?!I[it.id]?.inInv:U.only==="unset"?!it.mcat:true))&&(!q||(it.name+" "+(it.brand||"")+" "+(it.mcat||"")).toLowerCase().includes(q)));
  const dl=`<datalist id="ml-cats">${[...new Set(arr(M().tree).map(r=>r.cat))].map(c=>`<option value="${esc(c)}">`).join("")}</datalist>`;
  const mb=rows.map(it=>{const x=I[it.id]||{};const inS=x.inInv;const pers=/^personal/i.test(it.mcat||"");return `<tr><td style="min-width:240px">${esc(it.name)}</td><td class="hint">${esc(it.cat||"")}${it.sub?" › "+esc(it.sub):""}</td><td><input data-ach="mlStock" data-x="${esc(it.id)}" data-f="mcat" list="ml-cats" value="${esc(it.mcat||"")}" style="min-width:170px"></td><td><input data-ach="mlStock" data-x="${esc(it.id)}" data-f="msub" value="${esc(it.msub||"")}" style="min-width:150px"></td><td><input data-ach="mlStock" data-x="${esc(it.id)}" data-f="brand" value="${esc(it.brand||"")}" style="min-width:110px"></td><td>${inS?'<span class="chip ok">In JCGG stock</span>':'<span class="chip">Not in stock</span>'}${pers&&inS?' <span class="chip warn">Personal — move out</span>':""}</td></tr>`}).join("");
  const nOut=all.filter(it=>!I[it.id]?.inInv).length,nSet=all.filter(it=>it.mcat).length;
  return nav+dl+`<div class="filters"><button class="btn primary w" data-a="mlApply">Suggest category &amp; brand for items without one</button>${[["all","All"],["stock","In JCGG stock"],["out","Not in stock (personal / expense / asset)"],["unset","No category yet"]].map(([k,t])=>`<button class="btn w" data-set="ml.only=${k}" aria-pressed="${U.only===k}">${t}</button>`).join("")}<input data-ui="ml.q" value="${esc(U.q||"")}" placeholder="Search" style="max-width:200px"><span class="hint">${all.length} items · ${nSet} with a category · ${nOut} kept out of JCGG stock</span></div>`+wrap("stock",["Stock item","Old group","Category","Sub-category","Brand","JCGG stock?"],mb);
}
const inv=J.MODS.find(m=>m.id==="inventory");if(inv){const i=inv.tabs.findIndex(t=>t[0]==="items");inv.tabs.splice(i<0?inv.tabs.length:i+1,0,["masterlists","Master lists",vML])}
})();
