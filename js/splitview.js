/* Split-screen mode: when the window is narrowed to share the screen with another app (desktop browser ≤1000 px wide, or any device whose window is ≤600 px tall — phone / tablet split-screen), the side menu, the
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

// narrow windows: wide ledger-style tables drop the "No." and "Cleared" columns; the entry number moves under the date so every figure stays on screen
const fit=()=>{if(!root.classList.contains("split"))return;for(const t of document.querySelectorAll("#view table:not([data-fit])")){const hs=[...t.querySelectorAll("thead th")];if(hs.length<5)continue;const tx=hs.map(h=>h.textContent.trim());if(!tx.includes("Particulars"))continue;t.dataset.fit="1";t.classList.add("ledtbl");
  const di=tx.indexOf("Date"),ni=tx.findIndex(x=>/^(No\.|Voucher|Entry)$/.test(x)),ci=tx.indexOf("Cleared"),pi=tx.indexOf("Particulars");
  for(const tr of t.querySelectorAll("tr")){const c=tr.children;if(ni>=0&&di>=0&&c[ni]&&c[di]&&c[ni].textContent.trim()){const d=document.createElement("div");d.className="fit-no";d.innerHTML=c[ni].innerHTML;c[di].appendChild(d)}
    for(const i of [ni,ci])if(i>=0&&c[i])c[i].classList.add("fit-hide");if(pi>=0&&c[pi])c[pi].classList.add("fit-part")}}};
new MutationObserver(()=>{clearTimeout(fit.t);fit.t=setTimeout(fit,60)}).observe(document.documentElement,{childList:true,subtree:true});
window.JSplit={apply,set:on=>{try{localStorage.setItem("jcgg.focus",on?"1":"0")}catch(e){}apply()}};
if(document.body)add();else document.addEventListener("DOMContentLoaded",add);
})();
