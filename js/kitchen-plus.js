/* Kitchen extras
   1. Recipe costing: every ingredient line is read, priced from Inventory (latest purchase rate) or, until stock is
      bought through the app, from an editable standard rate list. Cost per serve follows the servings selector,
      with salt, spices and oil scaling less than main ingredients (same rule as the quantities).
   2. New items (not on the menu, no price) and adding them from a YouTube / Facebook / Instagram link —
      pasted, or shared straight from the phone once JCGG is installed as an app.
   3. Video links on every recipe: add, watch inside the recipe, remove. */
(()=>{
const J=window.J,{S,esc,inr,inr0,uid,today,fmtDate,fld,txt,num,toast}=J;
const K=()=>J.KIT;
// ---------------- standard rates (indicative Kolkata market, ₹; replace with your purchase rates) ----------------
// [key, match, unit (kg|l|pc), rate, g per cup, g per piece, g per tsp]
const STD=[
["Espresso shot",/espresso|shots?\b/i,"pc",10],["Packaged drink",/sprite|thums?p? ?up|coke|cola|chilled (pack|bottle)|bottles? chilled|bottle of/i,"pc",20],["Soda",/(?<!baking )soda(?! bicarb)/i,"pc",20],["Chips packet",/packet of chips|chips/i,"pc",20],
["Mixed vegetables",/vegetables|veggies|leafy greens|bottle gourd|lauki|pumpkin|drumstick/i,"kg",60,130],["Green chutney",/chutney/i,"kg",120,240,,5],["Red / white sauce",/red sauce|white sauce|bechamel/i,"kg",150,250,,6],
["Spring roll sheets",/spring.?roll sheet|wrapper/i,"pc",4],["Roti (cooked)",/\brotis?\b|chapati/i,"pc",6],["Bowl of dal",/bowl dal|dal bowl/i,"pc",20],["Bowl of sabji",/bowl .*sabji|sabji bowl/i,"pc",25],["Starter / sweet piece",/starter piece|small sweet|^\s*sweet\s*$|sweet (piece|dish)/i,"pc",15],
["Manchurian portion",/portion .*manchurian/i,"pc",40],["Plain rice portion",/portion plain/i,"pc",15],["Idli (cooked)",/idlis?\b(?! rice| batter)/i,"pc",5],["Katori shells",/katori/i,"pc",3],
["Sambar powder",/sambar powder|rasam powder/i,"kg",400,,,2.5],["Fenugreek seeds",/fenugreek seed|methi seed/i,"kg",120,,,4],["Mustard",/mustard(?! oil)/i,"kg",150,,,3.5],["Hoisin",/hoisin|oyster sauce/i,"kg",400,,,6],["Star anise",/star anise/i,"kg",1200,,0.5],
["Nutmeg",/nutmeg|jaiphal/i,"kg",2000,,,2.5],["Paprika",/paprika/i,"kg",800,,,2.5],["Dried herbs",/mixed herbs|thyme|parsley|basil|rosemary/i,"kg",1500,,,1],["Bean sprouts",/sprout/i,"kg",120,100],["Olives",/olive(?! oil)/i,"kg",600,,3],
["Melon seeds",/melon seed|magaz/i,"kg",900,140,,3],["Bhujiya",/bhujiya|sev\b|namkeen/i,"kg",300,60],["Syrup",/syrup|curacao/i,"l",500],["Mango pulp",/mango pulp/i,"kg",150,250],["Raw mango",/raw mango/i,"kg",80,,200],
["Fruits",/mixed fruits|fruits|cherr|tutti|banana/i,"kg",150,150,100],["Betel leaf",/betel|paan leaf|paan leaves/i,"pc",2],["Gulkand",/gulkand/i,"kg",400,,,5],["Food colour",/food colou?r/i,"l",0],["Vegetable stock",/stock/i,"l",0],
["Mustard oil",/mustard oil|sarson|সরষের তেল/i,"l",190],["Refined oil",/\boil\b/i,"l",150],["Ghee",/ghee/i,"kg",650,,,4.5],["Butter",/butter(?!milk)/i,"kg",560,,,4.7],
["Buttermilk",/buttermilk/i,"l",40],["Ice cream",/ice.?cream/i,"l",300],["Fresh cream",/cream|malai/i,"l",260],["Condensed milk",/condensed milk/i,"kg",300,,,7],["Milk",/milk/i,"l",60],
["Hung curd / curd",/curd|dahi|yog/i,"kg",80,245],["Paneer",/paneer|cottage cheese/i,"kg",380,120],["Cheese",/cheese|mozzarella|processed/i,"kg",520,110,15],["Khoya",/khoya|mawa/i,"kg",400],
["Dosa / idli batter",/batter/i,"kg",60,250],["Rice flour",/rice flour/i,"kg",50,130,,3],["Cornflour",/corn ?flour|cornstarch/i,"kg",90,120,,2.7],["Besan",/besan|gram flour/i,"kg",100,90,,3],["Maida",/maida|all.?purpose|refined flour/i,"kg",40,125,,3],["Atta",/atta|wheat flour/i,"kg",38,120,,3],
["Semolina",/suji|sooji|semolina|rava/i,"kg",50,170],["Poha",/poha|chirwa|flattened rice/i,"kg",60,80],["Bread crumbs",/bread crumb/i,"kg",150,110,,2],["Bread",/bread/i,"kg",125,,25],
["Basmati rice",/basmati|biriyani rice|pulao rice/i,"kg",110,190],["Idli rice",/idli rice|parboiled/i,"kg",48,190],["Quinoa",/quinoa/i,"kg",400,170],["Rice",/\brice\b/i,"kg",55,190],
["Moong dal",/moong|mung/i,"kg",130,200],["Masoor dal",/masoor|red lentil/i,"kg",100,200],["Chana dal",/chana dal|bengal gram/i,"kg",95,200],["Toor dal",/toor|arhar|tur dal/i,"kg",150,200],["Urad dal",/urad/i,"kg",140,200],
["Kabuli chana",/kabuli|chickpea|chole/i,"kg",120,180],["Rajma",/rajma|kidney bean/i,"kg",150,180],["Soya chunks",/soya|soybean/i,"kg",120,60],["Noodles",/noodle/i,"kg",150,,,],["Pasta",/pasta|macaroni|penne/i,"kg",200,100],
["Maggi",/maggi/i,"pc",14],["Papad",/papad/i,"kg",400,,10],
["Spring onion",/spring onion|scallion|পেঁয়াজকলি/i,"kg",80,60],["Sweet potato",/sweet potato|shakarkand/i,"kg",50,,200],["Potato",/potato|aloo/i,"kg",30,150,150],["Onion",/onion|pyaz/i,"kg",40,160,120],["Tomato",/tomato/i,"kg",40,180,100],
["Ginger-garlic paste",/ginger.?garlic/i,"kg",150,,,5],["Ginger",/ginger|adrak/i,"kg",120,,,5],["Garlic",/garlic|lehsun/i,"kg",180,,4,4],["Green chilli",/green chill|हरी मिर्च/i,"kg",80,,3,3],
["Dry red chilli",/dry red chill|dried red chill|whole red chill/i,"kg",300,,0.5],["Capsicum",/capsicum|bell pepper|shimla/i,"kg",80,120,130],["Carrot",/carrot/i,"kg",50,130,80],["Cabbage",/cabbage/i,"kg",30,90,700],
["Cauliflower",/cauliflower|gobi/i,"kg",40,110,600],["Peas",/peas|matar/i,"kg",100,145],["Baby corn",/baby corn/i,"kg",200,100,12],["Sweet corn",/sweet corn|corn kernel|\bcorn\b/i,"kg",120,150],["Mushroom",/mushroom/i,"kg",220,70,15],
["Spinach",/spinach|palak/i,"kg",40,30],["Methi leaves",/fenugreek leaves|methi leaves/i,"kg",80,25],["Mint",/mint|pudina/i,"kg",150,20],["Beans",/beans/i,"kg",80,110],["Beetroot",/beet/i,"kg",50,130,150],["Brinjal",/brinjal|begun|eggplant|baingan/i,"kg",50,,250],
["Bitter gourd",/bitter gourd|karola|karela/i,"kg",60,,100],["Pointed gourd",/pointed gourd|potol|parwal/i,"kg",60,,50],["Radish",/radish|mulo|mooli/i,"kg",40,,250],["Cucumber",/cucumber|kheera/i,"kg",40,,200],["Lemon",/lemon|lime|nimbu/i,"pc",8],
["Coconut",/coconut/i,"kg",200,80],["Cashew",/cashew|kaju/i,"kg",900,140,1.5,3],["Almond",/almond|badam/i,"kg",900,140,1.2,3],["Pistachio",/pistachio|pista/i,"kg",1600,120,1,3],["Raisins",/raisin|kishmish/i,"kg",400,150,0.5],
["Peanuts",/peanut|groundnut/i,"kg",160,145],["Sesame",/sesame|til\b/i,"kg",250,,,3],["Tamarind",/tamarind|imli/i,"kg",200,,,5],
["Kashmiri chilli",/kashmiri/i,"kg",600,,,2.5],["Chilli flakes",/chill?i flakes/i,"kg",800,,,1.5],["Red chilli powder",/chill?i powder|red chill/i,"kg",350,,,2.5],["Turmeric",/turmeric|haldi|হলুদ/i,"kg",300,,,3],
["Coriander powder",/coriander (powder|seed)|dhania (powder|seed)/i,"kg",250,,,2],["Cumin powder",/cumin powder|jeera powder|roasted cumin/i,"kg",500,,,2],["Cumin",/cumin|jeera|জিরে/i,"kg",450,,,2.5],["Garam masala",/garam masala/i,"kg",900,,,2.5],
["Chaat masala",/chaat masala/i,"kg",500,,,3],["Kadai / other masala",/masala/i,"kg",700,,,2.5],["Amchur",/amchur|mango powder/i,"kg",500,,,2.5],["Black salt",/kala namak|black salt/i,"kg",120,,,6],["Salt",/salt/i,"kg",25,,,6],
["Black pepper",/pepper/i,"kg",900,,0.05,2.5],["Cardamom",/cardamom|elaichi|এলাচ/i,"kg",3000,,0.25,2],["Cloves",/clove/i,"kg",1500,,0.1,2],["Cinnamon",/cinnamon|dalchini/i,"kg",800,,2,2.5],["Bay leaf",/bay lea|tej ?patta/i,"kg",300,,0.2],
["Mustard seeds",/mustard seed|\brai\b/i,"kg",150,,,3.5],["Fennel",/fennel|saunf/i,"kg",300,,,2],["Ajwain",/ajwain|carom/i,"kg",400,,,2.5],["Kalonji",/kalonji|nigella/i,"kg",400,,,2.5],["Hing",/hing|asafoetida/i,"kg",3000,,,3],
["Kasuri methi",/kasuri methi|dried fenugreek/i,"kg",600,,,1],["Saffron",/saffron|kesar/i,"kg",300000,,0.002,0.7],["Curry leaves",/curry lea/i,"kg",200,,0.05],["Coriander leaves",/coriander|dhania|ধনেপাতা/i,"kg",120,16,,0.4],
["Oregano",/oregano/i,"kg",1500,,,1],["Soy sauce",/soy/i,"l",200],["Vinegar",/vinegar/i,"l",80],["Ketchup",/ketchup|tomato sauce/i,"kg",150,,,6],["Schezwan sauce",/schezwan|szechuan/i,"kg",300,,,6],["Chilli sauce",/chill?i sauce/i,"kg",180,,,6],
["Pizza sauce",/pizza sauce|pasta sauce/i,"kg",250,,,6],["Mayonnaise",/mayo/i,"kg",250,,,5],["Baking powder",/baking powder/i,"kg",400,,,4],["Baking soda",/baking soda|soda bicarb|eno/i,"kg",120,,,5],["Yeast",/yeast/i,"kg",600,,,3],
["Vanilla essence",/vanilla|essence/i,"l",800],["Cocoa",/cocoa/i,"kg",900,,,2.5],["Chocolate",/chocolate/i,"kg",800,170],["Tea leaves",/tea leaves|tea\b/i,"kg",400,,,2.5],["Coffee",/coffee/i,"kg",1000,,,2],
["Honey",/honey/i,"kg",500,,,7],["Jaggery",/jaggery|gur\b/i,"kg",70,,,4],["Sugar",/sugar|chini/i,"kg",45,200,,4],["Rose water",/rose water/i,"l",300],["Water / ice",/\bwater\b|\bice\b|পানি|पानी|জল/i,"l",0]];
const FREE=/^water|^ice/i;
const DESC=/^(finely |roughly |thinly |coarsely |lightly )?(chopped|cubed|sliced|diced|crushed|grated|minced|pureed|puree|paste|boiled|mashed|soaked|peeled|julienned|slit|halved|quartered|deseeded|melted|softened|whisked|beaten|optional|as needed|ripe|fresh|large|small|medium|warm|cold|hot|roasted|toasted|ground|whole|cut|torn|shredded)\b/i;
const ovr=()=>J.get("meta","costrates")?.map||{};
function rateFor(name){const o=ovr();const n=name.toLowerCase();
  for(const [key,r] of Object.entries(o))if(r&&r.rate>=0&&n.includes(key.toLowerCase()))return {src:"own",label:key,unit:r.unit,rate:+r.rate,gCup:r.gCup,gPc:r.gPc,gTsp:r.gTsp,key};
  const s=STD.find(x=>x[1].test(name));if(!s)return null;
  const inv=invMatch(s[0],name);
  // an inventory rate is used only when its unit matches the standard unit and it is in a believable range (0.4x–2.5x of market); otherwise fall back to the market rate
  if(invOk(s,inv))return {...inv,gCup:s[4],gPc:s[5],gTsp:s[6],std:s};
  return {src:"std",label:s[0],unit:s[2],rate:s[3],gCup:s[4],gPc:s[5],gTsp:s[6],key:s[0]}}
const invOk=(s,inv)=>!!inv&&inv.unit===s[2]&&inv.rate>0&&inv.rate>=s[3]*.4&&inv.rate<=s[3]*2.5;
// inventory: an item whose name shares the standard ingredient's main word, priced at its latest purchase (else average)
function invMatch(stdName,line){const items=J.all("items");if(!items.length)return null;const D=J.D.inv?.items||{};
  const words=stdName.toLowerCase().split(/[^a-z]+/).filter(w=>w.length>2);
  const it=items.find(i=>{const n=(i.name||"").toLowerCase();return words.some(w=>n.includes(w))&&(D[i.id]?.last||D[i.id]?.avg)>0});
  if(!it)return null;const I=D[it.id];const u=String(it.unit||"KG").toUpperCase();const per=I.last||I.avg;
  const unit=u==="KG"?"kg":u==="GM"?"kg":u==="LTR"?"l":u==="ML"?"l":"pc";const rate=u==="GM"||u==="ML"?per*1000:per;
  return {src:"inv",label:it.name,unit,rate,item:it.id}}
// ---------------- reading one recipe line ----------------
const LIQ=/\b(oil|milk|water|cream|sauce|vinegar|essence|juice|syrup|soy|rose water)\b/i;
function toBase(q,unit,name,r){// returns [amount, "g"|"ml"|"pc"]
  const liquid=r?.unit==="l";const tsp=liquid?5:(r?.gTsp||3);
  switch(unit){case"kg":return [q*1000,"g"];case"g":return [q,"g"];case"l":return [q*1000,"ml"];case"ml":return [q,"ml"];
    case"tsp":return liquid?[q*5,"ml"]:[q*tsp,"g"];case"tbsp":return liquid?[q*15,"ml"]:[q*tsp*3,"g"];case"cup":return liquid?[q*240,"ml"]:[q*(r?.gCup||150),"g"];
    case"inch":return [q*(/cinnamon/i.test(name)?2:10),"g"];case"pinch":return [q*0.3,"g"];case"bunch":return [q*100,"g"];
    default:return r?.unit==="pc"?[q,"pc"]:r?.gPc?[q*r.gPc,"g"]:[q*50,"g"]}}
function costOf(amt,base,r){if(!r)return null;if(r.unit==="pc")return base==="pc"?amt*r.rate:amt/50*r.rate;return amt/1000*r.rate}
const KINDX={leaven:.9,spice:.75,fat:.85,aroma:.85,water:.9,main:1};
function parseLine(raw){let s=String(raw).replace(/\([^)]*\)/g," ");const label=s.match(/^\s*['"]?[A-Za-z' ]{2,20}['"]?\s*:\s*/);if(label&&/\d|few|pinch/i.test(s.slice(label[0].length)))s=s.slice(label[0].length);
  const chunks=s.split(/\s*[,;+]\s*|\s+\/\s+|\s+and\s+(?=\d|½|¼|¾)/i).map(x=>x.trim()).filter(Boolean);const out=[];
  for(const c of chunks){const kit=K();
    let q=null,rest=c;const mm=c.match(/^(?:about |approx\.? |around )?((?:\d+\s+\d+\/\d+|\d+\/\d+|\d*[½¼¾⅓⅔⅛]|\d+(?:\.\d+)?)(?:\s*[-–]\s*(?:\d+\/\d+|\d*[½¼¾⅓⅔⅛]|\d+(?:\.\d+)?))?)\s*/i);
    if(mm){const parts=mm[1].split(/\s*[-–]\s*/);q=parts.map(kit.pN).reduce((a,b)=>a+b,0)/parts.length;rest=c.slice(mm[0].length)}
    else if(/^(a )?pinch/i.test(c)){q=1;rest=c.replace(/^(a )?pinch(es)?( of)?/i,"pinch ")}
    else if(/^(few|some|a few)\b/i.test(c)){q=/saffron|kesar/i.test(c)?10:2;rest=c.replace(/^(a )?(few|some)\s*/i,"")}
    let unit="";const um=rest.match(/^(kg|kilo|g|gm|gms|grams?|l|ltr|litres?|liters?|ml|tsp|teaspoons?|tbsp|tablespoons?|cups?|inch(?:es)?|pinch(?:es)?|bunch(?:es)?|sprigs?|cloves?|slices?|pcs?|pieces?|nos?)\b\.?\s*(?:of\s+)?/i);
    if(um){const u=um[1].toLowerCase();unit=/^kg|kilo/.test(u)?"kg":/^(g|gm|gms|gram)/.test(u)?"g":/^(l|ltr|lit)/.test(u)?"l":u==="ml"?"ml":/^(tsp|teasp)/.test(u)?"tsp":/^(tbsp|tables)/.test(u)?"tbsp":/^cup/.test(u)?"cup":/^inch/.test(u)?"inch":/^pinch/.test(u)?"pinch":/^bunch/.test(u)?"bunch":"";if(/^clove/.test(u))rest="garlic clove "+rest;rest=rest.slice(um[0].length)}
    else if(/^each\b/i.test(rest))rest=rest.replace(/^each\s*/i,"");
    const name=rest.replace(/^(of|each)\s+/i,"").split(/\s+or\s+/i)[0].replace(/\s{2,}/g," ").trim();
    if(q==null&&DESC.test(c))continue;if(/absorption/i.test(c))continue;if(q!=null&&/^-?\s*(inch|cm)\b/i.test(rest))continue;
    if(q==null){if(/for (deep |shallow )?fr(y|ying)|to fry|for frying/i.test(c)&&/oil|ghee/i.test(c))out.push({fry:true,name:c,text:c});else if(/to taste/i.test(c)&&/salt/i.test(c))out.push({q:1,unit:"tsp",name:"salt",text:c});else out.push({q:null,name:c,text:c});continue}
    out.push({q,unit,name:name||c,text:c})}
  return out}
// ---------------- recipe cost ----------------
const costCache=new Map();
// ready-to-serve packaged goods: one bought unit per serve. Inventory purchase rate when it is believable, otherwise a size-aware market rate (never the generic ₹20 drink rate)
const PKG=[[/packaged water.*(200|250)|water.*(200|250) ?ml/i,/water/i,/200|250/,5,"Packaged water 200/250 ml"],[/packaged water.*500|water.*500 ?ml/i,/water/i,/500/,8,"Packaged water 500 ml"],[/packaged water.*(1 ?ltr|1 ?l\b|1 ?litre)|water.*1 ?ltr/i,/water/i,/\b1 ?(l|ltr|litre)\b|1000/i,12,"Packaged water 1 L"],
  [/kinley|soda.*750|750 ?ml/i,/soda/i,/750/,14,"Soda 750 ml"],[/lay'?s|chips/i,/lay|chips/i,null,19,"Chips packet"]];
function pkgCost(m,want){const nm=m.name||"";const e=PKG.find(x=>x[0].test(nm));if(!e)return null;const D=J.D.inv?.items||{};let rate=e[3],src="std",label=e[4]+" — market rate ₹"+e[3];
  const it=J.all("items").find(i=>e[1].test(i.name||"")&&(!e[2]||e[2].test(i.name||""))&&(D[i.id]?.last||D[i.id]?.avg)>0);
  if(it){const r=D[it.id].last||D[it.id].avg;if(r>=e[3]*.4&&r<=e[3]*2.5){rate=r;src="inv";label=it.name}}
  return {rows:[{text:nm,src,label,costBase:rate,cost:rate*want,qty:"1 pc",kind:"main"}],total:rate*want,perServe:rate,baseTotal:rate,basePerServe:rate,serves:want,base:1,unpriced:0}}
J.recipeCosting=(m,serves,depth=0)=>{const kit=K();{const pk=pkgCost(m,serves||1);if(pk)return pk}const base=kit.baseServes(m)||4;const want=serves||base;const f=want/base;const own=kit.selfKeys(m);
  const L=kit.lines(m.recipe?.en?.ing);const rows=[];let tot=0,totBase=0,unpriced=0;
  for(const ln of L){const refs=depth<2?kit.findRefs(ln,own):[];
    if(refs.length){const rm=kit.itemOf(refs[0].name);
      if(rm){const rc=J.recipeCosting(rm,null,depth+1);const c=rc.perServe*base;rows.push({text:ln,src:"ref",label:"From the "+rm.name+" recipe",costBase:c,cost:c*f,qty:"",kind:"main"});tot+=c*f;totBase+=c;continue}}
    for(const p of parseLine(ln)){
      if(p.fry){const r=rateFor(/ghee/i.test(p.name)?"ghee":"oil");const ml=12*base;const c=costOf(ml,"ml",r)||0;const k=Math.pow(f,.85);rows.push({text:p.text,src:r?.src||"std",label:(r?.label||"Oil")+" — about 12 ml absorbed per serve",costBase:c,cost:c*k,qty:Math.round(ml*k)+" ml",kind:"fat"});tot+=c*k;totBase+=c;continue}
      if(p.q==null){const r=rateFor(p.name);const isGarnish=/garnish|to serve|chutney|salad|for brushing|for dusting|to taste/i.test(p.name);rows.push({text:p.text,src:r?"garnish":"none",label:r?r.label+" — small amount, not costed":isGarnish?"Garnish / side":"No quantity given",costBase:0,cost:0,qty:"",kind:"main"});continue}
      const r=rateFor(p.name);const kind=kit.kindOf(p.name)[0];const k=Math.pow(f,KINDX[kind]??1);
      const [amt,b]=toBase(p.q,p.unit,p.name,r);
      if(!r){unpriced++;rows.push({text:p.text,src:"none",label:"Not priced — set a rate",costBase:0,cost:0,qty:fmtAmt(amt*k,b),kind,name:p.name});continue}
      const c=costOf(amt,b,r);rows.push({text:p.text,src:r.src,label:r.label+(r.src==="inv"?"":` @ ₹${inr0.format(r.rate)}/${r.unit}`),costBase:c,cost:c*k,qty:fmtAmt(amt*k,b),kind,rateKey:r.key,name:p.name});tot+=c*k;totBase+=c}}
  return {rows,total:tot,perServe:want?tot/want:0,baseTotal:totBase,basePerServe:totBase/base,serves:want,base,unpriced}};
const fmtAmt=(a,b)=>b==="pc"?(Math.round(a*10)/10)+" pc":b==="ml"?(a>=1000?(a/1000).toFixed(2)+" L":Math.round(a)+" ml"):(a>=1000?(a/1000).toFixed(2)+" kg":a<10?a.toFixed(1)+" g":Math.round(a)+" g");
const tgt=()=>+J.settings().targetFood||32;
const priceOf=m=>K().rate(m,"gr");
const sugg=per=>Math.ceil(per/(tgt()/100)/5)*5;
function costPanel(m,serves){const c=J.recipeCosting(m,serves);const price=priceOf(m);const fc=price?c.perServe/price*100:0;const SRC={inv:["Inventory","ok"],own:["Your rate","plain"],std:["Standard rate","warn"],ref:["Sub-recipe","plain"],garnish:["—","plain"],none:["Not priced","bad"]};
  const stdN=c.rows.filter(r=>r.src==="std").length;
  return `<section class="cost-panel"><h3>Cost of this dish</h3>
  <div class="cost-kpis"><div><b>₹${inr.format(c.perServe)}</b><span>per serve${c.serves!==c.base?` (at ${+c.serves.toFixed(1)} servings)`:""}</span></div><div><b>₹${inr.format(c.total)}</b><span>for ${+c.serves.toFixed(1)} serving${c.serves===1?"":"s"}</span></div>
    ${c.serves!==c.base?`<div><b>₹${inr.format(c.basePerServe)}</b><span>per serve at the recipe's ${c.base}</span></div>`:""}
    ${price?`<div><b class="${fc<=tgt()?"ok":fc<=tgt()+8?"warn":"bad"}">${fc.toFixed(1)}%</b><span>food cost on ₹${inr0.format(price)} menu price</span></div>`:""}<div><b>₹${inr0.format(sugg(c.perServe))}</b><span>price for ${tgt()}% food cost</span></div></div>
  <div class="tbl-wrap"><table class="cost-tbl"><thead><tr><th>Recipe line</th><th class="num">Qty used</th><th>Priced from</th><th class="num">Cost</th></tr></thead><tbody>${c.rows.map(r=>`<tr class="${r.src==="none"&&r.qty?"cost-miss":""}"><td>${esc(r.text)}</td><td class="num nowrap">${esc(r.qty||"")}</td><td><span class="chip ${SRC[r.src][1]}">${SRC[r.src][0]}</span> <span class="hint">${esc(r.label)}</span>${r.src==="none"&&r.qty?` <button type="button" class="btn small" data-a="costRate" data-x="${esc(r.name||r.text)}">Set rate</button>`:r.src==="std"||r.src==="own"?` <button type="button" class="linkbtn" data-a="costRate" data-x="${esc(r.rateKey||r.name)}" data-k="${esc(r.rateKey||"")}">change</button>`:""}</td><td class="num">${r.cost?"₹"+inr.format(r.cost):"—"}</td></tr>`).join("")}</tbody></table></div>
  <p class="hint">${c.unpriced?`<b>${c.unpriced} line(s) not priced</b> — set a rate so the cost is complete. `:""}${stdN?`${stdN} line(s) use indicative market rates; once the ingredient is bought through Inventory, the latest purchase rate is used automatically. `:""}Salt, spices, oil and water scale less than main ingredients when you change the servings.</p></section>`}
J.act("costRate",el=>{const name=el.dataset.x;const o=ovr();const key0=el.dataset.k&&o[el.dataset.k]?el.dataset.k:(STD.find(s=>s[1].test(name))?.[0]||name.replace(/^[^a-z]+/i,"").split(/\s+/).slice(0,2).join(" "));const cur=o[key0]||{};const st=STD.find(s=>s[0]===key0||s[1].test(name));
  J.drawer({title:"Ingredient rate",submit:"Save rate",body:`<p class="hint">Applies to every recipe line containing this word. Inventory purchase rates still take priority once the item is bought through the app.</p><div class="form">${fld("Ingredient word to match",txt("key",key0))}${fld("Rate (₹)",num("rate",cur.rate??st?.[3]??""))}${fld("Per",`<select name="unit" id="f-unit">${[["kg","kg"],["l","litre"],["pc","piece"]].map(([v,l])=>`<option value="${v}" ${(cur.unit||st?.[2]||"kg")===v?"selected":""}>${l}</option>`).join("")}</select>`)}${fld("Grams in one piece (optional)",num("gPc",cur.gPc??st?.[5]??""))}</div>`,
    onSubmit:async fd=>{const key=fd.key.trim();if(!key)return "Enter the word to match.";if(fd.rate===""||+fd.rate<0)return "Enter the rate.";const cur=J.get("meta","costrates")||{id:"costrates",map:{}};
      await J.store.put("meta",{...cur,id:"costrates",map:{...(cur.map||{}),[key]:{rate:+fd.rate,unit:fd.unit,gPc:fd.gPc===""?undefined:+fd.gPc,at:Date.now(),by:S.me.email}}});toast("Rate saved");setTimeout(()=>K().drawRcp("d"),300)}})});
// ---------------- video links ----------------
const vidKind=u=>/youtu\.?be/i.test(u)?"yt":/facebook\.com|fb\.watch/i.test(u)?"fb":/instagram\.com/i.test(u)?"ig":"web";
J.videoEmbed=(u,m,T,canEdit)=>{const k=vidKind(u);const id=K().ytId(u);const del=canEdit&&m.id?`<button type="button" class="linkbtn" data-a="vidDel" data-x="${esc(m.id)}" data-u="${esc(u)}">Remove</button>`:"";
  const fr=k==="yt"&&id?`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(m.name)} video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    :k==="fb"?`<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false" title="${esc(m.name)} video" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`
    :k==="ig"&&/\/(p|reel|tv)\/[\w-]+/.test(u)?`<iframe src="${esc(u.replace(/(\/(p|reel|tv)\/[\w-]+).*/,"$1"))}/embed" title="${esc(m.name)} video" loading="lazy"></iframe>`:"";
  return `<div class="yt">${fr}<span class="row" style="gap:10px"><a href="${esc(u)}" target="_blank" rel="noopener">${k==="yt"?T.openYt:k==="fb"?"Facebook ↗":k==="ig"?"Instagram ↗":esc(u.slice(0,60))+" ↗"}</a>${del}</span></div>`};
J.rcpExtra=(m,lang,serves)=>{if(J.limited()||J.isCC()||!m.id)return "";const ro=J.readOnly();
  return `${ro?"":`<div class="vid-add"><input type="url" id="vidUrl" placeholder="Paste a YouTube, Facebook or Instagram video link" inputmode="url"><button type="button" class="btn small w" data-a="vidAdd" data-x="${esc(m.id)}">＋ Save video link</button></div>`}${costPanel(m,serves)}`};
J.act("vidAdd",async el=>{const u=(document.getElementById("vidUrl")?.value||"").trim();if(!/^https?:\/\//i.test(u))return toast("Paste a full link starting with https://");const m=J.get("menu",el.dataset.x);if((m.videos||[]).includes(u))return toast("Already saved");
  const patch={videos:[...(m.videos||[]),u]};if(!K().photo(m)&&vidKind(u)==="yt"&&K().ytId(u))patch.img=`https://i.ytimg.com/vi/${K().ytId(u)}/hqdefault.jpg`;
  await J.safe(()=>J.store.patch("menu",m.id,patch),"Video link saved");setTimeout(()=>{const R=K().RV;if(R.d?.m?.id===m.id){R.d.m=J.get("menu",m.id);K().drawRcp("d")}},400)});
J.act("vidDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to remove";return}const m=J.get("menu",el.dataset.x);await J.safe(()=>J.store.patch("menu",m.id,{videos:(m.videos||[]).filter(v=>v!==el.dataset.u)}),"Removed");setTimeout(()=>{const R=K().RV;if(R.d?.m?.id===m.id){R.d.m=J.get("menu",m.id);K().drawRcp("d")}},400)});
// ---------------- new items from a video link ----------------
const CATMAP=[["MOMO",/momo|dumpling/],["CHUTNEY & DIPS",/chutney|podi|\bdip\b/],["SOUTH INDIAN",/dosa|idli|idly|uttapam|vada|sambar|pongal|appam|upma/],["FRIED RICE",/fried rice/],["CHINESE",/noodle|manchurian|chilli |chili |schezwan|szechuan|hakka|spring roll|chowmein|chow mein|dimsum/],
  ["SOUP",/soup/],["PASTA",/pasta|macaroni|penne|spaghetti/],["KABAB",/kabab|kebab|seekh/],["TANDOORI",/tikka|tandoor/],["RICE BOWL",/pulao|biryani|biriyani|khichdi|khichuri|rice/],["DAL",/\bdal\b|chole|rajma|lentil/],
  ["PARATHA",/paratha|kulcha/],["ROTI",/roti|naan|chapati|bhatura|phulka/],["CHAAT",/chaat|golgappa|pani ?puri|papdi|bhel|dahi vada|dahi bhalla|tikki/],["DESSERTS",/halwa|kheer|payesh|gulab|rasgulla|rosogolla|ice.?cream|cake|brownie|mithai|tukda|sandesh|doi|pudding|ladoo|laddu|barfi|jalebi|jilipi|kulfi|rasmalai|malai|peda|custard|cheesecake|falooda|truffle|pitha/],
  ["BEVERAGES",/\btea\b|chai|coffee|latte/],["MOCKTAIL",/mojito|lassi|shake|smoothie|lemonade|mocktail|sharbat|soda|cooler/],["BREAKFAST",/poha|maggi|sandwich|puri|chilla|cheela|pancake|toast|paratha/],
  ["SNACKS",/lollipop|starter|pakora|pakoda|bonda|cutlet|roll|samosa|kachori|croquette|ball|fries|nuggets|bhaji|chop|fritter/],["PANEER & VEG",/paneer|kofta|curry|sabji|sabzi|masala|kadai|korma|bharta|dum|gravy|veg/]];
J.autoCategory=name=>{const n=" "+String(name).toLowerCase()+" ";return (CATMAP.find(([,re])=>re.test(n))||["NEW ITEMS"])[0]};
const JUNK=/\b(recipe|recipes|restaurant|style|easy|quick|simple|best|perfect|homemade|home made|street ?food|how to make|how to|make|making|at home|in hindi|in bengali|in english|hindi|bengali|bangla|english|shorts?|reels?|viral|famous|authentic|special|tasty|delicious|yummy|healthy|instant|minutes?|mins?|step by step|full video|video|official|dhaba|hotel|cafe|kolkata|mumbai|delhi|indian|veg|vegetarian|no onion no garlic|without onion|without garlic)\b/gi;
function cleanTitle(t){let s=String(t||"").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu," ").replace(/#[\wऀ-৿]+/g," ").split(/\s[|•–—-]\s|\||•/)[0];s=s.replace(/\b(by|with)\s+[A-Z][\w.]*(\s+[A-Z][\w.]*)*\s*$/,"");
  const plain=s.replace(JUNK," ").replace(/[^\w\s'&]/g," ").replace(/\s+/g," ").trim();return plain||s.trim()}
function libInText(text){const kit=K();const L=J.RECIPE_LIB;if(!L)return null;const T=" "+kit.nk(text)+" ";let best=null;for(const k of Object.keys(L.idx)){if(k.length<4)continue;if(T.includes(" "+k+" ")&&(!best||k.length>best.length))best=k}return best?L.idx[best]:null}
const firstUrl=s=>(String(s||"").match(/https?:\/\/[^\s<>"']+/)||[])[0]||"";
const norm=u=>{u=u.replace(/[)\].,]+$/,"");const id=K().ytId(u);return id?"https://youtu.be/"+id:u.split("#")[0]};
J.importVideo=async(raw,shared="")=>{if(J.readOnly())return toast("Only the owner or managers can add new items.");const url0=firstUrl(raw)||firstUrl(shared);if(!url0)return toast("No link found — paste a YouTube, Facebook or Instagram link");const url=norm(url0);
  const dup=J.all("menu").find(m=>(m.videos||[]).some(v=>norm(v)===url));if(dup){toast("Already added as "+dup.name);J.go("kitchen","new");setTimeout(()=>J.run("rcpView",dup.id),300);return}
  toast("Reading the video…");await J.loadRecipeLib().catch(()=>{});
  let meta={};try{const c=new AbortController();setTimeout(()=>c.abort(),8000);const r=await fetch("https://noembed.com/embed?url="+encodeURIComponent(url0),{signal:c.signal});meta=await r.json()}catch(e){}
  const sharedTitle=String(shared||"").replace(url0,"").trim();const title=meta.title||sharedTitle||"";const kind=vidKind(url);
  const lib=libInText(title)||libInText(sharedTitle);let name=lib?lib.key:cleanTitle(title).toUpperCase();
  if(!name){J.drawer({title:"Name this dish",submit:"Add item",body:`<p class="hint">The ${kind==="fb"?"Facebook":kind==="ig"?"Instagram":"video"} link did not include the dish name.</p>${fld("Dish name",txt("name","","e.g. Paneer Lababdar","required"))}`,onSubmit:async fd=>{if(!fd.name.trim())return "Enter the dish name.";await J.importVideo(url0,fd.name.trim()+" "+url0)}});return}
  const id="ni-"+uid();const ytid=K().ytId(url);const img=ytid?`https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`:(meta.thumbnail_url||"");
  const rec={id,name,cat:J.autoCategory(name+" "+title),trial:true,active:false,rates:{},online:false,videos:[url],img,src:{kind,url,title:title.slice(0,200),author:meta.author_name||"",addedBy:S.me.email,addedAt:Date.now()},createdAt:Date.now(),updatedAt:Date.now(),
    ...(lib?J.recipeFromLib(lib.key):{recipeSrc:"",recipeStatus:"needed"})};
  await J.safe(()=>J.store.put("menu",rec),lib?"Added "+name+" with its recipe":"Added "+name+" — recipe still to be written");J.go("kitchen","new");setTimeout(()=>J.run("rcpView",id),400)};
J.act("niImport",()=>{const el=document.getElementById("niUrl");J.importVideo(el?.value||"");if(el)el.value=""});
J.act("niNew",()=>J.itemDrawer(null,{trial:true}));
J.act("niPromote",el=>{const m=J.get("menu",el.dataset.x);if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again — then enter prices";return}J.store.patch("menu",m.id,{trial:false,active:true,promotedAt:Date.now()}).then(()=>{toast(m.name+" moved to the menu — enter its prices");setTimeout(()=>J.itemDrawer(m.id),300)})});
J.act("niDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to delete";return}await J.safe(()=>J.store.del("menu",el.dataset.x),"Deleted")});
J.act("niCopyReq",async()=>{const list=J.all("menu").filter(m=>m.trial&&!K().hasRcp(m));const txt="Write the JCGG kitchen recipes still pending (English, Hindi, Bengali, nutrition) for: "+list.map(m=>m.name+" — "+(m.videos||[])[0]).join("; ");try{await navigator.clipboard.writeText(txt);toast("Copied — paste it to Claude")}catch(e){toast(txt)}});
J.vNewItems=()=>{const kit=K();const all0=J.all("menu").filter(m=>m.trial).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));const NU=J.ui("newrec",{q:"",c:"all",r:"all"});const nq=(NU.q||"").toLowerCase();const ncats=[...new Set(all0.map(m=>m.cat||"NEW ITEMS"))].sort();const all=all0.filter(m=>(NU.c==="all"||(m.cat||"NEW ITEMS")===NU.c)&&(NU.r==="all"||(NU.r==="no"?!kit.hasRcp(m):kit.hasRcp(m)))&&(!nq||((m.name||"")+" "+(m.src?.author||"")+" "+(m.src?.coll||"")+" "+(m.src?.title||"")).toLowerCase().includes(nq)));const ro=J.readOnly()||J.isCC();const pend=all.filter(m=>!kit.hasRcp(m));
  return `${ro?"":`<section class="panel"><h2>Add a new recipe from a video</h2><div class="pb"><div class="vid-add"><input type="url" id="niUrl" placeholder="Paste a YouTube, Facebook or Instagram link" inputmode="url"><button type="button" class="btn primary w" data-a="niImport">Add from link</button><button type="button" class="btn" data-a="niNew">＋ New item by hand</button></div>
    <p class="hint" style="margin:8px 0 0">The app reads the video title, names the dish, puts it in a category, uses the video picture and — when the dish is in the recipe collection — fills the full recipe in English, हिंदी and বাংলা with nutrition and cost. These items are not on the menu and have no price until you press “Add to menu”. On an Android phone, install JCGG (browser menu → Add to Home screen / Install app) and you can share videos straight from YouTube or Facebook: Share → JCGG.</p></div></section>`}
  ${pend.length&&!ro?`<div class="note">${pend.length} new item${pend.length>1?"s":""} still need${pend.length>1?"":"s"} a recipe written (${pend.slice(0,6).map(m=>esc(m.name)).join(", ")}${pend.length>6?" …":""}). The app cannot watch the video itself — ask Claude in chat “write the pending kitchen recipes” and they will be filled in. <button type="button" class="btn small" data-a="niCopyReq">Copy request</button></div>`:""}
  ${all0.length>12?`<div class="filters"><input type="search" placeholder="Search new recipes, creator or collection" value="${esc(NU.q||"")}" id="nr-q" data-ui="newrec.q" style="min-width:220px"><select data-ui="newrec.c" aria-label="Category"><option value="all">All categories (${all0.length})</option>${ncats.map(c=>`<option value="${esc(c)}" ${NU.c===c?"selected":""}>${esc(c)} (${all0.filter(m=>(m.cat||"NEW ITEMS")===c).length})</option>`).join("")}</select><select data-ui="newrec.r" aria-label="Recipe"><option value="all">Any recipe status</option><option value="yes" ${NU.r==="yes"?"selected":""}>With recipe</option><option value="no" ${NU.r==="no"?"selected":""}>Recipe to write</option></select><span class="hint">${all.length} shown</span></div>`:""}
  ${all.length?`<div class="menu-tiles">${all.slice(0,+NU.n||60).map(m=>{const p=kit.photo(m);const c=kit.hasRcp(m)&&!J.limited()&&!J.isCC()?J.recipeCosting(m):null;return `<article class="mtile"><button type="button" class="mt-img" data-a="rcpView" data-x="${m.id}" aria-label="Open ${esc(m.name)}">${p?`<img src="${esc(p)}" alt="" loading="lazy">`:`<span>${esc(J.initials(m.name))}</span>`}<em class="mt-on">${m.src?.kind==="fb"?"Facebook":m.src?.kind==="ig"?"Instagram":m.src?.kind==="yt"?"YouTube":"New"}</em></button>
    <div class="mt-body"><div class="mt-cat">${esc(m.cat||"NEW ITEMS")}</div><h3>${esc(m.name)}</h3>
    <div class="mt-tags">${kit.hasRcp(m)?`<span class="chip ok">📖 Recipe</span>`:`<span class="chip warn">Recipe to write</span>`}${c?`<span class="chip plain">Cost ₹${inr.format(c.perServe)}/serve</span><span class="chip plain">Price ~₹${inr0.format(sugg(c.perServe))}</span>`:""}</div>
    ${ro?`<div class="row" style="gap:6px;margin-top:auto"><button class="btn small w" data-a="rcpView" data-x="${m.id}">Open</button></div>`:`<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:auto"><button class="btn small w" data-a="rcpView" data-x="${m.id}">Open</button><button class="btn small" data-a="kitEdit" data-x="${m.id}">Edit</button><button class="btn small" data-a="niPromote" data-x="${m.id}">Add to menu</button><button class="btn small danger" data-a="niDel" data-x="${m.id}">Delete</button></div>`}</div></article>`}).join("")}</div>${all.length>(+NU.n||60)?`<div style="text-align:center;margin:12px"><button type="button" class="btn" data-set="newrec.n=${(+NU.n||60)+60}">Show 60 more (${all.length-(+NU.n||60)} left)</button></div>`:""}`
  :`<div class="panel"><div class="empty"><strong>No new recipes here</strong><span>Paste a cooking video link above to add one, or change the filters.</span></div></div>`}`};
// ---------------- costing overview ----------------
J.vCosting=()=>{if(J.limited())return "";const kit=K();const U=kit.ui();const q=(U.cq||"").toLowerCase();
  const all=J.all("menu").filter(m=>(m.active!==false||m.trial)&&kit.hasRcp(m)&&(!q||(m.name+" "+(m.cat||"")).toLowerCase().includes(q)));
  const rows=all.map(m=>{const c=J.recipeCosting(m);const p=priceOf(m);return {m,c,p,fc:p?c.perServe/p*100:null}}).sort((a,b)=>(b.fc??-1)-(a.fc??-1));
  const withP=rows.filter(r=>r.fc!=null);const avg=withP.length?withP.reduce((s,r)=>s+r.fc,0)/withP.length:0;const over=withP.filter(r=>r.fc>tgt()).length;const unp=rows.reduce((s,r)=>s+r.c.unpriced,0);const inv=J.all("items").length;
  return `<div class="kpis">${J.kpi("Dishes costed",String(rows.length),"with a recipe")}${J.kpi("Average food cost",withP.length?avg.toFixed(1)+"%":"—","target "+tgt()+"%")}${J.kpi("Above target",String(over),"dishes")}${J.kpi("Lines not priced",String(unp),"set rates to complete")}</div>
  ${inv?"":`<div class="note">Inventory has no items or purchases yet, so every cost uses the indicative market rate list below. As soon as ingredients are bought through Inventory, their latest purchase rates are used automatically.</div>`}
  <div class="filters">${fld("Search",`<input id="kc-q" data-ui="kit.cq" value="${esc(U.cq||"")}" placeholder="Dish or category">`)}<button class="btn" data-a="costCsv" style="margin-left:auto">Download CSV</button></div>
  <div class="panel"><div class="tbl-wrap"><table><thead><tr><th>Dish</th><th>Category</th><th class="num">Serves</th><th class="num">Cost / serve</th><th class="num">Menu price</th><th class="num">Food cost</th><th class="num">Price at ${tgt()}%</th><th class="num">Unpriced</th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td><button class="linkbtn" data-a="rcpView" data-x="${r.m.id}"><b>${esc(r.m.name)}</b></button>${r.m.trial?' <span class="chip plain">New</span>':""}</td><td>${esc(r.m.cat||"")}</td><td class="num">${r.c.base}</td><td class="num"><b>₹${inr.format(r.c.perServe)}</b></td><td class="num">${r.p?"₹"+inr0.format(r.p):"—"}</td><td class="num">${r.fc!=null?`<span class="chip ${r.fc<=tgt()?"ok":r.fc<=tgt()+8?"warn":"bad"}">${r.fc.toFixed(1)}%</span>`:"—"}</td><td class="num">₹${inr0.format(sugg(r.c.perServe))}</td><td class="num">${r.c.unpriced||""}</td></tr>`).join("")}</tbody></table></div></div>
  <details class="panel pb"><summary><b>Ingredient rates used</b> — ${Object.keys(ovr()).length} set by you, ${STD.length} indicative</summary>
  <div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>Ingredient</th><th class="num">Rate</th><th>Source</th><th></th></tr></thead><tbody>
  ${Object.entries(ovr()).map(([k,r])=>`<tr><td>${esc(k)}</td><td class="num">₹${inr.format(r.rate)}/${esc(r.unit)}</td><td><span class="chip plain">Your rate</span></td><td><button class="linkbtn" data-a="costRate" data-x="${esc(k)}" data-k="${esc(k)}">change</button></td></tr>`).join("")}
  ${STD.filter(s=>!FREE.test(s[0])).map(s=>{const inv0=invMatch(s[0],s[0]);const inv=invOk(s,inv0)?inv0:null;return `<tr><td>${esc(s[0])}</td><td class="num">₹${inr.format(inv?inv.rate:s[3])}/${inv?inv.unit:s[2]}</td><td>${inv?`<span class="chip ok">Inventory · ${esc(inv.label)}</span>`:'<span class="chip warn">Indicative</span>'}</td><td><button class="linkbtn" data-a="costRate" data-x="${esc(s[0])}">set my rate</button></td></tr>`}).join("")}</tbody></table></div></details>`};
J.act("costCsv",()=>{const rows=[["Dish","Category","New item","Serves","Cost per serve","Menu price","Food cost %","Price at target","Unpriced lines"]];for(const m of J.all("menu").filter(m=>(m.active!==false||m.trial)&&K().hasRcp(m))){const c=J.recipeCosting(m);const p=priceOf(m);rows.push([m.name,m.cat||"",m.trial?"Y":"",c.base,c.perServe.toFixed(2),p||"",p?(c.perServe/p*100).toFixed(1):"",sugg(c.perServe),c.unpriced])}J.saveFile("dish-costing-"+today()+".csv",J.toCSV(rows))});
// ---------------- share target: links shared to the installed app arrive as ?url= / ?text= / ?title= ----------------
(()=>{try{const p=new URLSearchParams(location.search);const u=p.get("url")||"",t=p.get("text")||"",ti=p.get("title")||"";if(u||/https?:\/\//.test(t)){sessionStorage.setItem("jcgg-share",JSON.stringify({u,t,ti}));history.replaceState(null,"",location.pathname+"#kitchen-new")}}catch(e){}})();
J.afterRender.push(()=>{let sh=null;try{sh=JSON.parse(sessionStorage.getItem("jcgg-share")||"null")}catch(e){}if(!sh||!S.ready)return;sessionStorage.removeItem("jcgg-share");setTimeout(()=>J.importVideo(sh.u||sh.t,[sh.ti,sh.t].filter(Boolean).join(" ")),200)});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
