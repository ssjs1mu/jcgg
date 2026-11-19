/* Split-screen mode: when the window is narrowed to share the screen with another app (desktop browser, ≤1000 px wide), the side menu, the
   bottom bar and the module switcher are hidden and the page uses the full width. The ☰ button at the top left opens the menu over the
   page and closes it again. Phones keep their bottom bar. "Hide menus" can also be forced on any width from the ☰ button's menu footer. */
(()=>{
const root=document.documentElement;
const mq=window.matchMedia?matchMedia("(max-width:1000px) and (hover:hover) and (pointer:fine)"):null;
const mq2=window.matchMedia?matchMedia("(max-height:600px) and (max-width:1000px)"):null;
const forced=()=>{try{return localStorage.getItem("jcgg.focus")==="1"}catch(e){return false}};
const apply=()=>{const on=!!(mq&&mq.matches)||!!(mq2&&mq2.matches)||forced();root.classList.toggle("split",on);if(!on)root.classList.remove("menu-show")};
const fab=document.createElement("button");fab.id="splitFab";fab.type="button";fab.setAttribute("aria-label","Menu");fab.innerHTML="☰ Menu";
const scrim=document.createElement("div");scrim.id="splitScrim";
const add=()=>{document.body.append(fab,scrim);apply()};
fab.addEventListener("click",()=>root.classList.toggle("menu-show"));
scrim.addEventListener("click",()=>root.classList.remove("menu-show"));
document.addEventListener("click",e=>{if(root.classList.contains("menu-show")&&e.target.closest(".rail .nav button"))setTimeout(()=>root.classList.remove("menu-show"),50)});
document.addEventListener("keydown",e=>{if(e.key==="Escape")root.classList.remove("menu-show")});
for(const q of [mq,mq2])if(q)(q.addEventListener?q.addEventListener("change",apply):q.addListener(apply));
window.JSplit={apply,set:on=>{try{localStorage.setItem("jcgg.focus",on?"1":"0")}catch(e){}apply()}};
if(document.body)add();else document.addEventListener("DOMContentLoaded",add);
})();
