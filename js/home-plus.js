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
function dayPanels(){if(!window.Panchang)return "";const set=J.settings();let p;try{p=window.Panchang(new Date(),{lat:+set.lat||undefined,lon:+set.lon||undefined})}catch(e){console.warn(e);return ""}
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
function astro(p){const R=window.Panchang.RASHI,my=get("jcgg-rashi");const set=J.settings();const at=(d,h)=>{const x=new Date(d);x.setDate(x.getDate()+h);x.setHours(12,0,0,0);try{return window.Panchang(x,{lat:+set.lat||undefined,lon:+set.lon||undefined})}catch(e){return null}};
  const tone={good:["ok","Favourable"],mixed:["plain","Mixed"],caution:["warn","Careful"]};
  const pick=`<label class="f">Choose your moon sign (rashi)<select data-ach="homeRashi" aria-label="Your moon sign"><option value="">Choose…</option>${R.map((r,i)=>`<option value="${i}" ${String(i)===my?"selected":""}>${esc(r)}</option>`).join("")}</select></label>`;
  if(my==null||my==="")return `<div class="pb">${pick}<p class="hint" style="margin:8px 0 0">Pick your rashi to see yesterday, today and tomorrow.</p></div>`;
  const r=+my;const card=(lbl,q,extra)=>{if(!q)return "";const g=window.Panchang.gochar(q.moon.sign,r);return `<div class="astro-c"><div class="row" style="justify-content:space-between;gap:6px"><b>${lbl}</b><span class="chip ${tone[g.tone][0]}">${tone[g.tone][1]}</span></div><div class="hint">${esc(q.vara[0])}, ${fmtDate(q.date)} · Moon in ${esc(q.moon.name)} · your ${g.house}${["","st","nd","rd"][g.house]||"th"} house</div><p style="margin:4px 0 0">${esc(g.text)}</p>${extra||""}</div>`};
  const nxt=at(new Date(),1);let shift="";if(p.moon.end&&nxt&&p.moon.end.toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})===today()){const g2=window.Panchang.gochar(nxt.moon.sign,r);shift=`<p class="hint" style="margin:4px 0 0">From ${tm(p.moon.end)} the Moon moves to ${esc(nxt.moon.name)} — ${esc(g2.text)}</p>`}
  return `<div class="pb">${pick}<div class="astro">${card("Past · yesterday",at(new Date(),-1))}${card("Present · today",p,shift)}${card("Future · tomorrow",nxt)}</div><p class="hint" style="margin:6px 0 0">Chandra gochar (the Moon's house from your rashi). For reflection, not advice.</p></div>`}
// right-side tabs: Panchang | Astrology — content shows only when its tab is selected (tap again to close)
J.homeRail=()=>{if(!window.Panchang)return "";let p;const set=J.settings();try{p=window.Panchang(new Date(),{lat:+set.lat||undefined,lon:+set.lon||undefined})}catch(e){return ""}
  const sel=get("jcgg-hd-tab")||"";const html=dayPanels();const box=document.createElement("div");box.innerHTML=html;const secs=box.querySelectorAll("section.panel");
  const body=i=>{if(i===0)return secs[0]?secs[0].querySelector(".pb").outerHTML:"";return astro(p)};const my=get("jcgg-rashi");const mine=my!=null&&my!==""?window.Panchang.gochar(p.moon.sign,+my):null;
  const tabs=[["pj","Panchang",`${esc(p.tithi.paksha)} ${esc(p.tithi.name)} · ${esc(p.nak.name)}`],["st","Astrology",mine?`${esc(window.Panchang.RASHI[+my])}: ${({good:"favourable",mixed:"mixed",caution:"careful"})[mine.tone]} day`:"Moon in "+esc(p.moon.name)]];
  return `<aside class="home-rail" aria-label="Panchang and astrology"><div class="rail-tabs" role="tablist">${tabs.map(([id,l,s])=>`<button role="tab" aria-selected="${sel===id}" class="rail-tab ${sel===id?"on":""}" data-a="homeRailTab" data-x="${id}"><b>${l}</b><span>${s}</span></button>`).join("")}</div>
   ${sel?`<section class="panel rail-body" role="tabpanel"><h2>${sel==="pj"?"Panchang · "+esc(p.vara[0])+", "+fmtDate(p.date):"Your day by the stars"}</h2>${body(sel==="pj"?0:1)}</section>`:`<p class="hint" style="margin:0">Tap a tab to open it.</p>`}</aside>`};
J.act("homeRailTab",el=>{const c=get("jcgg-hd-tab")||"";put("jcgg-hd-tab",c===el.dataset.x?"":el.dataset.x);J.render()});
J.homeDay=()=>"";
// ---------- weather header (Open-Meteo, free, no key; cached 30 min) ----------
const WMO=c=>c===0?["☀️","Clear","clear"]:c<=2?["🌤️","Partly cloudy","part"]:c===3?["☁️","Overcast","cloud"]:c<=48?["🌫️","Haze / fog","fog"]:c<=57?["🌦️","Drizzle","rain"]:c<=67?["🌧️","Rain","rain"]:c<=77?["🌨️","Snow","cloud"]:c<=82?["🌧️","Showers","rain"]:["⛈️","Thunderstorm","storm"];
let wx=null,wxLoading=false;try{const c=JSON.parse(get("jcgg-wx")||"null");if(c&&Date.now()-c.at<30*6e4)wx=c}catch(e){}
async function loadWx(){if(wxLoading)return;wxLoading=true;const s=J.settings();const lat=+s.lat||22.5726,lon=+s.lon||88.3639;
  try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FKolkata&forecast_days=4`);const j=await r.json();if(j.current){wx={at:Date.now(),j};put("jcgg-wx",JSON.stringify(wx))}}catch(e){}
  wxLoading=false;if(S.route.mod==="home")J.render()}
J.homeHead=(greet,sub,btns)=>{if(!wx||Date.now()-wx.at>30*6e4)setTimeout(loadWx,30);const j=wx?.j;const now=new Date();let rise,set_;
  if(j?.daily){rise=new Date(j.daily.sunrise[0]+":00+05:30");set_=new Date(j.daily.sunset[0]+":00+05:30")}else{try{const p=window.Panchang(now,{});rise=p.sunrise;set_=p.sunset}catch(e){rise=new Date(now.setHours(6,0,0,0));set_=new Date(new Date().setHours(17,30,0,0))}}
  const n=Date.now(),day=n>=rise&&n<=set_;const f=Math.max(0,Math.min(1,(n-rise)/(set_-rise)));
  const cur=j?.current;const w=cur?WMO(cur.weather_code):null;const kind=w?w[2]:"clear";
  const phase=!day?"night":f<0.12?"dawn":f>0.88?"dusk":"day";
  // sun position on the arc
  const X=v=>40+v*920,Y=v=>150-Math.sin(Math.PI*v)*120;const sx=X(f),sy=Y(f);
  const hrs=j?.hourly?(()=>{const out=[];const h0=j.hourly.time.findIndex(x=>new Date(x+":00+05:30")>new Date());for(let i=h0;i>=0&&i<j.hourly.time.length&&out.length<6;i+=2)out.push({t:j.hourly.time[i].slice(11,13),c:j.hourly.temperature_2m[i],w:WMO(j.hourly.weather_code[i]),p:j.hourly.precipitation_probability[i]});return out})():[];
  const days=j?.daily?j.daily.time.slice(1,4).map((d,i)=>({d:new Date(d+"T12:00:00+05:30").toLocaleDateString("en-IN",{weekday:"short"}),hi:j.daily.temperature_2m_max[i+1],lo:j.daily.temperature_2m_min[i+1],w:WMO(j.daily.weather_code[i+1]),p:j.daily.precipitation_probability_max[i+1]})):[];
  const rain=kind==="rain"||kind==="storm";
  const nx=[...hrs.slice(0,3).map(h=>`${+h.t%12||12}${+h.t<12?"am":"pm"} ${(+h.t<6||+h.t>=18)&&h.w[2]==="clear"?"🌙":h.w[0]} ${Math.round(h.c)}°${h.p>=40?" 💧"+h.p+"%":""}`),...days.slice(0,2).map(d=>`${d.d} ${d.w[0]} ${Math.round(d.hi)}°/${Math.round(d.lo)}°${d.p>=40?" 💧"+d.p+"%":""}`)];
  return `<div class="head wx wx-${phase} wx-${kind}">
   <svg class="wx-sky" viewBox="0 0 1000 170" preserveAspectRatio="none" aria-hidden="true">
    <path d="M40 150 Q500 -90 960 150" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="4 6" vector-effect="non-scaling-stroke"/>
    ${day?`<path d="M40 150 Q500 -90 960 150" fill="none" stroke="rgba(255,225,130,.85)" stroke-width="3" pathLength="1" stroke-dasharray="${f} 1" vector-effect="non-scaling-stroke"/>`:""}
   </svg>
   <span class="wx-orb ${day?"sun":"moon"}" style="left:${((day?sx:(()=>{const nr=n<rise?rise.getTime():rise.getTime()+864e5,ns=n<rise?set_.getTime()-864e5:set_.getTime();return X(Math.max(0,Math.min(1,(n-ns)/(nr-ns))))})())/10).toFixed(1)}%;top:${((day?sy:Y(.5))/170*100).toFixed(0)}%" aria-hidden="true"></span>
   ${rain?`<div class="wx-rain" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="left:${(i*37)%100}%;animation-delay:${(i%7)*0.17}s"></i>`).join("")}</div>`:""}
   <div class="wx-fg"><div><h1>${greet}</h1><p>${sub}</p>
     <p class="wx-line">${cur?`<b>${!day&&w[2]==="clear"?"🌙":!day&&w[2]==="part"?"☁️":w[0]} ${Math.round(cur.temperature_2m)}° ${w[1]}</b> · feels ${Math.round(cur.apparent_temperature)}° · ${cur.relative_humidity_2m}% humidity · 🌅 ${tm(rise)} – 🌇 ${tm(set_)} <span class="wx-nx">· ${nx.join(" · ")}</span>`:(wxLoading?"Loading weather… · ":"")+`🌅 ${tm(rise)} – 🌇 ${tm(set_)}`}</p></div>
    <div class="row">${btns}</div></div></div>`};
// ---------- news & results ----------
const FEEDS=[["ET Markets","https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"],["ET Stocks","https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms"],["Mint Markets","https://www.livemint.com/rss/markets"],["Business Standard","https://www.business-standard.com/rss/markets-106.rss"]];
const RES=/\bresults?\b|\bQ[1-4]\b|earnings|net profit|profit (jumps|rises|falls|drops|declines|up|down)|revenue|board meet|dividend|quarterly/i;
let news=null,loading=false,err="";const dec=s=>{let x=s;for(let i=0;i<2;i++){const ta=document.createElement("textarea");ta.innerHTML=x;x=ta.value}return x};
try{const c=JSON.parse(get("jcgg-news")||"null");if(c&&Date.now()-c.at<30*6e4)news=c.items.map(x=>({...x,t:dec(x.t)}))}catch(e){}
async function loadNews(force){if(loading||(news&&!force))return;loading=true;err="";const out=[];
  await Promise.all(FEEDS.map(async([src,u])=>{try{const r=await fetch("https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(u));const j=await r.json();if(j.status!=="ok")return;
    for(const it of (j.items||[]).slice(0,15))out.push({t:dec(String(it.title||"").replace(/<[^>]+>/g,"")).trim(),l:it.link,d:it.pubDate?Date.parse(it.pubDate.replace(" ","T")+"Z")||0:0,s:src})}catch(e){}}));
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
