/* Axis Bank credit-card statement reader (Google Pay Flex Axis Bank Credit Card and other Axis cards) — plugs into
   Bills, taxes & dues → Credit cards (ccard.js parseStmt), same as the Federal One reader.
   Reads: card number, holder, statement period, statement date, payment due date, total and minimum due, credit / cash limits,
   the printed summary row (previous balance, payments, credits, purchases, cash advance, other debits & charges) and every
   transaction row  “DD/MM/YYYY  details  merchant category  amount Dr|Cr”.
   “STARS REDEEMED ON GOOGLE PAY” credits are the reward redemptions (type POINTS); “CC-UPI FUEL SURCHARGE” / “GST ON FUEL SURCHARGE” are
   charges (kept apart from purchases). The result is checked: total due = previous + purchases + charges + cash − credits − payments.
   Axis “Duplicate Statement” PDFs are often a picture, not text: the app then reads them by text recognition and flags the amounts
   to be checked — the check line shows whether the rows add up to the printed total. */
(()=>{
const pad=n=>String(n).padStart(2,"0");
const nn=s=>{const v=parseFloat(String(s==null?"":s).replace(/[,₹`\s]/g,""));return isNaN(v)?0:v};
const r2=x=>Math.round(x*100)/100;
const dmy=s=>{const m=/(\d{2})\/(\d{2})\/(\d{4})/.exec(s||"");return m?m[3]+"-"+m[2]+"-"+m[1]:""};
const is=T=>/axis\s*bank/i.test(T)&&/credit\s*card/i.test(T)&&/(?:total\s+payment\s+due|payment\s+summary|merchant\s+category)/i.test(T);
const CATS=["MISCELLANEOUS","MISC STORE","DEPT STORES","RESTAURANTS","FOOD PRODUCTS","RETAIL STORES","MEDICAL","FUEL","HOTELS","JEWELLERY","UTILITIES","MOTO","GROCERY","TRAVEL","ENTERTAINMENT","EDUCATION","INSURANCE","TELECOM","CLOTHING","ELECTRONICS","SERVICES","TRANSPORT","AIRLINES","CASH","WALLET","GOVERNMENT","JEWELRY","BEAUTY","SPORTS","AUTOMOTIVE","HEALTH"].sort((a,b)=>b.length-a.length);
const AMT=/([\d,]*\d\.\d{2})\s*(Dr|Cr)\b/i;
function parse(lines){
  const T=lines.join("\n");const o={bank:"Axis Bank",product:/google\s*pay\s*flex/i.test(T)?"Google Pay Flex Axis Bank Credit Card":"Axis Bank Credit Card"};
  const after=(lab,re,span=120)=>{const m=new RegExp(lab,"i").exec(T);if(!m)return null;return new RegExp(re).exec(T.slice(m.index+m[0].length,m.index+m[0].length+span))};
  const per=/(\d{2}\/\d{2}\/\d{4})\s*(?:-|–|to)\s*(\d{2}\/\d{2}\/\d{4})/i.exec(T);o.from=per?dmy(per[1]):"";o.to=per?dmy(per[2]):"";
  const gen=after("Statement\\s+Generation\\s+Date","(\\d{2}\\/\\d{2}\\/\\d{4})",200);o.date=o.to||(gen?dmy(gen[1]):"");
  if(!o.date)throw new Error("Statement date not found — is this an Axis Bank credit-card statement?");
  // due date = the date that is neither the period nor the statement date
  const ds=[...T.matchAll(/(\d{2}\/\d{2}\/\d{4})/g)].map(m=>dmy(m[1]));o.due=ds.find(d=>d&&d!==o.from&&d!==o.to&&d!==o.date&&d>o.date)||"";
  const cm=/(\d{6}[\s*Xx]{4,10}\d{4})/.exec(T);o.card=cm?cm[1].replace(/\s/g,""):"";o.last4=o.card.slice(-4);
  const hm=/(?:Name)\s+([A-Za-z][A-Za-z .]+?)\s*(?:\n|$)/.exec(T);o.holder=hm?hm[1].trim():"";
  const money=l=>[...String(l).matchAll(/[\d,]*\d\.\d{2}/g)].map(m=>nn(m[0]));
  const vl=lines.find(l=>/(\d{2}\/\d{2}\/\d{4})\s*(?:-|–|to)\s*\d{2}\/\d{2}\/\d{4}/.test(l)&&money(l).length>=2);
  if(vl){const n=money(vl.replace(/\d{2}\/\d{2}\/\d{4}/g,""));o.total=n[0];o.min=n[1]}
  else{const tp=after("Total\\s+Payment\\s+Due","([\\d,]*\\d\\.\\d{2})",60),mp=after("Minimum\\s+Payment\\s+Due","([\\d,]*\\d\\.\\d{2})",60);o.total=tp?nn(tp[1]):null;o.min=mp?nn(mp[1]):0}
  const ll=lines.find(l=>/\d{6}[\s*Xx]{4,10}\d{4}/.test(l)&&money(l.replace(/\d{6}[\s*Xx]{4,10}\d{4}/g,"")).length>=3);
  if(ll){const n=money(ll.replace(/\d{6}[\s*Xx]{4,10}\d{4}/g,""));o.limit=n[0];o.avail=n[1];o.cashLimit=n[2]}
  else{const lim=after("Credit\\s+Limit","([\\d,]{5,}\\.\\d{2})",200);if(lim)o.limit=nn(lim[1])}
  // printed summary row: previous, payments, credits, purchase, cash advance, other debit & charges, total
  let sum=null;for(const l of lines){const n=[...l.matchAll(/[\d,]*\d\.\d{2}/g)].map(m=>nn(m[0]));if(n.length>=7&&!/\d{2}\/\d{2}\/\d{4}/.test(l)){sum=n.slice(0,7);break}}
  if(!sum){const i=lines.findIndex(l=>/Previous\s+Balance[\s\S]*Total\s+Payment\s+Due/i.test(l));if(i>=0){const n=[];for(let j=i+1;j<=i+4&&n.length<7;j++)for(const m of lines[j].matchAll(/[\d,]*\d\.\d{2}/g))if(n.length<7)n.push(nn(m[0]));if(n.length>=7)sum=n}}
  o.printed=sum?{prev:sum[0],payments:sum[1],credits:sum[2],purchases:sum[3],cash:sum[4],other:sum[5],total:sum[6]}:null;
  if(o.total==null&&sum)o.total=sum[6];if(o.total==null)throw new Error("Total payment due not found.");
  // transactions
  const tx=[];for(const raw of lines){const l=String(raw).replace(/\s+/g," ").trim();const m=/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/.exec(l);if(!m)continue;const a=AMT.exec(m[2]);if(!a)continue;
    let rest=m[2].slice(0,a.index).trim();const cr=/^cr$/i.test(a[2]);let cat="";
    for(const c of CATS){if(rest.toUpperCase().endsWith(" "+c)){cat=c;rest=rest.slice(0,rest.length-c.length).trim();break}}
    const d=dmy(m[1]);const desc=rest.replace(/\s*\|\s*$/,"").trim();if(!d||!desc)continue;
    const stars=/STARS\s+REDEEMED/i.test(desc),chg=/FUEL\s+SURCHARGE|^GST\s+ON\b|FINANCE\s+CHARGE|LATE\s+PAYMENT|ANNUAL\s+FEE|JOINING\s+FEE|INTEREST/i.test(desc)&&!cr;
    tx.push({d,t:"",desc,cat:cat?cat.charAt(0)+cat.slice(1).toLowerCase():"",amt:nn(a[1]),cr,type:stars?"POINTS":chg?"CHARGE":(cr&&/PAYMENT\s+RECEIVED/i.test(desc)?"REPAY":"")})}
  const dr=r2(tx.filter(t=>!t.cr&&t.type!=="CHARGE").reduce((s,t)=>s+t.amt,0)),ch=r2(tx.filter(t=>t.type==="CHARGE").reduce((s,t)=>s+t.amt,0));
  const cr=r2(tx.filter(t=>t.cr).reduce((s,t)=>s+t.amt,0)),pts=r2(tx.filter(t=>t.type==="POINTS").reduce((s,t)=>s+t.amt,0));
  o.tx=tx.sort((a,b)=>a.d.localeCompare(b.d));
  o.prev=sum?sum[0]:0;o.purch=dr;o.fin=ch;o.fees=ch;o.interest=0;o.credits=cr;o.pointsPaid=pts;o.repay=r2(cr-pts);o.emi=0;
  o.rp={earned:0,used:pts,open:null,bal:null};
  const calc=r2(o.prev+dr+ch-cr);
  o.check={txSum:dr,spendsMatch:sum?Math.abs(dr-sum[3])<0.02:true,totalMatch:Math.abs(calc-o.total)<0.02,chargesMatch:sum?Math.abs(ch-sum[5])<0.02:true};
  if(!o.check.totalMatch)o.warn="Rows do not add up to the printed total due ("+o.total+" printed, "+calc+" from the rows) — check the amounts against the statement.";
  return o}
if(typeof window!=="undefined"&&window.J)window.J._ccAxis={is,parse};
if(typeof module!=="undefined")module.exports={is,parse};
})();
