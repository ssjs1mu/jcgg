/* Panchang for the day, computed in the browser (no service, no subscription).
   Sun and Moon positions from Meeus' low-precision series (Moon: main periodic terms), Lahiri ayanamsa for sidereal
   positions, sunrise / sunset by the NOAA method for the business location (default Kolkata).
   Gives tithi, paksha, nakshatra, yoga, karana, vara with end times, sunrise / sunset, moonsign, Rahu kaal, Yamaganda,
   Gulika, Abhijit muhurat, Amanta and Purnimanta lunar month, Bengali solar month, Vikram and Shaka samvat, and
   daily Moon-transit (Chandra gochar) guidance for every rashi. Times are good to a few minutes. */
(()=>{
const R=Math.PI/180,n360=x=>((x%360)+360)%360;
const jd=d=>d.getTime()/864e5+2440587.5;
function sunLon(J){const T=(J-2451545)/36525;const L0=280.46646+36000.76983*T+0.0003032*T*T;const M=(357.52911+35999.05029*T-0.0001537*T*T)*R;
  const C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);const om=(125.04-1934.136*T)*R;return n360(L0+C-0.00569-0.00478*Math.sin(om))}
const MT=[[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487]];
function moonLon(J){const T=(J-2451545)/36525;const Lp=218.3164477+481267.88123421*T-0.0015786*T*T;const D=(297.8501921+445267.1114034*T-0.0018819*T*T)*R,M=(357.5291092+35999.0502909*T)*R,Mp=(134.9633964+477198.8675055*T+0.0087414*T*T)*R,F=(93.2720950+483202.0175233*T-0.0036539*T*T)*R;
  const E=1-0.002516*T;let s=0;for(const [d,m,mp,f,c] of MT){let k=c;if(m)k*=Math.abs(m)===2?E*E:E;s+=k*Math.sin(d*D+m*M+mp*Mp+f*F)}
  const A1=(119.75+131.849*T)*R,A2=(53.09+479264.29*T)*R;s+=3958*Math.sin(A1)+1962*Math.sin(Lp*R-F)+318*Math.sin(A2);const om=(125.04-1934.136*T)*R;return n360(Lp+s/1e6-0.00478*Math.sin(om))}
const ayan=J=>{const T=(J-2451545)/36525;return 23.85306+1.396971*T+0.000308*T*T}; // Lahiri, degrees
const sid=(l,J)=>n360(l-ayan(J));
const TITHI=["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
const NAK=["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const YOGA=["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyan","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
const KAR=["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti (Bhadra)"];
const RASHI=["Mesha (Aries)","Vrishabha (Taurus)","Mithuna (Gemini)","Karka (Cancer)","Simha (Leo)","Kanya (Virgo)","Tula (Libra)","Vrishchika (Scorpio)","Dhanu (Sagittarius)","Makara (Capricorn)","Kumbha (Aquarius)","Meena (Pisces)"];
const MONTH=["Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin","Kartik","Margashirsha","Pausha","Magha","Phalguna"];
const BANGLA=["Boishakh","Joishtho","Asharh","Shrabon","Bhadro","Ashshin","Kartik","Ogrohayon","Poush","Magh","Falgun","Choitro"];
const VARA=[["Ravivar","Sun","Orange / red"],["Somvar","Moon","White"],["Mangalvar","Mars","Red"],["Budhvar","Mercury","Green"],["Guruvar","Jupiter","Yellow"],["Shukravar","Venus","White / pink"],["Shanivar","Saturn","Blue / black"]];
const el={tithi:J=>Math.floor(n360(moonLon(J)-sunLon(J))/12),nak:J=>Math.floor(sid(moonLon(J),J)/(360/27)),yoga:J=>Math.floor(n360(sid(sunLon(J),J)+sid(moonLon(J),J))/(360/27)),kar:J=>Math.floor(n360(moonLon(J)-sunLon(J))/6),msign:J=>Math.floor(sid(moonLon(J),J)/30),ssign:J=>Math.floor(sid(sunLon(J),J)/30)};
function endOf(f,J0,maxH=40){const v=f(J0);let a=J0,b=J0;const st=1/48;for(let i=0;i<maxH*2;i++){b=a+st;if(f(b)!==v)break;a=b}if(f(b)===v)return null;for(let i=0;i<20;i++){const m=(a+b)/2;if(f(m)===v)a=m;else b=m}return b}
function sunTimes(date,lat,lon,tz){// NOAA; returns JD of sunrise, sunset for the local date
  const d0=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),12)-tz*36e5);const J=jd(d0);const T=(J-2451545)/36525;
  const L0=n360(280.46646+T*(36000.76983+T*0.0003032)),M=357.52911+T*(35999.05029-0.0001537*T),e=0.016708634-T*(0.000042037+0.0000001267*T);
  const C=Math.sin(M*R)*(1.914602-T*(0.004817+0.000014*T))+Math.sin(2*M*R)*(0.019993-0.000101*T)+Math.sin(3*M*R)*0.000289;const lam=L0+C-0.00569-0.00478*Math.sin((125.04-1934.136*T)*R);
  const eps=23+(26+((21.448-T*(46.815+T*(0.00059-T*0.001813))))/60)/60+0.00256*Math.cos((125.04-1934.136*T)*R);const dec=Math.asin(Math.sin(eps*R)*Math.sin(lam*R));
  const y=Math.tan(eps*R/2)**2;const eqt=4/R*(y*Math.sin(2*L0*R)-2*e*Math.sin(M*R)+4*e*y*Math.sin(M*R)*Math.cos(2*L0*R)-0.5*y*y*Math.sin(4*L0*R)-1.25*e*e*Math.sin(2*M*R));
  const ha=Math.acos(Math.cos(90.833*R)/(Math.cos(lat*R)*Math.cos(dec))-Math.tan(lat*R)*Math.tan(dec))/R;const noon=720-4*lon-eqt;// minutes UTC
  const base=Date.UTC(d0.getUTCFullYear(),d0.getUTCMonth(),d0.getUTCDate());const local=new Date(date.getTime()+tz*36e5);const b=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate());
  return {rise:jd(new Date(b+(noon-ha*4)*6e4)),set:jd(new Date(b+(noon+ha*4)*6e4)),noon:jd(new Date(b+noon*6e4))}}
function prevNewMoon(J){let a=J;const h=1/24;while(el.tithi(a)===29)a-=h;for(let i=0;i<40*24&&el.tithi(a)!==29;i++)a-=h;return endOf(el.tithi,a)||a}
// [amanta month (0 = Chaitra), tithi (0-14 Shukla Pratipada-Purnima, 15-29 Krishna Pratipada-Amavasya), name]
const FEST=[[0,0,"Ugadi · Gudi Padwa · Chaitra Navratri begins"],[0,8,"Ram Navami","M"],[0,14,"Hanuman Jayanti"],[1,2,"Akshaya Tritiya","M"],[1,14,"Buddha Purnima"],[2,9,"Ganga Dussehra"],[2,10,"Nirjala Ekadashi"],[2,14,"Snana Yatra · Jyeshtha Purnima"],
 [3,1,"Rath Yatra"],[3,10,"Devshayani Ekadashi"],[3,14,"Guru Purnima"],[4,2,"Hariyali Teej"],[4,4,"Nag Panchami"],[4,14,"Raksha Bandhan · Shravan Purnima"],[4,22,"Krishna Janmashtami","N"],
 [5,2,"Hartalika Teej"],[5,3,"Ganesh Chaturthi","M"],[5,13,"Anant Chaturdashi"],[5,14,"Bhadrapada Purnima · Pitru Paksha begins"],[5,29,"Mahalaya · Sarva Pitri Amavasya"],
 [6,0,"Sharad Navratri begins · Ghatasthapana"],[6,5,"Durga Puja · Shashthi"],[6,6,"Durga Puja · Saptami"],[6,7,"Durga Puja · Ashtami (Sandhi Puja)"],[6,8,"Durga Puja · Maha Navami"],[6,9,"Vijayadashami · Dussehra","A"],[6,10,"Papankusha Ekadashi"],[6,14,"Kojagari Lakshmi Puja · Sharad Purnima"],
 [6,18,"Karwa Chauth","C"],[6,22,"Ahoi Ashtami"],[6,25,"Rama Ekadashi"],[6,27,"Dhanteras","P"],[6,28,"Naraka Chaturdashi · Kali Chaudas"],[6,29,"Diwali · Lakshmi Puja · Kali Puja","P"],
 [7,0,"Govardhan Puja · Annakut"],[7,1,"Bhai Dooj · Bhai Phota","A"],[7,5,"Chhath Puja"],[7,7,"Gopashtami"],[7,10,"Dev Uthani Ekadashi"],[7,14,"Kartik Purnima · Dev Diwali"],[7,22,"Kalabhairav Jayanti"],
 [8,4,"Vivaha Panchami"],[8,10,"Mokshada Ekadashi · Gita Jayanti"],[8,14,"Dattatreya Jayanti · Margashirsha Purnima"],[9,10,"Putrada Ekadashi"],[9,14,"Pausha Purnima"],[9,29,"Pausha Amavasya"],
 [10,4,"Vasant Panchami · Saraswati Puja"],[10,6,"Ratha Saptami"],[10,14,"Magha Purnima"],[10,28,"Maha Shivaratri","N"],[11,10,"Amalaki Ekadashi"],[11,14,"Holika Dahan (check Bhadra)","P"],[11,14,"Dol Purnima"],[11,15,"Holi (Rangwali)"]];
window.Panchang=(date=new Date(),opt={})=>{const lat=opt.lat??22.5726,lon=opt.lon??88.3639,tz=opt.tz??5.5;const st=sunTimes(date,lat,lon,tz);const J0=st.rise;
  const toD=J=>J==null?null:new Date((J-2440587.5)*864e5);const t=el.tithi(J0),k=el.kar(J0),nk=el.nak(J0),yg=el.yoga(J0),ms=el.msign(J0);
  const nm=prevNewMoon(J0);const amanta=MONTH[(el.ssign(nm)+1)%12];const paksha=t<15?"Shukla":"Krishna";const purn=paksha==="Krishna"?MONTH[(el.ssign(nm)+2)%12]:amanta;
  const local=new Date(date.getTime()+tz*36e5);const wd=local.getUTCDay();const len=st.set-st.rise;const seg=n=>[toD(st.rise+len*(n-1)/8),toD(st.rise+len*n/8)];
  const RAHU=[8,2,7,5,6,4,3],YAMA=[5,4,3,2,1,7,6],GULI=[7,6,5,4,3,2,1];const mid=(st.rise+st.set)/2;
  const y=local.getUTCFullYear();const beforeNewYear=MONTH.indexOf(amanta)>=9&&local.getUTCMonth()<5;// Pausha–Phalguna in Jan–May belong to the previous samvat year
  const kname=k===0?"Kimstughna":k>=57?["Shakuni","Chatushpada","Naga"][k-57]:KAR[(k-1)%7];
  const vrat=[];const ti=t%15;if(ti===10)vrat.push("Ekadashi");if(ti===12)vrat.push("Pradosh (Trayodashi)");if(t===14)vrat.push("Purnima");if(t===29)vrat.push("Amavasya");if(t===18)vrat.push("Sankashti Chaturthi");if(t===3)vrat.push("Vinayaka Chaturthi");if(t===22)vrat.push("Kalashtami");
  const sunSign=el.ssign(J0);const sank=el.ssign(J0-1)!==sunSign;
  // ---- shubh muhurat and avoid timings ----
  const nxt=sunTimes(new Date(date.getTime()+864e5),lat,lon,tz);const nightLen=nxt.rise-st.set;const MIN=1/1440;
  const CH=["Udveg","Chal","Labh","Amrit","Kaal","Shubh","Rog"];const GOODC={Amrit:"good",Shubh:"good",Labh:"good",Chal:"mid",Udveg:"bad",Kaal:"bad",Rog:"bad"};
  const NC=["Udveg","Shubh","Amrit","Chal","Rog","Kaal","Labh"];const DAYSTART=[0,3,6,2,5,1,4],NIGHTSTART=[1,3,5,0,2,4,6];// day starts Udveg/Amrit/Rog/Labh/Shubh/Chal/Kaal (Sun-Sat) in the cycle Udveg-Chal-Labh-Amrit-Kaal-Shubh-Rog; night starts Shubh/Chal/Kaal/Udveg/Amrit/Rog/Labh in the cycle Udveg-Shubh-Amrit-Chal-Rog-Kaal-Labh
  const chog=(from,to,start,cyc=CH)=>Array.from({length:8},(_,i)=>{const nm=cyc[(start+i)%7];return {n:nm,k:GOODC[nm],a:toD(from+(to-from)*i/8),b:toD(from+(to-from)*(i+1)/8)}});
  const isVishti=x=>x>=1&&x<=56&&(x-1)%7===6;
  const bhadra=[];{let inV=isVishti(k),a0=inV?null:0;const stp=1/144;let prev=k,pj=J0;for(let j=J0+stp;j<=nxt.rise+stp;j+=stp){const c=el.kar(j);if(c!==prev){const bis=(lo,hi,v)=>{for(let i=0;i<22;i++){const m=(lo+hi)/2;if(el.kar(m)===v)lo=m;else hi=m}return hi};const edge=bis(pj,j,prev);if(isVishti(prev)){bhadra.push([a0==null?null:toD(a0),toD(edge)]);inV=false}if(isVishti(c)){a0=edge;inV=true}prev=c}pj=j}
    if(isVishti(prev)&&inV)bhadra.push([a0==null?null:toD(a0),null])}
  const nkNow=nk,padaNow=Math.floor((sid(moonLon(J0),J0)%(360/27))/(360/108))+1;const panchak=(nkNow===22&&padaNow>=3)||nkNow===23||nkNow===24||nkNow===25||nkNow===26;
  // ---- festivals: each festival is judged at its own time of day, as panchangs do —
  //      S sunrise, M midday, A afternoon, P pradosh (after sunset), N midnight, C moonrise; it falls on the first day the tithi holds at that time ----
  const nmNext=(()=>{let a=J0;const h=1/24;for(let i=0;i<31*24&&el.tithi(a)!==29;i++)a+=h;const e=endOf(el.tithi,a,60);return e||a})();const adhika=el.ssign(nm)===el.ssign(nmNext+0.1);
  const prv=sunTimes(new Date(date.getTime()-864e5),lat,lon,tz);const nl=(a,b)=>b.rise-a.set;
  const tAt=(a,b,r)=>el.tithi(r==="S"?a.rise:r==="M"?a.rise+(a.set-a.rise)*0.5:r==="A"?a.rise+(a.set-a.rise)*0.7:r==="P"?a.set+1/24:r==="C"?a.set+2/24:a.set+nl(a,b)/2);
  const festivals=[];const tn=el.tithi(nxt.rise);
  if(!adhika){const mi=MONTH.indexOf(amanta);for(const f of FEST){if(f[0]!==mi&&!(f[1]===0&&f[0]===(mi+1)%12))continue;const r=f[3]||"S",T=f[1];const now=tAt(st,nxt,r),was=tAt(prv,st,r);
    if(now===T&&was!==T)festivals.push(f[2]);else if(r==="S"&&now===(T+29)%30&&tn===(T+1)%30)festivals.push(f[2]+" (tithi falls between two sunrises)")}}
  const FIXED=[["04-15","Poila Boishakh (Bengali New Year)"],["05-09","Rabindra Jayanti (25 Boishakh)"],["01-23","Netaji Subhas Jayanti"],["01-26","Republic Day"],["08-15","Independence Day"],["10-02","Gandhi Jayanti"],["12-25","Christmas"],["01-01","English New Year"]];
  const md=date.toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}).slice(5);for(const [d,n] of FIXED)if(d===md)festivals.push(n);
  {const m0=jd(new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-tz*36e5));const a0=el.ssign(m0),a1=el.ssign(m0+1);if(a0!==a1)festivals.push(a1===9?"Makar Sankranti · Poush Sankranti":a1===0?"Mesha Sankranti":"Sankranti — Sun enters "+RASHI[a1].split(" ")[0])}
  return {date:local.toISOString().slice(0,10),vara:VARA[wd],sunrise:toD(st.rise),sunset:toD(st.set),
    tithi:{name:t===29?"Amavasya":TITHI[t%15],paksha,end:toD(endOf(el.tithi,J0))},
    nak:{i:nk,name:NAK[nk],end:toD(endOf(el.nak,J0)),pada:Math.floor((sid(moonLon(J0),J0)%(360/27))/(360/108))+1},yoga:{name:YOGA[yg],end:toD(endOf(el.yoga,J0))},karana:{name:kname,end:toD(endOf(el.kar,J0))},
    moon:{sign:ms,name:RASHI[ms],end:toD(endOf(el.msign,J0,60))},sun:{sign:sunSign,name:RASHI[sunSign],sankranti:sank},
    rahu:seg(RAHU[wd]),yama:seg(YAMA[wd]),gulika:seg(GULI[wd]),abhijit:[toD(mid-len/30),toD(mid+len/30)],brahma:[toD(st.rise-96*MIN),toD(st.rise-48*MIN)],vijaya:[toD(st.rise+len*10/15),toD(st.rise+len*11/15)],godhuli:[toD(st.set),toD(st.set+24*MIN)],
    chogDay:chog(st.rise,st.set,DAYSTART[wd]),chogNight:chog(st.set,st.set+nightLen,NIGHTSTART[wd],NC),bhadra,panchak,festivals,adhika,
    month:{amanta,purnimanta:purn,bangla:BANGLA[sunSign]},samvat:{vikram:y+57-(beforeNewYear?1:0),shaka:y-78-(beforeNewYear?1:0)},vrat:vrat.filter(Boolean),RASHI}};
// Chandra gochar: the Moon's house counted from each rashi, the classical daily reading
const GOCHAR={1:["good","Comfort and good food; a fresh, positive start. Steady day for routine work."],2:["mixed","Money goes out easily; keep speech gentle and check bills before paying."],3:["good","Courage and initiative pay off; good for follow-ups, short trips and sales calls."],
  4:["caution","Restless mind; home and family need attention. Avoid buying property or vehicles today."],5:["mixed","Plans may stall; don't speculate. Good for study, recipes and creative work."],6:["good","Win over competition and clear pending dues; health and stamina are good."],
  7:["good","Partnerships and customers go well; good for meetings, deals and guests."],8:["caution","Chandrashtama — keep big decisions, new purchases and arguments for another day. Drive and handle cash carefully."],9:["mixed","Some delay or hurdle; be patient with officials and elders. Charity brings peace."],
  10:["good","Work gets done and recognised; a good day for important tasks and staff matters."],11:["good","Gains and good news; collections, profits and fulfilment of wishes."],12:["caution","Expenses and fatigue; rest well, avoid lending money and overspending."]};
window.Panchang.upcoming=(from=new Date(),days=45,opt={})=>{const out=[];for(let i=0;i<days;i++){const d=new Date(from.getTime()+i*864e5);let p;try{p=window.Panchang(d,opt)}catch(e){continue}const list=[...p.festivals,...p.vrat.filter(v=>/Ekadashi|Purnima|Amavasya|Pradosh/.test(v)&&!p.festivals.some(f=>f.includes(v.split(" ")[0])))];if(list.length)out.push({date:p.date,vara:p.vara[0],list,adhika:p.adhika})}return out};
window.Panchang.gochar=(moonSign,r)=>{const h=((moonSign-r+12)%12)+1;return {house:h,tone:GOCHAR[h][0],text:GOCHAR[h][1]}};
window.Panchang.RASHI=RASHI;
window.Panchang.NAK=NAK;window.Panchang.YOGA=YOGA;window.Panchang.ayan=ayan;window.Panchang.jd=jd;window.Panchang.moonSid=d=>{const J=jd(d);return sid(moonLon(J),J)};window.Panchang.sunSid=d=>{const J=jd(d);return sid(sunLon(J),J)};
})();
