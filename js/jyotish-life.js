/* Life report — built automatically from the birth chart, no questions asked.
   • Report card: 12 life areas scored 1–10 from the house, its lord, occupants, Jupiter's aspect and the karaka (radar + bars)
   • Life timeline: Vimshottari maha-dasha bands from birth to 90, life stages, the marriage window and "now"
   • Stage-by-stage reading: childhood, teenage, education & early career, marriage, married life, present, next 5 / 15 years, later life
   • Relationships: marriage window (dasha + Jupiter/Saturn double transit), spouse, stability, classical separation and
     second-relationship indicators (read as tendencies, never as proof), children
   • Career, health (body areas, care periods, precautions), classical longevity class (Jaimini three pairs)
   • Numerology: life path, birth, destiny (Chaldean) numbers, personal years
   • 3-D sky view of the birth chart
   Everything is the classical reading of the chart, written for a lay reader; it is guidance, not certainty. */
(()=>{
const J=window.J,{esc}=J;const KK=()=>J.kundaliKit,AK=()=>J.astroKit;
const yrs=(a,b)=>(b-a)/(365.2425*864e5);const fd=d=>d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});const my=d=>d.toLocaleDateString("en-IN",{month:"short",year:"numeric"});
const PL={su:"Sun",mo:"Moon",ma:"Mars",me:"Mercury",ju:"Jupiter",ve:"Venus",sa:"Saturn",ra:"Rahu",ke:"Ketu"};
const SG=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const HT=["self, body & vitality","money, family & speech","courage, siblings & skills","home, mother, property & peace","children, studies & intelligence","work-load, rivals, debts & illness","marriage, partners & business","sudden events, longevity & hidden matters","luck, father, guru & higher learning","career, status & reputation","income, gains & friends","expenses, travel abroad & spirituality"];
const BODY=["head & brain","face, eyes, teeth & throat","shoulders, arms, lungs & ears","chest, heart & breasts","stomach, liver & upper abdomen","intestines, digestion & immunity","kidneys, lower back & reproductive health","reproductive organs, chronic & hidden ailments","hips, thighs & arterial health","knees, joints & bones","calves, ankles & circulation","feet, sleep & the eyes (left)"];
const PBODY={su:"heart, eyes, bones & blood pressure",mo:"mind, sleep, fluids & chest",ma:"blood, injuries, fevers, surgery & B.P.",me:"nerves, skin, speech & anxiety",ju:"liver, sugar, fat & cholesterol",ve:"kidneys, hormones, reproductive & sugar",sa:"joints, teeth, chronic pain & fatigue",ra:"poisoning, allergies, sudden & hard-to-diagnose issues",ke:"accidents, cuts, infections & surgeries"};
const PCARE={su:"Regular B.P. and heart checks; morning sunlight; avoid ego clashes with seniors.",mo:"Good sleep, calm mind, enough water; meditation helps.",ma:"Drive carefully, avoid fights and sharp tools; check blood and B.P.",me:"Reduce screen time and over-thinking; skin and nerve care.",ju:"Watch weight, sugar and liver; avoid rich, oily food.",ve:"Moderation in pleasures; check sugar and kidneys; stay hydrated.",sa:"Daily stretching or yoga for joints; don't ignore long-standing pain; dental care.",ra:"Avoid intoxicants and shortcuts; second opinion on unclear diagnoses.",ke:"Care against injuries and infections; be careful near water and fire."};
const BEN=["ju","ve","me","mo"],MAL=["sa","ma","ra","ke","su"];const ASP={sa:[3,7,10],ma:[4,7,8],ju:[5,7,9],ra:[5,7,9],ke:[5,7,9]};
const MOD=s=>s%3;// 0 movable 1 fixed 2 dual

J.jyLife=(R)=>{const g=R.gr,ls=R.ls,LORD=KK().LORD,birth=R.date,now=new Date(),DA=R.dasha.list;
  const lordOf=h=>LORD[(ls+h-1)%12];const inH=h=>Object.keys(g).filter(k=>g[k].house===h);
  const aspects=(k,h)=>[7,...(ASP[k]||[])].some(a=>((g[k].house+a-2)%12)+1===h);
  const afflicted=k=>["sa","ma","ra","ke"].some(m=>m!==k&&(g[m].sign===g[k].sign||(ASP[m]||[7]).concat(7).some(a=>(g[m].sign+a-1)%12===g[k].sign)));
  const pStr=k=>{const x=g[k];let s=0;if(x.dig==="ex")s+=2.5;else if(x.dig==="own")s+=2;else if(x.dig==="de")s-=2.5;if([1,4,7,10].includes(x.house))s+=1;if([5,9].includes(x.house))s+=1.2;if([6,8,12].includes(x.house))s-=1.5;if(afflicted(k))s-=1;if(x.nav===x.sign)s+=1;if(BEN.includes(k)&&g.ju.sign===x.sign&&k!=="ju")s+=.5;return s};
  const ok=k=>KK().natalGood(k,g[k].house,g[k].dig);
  const hScore=(h,kar)=>{let s=5+pStr(lordOf(h))*0.9;for(const k of inH(h)){if(BEN.includes(k))s+=1;else if(["sa","ma","ra","ke"].includes(k))s+=[3,6,10,11].includes(h)?.6:-1.2;else s+=.3}
    if(aspects("ju",h))s+=1;if(aspects("sa",h)&&![3,6,10,11].includes(h))s-=.6;if(kar)s+=pStr(kar)*.5;return Math.max(1,Math.min(10,Math.round(s*10)/10))};
  const AREAS=[["Self & vitality",1,"su"],["Wealth & family",2,"ju"],["Courage & skills",3,"ma"],["Home & property",4,"mo"],["Education & children",5,"ju"],["Health & resistance",6,"ma"],["Marriage & partnerships",7,R.b.gender==="f"?"ju":"ve"],["Longevity & stability",8,"sa"],["Luck & father",9,"su"],["Career & status",10,"sa"],["Income & gains",11,"ju"],["Peace & spirituality",12,"ke"]];
  const card=AREAS.map(([n,h,k])=>({n,h,s:hScore(h,k)}));
  // health: 6th is better when strong, 8th as longevity
  const ab=d=>Math.max(0,yrs(birth,d));
  const allAD=DA.flatMap(d=>d.ads.map(a=>({md:d.l,l:a.l,a:a.a,b:a.b}))).filter(x=>x.b>birth);
  const topicOf=k=>{const own=[...Array(12).keys()].filter(i=>lordOf(i+1)===k).map(i=>i+1);return {own,at:g[k].house}};
  const read=k=>{const t=topicOf(k);const good=ok(k);const own=t.own.length?` and rules your ${t.own.map(h=>ordinal(h)).join(" & ")} house (${t.own.map(h=>HT[h-1].split(",")[0]).join(", ")})`:"";return {good,txt:`${PL[k]} sits in your ${ordinal(t.at)} house (${HT[t.at-1]})${own}`}};
  // ---- marriage window (auto) ----
  const l7=lordOf(7),kar=R.b.gender==="f"?"ju":"ve";const s7=(ls+6)%12,sl7=g[l7].sign;
  const msig=k=>(k===l7?3:0)+(g[k].house===7?2:0)+(k===kar?2:0)+(k===lordOf(2)||k===lordOf(11)?1:0)+([2,11].includes(g[k].house)?1:0)+(LORD[g[k].sign]===l7?1:0)+(k==="ra"&&g.ra.house===7?1:0);
  const dt=date=>{const p=AK().positions(date);const tj=s=>[1,5,7,9].includes(((s-p.ju.sign+12)%12)+1),ts=s=>[1,3,7,10].includes(((s-p.sa.sign+12)%12)+1);return (tj(s7)||tj(sl7)?2:0)+(ts(s7)||ts(sl7)?1.5:0)};
  const mc=[];for(const d of DA)for(const a of d.ads){const sA=yrs(birth,a.a),eA=yrs(birth,a.b);if(eA<21||sA>36)continue;const mid=new Date((Math.max(a.a,birth)+ +a.b)/2);mc.push({md:d.l,l:a.l,a:a.a,b:a.b,sc:msig(d.l)*.7+msig(a.l)+dt(mid)-(sA>32?1:0)})}
  mc.sort((x,y)=>y.sc-x.sc);const mw=mc[0]||null;const mw2=mc.slice(1,3).sort((x,y)=>x.a-y.a);
  const married=mw&&mw.a<now;
  // ---- relationship indicators ----
  const ven=g.ve;const h7=inH(7);const RI=[];const addR=(c,t,w)=>{if(c)RI.push({t,w})};
  addR([6,8,12].includes(g[l7].house),`The 7th lord (${PL[l7]}) sits in the ${ordinal(g[l7].house)} house — partnership needs patience; distance, health or work pressure can come between the couple.`,2);
  addR(h7.some(k=>["sa","ma","ra","ke"].includes(k)),`${h7.filter(k=>["sa","ma","ra","ke"].includes(k)).map(k=>PL[k]).join(" & ")} in the 7th house — strong-willed partners; ego clashes need conscious handling.`,2);
  addR([1,2,4,7,8,12].includes(g.ma.house),`Mangal dosha (Mars in the ${ordinal(g.ma.house)} house from the ascendant) — classical texts advise matching charts before marriage; it reduces after age 28.`,1);
  addR(ven.dig==="de"||afflicted("ve"),`Venus is ${ven.dig==="de"?"debilitated":"under malefic influence"} — emotional fulfilment in marriage takes effort; misunderstandings over affection or money are possible.`,1.5);
  addR(aspects("sa",7)&&!h7.includes("sa"),`Saturn aspects the 7th house — marriage tends to be later, mature and duty-bound; coldness must be avoided.`,1);
  addR(g.ve.sign===g.ra.sign||g.ve.sign===g.ma.sign,`Venus joins ${g.ve.sign===g.ra.sign?"Rahu":"Mars"} — classical texts read strong desires and attraction outside routine; loyalty and open communication protect the relationship.`,1.5);
  addR(MOD(g[l7].sign)===2&&(g[l7].house===12||g.ve.house===12),`The 7th lord / Venus in a dual sign with a 12th-house link — classical texts mention the possibility of more than one significant relationship; this is a tendency, not a certainty.`,1.5);
  addR(g.ra.house===7||g.ke.house===7,`${g.ra.house===7?"Rahu":"Ketu"} on the marriage axis — unconventional partner or unusual circumstances around marriage.`,1);
  const rw=RI.reduce((s,x)=>s+x.w,0)-(card[6].s-5)*.5;const sepRisk=rw>=5?"High":rw>=2.5?"Moderate":"Low";
  const stabT=sepRisk==="Low"?"Strong — a stable, supportive marriage is indicated.":sepRisk==="Moderate"?"Moderate — a good marriage with periodic friction; patience and open talk keep it strong.":"Needs care — friction or separation phases are indicated; counselling, chart-matching and remedies are strongly advised.";
  // separation-prone periods after marriage (dasha of 6/8/12 lords or Rahu/Ketu with 7th affliction)
  const badL=new Set([lordOf(6),lordOf(8),lordOf(12)]);const strainP=married||mw?allAD.filter(x=>x.a>(mw?mw.b:now)&&yrs(birth,x.a)<70&&(badL.has(x.l)&&(badL.has(x.md)||["ra","ke","sa","ma"].includes(x.md)))).slice(0,4):[];
  // children
  const l5=lordOf(5);const c5=hScore(5,"ju");const childP=allAD.filter(x=>mw&&x.a>=mw.a&&yrs(birth,x.a)<45&&(x.l===l5||x.l==="ju"||g[x.l].house===5||x.md===l5)).slice(0,3);
  const childT=c5>=6.5?"Good indications for children; they bring happiness and support.":c5>=4.5?"Children are indicated; some delay or worry around their health/studies is possible.":"Delay or concern around progeny is indicated; medical guidance and remedies for Jupiter and the 5th lord help.";
  // ---- career ----
  const l10=lordOf(10);const c10=[...new Set([l10,...inH(10)])];const F={su:"government, administration, leadership, medicine",mo:"hospitality, food, travel, nursing, public dealing",ma:"engineering, police/defence, real estate, sports, surgery",me:"business, trading, accounts, IT, writing, communication",ju:"teaching, finance, law, advisory, banking, religion",ve:"arts, fashion, beauty, luxury goods, hospitality, media",sa:"industry, labour-intensive work, oil/iron, long-term service",ra:"technology, foreign companies, research, politics, speculation",ke:"research, spirituality, coding, healing, astrology"};
  const goodC=new Set([l10,lordOf(11),lordOf(2),lordOf(9),...inH(10),...inH(11)]);
  const careerP=allAD.filter(x=>x.b>now&&yrs(now,x.a)<20).map(x=>({...x,g:goodC.has(x.l)&&!badL.has(x.l)?1:badL.has(x.l)&&!goodC.has(x.l)?-1:0}));
  // ---- health ----
  const weakH=[1,6,8].map(h=>({h,s:hScore(h)})).sort((a,b)=>a.s-b.s);const affSigns=[...new Set([...inH(6),...inH(8),...inH(1)].filter(k=>["sa","ma","ra","ke"].includes(k)))];
  const bodyAreas=[...new Set([BODY[(g[lordOf(6)].house-1)],BODY[g[lordOf(8)].house-1],...affSigns.map(k=>BODY[g[k].house-1])])].slice(0,4);
  const pAreas=[...new Set([lordOf(6),lordOf(8),...affSigns])].map(k=>PBODY[k]).slice(0,4);
  const mar=[lordOf(2),lordOf(7)];const careP=allAD.filter(x=>x.b>now&&yrs(now,x.a)<25&&((badL.has(x.l)&&badL.has(x.md))||(mar.includes(x.l)&&[lordOf(8),"sa","ra"].includes(x.md)))).slice(0,5);
  const prec=[...new Set([lordOf(6),lordOf(8),...affSigns,...Object.keys(g).filter(k=>pStr(k)<-1)])].slice(0,5).map(k=>`${PL[k]}: ${PCARE[k]}`);
  // ---- longevity (Jaimini three pairs) ----
  const pr=(a,b)=>{const x=MOD(a),y=MOD(b);if((x===0&&y===1)||(x===1&&y===0)||(x===2&&y===2))return 3;if((x===0&&y===0)||(x===1&&y===2)||(x===2&&y===1))return 2;return 1};
  const pairs=[pr(g[lordOf(1)].sign,g[lordOf(8)].sign),pr(ls,g.mo.sign),pr(g.sa.sign,g.mo.sign)];
  const cnt=[1,2,3].map(v=>pairs.filter(p=>p===v).length);let cls=cnt[2]>=2?3:cnt[1]>=2?2:cnt[0]>=2?1:(pairs[1]);
  const lgS=pStr(lordOf(1))+pStr(lordOf(8))*.5+(hScore(8)-5)*.4;
  const CLS={3:["Purnayu — long life","traditionally 70+ years; with care, a long and active old age is indicated",[72,90]],2:["Madhyayu — medium-to-long life","traditionally 60–80 years; disciplined health habits can extend it",[62,78]],1:["Alpayu reading (classical)","the classical pair method gives a short span, but for an adult already past it this simply means health must be guarded carefully — it is not a prediction",[55,70]]};
  let span=CLS[cls][2].slice();span=[Math.round(span[0]+lgS*1.5),Math.round(span[1]+lgS*1.5)];
  const ageNow=yrs(birth,now);if(span[0]<ageNow+5)span=[Math.ceil(ageNow+5),Math.max(Math.ceil(ageNow+15),span[1])];
  const h8=inH(8);const vuln=[`8th house in ${SG[(ls+7)%12]}: ${BODY[7]}${h8.length?" · "+h8.map(k=>PL[k]+" there points to "+PBODY[k]):""}`,`8th lord ${PL[lordOf(8)]} in the ${ordinal(g[lordOf(8)].house)} house: watch ${BODY[g[lordOf(8)].house-1]}`];
  // ---- stages ----
  const ST=[["Childhood",0,12],["Teenage",13,19],["Education & early career",20,mw?Math.max(21,Math.floor(ab(mw.a))):26],["Marriage",mw?Math.floor(ab(mw.a)):26,mw?Math.ceil(ab(mw.b)):28],["Married life & career build-up",mw?Math.ceil(ab(mw.b)):28,Math.max(35,Math.floor(ageNow))],["Present",Math.floor(ageNow),Math.floor(ageNow)+1],["Next 5 years",Math.floor(ageNow)+1,Math.floor(ageNow)+6],["Next 6–15 years",Math.floor(ageNow)+6,Math.floor(ageNow)+16],["Later life",Math.floor(ageNow)+16,85]].filter(s=>s[2]>s[1]||s[0]==="Present");
  const stageTxt=([n,a0,a1])=>{const A=new Date(birth.getTime()+a0*365.2425*864e5),B=new Date(birth.getTime()+a1*365.2425*864e5);const ds=allAD.filter(x=>x.b>A&&x.a<B);const mds=[...new Set(ds.map(x=>x.md))];
    const good=ds.filter(x=>ok(x.l)).length,bad=ds.length-good;const tone=good>bad*1.5?"mostly favourable":bad>good*1.5?"challenging, needs patience":"mixed — ups and downs";
    const themes=[...new Set(ds.map(x=>g[x.l].house))].slice(0,4).map(h=>HT[h-1].split(",")[0]);
    const past=B<now,cur=A<=now&&B>now;
    const extra=n==="Childhood"?(hScore(4,"mo")>=6?" Caring home atmosphere and mother's support.":" Some instability at home or in mother's health/attention is indicated."):n==="Teenage"?(hScore(5,"me")>=6?" Studies go well; sharp intelligence.":" Concentration in studies needs support; change of school/stream possible."):n==="Education & early career"?` Career direction: ${c10.map(k=>F[k]).join("; ")}.`:n==="Marriage"?" Marriage or a serious commitment is most strongly indicated in this window.":n==="Present"?" Running period: "+(()=>{const c=allAD.find(x=>x.a<=now&&x.b>now);return c?`${PL[c.md]}–${PL[c.l]} until ${my(c.b)} — ${read(c.l).txt}.`:""})():"";
    return {n,age:n==="Present"?`${Math.floor(ageNow)}`:`${a0}–${a1}`,when:`${my(A<birth?birth:A)} – ${my(B)}`,past,cur,dashas:mds.map(k=>PL[k]).join(" → "),tone,themes,txt:`${past?"This phase was":"This phase is"} ${tone}. Main themes: ${themes.join(", ")}.${extra}`}};
  const stages=ST.map(stageTxt);
  // ---- numerology ----
  const red=n=>{while(n>9&&![11,22,33].includes(n))n=String(n).split("").reduce((s,c)=>s+ +c,0);return n};
  const [Y,M,Dd]=R.b.date.split("-").map(Number);const lifePath=red(String(Y).split("").concat(String(M).split(""),String(Dd).split("")).reduce((s,c)=>s+ +c,0));const birthN=red(Dd);
  const CH={a:1,i:1,j:1,q:1,y:1,b:2,k:2,r:2,c:3,g:3,l:3,s:3,d:4,m:4,t:4,e:5,h:5,n:5,x:5,u:6,v:6,w:6,o:7,z:7,f:8,p:8};const nameN=red((R.b.name||"").toLowerCase().replace(/[^a-z]/g,"").split("").reduce((s,c)=>s+(CH[c]||0),0));
  const pyear=y=>red(red(M)+red(Dd)+red(y));const NM={1:"leadership, independence, new starts",2:"partnership, diplomacy, patience",3:"creativity, expression, social life",4:"hard work, structure, building foundations",5:"change, travel, freedom, sales",6:"family, responsibility, service, home",7:"study, research, spirituality, inner work",8:"money, power, business, karma",9:"completion, generosity, endings & new beginnings",11:"intuition, inspiration (master 11)",22:"master builder — big practical achievements",33:"master teacher — service and healing"};
  const PY=[0,1,2,3,4,5].map(i=>({y:now.getFullYear()+i,n:pyear(now.getFullYear()+i)}));
  const lucky={1:"Sunday · gold/orange",2:"Monday · white/silver",3:"Thursday · yellow",4:"Saturday · blue/grey",5:"Wednesday · green",6:"Friday · white/pink",7:"Monday · sea-green",8:"Saturday · dark blue/black",9:"Tuesday · red",11:"Monday · silver",22:"Saturday · blue",33:"Friday · pink"};
  return {card,mw,mw2,married,RI,stabT,sepRisk,strainP,childT,childP,c5,c10:c10.map(k=>F[k]),careerP,bodyAreas,pAreas,careP,prec,longevity:{cls:CLS[cls][0],note:CLS[cls][1],span,pairs},vuln,stages,num:{lifePath,birthN,nameN,PY,NM,lucky:lucky[lifePath]},read,PL,SG,HT,lordOf,ageNow,allAD}};
const ordinal=n=>n+(["th","st","nd","rd"][(n%100>10&&n%100<14)?0:n%10]||"th");J.jyOrdinal=ordinal;J.jyHouseTopics=HT;

// ---------- graphics ----------
function radar(card){const N=card.length,cx=170,cy=165,R=120;const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/N;return [cx+Math.cos(a)*R*v/10,cy+Math.sin(a)*R*v/10]};
  const grid=[2,4,6,8,10].map(v=>`<polygon points="${card.map((_,i)=>pt(i,v).join(",")).join(" ")}" fill="none" stroke="#E2B9A0" stroke-width="1"/>`).join("");
  const poly=card.map((c,i)=>pt(i,c.s).join(",")).join(" ");
  const lab=card.map((c,i)=>{const [x,y]=pt(i,12.2);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="lr-lab">${esc(c.n.split(" & ")[0])}</text>`}).join("");
  return `<svg viewBox="0 0 340 330" class="lr-radar" role="img" aria-label="Life areas radar">${grid}<polygon points="${poly}" fill="rgba(229,57,53,.28)" stroke="#B71C1C" stroke-width="2.5"/>${card.map((c,i)=>{const [x,y]=pt(i,c.s);return `<circle cx="${x}" cy="${y}" r="3.5" fill="#B71C1C"/>`}).join("")}${lab}</svg>`}
function bars(card){return `<div class="lr-bars">${card.map(c=>`<div class="lr-bar"><span>${esc(c.n)} <small>(H${c.h})</small></span><i><b style="width:${c.s*10}%;background:${c.s>=7?"#2E7D32":c.s>=5?"#F9A825":"#C62828"}"></b></i><em>${c.s.toFixed(1)}</em></div>`).join("")}</div>`}
function timeline(R,L){const birth=R.date,W=900,H=150,maxY=90,x=a=>20+a/maxY*(W-40);const COL={su:"#FB8C00",mo:"#90A4AE",ma:"#E53935",me:"#43A047",ju:"#FDD835",ve:"#EC407A",sa:"#3949AB",ra:"#6D4C41",ke:"#8D6E63"};
  const bands=R.dasha.list.filter(d=>d.b>birth).map(d=>{const a=Math.max(0,yrs(birth,d.a)),b=Math.min(maxY,yrs(birth,d.b));if(a>=maxY)return "";return `<rect x="${x(a)}" y="40" width="${x(b)-x(a)}" height="34" fill="${COL[d.l]}" opacity=".85"/><text x="${(x(a)+x(b))/2}" y="61" text-anchor="middle" class="lr-t">${L.PL[d.l]}</text>`}).join("");
  const ticks=[0,10,20,30,40,50,60,70,80,90].map(a=>`<line x1="${x(a)}" y1="76" x2="${x(a)}" y2="82" stroke="#7B1E1E"/><text x="${x(a)}" y="95" text-anchor="middle" class="lr-s">${a}</text>`).join("");
  const st=[["Child",0,12],["Teen",13,19],["Youth",20,30],["Adult",30,45],["Mid-life",45,60],["Senior",60,90]].map(([n,a,b],i)=>`<rect x="${x(a)}" y="104" width="${x(b)-x(a)}" height="18" fill="${i%2?"#FFE0B2":"#FFF3E0"}"/><text x="${(x(a)+x(b))/2}" y="117" text-anchor="middle" class="lr-s">${n}</text>`).join("");
  const now=L.ageNow,mw=L.mw?[yrs(birth,L.mw.a),yrs(birth,L.mw.b)]:null;
  const ls=L.longevity.span;
  return `<svg viewBox="0 0 ${W} ${H}" class="lr-tl" role="img" aria-label="Life timeline"><text x="20" y="18" class="lr-s">Maha-dasha periods by age</text>${bands}${ticks}${st}
   ${mw?`<rect x="${x(mw[0])}" y="30" width="${Math.max(4,x(mw[1])-x(mw[0]))}" height="54" fill="none" stroke="#C2185B" stroke-width="2.5" stroke-dasharray="4 3"/><text x="${x(mw[0])}" y="28" class="lr-s" fill="#C2185B">💍 marriage window</text>`:""}
   <line x1="${x(now)}" y1="26" x2="${x(now)}" y2="126" stroke="#000" stroke-width="2"/><text x="${x(now)+4}" y="${mw&&Math.abs(x(now)-x(mw[0]))<110?140:28}" class="lr-s">▼ now (${Math.floor(now)})</text>
   <rect x="${x(Math.min(ls[0],maxY))}" y="126" width="${Math.max(2,x(Math.min(ls[1],maxY))-x(Math.min(ls[0],maxY)))}" height="6" fill="#455A64" opacity=".5"/><text x="${x(Math.min(ls[0],maxY))}" y="146" class="lr-s">classical life-span band</text></svg>`}
function sky3d(R){const g=R.gr,ord=AK().ORDER;const C={su:"#FB8C00",mo:"#CFD8DC",ma:"#E53935",me:"#43A047",ju:"#FDD835",ve:"#F48FB1",sa:"#3949AB",ra:"#6D4C41",ke:"#A1887F"};
  const ring=SG.map((s,i)=>{const a=(i*30+15-90)*Math.PI/180;return `<text x="${200+Math.cos(a)*172}" y="${200+Math.sin(a)*172}" text-anchor="middle" dominant-baseline="middle" class="s3-sg">${s.slice(0,3)}</text><line x1="${200+Math.cos((i*30-90)*Math.PI/180)*150}" y1="${200+Math.sin((i*30-90)*Math.PI/180)*150}" x2="${200+Math.cos((i*30-90)*Math.PI/180)*190}" y2="${200+Math.sin((i*30-90)*Math.PI/180)*190}" stroke="#C9A227"/>`}).join("");
  const pl=ord.map((k,i)=>{const a=(g[k].lon-90)*Math.PI/180,r=60+i*9.5;return {k,x:200+Math.cos(a)*r,y:200+Math.sin(a)*r,r}});
  const asc=(R.asc-90)*Math.PI/180;
  return `<div class="s3"><div class="s3-stage"><svg viewBox="0 0 400 400" class="s3-disc"><defs>${ord.map(k=>`<radialGradient id="s3${k}" cx="35%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${C[k]}"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>`).join("")}</defs>
   <circle cx="200" cy="200" r="190" fill="#0D1B3E"/><circle cx="200" cy="200" r="150" fill="none" stroke="#C9A227"/>${ring}${pl.map(p=>`<circle cx="200" cy="200" r="${p.r}" fill="none" stroke="rgba(255,255,255,.08)"/>`).join("")}
   <line x1="200" y1="200" x2="${200+Math.cos(asc)*190}" y2="${200+Math.sin(asc)*190}" stroke="#FFD54F" stroke-width="2" stroke-dasharray="5 4"/><text x="${200+Math.cos(asc)*130}" y="${200+Math.sin(asc)*130}" class="s3-asc">ASC</text>
   <circle cx="200" cy="200" r="16" fill="url(#s3su)" opacity=".5"/>${pl.map(p=>`<g class="s3-p"><circle cx="${p.x}" cy="${p.y}" r="${p.k==="su"?11:p.k==="mo"?9:8}" fill="url(#s3${p.k})"/><text x="${p.x}" y="${p.y-13}" text-anchor="middle" class="s3-pl">${PL[p.k]}</text></g>`).join("")}</svg></div>
   <p class="hint" style="text-align:center;margin:6px 0 0">The sky at the moment of birth — signs on the outer ring, planets at their true longitudes, dashed line = ascendant. Tap to pause.</p></div>`}

// ---------- chart explanations ----------
J.jyChartTable=(R,base,mode)=>{const g=R.gr,LORD=KK().LORD;const sgOf=k=>mode==="d9"?g[k].nav:g[k].sign;const lordOf=h=>LORD[(base+h-1)%12];
  const rows=[...Array(12).keys()].map(i=>{const h=i+1,s=(base+i)%12;const occ=Object.keys(g).filter(k=>sgOf(k)===s);const lord=lordOf(h);const lh=((sgOf(lord)-base+12)%12)+1;
    const ben=occ.filter(k=>BEN.includes(k)),mal=occ.filter(k=>["sa","ma","ra","ke"].includes(k));const tone=ben.length>mal.length?"supported":mal.length>ben.length?([3,6,10,11].includes(h)?"energised (malefics do well here)":"under pressure"):occ.length?"mixed":[6,8,12].includes(lh)?"weak — its lord sits in a difficult house":[1,4,5,7,9,10].includes(lh)?"supported by a well-placed lord":"average";
    return `<tr><td class="num"><b>${h}</b></td><td>${SG[s]}</td><td>${occ.length?occ.map(k=>PL[k]+(g[k].retro?" ℞":"")).join(", "):"—"}</td><td>${PL[lord]} → H${lh}</td><td>${esc(mode==="d9"&&h===7?"spouse & dharma in marriage":mode==="d9"&&h===1?"inner self & destiny after 35":HT[i])} — <i>${tone}</i></td></tr>`}).join("");
  return `<table class="kun-tbl lr-ct"><thead><tr><th>House</th><th>Sign</th><th>Planets</th><th>Lord → placed in</th><th>Meaning here</th></tr></thead><tbody>${rows}</tbody></table>`};
J.jyChartNote={d1:"Lagna (birth) chart — the main chart for body, events and life direction. Read each house below: who sits there and where its lord goes decide how that area of life works out.",
  mo:"Chandra (Moon) chart — houses counted from the Moon. It shows the mind, emotions and how life feels from inside; transits and Sade-Sati are read from here.",
  d9:"Navamsa (D9) — the 'fruit' chart: marriage, spouse, inner strength and how promises of the birth chart mature after about age 35. A planet in the same sign in D1 and D9 (vargottama) is extra strong."};
J.jyDashaNote=(R,l)=>{const L=J.jyLife.cache;const r=L?L.read(l):null;return r?`${r.txt}. ${r.good?"Generally favourable.":"Needs care — results come after effort."}`:""};

// ---------- HTML ----------
J.jyLifeHtml=(R,part)=>{const L=J.jyLife(R);J.jyLife.cache=L;const P=L.PL;const li=a=>`<ul class="jy-l">${a.map(x=>`<li${x.c?` class="${x.c}"`:""}>${x.t??esc(x)}</li>`).join("")}</ul>`;
  const per=x=>`${my(x.a)} – ${my(x.b)} (age ${Math.floor(yrs(R.date,x.a))}–${Math.ceil(yrs(R.date,x.b))}) · ${P[x.md]}–${P[x.l]}`;
  const sec={
  card:`<section class="lr"><h3>📊 Life report card</h3><p class="hint">Each life area scored 1–10 from its house, the house lord's strength, planets in it, Jupiter's protective aspect and the natural significator. Green = strong, amber = average, red = needs remedies & effort.</p><div class="lr-card">${radar(L.card)}${bars(L.card)}</div></section>`,
  tl:`<section class="lr"><h3>🗓 Life timeline</h3>${timeline(R,L)}</section>`,
  sky:`<section class="lr"><h3>🌌 3-D birth sky</h3>${sky3d(R)}</section>`,
  stages:`<section class="lr"><h3>🧭 Life, stage by stage</h3><div class="lr-stages">${L.stages.map(s=>`<div class="lr-st ${s.cur?"cur":s.past?"past":"fut"}"><div class="lr-sh"><b>${esc(s.n)}</b><span>age ${esc(s.age)} · ${esc(s.when)}</span></div><div class="hint">Dasha: ${esc(s.dashas)}</div><p>${esc(s.txt)}</p></div>`).join("")}</div></section>`,
  rel:`<section class="lr"><h3>💞 Marriage & relationships</h3>${li([
      {t:L.mw?`<b>Marriage window:</b> ${esc(per(L.mw))}${L.mw2.length?` · also possible: ${L.mw2.map(x=>esc(per(x))).join("; ")}`:""}`:"<b>Marriage window:</b> not strongly marked between 21 and 36 — later or unconventional marriage."},
      {t:`<b>Spouse:</b> ${esc(SG[(R.ls+6)%12])} on the 7th — ${esc(KK().TX.en.lagna[(R.ls+6)%12])}`},
      {t:`<b>Stability:</b> ${esc(L.stabT)} <span class="chip ${L.sepRisk==="High"?"bad":L.sepRisk==="Moderate"?"warn":"ok"}">Separation risk: ${L.sepRisk}</span>`},
      ...L.RI.map(x=>({t:esc(x.t),c:"warn"})),
      ...(L.strainP.length?[{t:`<b>Periods that test the relationship:</b> ${L.strainP.map(x=>esc(per(x))).join("; ")}`,c:"warn"}]:[]),
      {t:`<b>Children:</b> ${esc(L.childT)}${L.childP.length?` Likely periods: ${L.childP.map(x=>esc(per(x))).join("; ")}.`:""}`}])}<p class="hint">Relationship indicators are classical tendencies, not verdicts — free will, upbringing and effort change outcomes.</p></section>`,
  car:`<section class="lr"><h3>💼 Career — present & future</h3>${li([{t:`<b>Best-suited fields:</b> ${esc(L.c10.join("; "))}`},...L.careerP.slice(0,8).map(x=>({t:`${esc(per(x))} — ${x.g>0?"growth, recognition, income rise":x.g<0?"pressure, change of job or setback; avoid big risks":"steady, routine progress"}`,c:x.g>0?"ok":x.g<0?"warn":""}))])}</section>`,
  hea:`<section class="lr"><h3>🩺 Health & precautions</h3>${li([{t:`<b>Body areas to watch:</b> ${esc(L.bodyAreas.join("; "))}`},{t:`<b>Planet-linked tendencies:</b> ${esc(L.pAreas.join("; "))}`},...(L.careP.length?[{t:`<b>Periods needing extra health care:</b> ${L.careP.map(x=>esc(per(x))).join("; ")}`,c:"warn"}]:[]),...L.prec.map(t=>({t:esc(t)}))])}</section>`,
  life:`<section class="lr"><h3>⏳ Longevity (classical Ayurdaya)</h3>${li([{t:`<b>${esc(L.longevity.cls)}</b> — ${esc(L.longevity.note)}.`},{t:`<b>Classical span band:</b> about ${L.longevity.span[0]}–${L.longevity.span[1]} years (three-pair method: lagna-lord/8th-lord, lagna/Moon, Saturn/Moon).`},...L.vuln.map(t=>({t:"<b>Areas the 8th house asks you to protect:</b> "+esc(t)}))])}<p class="hint">Classical longevity rules are traditional guidance only. Exact life span or cause of death cannot be known from a chart — regular medical check-ups, lifestyle and timely treatment matter far more.</p></section>`,
  num:`<section class="lr"><h3>🔢 Numerology</h3><div class="lr-num"><div><b>${L.num.lifePath}</b><span>Life path</span><small>${esc(L.num.NM[L.num.lifePath])}</small></div><div><b>${L.num.birthN}</b><span>Birth number</span><small>${esc(L.num.NM[L.num.birthN])}</small></div><div><b>${L.num.nameN}</b><span>Name (Chaldean)</span><small>${esc(L.num.NM[L.num.nameN])}</small></div></div>
     <p><b>Lucky day & colour:</b> ${esc(L.num.lucky||"")}</p><table class="kun-tbl"><thead><tr><th>Year</th><th>Personal year</th><th>Theme</th></tr></thead><tbody>${L.num.PY.map(p=>`<tr><td>${p.y}</td><td class="num"><b>${p.n}</b></td><td>${esc(L.num.NM[p.n])}</td></tr>`).join("")}</tbody></table></section>`};
  return (part||Object.keys(sec)).map(k=>sec[k]).join("")};
document.addEventListener("click",e=>{const s=e.target.closest?.(".s3-stage");if(s)s.classList.toggle("paused")});
const css=document.createElement("style");css.textContent=`.lr{margin:16px 0}.lr-card{display:grid;grid-template-columns:1fr;gap:10px}.lr-radar{width:100%;max-width:420px;margin:0 auto;display:block}.lr-lab{font-size:9.5px;fill:#7B1E1E;font-weight:600}
.lr-bars{display:grid;gap:5px}.lr-bar{display:grid;grid-template-columns:minmax(150px,1.2fr) 2fr 40px;gap:8px;align-items:center;font-size:13px}.lr-bar i{display:block;height:12px;background:#F5E6D3;border-radius:6px;overflow:hidden}.lr-bar b{display:block;height:100%;border-radius:6px}.lr-bar em{font-style:normal;font-weight:700;text-align:right}
.lr-tl{width:100%;height:auto}.lr-t{font-size:11px;font-weight:700;fill:#fff}.lr-s{font-size:10.5px;fill:#5D1A1A}
.lr-stages{display:grid;gap:8px}.lr-st{border:1px solid #E7C27D;border-left:5px solid #C9A227;border-radius:10px;padding:8px 12px;background:#FFFDF5}.lr-st.cur{border-left-color:#B71C1C;background:#FFF3E0}.lr-st.past{opacity:.92}.lr-st p{margin:4px 0 0}.lr-sh{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.lr-sh span{font-size:12px;color:#7B1E1E}
.lr-num{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px}.lr-num>div{border:1px solid #E7C27D;border-radius:12px;padding:10px;text-align:center;background:#FFF8E7}.lr-num b{font-size:30px;display:block;color:#B71C1C}.lr-num span{display:block;font-weight:600}.lr-num small{display:block;font-size:11.5px}
.lr-ct td,.lr-ct th{font-size:12.5px}.kun-chartblock{margin:14px 0}.kun-chartblock .kchart{max-width:440px;margin:0 auto}.kun-chartblock .hint{margin:6px 0}
.s3{margin:6px auto;max-width:460px}.s3-stage{perspective:900px;cursor:pointer}.s3-disc{width:100%;display:block;transform:rotateX(52deg);transform-style:preserve-3d;animation:s3spin 40s linear infinite;border-radius:50%;box-shadow:0 30px 40px rgba(0,0,0,.35)}.s3-stage.paused .s3-disc{animation-play-state:paused}
@keyframes s3spin{from{transform:rotateX(52deg) rotateZ(0)}to{transform:rotateX(52deg) rotateZ(360deg)}}.s3-sg{font-size:12px;fill:#FFE082;font-weight:700}.s3-pl{font-size:10px;fill:#fff;font-weight:600}.s3-asc{font-size:11px;fill:#FFD54F;font-weight:700}
@media (max-width:560px){.lr-bar{grid-template-columns:1fr 1.2fr 34px;font-size:12px}.lr-num{grid-template-columns:1fr}}
@media print{.s3-disc{animation:none;transform:none}}`;document.head.appendChild(css);
})();
