/* Home screen: a small QR code to download the JCGG Care Android app (APK from the GitHub release "apk-latest").
   Scan with the phone camera → the APK downloads; install it (Allow "Install unknown apps" once).
   The QR is drawn as an inline SVG from the qrcode-generator library (same one the promotions use). */
(()=>{
const J=window.J;
const URL_APK="https://github.com/ssjs1mu/jcgg/releases/download/apk-latest/JCGG-Care.apk";
let svg="",loading=false;
function build(){
  if(svg||loading)return;loading=true;
  const done=()=>{try{const q=window.qrcode(0,"M");q.addData(URL_APK);q.make();const n=q.getModuleCount(),c=3;let p="";
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))p+=`M${(x+2)*c} ${(y+2)*c}h${c}v${c}h-${c}z`;
    const w=(n+4)*c;svg=`<svg viewBox="0 0 ${w} ${w}" width="84" height="84" role="img" aria-label="QR code: download the JCGG Care Android app" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${w}" fill="#fff"/><path d="${p}" fill="#17202a"/></svg>`}catch(e){console.warn("QR",e)}
    loading=false;if(svg&&J.render)J.render()};
  if(window.qrcode)return done();
  const s=document.createElement("script");s.src=window.FAMART_QR||"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=done;s.onerror=()=>{loading=false};document.head.appendChild(s);
}
// compact tile: QR + title; the explanation is a hover balloon
J.appQR=()=>{build();
  return `<a class="appqr" href="${URL_APK}" target="_blank" rel="noopener" title="JCGG Care Android app (Attendance + Customer Care). Scan with the phone camera to download the APK, then install it. Tap here to download on this device." style="display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line,#ddd);border-radius:10px;padding:4px 8px;text-decoration:none;color:inherit;background:var(--card,#fff)">${svg||'<span class="hint">QR…</span>'}<span style="font-size:12px;line-height:1.2"><b>Android App</b><br><span class="muted">Scan To Download</span></span></a>`};
})();
