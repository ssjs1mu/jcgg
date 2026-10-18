/* Joshi's Dashboard: the Joshi's Corner Stock Analyst terminal inside JCGG, behind the same sign-in.
   The terminal runs in a frame that is created once and kept alive, so switching modules and back does not reload it. */
(()=>{
const J=window.J,{esc}=J;
const URL_="https://ssjs1mu.github.io/jc-stock-analyst/";
let layer=null;
function ensure(){if(layer)return layer;layer=document.createElement("div");layer.id="jdashLayer";layer.className="wrap jdash-layer";layer.hidden=true;
  layer.innerHTML=`<iframe id="jdashFrame" title="Joshi's Corner Stock Analyst" src="${URL_}" allow="clipboard-read; clipboard-write; fullscreen; web-share" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  document.querySelector("main.main").appendChild(layer);return layer}
J.afterRender.push(mod=>{const show=mod==="jdash"&&J.canSee("jdash");if(show)ensure();if(layer)layer.hidden=!show;document.documentElement.classList.toggle("jdash-on",show)});
J.act("jdashReload",()=>{const f=document.getElementById("jdashFrame");if(f)f.src=URL_+"?r="+Date.now()});
J.act("jdashFull",()=>{const f=document.getElementById("jdashLayer");(f?.requestFullscreen||f?.webkitRequestFullscreen)?.call(f)});
function vTerm(){return `<div class="row jdash-bar" style="gap:8px;flex-wrap:wrap"><span class="chip ok">Live</span><span class="hint">Stock Analyst terminal — intraday, short-term, long-term and results-week views.</span>
  <span style="margin-left:auto" class="row" style="gap:6px"><button type="button" class="btn small" data-a="jdashReload">↻ Reload</button><button type="button" class="btn small" data-a="jdashFull">⛶ Full screen</button><a class="btn small" href="${URL_}" target="_blank" rel="noopener">Open in new tab ↗</a></span></div>`}
J.mod({id:"jdash",label:"Joshi's Dashboard",group:"Home",icon:'<path d="M3 3v18h18"/><path d="M7 15l3-4 3 2 5-7"/><circle cx="18" cy="6" r="1.5"/>',sub:"Joshi's Corner Stock Analyst — live NSE/BSE analysis from the same sign-in.",tabs:[["terminal","Stock Analyst",vTerm]]});
// first in the module list, above Home
{const i=J.MODS.findIndex(m=>m.id==="jdash");if(i>0)J.MODS.unshift(...J.MODS.splice(i,1))}
})();
