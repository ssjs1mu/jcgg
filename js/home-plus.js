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
  const body=i=>{if(i===0)return secs[0]?secs[0].querySelector(".pb").outerHTML:"";return J.astroPanel?J.astroPanel():astro(p)};const my=get("jcgg-rashi");const mine=my!=null&&my!==""?window.Panchang.gochar(p.moon.sign,+my):null;
  // one merged Vedic panel: पञ्चाङ्ग · ज्योतिष — today's panchang, the day by the stars, and the Janma Kundali
  const on=sel==="pj"||sel==="st"||sel==="ved";const ttl=J.vedicRailTitle?J.vedicRailTitle():"Panchang · Jyotish";
  return `<aside class="home-rail" aria-label="${esc(ttl)}"><div class="rail-tabs" role="tablist"><button role="tab" aria-selected="${on}" class="rail-tab vedic ${on?"on":""}" data-a="homeRailTab" data-x="ved"><b>🕉 ${esc(ttl)}</b><span>${esc(p.vara[0])} · ${esc(p.tithi.paksha)} ${esc(p.tithi.name)} · ${esc(p.nak.name)}${mine?" · "+esc(window.Panchang.RASHI[+my].split(" ")[0])+": "+({good:"शुभ",mixed:"मिश्र",caution:"सावधान"})[mine.tone]:""}</span></button></div>
   ${on?`<section class="panel rail-body vedic-rail" role="tabpanel"><div class="kun-inv">॥ श्री गणेशाय नमः ॥</div><h2>पञ्चाङ्ग · ${esc(p.vara[0])}, ${fmtDate(p.date)}</h2>${body(0)}<h2 style="margin-top:6px">ज्योतिष · गोचर</h2>${body(1)}<div class="pb" style="padding-top:0">${J.vedicOpenBtn?J.vedicOpenBtn():""}</div></section>`:""}</aside>`};
J.act("homeRailTab",el=>{const c0=get("jcgg-hd-tab")||"";const c=["pj","st","ved"].includes(c0)?"ved":c0;put("jcgg-hd-tab",c===el.dataset.x?"":el.dataset.x);J.render()});
J.homeDay=()=>"";
// ---------- weather header (Open-Meteo, free, no key; cached 30 min) ----------
const WMO=c=>c===0?["☀️","Clear","clear"]:c<=2?["🌤️","Partly cloudy","part"]:c===3?["☁️","Overcast","cloud"]:c<=48?["🌫️","Haze / fog","fog"]:c<=57?["🌦️","Drizzle","rain"]:c<=67?["🌧️","Rain","rain"]:c<=77?["🌨️","Snow","cloud"]:c<=82?["🌧️","Showers","rain"]:["⛈️","Thunderstorm","storm"];
let wx=null,wxLoading=false;try{const c=JSON.parse(get("jcgg-wx2")||"null");if(c&&Date.now()-c.at<30*6e4)wx=c}catch(e){}
let wxTried=0;async function loadWx(){if(wxLoading||Date.now()-wxTried<5*6e4)return;wxTried=Date.now();wxLoading=true;const s=J.settings();const lat=+s.lat||22.5726,lon=+s.lon||88.3639;
  try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,uv_index_max,sunrise,sunset&timezone=Asia%2FKolkata&forecast_days=4`);const j=await r.json();if(j.current){wx={at:Date.now(),j};put("jcgg-wx2",JSON.stringify(wx))}}catch(e){}
  wxLoading=false;if(S.route.mod==="home")J.softRender()}
// ---- weather / disaster alerts: rain, storm, wind, heat, UV from the forecast; earthquakes (USGS, last 24 h, M4+ within 1,500 km); cyclones (GDACS tropical-cyclone feed, Indian Ocean) ----
let alx=null,alLoading=false;try{const c=JSON.parse(get("jcgg-alx")||"null");if(c&&Date.now()-c.at<30*6e4)alx=c}catch(e){}
let alTried=0;const km=(a,b,c,d)=>{const R=6371,t=x=>x*Math.PI/180,dl=t(c-a),dn=t(d-b),h=Math.sin(dl/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
async function loadAlerts(){if(alLoading||Date.now()-alTried<10*6e4)return;alTried=Date.now();alLoading=true;const s=J.settings();const lat=+s.lat||22.5726,lon=+s.lon||88.3639;const eq=[],cy=[];
  await Promise.all([(async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.0_day.geojson");const j=await r.json();for(const f of j.features||[]){const [lo,la]=f.geometry.coordinates;const d=km(lat,lon,la,lo);if(d<=1500)eq.push({m:f.properties.mag,pl:f.properties.place,d:Math.round(d),at:f.properties.time})}}catch(e){}})(),
   (async()=>{try{const r=await fetch("https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC&fromdate="+new Date(Date.now()-5*864e5).toISOString().slice(0,10)+"&todate="+new Date(Date.now()+864e5).toISOString().slice(0,10));const j=await r.json();for(const f of j.features||[]){const p=f.properties||{};const c=f.geometry?.coordinates;if(!c||p.iscurrent==="false")continue;const [lo,la]=Array.isArray(c[0])?c[0]:c;if(lo>40&&lo<110&&la>-5&&la<30)cy.push({n:p.name||"Cyclone",lv:p.alertlevel,d:Math.round(km(lat,lon,la,lo)),sev:p.severitydata?.severitytext||""})}}catch(e){}})()]);
  alx={at:Date.now(),eq:eq.sort((a,b)=>b.m-a.m).slice(0,3),cy:cy.slice(0,2)};put("jcgg-alx",JSON.stringify(alx));alLoading=false;if(S.route.mod==="home")J.softRender()}
// returns [{lv:"red"|"amber"|"info", ic, t}]
J.weatherAlerts=()=>{const out=[];const j=wx?.j;const d=j?.daily;
  if(d){const gust=d.wind_gusts_10m_max||[],ps=d.precipitation_sum||[],uv=d.uv_index_max||[],pp=d.precipitation_probability_max||[],hi=d.temperature_2m_max||[];const DN=i=>i===0?"today":i===1?"tomorrow":new Date(d.time[i]+"T12:00:00+05:30").toLocaleDateString("en-IN",{weekday:"long"});
    for(let i=0;i<Math.min(3,d.time.length);i++){const code=d.weather_code[i];
      if(ps[i]>=115)out.push({lv:"red",ic:"🌧️",t:`Extremely heavy rain ${DN(i)} — ${Math.round(ps[i])} mm expected. Expect waterlogging; plan deliveries and stock early.`});
      else if(ps[i]>=65)out.push({lv:"amber",ic:"🌧️",t:`Heavy rain ${DN(i)} — about ${Math.round(ps[i])} mm (${pp[i]}% chance). Delivery delays and fewer walk-ins likely.`});
      else if(ps[i]>=15&&pp[i]>=60)out.push({lv:"info",ic:"🌦️",t:`Rain ${DN(i)} — about ${Math.round(ps[i])} mm (${pp[i]}% chance).`});
      if(code>=95)out.push({lv:"amber",ic:"⛈️",t:`Thunderstorm ${DN(i)} — keep gas, power and outdoor seating secure.`});
      if(gust[i]>=90)out.push({lv:"red",ic:"🌀",t:`Very strong winds ${DN(i)} — gusts up to ${Math.round(gust[i])} km/h (storm / cyclone strength). Secure signboards and awnings.`});
      else if(gust[i]>=60)out.push({lv:"amber",ic:"💨",t:`Strong winds ${DN(i)} — gusts up to ${Math.round(gust[i])} km/h.`});
      if(hi[i]>=41)out.push({lv:"red",ic:"🔥",t:`Severe heat ${DN(i)} — ${Math.round(hi[i])}°C. Keep staff hydrated; cold storage will be under load.`});
      else if(hi[i]>=38)out.push({lv:"amber",ic:"🌡️",t:`Heat ${DN(i)} — ${Math.round(hi[i])}°C.`});
      if(uv[i]>=11&&i===0)out.push({lv:"info",ic:"☀️",t:`Extreme UV today (${Math.round(uv[i])}).`})}}
  for(const c of alx?.cy||[])out.push({lv:/red/i.test(c.lv)?"red":"amber",ic:"🌀",t:`Cyclone ${c.n}${c.lv?" ("+c.lv+" alert)":""} active — about ${c.d} km from you. Follow IMD bulletins.`});
  for(const e of alx?.eq||[])out.push({lv:e.m>=5.5||e.d<400?"red":e.m>=5?"amber":"info",ic:"🌍",t:`Earthquake M${e.m.toFixed(1)} — ${e.pl}, ${e.d} km away (${new Date(e.at).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"})}).`});
  const rk={red:0,amber:1,info:2};return out.sort((a,b)=>rk[a.lv]-rk[b.lv]).filter((x,i,a)=>a.findIndex(y=>y.t===x.t)===i).slice(0,6)};
J.homeHead=(greet,sub,btns)=>{if(!alx||Date.now()-alx.at>30*6e4)setTimeout(loadAlerts,60);const wal=J.weatherAlerts();if(!wx||Date.now()-wx.at>30*6e4)setTimeout(loadWx,30);const j=wx?.j;const now=new Date();let rise,set_;
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
    <div class="row">${btns}</div></div>
   <div class="wx-al" role="region" aria-label="Weather and disaster alerts">${wal.length?wal.map(a=>`<span class="wx-chip ${a.lv}" title="${esc(a.t)}"><i>${a.ic}</i> ${esc(a.t)}</span>`).join(""):`<span class="wx-chip ok"><i>✅</i> No weather, cyclone or earthquake alerts for ${esc(J.settings().place||"Kolkata")} right now.</span>`}</div></div>`};
// ---------- news & results ----------
const FEEDS=[["ET Markets","https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"],["ET Stocks","https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms"],["Mint Markets","https://www.livemint.com/rss/markets"],["Business Standard","https://www.business-standard.com/rss/markets-106.rss"]];
const RES=/\bresults?\b|\bQ[1-4]\b|earnings|net profit|profit (jumps|rises|falls|drops|declines|up|down)|revenue|board meet|dividend|quarterly/i;
let news=null,loading=false,err="";const dec=s=>{let x=s;for(let i=0;i<2;i++){const ta=document.createElement("textarea");ta.innerHTML=x;x=ta.value}return x};
try{const c=JSON.parse(get("jcgg-news")||"null");if(c&&Date.now()-c.at<30*6e4)news=c.items.map(x=>({...x,t:dec(x.t)}))}catch(e){}
async function loadNews(force){if(loading||(news&&!force))return;loading=true;err="";const out=[];
  await Promise.all(FEEDS.map(async([src,u])=>{try{const r=await fetch("https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(u));const j=await r.json();if(j.status!=="ok")return;
    for(const it of (j.items||[]).slice(0,15))out.push({t:dec(String(it.title||"").replace(/<[^>]+>/g,"")).trim(),l:it.link,d:it.pubDate?Date.parse(it.pubDate.replace(" ","T")+"Z")||0:0,s:src})}catch(e){}}));
  const seen=new Set();news=out.filter(x=>x.t&&!seen.has(x.t.toLowerCase())&&seen.add(x.t.toLowerCase())).sort((a,b)=>b.d-a.d);if(!news.length)err="News feeds could not be reached just now.";
  put("jcgg-news",JSON.stringify({at:Date.now(),items:news}));loading=false;if(S.route.mod==="home")J.softRender()}
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
