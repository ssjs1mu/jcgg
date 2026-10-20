/* Life report — built automatically from the birth chart, no questions asked. English · हिन्दी · বাংলা.
   • Report card: 12 life areas scored 1–10 from the house, its lord, occupants, Jupiter's aspect and the karaka (radar + bars)
   • Life timeline: Vimshottari maha-dasha bands from birth to 90, life stages, the marriage window and "now"
   • Stage-by-stage reading: childhood, teenage, education & early career, marriage, married life, present, next 5 / 15 years, later life
   • Relationships: marriage window (dasha + Jupiter/Saturn double transit), spouse, stability, classical separation and
     second-relationship indicators (read as tendencies, never as proof), children
   • Career, health (body areas, care periods, precautions), classical longevity class (Jaimini three pairs)
   • Numerology: life path, birth, destiny (Chaldean) numbers, personal years
   • 3-D sky view of the birth chart
   Everything is the classical reading of the chart, written for a lay reader; it is guidance, not certainty.
   Language: the optional lang argument, else the astro language chosen in the app (jcgg-astro-lang). */
(()=>{
const J=window.J,{esc}=J;const KK=()=>J.kundaliKit,AK=()=>J.astroKit;
const LGX=l=>{if(l&&T[l])return l;try{const v=localStorage.getItem("jcgg-astro-lang");return T[v]?v:"en"}catch(e){return "en"}};
const yrs=(a,b)=>(b-a)/(365.2425*864e5);
const LOC={en:"en-IN",hi:"hi-IN",bn:"bn-IN"};const myL=(d,l)=>d.toLocaleDateString(LOC[l],{month:"short",year:"numeric"});
const BEN=["ju","ve","me","mo"];const MALS=["sa","ma","ra","ke"];const ASP={sa:[3,7,10],ma:[4,7,8],ju:[5,7,9],ra:[5,7,9],ke:[5,7,9]};
const MOD=s=>s%3;// 0 movable 1 fixed 2 dual
const BNO=["","1ম","2য়","3য়","4র্থ","5ম","6ষ্ঠ","7ম","8ম","9ম","10ম","11শ","12শ"];

// ---------------- text ----------------
const T={
en:{ord:n=>n+(["th","st","nd","rd"][(n%100>10&&n%100<14)?0:n%10]||"th"),sg:["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"],
 HT:["self, body & vitality","money, family & speech","courage, siblings & skills","home, mother, property & peace","children, studies & intelligence","work-load, rivals, debts & illness","marriage, partners & business","sudden events, longevity & hidden matters","luck, father, guru & higher learning","career, status & reputation","income, gains & friends","expenses, travel abroad & spirituality"],
 BODY:["head & brain","face, eyes, teeth & throat","shoulders, arms, lungs & ears","chest, heart & breasts","stomach, liver & upper abdomen","intestines, digestion & immunity","kidneys, lower back & reproductive health","reproductive organs, chronic & hidden ailments","hips, thighs & arterial health","knees, joints & bones","calves, ankles & circulation","feet, sleep & the left eye"],
 PBODY:{su:"heart, eyes, bones & blood pressure",mo:"mind, sleep, fluids & chest",ma:"blood, injuries, fevers, surgery & B.P.",me:"nerves, skin, speech & anxiety",ju:"liver, sugar, fat & cholesterol",ve:"kidneys, hormones, reproductive health & sugar",sa:"joints, teeth, chronic pain & fatigue",ra:"allergies, poisoning, sudden & hard-to-diagnose issues",ke:"accidents, cuts, infections & surgeries"},
 PCARE:{su:"Regular B.P. and heart checks; morning sunlight; avoid ego clashes with seniors.",mo:"Good sleep, calm mind, enough water; meditation helps.",ma:"Drive carefully, avoid fights and sharp tools; check blood and B.P.",me:"Reduce screen time and over-thinking; skin and nerve care.",ju:"Watch weight, sugar and liver; avoid rich, oily food.",ve:"Moderation in pleasures; check sugar and kidneys; stay hydrated.",sa:"Daily stretching or yoga for joints; don't ignore long-standing pain; dental care.",ra:"Avoid intoxicants and shortcuts; take a second opinion on unclear diagnoses.",ke:"Care against injuries and infections; be careful near water and fire."},
 AREAS:["Self & vitality","Wealth & family","Courage & skills","Home & property","Education & children","Health & resistance","Marriage & partnerships","Longevity & stability","Luck & father","Career & status","Income & gains","Peace & spirituality"],
 F:{su:"government, administration, leadership, medicine",mo:"hospitality, food, travel, nursing, public dealing",ma:"engineering, police/defence, real estate, sports, surgery",me:"business, trading, accounts, IT, writing, communication",ju:"teaching, finance, law, advisory, banking, religion",ve:"arts, fashion, beauty, luxury goods, hospitality, media",sa:"industry, labour-intensive work, oil/iron, long-term service",ra:"technology, foreign companies, research, politics, speculation",ke:"research, spirituality, coding, healing, astrology"},
 NM:{1:"leadership, independence, new starts",2:"partnership, diplomacy, patience",3:"creativity, expression, social life",4:"hard work, structure, building foundations",5:"change, travel, freedom, sales",6:"family, responsibility, service, home",7:"study, research, spirituality, inner work",8:"money, power, business, karma",9:"completion, generosity, endings & new beginnings",11:"intuition, inspiration (master 11)",22:"master builder — big practical achievements",33:"master teacher — service and healing"},
 lucky:{1:"Sunday · gold/orange",2:"Monday · white/silver",3:"Thursday · yellow",4:"Saturday · blue/grey",5:"Wednesday · green",6:"Friday · white/pink",7:"Monday · sea-green",8:"Saturday · dark blue/black",9:"Tuesday · red",11:"Monday · silver",22:"Saturday · blue",33:"Friday · pink"},
 read:(p,h,top,own,ownT)=>`${p} sits in your ${h} house (${top})${own?` and rules your ${own} house (${ownT})`:""}`,and:" & ",
 dn:g=>g?"Generally favourable.":"Needs care — results come after effort.",
 RI:{l7:(p,h)=>`The 7th lord (${p}) sits in the ${h} house — partnership needs patience; distance, health or work pressure can come between the couple.`,
  mal7:p=>`${p} in the 7th house — strong-willed partners; ego clashes need conscious handling.`,
  mang:h=>`Mangal dosha (Mars in the ${h} house from the ascendant) — classical texts advise matching charts before marriage; it reduces after age 28.`,
  ven:de=>`Venus is ${de?"debilitated":"under malefic influence"} — emotional fulfilment in marriage takes effort; misunderstandings over affection or money are possible.`,
  sa7:"Saturn aspects the 7th house — marriage tends to be later, mature and duty-bound; coldness must be avoided.",
  vra:p=>`Venus joins ${p} — classical texts read strong desires and attraction outside routine; loyalty and open communication protect the relationship.`,
  dual:"The 7th lord / Venus in a dual sign with a 12th-house link — classical texts mention the possibility of more than one significant relationship; this is a tendency, not a certainty.",
  node:p=>`${p} on the marriage axis — an unconventional partner or unusual circumstances around marriage.`},
 risk:{High:"High",Moderate:"Moderate",Low:"Low"},
 stab:{Low:"Strong — a stable, supportive marriage is indicated.",Moderate:"Moderate — a good marriage with periodic friction; patience and open talk keep it strong.",High:"Needs care — friction or separation phases are indicated; counselling, chart-matching and remedies are strongly advised."},
 child:["Good indications for children; they bring happiness and support.","Children are indicated; some delay or worry around their health or studies is possible.","Delay or concern around progeny is indicated; medical guidance and remedies for Jupiter and the 5th lord help."],
 CLS:{3:["Purnayu — long life","traditionally 70+ years; with care, a long and active old age is indicated"],2:["Madhyayu — medium-to-long life","traditionally 60–80 years; disciplined health habits can extend it"],1:["Alpayu reading (classical)","the classical pair method gives a short span, but for an adult already past it this simply means health must be guarded carefully — it is not a prediction"]},
 v8:(sg,b,occ)=>`8th house in ${sg}: ${b}${occ?" · "+occ:""}`,v8o:(p,b)=>`${p} there points to ${b}`,v8l:(p,h,b)=>`8th lord ${p} in the ${h} house: watch ${b}`,
 ST:["Childhood","Teenage","Education & early career","Marriage","Married life & career build-up","Present","Next 5 years","Next 6–15 years","Later life"],
 tone:["mostly favourable","challenging, needs patience","mixed — ups and downs"],
 stTxt:(past,tone,th,ex)=>`${past?"This phase was":"This phase is"} ${tone}. Main themes: ${th}.${ex}`,
 ex:{home1:" Caring home atmosphere and mother's support.",home0:" Some instability at home or in mother's health/attention is indicated.",stu1:" Studies go well; sharp intelligence.",stu0:" Concentration in studies needs support; a change of school or stream is possible.",car:f=>` Career direction: ${f}.`,mar:" Marriage or a serious commitment is most strongly indicated in this window.",now:(d,u,r)=>` Running period: ${d} until ${u} — ${r}.`},
 age:"age",
 H:{card:"📊 Life report card",cardH:"Each life area scored 1–10 from its house, the house lord's strength, planets in it, Jupiter's protective aspect and the natural significator. Green = strong, amber = average, red = needs remedies & effort.",tl:"🗓 Life timeline",sky:"🌌 3-D birth sky",stages:"🧭 Life, stage by stage",dasha:"Dasha",rel:"💞 Marriage & relationships",car:"💼 Career — present & future",hea:"🩺 Health & precautions",life:"⏳ Longevity (classical Ayurdaya)",num:"🔢 Numerology"},
 R:{mw:"Marriage window",also:"also possible",nomw:"not strongly marked between 21 and 36 — later or unconventional marriage.",sp:"Spouse",sp7:s=>`${s} on the 7th`,stab:"Stability",risk:"Separation risk",strain:"Periods that test the relationship",ch:"Children",chp:"Likely periods",note:"Relationship indicators are classical tendencies, not verdicts — free will, upbringing and effort change outcomes."},
 C:{fields:"Best-suited fields",g:["growth, recognition, income rise","steady, routine progress","pressure, change of job or setback; avoid big risks"]},
 He:{body:"Body areas to watch",pl:"Planet-linked tendencies",per:"Periods needing extra health care"},
 L:{band:(a,b)=>`<b>Classical span band:</b> about ${a}–${b} years (three-pair method: lagna-lord/8th-lord, lagna/Moon, Saturn/Moon).`,v:"Areas the 8th house asks you to protect",note:"Classical longevity rules are traditional guidance only. Exact life span or cause of death cannot be known from a chart — regular medical check-ups, lifestyle and timely treatment matter far more."},
 N:{lp:"Life path",bn:"Birth number",nn:"Name (Chaldean)",lucky:"Lucky day & colour",yr:"Year",py:"Personal year",th:"Theme"},
 TL:{h:"Maha-dasha periods by age",st:["Child","Teen","Youth","Adult","Mid-life","Senior"],mw:"💍 marriage window",now:"now",ls:"classical life-span band"},
 sky:"The sky at the moment of birth — signs on the outer ring, planets at their true longitudes, dashed line = ascendant. Tap to pause.",asc:"ASC",
 CT:{h:["House","Sign","Planets","Lord → placed in","Meaning here"],t:{sup:"supported",ene:"energised (malefics do well here)",pre:"under pressure",mix:"mixed",weak:"weak — its lord sits in a difficult house",lsup:"supported by a well-placed lord",avg:"average"},d97:"spouse & dharma in marriage",d91:"inner self & destiny after 35"},
 NOTE:{d1:"Lagna (birth) chart — the main chart for body, events and life direction. Read each house below: who sits there and where its lord goes decide how that area of life works out.",mo:"Chandra (Moon) chart — houses counted from the Moon. It shows the mind, emotions and how life feels from inside; transits and Sade-Sati are read from here.",d9:"Navamsa (D9) — the 'fruit' chart: marriage, spouse, inner strength and how the promises of the birth chart mature after about age 35. A planet in the same sign in D1 and D9 (vargottama) is extra strong."},
 dcol:"What it brings",hs:"H"},

hi:{ord:n=>n+"वें",sg:null,
 HT:["स्वयं, शरीर व ऊर्जा","धन, परिवार व वाणी","साहस, भाई-बहन व कौशल","घर, माता, संपत्ति व सुख","संतान, पढ़ाई व बुद्धि","काम का बोझ, शत्रु, कर्ज़ व रोग","विवाह, साझेदार व व्यापार","अचानक घटनाएँ, आयु व गुप्त विषय","भाग्य, पिता, गुरु व उच्च शिक्षा","करियर, पद व प्रतिष्ठा","आय, लाभ व मित्र","खर्च, विदेश यात्रा व अध्यात्म"],
 BODY:["सिर व मस्तिष्क","चेहरा, आँखें, दाँत व गला","कंधे, बाँहें, फेफड़े व कान","छाती, हृदय व स्तन","पेट, लिवर व ऊपरी उदर","आँतें, पाचन व रोग-प्रतिरोधक क्षमता","गुर्दे, कमर व प्रजनन स्वास्थ्य","गुप्तांग, पुराने व छिपे रोग","कूल्हे, जाँघें व धमनियाँ","घुटने, जोड़ व हड्डियाँ","पिंडलियाँ, टखने व रक्त संचार","पैर, नींद व बायीं आँख"],
 PBODY:{su:"हृदय, आँखें, हड्डियाँ व रक्तचाप",mo:"मन, नींद, जल-तत्व व छाती",ma:"रक्त, चोट, बुखार, ऑपरेशन व बी.पी.",me:"नसें, त्वचा, वाणी व चिंता",ju:"लिवर, शुगर, चर्बी व कोलेस्ट्रॉल",ve:"गुर्दे, हार्मोन, प्रजनन स्वास्थ्य व शुगर",sa:"जोड़, दाँत, पुराना दर्द व थकान",ra:"एलर्जी, विषाक्तता, अचानक व कठिन-निदान रोग",ke:"दुर्घटना, कटना, संक्रमण व ऑपरेशन"},
 PCARE:{su:"नियमित बी.पी. व हृदय जाँच; सुबह की धूप; वरिष्ठों से अहं के टकराव से बचें।",mo:"अच्छी नींद, शांत मन, पर्याप्त पानी; ध्यान लाभ देगा।",ma:"सावधानी से वाहन चलाएँ, झगड़े व धारदार औज़ारों से बचें; रक्त व बी.पी. जाँच कराएँ।",me:"स्क्रीन का समय व अधिक सोचना कम करें; त्वचा व नसों का ध्यान रखें।",ju:"वज़न, शुगर व लिवर पर ध्यान दें; तला-भुना भोजन कम करें।",ve:"भोग-विलास में संयम; शुगर व गुर्दे की जाँच; पर्याप्त पानी पिएँ।",sa:"जोड़ों के लिए रोज़ स्ट्रेचिंग या योग; पुराने दर्द को अनदेखा न करें; दाँतों की देखभाल।",ra:"नशे व शॉर्टकट से बचें; अस्पष्ट निदान पर दूसरी राय लें।",ke:"चोट व संक्रमण से बचाव; पानी व आग के पास सावधान रहें।"},
 AREAS:["स्वयं व ऊर्जा","धन व परिवार","साहस व कौशल","घर व संपत्ति","शिक्षा व संतान","स्वास्थ्य व प्रतिरोध","विवाह व साझेदारी","आयु व स्थिरता","भाग्य व पिता","करियर व पद","आय व लाभ","शांति व अध्यात्म"],
 F:{su:"सरकारी सेवा, प्रशासन, नेतृत्व, चिकित्सा",mo:"होटल, भोजन, यात्रा, नर्सिंग, जनसंपर्क",ma:"इंजीनियरिंग, पुलिस/सेना, रियल एस्टेट, खेल, सर्जरी",me:"व्यापार, ट्रेडिंग, लेखा, आईटी, लेखन, संचार",ju:"शिक्षण, वित्त, कानून, सलाह, बैंकिंग, धर्म",ve:"कला, फ़ैशन, सौंदर्य, विलासिता, होटल, मीडिया",sa:"उद्योग, श्रम-प्रधान कार्य, तेल/लोहा, दीर्घ सेवा",ra:"टेक्नोलॉजी, विदेशी कंपनियाँ, शोध, राजनीति, सट्टा",ke:"शोध, अध्यात्म, कोडिंग, उपचार, ज्योतिष"},
 NM:{1:"नेतृत्व, स्वतंत्रता, नई शुरुआत",2:"साझेदारी, कूटनीति, धैर्य",3:"रचनात्मकता, अभिव्यक्ति, सामाजिकता",4:"कड़ी मेहनत, व्यवस्था, मज़बूत नींव",5:"परिवर्तन, यात्रा, स्वतंत्रता, बिक्री",6:"परिवार, ज़िम्मेदारी, सेवा, घर",7:"अध्ययन, शोध, अध्यात्म, आत्मचिंतन",8:"धन, शक्ति, व्यापार, कर्म",9:"पूर्णता, उदारता, समापन व नई शुरुआत",11:"अंतर्ज्ञान, प्रेरणा (मास्टर 11)",22:"मास्टर बिल्डर — बड़ी व्यावहारिक उपलब्धियाँ",33:"मास्टर शिक्षक — सेवा व उपचार"},
 lucky:{1:"रविवार · सुनहरा/नारंगी",2:"सोमवार · सफ़ेद/चाँदी",3:"गुरुवार · पीला",4:"शनिवार · नीला/स्लेटी",5:"बुधवार · हरा",6:"शुक्रवार · सफ़ेद/गुलाबी",7:"सोमवार · समुद्री हरा",8:"शनिवार · गहरा नीला/काला",9:"मंगलवार · लाल",11:"सोमवार · चाँदी",22:"शनिवार · नीला",33:"शुक्रवार · गुलाबी"},
 read:(p,h,top,own,ownT)=>`${p} आपके ${h} भाव (${top}) में है${own?` तथा ${own} भाव (${ownT}) का स्वामी है`:""}`,and:" व ",
 dn:g=>g?"सामान्यतः शुभ।":"सावधानी चाहिए — परिणाम मेहनत के बाद मिलते हैं।",
 RI:{l7:(p,h)=>`सप्तमेश (${p}) ${h} भाव में है — दांपत्य में धैर्य चाहिए; दूरी, स्वास्थ्य या काम का दबाव दंपति के बीच आ सकता है।`,
  mal7:p=>`सप्तम भाव में ${p} — दृढ़ स्वभाव वाला जीवनसाथी; अहं के टकराव को समझदारी से सँभालें।`,
  mang:h=>`मंगल दोष (लग्न से ${h} भाव में मंगल) — शास्त्र विवाह से पहले कुंडली मिलान की सलाह देते हैं; 28 वर्ष के बाद इसका प्रभाव घटता है।`,
  ven:de=>`शुक्र ${de?"नीच का":"पाप ग्रहों के प्रभाव में"} है — विवाह में भावनात्मक संतोष के लिए प्रयास चाहिए; स्नेह या धन को लेकर ग़लतफ़हमियाँ संभव।`,
  sa7:"शनि की सप्तम भाव पर दृष्टि — विवाह प्रायः देर से, परिपक्व व कर्तव्य-प्रधान; रिश्ते में रूखापन न आने दें।",
  vra:p=>`शुक्र ${p} के साथ — शास्त्र इसे प्रबल इच्छाओं व सामान्य सीमा से बाहर आकर्षण का संकेत मानते हैं; निष्ठा व खुली बातचीत रिश्ते की रक्षा करते हैं।`,
  dual:"सप्तमेश / शुक्र द्विस्वभाव राशि में और द्वादश भाव से संबंध — शास्त्रों में एक से अधिक महत्वपूर्ण संबंधों की संभावना कही गई है; यह प्रवृत्ति है, निश्चितता नहीं।",
  node:p=>`विवाह अक्ष पर ${p} — असामान्य जीवनसाथी या विवाह के आसपास असामान्य परिस्थितियाँ।`},
 risk:{High:"अधिक",Moderate:"मध्यम",Low:"कम"},
 stab:{Low:"मज़बूत — स्थिर व सहयोगी विवाह के संकेत।",Moderate:"मध्यम — अच्छा विवाह, बीच-बीच में मतभेद; धैर्य व खुली बातचीत से रिश्ता मज़बूत रहेगा।",High:"सावधानी चाहिए — मतभेद या अलगाव के दौर के संकेत; परामर्श, कुंडली मिलान व उपाय अवश्य करें।"},
 child:["संतान के अच्छे योग; संतान से सुख व सहयोग मिलेगा।","संतान के योग हैं; कुछ विलंब या उनके स्वास्थ्य/पढ़ाई को लेकर चिंता संभव।","संतान में विलंब या चिंता के संकेत; चिकित्सकीय सलाह तथा गुरु व पंचमेश के उपाय लाभ देंगे।"],
 CLS:{3:["पूर्णायु — दीर्घ आयु","परंपरागत रूप से 70+ वर्ष; सावधानी से लंबा व सक्रिय बुढ़ापा संकेतित"],2:["मध्यायु — मध्यम से दीर्घ आयु","परंपरागत रूप से 60–80 वर्ष; अनुशासित स्वास्थ्य आदतें इसे बढ़ा सकती हैं"],1:["अल्पायु पाठ (शास्त्रीय)","शास्त्रीय युग्म विधि कम अवधि बताती है, पर जो वयस्क इसे पार कर चुके हैं उनके लिए इसका अर्थ केवल इतना है कि स्वास्थ्य का विशेष ध्यान रखें — यह भविष्यवाणी नहीं है"]},
 v8:(sg,b,occ)=>`अष्टम भाव ${sg} में: ${b}${occ?" · "+occ:""}`,v8o:(p,b)=>`वहाँ ${p} — ${b} की ओर संकेत`,v8l:(p,h,b)=>`अष्टमेश ${p} ${h} भाव में: ${b} का ध्यान रखें`,
 ST:["बचपन","किशोरावस्था","शिक्षा व करियर की शुरुआत","विवाह","विवाहित जीवन व करियर निर्माण","वर्तमान","अगले 5 वर्ष","अगले 6–15 वर्ष","उत्तर जीवन"],
 tone:["अधिकतर शुभ","चुनौतीपूर्ण, धैर्य चाहिए","मिश्रित — उतार-चढ़ाव"],
 stTxt:(past,tone,th,ex)=>`यह दौर ${tone} ${past?"रहा":"है"}। मुख्य विषय: ${th}।${ex}`,
 ex:{home1:" घर में स्नेहपूर्ण वातावरण व माता का सहयोग।",home0:" घर में कुछ अस्थिरता या माता के स्वास्थ्य/ध्यान में कमी के संकेत।",stu1:" पढ़ाई अच्छी; तीव्र बुद्धि।",stu0:" पढ़ाई में एकाग्रता के लिए सहयोग चाहिए; स्कूल या विषय बदलना संभव।",car:f=>` करियर की दिशा: ${f}।`,mar:" इस अवधि में विवाह या गंभीर संबंध के सबसे प्रबल योग।",now:(d,u,r)=>` चालू दशा: ${d}, ${u} तक — ${r}।`},
 age:"आयु",
 H:{card:"📊 जीवन रिपोर्ट कार्ड",cardH:"हर जीवन-क्षेत्र को 1–10 अंक — उसके भाव, भावेश की शक्ति, उसमें बैठे ग्रह, गुरु की रक्षक दृष्टि व कारक ग्रह से। हरा = मज़बूत, पीला = औसत, लाल = उपाय व प्रयास चाहिए।",tl:"🗓 जीवन समयरेखा",sky:"🌌 3-D जन्म आकाश",stages:"🧭 जीवन, चरण-दर-चरण",dasha:"दशा",rel:"💞 विवाह व संबंध",car:"💼 करियर — वर्तमान व भविष्य",hea:"🩺 स्वास्थ्य व सावधानियाँ",life:"⏳ आयु (शास्त्रीय आयुर्दाय)",num:"🔢 अंक ज्योतिष"},
 R:{mw:"विवाह काल",also:"संभव भी",nomw:"21 से 36 वर्ष के बीच प्रबल योग नहीं — देर से या असामान्य विवाह।",sp:"जीवनसाथी",sp7:s=>`सप्तम में ${s}`,stab:"स्थिरता",risk:"अलगाव जोखिम",strain:"रिश्ते की परीक्षा के काल",ch:"संतान",chp:"संभावित काल",note:"संबंध के संकेत शास्त्रीय प्रवृत्तियाँ हैं, फ़ैसला नहीं — इच्छाशक्ति, संस्कार व प्रयास परिणाम बदल देते हैं।"},
 C:{fields:"सबसे उपयुक्त क्षेत्र",g:["उन्नति, मान-सम्मान, आय में वृद्धि","स्थिर, सामान्य प्रगति","दबाव, नौकरी में बदलाव या रुकावट; बड़े जोखिम से बचें"]},
 He:{body:"ध्यान रखने योग्य अंग",pl:"ग्रह-जनित प्रवृत्तियाँ",per:"विशेष स्वास्थ्य सावधानी के काल"},
 L:{band:(a,b)=>`<b>शास्त्रीय आयु-पट्टी:</b> लगभग ${a}–${b} वर्ष (तीन युग्म विधि: लग्नेश/अष्टमेश, लग्न/चंद्र, शनि/चंद्र)।`,v:"अष्टम भाव जिनकी रक्षा कहता है",note:"शास्त्रीय आयु-नियम केवल परंपरागत मार्गदर्शन हैं। सटीक आयु या मृत्यु का कारण कुंडली से नहीं जाना जा सकता — नियमित जाँच, जीवनशैली व समय पर उपचार कहीं अधिक महत्वपूर्ण हैं।"},
 N:{lp:"मूलांक पथ (लाइफ़ पाथ)",bn:"जन्मांक",nn:"नामांक (कैल्डियन)",lucky:"शुभ दिन व रंग",yr:"वर्ष",py:"व्यक्तिगत वर्ष",th:"विषय"},
 TL:{h:"आयु अनुसार महादशाएँ",st:["बचपन","किशोर","युवा","वयस्क","मध्य आयु","वरिष्ठ"],mw:"💍 विवाह काल",now:"अभी",ls:"शास्त्रीय आयु-पट्टी"},
 sky:"जन्म के क्षण का आकाश — बाहरी घेरे में राशियाँ, ग्रह अपने वास्तविक अंशों पर, बिंदुदार रेखा = लग्न। रोकने के लिए टैप करें।",asc:"लग्न",
 CT:{h:["भाव","राशि","ग्रह","स्वामी → स्थित","यहाँ अर्थ"],t:{sup:"सहयोगी",ene:"ऊर्जावान (यहाँ पाप ग्रह अच्छे)",pre:"दबाव में",mix:"मिश्रित",weak:"कमज़ोर — स्वामी कठिन भाव में",lsup:"सुस्थित स्वामी से बल",avg:"औसत"},d97:"जीवनसाथी व विवाह में धर्म",d91:"अंतरात्मा व 35 के बाद का भाग्य"},
 NOTE:{d1:"लग्न (जन्म) कुंडली — शरीर, घटनाओं व जीवन की दिशा की मुख्य कुंडली। नीचे हर भाव देखें: वहाँ कौन बैठा है और उसका स्वामी कहाँ गया है — यही उस क्षेत्र का फल तय करते हैं।",mo:"चंद्र कुंडली — भाव चंद्रमा से गिने जाते हैं। यह मन, भावनाएँ और भीतर से जीवन का अनुभव दिखाती है; गोचर व साढ़ेसाती यहीं से देखी जाती है।",d9:"नवांश (D9) — 'फल' कुंडली: विवाह, जीवनसाथी, आंतरिक शक्ति और लगभग 35 वर्ष के बाद जन्म कुंडली के वादे कैसे फलते हैं। D1 व D9 में एक ही राशि वाला ग्रह (वर्गोत्तम) विशेष बलवान होता है।"},
 dcol:"फल",hs:"भाव "},

bn:{ord:n=>BNO[n]||n+"ম",sg:null,
 HT:["নিজ, শরীর ও প্রাণশক্তি","অর্থ, পরিবার ও বাক্য","সাহস, ভাইবোন ও দক্ষতা","বাড়ি, মা, সম্পত্তি ও শান্তি","সন্তান, পড়াশোনা ও বুদ্ধি","কাজের চাপ, শত্রু, ঋণ ও রোগ","বিবাহ, অংশীদার ও ব্যবসা","আকস্মিক ঘটনা, আয়ু ও গোপন বিষয়","ভাগ্য, পিতা, গুরু ও উচ্চশিক্ষা","কর্মজীবন, পদ ও সুনাম","আয়, লাভ ও বন্ধু","ব্যয়, বিদেশযাত্রা ও আধ্যাত্মিকতা"],
 BODY:["মাথা ও মস্তিষ্ক","মুখ, চোখ, দাঁত ও গলা","কাঁধ, বাহু, ফুসফুস ও কান","বুক, হৃদয় ও স্তন","পেট, লিভার ও উপরের উদর","অন্ত্র, হজম ও রোগ প্রতিরোধ","কিডনি, কোমর ও প্রজনন স্বাস্থ্য","গোপনাঙ্গ, পুরনো ও লুকানো রোগ","নিতম্ব, ঊরু ও ধমনী","হাঁটু, জয়েন্ট ও হাড়","পায়ের ডিম, গোড়ালি ও রক্তসঞ্চালন","পা, ঘুম ও বাঁ চোখ"],
 PBODY:{su:"হৃদয়, চোখ, হাড় ও রক্তচাপ",mo:"মন, ঘুম, জলীয় উপাদান ও বুক",ma:"রক্ত, আঘাত, জ্বর, অস্ত্রোপচার ও বি.পি.",me:"স্নায়ু, ত্বক, বাক্য ও উদ্বেগ",ju:"লিভার, সুগার, মেদ ও কোলেস্টেরল",ve:"কিডনি, হরমোন, প্রজনন স্বাস্থ্য ও সুগার",sa:"জয়েন্ট, দাঁত, পুরনো ব্যথা ও ক্লান্তি",ra:"অ্যালার্জি, বিষক্রিয়া, আকস্মিক ও কঠিন-নির্ণেয় রোগ",ke:"দুর্ঘটনা, কাটা, সংক্রমণ ও অস্ত্রোপচার"},
 PCARE:{su:"নিয়মিত বি.পি. ও হার্ট পরীক্ষা; সকালের রোদ; ঊর্ধ্বতনদের সঙ্গে অহং-এর সংঘাত এড়ান।",mo:"ভালো ঘুম, শান্ত মন, যথেষ্ট জল; ধ্যান উপকারী।",ma:"সাবধানে গাড়ি চালান, ঝগড়া ও ধারালো জিনিস এড়ান; রক্ত ও বি.পি. পরীক্ষা করান।",me:"স্ক্রিন-টাইম ও অতিরিক্ত চিন্তা কমান; ত্বক ও স্নায়ুর যত্ন নিন।",ju:"ওজন, সুগার ও লিভারে নজর দিন; তেল-মশলাদার খাবার কমান।",ve:"ভোগে সংযম; সুগার ও কিডনি পরীক্ষা; যথেষ্ট জল পান করুন।",sa:"জয়েন্টের জন্য রোজ স্ট্রেচিং বা যোগ; পুরনো ব্যথা অবহেলা করবেন না; দাঁতের যত্ন।",ra:"নেশা ও শর্টকাট এড়ান; অস্পষ্ট রোগনির্ণয়ে দ্বিতীয় মত নিন।",ke:"আঘাত ও সংক্রমণ থেকে সাবধান; জল ও আগুনের কাছে সতর্ক থাকুন।"},
 AREAS:["নিজ ও প্রাণশক্তি","ধন ও পরিবার","সাহস ও দক্ষতা","বাড়ি ও সম্পত্তি","শিক্ষা ও সন্তান","স্বাস্থ্য ও প্রতিরোধ","বিবাহ ও অংশীদারি","আয়ু ও স্থিরতা","ভাগ্য ও পিতা","কর্মজীবন ও পদ","আয় ও লাভ","শান্তি ও আধ্যাত্মিকতা"],
 F:{su:"সরকারি চাকরি, প্রশাসন, নেতৃত্ব, চিকিৎসা",mo:"হোটেল, খাদ্য, ভ্রমণ, নার্সিং, জনসংযোগ",ma:"ইঞ্জিনিয়ারিং, পুলিশ/প্রতিরক্ষা, রিয়েল এস্টেট, খেলা, সার্জারি",me:"ব্যবসা, ট্রেডিং, হিসাব, আইটি, লেখা, যোগাযোগ",ju:"শিক্ষকতা, অর্থ, আইন, পরামর্শ, ব্যাংকিং, ধর্ম",ve:"শিল্পকলা, ফ্যাশন, সৌন্দর্য, বিলাসপণ্য, হোটেল, মিডিয়া",sa:"শিল্প-কারখানা, শ্রমনির্ভর কাজ, তেল/লোহা, দীর্ঘমেয়াদি চাকরি",ra:"প্রযুক্তি, বিদেশি কোম্পানি, গবেষণা, রাজনীতি, ফাটকা",ke:"গবেষণা, আধ্যাত্মিকতা, কোডিং, নিরাময়, জ্যোতিষ"},
 NM:{1:"নেতৃত্ব, স্বাধীনতা, নতুন শুরু",2:"অংশীদারি, কূটনীতি, ধৈর্য",3:"সৃজনশীলতা, প্রকাশ, সামাজিকতা",4:"কঠোর পরিশ্রম, শৃঙ্খলা, ভিত গড়া",5:"পরিবর্তন, ভ্রমণ, স্বাধীনতা, বিক্রয়",6:"পরিবার, দায়িত্ব, সেবা, গৃহ",7:"অধ্যয়ন, গবেষণা, আধ্যাত্মিকতা, আত্মচিন্তা",8:"অর্থ, ক্ষমতা, ব্যবসা, কর্ম",9:"পূর্ণতা, উদারতা, সমাপ্তি ও নতুন শুরু",11:"অন্তর্দৃষ্টি, অনুপ্রেরণা (মাস্টার 11)",22:"মাস্টার বিল্ডার — বড় বাস্তব সাফল্য",33:"মাস্টার শিক্ষক — সেবা ও নিরাময়"},
 lucky:{1:"রবিবার · সোনালি/কমলা",2:"সোমবার · সাদা/রুপালি",3:"বৃহস্পতিবার · হলুদ",4:"শনিবার · নীল/ধূসর",5:"বুধবার · সবুজ",6:"শুক্রবার · সাদা/গোলাপি",7:"সোমবার · সমুদ্র-সবুজ",8:"শনিবার · গাঢ় নীল/কালো",9:"মঙ্গলবার · লাল",11:"সোমবার · রুপালি",22:"শনিবার · নীল",33:"শুক্রবার · গোলাপি"},
 read:(p,h,top,own,ownT)=>`${p} আপনার ${h} ভাবে (${top}) আছে${own?` এবং ${own} ভাবের (${ownT}) অধিপতি`:""}`,and:" ও ",
 dn:g=>g?"সাধারণত শুভ।":"সাবধানতা দরকার — ফল আসে পরিশ্রমের পরে।",
 RI:{l7:(p,h)=>`সপ্তমপতি (${p}) ${h} ভাবে — দাম্পত্যে ধৈর্য দরকার; দূরত্ব, স্বাস্থ্য বা কাজের চাপ দম্পতির মাঝে আসতে পারে।`,
  mal7:p=>`সপ্তম ভাবে ${p} — দৃঢ়চেতা জীবনসঙ্গী; অহং-এর সংঘাত বুদ্ধি করে সামলাতে হবে।`,
  mang:h=>`মাঙ্গলিক দোষ (লগ্ন থেকে ${h} ভাবে মঙ্গল) — শাস্ত্র বিবাহের আগে কোষ্ঠী মেলানোর পরামর্শ দেয়; ২৮ বছরের পরে প্রভাব কমে।`,
  ven:de=>`শুক্র ${de?"নীচস্থ":"পাপগ্রহের প্রভাবে"} — দাম্পত্যে মানসিক তৃপ্তির জন্য চেষ্টা দরকার; ভালোবাসা বা অর্থ নিয়ে ভুল বোঝাবুঝি সম্ভব।`,
  sa7:"সপ্তম ভাবে শনির দৃষ্টি — বিবাহ সাধারণত দেরিতে, পরিণত ও কর্তব্যনিষ্ঠ; সম্পর্কে শীতলতা আসতে দেবেন না।",
  vra:p=>`শুক্র ${p}-এর সঙ্গে — শাস্ত্রে একে প্রবল কামনা ও গণ্ডির বাইরে আকর্ষণের ইঙ্গিত বলা হয়; বিশ্বস্ততা ও খোলামেলা কথা সম্পর্ক রক্ষা করে।`,
  dual:"সপ্তমপতি / শুক্র দ্বিস্বভাব রাশিতে এবং দ্বাদশ ভাবের সঙ্গে যোগ — শাস্ত্রে একাধিক গুরুত্বপূর্ণ সম্পর্কের সম্ভাবনার কথা আছে; এটি প্রবণতা, নিশ্চয়তা নয়।",
  node:p=>`বিবাহ-অক্ষে ${p} — অপ্রচলিত জীবনসঙ্গী বা বিবাহ ঘিরে অস্বাভাবিক পরিস্থিতি।`},
 risk:{High:"বেশি",Moderate:"মাঝারি",Low:"কম"},
 stab:{Low:"মজবুত — স্থির ও সহায়ক দাম্পত্যের ইঙ্গিত।",Moderate:"মাঝারি — ভালো দাম্পত্য, মাঝে মাঝে মতভেদ; ধৈর্য ও খোলামেলা কথায় সম্পর্ক মজবুত থাকবে।",High:"সাবধানতা দরকার — মতভেদ বা বিচ্ছেদের পর্যায়ের ইঙ্গিত; কাউন্সেলিং, কোষ্ঠী মিলান ও প্রতিকার অবশ্যই করুন।"},
 child:["সন্তানের ভালো যোগ; সন্তান সুখ ও সহায়তা দেবে।","সন্তানের যোগ আছে; কিছু বিলম্ব বা তাদের স্বাস্থ্য/পড়াশোনা নিয়ে দুশ্চিন্তা সম্ভব।","সন্তানে বিলম্ব বা দুশ্চিন্তার ইঙ্গিত; চিকিৎসকের পরামর্শ এবং বৃহস্পতি ও পঞ্চমপতির প্রতিকার উপকারী।"],
 CLS:{3:["পূর্ণায়ু — দীর্ঘ আয়ু","প্রথাগতভাবে ৭০+ বছর; যত্ন নিলে দীর্ঘ ও সক্রিয় বার্ধক্যের ইঙ্গিত"],2:["মধ্যায়ু — মাঝারি থেকে দীর্ঘ আয়ু","প্রথাগতভাবে ৬০–৮০ বছর; সুশৃঙ্খল স্বাস্থ্যাভ্যাস তা বাড়াতে পারে"],1:["অল্পায়ু পাঠ (শাস্ত্রীয়)","শাস্ত্রীয় যুগ্ম পদ্ধতি কম মেয়াদ দেখায়, কিন্তু যে প্রাপ্তবয়স্ক তা পেরিয়ে গেছেন তাঁর ক্ষেত্রে এর অর্থ শুধু স্বাস্থ্যের বিশেষ যত্ন — এটি ভবিষ্যদ্বাণী নয়"]},
 v8:(sg,b,occ)=>`অষ্টম ভাব ${sg}-এ: ${b}${occ?" · "+occ:""}`,v8o:(p,b)=>`সেখানে ${p} — ${b}-এর ইঙ্গিত`,v8l:(p,h,b)=>`অষ্টমপতি ${p} ${h} ভাবে: ${b}-এর দিকে নজর রাখুন`,
 ST:["শৈশব","কৈশোর","শিক্ষা ও কর্মজীবনের শুরু","বিবাহ","বিবাহিত জীবন ও কর্মজীবন গড়া","বর্তমান","আগামী ৫ বছর","আগামী ৬–১৫ বছর","পরবর্তী জীবন"],
 tone:["বেশিরভাগ শুভ","চ্যালেঞ্জিং, ধৈর্য দরকার","মিশ্র — ওঠানামা"],
 stTxt:(past,tone,th,ex)=>`এই পর্যায় ${past?"ছিল":"হল"} ${tone}। প্রধান বিষয়: ${th}।${ex}`,
 ex:{home1:" বাড়িতে স্নেহময় পরিবেশ ও মায়ের সহায়তা।",home0:" বাড়িতে কিছু অস্থিরতা বা মায়ের স্বাস্থ্য/মনোযোগে ঘাটতির ইঙ্গিত।",stu1:" পড়াশোনা ভালো; তীক্ষ্ণ বুদ্ধি।",stu0:" পড়াশোনায় মনোযোগের জন্য সহায়তা দরকার; স্কুল বা বিষয় বদল সম্ভব।",car:f=>` কর্মজীবনের দিক: ${f}।`,mar:" এই সময়ে বিবাহ বা গুরুতর সম্পর্কের সবচেয়ে প্রবল যোগ।",now:(d,u,r)=>` চলতি দশা: ${d}, ${u} পর্যন্ত — ${r}।`},
 age:"বয়স",
 H:{card:"📊 জীবন রিপোর্ট কার্ড",cardH:"প্রতিটি জীবন-ক্ষেত্রকে ১–১০ নম্বর — তার ভাব, ভাবপতির শক্তি, সেখানে থাকা গ্রহ, বৃহস্পতির রক্ষাকারী দৃষ্টি ও কারক গ্রহ থেকে। সবুজ = মজবুত, হলুদ = মাঝারি, লাল = প্রতিকার ও চেষ্টা দরকার।",tl:"🗓 জীবন সময়রেখা",sky:"🌌 3-D জন্মকালীন আকাশ",stages:"🧭 জীবন, ধাপে ধাপে",dasha:"দশা",rel:"💞 বিবাহ ও সম্পর্ক",car:"💼 কর্মজীবন — বর্তমান ও ভবিষ্যৎ",hea:"🩺 স্বাস্থ্য ও সতর্কতা",life:"⏳ আয়ু (শাস্ত্রীয় আয়ুর্দায়)",num:"🔢 সংখ্যাতত্ত্ব"},
 R:{mw:"বিবাহের সময়",also:"সম্ভাব্যও",nomw:"২১ থেকে ৩৬ বছরের মধ্যে প্রবল যোগ নেই — দেরিতে বা অপ্রচলিত বিবাহ।",sp:"জীবনসঙ্গী",sp7:s=>`সপ্তমে ${s}`,stab:"স্থিরতা",risk:"বিচ্ছেদের ঝুঁকি",strain:"সম্পর্কের পরীক্ষার সময়",ch:"সন্তান",chp:"সম্ভাব্য সময়",note:"সম্পর্কের ইঙ্গিতগুলি শাস্ত্রীয় প্রবণতা, রায় নয় — ইচ্ছাশক্তি, সংস্কার ও চেষ্টা ফল বদলে দেয়।"},
 C:{fields:"সবচেয়ে উপযুক্ত ক্ষেত্র",g:["উন্নতি, স্বীকৃতি, আয় বৃদ্ধি","স্থির, সাধারণ অগ্রগতি","চাপ, চাকরি বদল বা বাধা; বড় ঝুঁকি এড়ান"]},
 He:{body:"যে অঙ্গে নজর রাখবেন",pl:"গ্রহজনিত প্রবণতা",per:"বিশেষ স্বাস্থ্য-সতর্কতার সময়"},
 L:{band:(a,b)=>`<b>শাস্ত্রীয় আয়ু-পরিসর:</b> প্রায় ${a}–${b} বছর (তিন যুগ্ম পদ্ধতি: লগ্নপতি/অষ্টমপতি, লগ্ন/চন্দ্র, শনি/চন্দ্র)।`,v:"অষ্টম ভাব যা রক্ষা করতে বলে",note:"শাস্ত্রীয় আয়ু-নিয়ম কেবল প্রথাগত নির্দেশনা। সঠিক আয়ু বা মৃত্যুর কারণ কোষ্ঠী থেকে জানা যায় না — নিয়মিত স্বাস্থ্যপরীক্ষা, জীবনযাত্রা ও সময়মতো চিকিৎসা অনেক বেশি গুরুত্বপূর্ণ।"},
 N:{lp:"জীবনপথ সংখ্যা",bn:"জন্মসংখ্যা",nn:"নামসংখ্যা (ক্যালডিয়ান)",lucky:"শুভ দিন ও রং",yr:"বছর",py:"ব্যক্তিগত বছর",th:"বিষয়"},
 TL:{h:"বয়স অনুযায়ী মহাদশা",st:["শিশু","কিশোর","যুবা","প্রাপ্তবয়স্ক","মধ্যবয়স","প্রবীণ"],mw:"💍 বিবাহের সময়",now:"এখন",ls:"শাস্ত্রীয় আয়ু-পরিসর"},
 sky:"জন্মমুহূর্তের আকাশ — বাইরের বৃত্তে রাশি, গ্রহ তাদের প্রকৃত অংশে, ডটেড রেখা = লগ্ন। থামাতে ট্যাপ করুন।",asc:"লগ্ন",
 CT:{h:["ভাব","রাশি","গ্রহ","অধিপতি → অবস্থান","এখানে অর্থ"],t:{sup:"সহায়ক",ene:"শক্তিশালী (এখানে পাপগ্রহ ভালো ফল দেয়)",pre:"চাপের মধ্যে",mix:"মিশ্র",weak:"দুর্বল — অধিপতি কঠিন ভাবে",lsup:"সুস্থিত অধিপতির বল",avg:"মাঝারি"},d97:"জীবনসঙ্গী ও দাম্পত্যে ধর্ম",d91:"অন্তরাত্মা ও ৩৫-এর পরের ভাগ্য"},
 NOTE:{d1:"লগ্ন (জন্ম) কুণ্ডলী — শরীর, ঘটনা ও জীবনের দিকের মূল কুণ্ডলী। নিচে প্রতিটি ভাব দেখুন: সেখানে কে আছে এবং তার অধিপতি কোথায় গেছে — এগুলোই সেই ক্ষেত্রের ফল ঠিক করে।",mo:"চন্দ্র কুণ্ডলী — ভাব গোনা হয় চাঁদ থেকে। এটি মন, আবেগ এবং ভেতর থেকে জীবনের অনুভব দেখায়; গোচর ও সাড়েসাতি এখান থেকেই দেখা হয়।",d9:"নবাংশ (D9) — 'ফল' কুণ্ডলী: বিবাহ, জীবনসঙ্গী, অন্তর্নিহিত শক্তি এবং প্রায় ৩৫ বছরের পরে জন্মকুণ্ডলীর প্রতিশ্রুতি কীভাবে ফলে। D1 ও D9-এ একই রাশিতে থাকা গ্রহ (বর্গোত্তম) বিশেষ বলবান।"},
 dcol:"ফল",hs:"ভাব "}};
const SGL=l=>T[l].sg||AK().L[l].rashi;const PLL=l=>l==="en"?{su:"Sun",mo:"Moon",ma:"Mars",me:"Mercury",ju:"Jupiter",ve:"Venus",sa:"Saturn",ra:"Rahu",ke:"Ketu"}:AK().L[l].pl;

// ---------------- engine ----------------
J.jyLife=(R,lang)=>{const l=LGX(lang),X=T[l],PL=PLL(l),SG=SGL(l),ord=X.ord,my=d=>myL(d,l);
  const g=R.gr,ls=R.ls,LORD=KK().LORD,birth=R.date,now=new Date(),DA=R.dasha.list;
  const lordOf=h=>LORD[(ls+h-1)%12];const inH=h=>Object.keys(g).filter(k=>g[k].house===h);
  const aspects=(k,h)=>[7,...(ASP[k]||[])].some(a=>((g[k].house+a-2)%12)+1===h);
  const afflicted=k=>MALS.some(m=>m!==k&&(g[m].sign===g[k].sign||(ASP[m]||[7]).concat(7).some(a=>(g[m].sign+a-1)%12===g[k].sign)));
  const pStr=k=>{const x=g[k];let s=0;if(x.dig==="ex")s+=2.5;else if(x.dig==="own")s+=2;else if(x.dig==="de")s-=2.5;if([1,4,7,10].includes(x.house))s+=1;if([5,9].includes(x.house))s+=1.2;if([6,8,12].includes(x.house))s-=1.5;if(afflicted(k))s-=1;if(x.nav===x.sign)s+=1;if(BEN.includes(k)&&g.ju.sign===x.sign&&k!=="ju")s+=.5;return s};
  const ok=k=>KK().natalGood(k,g[k].house,g[k].dig);
  const hScore=(h,kar)=>{let s=5+pStr(lordOf(h))*0.9;for(const k of inH(h)){if(BEN.includes(k))s+=1;else if(MALS.includes(k))s+=[3,6,10,11].includes(h)?.6:-1.2;else s+=.3}
    if(aspects("ju",h))s+=1;if(aspects("sa",h)&&![3,6,10,11].includes(h))s-=.6;if(kar)s+=pStr(kar)*.5;return Math.max(1,Math.min(10,Math.round(s*10)/10))};
  const KAR=["su","ju","ma","mo","ju","ma",R.b.gender==="f"?"ju":"ve","sa","su","sa","ju","ke"];
  const card=X.AREAS.map((n,i)=>({n,h:i+1,s:hScore(i+1,KAR[i])}));
  const ab=d=>Math.max(0,yrs(birth,d));
  const allAD=DA.flatMap(d=>d.ads.map(a=>({md:d.l,l:a.l,a:a.a,b:a.b}))).filter(x=>x.b>birth);
  const topic=h=>X.HT[h-1].split(/[,،]/)[0];
  const read=k=>{const own=[...Array(12).keys()].filter(i=>lordOf(i+1)===k).map(i=>i+1);return {good:ok(k),txt:X.read(PL[k],ord(g[k].house),X.HT[g[k].house-1],own.length?own.map(ord).join(X.and):"",own.map(topic).join(", "))}};
  // marriage window (auto)
  const l7=lordOf(7),kar=R.b.gender==="f"?"ju":"ve";const s7=(ls+6)%12,sl7=g[l7].sign;
  const msig=k=>(k===l7?3:0)+(g[k].house===7?2:0)+(k===kar?2:0)+(k===lordOf(2)||k===lordOf(11)?1:0)+([2,11].includes(g[k].house)?1:0)+(LORD[g[k].sign]===l7?1:0)+(k==="ra"&&g.ra.house===7?1:0);
  const dt=date=>{const p=AK().positions(date);const tj=s=>[1,5,7,9].includes(((s-p.ju.sign+12)%12)+1),ts=s=>[1,3,7,10].includes(((s-p.sa.sign+12)%12)+1);return (tj(s7)||tj(sl7)?2:0)+(ts(s7)||ts(sl7)?1.5:0)};
  const mc=[];for(const d of DA)for(const a of d.ads){const sA=yrs(birth,a.a),eA=yrs(birth,a.b);if(eA<21||sA>36)continue;const mid=new Date((Math.max(a.a,birth)+ +a.b)/2);mc.push({md:d.l,l:a.l,a:a.a,b:a.b,sc:msig(d.l)*.7+msig(a.l)+dt(mid)-(sA>32?1:0)})}
  mc.sort((x,y)=>y.sc-x.sc);const mw=mc[0]||null;const mw2=mc.slice(1,3).sort((x,y)=>x.a-y.a);const married=mw&&mw.a<now;
  // relationship indicators
  const h7=inH(7);const RI=[];const addR=(c,t,w)=>{if(c)RI.push({t,w})};
  addR([6,8,12].includes(g[l7].house),X.RI.l7(PL[l7],ord(g[l7].house)),2);
  addR(h7.some(k=>MALS.includes(k)),X.RI.mal7(h7.filter(k=>MALS.includes(k)).map(k=>PL[k]).join(X.and)),2);
  addR([1,2,4,7,8,12].includes(g.ma.house),X.RI.mang(ord(g.ma.house)),1);
  addR(g.ve.dig==="de"||afflicted("ve"),X.RI.ven(g.ve.dig==="de"),1.5);
  addR(aspects("sa",7)&&!h7.includes("sa"),X.RI.sa7,1);
  addR(g.ve.sign===g.ra.sign||g.ve.sign===g.ma.sign,X.RI.vra(g.ve.sign===g.ra.sign?PL.ra:PL.ma),1.5);
  addR(MOD(g[l7].sign)===2&&(g[l7].house===12||g.ve.house===12),X.RI.dual,1.5);
  addR(g.ra.house===7||g.ke.house===7,X.RI.node(g.ra.house===7?PL.ra:PL.ke),1);
  const rw=RI.reduce((s,x)=>s+x.w,0)-(card[6].s-5)*.5;const riskK=rw>=5?"High":rw>=2.5?"Moderate":"Low";
  const badL=new Set([lordOf(6),lordOf(8),lordOf(12)]);const strainP=mw?allAD.filter(x=>x.a>mw.b&&yrs(birth,x.a)<70&&badL.has(x.l)&&(badL.has(x.md)||MALS.includes(x.md))).slice(0,4):[];
  const l5=lordOf(5);const c5=hScore(5,"ju");const childP=mw?allAD.filter(x=>x.a>=mw.a&&yrs(birth,x.a)<45&&(x.l===l5||x.l==="ju"||g[x.l].house===5||x.md===l5)).slice(0,3):[];
  const childT=X.child[c5>=6.5?0:c5>=4.5?1:2];
  // career
  const l10=lordOf(10);const c10=[...new Set([l10,...inH(10)])];
  const goodC=new Set([l10,lordOf(11),lordOf(2),lordOf(9),...inH(10),...inH(11)]);
  const careerP=allAD.filter(x=>x.b>now&&yrs(now,x.a)<20).map(x=>({...x,g:goodC.has(x.l)&&!badL.has(x.l)?1:badL.has(x.l)&&!goodC.has(x.l)?-1:0}));
  // health
  const affP=[...new Set([...inH(6),...inH(8),...inH(1)].filter(k=>MALS.includes(k)))];
  const bodyAreas=[...new Set([X.BODY[g[lordOf(6)].house-1],X.BODY[g[lordOf(8)].house-1],...affP.map(k=>X.BODY[g[k].house-1])])].slice(0,4);
  const pAreas=[...new Set([lordOf(6),lordOf(8),...affP])].map(k=>X.PBODY[k]).slice(0,4);
  const mar=[lordOf(2),lordOf(7)];const careP=allAD.filter(x=>x.b>now&&yrs(now,x.a)<25&&((badL.has(x.l)&&badL.has(x.md))||(mar.includes(x.l)&&[lordOf(8),"sa","ra"].includes(x.md)))).slice(0,5);
  const prec=[...new Set([lordOf(6),lordOf(8),...affP,...Object.keys(g).filter(k=>pStr(k)<-1)])].slice(0,5).map(k=>`${PL[k]}: ${X.PCARE[k]}`);
  // longevity (Jaimini three pairs)
  const pr=(a,b)=>{const x=MOD(a),y=MOD(b);if((x===0&&y===1)||(x===1&&y===0)||(x===2&&y===2))return 3;if((x===0&&y===0)||(x===1&&y===2)||(x===2&&y===1))return 2;return 1};
  const pairs=[pr(g[lordOf(1)].sign,g[lordOf(8)].sign),pr(ls,g.mo.sign),pr(g.sa.sign,g.mo.sign)];
  const cnt=[1,2,3].map(v=>pairs.filter(p=>p===v).length);const cls=cnt[2]>=2?3:cnt[1]>=2?2:cnt[0]>=2?1:pairs[1];
  const BASE={3:[72,90],2:[62,78],1:[55,70]};const lgS=pStr(lordOf(1))+pStr(lordOf(8))*.5+(hScore(8)-5)*.4;
  let span=[Math.round(BASE[cls][0]+lgS*1.5),Math.round(BASE[cls][1]+lgS*1.5)];const ageNow=yrs(birth,now);if(span[0]<ageNow+5)span=[Math.ceil(ageNow+5),Math.max(Math.ceil(ageNow+15),span[1])];
  const h8=inH(8);const vuln=[X.v8(SG[(ls+7)%12],X.BODY[7],h8.map(k=>X.v8o(PL[k],X.PBODY[k])).join(" · ")),X.v8l(PL[lordOf(8)],ord(g[lordOf(8)].house),X.BODY[g[lordOf(8)].house-1])];
  // stages
  const A0=Math.floor(ageNow);const STR=[[0,0,12],[1,13,19],[2,20,mw?Math.max(21,Math.floor(ab(mw.a))):26],[3,mw?Math.floor(ab(mw.a)):26,mw?Math.ceil(ab(mw.b)):28],[4,mw?Math.ceil(ab(mw.b)):28,Math.max(35,A0)],[5,A0,A0+1],[6,A0+1,A0+6],[7,A0+6,A0+16],[8,A0+16,85]].filter(s=>s[2]>s[1]);
  const stages=STR.map(([i,a0,a1])=>{const A=new Date(birth.getTime()+a0*365.2425*864e5),B=new Date(birth.getTime()+a1*365.2425*864e5);const ds=allAD.filter(x=>x.b>A&&x.a<B);const mds=[...new Set(ds.map(x=>x.md))];
    const good=ds.filter(x=>ok(x.l)).length,bad=ds.length-good;const tone=X.tone[good>bad*1.5?0:bad>good*1.5?1:2];
    const themes=[...new Set(ds.map(x=>g[x.l].house))].slice(0,4).map(topic);const past=B<now,cur=A<=now&&B>now;
    const ex=i===0?(hScore(4,"mo")>=6?X.ex.home1:X.ex.home0):i===1?(hScore(5,"me")>=6?X.ex.stu1:X.ex.stu0):i===2?X.ex.car(c10.map(k=>X.F[k]).join("; ")):i===3?X.ex.mar:i===5?(()=>{const c=allAD.find(x=>x.a<=now&&x.b>now);return c?X.ex.now(PL[c.md]+"–"+PL[c.l],my(c.b),read(c.l).txt):""})():"";
    return {n:X.ST[i],age:i===5?`${A0}`:`${a0}–${a1}`,when:`${my(A<birth?birth:A)} – ${my(B)}`,past,cur,dashas:mds.map(k=>PL[k]).join(" → "),txt:X.stTxt(past,tone,themes.join(", "),ex)}});
  // numerology
  const red=n=>{while(n>9&&![11,22,33].includes(n))n=String(n).split("").reduce((s,c)=>s+ +c,0);return n};
  const [Y,M,Dd]=R.b.date.split("-").map(Number);const lifePath=red((String(Y)+String(M)+String(Dd)).split("").reduce((s,c)=>s+ +c,0));const birthN=red(Dd);
  const CH={a:1,i:1,j:1,q:1,y:1,b:2,k:2,r:2,c:3,g:3,l:3,s:3,d:4,m:4,t:4,e:5,h:5,n:5,x:5,u:6,v:6,w:6,o:7,z:7,f:8,p:8};const nameN=red((R.b.name||"").toLowerCase().replace(/[^a-z]/g,"").split("").reduce((s,c)=>s+(CH[c]||0),0)||1);
  const PY=[0,1,2,3,4,5].map(i=>{const y=now.getFullYear()+i;return {y,n:red(red(M)+red(Dd)+red(y))}});
  return {l,X,PL,SG,card,mw,mw2,married,RI,riskK,stabT:X.stab[riskK],strainP,childT,childP,c10:c10.map(k=>X.F[k]),careerP,bodyAreas,pAreas,careP,prec,
    longevity:{cls:X.CLS[cls][0],note:X.CLS[cls][1],span,pairs},vuln,stages,num:{lifePath,birthN,nameN,PY,NM:X.NM,lucky:X.lucky[lifePath]},read,ageNow,allAD}};
J.jyOrdinal=n=>T.en.ord(n);J.jyHouseTopics=T.en.HT;

// ---------------- graphics ----------------
function radar(card){const N=card.length,cx=170,cy=165,R=120;const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/N;return [cx+Math.cos(a)*R*v/10,cy+Math.sin(a)*R*v/10]};
  const grid=[2,4,6,8,10].map(v=>`<polygon points="${card.map((_,i)=>pt(i,v).join(",")).join(" ")}" fill="none" stroke="#E2B9A0" stroke-width="1"/>`).join("");
  const lab=card.map((c,i)=>{const [x,y]=pt(i,12.4);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="lr-lab">${esc(c.n.split(/ & | व | ও /)[0])}</text>`}).join("");
  return `<svg viewBox="0 0 340 330" class="lr-radar" role="img">${grid}<polygon points="${card.map((c,i)=>pt(i,c.s).join(",")).join(" ")}" fill="rgba(229,57,53,.28)" stroke="#B71C1C" stroke-width="2.5"/>${card.map((c,i)=>{const [x,y]=pt(i,c.s);return `<circle cx="${x}" cy="${y}" r="3.5" fill="#B71C1C"/>`}).join("")}${lab}</svg>`}
const bars=(card,hs)=>`<div class="lr-bars">${card.map(c=>`<div class="lr-bar"><span>${esc(c.n)} <small>(${hs}${c.h})</small></span><i><b style="width:${c.s*10}%;background:${c.s>=7?"#2E7D32":c.s>=5?"#F9A825":"#C62828"}"></b></i><em>${c.s.toFixed(1)}</em></div>`).join("")}</div>`;
function timeline(R,L){const X=L.X.TL,birth=R.date,W=900,H=150,maxY=90,x=a=>20+a/maxY*(W-40);const COL={su:"#FB8C00",mo:"#90A4AE",ma:"#E53935",me:"#43A047",ju:"#FDD835",ve:"#EC407A",sa:"#3949AB",ra:"#6D4C41",ke:"#8D6E63"};
  const bands=R.dasha.list.filter(d=>d.b>birth).map(d=>{const a=Math.max(0,yrs(birth,d.a)),b=Math.min(maxY,yrs(birth,d.b));if(a>=maxY)return "";return `<rect x="${x(a)}" y="40" width="${x(b)-x(a)}" height="34" fill="${COL[d.l]}" opacity=".85"/><text x="${(x(a)+x(b))/2}" y="61" text-anchor="middle" class="lr-t">${esc(L.PL[d.l])}</text>`}).join("");
  const ticks=[0,10,20,30,40,50,60,70,80,90].map(a=>`<line x1="${x(a)}" y1="76" x2="${x(a)}" y2="82" stroke="#7B1E1E"/><text x="${x(a)}" y="95" text-anchor="middle" class="lr-s">${a}</text>`).join("");
  const st=[[0,12],[13,19],[20,30],[30,45],[45,60],[60,90]].map(([a,b],i)=>`<rect x="${x(a)}" y="104" width="${x(b)-x(a)}" height="18" fill="${i%2?"#FFE0B2":"#FFF3E0"}"/><text x="${(x(a)+x(b))/2}" y="117" text-anchor="middle" class="lr-s">${esc(X.st[i])}</text>`).join("");
  const now=L.ageNow,mw=L.mw?[yrs(birth,L.mw.a),yrs(birth,L.mw.b)]:null,ls=L.longevity.span;
  return `<svg viewBox="0 0 ${W} ${H}" class="lr-tl" role="img"><text x="20" y="18" class="lr-s">${esc(X.h)}</text>${bands}${ticks}${st}
   ${mw?`<rect x="${x(mw[0])}" y="30" width="${Math.max(4,x(mw[1])-x(mw[0]))}" height="54" fill="none" stroke="#C2185B" stroke-width="2.5" stroke-dasharray="4 3"/><text x="${x(mw[0])}" y="28" class="lr-s" fill="#C2185B">${esc(X.mw)}</text>`:""}
   <line x1="${x(now)}" y1="26" x2="${x(now)}" y2="126" stroke="#000" stroke-width="2"/><text x="${x(now)+4}" y="${mw&&Math.abs(x(now)-x(mw[0]))<110?140:28}" class="lr-s">▼ ${esc(X.now)} (${Math.floor(now)})</text>
   <rect x="${x(Math.min(ls[0],maxY))}" y="126" width="${Math.max(2,x(Math.min(ls[1],maxY))-x(Math.min(ls[0],maxY)))}" height="6" fill="#455A64" opacity=".5"/><text x="${x(Math.min(ls[0],maxY))}" y="146" class="lr-s">${esc(X.ls)}</text></svg>`}
function sky3d(R,L){const g=R.gr,ord=AK().ORDER,SG=L.SG,PL=L.PL;const C={su:"#FB8C00",mo:"#CFD8DC",ma:"#E53935",me:"#43A047",ju:"#FDD835",ve:"#F48FB1",sa:"#3949AB",ra:"#6D4C41",ke:"#A1887F"};const rd=d=>d*Math.PI/180;
  const ring=SG.map((s,i)=>{const a=rd(i*30+15-90),b=rd(i*30-90);return `<text x="${200+Math.cos(a)*172}" y="${200+Math.sin(a)*172}" text-anchor="middle" dominant-baseline="middle" class="s3-sg">${esc(L.l==="en"?s.slice(0,3):s.split(" ")[0])}</text><line x1="${200+Math.cos(b)*150}" y1="${200+Math.sin(b)*150}" x2="${200+Math.cos(b)*190}" y2="${200+Math.sin(b)*190}" stroke="#C9A227"/>`}).join("");
  const pl=ord.map((k,i)=>{const a=rd(g[k].lon-90),r=60+i*9.5;return {k,x:200+Math.cos(a)*r,y:200+Math.sin(a)*r,r}});const asc=rd(R.asc-90);
  return `<div class="s3"><div class="s3-stage"><svg viewBox="0 0 400 400" class="s3-disc"><defs>${ord.map(k=>`<radialGradient id="s3${k}" cx="35%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${C[k]}"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>`).join("")}</defs>
   <circle cx="200" cy="200" r="190" fill="#0D1B3E"/><circle cx="200" cy="200" r="150" fill="none" stroke="#C9A227"/>${ring}${pl.map(p=>`<circle cx="200" cy="200" r="${p.r}" fill="none" stroke="rgba(255,255,255,.08)"/>`).join("")}
   <line x1="200" y1="200" x2="${200+Math.cos(asc)*190}" y2="${200+Math.sin(asc)*190}" stroke="#FFD54F" stroke-width="2" stroke-dasharray="5 4"/><text x="${200+Math.cos(asc)*130}" y="${200+Math.sin(asc)*130}" class="s3-asc">${esc(L.X.asc)}</text>
   <circle cx="200" cy="200" r="16" fill="url(#s3su)" opacity=".5"/>${pl.map(p=>`<g><circle cx="${p.x}" cy="${p.y}" r="${p.k==="su"?11:p.k==="mo"?9:8}" fill="url(#s3${p.k})"/><text x="${p.x}" y="${p.y-13}" text-anchor="middle" class="s3-pl">${esc(PL[p.k])}</text></g>`).join("")}</svg></div>
   <p class="hint" style="text-align:center;margin:6px 0 0">${esc(L.X.sky)}</p></div>`}

// ---------------- chart explanations ----------------
J.jyChartTable=(R,base,mode,lang)=>{const l=LGX(lang),X=T[l],PL=PLL(l),SG=SGL(l);const g=R.gr,LORD=KK().LORD;const sgOf=k=>mode==="d9"?g[k].nav:g[k].sign;const lordOf=h=>LORD[(base+h-1)%12];
  const rows=[...Array(12).keys()].map(i=>{const h=i+1,s=(base+i)%12;const occ=Object.keys(g).filter(k=>sgOf(k)===s);const lord=lordOf(h);const lh=((sgOf(lord)-base+12)%12)+1;
    const ben=occ.filter(k=>BEN.includes(k)),mal=occ.filter(k=>MALS.includes(k));const t=X.CT.t;
    const tone=ben.length>mal.length?t.sup:mal.length>ben.length?([3,6,10,11].includes(h)?t.ene:t.pre):occ.length?t.mix:[6,8,12].includes(lh)?t.weak:[1,4,5,7,9,10].includes(lh)?t.lsup:t.avg;
    return `<tr><td class="num"><b>${h}</b></td><td>${esc(SG[s])}</td><td>${occ.length?occ.map(k=>esc(PL[k])+(g[k].retro?" ℞":"")).join(", "):"—"}</td><td>${esc(PL[lord])} → ${X.hs}${lh}</td><td>${esc(mode==="d9"&&h===7?X.CT.d97:mode==="d9"&&h===1?X.CT.d91:X.HT[i])} — <i>${esc(tone)}</i></td></tr>`}).join("");
  return `<table class="kun-tbl lr-ct"><thead><tr>${X.CT.h.map(x=>`<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`};
J.jyChartNoteL=(k,lang)=>T[LGX(lang)].NOTE[k];J.jyChartNote=new Proxy({},{get:(_,k)=>T[LGX()].NOTE[k]});
J.jyDashaCol=lang=>T[LGX(lang)].dcol;
J.jyDashaNote=(R,pl,lang)=>{const L=J.jyLife.cache&&J.jyLife.cache.l===LGX(lang)?J.jyLife.cache:(J.jyLife.cache=J.jyLife(R,lang));const r=L.read(pl);return `${r.txt}. ${L.X.dn(r.good)}`};

// ---------------- HTML ----------------
J.jyLifeHtml=(R,part,lang)=>{const L=J.jyLife(R,lang);J.jyLife.cache=L;const X=L.X,P=L.PL,my=d=>myL(d,L.l);
  const li=a=>`<ul class="jy-l">${a.map(x=>`<li${x.c?` class="${x.c}"`:""}>${x.t}</li>`).join("")}</ul>`;
  const per=x=>esc(`${my(x.a)} – ${my(x.b)} (${X.age} ${Math.floor(yrs(R.date,x.a))}–${Math.ceil(yrs(R.date,x.b))}) · ${P[x.md]}–${P[x.l]}`);
  const sec={
  card:()=>`<section class="lr"><h3>${X.H.card}</h3><p class="hint">${esc(X.H.cardH)}</p><div class="lr-card">${radar(L.card)}${bars(L.card,X.hs)}</div></section>`,
  tl:()=>`<section class="lr"><h3>${X.H.tl}</h3>${timeline(R,L)}</section>`,
  sky:()=>`<section class="lr"><h3>${X.H.sky}</h3>${sky3d(R,L)}</section>`,
  stages:()=>`<section class="lr"><h3>${X.H.stages}</h3><div class="lr-stages">${L.stages.map(s=>`<div class="lr-st ${s.cur?"cur":s.past?"past":"fut"}"><div class="lr-sh"><b>${esc(s.n)}</b><span>${esc(X.age)} ${esc(s.age)} · ${esc(s.when)}</span></div><div class="hint">${esc(X.H.dasha)}: ${esc(s.dashas)}</div><p>${esc(s.txt)}</p></div>`).join("")}</div></section>`,
  rel:()=>`<section class="lr"><h3>${X.H.rel}</h3>${li([
      {t:`<b>${X.R.mw}:</b> `+(L.mw?per(L.mw)+(L.mw2.length?` · ${X.R.also}: ${L.mw2.map(per).join("; ")}`:""):esc(X.R.nomw))},
      {t:`<b>${X.R.sp}:</b> ${esc(X.R.sp7(L.SG[(R.ls+6)%12]))} — ${esc(KK().TX[L.l].lagna[(R.ls+6)%12])}`},
      {t:`<b>${X.R.stab}:</b> ${esc(L.stabT)} <span class="chip ${L.riskK==="High"?"bad":L.riskK==="Moderate"?"warn":"ok"}">${X.R.risk}: ${X.risk[L.riskK]}</span>`},
      ...L.RI.map(x=>({t:esc(x.t),c:"warn"})),
      ...(L.strainP.length?[{t:`<b>${X.R.strain}:</b> ${L.strainP.map(per).join("; ")}`,c:"warn"}]:[]),
      {t:`<b>${X.R.ch}:</b> ${esc(L.childT)}${L.childP.length?` ${X.R.chp}: ${L.childP.map(per).join("; ")}.`:""}`}])}<p class="hint">${esc(X.R.note)}</p></section>`,
  car:()=>`<section class="lr"><h3>${X.H.car}</h3>${li([{t:`<b>${X.C.fields}:</b> ${esc(L.c10.join("; "))}`},...L.careerP.slice(0,8).map(x=>({t:`${per(x)} — ${esc(X.C.g[x.g>0?0:x.g<0?2:1])}`,c:x.g>0?"ok":x.g<0?"warn":""}))])}</section>`,
  hea:()=>`<section class="lr"><h3>${X.H.hea}</h3>${li([{t:`<b>${X.He.body}:</b> ${esc(L.bodyAreas.join("; "))}`},{t:`<b>${X.He.pl}:</b> ${esc(L.pAreas.join("; "))}`},...(L.careP.length?[{t:`<b>${X.He.per}:</b> ${L.careP.map(per).join("; ")}`,c:"warn"}]:[]),...L.prec.map(t=>({t:esc(t)}))])}</section>`,
  life:()=>`<section class="lr"><h3>${X.H.life}</h3>${li([{t:`<b>${esc(L.longevity.cls)}</b> — ${esc(L.longevity.note)}.`},{t:X.L.band(L.longevity.span[0],L.longevity.span[1])},...L.vuln.map(t=>({t:`<b>${X.L.v}:</b> ${esc(t)}`}))])}<p class="hint">${esc(X.L.note)}</p></section>`,
  num:()=>`<section class="lr"><h3>${X.H.num}</h3><div class="lr-num"><div><b>${L.num.lifePath}</b><span>${X.N.lp}</span><small>${esc(L.num.NM[L.num.lifePath])}</small></div><div><b>${L.num.birthN}</b><span>${X.N.bn}</span><small>${esc(L.num.NM[L.num.birthN])}</small></div><div><b>${L.num.nameN}</b><span>${X.N.nn}</span><small>${esc(L.num.NM[L.num.nameN])}</small></div></div>
     <p><b>${X.N.lucky}:</b> ${esc(L.num.lucky||"")}</p><table class="kun-tbl"><thead><tr><th>${X.N.yr}</th><th>${X.N.py}</th><th>${X.N.th}</th></tr></thead><tbody>${L.num.PY.map(p=>`<tr><td>${p.y}</td><td class="num"><b>${p.n}</b></td><td>${esc(L.num.NM[p.n])}</td></tr>`).join("")}</tbody></table></section>`};
  return (part||Object.keys(sec)).map(k=>sec[k]()).join("")};
document.addEventListener("click",e=>{const s=e.target.closest?.(".s3-stage");if(s)s.classList.toggle("paused")});
const css=document.createElement("style");css.textContent=`.lr{margin:16px 0}.lr-card{display:grid;grid-template-columns:1fr;gap:10px}.lr-radar{width:100%;max-width:440px;margin:0 auto;display:block}.lr-lab{font-size:9.5px;fill:#7B1E1E;font-weight:600}
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
