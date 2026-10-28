/* Aggregator comparison: every charge each platform levies, side by side, with hidden charges marked in red.
   Add a platform later with J.aggRegister({id,label,color,family?,charges?:[{k,l,hid,n}]}) — it then appears in the
   comparison, filters and PDF automatically once its settlement rows are stored with agg:<id>. */
(()=>{
const J=window.J,A=J._agg;if(!A)return;
const {AGG,CK,FAMS,deductions,ui,barChart,pct,pf,sum,r2,inr,inr0,money0,fmtDate,esc}=A;
const COL={swiggy:"#eb6834",toing:"#7a3fb0",zomato:"#2a78d6"};
const PAL=["#1baf7a","#c9a227","#d6336c","#4c6ef5","#12b886","#f08c00","#868e96"];
const CATALOG={};
J.aggRegister=def=>{if(!def||!def.id)return;AGG[def.id]=def.label||def.id;CK[def.id]=def.id;if(def.family)FAMS[def.id]=def.family;COL[def.id]=def.color||PAL[Object.keys(COL).length%PAL.length];if(def.charges)CATALOG[def.id]=def.charges;
  const m=J.MODS?.find(x=>x.id==="sales");void m};
// the charge lines. hid = not part of the headline commission rate card (a "hidden" charge). Per platform overrides via def.charges
const LINES=[
 {k:"disc",l:"Restaurant-funded discounts / promos",hid:1,n:"Promos, BOGO, freebies and flat-offs – you fund 100% of them, outside the commission rate"},
 {k:"comm",l:"Commission / service fee",hid:0,n:"The headline rate"},
 {k:"payf",l:"Payment collection / mechanism fee",hid:1,n:"A second percentage on top of commission, charged on bill value including GST"},
 {k:"plat",l:"Membership & platform fees",hid:1,n:"Flat per-order fees that are not in the rate card",subs:["one","pocket","bolt","nofee","brand","exp","loy"]},
 {k:"dist",l:"Delivery & distance charges",hid:1,n:"Long-distance, delivery fee sponsored by you, delivery recoveries",subs:["ld","ldd","dsp","drec"]},
 {k:"canc",l:"Cancellation & call-centre charges",hid:1,n:"Only on cancelled or delayed orders",subs:["rcan","call"]},
 {k:"comp",l:"Customer complaints & refunds",hid:1,n:"Recovered from your payout",subs:["ccmp","ccan"]},
 {k:"ads",l:"Ads, credit/debit notes & recoveries",hid:1,n:"Billed outside the order – ads, promo recovery, notes",subs:["ads","cn","prec"]},
 {k:"gstf",l:"GST @18% on aggregator fees",hid:1,n:"Another 18% on every fee above (claimable as input tax credit)"},
 {k:"tds",l:"TDS (194-O)",hid:0,n:"Statutory – adjust in your return"},
 {k:"tcs",l:"TCS",hid:0,n:"Statutory – adjust in your return"},
 {k:"oth",l:"Other / unexplained",hid:1,n:"Whatever the report does not itemise"}];
const SUBS={one:["Swiggy One fee",1],pocket:["Pocket Hero fee",1],bolt:["Bolt fee",1],nofee:["No-fees-week credit",0],brand:["Brand pack subscription fee",1],exp:["Express order fee",1],loy:["Brand loyalty points redeemed",1],
 ld:["Long-distance charge",1],ldd:["Discount on long-distance",0],dsp:["Delivery fee sponsored by you",1],drec:["Delivery charges recovery",1],rcan:["Restaurant cancellation charge",1],call:["Call-centre charge",1],ccmp:["Customer complaints",1],ccan:["Customer cancellations",1],ads:["Extra inventory ads & misc.",1],cn:["Credit / debit note adjustment",1],prec:["Promo recovery adjustment",1]};
// every charge a platform's reports can carry (catalogue) – hidden ones in red; extend via aggRegister
CATALOG.swiggy=[["Commission (service fee %)",0,"Charged on item total + packing + GST, so the real % is above the stated one"],["Payment collection charges",1,"~2% of the GST-inclusive bill"],["Swiggy One fee",1,"₹5 per order for Swiggy One customers"],["Pocket Hero fee",1,"Per-order when applicable"],["Bolt fee",1,"Fast-delivery add-on"],["Long-distance charges",1,"When the customer is far"],["Call-centre charges",1,"On orders needing support"],["Restaurant cancellation charges",1,"When you cancel"],["Delivery fee sponsored by restaurant",1,"If you offer free delivery"],["Customer complaints / cancellations",1,"Refunds recovered from you"],["GST on service fee @18%",1,"Extra on all fees above"],["GST deduction 9(5)",0,"Pass-through of customer GST – not a cost"],["TCS",0,"Statutory"],["TDS 194-O",0,"Statutory 0.1%"],["Growth investment / ads",1,"Billed separately"],["Restaurant discount share",1,"Promos you fund"]];
CATALOG.toing=CATALOG.swiggy.map(x=>x.slice());
CATALOG.zomato=[["Service fee (commission %)",0,"On commissionable value after your promo"],["Payment mechanism fee",1,"Percentage on top of service fee"],["Taxes on service & payment fee (18% GST)",1,"Extra on both fees"],["Brand pack subscription fee",1,"Platform subscription"],["Express order fee",1,"Priority delivery add-on"],["Brand loyalty points redemption",1,"Points the customer redeems are charged to you"],["Delivery charge for restaurants / recovery",1,"When you bear delivery"],["Customer compensation / recoupment",1,"Refunds recovered from you"],["Credit / debit note adjustments",1,"Back-adjustments"],["Promo recovery adjustment",1,"Promo cost recovered"],["Extra inventory ads & misc.",1,"Ads billed through payout"],["Restaurant discount [Promo / BOGO]",1,"Promos you fund"],["TCS (IGST/GST)",0,"Statutory"],["TDS 194-O",0,"Statutory"],["GST paid by Zomato on your behalf 9(5)",0,"Pass-through – not a cost"],["Other order-level deductions",1,"Anything else on the order"]];
const sel=U=>{const c=U.cmp||{};const ids=Object.keys(AGG);const on=ids.filter(i=>c[i]!==0&&c[i]!==false);return on.length?on:ids};
const subAmt=(rows,a,k)=>{let v=0,n=0,m=0;for(const r of rows){if(r.agg!==a||!r.st||r.st.can)continue;n++;if(r.st.sub){m++;v+=r.st.sub[k]||0}}return {v:r2(v),n,m}};
function stats(rows,a){const R=rows.filter(r=>r.agg===a);const d=deductions(R);const st=R.filter(r=>r.st&&!r.st.can).map(r=>r.st);const item=sum(st,o=>o.item);
  const stated=item?sum(st,o=>o.pct*o.item)/item:0;const effPct=d.gross?pct(d.comm,d.gross):0;return {d,R,n:d.n,gross:d.gross,stated,eff:effPct,uplift:Math.max(0,effPct-stated),tcs:d.tcs??sum(st,o=>o.tcs||0),
    tcsAmt:sum(st,o=>o.tcs||0),tdsAmt:sum(st,o=>o.tds||0)}}
function table(ids,rows,showSubs,print){const S=Object.fromEntries(ids.map(a=>[a,stats(rows,a)]));const red=print?"#c92a2a":"var(--bad)";const tint=print?"#fdecec":"rgba(201,42,42,.08)";
  const cell=(a,v,g)=>`<td class="num">${v==null?"–":inr.format(v)}</td><td class="num">${v==null||!g?"":pf(pct(v,g))}</td>`;
  const hidMark=`<span style="color:${red};font-weight:700" title="Hidden charge – not in the headline rate">●</span> `;
  const head=`<tr><th>Charge ( <span style="color:${red}">●</span> = hidden charge )</th>${ids.map(a=>`<th class="num" colspan="2" style="border-bottom:3px solid ${COL[a]||"#888"}">${esc(AGG[a])}</th>`).join("")}</tr><tr><th class="hint"></th>${ids.map(()=>`<th class="num">₹</th><th class="num">% of item</th>`).join("")}</tr>`;
  const trow=(l,n,hid,vals,o={})=>`<tr style="${hid?`background:${tint};box-shadow:inset 3px 0 0 ${red}`:""}${o.bold?";font-weight:700":""}${o.memo?";font-style:italic":""}"><td style="padding-left:${o.sub?22:8}px">${hid?hidMark:""}${o.bold?"<b>"+l+"</b>":esc(l)}${n?`<div class="hint">${esc(n)}</div>`:""}</td>${vals}</tr>`;
  const best=(fn,low)=>{const v=ids.map(a=>S[a].gross?fn(S[a]):null).filter(x=>x!=null);return v.length>1?(low?Math.min(...v):Math.max(...v)):null};
  let h="";
  h+=trow("Orders with a settlement report","",0,ids.map(a=>`<td class="num">${S[a].n}</td><td></td>`).join(""));
  h+=trow("Item value + packing (what customers ordered)","",0,ids.map(a=>cell(a,S[a].gross,S[a].gross)).join(""),{bold:1});
  for(const L of LINES){const subs=showSubs&&L.subs?L.subs.filter(k=>ids.some(a=>subAmt(rows,a,k).v!==0)):[];
    const hid=ids.some(a=>(CATALOG[a+"_hid"]||{})[L.k]!=null?CATALOG[a+"_hid"][L.k]:L.hid);
    h+=trow(L.l,L.n,L.hid,ids.map(a=>{const v=S[a].d[L.k]??(L.k==="tcs"?S[a].tcsAmt:0);return cell(a,S[a].n?v:null,S[a].gross)}).join(""));
    for(const k of subs){const [lab,hs]=SUBS[k];h+=trow(lab,"",hs,ids.map(a=>{const q=subAmt(rows,a,k);return q.n&&q.m===q.n?cell(a,q.v,S[a].gross):`<td class="num hint">${q.n?"partly captured":"–"}</td><td></td>`}).join(""),{sub:1})}}
  const hidSum=a=>sum(LINES.filter(L=>L.hid),L=>S[a].d[L.k]??0);const disSum=a=>sum(LINES.filter(L=>!L.hid),L=>L.k==="tcs"?S[a].tcsAmt:(S[a].d[L.k]??0));
  h+=trow("Disclosed charges (headline commission + statutory tax)","",0,ids.map(a=>cell(a,S[a].n?disSum(a):null,S[a].gross)).join(""));
  h+=trow("HIDDEN charges (everything else)","In red above – what the headline rate does not tell you",1,ids.map(a=>cell(a,S[a].n?hidSum(a):null,S[a].gross)).join(""),{bold:1});
  const bc=best(x=>pct(x.d.cost,x.gross),1),wc=best(x=>pct(x.d.cost,x.gross),0);
  h+=trow("TOTAL COST of selling through the platform","",0,ids.map(a=>{const v=S[a].n?S[a].d.cost:null;const p=S[a].gross?pct(v,S[a].gross):null;const flag=p!=null&&bc!=null&&ids.length>1?(p===bc?`<div class="hint" style="color:#2b8a3e">lowest</div>`:p===wc?`<div class="hint" style="color:${red}">highest</div>`:""):"";return `<td class="num"><b>${v==null?"–":inr.format(v)}</b></td><td class="num"><b>${p==null?"":pf(p)}</b>${flag}</td>`}).join(""),{bold:1});
  h+=trow("GST retained by platform under 9(5)","Pass-through of customer GST – not a cost",0,ids.map(a=>cell(a,S[a].n?S[a].d.gst95:null,S[a].gross)).join(""));
  h+=trow("Net payout to bank","",0,ids.map(a=>cell(a,S[a].n?S[a].d.payout:null,S[a].gross)).join(""),{bold:1});
  h+=trow("Average cost per order","",0,ids.map(a=>`<td class="num">${S[a].n?inr.format(r2(S[a].d.cost/S[a].n)):"–"}</td><td></td>`).join(""));
  h+=trow("Average order value","",0,ids.map(a=>`<td class="num">${S[a].n?inr.format(r2(S[a].gross/S[a].n)):"–"}</td><td></td>`).join(""));
  h+=trow("Stated commission rate vs what is really charged","Commission is levied on item + packing + GST, so the effective % is higher",1,ids.map(a=>`<td class="num">${S[a].n?pf(S[a].stated):"–"}</td><td class="num" style="color:${red}">${S[a].n?pf(S[a].eff)+(S[a].uplift>0.05?` (+${S[a].uplift.toFixed(1)} pts)`:""):""}</td>`).join(""),{memo:1});
  return `<div class="tbl-wrap"><table class="t cmp"><thead>${head}</thead><tbody>${h}</tbody></table></div>`}

// ---- Do we receive the Ground Floor (kitchen module) price after the platform's deductions? ----
const nm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function menuFind(name){const k=nm(name);const all=J.all("menu");return all.find(m=>nm(m.name)===k)||all.find(m=>nm(m.name)===nm(String(name).split(" - ")[0]))||all.find(m=>nm(m.name).startsWith(nm(String(name).split(" - ")[0])))||null}
const rt=(m,k)=>{const v=m?.rates?.[k];return v===""||v==null?(k==="gr"&&m?.price?+m.price:null):+v};
function qtys(prices,total){const n=prices.length;if(!n||prices.some(p=>!(p>0)))return null;const best=[];const q=Array(n).fill(1);
  (function rec(i,s){if(i===n){if(Math.abs(s-total)<1.5)best.push(q.slice());return}for(let k=1;k<=12;k++){q[i]=k;if(s+prices[i]*k<=total+1.5)rec(i+1,s+prices[i]*k);else break}})(0,0);
  if(!best.length)return null;best.sort((a,b)=>a.reduce((x,y)=>x+y,0)-b.reduce((x,y)=>x+y,0));return {q:best[0],amb:best.length>1}}
function grRows(rows){const day=new Map();const ext=new Map();for(const d of J.all("ppday"))for(const o of d.orders||[])if(o.ext)ext.set(String(o.ext),{o,d:d.id});
  const out=[];for(const r of rows){if(!r.pp||!r.st||r.st.can||!r.st.payout)continue;const e=ext.get(String(r.pp.id));if(!e||!e.o.items?.length)continue;
    const ms=e.o.items.map(i=>({i,m:menuFind(i)}));const miss=ms.filter(x=>!x.m||!(rt(x.m,"gr")>0));
    const total=+e.o.amt||r.pp.net;let pr=null,basis="";
    if(!miss.length){for(const k of ["mez","gr","grBf","mezBf"]){if(ms.some(x=>!(rt(x.m,k)>0)))continue;const f=qtys(ms.map(x=>rt(x.m,k)),total);if(f){pr=f;basis=k;break}}}
    const q=pr?pr.q:ms.map(()=>1);const gr=miss.length?null:r2(ms.reduce((s,x,i)=>s+rt(x.m,"gr")*q[i],0));
    out.push({agg:r.agg,id:r.pp.id,date:e.d,items:ms.map((x,i)=>(q[i]>1?q[i]+"× ":"")+x.i).join(", "),qok:!!pr,basis,online:total,item:r.st.item,payout:r.st.payout,gr,miss:miss.map(x=>x.i),r});}
  return out}
function grSection(ids,rows,print){const red=print?"#c92a2a":"var(--bad)";const G=grRows(rows).filter(x=>ids.includes(x.agg));if(!G.length)return `<p class="hint">No settled order with item names found for the chosen platforms.</p>`;
  const ok=G.filter(x=>x.gr!=null);const BL={mez:"Mez. Flr",gr:"Gr. Flr",grBf:"Gr. Bkfst",mezBf:"Mez. Bkfst"};
  const sumRow=a=>{const L=ok.filter(x=>x.agg===a);if(!L.length)return "";const gr=sum(L,x=>x.gr),on=sum(L,x=>x.online),po=sum(L,x=>x.payout);const diff=r2(po-gr);const k=po?gr/po:0;const need=(on*k);
    return `<tr><td><b>${esc(AGG[a])}</b> <span class="hint">${L.length} orders</span></td><td class="num">${inr.format(on)}</td><td class="num">${inr.format(gr)}</td><td class="num">${inr.format(po)}</td><td class="num" style="color:${diff<0?red:"#2b8a3e"}"><b>${diff<0?"−":"+"}${inr.format(Math.abs(diff))}</b></td><td class="num" style="color:${diff<0?red:"#2b8a3e"}">${pf(pct(diff,gr))}</td><td class="num">${po?"×"+(gr/po).toFixed(2):"–"}</td><td class="num">${inr.format(r2(need))}</td></tr>`};
  const det=G.map(x=>{const d=x.gr==null?null:r2(x.payout-x.gr);return `<tr><td>${fmtDate(x.date)}</td><td>${esc(AGG[x.agg])}</td><td class="hint">…${esc(String(x.id).slice(-6))}</td><td style="white-space:normal;min-width:180px">${esc(x.items)}${x.qok?"":` <span class="hint">(qty not resolved)</span>`}${x.miss.length?` <span style="color:${red}" class="hint">no Gr. rate for ${esc(x.miss.join(", "))}</span>`:""}</td><td class="num">${inr.format(x.online)}${x.basis&&x.basis!=="gr"?`<div class="hint">= ${BL[x.basis]} rate</div>`:""}</td><td class="num">${x.gr==null?"–":inr.format(x.gr)}</td><td class="num">${inr.format(x.payout)}</td><td class="num" style="color:${d==null?"inherit":d<0?red:"#2b8a3e"}">${d==null?"–":(d<0?"−":"+")+inr.format(Math.abs(d))}</td><td class="num">${d==null?"":pf(pct(d,x.gr))}</td></tr>`}).join("");
  return `<div class="tbl-wrap"><table class="t cmp"><thead><tr><th>Platform</th><th class="num">Online price billed</th><th class="num">Gr. Floor value (kitchen menu)</th><th class="num">Net payout received</th><th class="num">Short (−) / extra (+)</th><th class="num">% of Gr. price</th><th class="num">Online price must be</th><th class="num">So list at (₹ for same bills)</th></tr></thead><tbody>${ids.map(sumRow).join("")}</tbody></table></div>
  <p class="hint">Gr. Floor value = ground-floor rate in the kitchen module × quantity (quantity worked out from the Petpooja bill value, since the order listing carries item names only). “Online price must be” is the multiple of the Gr. Floor price you would have to bill on the platform to land exactly the Gr. Floor price in the bank after every deduction.</p>
  <details><summary><b>Order by order</b></summary><div class="tbl-wrap"><table class="t cmp"><thead><tr><th>Date</th><th>Platform</th><th>Order</th><th>Items</th><th class="num">Billed online</th><th class="num">Gr. Floor value</th><th class="num">Payout</th><th class="num">Short/extra</th><th class="num">%</th></tr></thead><tbody>${det}</tbody></table></div></details>`}
const SEG=[["disc","Discounts","#d6336c"],["comm","Commission","#2a78d6"],["payf","Payment fee","#1baf7a"],["plat","Platform fees","#6250d6"],["oth2","Delivery / cancel / complaints / ads","#c9a227"],["gstf","GST on fees","#eb6834"],["tx","TDS / TCS","#868e96"],["oth","Unexplained","#343a40"]];
function chart(ids,rows,hex){const data=ids.map(a=>{const R=rows.filter(r=>r.agg===a);const d=deductions(R);const g=d.gross||1;return {label:AGG[a].replace("Swiggy ","S."),v:{disc:pct(d.disc,g),comm:pct(d.comm,g),payf:pct(d.payf,g),plat:pct(d.plat,g),oth2:pct(d.dist+d.canc+d.comp+d.ads,g),gstf:pct(d.gstf,g),tx:pct(d.tds+sum(R.filter(r=>r.st),r=>r.st.tcs||0),g),oth:pct(d.oth,g),net:d.gross?pct(d.payout,g):0}}});
  const lg=`<div class="lg">${SEG.map(s=>`<span><i style="background:${s[2]}"></i>${s[1]}</span>`).join("")}<span><i style="background:#222;border-radius:50%"></i>Net payout % (line)</span></div>`;
  let svg=barChart(data,SEG.map(s=>({k:s[0],c:s[2],n:s[1]})),{money:false,h:230,line:{k:"net",c:"#222",n:"Net payout %"}});if(hex)svg=svg.replace(/var\(--sheet\)/g,"#fff").replace(/var\(--ink\)/g,"#222");return lg+svg}
function catalogue(ids,print){const red=print?"#c92a2a":"var(--bad)";const tint=print?"#fdecec":"rgba(201,42,42,.08)";
  return ids.map(a=>{const c=CATALOG[a]||[];return `<h3 style="margin:14px 0 4px">${esc(AGG[a])} – every charge the platform can levy</h3>${c.length?`<div class="tbl-wrap"><table class="t"><thead><tr><th>Charge</th><th>Status</th><th>What it is</th></tr></thead><tbody>${c.map(([l,h,n])=>`<tr style="${h?`background:${tint};box-shadow:inset 3px 0 0 ${red}`:""}"><td>${h?`<span style="color:${red};font-weight:700">● </span>`:""}${esc(l)}</td><td>${h?`<b style="color:${red}">Hidden</b>`:"Disclosed / statutory"}</td><td class="hint">${esc(n)}</td></tr>`).join("")}</tbody></table></div>`:'<p class="hint">No charge list registered for this platform yet.</p>'}`}).join("")}
J.act("aggCmpTog",el=>{const U=ui();const c=U.cmp=U.cmp||{};const a=el.dataset.x;const cur=sel(U);if(cur.includes(a)&&cur.length===1)return J.toast?.("Keep at least one platform selected");c[a]=cur.includes(a)?0:1;for(const i of Object.keys(AGG))if(c[i]==null)c[i]=cur.includes(i)?1:0;J.render()});
J.act("aggCmpOpt",el=>{const U=ui();U[el.dataset.x]=!U[el.dataset.x];J.render()});
J.act("aggCmpPrint",()=>{const U=ui();const all=J._agg.unify();const rows=J._agg.filtered(U,all);const ids=sel(U);const period=U.from||U.to?`${U.from?fmtDate(U.from):"start"} – ${U.to?fmtDate(U.to):"today"}`:"All uploaded reports";
  const css=`<style>.cmp th,.cmp td{font-size:10.5px;padding:4px 6px;border-bottom:1px solid #ddd}.cmp th{background:#f3f3f3;text-align:left}.num{text-align:right}.hint{color:#666;font-size:9.5px;font-weight:400}.lg{display:flex;gap:10px;flex-wrap:wrap;font-size:10px;margin:6px 0}.lg i{display:inline-block;width:9px;height:9px;margin-right:4px}svg text{fill:#444;font-size:10px}.grid line{stroke:#ccc}h3{font-size:13px}table{border-collapse:collapse;width:100%}</style>`;
  const title=ids.length===1?AGG[ids[0]]+" – charges & deductions":"Aggregator comparison – "+ids.map(a=>AGG[a]).join(" · ");
  const html=css+`<h1>${esc(J.settings().business||"JCGG")} — ${esc(title)}</h1><p class="hint">Period: ${esc(period)} · based on settled orders from the platforms' own settlement reports · percentages are of item value + packing · <span style="color:#c92a2a">●</span> marks hidden charges.</p>`+
   (ids.length>1?`<h3>Where each ₹100 of item value goes</h3>${chart(ids,rows,true)}`:"")+`<h3>Charge-by-charge${ids.length>1?" comparison":""}</h3>${table(ids,rows,U.cmpSubs!==false,true)}<h3>Do you receive the Ground Floor price?</h3>${grSection(ids,rows,true)}`+(U.cmpCat!==false?catalogue(ids,true):"");
  J.printDoc(title,html,true)});
J.aggCmpView=(U,all,rows)=>{const ids=sel(U);const chip=a=>`<label class="chip ${ids.includes(a)?"ok":"plain"}" style="cursor:pointer;gap:6px;border:2px solid ${COL[a]||"#888"}"><input type="checkbox" ${ids.includes(a)?"checked":""} data-ach="aggCmpTog" data-x="${a}"> ${esc(AGG[a])}</label>`;
  const opt=(k,l,d)=>`<label class="row" style="gap:6px"><input type="checkbox" data-ach="aggCmpOpt" data-x="${k}" ${(U[k]===undefined?d:U[k])?"checked":""}> ${l}</label>`;
  const ex=document.getElementById("aggcmpx");void ex;
  return `<section class="panel pb"><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><b>Compare:</b>${Object.keys(AGG).map(chip).join("")}<button class="btn primary" data-a="aggCmpPrint" style="margin-left:auto">Print / save as PDF</button></div>
   <div class="row" style="gap:16px;flex-wrap:wrap;margin-top:8px">${opt("cmpSubs","Show each small charge",true)}${opt("cmpCat","Include the full charge catalogue in the PDF",true)}<span class="hint">Pick one platform for a single report, or several for a comparison. The date filter above applies.</span></div></section>
  ${ids.length>1?`<section class="panel pb"><h3 style="margin-top:0">Where each ₹100 of item value goes</h3>${chart(ids,rows,false)}</section>`:""}
  <section class="panel pb"><h3 style="margin-top:0">Charge-by-charge${ids.length>1?" comparison":""} <span class="hint">(hidden charges marked <span style="color:var(--bad)">●</span> in red)</span></h3>${table(ids,rows,U.cmpSubs!==false,false)}</section>
  <section class="panel pb"><h3 style="margin-top:0">Do you receive the Ground Floor price? <span class="hint">(payout after all deductions vs kitchen-menu Gr. Floor rate)</span></h3>${grSection(ids,rows,false)}</section>
  <section class="panel pb"><details><summary><b>Every charge each platform can levy (catalogue)</b></summary>${catalogue(ids,false)}</details></section>`};
})();
