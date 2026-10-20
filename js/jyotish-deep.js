/* Detailed life-area analysis for the kundali: Parents & family, Career, Professional growth & wealth, Health,
   Marriage & children. Each area is judged from its house, the house lord (placement and dignity), occupants,
   Jupiter's protective aspect and malefic aspects, the natural significator, and (career) the D10 chart; each gets a
   rating and its favourable / careful periods from the Vimshottari antardashas with Jupiter–Saturn transit triggers.
   Marriage periods are listed in date order. English, हिन्दी, বাংলা. */
(()=>{
const J=window.J,{esc}=J;const KK=()=>J.kundaliKit,AK=()=>J.astroKit;
const fd=d=>d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});const yrs=(a,b)=>(b-a)/(365.2425*864e5);
const BODY={en:["head, eyes and brain","face, throat and neck","shoulders, arms and lungs","chest, stomach and breasts","heart, spine and upper back","digestion and intestines","kidneys, lower back and skin","reproductive and urinary organs","hips, thighs and liver","knees, bones and joints","ankles, calves and blood circulation","feet, lymph and sleep"],
 hi:["सिर, आँखें और मस्तिष्क","चेहरा, गला और गर्दन","कंधे, भुजाएँ और फेफड़े","छाती, पेट और स्तन","हृदय, रीढ़ और पीठ का ऊपरी भाग","पाचन और आँतें","गुर्दे, कमर और त्वचा","प्रजनन व मूत्र अंग","कूल्हे, जाँघें और यकृत","घुटने, हड्डियाँ और जोड़","टखने, पिंडलियाँ और रक्त संचार","पैर, लसीका और नींद"],
 bn:["মাথা, চোখ ও মস্তিষ্ক","মুখ, গলা ও ঘাড়","কাঁধ, বাহু ও ফুসফুস","বুক, পাকস্থলী ও স্তন","হৃদয়, মেরুদণ্ড ও পিঠের উপরিভাগ","হজম ও অন্ত্র","কিডনি, কোমর ও ত্বক","প্রজনন ও মূত্র অঙ্গ","নিতম্ব, ঊরু ও যকৃৎ","হাঁটু, হাড় ও গাঁট","গোড়ালি, পায়ের পেশি ও রক্তসঞ্চালন","পা, লসিকা ও ঘুম"]};
const ELEM={en:["Fire nature (pitta): heat, acidity, inflammation, blood pressure — keep cool, avoid anger and fried food.","Earth nature (vata–kapha): joints, digestion, weight — keep a routine and regular exercise.","Air nature (vata): nerves, gas, anxiety, sleep — keep warm, regular meals and rest.","Water nature (kapha): cold, cough, fluid retention, sugar — light food, warm water and activity."],
 hi:["अग्नि प्रकृति (पित्त): गर्मी, अम्लता, सूजन, रक्तचाप — शीतलता रखें, क्रोध और तली चीज़ों से बचें।","पृथ्वी प्रकृति (वात–कफ): जोड़, पाचन, वज़न — नियमित दिनचर्या और व्यायाम रखें।","वायु प्रकृति (वात): नसें, गैस, चिंता, नींद — गर्माहट, समय पर भोजन और विश्राम।","जल प्रकृति (कफ): सर्दी, खाँसी, जल-संचय, शुगर — हल्का भोजन, गुनगुना पानी और सक्रियता।"],
 bn:["অগ্নি প্রকৃতি (পিত্ত): গরম, অম্বল, প্রদাহ, রক্তচাপ — ঠান্ডা থাকুন, রাগ ও ভাজা খাবার এড়িয়ে চলুন।","পৃথ্বী প্রকৃতি (বাত–কফ): গাঁট, হজম, ওজন — নিয়মিত রুটিন ও ব্যায়াম।","বায়ু প্রকৃতি (বাত): স্নায়ু, গ্যাস, দুশ্চিন্তা, ঘুম — উষ্ণতা, নিয়মিত খাবার ও বিশ্রাম।","জল প্রকৃতি (কফ): সর্দি, কাশি, জল জমা, সুগার — হালকা খাবার, গরম জল ও সক্রিয়তা।"]};
const GAIN={"en": ["own effort, skills and personal standing", "family business, savings and speech", "own initiative, communication and short travel", "property, vehicles, land or the mother's side", "intelligence, advice, investments or teaching", "service, competition, loans or health work", "partners, clients and public dealings", "inheritance, insurance, research or a partner's money", "fortune, elders, higher learning or long-distance work", "career, authority and government", "friends, networks and elder siblings", "foreign links, travel, hospitals or large organisations"], "hi": ["स्वयं के प्रयास, कौशल और प्रतिष्ठा", "पारिवारिक व्यापार, बचत और वाणी", "स्वयं की पहल, संचार और छोटी यात्राएँ", "संपत्ति, वाहन, भूमि या मातृ पक्ष", "बुद्धि, परामर्श, निवेश या शिक्षण", "सेवा, प्रतिस्पर्धा, ऋण या स्वास्थ्य क्षेत्र", "साझेदार, ग्राहक और सार्वजनिक व्यवहार", "विरासत, बीमा, शोध या जीवनसाथी का धन", "भाग्य, बड़े-बुज़ुर्ग, उच्च शिक्षा या दूर के कार्य", "करियर, अधिकार और सरकार", "मित्र, संपर्क-जाल और बड़े भाई-बहन", "विदेश संबंध, यात्रा, अस्पताल या बड़ी संस्थाएँ"], "bn": ["নিজের চেষ্টা, দক্ষতা ও সুনাম", "পারিবারিক ব্যবসা, সঞ্চয় ও বাক্", "নিজের উদ্যোগ, যোগাযোগ ও ছোট ভ্রমণ", "সম্পত্তি, যানবাহন, জমি বা মাতৃকুল", "বুদ্ধি, পরামর্শ, বিনিয়োগ বা শিক্ষকতা", "পরিষেবা, প্রতিযোগিতা, ঋণ বা স্বাস্থ্যক্ষেত্র", "অংশীদার, গ্রাহক ও জনসংযোগ", "উত্তরাধিকার, বিমা, গবেষণা বা জীবনসঙ্গীর অর্থ", "ভাগ্য, গুরুজন, উচ্চশিক্ষা বা দূরের কাজ", "কর্মজীবন, কর্তৃত্ব ও সরকার", "বন্ধু, যোগাযোগ-জাল ও বড় ভাইবোন", "বিদেশ যোগ, ভ্রমণ, হাসপাতাল বা বড় প্রতিষ্ঠান"]};
const D={en:{
  name:{par:"Parents & family",car:"Career",gro:"Professional growth & wealth",hea:"Health",mar:"Marriage & children"},lvl:["Needs care","Moderate","Strong"],
  topic:{9:"father and fortune",4:"mother, home and property",3:"siblings and courage",2:"family and savings",10:"career",11:"gains",1:"health and body",6:"illness and debts",8:"chronic trouble and longevity",7:"marriage",5:"children"},
  lord:(t,L,n,dig,ok)=>`The lord of ${t} (${L}) is in the ${n} house${dig?` — ${dig}`:""}: ${ok?"it supports":"it strains"} ${t}.`,
  lordD:(t,L,n,dig,ok)=>`The lord of ${t} (${L}) is in the ${n} house${dig?` — ${dig}`:""}: ${ok?"these stay under control; recovery and repayment come quickly":"keep watch on these; act early"}.`,
  occ:(t,p,ben)=>`${p} in the house of ${t} — ${ben?"adds strength and help":"adds pressure; patience needed"}.`,
  jup:t=>`Jupiter's aspect protects ${t}.`,mal:(t,p)=>`The aspect of ${p} brings tests in ${t}.`,
  kar:(k,l)=>`${k}, the natural significator, is ${["weak","average","strong"][l]}.`,
  good:"Favourable periods:",bad:"Careful periods:",none:"—",
  biz:"Business or self-employment suits better than a job — independent decisions bring growth.",job:"Service / a stable job or partnership with a senior suits better than own business.",
  d10:(d)=>`In the D10 (career) chart the 10th lord is ${d}.`,d10n:"In the D10 (career) chart the 10th lord is neutral.",
  wealth:t=>`Gains come mostly through ${t}.`,
  body:(a,b)=>`Areas to watch: ${a}; also ${b}.`,llord:ok=>ok?"The Lagna lord is strong — good vitality and recovery.":"The Lagna lord is weak — vitality needs care; regular check-ups help.",moon:ok=>ok?"The Moon is steady — a balanced mind.":"The Moon is under strain — stress, sleep and mood need attention.",
  mwin:"Marriage periods (in date order):",strong:"strongest",passed:"passed",spouse:"Spouse's nature:",kids:ok=>ok?"Children: the 5th house is supportive — happiness through children.":"Children: the 5th house needs care — delays or worries are possible; Jupiter remedies help.",
  father:"Father:",mother:"Mother:",sib:"Siblings:",home:"Home & property:"},
 hi:{
  name:{par:"माता-पिता एवं परिवार",car:"करियर",gro:"व्यावसायिक उन्नति एवं धन",hea:"स्वास्थ्य",mar:"विवाह एवं संतान"},lvl:["सावधानी","मध्यम","प्रबल"],
  topic:{9:"पिता और भाग्य",4:"माता, घर और संपत्ति",3:"भाई-बहन और साहस",2:"परिवार और बचत",10:"करियर",11:"लाभ",1:"स्वास्थ्य और शरीर",6:"रोग और ऋण",8:"दीर्घ कष्ट और आयु",7:"विवाह",5:"संतान"},
  lord:(t,L,n,dig,ok)=>`${t} का स्वामी (${L}) ${n} भाव में${dig?` — ${dig}`:""}: ${ok?"यह सहायक है":"यह तनाव देता है"} (${t})।`,
  lordD:(t,L,n,dig,ok)=>`${t} का स्वामी (${L}) ${n} भाव में${dig?` — ${dig}`:""}: ${ok?"ये नियंत्रण में रहते हैं; शीघ्र सुधार और ऋण-मुक्ति":"इन पर नज़र रखें; समय रहते उपाय करें"}।`,
  occ:(t,p,ben)=>`${t} के भाव में ${p} — ${ben?"बल और सहायता":"दबाव; धैर्य आवश्यक"}।`,
  jup:t=>`गुरु की दृष्टि ${t} की रक्षा करती है।`,mal:(t,p)=>`${p} की दृष्टि ${t} में परीक्षा लाती है।`,
  kar:(k,l)=>`${k}, प्राकृतिक कारक, ${["निर्बल","सामान्य","बलवान"][l]} है।`,
  good:"अनुकूल काल:",bad:"सावधानी के काल:",none:"—",
  biz:"नौकरी से अधिक व्यापार या स्वरोज़गार उपयुक्त — स्वतंत्र निर्णयों से उन्नति।",job:"अपने व्यापार से अधिक नौकरी / स्थिर सेवा या वरिष्ठ के साथ साझेदारी उपयुक्त।",
  d10:d=>`दशमांश (D10) में दशमेश ${d} है।`,d10n:"दशमांश (D10) में दशमेश सामान्य है।",
  wealth:t=>`लाभ मुख्यतः ${t} से।`,
  body:(a,b)=>`ध्यान रखें: ${a}; साथ ही ${b}।`,llord:ok=>ok?"लग्नेश बलवान — अच्छी जीवनी-शक्ति और शीघ्र स्वास्थ्य-लाभ।":"लग्नेश निर्बल — जीवनी-शक्ति पर ध्यान; नियमित जाँच लाभकारी।",moon:ok=>ok?"चंद्र स्थिर — संतुलित मन।":"चंद्र पीड़ित — तनाव, नींद और मन पर ध्यान दें।",
  mwin:"विवाह के काल (तिथि क्रम में):",strong:"सबसे प्रबल",passed:"बीत चुका",spouse:"जीवनसाथी का स्वभाव:",kids:ok=>ok?"संतान: पंचम भाव सहायक — संतान से सुख।":"संतान: पंचम भाव पर ध्यान — विलंब या चिंता संभव; गुरु के उपाय सहायक।",
  father:"पिता:",mother:"माता:",sib:"भाई-बहन:",home:"घर व संपत्ति:"},
 bn:{
  name:{par:"বাবা-মা ও পরিবার",car:"কর্মজীবন",gro:"পেশাগত উন্নতি ও অর্থ",hea:"স্বাস্থ্য",mar:"বিবাহ ও সন্তান"},lvl:["সাবধানতা","মাঝারি","প্রবল"],
  topic:{9:"পিতা ও ভাগ্য",4:"মা, বাড়ি ও সম্পত্তি",3:"ভাইবোন ও সাহস",2:"পরিবার ও সঞ্চয়",10:"কর্মজীবন",11:"লাভ",1:"স্বাস্থ্য ও শরীর",6:"রোগ ও ঋণ",8:"দীর্ঘ কষ্ট ও আয়ু",7:"বিবাহ",5:"সন্তান"},
  lord:(t,L,n,dig,ok)=>`${t}-এর অধিপতি (${L}) ${n} ভাবে${dig?` — ${dig}`:""}: ${ok?"এটি সহায়ক":"এটি চাপ দেয়"} (${t})।`,
  lordD:(t,L,n,dig,ok)=>`${t}-এর অধিপতি (${L}) ${n} ভাবে${dig?` — ${dig}`:""}: ${ok?"এগুলি নিয়ন্ত্রণে থাকে; দ্রুত আরোগ্য ও ঋণমুক্তি":"এগুলির দিকে নজর রাখুন; আগেভাগে ব্যবস্থা নিন"}।`,
  occ:(t,p,ben)=>`${t}-এর ভাবে ${p} — ${ben?"শক্তি ও সাহায্য":"চাপ; ধৈর্য দরকার"}।`,
  jup:t=>`বৃহস্পতির দৃষ্টি ${t}-কে রক্ষা করে।`,mal:(t,p)=>`${p}-এর দৃষ্টি ${t}-তে পরীক্ষা আনে।`,
  kar:(k,l)=>`${k}, স্বাভাবিক কারক, ${["দুর্বল","সাধারণ","বলবান"][l]}।`,
  good:"অনুকূল সময়:",bad:"সাবধানতার সময়:",none:"—",
  biz:"চাকরির চেয়ে ব্যবসা বা স্বনিযুক্তি উপযুক্ত — স্বাধীন সিদ্ধান্তে উন্নতি।",job:"নিজের ব্যবসার চেয়ে চাকরি / স্থির পরিষেবা বা অভিজ্ঞ কারও সঙ্গে অংশীদারি উপযুক্ত।",
  d10:d=>`দশমাংশ (D10)-এ দশমেশ ${d}।`,d10n:"দশমাংশ (D10)-এ দশমেশ সাধারণ।",
  wealth:t=>`লাভ মূলত ${t} থেকে।`,
  body:(a,b)=>`যত্ন নিন: ${a}; সঙ্গে ${b}।`,llord:ok=>ok?"লগ্নেশ বলবান — ভালো প্রাণশক্তি ও দ্রুত আরোগ্য।":"লগ্নেশ দুর্বল — প্রাণশক্তির যত্ন; নিয়মিত পরীক্ষা উপকারী।",moon:ok=>ok?"চন্দ্র স্থির — ভারসাম্যপূর্ণ মন।":"চন্দ্র পীড়িত — দুশ্চিন্তা, ঘুম ও মনের যত্ন নিন।",
  mwin:"বিবাহের সময় (তারিখ অনুযায়ী):",strong:"সবচেয়ে প্রবল",passed:"পেরিয়ে গেছে",spouse:"জীবনসঙ্গীর স্বভাব:",kids:ok=>ok?"সন্তান: পঞ্চম ভাব সহায়ক — সন্তানসুখ।":"সন্তান: পঞ্চম ভাবে যত্ন — দেরি বা চিন্তা সম্ভব; বৃহস্পতির প্রতিকার সহায়ক।",
  father:"পিতা:",mother:"মা:",sib:"ভাইবোন:",home:"বাড়ি ও সম্পত্তি:"}};
J.jyDeep=(R,lang,W)=>{const T=D[lang],A=AK().L[lang],X=KK().TX[lang],pl=A.pl,O=X.h.ord;const g=R.gr,ls=R.ls,LORD=KK().LORD,birth=R.date,now=new Date();
  const lordOf=h=>LORD[(ls+h-1)%12];const inH=h=>Object.keys(g).filter(k=>g[k].house===h);const BEN=["ju","ve","me","mo"],MAL=["sa","ma","ra","ke"];
  const asp={ju:[5,7,9],sa:[3,7,10],ma:[4,7,8],ra:[5,7,9],ke:[]};const aspects=(p,h)=>(asp[p]||[]).concat([7]).some(a=>((g[p].house+a-2)%12)+1===h);
  const ok=k=>KK().natalGood(k,g[k].house,g[k].dig);const lv=k=>{const s=(g[k].dig==="ex"||g[k].dig==="own"?2:0)+(g[k].dig==="de"?-2:0)+([6,8,12].includes(g[k].house)?-1:0)+([1,4,5,7,9,10,11].includes(g[k].house)?1:0);return s>=2?2:s<=-1?0:1};
  const judge=(h,kar)=>{const t=T.topic[h];const L=lordOf(h);const lines=[];let sc=5;const lo=ok(L);lines.push((h===6||h===8?T.lordD:T.lord)(t,pl[L],O(g[L].house),X.dig[g[L].dig],lo));sc+=lo?1.5:-1.5;if(g[L].dig==="ex"||g[L].dig==="own")sc+=1;if(g[L].dig==="de")sc-=1;
    const oc=inH(h).filter(k=>k!=="ke"||h!==1);if(oc.length){const ben=oc.filter(k=>BEN.includes(k)).length>=oc.filter(k=>MAL.includes(k)).length;lines.push(T.occ(t,oc.map(k=>pl[k]).join(", "),ben));sc+=ben?1:-1}
    if(aspects("ju",h)&&g.ju.house!==h){lines.push(T.jup(t));sc+=1}const m=["sa","ma","ra"].filter(p=>aspects(p,h)&&g[p].house!==h);if(m.length){lines.push(T.mal(t,m.map(k=>pl[k]).join(", ")));sc-=.7*m.length}
    if(kar){const l=lv(kar);lines.push(T.kar(pl[kar],l));sc+=(l-1)*1.2}return {lines,sc:Math.max(1,Math.min(10,Math.round(sc)))}};
  const sig=(k,hs)=>{let s=0;for(const h of hs){if(lordOf(h)===k)s+=3;if(g[k].house===h)s+=2;if(LORD[g[k].sign]===lordOf(h))s+=1}return s};
  const DA=R.dasha.list;const ahead=[];for(const d of DA)for(const a of d.ads)if(a.b>now&&yrs(now,a.a)<12)ahead.push({d,a});
  const trig=(date,h,pk,list)=>{const sg=(ls+h-1)%12;const p=AK().positions(date);return list.includes(((sg-p[pk].sign+12)%12)+1)};
  const periods=(hs,kar)=>{const sc=ahead.map(x=>{const mid=new Date((Math.max(x.a.a,now)+x.a.b.getTime())/2);const s=sig(x.d.l,hs)*.6+sig(x.a.l,hs)+(x.a.l===kar?1.5:0)+(trig(mid,hs[0],"ju",[1,5,7,9])?1.5:0);const bad=sig(x.a.l,[6,8,12])+(trig(mid,hs[0],"sa",[1,3,7,10])?1.5:0)+(MAL.includes(x.a.l)&&aspects(x.a.l,hs[0])?1:0);return {...x,s,bad}});
    const lab=x=>`${fd(x.a.a<now?now:x.a.a)} – ${fd(x.a.b)} (${pl[x.d.l]}–${pl[x.a.l]})`;
    return {good:sc.filter(x=>x.s>=4).sort((a,b)=>b.s-a.s).slice(0,3).sort((a,b)=>a.a.a-b.a.a).map(lab),bad:sc.filter(x=>x.bad>=4&&x.s<4).sort((a,b)=>b.bad-a.bad).slice(0,3).sort((a,b)=>a.a.a-b.a.a).map(lab)}};
  const lvlOf=s=>s>=7?2:s<=4?0:1;const sec=(id,score,body,per)=>({id,title:T.name[id],score,lvl:T.lvl[lvlOf(score)],cls:["warn","plain","ok"][lvlOf(score)],body,per});
  // parents & family
  const f=judge(9,"su"),m=judge(4,"mo"),s3=judge(3,"ma"),h4=judge(4,null);
  const par=sec("par",Math.round((f.sc+m.sc)/2),[[T.father,...f.lines],[T.mother,...m.lines],[T.sib,...s3.lines.slice(0,2)]],periods([9,4],"su"));
  // career
  const c=judge(10,"sa");const l10=lordOf(10);const d10s=(()=>{const L=g[l10].lon;const s=Math.floor(L/30),part=Math.floor((L%30)/3);return (s%2===0?s+part:s+8+part)%12})();const dd=KK().dig(l10,d10s);
  const bizScore=(BEN.includes(lordOf(7))?0:0)+(lv("me")+lv("ve"))+(g[lordOf(7)].house===10||g[l10].house===7?2:0)+(g.sa.house===10?-1:0)+(g.su.house===10?-1:0);
  const car=sec("car",c.sc,[[...c.lines,dd==="fr"?T.d10n:T.d10(X.dig[dd]),bizScore>=4?T.biz:T.job]],periods([10],"sa"));
  // growth & wealth
  const g11=judge(11,"ju"),g2=judge(2,null);const l11=lordOf(11);const gro=sec("gro",Math.round((g11.sc*2+g2.sc)/3),[[...g11.lines,...g2.lines.slice(0,2),T.wealth(GAIN[lang][g[l11].house-1])]],periods([11,2],"ju"));
  // health
  const h1=judge(1,"su"),h6=judge(6,null);const sixS=(ls+5)%12;const el=[0,4,8].includes(ls)?0:[1,5,9].includes(ls)?1:[2,6,10].includes(ls)?2:3;
  const llOk=ok(lordOf(1))&&g[lordOf(1)].dig!=="de",moOk=lv("mo")>0&&!["sa","ra","ke"].some(p=>g[p].sign===g.mo.sign);
  const hScore=Math.max(1,Math.min(10,Math.round((h1.sc+(10-h6.sc))/2+(llOk?1:-1)+(moOk?.5:-.5))));
  const hPer=(()=>{const sc=ahead.map(x=>({...x,bad:sig(x.a.l,[6,8,12])*.8+sig(x.d.l,[6,8])*.4+(x.a.l===lordOf(1)?-1:0)})).filter(x=>x.bad>=3).sort((a,b)=>b.bad-a.bad).slice(0,3).sort((a,b)=>a.a.a-b.a.a);return {good:[],bad:sc.map(x=>`${fd(x.a.a<now?now:x.a.a)} – ${fd(x.a.b)} (${pl[x.d.l]}–${pl[x.a.l]})`)}})();
  const hea=sec("hea",hScore,[[T.llord(llOk),T.moon(moOk),ELEM[lang][el],T.body(BODY[lang][ls],BODY[lang][sixS]),...h6.lines.slice(0,1)]],hPer);
  // marriage & children: windows in date order
  const l7=lordOf(7),kar=R.b.gender==="f"?"ju":"ve";const mj=judge(7,kar),k5=judge(5,"ju");
  const msig=k=>(k===l7?3:0)+(g[k].house===7?2:0)+(k===kar?2:0)+(k===lordOf(2)||k===lordOf(11)?1:0)+([2,11].includes(g[k].house)?1:0)+(LORD[g[k].sign]===l7?1:0);
  const s7=(ls+6)%12,sl7=g[l7].sign;const cands=[];for(const d of DA)for(const a of d.ads){const sA=yrs(birth,a.a),eA=yrs(birth,a.b);if(eA<20||sA>38)continue;const mid=new Date((a.a.getTime()+a.b.getTime())/2);const p=AK().positions(mid);
    const tj=s=>[1,5,7,9].includes(((s-p.ju.sign+12)%12)+1),ts=s=>[1,3,7,10].includes(((s-p.sa.sign+12)%12)+1);cands.push({d,a,sc:msig(d.l)*.7+msig(a.l)+(tj(s7)||tj(sl7)?2:0)+(ts(s7)||ts(sl7)?1.5:0)})}
  const top=cands.filter(c=>c.sc>=3).sort((x,y)=>y.sc-x.sc).slice(0,3);const best=top[0];const married=R.b.myear||R.b.married==="y";
  const win=top.slice().sort((x,y)=>x.a.a-y.a.a).map(c=>`${fd(c.a.a)} – ${fd(c.a.b)} · ${Math.floor(yrs(birth,c.a.a))}–${Math.ceil(yrs(birth,c.a.b))} (${pl[c.d.l]}–${pl[c.a.l]})${c===best?" ★ "+T.strong:""}${c.a.b<now&&!married?" · "+T.passed:""}`);
  const mar=sec("mar",Math.round((mj.sc*2+k5.sc)/3),[[...mj.lines,T.kids(k5.sc>=5)]],{good:[],bad:[]});
  return [par,car,gro,hea,mar]};
J.jyDeepHtml=(secs,lang)=>{const T=D[lang];return secs.map(s=>`<section class="jd"><div class="jd-h"><h3>${esc(s.title)}</h3><span class="jd-score"><i style="width:${s.score*10}%"></i></span><b class="chip ${s.cls}">${esc(s.lvl)} · ${s.score}/10</b></div>
  ${s.body.map(b=>`<ul class="jy-l">${b.map((x,i)=>i===0&&/:$/.test(x)?`<li class="jd-sub"><b>${esc(x)}</b></li>`:`<li>${esc(x)}</li>`).join("")}</ul>`).join("")}
  ${s.per.good.length?`<p><b>${T.good}</b> ${esc(s.per.good.join(" · "))}</p>`:""}${s.per.bad.length?`<p><b>${T.bad}</b> ${esc(s.per.bad.join(" · "))}</p>`:""}</section>`).join("")};
})();
