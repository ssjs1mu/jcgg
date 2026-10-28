/* Aggregator (Swiggy / Zomato) settlement reconciliation, deductions analysis, receivables and retention.
   - Upload the weekly settlement reports (.xlsx) from each aggregator: every order's fees, taxes and payout are kept.
   - Orders are matched to Petpooja by the aggregator's order id (Petpooja "ext" id), payouts to the bank by UTR / amount.
   - Data lives in meta/aggs-<agg>-<yyyy-mm> (orders by id) and meta/aggfiles (upload log). */
(()=>{
const J=window.J,{S,esc,inr,inr0,r2,money0,fmtDate,toast}=J;
const arr=x=>Array.isArray(x)?x:[];
const AGG={swiggy:"Swiggy",zomato:"Zomato"};
const nm=v=>{const n=typeof v==="number"?v:parseFloat(String(v??"").replace(/[₹,\s%]/g,""));return Number.isFinite(n)?n:0};
const hn=s=>String(s??"").replace(/\[.*?\]/g,"").replace(/\s+/g," ").trim().toLowerCase();
const hn1=s=>String(s??"").split("\n")[0].replace(/\s+/g," ").trim().toLowerCase();
const pad=n=>String(n).padStart(2,"0");
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const serial=n=>{const d=new Date(Math.round((n-25569)*864e5));return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())};
function pd(v,yr){if(v==null||v==="")return "";if(typeof v==="number")return v>20000&&v<90000?serial(v):"";const s=String(v).trim();let m;
  if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})/)))return m[1]+"-"+m[2]+"-"+m[3];
  if((m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/)))return m[3]+"-"+pad(+m[2])+"-"+pad(+m[1]);
  if((m=s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s*(\d{4})?/))&&MON[m[2].toLowerCase()])return (m[3]||yr||new Date().getFullYear())+"-"+pad(MON[m[2].toLowerCase()])+"-"+pad(+m[1]);return ""}
const ptime=v=>{const m=String(v||"").match(/(\d{1,2}):(\d{2})/);return m?pad(+m[1])+":"+m[2]:""};
const D0=s=>new Date(s+"T00:00:00Z"),isoD=d=>d.toISOString().slice(0,10);
const addD=(s,n)=>isoD(new Date(D0(s).getTime()+n*864e5));
const dow=s=>D0(s).getUTCDay();
const todayS=()=>J.today?J.today():new Date().toISOString().slice(0,10);
// ---------- cycles ----------
const cycle=(agg,date)=>{const d=dow(date);if(agg==="swiggy"){const s=addD(date,-d);return {from:s,to:addD(s,6),pay:addD(s,9)}}const s=addD(date,-((d+6)%7));return {from:s,to:addD(s,6),pay:addD(s,9)}};
// ---------- parsing ----------
const sheetRows=(X,ws)=>X.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});
function mapCols(hdr,spec,norm){const out={};const used=new Set();for(const [k,re] of spec){const i=hdr.findIndex((c,j)=>!used.has(j)&&re.test(norm(c)));if(i>=0){out[k]=i;used.add(i)}}return out}
const SW=[["id",/^order id$/],["date",/^order date$/],["sdate",/order settlement date/],["status",/^order status$/],["pay",/order payment type/],["cby",/cancelled by/],["coupon",/coupon type/],["item",/^item('s)? total$/],["pack",/^(packaging|packing) charges$/],["disc",/^restaurant discount share/],["net",/^net bill value/],["gst",/^gst collected$/],["paid",/^total customer paid/],["commBase",/^commission charged on/],["pct",/^service fees %/],["comm",/^commission$/],["ld",/^long distance charges$/],["ldd",/^discount on long distance/],["pocket",/^pocket hero fees/],["nofee",/^no fees week/],["one",/^swiggy one fees/],["payf",/^payment collection/],["rcan",/^restaurant cancellation/],["call",/^call center/],["dsp",/^delivery fee sponsored/],["bolt",/^bolt fees/],["gstf",/^gst on service fee/],["ccan",/^customer cancellations/],["ccmp",/^customer complaints/],["gst95",/^gst deduction/],["tcs",/^tcs$/],["tds",/^tds$/],["payout",/^net payout/],["cat",/^order category/],["onec",/^swiggy one customer/],["camp",/^discount campaign id/]];
const ZO=[["id",/^order id/],["date",/^order date/],["status",/^order status/],["pay",/^mode of payment/],["constr",/^discount construct/],["otype",/^order type/],["item",/^subtotal/],["pack",/^packaging charge/],["dself",/^delivery charge for restaurants/],["promo",/^restaurant discount \[promo\]/],["bogo",/^restaurant discount \[bogo/],["brand",/^brand pack subscription/],["ddisc",/^delivery charge discount/],["gst",/^total gst collected/],["net",/^net order value/],["commBase",/^commissionable value/],["pct",/^service fees %/],["comm",/^service fee$/],["payf",/^payment mechanism fee/],["gstf",/^taxes on service/],["tcsA",/^tax collected at source/],["tcsI",/^tcs igst/],["tds",/^tds 194o/],["gst95",/^gst paid by zomato/],["gstR",/^gst to be paid by restaurant/],["ccmp",/^customer compensation/],["drec",/^delivery charges recovery/],["cash",/^amount received in cash/],["cn",/^credit note/],["prec",/^promo recovery/],["ads",/^extra inventory ads/],["loy",/^brand loyalty/],["exp",/^express order fee/],["oded",/^other order-level/],["nded",/^net deductions/],["nadd",/^net additions/],["payout",/^order level payout/],["sst",/^settlement status/],["sdate",/^settlement date/],["utr",/^bank utr/],["unset",/^unsettled amount/],["cust",/^customer id/]];
const cancelled=s=>/cancel|reject/i.test(String(s||""));
function parseSwiggy(X,wb){const sh=wb.SheetNames.find(n=>/^order level/i.test(n));if(!sh)throw new Error("Order Level sheet not found.");const rows=sheetRows(X,wb.Sheets[sh]);
  const hi=rows.findIndex(r=>r.some(c=>hn(c)==="order id")&&r.some(c=>hn(c)==="order date"));if(hi<0)throw new Error("Could not find the Order Level header row.");
  const ix=mapCols(rows[hi],SW,hn);const g=(r,k)=>ix[k]>=0&&ix[k]!=null?r[ix[k]]:"";
  const meta={agg:"swiggy"};const ss=wb.SheetNames.find(n=>/^summary/i.test(n));if(ss){for(const r of sheetRows(X,wb.Sheets[ss])){const t=hn(r[1]);const v=String(r[2]??"").trim();if(/^payout period/.test(t))meta.period=v;else if(/settlement date/.test(t))meta.sdateTxt=v;else if(/^total payout/.test(t))meta.total=nm(v);else if(/bank utr/.test(t))meta.utr=v;else if(/rest\.?\s*id/.test(String(r[1]).toLowerCase()))meta.rid=String(r[1]).replace(/\D/g,"")}}
  const recs=[];for(const r of rows.slice(hi+1)){const id=String(g(r,"id")??"").replace(/\.0$/,"").trim();if(!/^\d{6,}$/.test(id))continue;
    const date=pd(g(r,"date"));const st=String(g(r,"status")||"").toLowerCase();const paid=nm(g(r,"paid"));const payout=nm(g(r,"payout"));
    const o={agg:"swiggy",id,date,time:ptime(g(r,"date")),st:st,can:cancelled(st),item:nm(g(r,"item")),pack:nm(g(r,"pack")),disc:nm(g(r,"disc")),gst:nm(g(r,"gst")),paid,commBase:nm(g(r,"commBase")),pct:nm(g(r,"pct")),
      comm:nm(g(r,"comm")),payf:nm(g(r,"payf")),plat:nm(g(r,"one"))+nm(g(r,"pocket"))+nm(g(r,"bolt"))-nm(g(r,"nofee")),dist:nm(g(r,"ld"))-nm(g(r,"ldd"))+nm(g(r,"dsp")),canc:nm(g(r,"rcan"))+nm(g(r,"call")),comp:nm(g(r,"ccmp"))+nm(g(r,"ccan")),ads:0,
      gstf:nm(g(r,"gstf")),gst95:nm(g(r,"gst95")),tds:nm(g(r,"tds")),tcs:nm(g(r,"tcs")),payout,sdate:pd(g(r,"sdate")),one:/^y/i.test(String(g(r,"onec"))),cat:String(g(r,"cat")||""),camp:String(g(r,"camp")||""),coupon:String(g(r,"coupon")||""),pay:String(g(r,"pay")||""),cby:String(g(r,"cby")||"")};
    recs.push(o)}
  const yr=(recs[0]?.date||"").slice(0,4);const pm=String(meta.period||"").split(/\s*[-–]\s*/);meta.from=pd(pm[0],yr);meta.to=pd(pm[1],yr);meta.sdate=pd(meta.sdateTxt,(meta.to||"").slice(0,4));
  for(const o of recs){o.utr=meta.utr||"";o.pfrom=meta.from;o.pto=meta.to;if(!o.sdate||o.sdate<(meta.to||""))o.sdate=meta.sdate||o.sdate;o.settled=true}
  return {meta,recs}}
function parseZomato(X,wb){const sh=wb.SheetNames.find(n=>/^order level/i.test(n));if(!sh)throw new Error("Order Level sheet not found.");const rows=sheetRows(X,wb.Sheets[sh]);
  const hi=rows.findIndex(r=>r.some(c=>hn1(c)==="order id")&&r.some(c=>hn1(c)==="order date"));if(hi<0)throw new Error("Could not find the Order Level header row.");
  const ix=mapCols(rows[hi],ZO,hn1);const g=(r,k)=>ix[k]!=null?r[ix[k]]:"";
  const meta={agg:"zomato"};const hs=wb.SheetNames.find(n=>/^hsummary/i.test(n));if(hs){const r=(sheetRows(X,wb.Sheets[hs])[1]||sheetRows(X,wb.Sheets[hs])[0]||[]);const f=r.filter(c=>c!=="");meta.period=String(f[0]||"");meta.rid=String(f[1]||"");meta.cycle=String(f.find(c=>/weekly|daily|fortnight/i.test(String(c)))||"");meta.utr=String(f.find(c=>/^[A-Z]{4,}\d{6,}/.test(String(c)))||"").split(",")[0]}
  const recs=[];for(const r of rows.slice(hi+1)){const id=String(g(r,"id")??"").replace(/\.0$/,"").trim();if(!/^\d{6,}$/.test(id))continue;const st=String(g(r,"status")||"").toLowerCase();
    const o={agg:"zomato",id,date:pd(g(r,"date")),time:ptime(g(r,"date")),st,can:cancelled(st),item:nm(g(r,"item")),pack:nm(g(r,"pack")),disc:nm(g(r,"promo"))+nm(g(r,"bogo")),gst:nm(g(r,"gst")),paid:nm(g(r,"net")),commBase:nm(g(r,"commBase")),pct:nm(g(r,"pct")),
      comm:nm(g(r,"comm")),payf:nm(g(r,"payf")),plat:nm(g(r,"brand"))+nm(g(r,"exp"))+nm(g(r,"loy")),dist:nm(g(r,"drec")),canc:0,comp:nm(g(r,"ccmp")),ads:nm(g(r,"ads"))+nm(g(r,"prec"))+nm(g(r,"cn")),
      gstf:nm(g(r,"gstf")),gst95:nm(g(r,"gst95")),tds:nm(g(r,"tds")),tcs:nm(g(r,"tcsA"))+nm(g(r,"tcsI")),payout:nm(g(r,"payout")),sdate:pd(g(r,"sdate")),utr:String(g(r,"utr")||""),settled:/settled/i.test(String(g(r,"sst")||""))&&!/un/i.test(String(g(r,"sst")||"")),unset:nm(g(r,"unset")),
      cust:String(g(r,"cust")||""),coupon:String(g(r,"constr")||""),pay:String(g(r,"pay")||""),oth0:nm(g(r,"oded"))+nm(g(r,"cash"))};
    recs.push(o)}
  const pm=String(meta.period||"").split(/\s*[-–]\s*/);const yr=(recs[0]?.date||"").slice(0,4);meta.from=pd(pm[0],yr);meta.to=pd(pm[1],yr);for(const o of recs){o.pfrom=meta.from;o.pto=meta.to}
  return {meta,recs}}
// the residual keeps every order's arithmetic honest: whatever the buckets do not explain is shown as "other / unexplained"
function finish(o){const known=o.comm+o.payf+o.plat+o.dist+o.canc+o.comp+o.ads+o.gstf+o.gst95+o.tds+o.tcs;o.oth=r2(o.paid-o.payout-known);if(Math.abs(o.oth)<0.05)o.oth=0;
  for(const k of Object.keys(o))if(typeof o[k]==="number")o[k]=r2(o[k]);delete o.oth0;return o}
// ---------- storage ----------
const docs=agg=>J.all("meta").filter(m=>m.id.startsWith("aggs-"+agg+"-"));
const allRecs=()=>{const out=[];for(const a of Object.keys(AGG))for(const d of docs(a))for(const o of Object.values(d.orders||{}))out.push(o);return out};
async function saveRecs(recs){const by={};for(const o of recs){const m=(o.date||"").slice(0,7);if(!m)continue;(by[o.agg+"|"+m]??=[]).push(o)}
  for(const [k,list] of Object.entries(by)){const [agg,m]=k.split("|");const id="aggs-"+agg+"-"+m;const cur=J.get("meta",id)?.orders||{};const orders={...cur};
    for(const o of list){const e=orders[o.id];if(e&&e.settled&&!o.settled&&e.payout)continue;if(e&&e.utr&&!o.utr&&o.monthly)continue;orders[o.id]=o}
    await J.store.put("meta",{id,agg,month:m,orders,at:Date.now()})}}
const fileLog=()=>arr(J.get("meta","aggfiles")?.list);
// ---------- upload ----------
async function readFile(f){const X=await J.loadXLSX();const wb=X.read(await f.arrayBuffer(),{type:"array",cellDates:false});
  const names=wb.SheetNames.map(n=>n.toLowerCase());const swiggy=names.some(n=>/payout breakup/.test(n))&&names.some(n=>/growth investment/.test(n));const zomato=names.some(n=>/addition|hsummary/.test(n))&&names.some(n=>/^order level/.test(n));
  if(!swiggy&&!zomato)throw new Error("This does not look like a Swiggy or Zomato settlement report.");
  const res=swiggy?parseSwiggy(X,wb):parseZomato(X,wb);if(swiggy&&!names.some(n=>/^summary/.test(n))){res.meta.monthly=true;const m=(res.recs[0]?.date||"").slice(0,7);if(m){res.meta.from=m+"-01";res.meta.to=addD(m+"-01",new Date(+m.slice(0,4),+m.slice(5,7),0).getDate()-1)}
    for(const o of res.recs){o.monthly=true;o.utr="";o.pfrom=res.meta.from;o.pto=res.meta.to;o.sdate=cycle("swiggy",o.date).pay;o.settled=!o.can}}res.recs.forEach(finish);res.meta.name=f.name;return res}
J.act("aggUpload",()=>{const i=document.createElement("input");i.type="file";i.multiple=true;i.accept=".xlsx,.xls";i.onchange=()=>aggRead([...(i.files||[])]);i.click()});
async function aggRead(files){if(!files.length)return;J.busy.start("Reading settlement reports");const log=[...fileLog()];const msgs=[];
  try{for(const f of files){try{const {meta,recs}=await readFile(f);if(!recs.length){msgs.push(f.name+": no orders found");continue}
      const before=allRecs().filter(o=>o.agg===meta.agg);const have=new Set(before.map(o=>o.id));const fresh=recs.filter(o=>!have.has(o.id)).length;
      await saveRecs(recs);let saved=null;try{saved=await J.fileSave?.(f,"files")}catch(e){}
      const tot=r2(recs.reduce((s,o)=>s+o.payout,0));log.unshift({id:"af-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:f.name,agg:meta.agg,from:meta.from||"",to:meta.to||"",utr:meta.utr||"",orders:recs.length,fresh,payout:tot,reported:meta.total??null,at:Date.now(),by:S.me?.email||"",file:saved?.id||saved?.url||""});
      J.ppLogAdd?.({kind:"aggregator-report",note:AGG[meta.agg]+" settlement report "+f.name+": "+recs.length+" orders, payout ₹"+tot.toFixed(2)+(meta.utr?" · UTR "+meta.utr:"")});
      msgs.push(AGG[meta.agg]+": "+recs.length+" orders ("+fresh+" new) · payout "+money0(tot))}catch(e){msgs.push(f.name+": "+(e.message||"could not be read"))}}
    await J.store.put("meta",{id:"aggfiles",list:log.slice(0,300)});toast(msgs.join(" · "))}finally{J.busy.end()}J.render()}
J.aggIngest=aggRead;J.act("aggClear",()=>{const u=ui();u.from="";u.to="";J.render()});
// ---------- unified rows ----------
const live=o=>!/cancel|saved|void|deleted/i.test(o.status||"");
function ppOrders(){const out=new Map();for(const d of J.all("ppday"))for(const o of arr(d.orders)){if(!o.agg||!AGG[o.agg]||!live(o)||o.house)continue;const id=String(o.ext||"").trim();out.set(o.agg+"|"+(id||d.id+"-"+o.no),{agg:o.agg,id,date:d.id,no:o.no,net:r2(o.net||0),amt:o.amt,disc:o.disc,name:String(o.name||"").trim(),time:o.time})}return out}
const ratioDefault={swiggy:.628,zomato:.682};
function learned(rows,agg){const m=rows.filter(r=>r.agg===agg&&r.st&&r.pp&&r.st.settled&&!r.st.can&&r.pp.net>0);const base=m.reduce((s,r)=>s+r.pp.net,0);return m.length>=5&&base>0?{r:m.reduce((s,r)=>s+r.st.payout,0)/base,n:m.length,learned:true}:{r:ratioDefault[agg],n:m.length,learned:false}}
function unify(){const st=new Map();for(const o of allRecs())st.set(o.agg+"|"+o.id,o);const pp=ppOrders();const rows=[];const seen=new Set();
  for(const [k,p] of pp){const s=p.id?st.get(k):null;if(s)seen.add(k);rows.push({agg:p.agg,id:p.id,date:p.date,pp:p,st:s||null})}
  for(const [k,s] of st)if(!seen.has(k))rows.push({agg:s.agg,id:s.id,date:s.date,pp:null,st:s});
  const L={swiggy:learned(rows,"swiggy"),zomato:learned(rows,"zomato")};const t=todayS();
  for(const r of rows){const c=cycle(r.agg,r.date);r.cyc=c;
    if(r.st&&r.st.can){r.state="cancelled";r.exp=r.st.payout;continue}
    if(r.st&&r.st.settled){r.state="settled";r.exp=r.st.payout;continue}
    if(r.st){r.state="reported";r.exp=r.st.payout||r.st.unset||0;continue}
    r.exp=r2((r.pp?.net||0)*L[r.agg].r);r.est=true;r.state=c.pay+3<t?"overdue":"pending"}
  return {rows,L,st}}
// ---------- bank matching ----------
function bankReceipts(agg){const a=J.all("accounts").find(x=>x.kind==="aggregator"&&new RegExp(agg,"i").test(x.name));if(!a)return {acc:null,list:[]};
  const list=(J.D.post?.get(a.id)||[]).filter(p=>p.cr>0&&p.v.lines.some(l=>l.dr>0&&J.MONEY.includes(J.get("accounts",l.a)?.kind))).map(p=>({date:p.date,amt:r2(p.cr),no:p.v.no,vid:p.v.id,txt:(p.v.narr||"")+" "+(p.v.ref||"")+" "+(p.v.bank?.narr||"")+" "+(p.v.bank?.ref||"")}));return {acc:a,list}}
function payouts(rows){const g={};for(const r of rows){if(!r.st||r.st.can&&!r.st.payout)continue;const k=r.agg+"|"+(r.st.utr||r.st.sdate||r.st.pto||"?");const x=g[k]??={agg:r.agg,utr:r.st.utr||"",pay:r.st.sdate||"",from:r.st.pfrom||"",to:r.st.pto||"",n:0,item:0,payout:0,paid:0,unset:0,settled:true};x.n++;x.item+=r.st.item;x.paid+=r.st.paid;x.payout+=r.st.payout;if(!r.st.settled){x.settled=false;x.unset+=r.st.unset||r.st.payout}}
  const out=Object.values(g).sort((a,b)=>(b.pay||b.to).localeCompare(a.pay||a.to));const used=new Set();
  for(const agg of Object.keys(AGG)){const {list}=bankReceipts(agg);for(const x of out.filter(o=>o.agg===agg)){x.payout=r2(x.payout);const hit=list.find(b=>!used.has(b.vid)&&(x.utr&&b.txt.includes(x.utr)))||list.find(b=>!used.has(b.vid)&&Math.abs(b.amt-x.payout)<=1&&(!x.pay||Math.abs((D0(b.date)-D0(x.pay))/864e5)<=7));if(hit){used.add(hit.vid);x.bank=hit}}}
  const extra=[];for(const agg of Object.keys(AGG))for(const b of bankReceipts(agg).list)if(!used.has(b.vid))extra.push({...b,agg});return {list:out,extra}}
// ---------- periods ----------
const fyLabel=d=>{const y=+d.slice(0,4),m=+d.slice(5,7);const s=m>=4?y:y-1;return "FY "+s+"-"+String(s+1).slice(2)};
const pkey=(d,g)=>g==="day"?d:g==="week"?addD(d,-((dow(d)+6)%7)):g==="month"?d.slice(0,7):fyLabel(d);
const plab=(k,g)=>g==="day"?fmtDate(k):g==="week"?"Wk "+fmtDate(k).slice(0,6):g==="month"?(J.monthLabel?J.monthLabel(k):k):k;
const sum=(l,f)=>r2(l.reduce((s,x)=>s+f(x),0));
const pct=(a,b)=>b?(a/b*100):0;const pf=v=>(Math.round(v*10)/10).toFixed(1)+"%";
// ---------- charts ----------
const CSS=`<style id="aggcss">
.agg-root{--c-sw:#eb6834;--c-zo:#2a78d6;--c-a:#1baf7a;--c-b:#6250d6;--c-pay:var(--ink)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .agg-root{--c-sw:#d95926;--c-zo:#3987e5;--c-a:#199e70;--c-b:#9085e9}}
:root[data-theme="dark"] .agg-root{--c-sw:#d95926;--c-zo:#3987e5;--c-a:#199e70;--c-b:#9085e9}
.agg-root .lg{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink-2);margin:4px 0}.agg-root .lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.agg-root svg text{fill:var(--ink-2);font-size:10px}.agg-root .grid line{stroke:var(--rule)}.agg-root table.t th,.agg-root table.t td{white-space:nowrap}
.agg-root .hid{background:var(--warn-wash)}.agg-root .grow-up{color:var(--ok)}.agg-root .grow-dn{color:var(--bad)}
.agg-root .strip{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
</style>`;
function barChart(data,segs,{h=190,money=true,line=null}={}){if(!data.length)return '<p class="hint">No data in this period.</p>';const W=Math.max(320,Math.min(980,data.length*46+60)),H=h,pl=44,pb=22,pt=8;
  const tot=data.map(d=>segs.reduce((s,sg)=>s+(d.v[sg.k]||0),0));const mx=Math.max(1,...tot,...(line?data.map(d=>d.v[line.k]||0):[0]));const bw=Math.min(34,(W-pl-8)/data.length*.7);const step=(W-pl-8)/data.length;
  const y=v=>pt+(H-pt-pb)*(1-v/mx);const nice=v=>v>=1e5?(v/1e5).toFixed(1)+"L":v>=1e3?(v/1e3).toFixed(v>=1e4?0:1)+"k":Math.round(v);
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;height:auto" role="img" aria-label="Chart"><g class="grid">`;
  for(let i=0;i<=4;i++){const v=mx*i/4;s+=`<line x1="${pl}" x2="${W-4}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl-4}" y="${y(v)+3}" text-anchor="end">${money?"₹":""}${nice(v)}</text>`}s+="</g>";
  data.forEach((d,i)=>{const x=pl+step*i+(step-bw)/2;let acc=0;for(const sg of segs){const v=d.v[sg.k]||0;if(v<=0)continue;const y1=y(acc+v),y0=y(acc);const hh=Math.max(0,y0-y1-(acc?2:0));s+=`<rect x="${x}" y="${y1}" width="${bw}" height="${hh}" rx="${acc?0:0}" fill="${sg.c}"><title>${esc(d.label)} · ${esc(sg.n)}: ${money?"₹"+inr0.format(v):Math.round(v*10)/10}</title></rect>`;acc+=v}
    if(i%Math.ceil(data.length/8)===0)s+=`<text x="${x+bw/2}" y="${H-6}" text-anchor="middle">${esc(d.label.replace(/^Wk /,""))}</text>`});
  if(line){const pts=data.map((d,i)=>[pl+step*i+step/2,y(d.v[line.k]||0)]);s+=`<polyline fill="none" stroke="${line.c}" stroke-width="2" points="${pts.map(p=>p.join(",")).join(" ")}"/>`+pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${line.c}" stroke="var(--sheet)" stroke-width="2"><title>${esc(data[i].label)} · ${esc(line.n)}: ₹${inr0.format(data[i].v[line.k]||0)}</title></circle>`).join("")}
  return s+"</svg>"}
const legend=l=>`<div class="lg">${l.map(x=>`<span><i style="background:${x.c}"></i>${esc(x.n)}</span>`).join("")}</div>`;
// ---------- the view ----------
const ui=()=>J.ui("aggr",{agg:"all",g:"week",from:"",to:"",tab:"sum"});
const DED=[["comm","Commission / service fee","Stated % of order value",0],["payf","Payment collection fee","Stated %, but charged on value incl. GST",1],["plat","Membership & platform fees (Swiggy One, Pocket Hero, Bolt, brand pack, express)","Per-order flat fees – not in the rate card",1],["dist","Long-distance / delivery charges","Added when the customer is far",1],["canc","Cancellation & call-centre charges","Only on cancelled / delayed orders",1],["comp","Customer complaints & compensation","Refunds recovered from you",1],["ads","Ads, growth, credit/debit notes & recoveries","Billed outside the order",1],["gstf","GST @18% on aggregator fees","Extra 18% on every fee above – claimable as input credit",1],["tds","TDS 194-O / TCS","Tax withheld – adjust in your return",0],["oth","Other / unexplained","Whatever the report does not itemise",1]];
function filtered(U,all){let r=all.rows;if(U.agg!=="all")r=r.filter(x=>x.agg===U.agg);if(U.from)r=r.filter(x=>x.date>=U.from);if(U.to)r=r.filter(x=>x.date<=U.to);return r}
function deductions(rows){const st=rows.filter(r=>r.st&&!r.st.can).map(r=>r.st);const g=sum(st,o=>o.item+o.pack);const out={n:st.length,gross:g,disc:sum(st,o=>o.disc),paid:sum(st,o=>o.paid),payout:sum(st,o=>o.payout),gst95:sum(st,o=>o.gst95),gstc:sum(st,o=>o.gst),one:st.filter(o=>o.one).length};for(const [k] of DED)out[k]=sum(st,o=>o[k]||0);
  out.fees=r2(out.comm+out.payf+out.plat+out.dist+out.canc);out.cost=r2(out.fees+out.comp+out.ads+out.gstf+out.tds+out.oth+out.disc);out.net=r2(out.payout);return out}
function kpis(rows,all){const sales=rows.filter(r=>r.pp);const sp=sum(sales,r=>r.pp.net);const n=sales.length;const d=deductions(rows);const rec=sum(rows.filter(r=>["pending","overdue","reported"].includes(r.state)),r=>r.exp);const over=sum(rows.filter(r=>r.state==="overdue"),r=>r.exp);const settled=sum(rows.filter(r=>r.state==="settled"),r=>r.exp);
  return `<div class="kpis">${J.kpi("Aggregator sales (Petpooja)",money0(sp),n+" orders · avg "+(n?money0(sp/n):"–"))}${J.kpi("Settled payout",money0(settled),d.n+" orders with report")}${J.kpi("True cost of aggregator",d.gross?pf(pct(d.cost,d.gross)):"–",d.gross?money0(d.cost)+" on "+money0(d.gross)+" item value":"upload reports")}${J.kpi("Net realised",d.gross?pf(pct(d.payout,d.gross)):"–","of item value reaches the bank")}${J.kpi("Still to receive (expected)",money0(rec),over?money0(over)+" overdue":"estimate")}</div>`}
function dedTable(rows){const by={};for(const a of Object.keys(AGG))by[a]=deductions(rows.filter(r=>r.agg===a));const tot=deductions(rows);
  const cols=[["swiggy","Swiggy"],["zomato","Zomato"],["all","Together"]];const D=a=>a==="all"?tot:by[a];
  const row=(lab,note,hid,get,bold)=>`<tr class="${hid?"hid":""}"><td>${bold?"<b>"+lab+"</b>":lab}${note?`<div class="hint">${esc(note)}</div>`:""}</td>${cols.map(([a])=>{const d=D(a),v=get(d);return `<td class="num">${bold?"<b>":""}${v==null?"–":inr.format(v)}${bold?"</b>":""}</td><td class="num">${v==null||!d.gross?"":pf(pct(v,d.gross))}</td>`}).join("")}</tr>`;
  return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Item (shaded = less visible / hidden charge)</th>${cols.map(([,l])=>`<th class="num">${l} ₹</th><th class="num">% of item value</th>`).join("")}</tr></thead><tbody>
  ${row("Item value + packaging (what the customer ordered)","",0,d=>d.gross,1)}
  ${row("Restaurant-funded discounts / promos","Promo codes, BOGO, freebies – you fund 100%",1,d=>d.disc)}
  ${DED.map(([k,l,n,h])=>row(l,n,h,d=>d[k])).join("")}
  ${row("TOTAL COST of selling through aggregator","Discounts + fees + GST on fees + tax withheld + other",0,d=>d.cost,1)}
  ${row("GST retained by aggregator under 9(5)","Pass-through of the customer's GST – not a cost",0,d=>d.gst95)}
  ${row("Net payout to bank","",0,d=>d.payout,1)}</tbody></table></div>
  <p class="hint">Based on ${tot.n} settled orders (Swiggy ${by.swiggy.n}, Zomato ${by.zomato.n}). Upload each week's report to build the picture. Percentages are on item value + packaging.</p>`}
function periodTable(rows,g){const keys={};for(const r of rows){const k=pkey(r.date,g);const x=keys[k]??={k,n:0,sales:0,sn:0,gross:0,disc:0,cost:0,payout:0,pend:0,over:0,wsw:0,wzo:0};
    if(r.pp){x.n++;x.sales+=r.pp.net;if(r.agg==="swiggy")x.wsw+=r.pp.net;else x.wzo+=r.pp.net}
    if(r.st&&!r.st.can){x.sn++;x.gross+=r.st.item+r.st.pack;x.payout+=r.st.payout}
    if(r.state==="pending")x.pend+=r.exp;if(r.state==="overdue")x.over+=r.exp}
  for(const k of Object.keys(keys)){const d=deductions(rows.filter(r=>pkey(r.date,g)===k));keys[k].cost=d.cost;keys[k].disc=d.disc;keys[k].d=d}
  const list=Object.values(keys).sort((a,b)=>a.k.localeCompare(b.k));
  const body=list.map((x,i)=>{const prev=list[i-1];const gr=prev&&prev.sales?(x.sales-prev.sales)/prev.sales*100:null;return `<tr><td>${esc(plab(x.k,g))}</td><td class="num">${x.n}</td><td class="num">${inr0.format(x.sales)}</td><td class="num ${gr==null?"":gr>=0?"grow-up":"grow-dn"}">${gr==null?"–":(gr>=0?"▲ ":"▼ ")+Math.abs(gr).toFixed(0)+"%"}</td><td class="num">${x.sn}</td><td class="num">${x.gross?inr0.format(x.cost):"–"}</td><td class="num">${x.gross?pf(pct(x.cost,x.gross)):"–"}</td><td class="num">${x.sn?inr0.format(x.payout):"–"}</td><td class="num">${x.pend||x.over?inr0.format(x.pend+x.over):"–"}${x.over?`<div class="hint" style="color:var(--bad)">${inr0.format(x.over)} overdue</div>`:""}</td></tr>`}).reverse().join("");
  return {list,html:`<div class="tbl-wrap"><table class="t"><thead><tr><th>Period</th><th class="num">Orders</th><th class="num">Sales</th><th class="num">Growth</th><th class="num">With report</th><th class="num">Cost ₹</th><th class="num">Cost %</th><th class="num">Payout</th><th class="num">To receive</th></tr></thead><tbody>${body||'<tr><td colspan="9" class="muted">No data.</td></tr>'}</tbody></table></div>`}}
function receivables(all,rows){const P=payouts(rows);const by=a=>rows.filter(r=>r.agg===a);const cards=Object.keys(AGG).map(a=>{const R=by(a);const pend=R.filter(r=>r.state==="pending"),ov=R.filter(r=>r.state==="overdue"),rep=R.filter(r=>r.state==="reported");const L=all.L[a];
    const nxt=pend.length?pend.map(r=>r.cyc.pay).sort()[0]:"";const ledger=bankReceipts(a);
    return `<div class="panel pb" style="flex:1;min-width:250px"><h3 style="margin:0"><span class="chip plain" style="background:var(--c-${a==="swiggy"?"sw":"zo"});color:#fff">${AGG[a]}</span></h3>
    <dl class="kv"><dt>Awaiting payout</dt><dd>${pend.length} orders · <b>${money0(sum(pend,r=>r.exp))}</b>${nxt?`<div class="hint">next payout about ${fmtDate(nxt)}</div>`:""}</dd>
    <dt>Overdue (past expected date)</dt><dd>${ov.length} orders · <b style="color:${ov.length?"var(--bad)":"inherit"}">${money0(sum(ov,r=>r.exp))}</b></dd>
    <dt>Reported, not yet settled</dt><dd>${rep.length} orders · ${money0(sum(rep,r=>r.exp))}</dd>
    <dt>Paid out (from reports)</dt><dd>${money0(sum(R.filter(r=>r.state==="settled"),r=>r.exp))}</dd>
    <dt>Ledger balance</dt><dd>${ledger.acc?J.bal(J.balanceOf(ledger.acc.id)):"–"} <span class="hint">(Dr = still to receive)</span></dd>
    <dt>Estimate basis</dt><dd class="hint">${L.learned?"learned from "+L.n+" settled orders":"typical rate from sample reports"} – ${(L.r*100).toFixed(1)}% of bill reaches the bank</dd></dl></div>`}).join("");
  const prow=P.list.map(x=>`<tr><td>${x.from?fmtDate(x.from)+" – "+fmtDate(x.to):"–"}</td><td>${esc(AGG[x.agg])}</td><td class="mono">${esc(x.utr||"–")}</td><td>${x.pay?fmtDate(x.pay):"–"}</td><td class="num">${x.n}</td><td class="num">${inr.format(x.payout)}</td><td>${x.bank?`<button class="linkbtn vno" data-a="editv" data-x="${x.bank.vid}">${esc(x.bank.no)}</button> ${x.bank.amt===x.payout?'<span class="chip ok">matched</span>':'<span class="chip warn">diff '+inr.format(r2(x.bank.amt-x.payout))+'</span>'}`:'<span class="chip warn">not in bank / ledger</span>'}</td></tr>`).join("");
  const ex=P.extra.map(b=>`<tr><td>${fmtDate(b.date)}</td><td>${esc(AGG[b.agg])}</td><td><button class="linkbtn vno" data-a="editv" data-x="${b.vid}">${esc(b.no)}</button></td><td class="num">${inr.format(b.amt)}</td></tr>`).join("");
  return `<div class="row" style="gap:12px;flex-wrap:wrap;align-items:stretch">${cards}</div>
  <h3>Payouts: aggregator report vs bank</h3><div class="tbl-wrap"><table class="t"><thead><tr><th>Payout period</th><th>Aggregator</th><th>UTR</th><th>Paid on</th><th class="num">Orders</th><th class="num">Report payout</th><th>Bank / ledger entry</th></tr></thead><tbody>${prow||'<tr><td colspan="7" class="muted">Upload settlement reports to see payouts.</td></tr>'}</tbody></table></div>
  ${ex?`<h3>Bank receipts with no report yet</h3><div class="tbl-wrap"><table class="t"><thead><tr><th>Date</th><th>Aggregator</th><th>Entry</th><th class="num">Amount</th></tr></thead><tbody>${ex}</tbody></table></div>`:""}`}
function orderTable(rows){const L=rows.filter(r=>r.pp||r.st).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id))).slice(0,300);
  const CH={settled:["ok","Settled"],reported:["warn","Reported"],pending:["plain","Awaiting payout"],overdue:["bad","Overdue"],cancelled:["plain","Cancelled"]};
  return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Date</th><th>Aggregator</th><th>Order id</th><th>Petpooja bill</th><th class="num">Petpooja ₹</th><th class="num">Report bill ₹</th><th class="num">Fees &amp; taxes ₹</th><th class="num">Payout / expected ₹</th><th>Status</th></tr></thead><tbody>${L.map(r=>{const s=r.st;const rb=s?r2(s.item+s.pack-s.disc):null;const diff=s&&r.pp&&Math.abs(rb-r.pp.net)>1;const [c,l]=CH[r.state]||["plain",r.state];
    return `<tr><td>${fmtDate(r.date)}</td><td>${esc(AGG[r.agg])}</td><td class="mono">${esc(r.id||"–")}</td><td>${r.pp?esc(r.pp.no):'<span class="hint">not in Petpooja</span>'}</td><td class="num">${r.pp?inr.format(r.pp.net):"–"}</td><td class="num">${s?inr.format(rb):"–"}${diff?'<div class="hint" style="color:var(--bad)">differs</div>':""}</td><td class="num">${s&&!s.can?inr.format(r2(s.paid-s.payout)):"–"}</td><td class="num">${inr.format(r.exp||0)}${r.est?'<div class="hint">estimate</div>':""}</td><td><span class="chip ${c}">${l}</span></td></tr>`}).join("")||'<tr><td colspan="9" class="muted">No orders.</td></tr>'}</tbody></table></div>${rows.length>300?'<p class="hint">Latest 300 shown.</p>':""}`}
// ---------- retention ----------
const nkey=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
function retention(rows){const ord=rows.filter(r=>(r.pp||r.st)&&!(r.st&&r.st.can)).map(r=>{const key=r.st?.cust?"z:"+r.st.cust:r.pp?.name?"n:"+nkey(r.pp.name):"";return {key,date:r.date,agg:r.agg,v:r.pp?.net||r.st?.item||0}}).filter(o=>o.key).sort((a,b)=>a.date.localeCompare(b.date));
  const first=new Map(),cnt=new Map(),last=new Map(),gaps=[];for(const o of ord){if(!first.has(o.key))first.set(o.key,o.date);else gaps.push((D0(o.date)-D0(last.get(o.key)))/864e5);last.set(o.key,o.date);cnt.set(o.key,(cnt.get(o.key)||0)+1)}
  const months={};for(const o of ord){const m=o.date.slice(0,7);const x=months[m]??={neu:0,ret:0,cust:new Set()};if(first.get(o.key)===o.date&&!x.cust.has(o.key)&&!months._seen?.has(o.key)){}
    x.cust.add(o.key)}
  const seen=new Set();for(const m of Object.keys(months).sort()){const x=months[m];for(const k of x.cust){if(seen.has(k))x.ret++;else x.neu++}for(const k of x.cust)seen.add(k)}
  const customers=cnt.size,repeaters=[...cnt.values()].filter(n=>n>=2).length;
  const cohorts={};for(const [k,f] of first){const cm=f.slice(0,7);const c=cohorts[cm]??={n:0,back:{}};c.n++}
  const byCust={};for(const o of ord)(byCust[o.key]??=new Set()).add(o.date.slice(0,7));
  for(const [k,f] of first){const cm=f.slice(0,7);for(const m of byCust[k])if(m>cm)cohorts[cm].back[m]=(cohorts[cm].back[m]||0)+1}
  const top=[...cnt.entries()].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,n])=>({k,n,v:sum(ord.filter(o=>o.key===k),o=>o.v)}));
  return {orders:ord.length,customers,repeaters,rate:customers?repeaters/customers*100:0,avgGap:gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:0,months,cohorts,top,named:ord.length}}
function retentionHtml(rows,U){const parts=U.agg==="all"?[["all","Together",rows],["swiggy","Swiggy",rows.filter(r=>r.agg==="swiggy")],["zomato","Zomato",rows.filter(r=>r.agg==="zomato")]]:[[U.agg,AGG[U.agg],rows]];
  const out=parts.map(([a,l,rs])=>{const R=retention(rs);const ms=Object.keys(R.months).sort();return `<section class="panel pb"><h3 style="margin-top:0">${l}</h3>
    <div class="kpis">${J.kpi("Customers",R.customers,R.orders+" orders")}${J.kpi("Repeat customers",R.repeaters,pf(R.rate)+" of customers")}${J.kpi("Avg days between orders",R.avgGap?Math.round(R.avgGap):"–","repeat customers")}</div>
    ${ms.length?legend([{c:"var(--c-a)",n:"New customers"},{c:"var(--c-b)",n:"Returning customers"}])+barChart(ms.map(m=>({label:J.monthLabel?J.monthLabel(m):m,v:{neu:R.months[m].neu,ret:R.months[m].ret}})),[{k:"neu",c:"var(--c-a)",n:"New"},{k:"ret",c:"var(--c-b)",n:"Returning"}],{money:false,h:160}):'<p class="hint">No customer data yet.</p>'}
    ${R.top.length?`<div class="tbl-wrap"><table class="t"><thead><tr><th>Most loyal customers</th><th class="num">Orders</th><th class="num">Spend</th></tr></thead><tbody>${R.top.map(t=>`<tr><td>${esc(t.k.startsWith("z:")?"Zomato customer …"+t.k.slice(-6):t.k.slice(2).replace(/\b[a-z]/g,c=>c.toUpperCase()))}</td><td class="num">${t.n}</td><td class="num">${inr0.format(t.v)}</td></tr>`).join("")}</tbody></table></div>`:""}</section>`}).join("");
  return out+`<p class="hint">How customers are recognised: Zomato reports give an anonymised customer id; Swiggy shares no customer id or phone, so Swiggy (and Petpooja-only) orders are matched by customer name – treat Swiggy retention as an approximation. Retention only counts orders in the filtered period.</p>`}
// ---------- the page ----------
function view(){const U=ui();const all=unify();let rows=filtered(U,all);
  const segSel=(path,cur,opts)=>`<div class="seg" role="group">${opts.map(([k,l])=>`<button data-set="${path}=${k}" aria-pressed="${cur===k}">${l}</button>`).join("")}</div>`;
  const head=`<div class="filters" style="gap:10px;flex-wrap:wrap"><button class="btn primary w" data-a="aggUpload">Upload settlement report(s)</button>
   ${segSel("aggr.agg",U.agg,[["all","Together"],["swiggy","Swiggy"],["zomato","Zomato"]])}${segSel("aggr.g",U.g,[["day","Daily"],["week","Weekly"],["month","Monthly"],["year","Yearly"]])}
   <span class="row" style="gap:6px;align-items:center"><span class="hint">From</span><input type="date" data-ui="aggr.from" value="${esc(U.from)}"><span class="hint">to</span><input type="date" data-ui="aggr.to" value="${esc(U.to)}">${U.from||U.to?`<button class="btn small" data-a="aggClear">All dates</button>`:""}</span></div>
   <div class="seg" role="tablist" style="margin:6px 0">${[["sum","Summary & charts"],["ded","Deductions"],["per","By period"],["rec","Receivables & bank"],["ord","Orders"],["ret","Retention"]].map(([k,l])=>`<button data-set="aggr.tab=${k}" aria-pressed="${U.tab===k}">${l}</button>`).join("")}</div>`;
  const nf=allRecs().length;
  const note=!nf?`<div class="panel pb"><b>No settlement reports uploaded yet.</b> Download the weekly payout report (Excel) from the Swiggy and Zomato partner portals and upload them here. Until then, receivables below are estimates from Petpooja bills.</div>`:"";
  let body="";const T=U.tab;
  if(T==="sum"){const per=periodTable(rows,U.g);const data=per.list.slice(-30).map(x=>({label:plab(x.k,U.g),v:{sw:x.wsw,zo:x.wzo,pay:x.payout}}));
    const dsw=deductions(rows.filter(r=>r.agg==="swiggy")),dzo=deductions(rows.filter(r=>r.agg==="zomato"));
    const comp=(d,lab,c)=>d.gross?`<div style="margin:6px 0"><b>${lab}</b> <span class="hint">cost ${pf(pct(d.cost,d.gross))} of item value · ${d.n} order${d.n===1?"":"s"}</span><div style="display:flex;height:16px;border-radius:3px;overflow:hidden;gap:2px;margin-top:4px">${[["disc","Discounts","#8a8a8a"],["comm","Commission","var(--c-sw)"],["payf","Payment fee","var(--c-zo)"],["plat","Platform fees","var(--c-b)"],["gstf","GST on fees","var(--c-a)"],["tds","Tax withheld","#c9a227"]].map(([k,n,col])=>d[k]>0?`<span title="${n}: ₹${inr0.format(d[k])} (${pf(pct(d[k],d.gross))})" style="flex:${d[k]};background:${col}"></span>`:"").join("")}</div></div>`:`<p class="hint">${lab}: no settled orders yet.</p>`;
    body=kpis(rows,all)+`<section class="panel pb"><h3 style="margin-top:0">Sales &amp; payout · ${["day","week","month","year"].map((k,i)=>k===U.g?["daily","weekly","monthly","yearly"][i]:"").join("")}</h3>${legend([{c:"var(--c-sw)",n:"Swiggy sales"},{c:"var(--c-zo)",n:"Zomato sales"},{c:"var(--ink)",n:"Payout received (report)"}])}${barChart(data,[{k:"sw",c:"var(--c-sw)",n:"Swiggy sales"},{k:"zo",c:"var(--c-zo)",n:"Zomato sales"}],{line:{k:"pay",c:"var(--ink)",n:"Payout"}})}</section>
    <section class="panel pb"><h3 style="margin-top:0">Where each ₹100 of item value goes</h3>${legend([{c:"#8a8a8a",n:"Discounts"},{c:"var(--c-sw)",n:"Commission"},{c:"var(--c-zo)",n:"Payment fee"},{c:"var(--c-b)",n:"Platform fees"},{c:"var(--c-a)",n:"GST on fees"},{c:"#c9a227",n:"Tax withheld"}])}${comp(dsw,"Swiggy")}${comp(dzo,"Zomato")}</section>
    <section class="panel pb"><h3 style="margin-top:0">Growth</h3>${per.html}</section>`}
  else if(T==="ded")body=`<section class="panel pb">${dedTable(rows)}</section>`;
  else if(T==="per")body=`<section class="panel pb">${periodTable(rows,U.g).html}</section>`;
  else if(T==="rec")body=receivables(all,rows);
  else if(T==="ord")body=`<section class="panel pb">${orderTable(rows)}</section>`;
  else body=retentionHtml(rows,U);
  const files=fileLog();
  const log=files.length?`<details class="panel pb"><summary>Uploaded reports (${files.length})</summary><div class="tbl-wrap"><table class="t"><thead><tr><th>Uploaded</th><th>File</th><th>Aggregator</th><th>Period</th><th>UTR</th><th class="num">Orders</th><th class="num">Payout</th></tr></thead><tbody>${files.slice(0,60).map(f=>`<tr><td>${new Date(f.at).toLocaleDateString("en-IN")}</td><td>${esc(f.name)}</td><td>${esc(AGG[f.agg]||f.agg)}</td><td>${f.from?fmtDate(f.from)+" – "+fmtDate(f.to):"–"}</td><td class="mono">${esc(f.utr||"")}</td><td class="num">${f.orders} <span class="hint">(${f.fresh} new)</span></td><td class="num">${inr.format(f.payout)}</td></tr>`).join("")}</tbody></table></div></details>`:"";
  return CSS+`<div class="agg-root">${head}${note}${body}${log}</div>`}
J.aggrView=view;J._aggParse={parseSwiggy,parseZomato,finish};J.aggSave=saveRecs;
// compact strip for the daily sales tab: what is expected from each aggregator
J.aggStrip=()=>{try{const all=unify();if(!all.rows.length)return "";const parts=Object.keys(AGG).map(a=>{const R=all.rows.filter(r=>r.agg===a);const p=R.filter(r=>r.state==="pending"||r.state==="reported"),o=R.filter(r=>r.state==="overdue");if(!R.length)return "";return `<span><b>${AGG[a]}</b> to receive ${money0(sum(p.concat(o),r=>r.exp))} (${p.length+o.length} orders)${o.length?` · <span style="color:var(--bad)">${money0(sum(o,r=>r.exp))} overdue</span>`:""}</span>`}).filter(Boolean);
  return parts.length?`<div class="strip hint" style="margin:6px 0">${parts.join(" · ")} <button class="linkbtn" data-go="sales" data-tab="aggr">Open aggregator analysis →</button></div>`:""}catch(e){return ""}};
{const m=J.MODS.find(x=>x.id==="sales");if(m){const i=m.tabs.findIndex(t=>t[0]==="agg");m.tabs.splice(i<0?m.tabs.length:i+1,0,["aggr","Aggregator analysis",view])}}
})();
