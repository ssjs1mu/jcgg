/* “Parents' Week” artwork — standee (2.5 ft × 6 ft ratio) and banner (3:1) drawn on a canvas: gradient, tree-ring motif, tree logo,
   4-week growth infographic, the thought behind the promotion, and the digital-menu QR with the tree logo in its centre.
   Pure drawing code (no app dependencies) so it can be tested alone.  window.FamArt.render(canvas, "standee"|"banner", {brand, cfg, logo}) */
(()=>{
const GOLD="#F7C948",CREAM="#FFF6E0",GREEN="#2F8F4E",DEEP="#3A0F2B";
const SIZES={standee:[1200,2880],banner:[3600,1200]};
const DEF={line1:"Bring your parents",line2:"3 weeks in a row.",line3:"The 4th week,",line4:"they dine on us!",
  eyebrow:"FAMILY ASSOCIATION PROGRAMME",thoughtTitle:"Why we do this",
  thought:"They ate last so that we could eat first. They counted every rupee so that we never had to. Once a week, give them a table, a smile and your time — and on the fourth, let us serve the ones who served you.",
  punch:"Roots feed the tree. Honour yours.",minAge:60,days:"Monday to Friday",menuUrl:"https://ssjs1mu.github.io/menu/",
  steps:[["WEEK 1","Dine with your parents"],["WEEK 2","Come back with them"],["WEEK 3","Make it three in a row"],["WEEK 4","They dine on us"]]};
const rr=(x,X,Y,W,H,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+W,Y,X+W,Y+H,r);x.arcTo(X+W,Y+H,X,Y+H,r);x.arcTo(X,Y+H,X,Y,r);x.arcTo(X,Y,X+W,Y,r);x.closePath()};
const wrapT=(x,t,w)=>{const out=[];let l="";for(const wd of String(t||"").split(/\s+/)){const q=l?l+" "+wd:wd;if(x.measureText(q).width>w&&l){out.push(l);l=wd}else l=q}if(l)out.push(l);return out};
const gold=(x,y0,y1)=>{const g=x.createLinearGradient(0,y0,0,y1);g.addColorStop(0,"#FFF3B0");g.addColorStop(.45,GOLD);g.addColorStop(1,"#E0922B");return g};
const loadImg=src=>new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});
let QP;const qrLib=()=>QP??=new Promise((ok,no)=>{if(window.qrcode)return ok(window.qrcode);const s=document.createElement("script");s.src=window.FAMART_QR||"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=()=>ok(window.qrcode);s.onerror=()=>{QP=null;no(new Error("Could not load the QR library"))};document.head.appendChild(s)});
// ---------- pieces ----------
function background(x,W,H){const land=W>H;const g=land?x.createLinearGradient(0,0,W,H*.7):x.createLinearGradient(W*.2,0,W*.8,H);
  g.addColorStop(0,"#140A26");g.addColorStop(.34,"#52103F");g.addColorStop(.68,"#B5352C");g.addColorStop(1,"#F59E2B");x.fillStyle=g;x.fillRect(0,0,W,H);
  // tree-ring motif (growth rings) in two corners
  x.save();x.strokeStyle=GOLD;for(const [cx,cy,R] of land?[[W*.02,H*.98,H*.95],[W*.98,H*.02,H*.8]]:[[W*.02,H*.99,W*.95],[W*.98,H*.1,W*.7]])for(let r=R*.12;r<R;r+=R*.085){x.globalAlpha=.07+.1*(1-r/R);x.lineWidth=Math.max(2,R*.006);x.beginPath();x.arc(cx,cy,r,0,7);x.stroke()}x.restore();
  // soft glow + sparkles
  const gl=x.createRadialGradient(W*.5,H*(land?.45:.3),0,W*.5,H*(land?.45:.3),Math.max(W,H)*.5);gl.addColorStop(0,"rgba(255,200,90,.22)");gl.addColorStop(1,"rgba(255,200,90,0)");x.fillStyle=gl;x.fillRect(0,0,W,H);
  x.save();for(let i=0;i<70;i++){const px=(Math.sin(i*91.7)*.5+.5)*W,py=(Math.cos(i*37.3)*.5+.5)*H,pr=Math.min(W,H)*(.003+((i*13)%7)/1400);x.globalAlpha=.25+((i*7)%5)/12;x.beginPath();x.arc(px,py,pr,0,7);x.fillStyle=i%3?GOLD:"#fff";x.fill()}x.restore();
  const s=Math.min(W,H);x.strokeStyle=GOLD;x.lineWidth=s*.004;x.strokeRect(s*.02,s*.02,W-s*.04,H-s*.04);x.globalAlpha=.45;x.strokeRect(s*.03,s*.03,W-s*.06,H-s*.06);x.globalAlpha=1}
function logoDisc(x,logo,cx,cy,r){x.save();x.shadowColor="rgba(0,0,0,.5)";x.shadowBlur=r*.35;x.shadowOffsetY=r*.1;x.beginPath();x.arc(cx,cy,r+r*.1,0,7);x.fillStyle=gold(x,cy-r,cy+r);x.fill();x.restore();
  x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.fillStyle="#fff";x.fill();x.clip();if(logo){const k=Math.min(2*r*.9/logo.width,2*r*.9/logo.height);x.drawImage(logo,cx-logo.width*k/2,cy-logo.height*k/2,logo.width*k,logo.height*k)}x.restore()}
function pill(x,text,cx,cy,fs){x.font=`700 ${fs}px Poppins,sans-serif`;const w=x.measureText(text).width+fs*2.2,h=fs*2;rr(x,cx-w/2,cy-h/2,w,h,h/2);x.fillStyle="rgba(247,201,72,.16)";x.fill();x.strokeStyle=GOLD;x.lineWidth=fs*.07;x.stroke();x.fillStyle=GOLD;x.textAlign="center";x.textBaseline="middle";x.fillText(text,cx,cy+fs*.04);x.textAlign="left";x.textBaseline="alphabetic"}
function fitLine(x,text,maxW,fs,font){x.font=font(fs);let s=fs;while(x.measureText(text).width>maxW&&s>20){s-=4;x.font=font(s)}return s}
function leaf(x,cx,cy,len,ang,col){x.save();x.translate(cx,cy);x.rotate(ang);x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(len*.5,-len*.42,len,0);x.quadraticCurveTo(len*.5,len*.42,0,0);x.fillStyle=col;x.fill();x.restore()}
function icon(x,k,cx,cy,r){x.save();x.lineCap="round";const g1=GREEN,g2="#57B26B";
  if(k===0){x.strokeStyle=g1;x.lineWidth=r*.09;x.beginPath();x.moveTo(cx,cy+r*.5);x.quadraticCurveTo(cx,cy,cx,cy-r*.15);x.stroke();leaf(x,cx,cy-r*.1,r*.62,-.55,g2);leaf(x,cx,cy+r*.02,r*.55,Math.PI+.55,g1)}
  else if(k===1){x.strokeStyle=g1;x.lineWidth=r*.1;x.beginPath();x.moveTo(cx,cy+r*.56);x.lineTo(cx,cy-r*.45);x.stroke();for(const [dy,s,a] of [[.3,.5,-.5],[.1,.55,Math.PI+.5],[-.12,.5,-.6],[-.3,.45,Math.PI+.6]])leaf(x,cx,cy+r*dy,r*s,a,dy>0?g1:g2)}
  else if(k===2){x.fillStyle="#8A5A2B";rr(x,cx-r*.07,cy+r*.05,r*.14,r*.52,r*.04);x.fill();for(const [dx,dy,rad,c] of [[-.26,0,.3,g1],[.26,0,.3,g1],[0,-.2,.36,g2],[-.12,-.38,.27,g2],[.14,-.36,.26,g1]]){x.beginPath();x.arc(cx+dx*r,cy+dy*r,rad*r,0,7);x.fillStyle=c;x.fill()}}
  else{const s=r*.62;x.fillStyle="#B5222F";x.beginPath();x.moveTo(cx,cy+s*.85);x.bezierCurveTo(cx-s*1.5,cy-s*.2,cx-s*.55,cy-s*1.25,cx,cy-s*.4);x.bezierCurveTo(cx+s*.55,cy-s*1.25,cx+s*1.5,cy-s*.2,cx,cy+s*.85);x.fill();x.fillStyle="rgba(255,255,255,.35)";x.beginPath();x.ellipse(cx-s*.5,cy-s*.35,s*.18,s*.1,-.6,0,7);x.fill()}
  x.restore()}
function stepRow(x,steps,x0,x1,cy,r,fs){const n=4,dx=(x1-x0)/(n-1);const xs=[...Array(n)].map((_,i)=>x0+dx*i);
  // growing vine between medallions
  for(let i=0;i<n-1;i++){x.save();x.setLineDash([r*.16,r*.14]);x.strokeStyle=GOLD;x.globalAlpha=.9;x.lineWidth=r*(.07+i*.03);x.beginPath();x.moveTo(xs[i]+r*(i===2?1.05:1.02),cy);x.lineTo(xs[i+1]-r*(i+1===3?1.38:1.02),cy);x.stroke();x.restore();
    x.fillStyle=GOLD;x.beginPath();const ax=xs[i+1]-r*(i+1===3?1.5:1.12);x.moveTo(ax,cy-r*.12);x.lineTo(ax+r*.2,cy);x.lineTo(ax,cy+r*.12);x.fill()}
  xs.forEach((cx,i)=>{const last=i===3;const R=last?r*1.28:r;
    if(last){x.save();x.translate(cx,cy);for(let k=0;k<16;k++){x.rotate(Math.PI/8);x.beginPath();x.moveTo(0,0);x.lineTo(R*1.32,-R*.08);x.lineTo(R*1.32,R*.08);x.fillStyle="rgba(247,201,72,.28)";x.fill()}x.restore()}
    x.save();x.shadowColor="rgba(0,0,0,.5)";x.shadowBlur=R*.3;x.shadowOffsetY=R*.08;x.beginPath();x.arc(cx,cy,R+R*.09,0,7);x.fillStyle=gold(x,cy-R,cy+R);x.fill();x.restore();
    const g=x.createRadialGradient(cx,cy-R*.3,R*.1,cx,cy,R);g.addColorStop(0,last?"#FFF8D8":"#FFFDF4");g.addColorStop(1,last?"#FFD978":CREAM);x.beginPath();x.arc(cx,cy,R,0,7);x.fillStyle=g;x.fill();icon(x,i,cx,cy,R);
    x.textAlign="center";x.fillStyle=gold(x,cy+R,cy+R+fs*1.2);x.font=`800 ${fs*1.12}px Poppins,sans-serif`;x.fillText(steps[i][0],cx,cy+R+fs*1.9);
    x.fillStyle=CREAM;x.font=`500 ${fs*.9}px Poppins,sans-serif`;const ls=wrapT(x,steps[i][1],dx*.92);ls.forEach((l,j)=>x.fillText(l,cx,cy+R+fs*3.1+j*fs*1.15));x.textAlign="left";
    if(last){const w=R*1.9,h=fs*1.5;x.save();x.translate(cx,cy-R*1.12);x.rotate(-.06);rr(x,-w/2,-h/2,w,h,h/2);x.fillStyle="#E53935";x.fill();x.fillStyle="#fff";x.font=`800 ${fs*.95}px Poppins,sans-serif`;x.textAlign="center";x.textBaseline="middle";x.fillText("COMPLIMENTARY",0,fs*.04);x.restore();x.textBaseline="alphabetic"}});
  return cy+r*1.28+fs*3.1+fs*2.4}
function tiles(x,items,X,Y,W,H,gap,fs){const n=items.length,w=(W-gap*(n-1))/n;items.forEach(([big,cap],i)=>{const tx=X+i*(w+gap);rr(x,tx,Y,w,H,fs*.8);x.fillStyle="rgba(255,255,255,.1)";x.fill();x.strokeStyle="rgba(247,201,72,.65)";x.lineWidth=fs*.07;x.stroke();
    x.textAlign="center";let bs=fs*3.1;x.font=`900 ${bs}px "Playfair Display",Georgia,serif`;while(x.measureText(big).width>w*.86&&bs>20){bs-=3;x.font=`900 ${bs}px "Playfair Display",Georgia,serif`}x.fillStyle=gold(x,Y,Y+H*.6);x.fillText(big,tx+w/2,Y+H*.5);
    x.fillStyle=CREAM;x.font=`600 ${fs*.92}px Poppins,sans-serif`;wrapT(x,cap,w*.86).slice(0,3).forEach((l,j)=>x.fillText(l,tx+w/2,Y+H*.5+fs*1.55+j*fs*1.2));x.textAlign="left"})}
function thought(x,C,X,Y,W,H,fs){rr(x,X,Y,W,H,fs*1.1);const g=x.createLinearGradient(X,Y,X+W,Y+H);g.addColorStop(0,"rgba(255,255,255,.14)");g.addColorStop(1,"rgba(255,255,255,.05)");x.fillStyle=g;x.fill();x.strokeStyle="rgba(247,201,72,.7)";x.lineWidth=fs*.07;x.stroke();
  const p=fs*1.5;x.font=`${fs*3.2}px "Great Vibes","Brush Script MT",cursive`;x.fillStyle=gold(x,Y,Y+fs*4);x.fillText(C.thoughtTitle,X+p,Y+p+fs*2.4);
  x.font=`500 ${fs}px Poppins,sans-serif`;x.fillStyle=CREAM;const ls=wrapT(x,C.thought,W-2*p);let y=Y+p+fs*4.6;for(const l of ls){x.fillText(l,X+p,y);y+=fs*1.5}
  y+=fs*.5;x.font=`italic 800 ${fs*1.25}px "Playfair Display",Georgia,serif`;x.fillStyle=gold(x,y-fs,y+fs);for(const l of wrapT(x,"“"+C.punch+"”",W-2*p)){x.fillText(l,X+p,y+fs*.4);y+=fs*1.6}return y}
function drawQR(x,qr,cx,cy,size,logo){const n=qr.getModuleCount(),pad=size*.07,P=size+pad*2;x.save();x.shadowColor="rgba(0,0,0,.45)";x.shadowBlur=size*.06;x.shadowOffsetY=size*.02;rr(x,cx-P/2,cy-P/2,P,P,P*.07);x.fillStyle="#fff";x.fill();x.restore();
  const m=size/n,X0=cx-size/2,Y0=cy-size/2,hole=size*.135;const g=x.createLinearGradient(X0,Y0,X0+size,Y0+size);g.addColorStop(0,"#3A0F2B");g.addColorStop(1,"#7A1F3D");x.fillStyle=g;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){if(!qr.isDark(r,c))continue;const mx=X0+c*m+m/2,my=Y0+r*m+m/2;if(Math.hypot(mx-cx,my-cy)<hole*1.55)continue;rr(x,X0+c*m+m*.04,Y0+r*m+m*.04,m*.92,m*.92,m*.3);x.fill()}
  x.beginPath();x.arc(cx,cy,hole*1.4,0,7);x.fillStyle="#fff";x.fill();x.lineWidth=m*.3;x.strokeStyle=GOLD;x.stroke();
  if(logo){x.save();x.beginPath();x.arc(cx,cy,hole*1.3,0,7);x.clip();const k=Math.min(2*hole*1.3*.95/logo.width,2*hole*1.3*.95/logo.height);x.drawImage(logo,cx-logo.width*k/2,cy-logo.height*k/2,logo.width*k,logo.height*k);x.restore()}return P}
// ---------- main ----------
async function render2(cv,kind,o){const [W,H]=SIZES[kind];const sc=o.scale||1;cv.width=Math.round(W*sc);cv.height=Math.round(H*sc);const x=cv.getContext("2d");x.setTransform(sc,0,0,sc,0,0);const C={...DEF,...(o.cfg||{})};if(!C.steps||C.steps.length!==4)C.steps=DEF.steps;const B=o.brand||{};
  try{await document.fonts?.ready}catch(e){}const logo=await loadImg(o.logo);const lib=await qrLib();const qr=lib(0,"H");qr.addData(C.menuUrl||DEF.menuUrl);qr.make();
  background(x,W,H);const land=kind==="banner";const hFont=s=>`900 ${s}px "Playfair Display",Georgia,serif`;
  const T=`Parents aged ${C.minAge}+ · dine-in only · ${C.days}, at a time that suits them · register your family at the counter · management reserves the right to amend`;
  const info=[B.address,B.phone&&"Call "+B.phone,B.handle].filter(Boolean).join("   ·   ");
  const tl=[["3","weeks with your parents"],["1","complimentary dine-in for them"],["Mon–Fri","at a time that suits them"]];
  const footer=(Y,H2,fs)=>{x.fillStyle="rgba(0,0,0,.5)";x.fillRect(0,Y,W,H2);x.fillStyle=gold(x,Y,Y+H2);x.fillRect(0,Y,W,fs*.14);x.textAlign="center";x.fillStyle="#fff";x.font=`600 ${fs}px Poppins,sans-serif`;{const z=fitLine(x,info,W*.94,fs,q=>`600 ${q}px Poppins,sans-serif`);x.font=`600 ${z}px Poppins,sans-serif`;x.fillText(info,W/2,Y+H2*.42)}x.font=`400 ${fs*.74}px Poppins,sans-serif`;x.font=`400 ${fs*.74}px Poppins,sans-serif`;x.fillStyle=CREAM;x.globalAlpha=.85;const ls=wrapT(x,T,W*.9);ls.slice(0,2).forEach((l,i)=>x.fillText(l,W/2,Y+H2*.42+fs*1.5+i*fs));x.globalAlpha=1;x.textAlign="left"};
  if(!land){const m=W*.07;
    logoDisc(x,logo,W/2,150,105);x.textAlign="center";x.font=`125px "Great Vibes","Brush Script MT",cursive`;x.fillStyle=gold(x,260,400);x.fillText(B.name||"Joshi's Corner",W/2,385);x.font=`600 28px Poppins,sans-serif`;x.fillStyle=CREAM;x.globalAlpha=.9;x.fillText(B.tagline||"",W/2,435);x.globalAlpha=1;x.textAlign="left";
    pill(x,C.eyebrow,W/2,510,28);
    let y=650;x.textAlign="center";for(const [t,fs,col] of [[C.line1,90,"c"],[C.line2,96,"g"],[C.line3,74,"c"],[C.line4,124,"g"]]){const s=fitLine(x,t,W-2*m,fs,hFont);x.font=hFont(s);x.save();x.shadowColor="rgba(0,0,0,.55)";x.shadowBlur=24;x.fillStyle=col==="g"?gold(x,y-s,y+s*.2):CREAM;x.fillText(t,W/2,y);x.restore();y+=s*1.16}x.textAlign="left";
    y=stepRow(x,C.steps,m+125,W-m-125,y+105,84,29);
    tiles(x,tl,m,y+8,W-2*m,230,22,30);y+=8+230+36;
    thought(x,C,m,y,W-2*m,590,37);
    const qs=290,P0=qs*1.14,qy=y+590+34+P0/2;
    const P=drawQR(x,qr,m+P0/2,qy,qs,logo);x.textAlign="left";const tx=m+P+50;x.font=`84px "Great Vibes","Brush Script MT",cursive`;x.fillStyle=gold(x,qy-110,qy);x.fillText("Scan & explore",tx,qy-62);x.font=`700 38px Poppins,sans-serif`;x.fillStyle=CREAM;x.fillText("Our 3D digital menu",tx,qy-14);x.font=`500 29px Poppins,sans-serif`;x.globalAlpha=.9;wrapT(x,"Show your parents our dishes before you come — then book their table.",W-tx-m).forEach((l,i)=>x.fillText(l,tx,qy+36+i*38));x.globalAlpha=1;
    footer(H-170,170,30);
  }else{const lx=130;
    logoDisc(x,logo,lx+140,250,140);x.font=`175px "Great Vibes","Brush Script MT",cursive`;x.fillStyle=gold(x,110,300);x.fillText(B.name||"Joshi's Corner",lx+340,290);x.font=`600 36px Poppins,sans-serif`;x.fillStyle=CREAM;x.fillText(B.tagline||"",lx+348,350);
    x.font="700 34px Poppins,sans-serif";const pw=x.measureText(C.eyebrow).width+75;pill(x,C.eyebrow,lx+348+pw/2,425,34);
    let y=575;for(const [t,fs,col] of [[C.line1,100,"c"],[C.line2,108,"g"],[C.line3,82,"c"],[C.line4,140,"g"]]){const sz=fitLine(x,t,1200,fs,hFont);x.font=hFont(sz);x.save();x.shadowColor="rgba(0,0,0,.55)";x.shadowBlur=22;x.fillStyle=col==="g"?gold(x,y-sz,y+sz*.2):CREAM;x.fillText(t,lx,y);x.restore();y+=sz*1.12+(t===C.line3?34:0)}
    stepRow(x,C.steps,1700,2540,300,108,34);
    thought(x,C,1400,670,1380,370,29);
    const qs=470;drawQR(x,qr,3225,350,qs,logo);x.textAlign="center";x.font=`96px "Great Vibes","Brush Script MT",cursive`;x.fillStyle=gold(x,640,780);x.fillText("Scan & explore",3225,745);x.font=`700 44px Poppins,sans-serif`;x.fillStyle=CREAM;x.fillText("Our 3D digital menu",3225,815);x.font=`500 32px Poppins,sans-serif`;x.globalAlpha=.9;x.fillText("Preview the dishes with your parents",3225,865);x.globalAlpha=1;x.textAlign="left";
    footer(H-150,150,34);
  }
  return cv}
window.FamArt={render:render2,SIZES,DEF};
})();
