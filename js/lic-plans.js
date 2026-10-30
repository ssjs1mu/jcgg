/* Investments → "LIC plans": tiles for the active LIC plans; click a tile for benefits, drawbacks, warnings, best age group and outlook.
   Same data file feeds the daily "Plan of the day" page of the Morning Breeze booklet. General information only. */
(()=>{
const J=window.J,{esc}=J;
const URL="https://raw.githubusercontent.com/ssjs1mu/jc-stock-analyst/main/data/lic/plans.json";
const ui=()=>J.ui("lic",{sel:"",q:"",cat:"",loading:false,err:"",plans:null});
async function load(){const U=ui();if(U.plans||U.loading)return;U.loading=true;
  try{const r=await fetch(URL,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);U.plans=await r.json();U.err=""}catch(e){U.err="Could not load the plan list ("+(e.message||e)+"). Check the internet connection."}
  U.loading=false;J.render()}
const li=(a,c,m)=>a.map(x=>`<li style="margin:6px 0;line-height:1.4"><span style="color:${c};font-weight:800">${m}</span> ${esc(x)}</li>`).join("");
function detail(p){return `<div class="panel pb"><button class="btn small" data-set="lic.sel=">← All plans</button>
  <h3 style="margin:10px 0 2px">${esc(p.name)}</h3><div class="row" style="gap:6px;flex-wrap:wrap;margin:4px 0 8px"><span class="chip plain">${esc(p.cat)}</span><span class="chip plain">${esc(p.kind)}</span></div>
  <p style="margin:0 0 10px">${esc(p.line)}</p>
  <div class="kpis"><div class="kpi"><small>Entry age</small><b>${esc(p.entry)}</b></div><div class="kpi"><small>Term</small><b>${esc(p.term)}</b></div><div class="kpi"><small>Best age group</small><b>${esc(p.ages)}</b></div></div>
  <h4 style="margin:12px 0 4px;color:#16a34a">Benefits</h4><ul style="margin:0;padding-left:18px;list-style:none">${li(p.benefits,"#16a34a","✓")}</ul>
  <h4 style="margin:12px 0 4px;color:#d97706">Drawbacks</h4><ul style="margin:0;padding-left:18px;list-style:none">${li(p.drawbacks,"#d97706","●")}</ul>
  <div style="margin:12px 0;padding:10px 12px;border:2px solid #dc2626;border-radius:10px;background:#dc262612"><b style="color:#dc2626">Warnings</b><ul style="margin:4px 0 0;padding-left:18px;list-style:none">${li(p.warnings,"#dc2626","!")}</ul></div>
  <h4 style="margin:12px 0 4px">Future outlook</h4><p style="margin:0">${esc(p.outlook)}</p>
  <p class="hint" style="margin:12px 0 0">${esc(p.note||"")}</p></div>`}
function vLic(){const U=ui();load();
  if(U.err)return `<div class="empty"><strong>${esc(U.err)}</strong><button class="btn small w" data-a="licReload">Try again</button></div>`;
  if(!U.plans)return `<div class="empty"><strong>Loading LIC plans…</strong></div>`;
  const sel=U.plans.find(p=>p.id===U.sel);if(sel)return detail(sel);
  const q=(U.q||"").toLowerCase();const cats=[...new Set(U.plans.map(p=>p.cat))];
  const list=U.plans.filter(p=>(!U.cat||p.cat===U.cat)&&(!q||(p.name+" "+p.cat+" "+p.line).toLowerCase().includes(q)));
  const day=U.plans[Math.floor(Date.now()/864e5+0)%U.plans.length];
  return `<div class="panel pb"><h3 style="margin-top:0">LIC plans <span class="chip plain">${U.plans.length} plans</span></h3>
    <p class="hint" style="margin:0 0 8px">Tap a plan to see benefits, drawbacks, warnings, the age group it suits and the outlook. One plan is featured each day in the Morning Breeze booklet.</p>
    <div class="filters"><div class="seg" style="flex-wrap:wrap"><button data-set="lic.cat=" aria-pressed="${!U.cat}">All</button>${cats.map(c=>`<button data-set="lic.cat=${esc(c)}" aria-pressed="${U.cat===c}">${esc(c)}</button>`).join("")}</div>
      <input data-ui="lic.q" value="${esc(U.q||"")}" placeholder="Search a plan" style="min-width:200px"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:10px">${list.map(p=>`<button data-set="lic.sel=${esc(p.id)}" style="text-align:left;cursor:pointer;border:1.5px solid var(--line,#d6d6d6);border-radius:14px;padding:14px;background:var(--panel,#fff);color:inherit">
      <small style="opacity:.7">${esc(p.cat)}</small><div style="font-weight:800;font-size:16px;margin:2px 0 6px">${esc(p.name.replace("LIC's ",""))}</div>
      <div style="font-size:13px;opacity:.85;line-height:1.35">${esc(p.line)}</div>
      <div style="margin-top:8px;font-size:12px"><b>Age ${esc(p.entry)}</b> · best ${esc(p.ages)}</div></button>`).join("")||`<div class="empty">No plan matches.</div>`}</div></div>`}
J.act("licReload",()=>{ui().plans=null;ui().err="";load()});
J.vLic=vLic;
})();
