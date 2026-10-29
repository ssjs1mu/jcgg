/* “Parents' Week” artwork — drawn on a canvas in every kit size (standee, banner, poster 1.5×2 ft, A4, A5, Instagram, Facebook) and four vibrant
   gradient colour sets (js/kitdef.js).  Tree logo, growth infographic, the thought behind the promotion and the digital-menu QR (Mezzanine by default)
   with the tree logo in its centre.  Pure drawing code (no app dependencies).  window.FamArt.render(canvas, sizeId, {brand,cfg,logo,pal,scale}) */
(()=>{
const K=window.KIT;let P=K.PALS[0];const GREEN="#2F8F4E";
const ACC=()=>P.acc[1];
const MEZZ="https://ssjs1mu.github.io/mezzanine/",GROUND="https://ssjs1mu.github.io/menu/";
const DEF={line1:"Bring your parents",line2:"3 weeks in a row.",line3:"The 4th week,",line4:"they dine on us!",
  eyebrow:"FAMILY ASSOCIATION PROGRAMME",thoughtTitle:"Why we do this",
  thought:"They ate last so that we could eat first. They counted every rupee so that we never had to. Once a week, give them a table, a smile and your time — and on the fourth, let us serve the ones who served you.",
  punch:"Roots feed the tree. Honour yours.",minAge:60,days:"Monday to Friday",qr:"mezz",menuUrl:GROUND,mezzUrl:MEZZ,
  steps:[["WEEK 1","Dine with your parents"],["WEEK 2","Come back with them"],["WEEK 3","Make it three in a row"],["WEEK 4","They dine on us"]]};
const SH=(x,f)=>{x.save();x.shadowColor="rgba(30,0,25,.75)";x.shadowBlur=14;f();x.restore()};
const rr=(x,X,Y,W,H,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+W,Y,X+W,Y+H,r);x.arcTo(X+W,Y+H,X,Y+H,r);x.arcTo(X,Y+H,X,Y,r);x.arcTo(X,Y,X+W,Y,r);x.closePath()};
const wrapT=(x,t,w)=>{const out=[];let l="";for(const wd of String(t||"").split(/\s+/)){const q=l?l+" "+wd:wd;if(x.measureText(q).width>w&&l){out.push(l);l=wd}else l=q}if(l)out.push(l);return out};
const gold=(x,y0,y1)=>{const g=x.createLinearGradient(0,y0,0,y1);g.addColorStop(0,P.acc[0]);g.addColorStop(.45,P.acc[1]);g.addColorStop(1,P.acc[2]);return g};
const loadImg=src=>new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});
let QP;const qrLib=()=>QP??=new Promise((ok,no)=>{if(window.qrcode)return ok(window.qrcode);const s=document.createElement("script");s.src=window.FAMART_QR||"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=()=>ok(window.qrcode);s.onerror=()=>{QP=null;no(new Error("Could not load the QR library"))};document.head.appendChild(s)});
const FONTS=['900 40px "Playfair Display"','italic 800 40px "Playfair Display"','40px "Great Vibes"','500 20px Poppins','600 20px Poppins','700 20px Poppins','800 20px Poppins'];
const SCRIPT=s=>`${s}px "Great Vibes","Brush Script MT",cursive`,SERIF=s=>`900 ${s}px "Playfair Display",Georgia,serif`,SANS=(w,s)=>`${w} ${s}px Poppins,sans-serif`;
// ---------- pieces ----------
function background(x,W,H){const land=W>H*1.4;const g=land?x.createLinearGradient(0,0,W,H*.7):x.createLinearGradient(W*.2,0,W*.8,H);
  [0,.36,.7,1].forEach((s,i)=>g.addColorStop(s,P.bg[i]));x.fillStyle=g;x.fillRect(0,0,W,H);const m=Math.min(W,H);
  x.save();x.strokeStyle=ACC();for(const [cx,cy,R] of land?[[W*.02,H*.98,H*.95],[W*.98,H*.02,H*.8]]:[[W*.02,H*.99,m*.95],[W*.98,H*.1,m*.7]])for(let r=R*.12;r<R;r+=R*.085){x.globalAlpha=.06+.09*(1-r/R);x.lineWidth=Math.max(2,R*.006);x.beginPath();x.arc(cx,cy,r,0,7);x.stroke()}x.restore();
  const gl=x.createRadialGradient(W*.5,H*(land?.45:.3),0,W*.5,H*(land?.45:.3),Math.max(W,H)*.5);gl.addColorStop(0,"rgba(255,230,140,.16)");gl.addColorStop(1,"rgba(255,230,140,0)");x.fillStyle=gl;x.fillRect(0,0,W,H);
  x.save();for(let i=0;i<70;i++){const px=(Math.sin(i*91.7)*.5+.5)*W,py=(Math.cos(i*37.3)*.5+.5)*H,pr=m*(.003+((i*13)%7)/1400);x.globalAlpha=.22+((i*7)%5)/14;x.beginPath();x.arc(px,py,pr,0,7);x.fillStyle=i%3?ACC():"#fff";x.fill()}x.restore();
  x.strokeStyle=ACC();x.lineWidth=m*.004;x.strokeRect(m*.02,m*.02,W-m*.04,H-m*.04);x.globalAlpha=.45;x.strokeRect(m*.03,m*.03,W-m*.06,H-m*.06);x.globalAlpha=1}
function logoDisc(x,logo,cx,cy,r){x.save();x.shadowColor="rgba(0,0,0,.5)";x.shadowBlur=r*.35;x.shadowOffsetY=r*.1;x.beginPath();x.arc(cx,cy,r+r*.1,0,7);x.fillStyle=gold(x,cy-r,cy+r);x.fill();x.restore();
  x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.fillStyle="#fff";x.fill();x.clip();if(logo){const k=Math.min(2*r*.9/logo.width,2*r*.9/logo.height);x.drawImage(logo,cx-logo.width*k/2,cy-logo.height*k/2,logo.width*k,logo.height*k)}x.restore()}
function pill(x,text,cx,cy,fs){x.font=SANS(700,fs);const w=x.measureText(text).width+fs*2.2,h=fs*2;rr(x,cx-w/2,cy-h/2,w,h,h/2);x.fillStyle="rgba(8,4,24,.32)";x.fill();x.strokeStyle=ACC();x.lineWidth=fs*.07;x.stroke();x.fillStyle=ACC();x.textAlign="center";x.textBaseline="middle";x.fillText(text,cx,cy+fs*.04);x.textAlign="left";x.textBaseline="alphabetic";return w}
function fitLine(x,text,maxW,fs,font){let s=fs;x.font=font(s);while(x.measureText(text).width>maxW&&s>16){s-=3;x.font=font(s)}return s}
// the brand name: script font, fitted to the width available; returns {w,size}
function brandName(x,name,X,baseline,maxW,fs){const s=fitLine(x,name,maxW,fs,SCRIPT);x.font=SCRIPT(s);x.fillStyle=gold(x,baseline-s*.9,baseline+s*.25);x.fillText(name,X,baseline);return {w:x.measureText(name).width,size:s}}
function leaf(x,cx,cy,len,ang,col){x.save();x.translate(cx,cy);x.rotate(ang);x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(len*.5,-len*.42,len,0);x.quadraticCurveTo(len*.5,len*.42,0,0);x.fillStyle=col;x.fill();x.restore()}
function icon(x,k,cx,cy,r){x.save();x.lineCap="round";const g1=GREEN,g2="#57B26B";
  if(k===0){x.strokeStyle=g1;x.lineWidth=r*.09;x.beginPath();x.moveTo(cx,cy+r*.5);x.quadraticCurveTo(cx,cy,cx,cy-r*.15);x.stroke();leaf(x,cx,cy-r*.1,r*.62,-.55,g2);leaf(x,cx,cy+r*.02,r*.55,Math.PI+.55,g1)}
  else if(k===1){x.strokeStyle=g1;x.lineWidth=r*.1;x.beginPath();x.moveTo(cx,cy+r*.56);x.lineTo(cx,cy-r*.45);x.stroke();for(const [dy,s,a] of [[.3,.5,-.5],[.1,.55,Math.PI+.5],[-.12,.5,-.6],[-.3,.45,Math.PI+.6]])leaf(x,cx,cy+r*dy,r*s,a,dy>0?g1:g2)}
  else if(k===2){x.fillStyle="#8A5A2B";rr(x,cx-r*.07,cy+r*.05,r*.14,r*.52,r*.04);x.fill();for(const [dx,dy,rad,c] of [[-.26,0,.3,g1],[.26,0,.3,g1],[0,-.2,.36,g2],[-.12,-.38,.27,g2],[.14,-.36,.26,g1]]){x.beginPath();x.arc(cx+dx*r,cy+dy*r,rad*r,0,7);x.fillStyle=c;x.fill()}}
  else{const s=r*.62;x.fillStyle="#C4172A";x.beginPath();x.moveTo(cx,cy+s*.85);x.bezierCurveTo(cx-s*1.5,cy-s*.2,cx-s*.55,cy-s*1.25,cx,cy-s*.4);x.bezierCurveTo(cx+s*.55,cy-s*1.25,cx+s*1.5,cy-s*.2,cx,cy+s*.85);x.fill();x.fillStyle="rgba(255,255,255,.4)";x.beginPath();x.ellipse(cx-s*.5,cy-s*.35,s*.18,s*.1,-.6,0,7);x.fill()}
  x.restore()}
// 4 growth medallions joined by a vine.  caps=false → only “WEEK n” under each (small sizes).  Returns the bottom y.
function stepRow(x,steps,x0,x1,cy,r,fs,caps=true){const n=4,dx=(x1-x0)/(n-1);const xs=[...Array(n)].map((_,i)=>x0+dx*i);const R4=r*1.28;
  for(let i=0;i<n-1;i++){x.save();x.setLineDash([r*.16,r*.14]);x.strokeStyle=ACC();x.lineWidth=r*(.07+i*.03);x.beginPath();x.moveTo(xs[i]+r*1.12,cy);x.lineTo(xs[i+1]-(i+1===3?R4:r)*1.14,cy);x.stroke();x.restore()}
  xs.forEach((cx,i)=>{const last=i===3;const R=last?R4:r;
    if(last){x.save();x.translate(cx,cy);for(let k=0;k<16;k++){x.rotate(Math.PI/8);x.beginPath();x.moveTo(0,0);x.lineTo(R*1.14,-R*.07);x.lineTo(R*1.14,R*.07);x.fillStyle=ACC();x.globalAlpha=.3;x.fill()}x.restore()}
    x.save();x.shadowColor="rgba(0,0,0,.5)";x.shadowBlur=R*.3;x.shadowOffsetY=R*.08;x.beginPath();x.arc(cx,cy,R+R*.09,0,7);x.fillStyle=gold(x,cy-R,cy+R);x.fill();x.restore();
    const g=x.createRadialGradient(cx,cy-R*.3,R*.1,cx,cy,R);g.addColorStop(0,"#FFFFFF");g.addColorStop(1,last?"#FFE9A8":"#FFF6E0");x.beginPath();x.arc(cx,cy,R,0,7);x.fillStyle=g;x.fill();icon(x,i,cx,cy,R);
    x.textAlign="center";const ly=cy+R*1.1+fs*1.55;x.fillStyle=gold(x,ly-fs,ly+fs*.3);x.font=SANS(800,fs*1.1);x.fillText(steps[i][0],cx,ly);
    if(caps){x.fillStyle=P.ink;x.font=SANS(500,fs*.9);wrapT(x,steps[i][1],dx*.92).slice(0,2).forEach((l,j)=>x.fillText(l,cx,ly+fs*1.35+j*fs*1.15))}x.textAlign="left";
    if(last){const w=R*1.8,h=fs*1.55;x.save();x.translate(cx,cy-R*1.22);x.rotate(-.06);rr(x,-w/2,-h/2,w,h,h/2);x.fillStyle=P.rib;x.fill();x.fillStyle="#fff";x.font=SANS(800,fs*.9);x.textAlign="center";x.textBaseline="middle";x.fillText(caps?"COMPLIMENTARY":"ON US",0,fs*.04);x.restore();x.textBaseline="alphabetic"}});
  return cy+R4*1.1+fs*1.55+(caps?fs*1.35+fs*2.3:fs*.6)}
function panel(x,X,Y,W,H,r,lw){rr(x,X,Y,W,H,r);x.fillStyle="rgba(8,4,24,.36)";x.fill();x.strokeStyle=ACC();x.globalAlpha=.8;x.lineWidth=lw;x.stroke();x.globalAlpha=1}
function tiles(x,items,X,Y,W,H,gap,fs){const n=items.length,w=(W-gap*(n-1))/n;items.forEach(([big,cap],i)=>{const tx=X+i*(w+gap);panel(x,tx,Y,w,H,fs*.8,fs*.07);
    x.textAlign="center";let bs=fs*3.1;x.font=SERIF(bs);while(x.measureText(big).width>w*.86&&bs>20){bs-=3;x.font=SERIF(bs)}x.fillStyle=gold(x,Y+H*.1,Y+H*.55);x.fillText(big,tx+w/2,Y+H*.48);
    x.fillStyle=P.ink;x.font=SANS(600,fs*.92);wrapT(x,cap,w*.86).slice(0,3).forEach((l,j)=>x.fillText(l,tx+w/2,Y+H*.48+fs*1.6+j*fs*1.2));x.textAlign="left"})}
// thought box: title, text and punch line all fitted inside the box
function thought(x,C,X,Y,W,H,fs){panel(x,X,Y,W,H,fs*1.1,fs*.07);const p=fs*1.4;const tw=W-2*p;
  let f=fs;const lay=()=>{x.font=SCRIPT(f*2.9);const th=f*3.8;x.font=SANS(500,f);const ls=wrapT(x,C.thought,tw);x.font=`italic 800 ${f*1.2}px "Playfair Display",Georgia,serif`;const ps=wrapT(x,"“"+C.punch+"”",tw);return {th,ls,ps,h:p+th+ls.length*f*1.48+f*.5+ps.length*f*1.55+p*.8}};
  let L=lay();while(L.h>H&&f>14){f-=1;L=lay()}
  x.font=SCRIPT(f*2.9);x.fillStyle=gold(x,Y+p,Y+p+f*3);x.fillText(C.thoughtTitle,X+p,Y+p+f*2.3);
  let y=Y+p+L.th+f*.4;x.font=SANS(500,f);x.fillStyle=P.ink;for(const l of L.ls){x.fillText(l,X+p,y);y+=f*1.48}
  y+=f*.5;x.font=`italic 800 ${f*1.2}px "Playfair Display",Georgia,serif`;x.fillStyle=gold(x,y-f,y+f*2);for(const l of L.ps){x.fillText(l,X+p,y);y+=f*1.55}return y}
function drawQR(x,qr,cx,cy,size,logo){const n=qr.getModuleCount(),pad=size*.07,Pw=size+pad*2;x.save();x.shadowColor="rgba(0,0,0,.45)";x.shadowBlur=size*.06;x.shadowOffsetY=size*.02;rr(x,cx-Pw/2,cy-Pw/2,Pw,Pw,Pw*.07);x.fillStyle="#fff";x.fill();x.restore();
  const m=size/n,X0=cx-size/2,Y0=cy-size/2,hole=size*.135;const g=x.createLinearGradient(X0,Y0,X0+size,Y0+size);g.addColorStop(0,P.qr[0]);g.addColorStop(1,P.qr[1]);x.fillStyle=g;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){if(!qr.isDark(r,c))continue;const mx=X0+c*m+m/2,my=Y0+r*m+m/2;if(Math.hypot(mx-cx,my-cy)<hole*1.55)continue;rr(x,X0+c*m+m*.04,Y0+r*m+m*.04,m*.92,m*.92,m*.3);x.fill()}
  x.beginPath();x.arc(cx,cy,hole*1.4,0,7);x.fillStyle="#fff";x.fill();x.lineWidth=m*.3;x.strokeStyle=ACC();x.stroke();
  if(logo){x.save();x.beginPath();x.arc(cx,cy,hole*1.3,0,7);x.clip();const k=Math.min(2*hole*1.3*.95/logo.width,2*hole*1.3*.95/logo.height);x.drawImage(logo,cx-logo.width*k/2,cy-logo.height*k/2,logo.width*k,logo.height*k);x.restore()}return Pw}
// one or two QR plates side by side (Mezzanine / Ground floor), each with its label underneath.  Returns {w,h}
function qrBlock(x,list,cx,top,qs,logo,lfs){const n=list.length,Pw=qs*1.14,gap=Pw*.12,tot=n*Pw+(n-1)*gap;const cy=top+Pw/2;
  list.forEach((q,i)=>{const c=cx-tot/2+Pw/2+i*(Pw+gap);drawQR(x,q.qr,c,cy,qs,logo);if(lfs){x.textAlign="center";const s=fitLine(x,q.label,Pw*1.02,lfs,s=>SANS(700,s));x.font=SANS(700,s);x.fillStyle=P.ink;x.fillText(q.label,c,top+Pw+s*1.6);x.textAlign="left"}});
  return {w:tot,h:Pw+(lfs?lfs*2.2:0)}}
function footer(x,W,Y,H2,fs,info,T){x.fillStyle="rgba(0,0,0,.55)";x.fillRect(0,Y,W,H2);x.fillStyle=gold(x,Y,Y+H2);x.fillRect(0,Y,W,fs*.14);x.textAlign="center";x.fillStyle="#fff";
  const z=fitLine(x,info,W*.94,fs,q=>SANS(600,q));x.font=SANS(600,z);x.fillText(info,W/2,Y+H2*(T?.4:.58));
  if(T){const tf=fs*.74;x.font=SANS(400,tf);x.fillStyle=P.ink;x.globalAlpha=.88;const ls=wrapT(x,T,W*.92);ls.slice(0,2).forEach((l,i)=>x.fillText(l,W/2,Y+H2*.4+fs*1.45+i*tf*1.25));x.globalAlpha=1}x.textAlign="left"}
function headline(x,C,W,y,m,sizes,adv,align="c",X=0){const lines=[[C.line1,sizes[0],"c"],[C.line2,sizes[1],"g"],[C.line3,sizes[2],"c"],[C.line4,sizes[3],"g"]];
  for(let i=0;i<4;i++){const [t,fs,col]=lines[i];const s=fitLine(x,t,W-2*m,fs,SERIF);x.font=SERIF(s);x.save();x.shadowColor="rgba(0,0,0,.55)";x.shadowBlur=s*.2;x.fillStyle=col==="g"?gold(x,y-s*.85,y+s*.2):P.ink;if(align==="c"){x.textAlign="center";x.fillText(t,X+W/2,y)}else{x.textAlign="left";x.fillText(t,X+m,y)}x.restore();x.textAlign="left";const nx=lines[i+1]?lines[i+1][1]:s;y+=Math.max(s,nx*.8)*adv}return y}
const tilesData=C=>[["3","weeks with your parents"],["1","complimentary dine-in for them"],[(C.days.match(/^(\w{3})\w*\s+to\s+(\w{3})/i)?.slice(1,3).join("–"))||"Mon–Fri","at a time that suits them"]];
// ---------- layouts ----------
const LAYOUT={
stand(x,W,H,e){const {C,B,logo,qrs,info,T}=e;const m=W*.07;
  logoDisc(x,logo,W/2,150,105);x.textAlign="center";const bn=fitLine(x,B.name,W-2*m,125,SCRIPT);x.font=SCRIPT(bn);x.fillStyle=gold(x,270,420);x.fillText(B.name,W/2,408);x.font=SANS(600,28);x.fillStyle=P.ink;x.globalAlpha=.92;x.fillText(B.tagline||"",W/2,408+bn*.56);x.globalAlpha=1;x.textAlign="left";
  pill(x,C.eyebrow,W/2,408+bn*.56+72,28);
  let y=headline(x,C,W,408+bn*.56+185,m,[90,96,74,124],1.16);
  y=stepRow(x,C.steps,m+125,W-m-125,y+105,84,29);
  tiles(x,tilesData(C),m,y+4,W-2*m,225,22,30);y+=4+225+34;
  const n=qrs.length,qs=n>1?230:290,bh=qs*1.14+40+34;const th=H-170-y-bh-26;
  thought(x,C,m,y,W-2*m,th,36);
  const qy=y+th+26;const bl=qrBlock(x,qrs,m+(qs*1.14*n+(n-1)*qs*.137)/2,qy,qs,logo,24);const tx=m+bl.w+44;x.textAlign="left";
  x.font=SCRIPT(76);x.fillStyle=gold(x,qy,qy+90);SH(x,()=>x.fillText("Scan & explore",tx,qy+84));x.font=SANS(700,34);x.fillStyle=P.ink;x.fillText(n>1?"Our 3D digital menus":"Our 3D digital menu",tx,qy+140);x.font=SANS(500,26);x.globalAlpha=.92;wrapT(x,"Show your parents our dishes before you come — then book their table.",W-tx-m).slice(0,3).forEach((l,i)=>x.fillText(l,tx,qy+184+i*34));x.globalAlpha=1;
  footer(x,W,H-170,170,30,info,T)},
poster(x,W,H,e){const {C,B,logo,qrs,info,T}=e;const m=60;const FH=H>1650?130:120;
  logoDisc(x,logo,150,135,78);const nx=265;const bn=brandName(x,B.name,nx,150,W-nx-m,112);x.font=SANS(600,26);x.fillStyle=P.ink;x.globalAlpha=.92;x.fillText(B.tagline||"",nx+bn.size*.3,150+bn.size*.56);x.globalAlpha=1;
  x.font=SANS(700,24);const pw=x.measureText(C.eyebrow).width+53;pill(x,C.eyebrow,nx+bn.size*.3+pw/2,150+bn.size*.56+62,24);
  let y=headline(x,C,W,150+bn.size*.56+175,m,[78,84,62,108],1.16);
  y=stepRow(x,C.steps,m+110,W-m-110,y+78,70,24);
  const top=y+22,bot=H-FH-26,bh=Math.max(300,bot-top);const n=qrs.length;const gap=26;const cw=n>1?400:370;const tw=W-2*m-gap-cw;
  thought(x,C,m,top,tw,bh,25);
  const qs=Math.min(n>1?160:268,(bh-96)/1.14-34);const cx=m+tw+gap+cw/2;x.textAlign="center";x.font=SCRIPT(62);x.fillStyle=gold(x,top,top+70);SH(x,()=>x.fillText("Scan & explore",cx,top+52));x.textAlign="left";
  qrBlock(x,qrs,cx,top+84+(bh-84-(qs*1.14+46))/2,qs,logo,20);
  footer(x,W,H-FH,FH,27,info,T)},
square(x,W,H,e){const {C,B,logo,qrs,info}=e;const m=56;
  logoDisc(x,logo,120,92,52);const nx=192;const bn=brandName(x,B.name,nx,100,W-nx-m,92);x.font=SANS(600,22);x.fillStyle=P.ink;x.globalAlpha=.92;x.fillText(B.tagline||"",nx+bn.size*.3,100+bn.size*.56);x.globalAlpha=1;
  const py=100+bn.size*.56+54;pill(x,C.eyebrow,W/2,py,19);
  let y=headline(x,C,W,py+92,m,[50,56,40,78],1.14);
  y=stepRow(x,C.steps,m+105,W-m-105,y+66,46,16,true);
  const n=qrs.length,qs=n>1?96:118,top=y+6,Pw=qs*1.14;
  const bl=qrBlock(x,qrs,m+(Pw*n+(n-1)*Pw*.12)/2,top,qs,logo,0);const tx=m+bl.w+32;
  x.font=SCRIPT(52);x.fillStyle=gold(x,top,top+60);SH(x,()=>x.fillText("Scan & explore",tx,top+44));x.font=SANS(700,23);x.fillStyle=P.ink;x.fillText(n>1?"Ground floor + Mezzanine menus":qrs[0].label,tx,top+80);
  x.font=`italic 800 ${24}px "Playfair Display",Georgia,serif`;x.fillStyle=gold(x,top+88,top+130);wrapT(x,"“"+C.punch+"”",W-tx-m).slice(0,2).forEach((l,i)=>x.fillText(l,tx,top+114+i*30));
  footer(x,W,H-84,84,22,info,"")},
wide(x,W,H,e){const {C,B,logo,qrs,info}=e;const m=48;
  logoDisc(x,logo,88,62,38);const nx=148;const bn=brandName(x,B.name,nx,72,520,66);x.font=SANS(600,17);x.fillStyle=P.ink;x.globalAlpha=.92;x.fillText(B.tagline||"",nx+bn.size*.3,72+bn.size*.56);x.globalAlpha=1;
  x.font=SANS(700,15);const pw=x.measureText(C.eyebrow).width+33;pill(x,C.eyebrow,nx+bn.size*.3+pw/2,72+bn.size*.56+38,15);
  let y=headline(x,C,W*.62,72+bn.size*.56+100,m,[40,44,32,58],1.1,"l",0);
  stepRow(x,C.steps,m+52,W*.62-m-4,y+50,27,12,false);
  const n=qrs.length,qs=n>1?112:224,cx=W*.8;const bl=qrBlock(x,qrs,cx,34,qs,logo,16);
  x.textAlign="center";x.font=SCRIPT(54);x.fillStyle=gold(x,34+bl.h,34+bl.h+60);SH(x,()=>x.fillText("Scan & explore",cx,34+bl.h+62));x.font=SANS(600,20);x.fillStyle=P.ink;x.globalAlpha=.92;x.fillText("Our 3D digital menu",cx,34+bl.h+96);x.globalAlpha=1;x.textAlign="left";
  footer(x,W,H-58,58,19,info,"")},
banner(x,W,H,e){const {C,B,logo,qrs,info,T}=e;const lx=130;
  logoDisc(x,logo,lx+140,250,140);const nx=lx+345;const bn=brandName(x,B.name,nx,292,1200-(nx-lx)+60,170);x.font=SANS(600,36);x.fillStyle=P.ink;x.fillText(B.tagline||"",nx+bn.size*.3,292+bn.size*.56);
  x.font=SANS(700,34);const pw=x.measureText(C.eyebrow).width+75;pill(x,C.eyebrow,nx+bn.size*.3+pw/2,292+bn.size*.56+66,34);
  let y=headline(x,C,1330,292+bn.size*.56+190,0,[96,104,80,136],1.1,"l",lx);
  stepRow(x,C.steps,1700,2540,300,108,34);
  thought(x,C,1400,670,1380,370,29);
  const n=qrs.length,qs=n>1?290:440;const cx=3225;const bl=qrBlock(x,qrs,cx,60,qs,logo,34);x.textAlign="center";const ty=60+bl.h+96;
  x.font=SCRIPT(90);x.fillStyle=gold(x,ty-70,ty+30);SH(x,()=>x.fillText("Scan & explore",cx,ty+20));x.font=SANS(700,40);x.fillStyle=P.ink;x.fillText(n>1?"Our 3D digital menus":"Our 3D digital menu",cx,ty+76);x.font=SANS(500,30);x.globalAlpha=.92;x.fillText("Preview the dishes with your parents",cx,ty+122);x.globalAlpha=1;x.textAlign="left";
  footer(x,W,H-150,150,34,info,T)}};
const LW={stand:1200,poster:1200,square:1080,wide:1200,banner:3600};
// ---------- main ----------
async function render(cv,kind,o){const S=K.SIZES.find(s=>s.id===kind)||K.SIZES[0];const pal=K.PALS.find(p=>p.id===o.pal)||K.PALS[0];const sc=o.scale||1;const C={...DEF,...(o.cfg||{})};if(!C.steps||C.steps.length!==4)C.steps=DEF.steps;const B=o.brand||{};
  try{await Promise.all(FONTS.map(f=>document.fonts?.load(f).catch(()=>0)));await document.fonts?.ready}catch(e){}
  const logo=await loadImg(o.logo);const lib=await qrLib();
  const want=C.qr==="both"?[["Ground floor menu",C.menuUrl||GROUND],["Mezzanine menu",C.mezzUrl||MEZZ]]:C.qr==="ground"?[["Ground floor menu",C.menuUrl||GROUND]]:[["Mezzanine menu",C.mezzUrl||MEZZ]];
  const qrs=want.map(([label,url])=>{const qr=lib(0,"H");qr.addData(url);qr.make();return {label,qr}});
  // everything below is synchronous, so the module-level palette is safe
  P=pal;const lw=LW[S.fam],lh=lw*S.h/S.w;cv.width=Math.round(S.w*sc);cv.height=Math.round(S.h*sc);const x=cv.getContext("2d");x.setTransform(cv.width/lw,0,0,cv.height/lh,0,0);
  const T=`Parents aged ${C.minAge}+ · dine-in only · ${C.days}, at a time that suits them · register your family at the counter · management reserves the right to amend`;
  const info=S.fam==="wide"||S.fam==="square"?[B.phone&&"Call "+B.phone,B.handle,"Parents "+C.minAge+"+ · "+(C.days.replace(/Monday to Friday/i,"Mon–Fri"))].filter(Boolean).join("   ·   "):[B.address,B.phone&&"Call "+B.phone,B.handle].filter(Boolean).join("   ·   ");
  background(x,lw,lh);LAYOUT[S.fam](x,lw,lh,{C,B,logo,qrs,info,T});return cv}
window.FamArt={render,DEF};
})();
