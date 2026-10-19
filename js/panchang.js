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
window.Panchang=(date=new Date(),opt={})=>{const lat=opt.lat??22.5726,lon=opt.lon??88.3639,tz=opt.tz??5.5;const st=sunTimes(date,lat,lon,tz);const J0=st.rise;
  const toD=J=>J==null?null:new Date((J-2440587.5)*864e5);const t=el.tithi(J0),k=el.kar(J0),nk=el.nak(J0),yg=el.yoga(J0),ms=el.msign(J0);
  const nm=prevNewMoon(J0);const amanta=MONTH[(el.ssign(nm)+1)%12];const paksha=t<15?"Shukla":"Krishna";const purn=paksha==="Krishna"?MONTH[(el.ssign(nm)+2)%12]:amanta;
  const local=new Date(date.getTime()+tz*36e5);const wd=local.getUTCDay();const len=st.set-st.rise;const seg=n=>[toD(st.rise+len*(n-1)/8),toD(st.rise+len*n/8)];
  const RAHU=[8,2,7,5,6,4,3],YAMA=[5,4,3,2,1,7,6],GULI=[7,6,5,4,3,2,1];const mid=(st.rise+st.set)/2;
  const y=local.getUTCFullYear();const beforeNewYear=MONTH.indexOf(amanta)>=9&&local.getUTCMonth()<5;// Pausha–Phalguna in Jan–May belong to the previous samvat year
  const kname=k===0?"Kimstughna":k>=57?["Shakuni","Chatushpada","Naga"][k-57]:KAR[(k-1)%7];
  const vrat=[];const ti=t%15;if(ti===10)vrat.push("Ekadashi");if(ti===12)vrat.push("Pradosh (Trayodashi)");if(t===14)vrat.push("Purnima");if(t===29)vrat.push("Amavasya");if(t===18)vrat.push("Sankashti Chaturthi");if(t===3)vrat.push("Vinayaka Chaturthi");if(t===22)vrat.push("Kalashtami");
  const sunSign=el.ssign(J0);const sank=el.ssign(J0-1)!==sunSign;
  return {date:local.toISOString().slice(0,10),vara:VARA[wd],sunrise:toD(st.rise),sunset:toD(st.set),
    tithi:{name:t===29?"Amavasya":TITHI[t%15],paksha,end:toD(endOf(el.tithi,J0))},
    nak:{name:NAK[nk],end:toD(endOf(el.nak,J0)),pada:Math.floor((sid(moonLon(J0),J0)%(360/27))/(360/108))+1},yoga:{name:YOGA[yg],end:toD(endOf(el.yoga,J0))},karana:{name:kname,end:toD(endOf(el.kar,J0))},
    moon:{sign:ms,name:RASHI[ms],end:toD(endOf(el.msign,J0,60))},sun:{sign:sunSign,name:RASHI[sunSign],sankranti:sank},
    rahu:seg(RAHU[wd]),yama:seg(YAMA[wd]),gulika:seg(GULI[wd]),abhijit:[toD(mid-len/30),toD(mid+len/30)],
    month:{amanta,purnimanta:purn,bangla:BANGLA[sunSign]},samvat:{vikram:y+57-(beforeNewYear?1:0),shaka:y-78-(beforeNewYear?1:0)},vrat:vrat.filter(Boolean),RASHI}};
// Chandra gochar: the Moon's house counted from each rashi, the classical daily reading
const GOCHAR={1:["good","Comfort and good food; a fresh, positive start. Steady day for routine work."],2:["mixed","Money goes out easily; keep speech gentle and check bills before paying."],3:["good","Courage and initiative pay off; good for follow-ups, short trips and sales calls."],
  4:["caution","Restless mind; home and family need attention. Avoid buying property or vehicles today."],5:["mixed","Plans may stall; don't speculate. Good for study, recipes and creative work."],6:["good","Win over competition and clear pending dues; health and stamina are good."],
  7:["good","Partnerships and customers go well; good for meetings, deals and guests."],8:["caution","Chandrashtama — keep big decisions, new purchases and arguments for another day. Drive and handle cash carefully."],9:["mixed","Some delay or hurdle; be patient with officials and elders. Charity brings peace."],
  10:["good","Work gets done and recognised; a good day for important tasks and staff matters."],11:["good","Gains and good news; collections, profits and fulfilment of wishes."],12:["caution","Expenses and fatigue; rest well, avoid lending money and overspending."]};
window.Panchang.gochar=(moonSign,r)=>{const h=((moonSign-r+12)%12)+1;return {house:h,tone:GOCHAR[h][0],text:GOCHAR[h][1]}};
window.Panchang.RASHI=RASHI;
})();
