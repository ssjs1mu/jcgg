/* Kitchen: the menu master — item, category, Ground Floor / Mezzanine / breakfast / staff rates, online availability (online sells at Mezzanine rate). Uploaded from Excel. */
(()=>{
const J=window.J,{S,esc,inr,inr0,r2,money0,fmtDate,today,uid,fld,txt,num,selO,area,toast}=J;
const ui=()=>J.ui("kit",{q:"",cat:"",only:"",view:"tiles"});
const RATES=[["gr","Ground Floor"],["mez","Mezzanine Floor"],["grBf","Gr. Flr. Breakfast"],["mezBf","Mez. Flr. Breakfast"],["staff","Staff rate"]];
const rate=(m,k)=>{const v=m.rates?.[k];return v===""||v==null?(k==="gr"&&m.price?+m.price:null):+v};
J.menuRate=rate;J.MENU_RATES=RATES;
// staff KOT price: the staff rate when the item carries one, otherwise the Ground Floor rate
J.staffPrice=m=>{const s=rate(m,"staff");if(s!=null&&s>0)return {rate:s,basis:"staff"};const g=rate(m,"gr");return {rate:g||0,basis:"gr"}};
const items=()=>J.all("menu").filter(m=>m.active!==false).sort((a,b)=>(a.cat||"").localeCompare(b.cat||"")||a.name.localeCompare(b.name));
J.menuItems=items;
function vMenu(){if(!autoRan){autoRan=true;setTimeout(()=>J.kitAutoFill(),300)}const U=ui();const q=(U.q||"").toLowerCase();const all=items();const cats=[...new Set(all.map(m=>m.cat||"Other"))].sort();
  const list=all.filter(m=>(!U.cat||(m.cat||"Other")===U.cat)&&(!q||(m.name+" "+(m.cat||"")).toLowerCase().includes(q))&&(U.only!=="online"||m.online)&&(U.only!=="staff"||rate(m,"staff")>0)&&(!U.rc||(U.rc==="rcp")===hasRcp(m)));
  const f=v=>v==null?'<span class="muted">—</span>':inr0.format(v);
  if(J.limited()||J.isCC())return kitStaffView(U,all,cats,list);
  return `<div class="filters">${fld("Search",`<input id="km-q" data-ui="kit.q" value="${esc(U.q)}" placeholder="Dish or category" style="min-width:220px">`)}${fld("Category",`<select id="km-cat" data-ui="kit.cat"><option value="">All (${all.length})</option>${cats.map(c=>`<option ${U.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select>`)}
    <div class="seg">${[["","All"],["online","Online"],["staff","Staff items"]].map(([k,l])=>`<button data-set="kit.only=${k}" aria-pressed="${(U.only||"")===k}">${l}</button>`).join("")}</div>
    <div class="seg" role="group" aria-label="View">${[["tiles","▦ Tiles"],["rows","☰ Rows"]].map(([k,l])=>`<button data-set="kit.view=${k}" aria-pressed="${(U.view||"tiles")===k}">${l}</button>`).join("")}</div>
    <div class="seg">${[["","Any"],["rcp","With recipe"],["norcp","No recipe yet"]].map(([k,l])=>`<button data-set="kit.rc=${k}" aria-pressed="${(U.rc||"")===k}">${l}</button>`).join("")}</div>
    <div class="row" style="margin-left:auto;flex-wrap:wrap"><button class="btn w" data-a="kitUpload">Upload menu (Excel)</button><button class="btn" data-a="kitExport">Download menu</button><button class="btn" data-a="kitPrint">Print / PDF</button><button class="btn primary w" data-a="kitNew">+ New item</button></div></div>
  <div class="kpis">${J.kpi("Menu items",String(all.length),cats.length+" categories")}${J.kpi("Recipes written",String(all.filter(hasRcp).length)+" / "+all.length,J.RECIPE_LIB?all.filter(m=>!hasRcp(m)).length+" still to write":"English · हिंदी · বাংলা")}${J.kpi("Online",String(all.filter(m=>m.online).length),"sold at Mezzanine rates")}${J.kpi("Staff items",String(all.filter(m=>rate(m,"staff")>0).length),"others bill staff at Gr. Floor rate")}</div>
  ${(U.view||"tiles")==="tiles"?tilesHtml(list):`<div class="panel"><div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Category</th>${RATES.map(([,l])=>`<th class="num">${l}</th>`).join("")}<th>Online</th><th class="num">Online rate</th><th></th></tr></thead><tbody>
  ${list.map(m=>`<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.cat||"")}</td>${RATES.map(([k])=>`<td class="num">${f(rate(m,k))}</td>`).join("")}<td><label class="row" style="gap:4px"><input type="checkbox" data-ach="kitOnline" data-x="${m.id}" id="ko-${m.id}" ${m.online?"checked":""} aria-label="Available online"> ${m.online?"Yes":"No"}</label></td><td class="num">${m.online?f(rate(m,"mez")):'<span class="muted">—</span>'}</td><td><button class="btn small ${hasRcp(m)?"w":""}" data-a="rcpView" data-x="${m.id}">${hasRcp(m)?"📖 Recipe "+langs(m):"＋ Recipe"}</button> ${J.docsBtn("menu",m,m.name)} <button class="btn small w" data-a="kitEdit" data-x="${m.id}">Edit</button></td></tr>`).join("")||J.emptyRow(10,"No menu items yet","Upload your menu from Excel: Item name, Category, Ground Floor, Mezzanine Floor, Gr.Flr.Breakfast, Mez.Flr.Breakfast, Staff Rates, Online.")}
  </tbody></table></div></div>`}<p class="hint">Online orders are priced at the Mezzanine Floor rate. Staff KOTs use the staff rate when an item has one; otherwise the Ground Floor rate applies.</p>`}
// ---------- recipes: English / हिंदी / বাংলা, preparation, cooking method, nutrition, YouTube ----------
const LANGS=[["en","English"],["hi","हिंदी"],["bn","বাংলা"]];
const PARTS=[["ing",{en:"Ingredients",hi:"सामग्री",bn:"উপকরণ"}],["prep",{en:"Preparation",hi:"तैयारी",bn:"প্রস্তুতি"}],["cook",{en:"Cooking method",hi:"पकाने की विधि",bn:"রান্নার পদ্ধতি"}],["serve",{en:"Serving & plating",hi:"परोसने का तरीका",bn:"পরিবেশন"}]];
const NUT=[["kcal","Energy","kcal"],["protein","Protein","g"],["carbs","Carbohydrate","g"],["fat","Fat","g"],["fibre","Fibre","g"],["sugar","Sugar","g"],["sodium","Sodium","mg"]];
const hasRcp=m=>LANGS.some(([l])=>PARTS.some(([k])=>(m.recipe?.[l]?.[k]||"").trim()));
const langs=m=>LANGS.filter(([l])=>PARTS.some(([k])=>(m.recipe?.[l]?.[k]||"").trim())).map(([l])=>l.toUpperCase()).join(" · ");
const ytId=u=>{const m=String(u||"").match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);return m?m[1]:""};
const ytSearch=m=>"https://www.youtube.com/results?search_query="+encodeURIComponent(m.name+" recipe");
const photo=m=>(m.docs||[]).find(d=>/^image\//.test(d.type)&&d.thumb)?.thumb||m.img||"";
const steps=t=>{const L=String(t||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);return L.length>1?`<ol>${L.map(x=>`<li>${esc(x.replace(/^\d+[.)]\s*/,""))}</li>`).join("")}</ol>`:`<p>${esc(L[0]||"")}</p>`};
// ---------- built-in recipe library: fills any dish whose name it knows, including dishes added later ----------
const nk=s=>String(s||"").toUpperCase().replace(/[’`‘]/g,"'").replace(/\[[^\]]*\]/g," ").replace(/\((?:S|R|SEASONAL)\)/g," ").replace(/\bPCS?\b/g," ").replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").trim();
J.recipeKey=nk;
J.loadRecipeLib=()=>J.RECIPE_LIB?Promise.resolve(J.RECIPE_LIB):(J._rlibP??=new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="js/recipe-lib.js?v="+(document.querySelector('script[src*="mod-kitchen"]')?.src.split("v=")[1]||"1");sc.onload=()=>ok(J.RECIPE_LIB||{});sc.onerror=()=>{J._rlibP=null;no(new Error("Recipe library did not load"))};document.head.appendChild(sc)}));
const TYPO=[[/\bNOODILES?\b/g,"NOODLES"],[/\bMAXICAN\b/g,"MEXICAN"],[/\bLAGON\b/g,"LAGOON"],[/\bIDLE\b/g,"IDLI"],[/\bBIRYANI\b/g,"BIRIYANI"],[/\bCHOCOLATA\b/g,"CHOCOLATE"],[/\bKICHUDI|KHICHDI|KHICHUDI\b/g,"KHICHADI"]];
const libKeys=name=>{const out=[];const add=s=>{s=String(s||"").replace(/\s+/g," ").trim();if(s&&!out.includes(s))out.push(s)};
  const base=[nk(name),nk(String(name||"").split(/\s[-–]\s/)[0])];
  for(let k of base){add(k);let t=k;for(const [re,to] of TYPO)t=t.replace(re,to);add(t);
    const v=[t.replace(/\b(JC S|JOSHI S) SPL\b/,""),t.replace(/\s(DRY GRAVY|DRY|GRAVY)$/,""),t.replace(/^TANDOORI\s/,""),t.replace(/\s\d+(\s\d+)*\s?(LTR|LITRE|L|ML|GM|G)$/,"")];v.forEach(add);
    add(t.replace(/\b(JC S|JOSHI S) SPL\b/,"").replace(/^TANDOORI\s/,"").replace(/\s(DRY GRAVY|DRY|GRAVY)$/,""))}
  return out};
const libFor=name=>{const L=J.RECIPE_LIB;if(!L?.idx)return null;for(const k of libKeys(name))if(L.idx[k])return L.idx[k];return null};
J.recipeFromLib=name=>{const e=libFor(name);if(!e)return null;const split=t=>String(t||"").split("|").map(x=>x.trim()).filter(Boolean).join("\n");const recipe={};
  for(const [l] of LANGS){const a=e[l];if(!a)continue;recipe[l]={ing:split(a[0]),prep:split(a[1]),cook:split(a[2]),...(a[3]?{serve:split(a[3])}:{})}}
  const n=e.n||[];const nutrition={};["kcal","protein","carbs","fat","fibre","sugar","sodium"].forEach((k,i)=>{if(n[i]!=null)nutrition[k]=n[i]});nutrition.basis="per serving, approximate";
  return {recipe,nutrition,serves:e.s||"",prepMin:e.p||"",cookMin:e.c||"",recipeSrc:"library",recipeKey:e.key,recipeLibV:e.v||1,...(e.note?{recipeNote:e.note}:{})}};
let filling=false;
J.kitAutoFill=async quiet=>{if(filling||J.readOnly?.()||J.isCC?.()||J.limited?.()||!S.ready)return 0;filling=true;let n=0;try{await J.loadRecipeLib();
  for(const m of J.all("menu").filter(x=>(x.active!==false||x.trial)&&(!hasRcp(x)||x.recipeSrc==="library"))){const r=J.recipeFromLib(m.name);if(!r)continue;if(hasRcp(m)&&(m.recipeLibV||1)>=r.recipeLibV)continue;await J.store.patch("menu",m.id,r);n++}
  if(n&&!quiet)toast("Recipes filled from the library for "+n+" dish"+(n>1?"es":""))}catch(e){console.warn(e)}finally{filling=false}if(n)J.render();return n};
let autoRan=false;
const KV={en:{q:"Search",ph:"Dish or category",cat:"Category",all:"All",tiles:"▦ Tiles",rows:"☰ Rows",open:"Recipe",none:"No recipe yet",dish:"Dish",empty:"No dishes match"},
  hi:{q:"खोजें",ph:"व्यंजन या श्रेणी",cat:"श्रेणी",all:"सभी",tiles:"▦ टाइल",rows:"☰ सूची",open:"विधि",none:"विधि अभी नहीं",dish:"व्यंजन",empty:"कोई व्यंजन नहीं मिला"},
  bn:{q:"খুঁজুন",ph:"পদ বা বিভাগ",cat:"বিভাগ",all:"সব",tiles:"▦ টাইল",rows:"☰ তালিকা",open:"রেসিপি",none:"রেসিপি এখনও নেই",dish:"পদ",empty:"কোনো পদ পাওয়া যায়নি"}};
function kitStaffView(U,all,cats,list){const lang=U.lang||"en";const T=KV[lang]||KV.en;
  const tile=m=>{const p=photo(m);return `<article class="mtile"><button type="button" class="mt-img" data-a="rcpView" data-x="${m.id}" aria-label="${esc(T.open+": "+m.name)}">${p?`<img src="${p}" alt="">`:`<span>${esc(J.initials(m.name))}</span>`}</button>
    <div class="mt-body"><div class="mt-cat">${esc(m.cat||"Other")}</div><h3>${esc(m.name)}</h3><div class="row" style="gap:6px;margin-top:auto">${hasRcp(m)?`<button class="btn small w" data-a="rcpView" data-x="${m.id}">📖 ${T.open}</button>`:`<span class="chip warn">${T.none}</span>`}</div></div></article>`};
  return `<div class="filters" lang="${lang}"><div class="seg" role="group" aria-label="Language">${LANGS.map(([l,t])=>`<button data-set="kit.lang=${l}" lang="${l}" aria-pressed="${l===lang}">${t}</button>`).join("")}</div>
    ${fld(T.q,`<input id="km-q" data-ui="kit.q" value="${esc(U.q)}" placeholder="${T.ph}" style="min-width:200px">`)}${fld(T.cat,`<select id="km-cat" data-ui="kit.cat"><option value="">${T.all} (${dg(lang,all.length)})</option>${cats.map(c=>`<option ${U.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select>`)}
    <div class="seg" role="group">${[["tiles",T.tiles],["rows",T.rows]].map(([k,l])=>`<button data-set="kit.view=${k}" aria-pressed="${(U.view||"tiles")===k}">${l}</button>`).join("")}</div></div>
  ${!list.length?`<div class="panel"><div class="empty"><strong>${T.empty}</strong></div></div>`:(U.view||"tiles")==="tiles"?`<div class="menu-tiles">${list.map(tile).join("")}</div>`
    :`<div class="panel"><div class="tbl-wrap"><table lang="${lang}"><thead><tr><th>${T.dish}</th><th>${T.cat}</th><th></th></tr></thead><tbody>${list.map(m=>`<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.cat||"")}</td><td>${hasRcp(m)?`<button class="btn small w" data-a="rcpView" data-x="${m.id}">📖 ${T.open}</button>`:`<span class="chip warn">${T.none}</span>`}</td></tr>`).join("")}</tbody></table></div></div>`}`}
function tilesHtml(list){const f=v=>v==null?"—":"₹"+inr0.format(v);
  return list.length?`<div class="menu-tiles">${list.map(m=>{const p=photo(m);const n=m.nutrition||{};const st=rate(m,"staff"),gr=rate(m,"gr");return `<article class="mtile">
    <button type="button" class="mt-img" data-a="rcpView" data-x="${m.id}" aria-label="Open recipe for ${esc(m.name)}">${p?`<img src="${p}" alt="">`:`<span>${esc(J.initials(m.name))}</span>`}${m.online?'<em class="mt-on">Online</em>':""}</button>
    <div class="mt-body"><div class="mt-cat">${esc(m.cat||"Other")}</div><h3>${esc(m.name)}</h3>
    <div class="mt-rates"><span>Gr ${f(gr)}</span>${rate(m,"mez")!=null?`<span>Mez ${f(rate(m,"mez"))}</span>`:""}${st?`<span class="mt-staff">Staff ${f(st)}</span>`:""}</div>
    <div class="mt-tags">${hasRcp(m)?`<span class="chip ok">📖 ${langs(m)}</span>`:`<span class="chip warn">No recipe</span>`}${n.kcal?`<span class="chip plain">${esc(n.kcal)} kcal</span>`:""}${(m.videos||[]).length?`<span class="chip plain">▶ ${m.videos.length}</span>`:""}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:auto"><button class="btn small w" data-a="rcpView" data-x="${m.id}">${hasRcp(m)?"Recipe":"＋ Recipe"}</button>${J.docsBtn("menu",m,m.name)}<button class="btn small" data-a="kitEdit" data-x="${m.id}">Edit</button></div></div></article>`}).join("")}</div>`
  :`<div class="panel"><div class="empty"><strong>No items match</strong><span>Clear the filters or upload the menu.</span></div></div>`}
// ---------- servings scaler: main ingredients scale fully; salt, spices, oil, leavening and water scale less ----------
const BND="০১২৩৪৫৬৭৮৯";const toW=s=>String(s).replace(/[০-৯]/g,d=>BND.indexOf(d));const toBn=s=>String(s).replace(/\d/g,d=>BND[d]);
const UF={"½":.5,"¼":.25,"¾":.75,"⅓":1/3,"⅔":2/3,"⅛":.125};
const NUM="(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d*[½¼¾⅓⅔⅛]|\\d+(?:\\.\\d+)?)";
const QRE=new RegExp(`(${NUM})(?:\\s*[-–]\\s*(${NUM}))?`,"g");
const pN=s=>{s=s.trim();let m;if((m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/)))return +m[1]+m[2]/m[3];if((m=s.match(/^(\d+)\/(\d+)$/)))return m[1]/m[2];if((m=s.match(/^(\d*)([½¼¾⅓⅔⅛])$/)))return (+m[1]||0)+UF[m[2]];return parseFloat(s)};
const UNITS=[["kg",/^(kg|kilo|किलो|কেজি)/i],["g",/^(g|gm|gms|grams?)\b|^(ग्राम|গ্রাম)/i],["l",/^(l|ltr|litres?|liters?)\b|^(लीटर|লিটার)/i],["ml",/^(ml)\b|^(मिली|মিলি)/i],
  ["tsp",/^(tsp|teaspoons?)\b|^(छोटा चम्मच|छोटे चम्मच|চা চামচ)/i],["tbsp",/^(tbsp|tablespoons?)\b|^(बड़ा चम्मच|बड़े चम्मच|টেবিল চামচ)/i],["cup",/^(cups?)\b|^(कप|কাপ)/i],["inch",/^(inch|inches)\b|^(इंच|ইঞ্চি)/i]];
const UW={tsp:{en:["tsp","tsp"],hi:["छोटा चम्मच","छोटे चम्मच"],bn:["চা চামচ","চা চামচ"]},tbsp:{en:["tbsp","tbsp"],hi:["बड़ा चम्मच","बड़े चम्मच"],bn:["টেবিল চামচ","টেবিল চামচ"]},cup:{en:["cup","cups"],hi:["कप","कप"],bn:["কাপ","কাপ"]},kg:{en:["kg","kg"],hi:["किलो","किलो"],bn:["কেজি","কেজি"]},l:{en:["L","L"],hi:["लीटर","लीटर"],bn:["লিটার","লিটার"]}};
const SKIP=/^(?:°|º|degrees?|%|x\b|×|hours?|hrs?|minutes?|mins?|seconds?|secs?|days?|घंट|मिनट|सेकंड|दिन|ঘণ্টা|মিনিট|সেকেন্ড|দিন)/i;
// how strongly each kind of ingredient follows the number of servings (1 = straight multiplication)
const KIND=[["leaven",.9,/baking|yeast|यीस्ट|ইস্ট|\beno\b|ईनो|vinegar|सिरका|ভিনিগার|सोडा|সোডা/i],
  ["spice",.75,/salt|नमक|নুন|লবণ|chill?i(?! sauce)|(?<!शिमला )मिर्च|লঙ্কা|turmeric|हल्दी|হলুদ|masala|मसाला|মশলা|cumin|jeera|जीरा|জিরে|ajwain|अजवाइन|জোয়ান|hing|हींग|হিং|asafoetida|pepper|काली मिर्च|গোলমরিচ|cardamom|इलायची|এলাচ|clove|लौंग|লবঙ্গ|cinnamon|दालचीनी|দারচিনি|bay lea|तेजपत्त|তেজপাতা|methi|मेथी|মেথি|mustard seed|\brai\b|राई|সরষে|curry lea|करी पत्त|কারিপাতা|saffron|केसर|কেশর|essence|एसेंस|এসেন্স|amchur|अमचूर|আমচুর|oregano|ऑरेगैनो|অরিগ্যানো|flakes|फ्लेक्स|ফ্লেক্স|kalonji|nigella|कलौंजी|কালোজিরে|fennel|saunf|सौंफ|মৌরি|namak|peppercorn|coriander (?:powder|seeds?)|dhania powder|धनिया (?:पाउडर|बीज)|ধনে(?!পাতা)|\bsoy|सोया सॉस|সয়া সস|vinegar/i],
  ["fat",.85,/\boil\b|तेल|তেল|ghee|घी|ঘি|butter|मक्खन|মাখন/i],
  ["aroma",.85,/ginger|garlic|अदरक|लहसुन|আদা|রসুন/i],
  ["water",.9,/water|पानी|জল/i]];
const kindOf=seg=>KIND.find(k=>k[2].test(seg))||["main",1];
const snap=(v,step)=>Math.max(step,Math.round(v/step)*step);
function roundQ(v,unit,count){
  if(unit==="g"||unit==="ml"){const st=v<10?1:v<100?5:v<500?10:25;return [Math.max(1,Math.round(v/st)*st),unit]}
  if(unit==="kg"||unit==="l")return [snap(v,.25),unit];
  if(unit==="tsp"){if(v>=3)return roundQ(v/3,"tbsp");return [v<.25?snap(v,.125):snap(v,.25),"tsp"]}
  if(unit==="tbsp"){if(v>=8)return roundQ(v/16,"cup");return [v<2?snap(v,.25):snap(v,.5),"tbsp"]}
  if(unit==="cup")return [v<.25?snap(v,.125):v<3?snap(v,.25):snap(v,.5),"cup"];
  if(unit==="inch")return [snap(v,.5),unit];
  return [count&&v>=3?Math.max(1,Math.round(v)):snap(v,.5),unit]}
const fmtQ=v=>{const w=Math.floor(v+1e-9);const fr=v-w;const F=[[0,""],[.125,"⅛"],[.25,"¼"],[1/3,"⅓"],[.5,"½"],[2/3,"⅔"],[.75,"¾"],[1,"1"]];const [fv,fs]=F.reduce((a,b)=>Math.abs(b[0]-fr)<Math.abs(a[0]-fr)?b:a);
  if(fs==="1")return String(w+1);return (w?String(w):"")+fs||"0"};
// scale one line of recipe text; returns HTML
function scaleHtml(raw,f,lang,mode){const src=lang==="bn"?toW(raw):String(raw);const out=[];let last=0;const dig=s=>lang==="bn"?toBn(s):s;
  if(!f||Math.abs(f-1)<1e-6)return esc(raw);
  const stepSkip=mode==="step"?/\b(per|each|filling|stuffing|batter|mixture|dough)\b|प्रति|हर |भरावन|घोल|मिश्रण|प्रति|প্রতি|পুর|গোলা|মিশ্রণ|লেচি/i:null;
  for(const m of src.matchAll(QRE)){const i=m.index;const before=src.slice(0,i),after=src.slice(i+m[0].length);
    if(/[A-Za-z0-9ऀ-ॿঀ-৿]$/.test(before)&&!/\s$/.test(before))continue;
    if((before.match(/\(/g)||[]).length>(before.match(/\)/g)||[]).length)continue;
    const a=after.replace(/^\s+/,"");if(/^[-–]/.test(after)||SKIP.test(a))continue;
    const U=UNITS.find(([,re])=>re.test(a));const unit=U?.[0]||"";
    const seg=(a.split(/[,+;]|\band\b|\s\/\s/)[0]||"");
    if(mode==="step"&&(!unit||unit==="inch"||stepSkip.test(seg)))continue;
    const [kind,ex]=kindOf(seg);const k=Math.pow(f,ex);
    let v1=pN(m[1])*k,v2=m[2]?pN(m[2])*k:null;let u=unit;
    [v1,u]=roundQ(v1,unit,!unit);if(v2!=null){const C={tsp:1,tbsp:3,cup:48};const cv=C[unit]&&C[u]?C[unit]/C[u]:1;v2=roundQ(v2*cv,u,!unit)[0];}
    if((unit==="g"&&v1>=1000)){v1=snap(v1/1000,.25);if(v2!=null)v2=snap(v2/1000,.25);u="kg"}
    if((unit==="ml"&&v1>=1000)){v1=snap(v1/1000,.25);if(v2!=null)v2=snap(v2/1000,.25);u="l"}
    let q=fmtQ(v1)+(v2!=null&&Math.abs(v2-v1)>1e-6?"-"+fmtQ(v2):"");
    let uLen=0,uTxt="";if(U&&(u!==unit||UW[u])){uLen=a.match(U[1])[0].length;const L=UW[u]?.[lang]||UW[u]?.en;if(L)uTxt=(v2??v1)>1?L[1]:L[0]}
    const gap=after.length-a.length;
    out.push(esc(dig(src.slice(last,i))));
    out.push(`<b class="q${kind!=="main"?" adj":""}"${kind!=="main"?` title="${esc(tx(lang).adj[kind]+" "+tx(lang).adjTail(dig(String(+f.toFixed(2)))))}"`:""}>${esc(dig(q))}${uTxt?" "+esc(uTxt):""}</b>`);
    last=i+m[0].length+(uTxt?gap+uLen:0)}
  out.push(esc(dig(src.slice(last))));return out.join("")}
// ---------- linked recipes: "as for VEG MOMO" opens that recipe in a pop-up ----------
let refIdx=null,refAt=0;
function refIndex(){if(refIdx&&Date.now()-refAt<5000)return refIdx;const M=new Map();
  for(const m of J.all("menu").filter(x=>x.active!==false&&hasRcp(x)))M.set(nk(m.name),m.name);
  for(const k of Object.keys(J.RECIPE_LIB?.idx||{}))if(!M.has(k))M.set(k,J.RECIPE_LIB.idx[k].key);
  refAt=Date.now();return refIdx=M}
const selfKeys=m=>{const s=new Set([nk(m.name)]);const e=libFor(m.name);if(e){s.add(nk(e.key));(e.a||[]).forEach(a=>s.add(nk(a)))}if(m.recipeKey)s.add(nk(m.recipeKey));return s};
function findRefs(text,own){const M=refIndex();const hits=[];const take=(start,str)=>{const w=str.split(" ");
    for(let n=Math.min(w.length,6);n>=1;n--)for(let s=0;s+n<=w.length;s++){const ph=w.slice(s,s+n).join(" ");const k=nk(ph);if(k.length<4||!M.has(k)||own.has(k))continue;
      const off=start+w.slice(0,s).join(" ").length+(s?1:0);if(hits.some(h=>off<h.end&&off+ph.length>h.start))continue;hits.push({start:off,end:off+ph.length,name:M.get(k)})}};
  for(const m of String(text).matchAll(/[A-Z][A-Z0-9'&]*(?:[ ][A-Z0-9'&]+)*/g))if(/[A-Z]{3}/.test(m[0]))take(m.index,m[0]);
  for(const m of String(text).matchAll(/\b(?:as for|see|same as|as in)\s+([A-Za-z][A-Za-z' ]{2,48})/gi))take(m.index+m[0].length-m[1].length,m[1].trim());
  return hits.sort((a,b)=>a.start-b.start)}
// every word on the recipe screen follows the chosen language
const TX={
en:{serves:"Servings",base:"base",fewer:"Fewer servings",more:"More servings",num:"Number of servings",servesN:n=>"Serves "+n,written:(b,a)=>`recipe written for ${b}${a?", assumed":""}`,prep:n=>`Prep ${n} min`,cook:n=>`Cook ${n} min`,
  note:(w,f,b,up)=>`Quantities are worked out for ${w} servings. Main ingredients change ×${f}; <b class="q adj">underlined</b> amounts (salt, spices, chilli, oil/ghee, ginger-garlic, water, raising agents) change less, because they do not need to go up in step — taste and adjust at the end. Counts in the method (e.g. "divide into 8") are for the original ${b}; ${up?"cook in batches if the pan gets crowded, and allow a little more cooking time":"use a smaller pan so it does not dry out"}.`,
  nutrition:"Nutrition",basis:"per serving, approximate",nut:{kcal:"Energy",protein:"Protein",carbs:"Carbohydrate",fat:"Fat",fibre:"Fibre",sugar:"Sugar",sodium:"Sodium"},u:{kcal:"kcal",g:"g",mg:"mg"},notYet:"Not filled in yet.",
  video:"Video reference",openYt:"Open on YouTube ↗",searchYt:n=>`🔎 Search YouTube for “${n} recipe”`,edit:"Edit recipe & item",printOne:"Print this language",printAll:"Print all languages",
  lib:n=>`Standard recipe from the built-in library${n?" — "+n:""}. Edit it to match your kitchen's own method; your version is kept.`,close:"Close ✕",openFull:"Open full page",linkedFrom:"linked from",open:n=>`Open the ${n} recipe here`,
  adj:{spice:"Salt/spice",fat:"Oil/fat",water:"Water",leaven:"Raising agent",aroma:"Ginger/garlic"},adjTail:f=>`scaled less than ×${f} — taste and adjust`,libCat:"Recipe library",staff:"Staff",gr:"Gr. Floor",card:"recipe card",recipe:"Recipe",lang:"Language",none:"No recipe found for "},
hi:{serves:"कितने लोगों के लिए",base:"मूल",fewer:"कम लोग",more:"ज़्यादा लोग",num:"लोगों की संख्या",servesN:n=>`${n} लोगों के लिए`,written:(b,a)=>`विधि ${b} लोगों के लिए लिखी गई${a?" (अनुमानित)":""}`,prep:n=>`तैयारी ${n} मिनट`,cook:n=>`पकाना ${n} मिनट`,
  note:(w,f,b,up)=>`मात्राएँ ${w} लोगों के हिसाब से निकाली गई हैं। मुख्य सामग्री ×${f} बदली है; <b class="q adj">रेखांकित</b> मात्राएँ (नमक, मसाले, मिर्च, तेल/घी, अदरक-लहसुन, पानी, बेकिंग पाउडर/सोडा/यीस्ट) उतनी नहीं बदलतीं, क्योंकि इन्हें उसी अनुपात में बढ़ाने-घटाने की ज़रूरत नहीं होती — आख़िर में चखकर ठीक करें। विधि में लिखी गिनती (जैसे "8 लोई बनाएँ") मूल ${b} लोगों के लिए है; ${up?"बर्तन भर जाए तो हिस्सों में पकाएँ और पकने में थोड़ा ज़्यादा समय दें":"छोटा बर्तन लें ताकि खाना सूखे नहीं"}।`,
  nutrition:"पोषण",basis:"प्रति व्यक्ति, अनुमानित",nut:{kcal:"ऊर्जा",protein:"प्रोटीन",carbs:"कार्बोहाइड्रेट",fat:"वसा",fibre:"फ़ाइबर",sugar:"शक्कर",sodium:"सोडियम"},u:{kcal:"कि.कैलोरी",g:"ग्रा",mg:"मि.ग्रा"},notYet:"अभी भरा नहीं गया।",
  video:"वीडियो संदर्भ",openYt:"YouTube पर खोलें ↗",searchYt:n=>`🔎 YouTube पर “${n}” की विधि खोजें`,edit:"विधि और आइटम बदलें",printOne:"यह भाषा प्रिंट करें",printAll:"सभी भाषाएँ प्रिंट करें",
  lib:n=>`अंतर्निहित संग्रह की मानक विधि${n?" — "+n:""}। अपनी रसोई के तरीके के अनुसार बदल सकते हैं; आपका संस्करण सुरक्षित रहेगा।`,close:"बंद करें ✕",openFull:"पूरा पेज खोलें",linkedFrom:"यहाँ से खोला:",open:n=>`${n} की विधि यहीं खोलें`,
  adj:{spice:"नमक/मसाला",fat:"तेल/घी",water:"पानी",leaven:"सोडा/यीस्ट",aroma:"अदरक/लहसुन"},adjTail:f=>`×${f} से कम बदला — चखकर ठीक करें`,libCat:"विधि संग्रह",staff:"स्टाफ़",gr:"ग्राउंड फ़्लोर",card:"विधि कार्ड",recipe:"विधि",lang:"भाषा",none:"इसकी विधि नहीं मिली: "},
bn:{serves:"কতজনের জন্য",base:"মূল",fewer:"কম জন",more:"বেশি জন",num:"জনের সংখ্যা",servesN:n=>`${n} জনের জন্য`,written:(b,a)=>`রেসিপি ${b} জনের জন্য লেখা${a?" (আনুমানিক)":""}`,prep:n=>`প্রস্তুতি ${n} মিনিট`,cook:n=>`রান্না ${n} মিনিট`,
  note:(w,f,b,up)=>`পরিমাণ ${w} জনের হিসেবে করা হয়েছে। মূল উপকরণ ×${f} বদলেছে; <b class="q adj">দাগ দেওয়া</b> পরিমাণ (নুন, মশলা, লঙ্কা, তেল/ঘি, আদা-রসুন, জল, বেকিং পাউডার/সোডা/ইস্ট) ততটা বদলায় না, কারণ এগুলো একই অনুপাতে বাড়াতে-কমাতে হয় না — শেষে চেখে ঠিক করে নিন। পদ্ধতিতে লেখা সংখ্যা (যেমন "৮টি লেচি করুন") মূল ${b} জনের জন্য; ${up?"পাত্র ভরে গেলে ভাগে ভাগে রাঁধুন এবং একটু বেশি সময় দিন":"ছোট পাত্র নিন যাতে শুকিয়ে না যায়"}।`,
  nutrition:"পুষ্টিগুণ",basis:"প্রতি জন, আনুমানিক",nut:{kcal:"শক্তি",protein:"প্রোটিন",carbs:"শর্করা",fat:"ফ্যাট",fibre:"ফাইবার",sugar:"চিনি",sodium:"সোডিয়াম"},u:{kcal:"কিলোক্যালরি",g:"গ্রা",mg:"মি.গ্রা"},notYet:"এখনও দেওয়া হয়নি।",
  video:"ভিডিও সূত্র",openYt:"YouTube-এ খুলুন ↗",searchYt:n=>`🔎 YouTube-এ “${n}” রেসিপি খুঁজুন`,edit:"রেসিপি ও আইটেম বদলান",printOne:"এই ভাষা প্রিন্ট করুন",printAll:"সব ভাষা প্রিন্ট করুন",
  lib:n=>`অন্তর্নির্মিত সংগ্রহের সাধারণ রেসিপি${n?" — "+n:""}। আপনার রান্নাঘরের পদ্ধতি অনুযায়ী বদলাতে পারেন; আপনার সংস্করণ রাখা থাকবে।`,close:"বন্ধ করুন ✕",openFull:"পুরো পাতা খুলুন",linkedFrom:"যেখান থেকে খোলা:",open:n=>`${n}-এর রেসিপি এখানেই খুলুন`,
  adj:{spice:"নুন/মশলা",fat:"তেল/ঘি",water:"জল",leaven:"সোডা/ইস্ট",aroma:"আদা/রসুন"},adjTail:f=>`×${f}-এর চেয়ে কম বদলানো — চেখে ঠিক করুন`,libCat:"রেসিপি সংগ্রহ",staff:"স্টাফ",gr:"গ্রাউন্ড ফ্লোর",card:"রেসিপি কার্ড",recipe:"রেসিপি",lang:"ভাষা",none:"এর রেসিপি পাওয়া যায়নি: "}};
const tx=l=>TX[l]||TX.en;const dg=(l,s)=>l==="bn"?toBn(s):String(s);
const NOTE_TR={
"Combo plate: Hakka Noodles + Chilli Paneer (gravy)":["कॉम्बो प्लेट: हक्का नूडल्स + चिली पनीर (ग्रेवी)","কম্বো প্লেট: হাক্কা নুডলস + চিলি পনির (গ্রেভি)"],
"Combo plate: Hakka Noodles + Veg Manchurian (gravy)":["कॉम्बो प्लेट: हक्का नूडल्स + वेज मंचूरियन (ग्रेवी)","কম্বো প্লেট: হাক্কা নুডলস + ভেজ মাঞ্চুরিয়ান (গ্রেভি)"],
"Combo plate: Veg Fried Rice + Chilli Paneer (gravy)":["कॉम्बो प्लेट: वेज फ्राइड राइस + चिली पनीर (ग्रेवी)","কম্বো প্লেট: ভেজ ফ্রায়েড রাইস + চিলি পনির (গ্রেভি)"],
"Combo plate: Veg Fried Rice + Veg Manchurian (gravy)":["कॉम्बो प्लेट: वेज फ्राइड राइस + वेज मंचूरियन (ग्रेवी)","কম্বো প্লেট: ভেজ ফ্রায়েড রাইস + ভেজ মাঞ্চুরিয়ান (গ্রেভি)"],
"Eggless Kolkata-style Mughlai paratha: thin maida sheet folded around a spiced paneer-vegetable filling and shallow-fried.":["बिना अंडे का कोलकाता-स्टाइल मुग़लई पराठा: पतली मैदे की परत में मसालेदार पनीर-सब्ज़ी भरकर मोड़ा और कम तेल में तला।","ডিম ছাড়া কলকাতা-স্টাইল মোগলাই পরোটা: পাতলা ময়দার পরতে মশলাদার পনির-সবজির পুর মুড়ে অল্প তেলে ভাজা।"],
"Eggless pancakes.":["बिना अंडे के पैनकेक।","ডিম ছাড়া প্যানকেক।"],
"Fish-shaped vegetarian momo (shape only, veg filling)":["मछली के आकार का शाकाहारी मोमो (सिर्फ़ आकार, भरावन शाकाहारी)","মাছের আকারের নিরামিষ মোমো (শুধু আকার, পুর নিরামিষ)"],
"Honey is stirred in after boiling, never boiled.":["शहद उबालने के बाद मिलाएँ, कभी उबालें नहीं।","মধু ফোটানোর পরে মেশান, কখনও ফোটাবেন না।"],
"House special — standard version; adjust to your own house recipe":["हाउस स्पेशल — मानक तरीका; अपनी विधि के अनुसार बदलें","হাউস স্পেশাল — সাধারণ পদ্ধতি; নিজের রেসিপি অনুযায়ী বদলান"],
"House-style version; adjust to your own recipe":["हाउस-स्टाइल तरीका; अपनी विधि के अनुसार बदलें","হাউস-স্টাইল পদ্ধতি; নিজের রেসিপি অনুযায়ী বদলান"],
"Indo-Chinese style; adjust to your house recipe":["इंडो-चाइनीज़ स्टाइल; अपनी विधि के अनुसार बदलें","ইন্দো-চাইনিজ স্টাইল; নিজের রেসিপি অনুযায়ী বদলান"],
"Plate assembled from the day's kitchen preparations — adjust items to your current thali card":["प्लेट दिन की रसोई की तैयारियों से सजती है — मौजूदा थाली कार्ड के अनुसार आइटम बदलें","থালা সেদিনের রান্না থেকে সাজানো — বর্তমান থালি কার্ড অনুযায়ী পদ বদলান"],
"Pull-apart bread shaped like a flower with pizza filling; rested 1 hour.":["पिज़्ज़ा भरावन वाली फूल के आकार की तोड़कर खाने वाली ब्रेड; 1 घंटा रखा आटा।","পিৎজা পুর দেওয়া ফুলের আকারের ছিঁড়ে খাওয়ার রুটি; ময়দা ১ ঘণ্টা রাখা।"],
"Ready-to-serve packaged product (values for a 52 g pack; check the pack label)":["पैक्ड तैयार उत्पाद (मान 52 ग्राम पैक के; पैक का लेबल देखें)","প্যাকেটজাত তৈরি পণ্য (মান ৫২ গ্রাম প্যাকেটের; প্যাকেটের লেবেল দেখুন)"],
"Ready-to-serve packaged product (values for about 200 ml)":["पैक्ड तैयार उत्पाद (मान लगभग 200 मिली के)","প্যাকেটজাত তৈরি পণ্য (মান প্রায় ২০০ মিলির)"],
"Ready-to-serve packaged product (values for about 250 ml)":["पैक्ड तैयार उत्पाद (मान लगभग 250 मिली के)","প্যাকেটজাত তৈরি পণ্য (মান প্রায় ২৫০ মিলির)"],
"Ready-to-serve packaged product":["पैक्ड तैयार उत्पाद","প্যাকেটজাত তৈরি পণ্য"],
"Rested 2 hours (or overnight in the fridge).":["आटा 2 घंटे रखें (या रात भर फ़्रिज में)।","ময়দা ২ ঘণ্টা রাখুন (বা সারা রাত ফ্রিজে)।"],
"Seasonal":["मौसमी","মরসুমি"],
"Classic South-Indian potato bonda (16 pieces, 4 per plate).":["क्लासिक दक्षिण भारतीय आलू बोंडा (16 नग, एक प्लेट में 4)।","ক্লাসিক দক্ষিণ ভারতীয় আলুর বোন্ডা (১৬টি, প্লেটে ৪টি)।"],
"Soak the dal 3-4 hours.":["दाल 3-4 घंटे भिगोएँ।","ডাল ৩-৪ ঘণ্টা ভিজিয়ে রাখুন।"],
"Standard bread-bomb recipe; edit to match the house version if it differs.":["ब्रेड बम की मानक विधि; आपका तरीका अलग हो तो बदलें।","ব্রেড বোমের সাধারণ রেসিপি; আপনার পদ্ধতি আলাদা হলে বদলান।"],
"Standard cheesy stuffed-potato recipe; edit to match the house version if it differs.":["चीज़ वाले भरवाँ आलू की मानक विधि; आपका तरीका अलग हो तो बदलें।","চিজ দেওয়া পুর-ভরা আলুর সাধারণ রেসিপি; আপনার পদ্ধতি আলাদা হলে বদলান।"],
"Uses the KULCHA dough with a spiced potato-onion stuffing.":["कुलचा वाले आटे में मसालेदार आलू-प्याज़ का भरावन।","কুলচার ময়দায় মশলাদার আলু-পেঁয়াজের পুর।"],
"Vegetarian 'egg': paneer outer layer with a yellow dal 'yolk'; no egg used":["शाकाहारी 'अंडा': बाहर पनीर की परत, अंदर पीली दाल की 'ज़र्दी'; अंडा नहीं","নিরামিষ 'ডিম': বাইরে পনিরের পরত, ভেতরে হলুদ ডালের 'কুসুম'; ডিম নেই"]};
const noteL=(n,l)=>{if(!n||l==="en")return n||"";const t=NOTE_TR[n];return t?t[l==="hi"?0:1]:n};
const refBtn=(name,label,f,l)=>`<button type="button" class="rcp-ref" data-a="rcpRef" data-x="${esc(name)}" data-f="${f||1}" title="${esc(tx(l).open(name))}">📖 ${esc(label)}</button>`;
function lineHtml(raw,f,lang,mode,own,refs){if(lang!=="en")return scaleHtml(raw,f,lang,mode)+(refs||[]).map(r=>" "+refBtn(r.name,r.name,f,lang)).join("");
  const hits=findRefs(raw,own);if(!hits.length)return scaleHtml(raw,f,lang,mode);let o="",p=0;for(const h of hits){o+=scaleHtml(raw.slice(p,h.start),f,lang,mode)+refBtn(h.name,raw.slice(h.start,h.end),f,lang);p=h.end}return o+scaleHtml(raw.slice(p),f,lang,mode)}
const lines=t=>String(t||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
const baseServes=m=>parseFloat(String(m.serves||"").replace(/[^\d.]/g,""))||0;
function recipeBody(m,lang,print,serves){const r=m.recipe||{};const n=m.nutrition||{};const base=baseServes(m)||4;const want=serves||base;const f=want/base;const own=selfKeys(m);const T=tx(lang);const D=s=>dg(lang,s);
  const enRefs={};for(const [k] of PARTS)enRefs[k]=lines(r.en?.[k]).map(x=>findRefs(x,own));
  const one=l=>{const x=r[l]||{};const any=PARTS.some(([k])=>(x[k]||"").trim());
    const part=(k,t)=>{const L=lines(x[k]);const aligned=l!=="en"&&enRefs[k].length===L.length;const loose=l!=="en"&&!aligned?[...new Map(enRefs[k].flat().map(h=>[h.name,h])).values()]:[];
      const li=(z,i)=>lineHtml(k==="ing"?z.replace(/^[-•*]\s*/,""):z.replace(/^\d+[.)]\s*/,""),f,l,k==="ing"?"ing":"step",own,aligned?enRefs[k][i]:null);
      return `<h3>${t[l]}${loose.length?" "+loose.map(h=>refBtn(h.name,h.name,f,l)).join(" "):""}</h3>${k==="ing"?`<ul>${L.map((z,i)=>`<li>${li(z,i)}</li>`).join("")}</ul>`:L.length>1?`<ol>${L.map((z,i)=>`<li>${li(z,i)}</li>`).join("")}</ol>`:`<p>${li(L[0]||"",0)}</p>`}`};
    return `<div class="rcp-lang" data-lang="${l}" lang="${l}" ${!print&&l!==lang?"hidden":""}>${print?`<h2>${LANGS.find(z=>z[0]===l)[1]}</h2>`:""}${any?PARTS.filter(([k])=>(x[k]||"").trim()).map(([k,t])=>part(k,t)).join(""):`<p class="muted">${l==="en"?"No recipe written in English yet.":l==="hi"?"हिंदी में विधि अभी नहीं लिखी गई है।":"বাংলায় রেসিপি এখনও লেখা হয়নি।"}</p>`}</div>`};
  const scaled=Math.abs(f-1)>1e-6;const W=+want.toFixed(1),F=+f.toFixed(2);
  const meta=[want&&(T.servesN(D(W))+(scaled?` (${T.written(D(base),!baseServes(m))})`:"")),m.prepMin&&T.prep(D(m.prepMin)),m.cookMin&&T.cook(D(m.cookMin))].filter(Boolean).join(" · ");
  const nut=NUT.filter(([k])=>n[k]!==""&&n[k]!=null);const basis=!n.basis||/^per serving, approximate$/i.test(n.basis)?T.basis:n.basis;
  return `<div lang="${lang}">${meta?`<p class="rcp-meta">${esc(meta)}</p>`:""}${scaled?`<p class="note rcp-scale">${T.note(D(W),D(F),D(base),f>1)}</p>`:""}</div>
  ${print?LANGS.filter(([l])=>PARTS.some(([k])=>(r[l]?.[k]||"").trim())).map(([l])=>one(l)).join(""):LANGS.map(([l])=>one(l)).join("")}
  <div lang="${lang}"><h3>${T.nutrition} <span class="hint">(${esc(basis)})</span></h3>${nut.length?`<div class="nut">${nut.map(([k,,u])=>`<div><b>${esc(D(n[k]))} ${esc(T.u[u]||u)}</b><span>${esc(T.nut[k])}</span></div>`).join("")}</div>`:`<p class="muted">${T.notYet}</p>`}
  ${print?"":`<h3>${T.video}</h3><div class="yt-list">${(m.videos||[]).map(u=>J.videoEmbed?J.videoEmbed(u,m,T,!J.readOnly()):`<div><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)} ↗</a></div>`).join("")}<div><a class="btn small" href="${ytSearch(m)}" target="_blank" rel="noopener">${esc(T.searchYt(m.name))}</a></div></div>`}</div>`}
const QUICK=[1,2,4,6,8,10,15,20,25,30,40,50];
function servesCtl(m,cur,scope,lang){const base=baseServes(m)||4;const T=tx(lang);return `<div class="serves" data-scope="${scope}" lang="${lang}"><span class="hint">${T.serves}</span>
  <button type="button" class="btn small" data-a="rcpServ" data-s="${scope}" data-v="-" aria-label="${T.fewer}">−</button>
  <input type="number" min="1" max="500" step="1" inputmode="numeric" value="${+(+cur).toFixed(1)}" data-ach="rcpServIn" data-s="${scope}" aria-label="${T.num}">
  <button type="button" class="btn small" data-a="rcpServ" data-s="${scope}" data-v="+" aria-label="${T.more}">＋</button>
  <span class="serves-q">${[...new Set([base,...QUICK])].sort((a,b)=>a-b).map(v=>`<button type="button" class="sv" aria-pressed="${Math.abs(v-cur)<1e-6}" data-a="rcpServ" data-s="${scope}" data-v="${v}">${dg(lang,v)}${v===base?` (${T.base})`:""}</button>`).join("")}</span></div>`}
const langSeg=lang=>`<div class="seg" role="tablist" aria-label="${tx(lang).lang}" style="margin-top:8px">${LANGS.map(([l,t])=>`<button type="button" role="tab" lang="${l}" data-a="rcpLang" data-x="${l}" aria-pressed="${l===lang}">${t}</button>`).join("")}</div>`;
const RV={d:null,p:[]};// d: {m, serves} for the drawer; p: stack of {m, serves} for the pop-up
const itemOf=name=>{const k=nk(name);const e=libFor(name);
  const m=J.all("menu").find(x=>x.active!==false&&hasRcp(x)&&nk(x.name)===k)||(e&&J.all("menu").find(x=>x.active!==false&&hasRcp(x)&&(x.recipeKey===e.key||libFor(x.name)===e)));
  if(m)return m;const r=e&&J.recipeFromLib(e.key);return r?{id:"",name:e.key,cat:"",lib:true,...r}:null};
const libNote=(m,lang)=>m.recipeSrc==="library"?`<p class="note" style="margin:8px 0 0" lang="${lang}">${esc(tx(lang).lib(noteL(m.recipeNote,lang)))}</p>`:"";
function viewHtml(m,lang,serves){const T=tx(lang);const p=photo(m);const lim=J.limited?.()||J.isCC?.();
  return `<div class="rcp-head" lang="${lang}">${p?`<img src="${p}" alt="" class="rcp-photo">`:""}<div><div class="hint">${esc(m.cat||"")}${!lim&&rate(m,"staff")?` · ${T.staff} ₹`+dg(lang,inr0.format(rate(m,"staff"))):""}${lim?"":` · ${T.gr} ${rate(m,"gr")!=null?"₹"+dg(lang,inr0.format(rate(m,"gr"))):"—"}`}</div>
    ${langSeg(lang)}${servesCtl(m,serves,"d",lang)}
    <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${J.readOnly()||J.isCC()?"":`<button type="button" class="btn small w" data-a="kitEdit" data-x="${m.id}">${esc(T.edit)}</button>`}<button type="button" class="btn small" data-a="rcpPrint" data-x="${m.id}" data-l="one">${T.printOne}</button><button type="button" class="btn small" data-a="rcpPrint" data-x="${m.id}" data-l="all">${T.printAll}</button></div></div></div>
    ${libNote(m,lang)}<div class="rcp">${recipeBody(m,lang,false,serves)}</div>${J.rcpExtra?J.rcpExtra(m,lang,serves):""}`}
function drawRcp(scope){const lang=ui().lang||"en";const T=tx(lang);
  if(scope==="d"){const box=document.querySelector("#drawerForm .rcp-view");if(!box||!RV.d)return;const st=document.getElementById("drawerForm").scrollTop;box.innerHTML=viewHtml(RV.d.m,lang,RV.d.serves);document.getElementById("drawerForm").scrollTop=st;return}
  const top=RV.p.at(-1);let el=document.getElementById("rcpPop");if(!top){el?.remove();document.removeEventListener("keydown",popKey,true);return}
  if(!el){el=document.createElement("div");el.id="rcpPop";el.className="rcp-pop";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");document.body.appendChild(el);document.addEventListener("keydown",popKey,true);el.addEventListener("click",ev=>{if(ev.target===el)J.run("rcpPopX")})}
  const m=top.m;const from=RV.p.length>1?RV.p.at(-2).m:RV.d?.m;el.setAttribute("aria-label",T.recipe+": "+m.name);el.setAttribute("lang",lang);
  const sc=el.querySelector(".rcp-pop-body")?.scrollTop||0;const keep=el.dataset.top===String(RV.p.length)+m.name;
  el.innerHTML=`<div class="rcp-pop-card"><div class="rcp-pop-bar">${RV.p.length>1?`<button type="button" class="btn small" data-a="rcpPopBack">← ${esc(RV.p.at(-2).m.name)}</button>`:""}<div style="min-width:0"><b>${esc(m.name)}</b><div class="hint">${esc(m.lib?T.libCat:m.cat||"")}${from?` · ${T.linkedFrom} `+esc(from.name):""}</div></div><span style="margin-left:auto" class="row">${m.id?`<button type="button" class="btn small" data-a="rcpPopFull" data-x="${m.id}">${T.openFull}</button>`:""}<button type="button" class="btn small w" data-a="rcpPopX" id="rcpPopX">${T.close}</button></span></div>
    <div class="rcp-pop-body">${langSeg(lang)}${servesCtl(m,top.serves,"p",lang)}${m.recipeSrc==="library"&&m.recipeNote?`<p class="note" style="margin:8px 0 0">${esc(noteL(m.recipeNote,lang))}</p>`:""}<div class="rcp">${recipeBody(m,lang,false,top.serves)}</div></div></div>`;
  el.dataset.top=String(RV.p.length)+m.name;const b=el.querySelector(".rcp-pop-body");b.scrollTop=keep?sc:0;if(!keep)el.querySelector("#rcpPopX").focus({preventScroll:true})}
function popKey(ev){if(ev.key==="Escape"&&document.getElementById("rcpPop")){ev.preventDefault();ev.stopImmediatePropagation();J.run("rcpPopX")}}
const setServes=(scope,v,focus)=>{const t=scope==="p"?RV.p.at(-1):RV.d;if(!t)return;v=Math.max(1,Math.min(500,Math.round(v*10)/10||1));t.serves=v;drawRcp(scope);if(focus)document.querySelector(`.serves[data-scope="${scope}"] input`)?.focus({preventScroll:true})};
J.act("rcpServ",el=>{const s=el.dataset.s;const t=s==="p"?RV.p.at(-1):RV.d;if(!t)return;const v=el.dataset.v;const base=baseServes(t.m)||4;const cur=t.serves;
  setServes(s,v==="+"?(cur<base?cur+1:cur+Math.max(1,Math.round(base/2))):v==="-"?(cur<=base?cur-1:cur-Math.max(1,Math.round(base/2))):+v)});
J.act("rcpServIn",el=>setServes(el.dataset.s,+el.value,true));
J.act("rcpRef",async el=>{await J.loadRecipeLib().catch(()=>{});const m=itemOf(el.dataset.x);if(!m)return toast(tx(ui().lang).none+el.dataset.x);
  const inPop=!!el.closest("#rcpPop");const parent=inPop?RV.p.at(-1):RV.d;const pf=parent?parent.serves/(baseServes(parent.m)||4):+el.dataset.f||1;const base=baseServes(m)||4;
  if(!inPop)RV.p=[];RV.p.push({m,serves:Math.round(base*pf*10)/10});drawRcp("p")});
J.act("rcpPopBack",()=>{RV.p.pop();drawRcp("p")});
J.act("rcpPopX",()=>{RV.p=[];drawRcp("p");document.querySelector("#drawerForm .rcp-ref")?.focus?.({preventScroll:true})});
J.act("rcpPopFull",el=>{RV.p=[];drawRcp("p");J.run("rcpView",el.dataset.x)});
J.act("rcpView",async el=>{const m=J.get("menu",el.dataset.x);if(!m)return;await J.loadRecipeLib().catch(()=>{});RV.p=[];drawRcp("p");const lang=ui().lang||"en";RV.d={m,serves:baseServes(m)||4};
  J.drawer({docs:J.limited?.()||J.isCC?.()?null:["menu",m.id],title:m.name,wide:true,body:`<div class="rcp-view">${viewHtml(m,lang,RV.d.serves)}</div>`});const f=document.getElementById("drawerForm");if(f){f.scrollTop=0;f.querySelector('[data-a="rcpLang"][aria-pressed="true"]')?.focus({preventScroll:true})}});
J.act("rcpLang",el=>{const l=el.dataset.x;ui().lang=l;const inPop=!!el.closest("#rcpPop");if(RV.d)drawRcp("d");if(RV.p.length)drawRcp("p");
  (inPop?document.querySelector(`#rcpPop [data-a=rcpLang][data-x="${l}"]`):document.querySelector(`#drawerForm [data-a=rcpLang][data-x="${l}"]`))?.focus({preventScroll:true})});
J.act("rcpPrint",el=>{const m=J.get("menu",el.dataset.x);const lang=ui().lang||"en";const T=tx(lang);const mm=el.dataset.l==="one"?{...m,recipe:{[lang]:m.recipe?.[lang]||{}}}:m;const sv=RV.d?.m?.id===m.id?RV.d.serves:0;
  J.printDoc(T.recipe+" · "+m.name,`<div class="hd" lang="${lang}"><div><h1>${esc(m.name)}</h1><div class="sub">${esc(J.settings().business||"JCGG")} · ${esc(m.cat||"")} · ${T.card}</div></div><div class="sub">${fmtDate(today())}</div></div>${m.recipeSrc==="library"&&m.recipeNote?`<p lang="${lang}"><i>${esc(noteL(m.recipeNote,lang))}</i></p>`:""}${recipeBody(mm,lang,true,sv)}${(m.videos||[]).length?`<h3 lang="${lang}">${T.video}</h3><ul>${m.videos.map(u=>`<li>${esc(u)}</li>`).join("")}</ul>`:""}`)});
J.act("rcpFromLib",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again — this replaces the recipe text";return}const m=J.get("menu",el.dataset.x);await J.loadRecipeLib();const r=J.recipeFromLib(m.name);if(!r)return toast("The library has no recipe for "+m.name);await J.safe(()=>J.store.patch("menu",m.id,r),"Library recipe loaded");J.closeDrawer();itemDrawer(m.id)});
J.act("rcpEdit",el=>{J.closeDrawer();itemDrawer(el.dataset.x)});
J.act("rcpEdLang",el=>{document.querySelectorAll("#drawerForm [data-a=rcpEdLang]").forEach(b=>b.setAttribute("aria-pressed",String(b===el)));document.querySelectorAll("#drawerForm .rcp-ed").forEach(d=>d.hidden=d.dataset.lang!==el.dataset.x)});
function recipeEditor(m){const r=m.recipe||{};const n=m.nutrition||{};const ph={ing:"One ingredient per line, e.g. 200 g paneer",prep:"One step per line",cook:"One step per line",serve:"How to plate and serve"};
  return `<details class="rcp-edit" ${hasRcp(m)?"":"open"}><summary><b>Recipe &amp; nutrition</b> <span class="hint">${hasRcp(m)?langs(m):"not written yet"}</span></summary>
  <div class="form">${fld("Serves",num("serves",m.serves??""))}${fld("Preparation time (min)",num("prepMin",m.prepMin??""))}${fld("Cooking time (min)",num("cookMin",m.cookMin??""))}</div>
  <div class="seg" role="tablist" aria-label="Recipe language" style="margin:8px 0">${LANGS.map(([l,t],i)=>`<button type="button" data-a="rcpEdLang" data-x="${l}" aria-pressed="${i===0}">${t}${PARTS.some(([k])=>(r[l]?.[k]||"").trim())?" ✓":""}</button>`).join("")}</div>
  ${LANGS.map(([l],i)=>`<div class="rcp-ed" data-lang="${l}" lang="${l}" ${i?"hidden":""}>${PARTS.map(([k,t])=>fld(t[l],area("r_"+l+"_"+k,r[l]?.[k]||"",k==="serve"?2:5,l==="en"?ph[k]:""))).join("")}</div>`).join("")}
  ${m.id?`<p class="hint" style="margin:6px 0 0">${m.recipeSrc==="library"?"Filled from the built-in recipe library.":m.recipeSrc==="own"?"Your own recipe.":""} <button type="button" class="linkbtn" data-a="rcpFromLib" data-x="${m.id}">Replace with the library recipe</button></p>`:""}<h4 style="margin:10px 0 4px">Nutrition per serving</h4><div class="form">${NUT.map(([k,l,u])=>fld(l+" ("+u+")",num("n_"+k,n[k]??""))).join("")}${fld("Basis / note",txt("n_basis",n.basis||"","per serving, approximate"))}</div>
  ${fld("YouTube / video links (one per line)",area("videos",(m.videos||[]).join("\n"),2,"https://youtu.be/…"))}<p class="hint" style="margin:0"><a href="${ytSearch(m.name?m:{name:"dish"})}" target="_blank" rel="noopener">Find a video on YouTube ↗</a> then paste its link here.</p></details>`}
function readRecipe(fd){const recipe={};for(const [l] of LANGS){const x={};for(const [k] of PARTS){const v=(fd["r_"+l+"_"+k]||"").trim();if(v)x[k]=v}if(Object.keys(x).length)recipe[l]=x}
  const nutrition={};for(const [k] of NUT)if(fd["n_"+k]!=="")nutrition[k]=+fd["n_"+k];if((fd.n_basis||"").trim())nutrition.basis=fd.n_basis.trim();
  return {recipe,nutrition,videos:String(fd.videos||"").split(/\s*\n\s*/).map(x=>x.trim()).filter(Boolean),serves:fd.serves===""?"":+fd.serves,prepMin:fd.prepMin===""?"":+fd.prepMin,cookMin:fd.cookMin===""?"":+fd.cookMin}}
function itemDrawer(id,preset){const m=id?J.get("menu",id):{rates:{},online:false,...(preset||{})};const cats=[...new Set(J.all("menu").map(x=>x.cat).filter(Boolean))];
  J.drawer({docs:["menu",id],title:m.trial?(id?"Edit new item · "+m.name:"New item (not on the menu)"):id?"Edit · "+m.name:"New menu item",submit:"Save item",danger:id?`<button type="button" class="btn small danger w" data-a="kitDel" data-x="${id}">Remove from menu</button>`:"",body:`<div class="form">${fld("Item name",txt("name",m.name,"","required"))}${fld("Category",`<input name="cat" id="f-cat" list="kcats" value="${esc(m.cat||"")}"><datalist id="kcats">${cats.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>`)}</div>
    <div class="form">${RATES.map(([k,l])=>fld(l+" (₹)",num("r_"+k,m.rates?.[k]??(k==="gr"?m.price:"")))).join("")}</div>
    <label class="row" style="gap:6px"><input type="checkbox" name="online" id="f-online" ${m.online?"checked":""}> Available online (sold at the Mezzanine Floor rate)</label>${recipeEditor(m)}`,wide:true,
    onSubmit:async fd=>{const name=fd.name.trim();if(!name)return "Enter the item name.";if(!m.trial&&J.all("menu").some(x=>x.id!==id&&x.active!==false&&x.name.toLowerCase()===name.toLowerCase()))return "This item is already on the menu.";const rates={};for(const [k] of RATES)rates[k]=fd["r_"+k]===""?"":+fd["r_"+k];
      await J.store.put("menu",{...(id?m:{}),id:id||"mi-"+uid(),name,cat:fd.cat.trim()||"Other",rates,price:rates.gr===""?0:rates.gr,online:!!fd.online,active:!m.trial,updatedAt:Date.now(),...(()=>{const r=readRecipe(fd);const changed=JSON.stringify(r.recipe)!==JSON.stringify(m.recipe||{});return {...r,recipeSrc:Object.keys(r.recipe).length?(changed?"own":(m.recipeSrc||"own")):""}})()});setTimeout(()=>J.kitAutoFill(),200);toast("Saved "+name)}})}
J.act("kitNew",()=>itemDrawer(null));J.itemDrawer=itemDrawer;J.act("kitEdit",el=>itemDrawer(el.dataset.x));J.act("editDish",el=>{J.go("kitchen","menu");itemDrawer(el.dataset.x)});
J.act("kitDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to remove";return}await J.safe(()=>J.store.patch("menu",el.dataset.x,{active:false}),"Removed from menu");J.closeDrawer();J.render()});
J.act("kitOnline",async el=>{await J.safe(()=>J.store.patch("menu",el.dataset.x,{online:el.checked}))});
J.act("kitUpload",()=>J.openImport("menu"));
J.act("kitExport",()=>{const rows=[["Item name","Category",...RATES.map(r=>r[1]),"Online (Y/N)"],...items().map(m=>[m.name,m.cat||"",...RATES.map(([k])=>rate(m,k)??""),m.online?"Y":"N"])];J.saveFile("menu-"+today()+".csv",J.toCSV(rows))});
J.act("kitPrint",()=>{const by={};for(const m of items())(by[m.cat||"Other"]??=[]).push(m);const f=v=>v==null?"":inr0.format(v);
  J.printDoc("Menu",`<div class="hd"><div><h1>${esc(J.settings().business||"JCGG")}</h1><div class="sub">Kitchen menu master · ${items().length} items</div></div><div class="sub">${fmtDate(today())}</div></div>${Object.entries(by).map(([c,l])=>`<h2>${esc(c)}</h2><table><thead><tr><th>Item</th>${RATES.map(([,x])=>`<th class="num">${x}</th>`).join("")}<th>Online</th></tr></thead><tbody>${l.map(m=>`<tr><td>${esc(m.name)}</td>${RATES.map(([k])=>`<td class="num">${f(rate(m,k))}</td>`).join("")}<td>${m.online?"Yes · "+f(rate(m,"mez")):""}</td></tr>`).join("")}</tbody></table>`).join("")}`,true)});
J.KIT={nk,libFor,libKeys,pN,QRE,UNITS,kindOf,lines,baseServes,hasRcp,photo,ytId,rate,findRefs,selfKeys,itemOf,drawRcp,RV,ui,items,tx};
J.mod({id:"kitchen",label:"Kitchen",group:"Operations",icon:'<path d="M6 3v8a3 3 0 0 0 6 0V3M9 3v18M17 3c-1.7 1.5-2 4-2 6s.8 3 2 3v9"/>',sub:()=>J.limited()?({en:"Recipes in English, Hindi and Bengali.",hi:"अंग्रेज़ी, हिंदी और बांग्ला में विधियाँ।",bn:"ইংরেজি, হিন্দি ও বাংলায় রেসিপি।"})[ui().lang||"en"]:"Menu master: categories, floor-wise, breakfast, staff and online rates. Staff KOTs price from here.",
  headBtns:()=>`<button class="btn w" data-a="kitUpload">Upload menu (Excel)</button><button class="btn primary w" data-a="kitNew">+ New item</button>`,
  tabs:[["menu","Menu",vMenu],["new","New items",()=>J.vNewItems?.()||""],["cost","Costing",()=>J.vCosting?.()||"",null,()=>!J.limited()&&!J.isCC()]]});
})();
