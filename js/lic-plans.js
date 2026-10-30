/* Insurance → "LIC plans": plan tiles with a picture timeline, full plan explanation, and a "find my plan" suggester
   (age, optional monthly premium capacity, goal). Data: data/lic/plans.json (also feeds the Morning Breeze "plan of the day" page).
   General information only; check the current brochure before buying. */
(()=>{
const J=window.J,{esc}=J;
const URL="https://raw.githubusercontent.com/ssjs1mu/jc-stock-analyst/main/data/lic/plans.json";
const ui=()=>J.ui("lic",{sel:"",q:"",cat:"",loading:false,err:"",plans:null,age:"",pay:"",goal:"",go:false});
const GOALS=[["","Any goal"],["protection","Family protection (term)"],["savings","Savings with cover"],["income","Regular income"],["child","Child's future"],["retirement","Retirement pension"]];
const COL={Term:["#2563eb","#38bdf8"],Savings:["#16a34a","#84cc16"],Income:["#d97706","#facc15"],Child:["#db2777","#f472b6"],Pension:["#7c3aed","#a78bfa"]};
const fam=p=>/term/i.test(p.cat)?"Term":/child|money back \(child/i.test(p.cat)||p.goals.includes("child")?"Child":/annuity/i.test(p.cat)?"Pension":/income|whole life/i.test(p.cat)?"Income":"Savings";
const ICON={Term:"M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",Savings:"M4 19h16M6 15l4-4 3 3 5-6",Income:"M12 3v18M7 8h8a3 3 0 010 6H8a3 3 0 000 6h9",Child:"M12 5a3 3 0 100 6 3 3 0 000-6zM6 20c0-3.3 2.7-6 6-6s6 2.7 6 6",Pension:"M5 12h14M12 5v14M7 7l10 10"};
async function load(){const U=ui();if(U.plans||U.loading)return;U.loading=true;
  try{const r=await fetch(URL,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);U.plans=await r.json();U.err=""}catch(e){U.err="Could not load the plan list ("+(e.message||e)+"). Check the internet connection."}
  U.loading=false;J.render()}
const li=(a,c,m)=>(a||[]).map(x=>`<li style="margin:6px 0;line-height:1.4"><span style="color:${c};font-weight:800">${m}</span> ${esc(x)}</li>`).join("");
const banner=(p,h=84)=>{const [c1,c2]=COL[fam(p)];return `<div style="height:${h}px;border-radius:14px 14px 0 0;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;gap:12px;padding:0 14px;color:#fff"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[fam(p)]}"/></svg><div style="font-weight:800;font-size:15px;line-height:1.2;text-shadow:0 1px 4px #0005">${esc(p.name.replace("LIC's ",""))}<div style="font-weight:600;font-size:12px;opacity:.95">${esc(p.cat)}</div></div></div>`};
function timeline(p){const ph=p.phases||[];const W=640,H=118,min=1.2;const ws=ph.map(x=>Math.max(+x.y||0,min));const tot=ws.reduce((a,b)=>a+b,0)||1;let x=0;
  const KC={pay:"#2563eb",cover:"#94a3b8",get:"#16a34a"};
  const bars=ph.map((s,i)=>{const w=Math.max(ws[i]/tot*(W-8),46);const o=`<rect x="${x}" y="30" width="${w-4}" height="34" rx="8" fill="${KC[s.k]||"#888"}"/><text x="${x+(w-4)/2}" y="52" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">${s.k==="pay"?"PAY":s.k==="cover"?"COVER":"RECEIVE"}</text>`;
    const t=`<foreignObject x="${x}" y="68" width="${w-4}" height="46"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:11.5px;line-height:1.2;text-align:center">${esc(s.l)}</div></foreignObject>`;x+=w;return o+t}).join("");
  return `<svg viewBox="0 0 ${Math.max(W,x)} ${H}" width="100%" role="img" aria-label="How the plan works over time"><text x="0" y="16" font-size="12" font-weight="700" fill="currentColor" opacity=".7">HOW IT WORKS OVER TIME (illustrative proportions)</text>${bars}</svg>`}
function detail(p){const [c1]=COL[fam(p)];return `<div class="panel pb" style="padding:0;overflow:hidden"><div style="padding:10px 14px"><button class="btn small" data-set="lic.sel=">← All plans</button></div>${banner(p,96)}
  <div style="padding:14px">
  <div class="row" style="gap:6px;flex-wrap:wrap;margin:0 0 8px"><span class="chip plain">${esc(p.cat)}</span><span class="chip plain">${esc(p.kind)}</span></div>
  <p style="margin:0 0 10px;font-size:15px">${esc(p.line)}</p>
  <div class="kpis"><div class="kpi"><small>Entry age</small><b>${esc(p.entry)}</b></div><div class="kpi"><small>Term</small><b>${esc(p.term)}</b></div><div class="kpi"><small>Best age group</small><b>${esc(p.ages)}</b></div><div class="kpi"><small>Premium style</small><b>${p.pay==="single"?"One-time lump sum":"Regular (monthly to yearly)"}</b></div></div>
  <div style="margin:12px 0;color:inherit">${timeline(p)}</div>
  <h4 style="margin:12px 0 4px">All features</h4><ul style="margin:0;padding-left:18px;list-style:none">${li(p.features,c1,"◆")}</ul>
  <h4 style="margin:12px 0 4px;color:#16a34a">Advantages</h4><ul style="margin:0;padding-left:18px;list-style:none">${li(p.benefits,"#16a34a","✓")}</ul>
  <h4 style="margin:12px 0 4px;color:#d97706">Drawbacks</h4><ul style="margin:0;padding-left:18px;list-style:none">${li(p.drawbacks,"#d97706","●")}</ul>
  <div style="margin:12px 0;padding:10px 12px;border:2px solid #dc2626;border-radius:10px;background:#dc262612"><b style="color:#dc2626">Warnings</b><ul style="margin:4px 0 0;padding-left:18px;list-style:none">${li(p.warnings,"#dc2626","!")}</ul></div>
  <div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px"><div><h4 style="margin:6px 0 2px">Suits</h4><p style="margin:0">${esc(p.suited||p.ages)}</p></div><div><h4 style="margin:6px 0 2px">Think twice if</h4><p style="margin:0">${esc(p.avoid||"")}</p></div><div><h4 style="margin:6px 0 2px">Tax</h4><p style="margin:0">${esc(p.tax||"")}</p></div><div><h4 style="margin:6px 0 2px">Future outlook</h4><p style="margin:0">${esc(p.outlook)}</p></div></div>
  <p class="hint" style="margin:12px 0 0">${esc(p.note||"")}</p></div></div>`}
function suggest(U){const age=+U.age,pay=+U.pay||0,goal=U.goal;const out=[];
  for(const p of U.plans){if(age<p.ageMin||age>p.ageMax)continue;let s=0;const why=[];
    if(goal){if(p.goals.includes(goal)){s+=50;why.push("matches your goal")}else if(goal==="protection"||goal==="child"||goal==="retirement")continue;else s-=15}else s+=10;
    const mid=(p.ages||"").match(/(\d+)\D+(\d+)/);if(mid&&age>=+mid[1]&&age<=+mid[2]){s+=25;why.push("age "+age+" is in its best-fit group "+p.ages)}else if(mid){s+=5}
    if(pay>0){if(p.pay==="single"){why.push("needs a one-time lump sum, not a monthly amount");s-=5}else if(pay>=p.minMonthly){s+=20;why.push("fits a monthly budget of about ₹"+pay.toLocaleString("en-IN")+" (indicative minimum ₹"+p.minMonthly.toLocaleString("en-IN")+")")}else{s-=40;why.push("indicative minimum is about ₹"+p.minMonthly.toLocaleString("en-IN")+" a month, above your budget")}}
    out.push({p,s,why})}
  return out.sort((a,b)=>b.s-a.s)}
function finder(U){const res=U.go&&+U.age>0?suggest(U):null;
  return `<div class="panel pb" style="margin-bottom:12px"><h3 style="margin-top:0">Find a plan for me</h3>
   <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end">
    <label>Age (years)<input type="number" min="0" max="85" data-ui="lic.age" value="${esc(U.age)}" placeholder="e.g. 35"></label>
    <label>Monthly premium you can pay (₹, optional)<input type="number" min="0" data-ui="lic.pay" value="${esc(U.pay)}" placeholder="leave blank if not sure"></label>
    <label>Main goal (optional)<select data-ui="lic.goal">${GOALS.map(([v,l])=>`<option value="${v}" ${U.goal===v?"selected":""}>${l}</option>`).join("")}</select></label>
    <button class="btn primary w" data-a="licFind">Show suitable plans</button></div>
   ${res?(res.length?`<p class="hint" style="margin:10px 0 6px">Ranked for age ${esc(U.age)}${+U.pay?" and about ₹"+(+U.pay).toLocaleString("en-IN")+" a month":""}. Premium minimums are indicative only; the real premium depends on age, term and sum assured.</p>
    <div style="display:grid;gap:8px">${res.slice(0,6).map((r,i)=>`<button data-set="lic.sel=${esc(r.p.id)}" style="text-align:left;cursor:pointer;border:1.5px solid ${i===0?"#16a34a":"var(--line,#d6d6d6)"};border-radius:12px;padding:10px 12px;background:var(--panel,#fff);color:inherit"><b>${i+1}. ${esc(r.p.name)}</b> <span class="chip plain">${esc(r.p.cat)}</span><div style="font-size:13px;opacity:.85;margin-top:3px">${esc(r.p.line)}</div><div style="font-size:12.5px;margin-top:4px;color:#16a34a">${esc(r.why.join(" · "))}</div></button>`).join("")}</div>`:`<div class="empty">No plan fits that age and goal. Try a different goal.</div>`):""}
   </div>`}
function vLic(){const U=ui();load();
  if(U.err)return `<div class="empty"><strong>${esc(U.err)}</strong><button class="btn small w" data-a="licReload">Try again</button></div>`;
  if(!U.plans)return `<div class="empty"><strong>Loading LIC plans…</strong></div>`;
  const sel=U.plans.find(p=>p.id===U.sel);if(sel)return detail(sel);
  const q=(U.q||"").toLowerCase();const cats=[...new Set(U.plans.map(p=>p.cat))];
  const list=U.plans.filter(p=>(!U.cat||p.cat===U.cat)&&(!q||(p.name+" "+p.cat+" "+p.line).toLowerCase().includes(q)));
  return finder(U)+`<div class="panel pb"><h3 style="margin-top:0">LIC plans <span class="chip plain">${U.plans.length} plans</span></h3>
    <p class="hint" style="margin:0 0 8px">Tap a plan for its full explanation: features, advantages, drawbacks, warnings, age group and outlook. One plan is featured each day in the Morning Breeze booklet.</p>
    <div class="filters"><div class="seg" style="flex-wrap:wrap"><button data-set="lic.cat=" aria-pressed="${!U.cat}">All</button>${cats.map(c=>`<button data-set="lic.cat=${esc(c)}" aria-pressed="${U.cat===c}">${esc(c)}</button>`).join("")}</div>
      <input data-ui="lic.q" value="${esc(U.q||"")}" placeholder="Search a plan" style="min-width:200px"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:10px">${list.map(p=>`<button data-set="lic.sel=${esc(p.id)}" style="text-align:left;cursor:pointer;border:1.5px solid var(--line,#d6d6d6);border-radius:14px;padding:0;background:var(--panel,#fff);color:inherit;overflow:hidden">${banner(p)}
      <div style="padding:10px 12px;font-size:13px;line-height:1.35"><div style="opacity:.9">${esc(p.line)}</div><div style="margin-top:8px;font-size:12px"><b>Age ${esc(p.entry)}</b> · best ${esc(p.ages)}</div></div></button>`).join("")||`<div class="empty">No plan matches.</div>`}</div></div>`}
J.act("licFind",()=>{const U=ui();U.go=true;J.render()});
J.act("licReload",()=>{ui().plans=null;ui().err="";load()});
J.vLic=vLic;
})();
