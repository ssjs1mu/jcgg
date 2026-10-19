/* Home page: today's Panchang, the day by the stars (Moon transit for each rashi), and "Needs attention" —
   market news and results alerts (free RSS feeds via rss2json, cached 30 minutes), plus results due for stocks on
   the Investments watch list. Operational to-dos keep their own compact list. */
(()=>{
const J=window.J,{S,esc,fmtDate,today,addDays,daysBetween}=J;
const tm=d=>d?d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"}):"—";
const tmD=d=>{if(!d)return "—";const day=d.toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});return tm(d)+(day!==today()?" ("+d.toLocaleDateString("en-IN",{day:"numeric",month:"short",timeZone:"Asia/Kolkata"})+")":"")};
const rng=a=>tm(a[0])+" – "+tm(a[1]);
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
// ---------- Panchang + stars ----------
J.homeDay=()=>{if(!window.Panchang)return "";const set=J.settings();let p;try{p=window.Panchang(new Date(),{lat:+set.lat||undefined,lon:+set.lon||undefined})}catch(e){console.warn(e);return ""}
  const my=get("jcgg-rashi");const R=window.Panchang.RASHI;const g=r=>window.Panchang.gochar(p.moon.sign,r);
  const row=(k,v,sub)=>`<tr><th scope="row">${k}</th><td>${v}${sub?`<div class="hint">${sub}</div>`:""}</td></tr>`;
  const tone={good:["ok","Favourable"],mixed:["plain","Mixed"],caution:["warn","Careful"]};const mine=my!=null&&my!==""?g(+my):null;
  return `<div class="grid2 home-day">
  <section class="panel" aria-labelledby="pj-h"><h2 id="pj-h">Panchang · ${esc(p.vara[0])}, ${fmtDate(p.date)}</h2><div class="pb">
   ${p.vrat.length?`<div class="row" style="gap:6px;margin-bottom:8px">${p.vrat.map(v=>`<span class="chip warn">${esc(v)}</span>`).join("")}</div>`:""}
   <table class="pj"><tbody>
    ${row("Tithi",`${esc(p.tithi.paksha)} ${esc(p.tithi.name)}`,"till "+tmD(p.tithi.end))}
    ${row("Nakshatra",`${esc(p.nak.name)} (pada ${p.nak.pada})`,"till "+tmD(p.nak.end))}
    ${row("Yoga",esc(p.yoga.name),"till "+tmD(p.yoga.end))}
    ${row("Karana",esc(p.karana.name),"till "+tmD(p.karana.end))}
    ${row("Sunrise · Sunset",tm(p.sunrise)+" · "+tm(p.sunset))}
    ${row("Moon in",esc(p.moon.name),"till "+tmD(p.moon.end))}
    ${row("Rahu kaal",rng(p.rahu),"Yamaganda "+rng(p.yama)+" · Gulika "+rng(p.gulika))}
    ${row("Abhijit muhurat",rng(p.abhijit))}
    ${row("Month",`${esc(p.month.amanta)} (Amanta) · ${esc(p.month.purnimanta)} (Purnimanta)`,"Bangla: "+esc(p.month.bangla)+" · Vikram Samvat "+p.samvat.vikram+" · Shaka "+p.samvat.shaka)}
   </tbody></table><p class="hint" style="margin:6px 0 0">Computed for ${esc(set.place||"Kolkata")} (sunrise based). Times are approximate to a few minutes.</p></div></section>
  <section class="panel" aria-labelledby="st-h"><h2 id="st-h">Your day by the stars</h2><div class="pb">
   <p style="margin:0 0 8px">Moon transits <b>${esc(p.moon.name)}</b> today · day of <b>${esc(p.vara[1])}</b> · lucky colour <b>${esc(p.vara[2])}</b>.</p>
   <label class="f" style="max-width:260px">Your moon sign (rashi)<select data-ach="homeRashi" aria-label="Your moon sign"><option value="">Choose…</option>${R.map((r,i)=>`<option value="${i}" ${String(i)===my?"selected":""}>${esc(r)}</option>`).join("")}</select></label>
   ${mine?`<div class="star-me"><span class="chip ${tone[mine.tone][0]}">${tone[mine.tone][1]}</span> <b>${esc(R[+my])}</b> — Moon in your ${mine.house}${["","st","nd","rd"][mine.house]||"th"} house<p style="margin:6px 0 0">${esc(mine.text)}</p></div>`:""}
   <details ${mine?"":"open"} style="margin-top:8px"><summary>All 12 rashis</summary><table class="stars"><tbody>${R.map((r,i)=>{const x=g(i);return `<tr><th scope="row">${esc(r)}</th><td><span class="chip ${tone[x.tone][0]}">${tone[x.tone][1]}</span></td><td class="hint">${esc(x.text)}</td></tr>`}).join("")}</tbody></table></details>
   <p class="hint" style="margin:6px 0 0">Traditional Chandra gochar reading (the Moon's house from each rashi). For reflection, not advice.</p></div></section></div>`};
J.act("homeRashi",el=>{put("jcgg-rashi",el.value);J.render()});
// ---------- news & results ----------
const FEEDS=[["ET Markets","https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"],["ET Stocks","https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms"],["Mint Markets","https://www.livemint.com/rss/markets"],["Business Standard","https://www.business-standard.com/rss/markets-106.rss"]];
const RES=/\bresults?\b|\bQ[1-4]\b|earnings|net profit|profit (jumps|rises|falls|drops|declines|up|down)|revenue|board meet|dividend|quarterly/i;
let news=null,loading=false,err="";
try{const c=JSON.parse(get("jcgg-news")||"null");if(c&&Date.now()-c.at<30*6e4)news=c.items}catch(e){}
async function loadNews(force){if(loading||(news&&!force))return;loading=true;err="";const out=[];
  await Promise.all(FEEDS.map(async([src,u])=>{try{const r=await fetch("https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(u));const j=await r.json();if(j.status!=="ok")return;
    for(const it of (j.items||[]).slice(0,15))out.push({t:String(it.title||"").replace(/<[^>]+>/g,"").trim(),l:it.link,d:it.pubDate?Date.parse(it.pubDate.replace(" ","T")+"Z")||0:0,s:src})}catch(e){}}));
  const seen=new Set();news=out.filter(x=>x.t&&!seen.has(x.t.toLowerCase())&&seen.add(x.t.toLowerCase())).sort((a,b)=>b.d-a.d);if(!news.length)err="News feeds could not be reached just now.";
  put("jcgg-news",JSON.stringify({at:Date.now(),items:news}));loading=false;if(S.route.mod==="home")J.render()}
const ago=d=>{if(!d)return "";const m=Math.round((Date.now()-d)/6e4);return m<60?m+" min ago":m<1440?Math.round(m/60)+" h ago":Math.round(m/1440)+" d ago"};
const myNames=()=>{const n=new Set();for(const w of J.all("watch")){if(w.id)n.add(String(w.id).toLowerCase());if(w.name)n.add(String(w.name).toLowerCase())}for(const k of Object.keys(J.D?.hold?.H||{}))n.add(k.toLowerCase());return [...n].filter(x=>x.length>=3)};
J.homeNews=()=>{if(!news&&!loading)setTimeout(()=>loadNews(),50);const t=today();const mine=myNames();const hit=x=>mine.find(n=>new RegExp("\\b"+n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i").test(x.t));
  const due=J.all("watch").filter(w=>w.resDate).map(w=>({w,d:daysBetween(t,w.resDate)})).filter(x=>x.d>=-1&&x.d<=21).sort((a,b)=>a.d-b.d);
  const items=news||[];const res=items.filter(x=>RES.test(x.t));const mkt=items.filter(x=>!RES.test(x.t));
  const li=x=>{const h=hit(x);return `<li><a href="${esc(x.l)}" target="_blank" rel="noopener">${esc(x.t)}</a> <span class="hint">${esc(x.s)} · ${ago(x.d)}</span>${h?` <span class="chip ok">your stock: ${esc(h.toUpperCase())}</span>`:""}</li>`};
  return `<section class="panel" aria-labelledby="na-h"><div class="row" style="justify-content:space-between;padding:12px 16px 0;flex-wrap:wrap;gap:6px"><h2 id="na-h" class="ph" style="padding:0">Needs attention · news &amp; results</h2><button class="btn small" data-a="homeNewsRefresh" ${loading?"disabled":""}>${loading?"Loading…":"Refresh"}</button></div>
  <div class="grid2 pb news">
   <div><h3 class="ph" style="padding:0 0 6px">Results</h3>
    ${due.length?`<ul class="nl">${due.map(x=>`<li><b>${esc(x.w.id)}</b>${x.w.name?" "+esc(x.w.name):""} — results ${x.d<0?"were yesterday":x.d===0?"<b>today</b>":"in "+x.d+" day"+(x.d>1?"s":"")} (${fmtDate(x.w.resDate)}) <button class="linkbtn" data-go="invest" data-tab="results">open</button></li>`).join("")}</ul>`:`<p class="hint" style="margin:0 0 6px">No results due for your watch list in the next 3 weeks. Add result dates in Investments → Results &amp; X-ray.</p>`}
    ${res.length?`<ul class="nl">${res.slice(0,8).map(li).join("")}</ul>`:loading?`<p class="hint">Loading…</p>`:""}</div>
   <div><h3 class="ph" style="padding:0 0 6px">Market news</h3>${mkt.length?`<ul class="nl">${mkt.slice(0,10).map(li).join("")}</ul>`:`<p class="hint">${loading?"Loading…":esc(err||"No news yet.")}</p>`}</div></div>
  <p class="hint" style="margin:0;padding:0 16px 12px">Free feeds: Economic Times, Mint, Business Standard (via rss2json) · refreshed every 30 minutes.</p></section>`};
J.act("homeNewsRefresh",()=>{loadNews(true);J.render()});
})();
