/* Federal Bank One (OneCard) credit-card statement reader — plugs into Bills, taxes & dues → Credit cards (ccard.js parseStmt).
   Reads: statement date & billing period, card, total / minimum due, due date, opening balance, spends, interest, fees, repayments & refunds,
   EMI, “paid via points”, every transaction (date, merchant, category, type, reward points, amount) and the fee-invoice number.
   The PDF text comes out with labels and values on different rows, so each figure is taken from its label's row or the row just above it,
   and the result is checked against Total due = opening + spends + interest + fees − repayments − EMI − points. */
(()=>{
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};const pad=n=>String(n).padStart(2,"0");
const nn=s=>{const v=parseFloat(String(s==null?"":s).replace(/[,₹`\s]/g,""));return isNaN(v)?0:v};
const r2=x=>Math.round(x*100)/100;
const DEC=/-?\d[\d,]*\.\d{2}(?!\d)/g;
const dmy=(d,m,y)=>y+"-"+pad(MON[m.toLowerCase().slice(0,3)])+"-"+pad(+d);
const is=T=>/federal\s+bank\s+one|one\s+credit\s+card|getonecard/i.test(T);
function parse(lines){const L0=lines.map(x=>String(x).replace(/\s+/g," ").trim()).filter(Boolean);const L=[];
  // a row whose reward-points figure landed on the next text row is joined back: “01 May Paid With Points 100.00” + “-1000.00”
  for(let i=0;i<L0.length;i++){const m=/^(\d{1,2}\s+[A-Za-z]{3}\s+Paid\s+With\s+Points)\s+(\d[\d,]*\.\d{2})$/i.exec(L0[i]);if(m&&/^-?\d[\d,]*\.\d{2}$/.test(L0[i+1]||"")){L.push(m[1]+" "+L0[i+1]+" "+m[2]);i++}else L.push(L0[i])}
  const T=L.join("\n");
  const last=s=>{const m=(s||"").match(DEC);return m?nn(m[m.length-1]):null};
  // value of a summary line: decimals on the label's own row (after the label), else the row just above
  const val=re=>{const i=L.findIndex(l=>re.test(l));if(i<0)return null;const own=L[i].replace(re,"").replace(/\(as on[^)]*\)/i,"");const a=last(own.replace(/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/g,""));return a!=null?a:last(L[i-1]||"")};
  const o={bank:"Federal Bank One"};
  const per=/\((\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\s*-\s*(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\)/.exec(T);
  if(per){o.from=dmy(per[1],per[2],per[3]);o.to=dmy(per[4],per[5],per[6])}
  const si=L.findIndex(l=>/Statement\s+Date/i.test(l));let sd=null;for(let j=si;j>=0&&j<=si+3&&!sd;j++){const m=/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(L[j].replace(/Opening[\s\S]*$/,""));if(m&&j>si-1)sd=m}
  if(!sd)throw new Error("Statement date not found — is this a Federal Bank One statement?");o.date=dmy(sd[1],sd[2],sd[3]);if(!o.to)o.to=o.date;
  const cm=/(\d{4})-?(\d{2}[Xx]{2})-?([Xx]{4})-?(\d{4})/.exec(T);o.card=cm?cm[0]:"";o.last4=cm?cm[4]:"";
  const di=L.findIndex(l=>/Payment\s+Due\s+Date/i.test(l));for(let j=di;j>=0&&j<=di+2&&!o.due;j++){const m=/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(L[j].replace(/Payment\s+Due\s+Date/i,""));if(m)o.due=dmy(m[1],m[2],m[3])}
  const mins=[...T.matchAll(/Minimum\s+Amount\s+Due\s+(-?[\d,]*\d\.\d{2})/gi)].map(m=>nn(m[1]));const mrow=L.findIndex(l=>/^Minimum\s+Amount\s+Due$/i.test(l));o.min=mins.length?mins[mins.length-1]:(mrow>=0?(last(L[mrow+1])||0):0);
  const tots=[...T.matchAll(/Total\s+Amount\s+Due\s+(-?[\d,]*\d\.\d{2})/gi)].map(m=>nn(m[1]));
  const open=val(/Opening\s+Balance/i)||0,spends=val(/Spends\s*\(in[^)]*\)\s*\+?|Spends\s*\+?/i)||0,interest=val(/Interest\s+Charges[^+]*\+?/i)||0,fees=val(/Fees\s*&\s*Charges[^+]*\+?/i)||0,repay=val(/Repayments\s*&\s*Refunds\s*-?/i)||0,emi=val(/New\s+EMI\s*-?/i)||0,pts=val(/Paid\s+via\s+points\s*-?/i)||0;
  const calc=r2(open+spends+interest+fees-repay-emi-pts);o.total=tots.find(t=>Math.abs(t-calc)<0.02)??tots[tots.length-1]??calc;
  // transactions
  const NOISE=/^(Transaction|Reward|Date|Merchant Name|Type|Points|Amount \(Rs\.\)|TRANSACTION HISTORY|SUMMARY|IMPORTANT)/i;
  const tx=[];let pend=[];
  for(let i=0;i<L.length;i++){const l=L[i];const m=/^(\d{1,2})\s+([A-Za-z]{3})\s*(.*?)\s*(-?\d[\d,]*\.\d{2})\s+(\d[\d,]*\.\d{2})$/.exec(l);
    if(m&&MON[m[2].toLowerCase()]&&!/Opening|Statement|Due/i.test(l)){const mid=m[3].trim();const yr=(o.from&&+m[2]&&0)||0;
      const mn=MON[m[2].toLowerCase()];let y=+o.to.slice(0,4);if(o.from&&mn>+o.to.slice(5,7)&&+o.from.slice(5,7)>+o.to.slice(5,7)||(mn>+o.to.slice(5,7)&&!o.from))y--;
      const d=y+"-"+pad(mn)+"-"+pad(+m[1]);const pts=nn(m[4]),amt=nn(m[5]);
      const tm=/\b(TOKEN_ECOM|ECOM|POS|ECOMM?|CONTACTLESS|NFC|UPI|ATM)\b/.exec(mid);const type=tm?tm[1]:"";let rest=mid.replace(type,"").trim();
      if(/Paid\s+With\s+Points/i.test(mid)){tx.push({d,t:"",desc:"Paid with reward points",amt,cr:true,pts:Math.abs(pts),type:"POINTS"});pend=[];continue}
      // merchant: text on the row, else the text-only rows just above (wrapped names)
      let cat="";const cm2=/(Bills and Utilities|Insurance|Repayments|Fuel|Food|Shopping|Travel|Entertainment|Grocery|Health)\s*$/i.exec(rest);if(cm2){cat=cm2[1];rest=rest.slice(0,cm2.index).trim()}
      const above=pend.slice(-3).filter(x=>!NOISE.test(x));let desc=(above.join(" ")+" "+rest).replace(/\s+/g," ").trim();
      // a trailing one-word row right after (e.g. “Insurance”) is the category of the line above
      const nx=L[i+1]&&!/\d/.test(L[i+1])&&!NOISE.test(L[i+1])&&L[i+1].split(" ").length<=2&&/^(Insurance|Shopping|Travel|Fuel|Food|Grocery|Health|Entertainment)$/i.test(L[i+1])?L[i+1]:"";if(nx&&!cat)cat=nx;
      tx.push({d,t:"",desc:desc||type||"Card transaction",amt,cr:false,pts,type,cat});pend=[];continue}
    if(!/\d/.test(l)&&!NOISE.test(l)&&l.length<60&&!/^Repayments$/i.test(l))pend.push(l);else if(/\d/.test(l))pend=[]}
  // paid-with-points rows are separate lines of the same kind: fold them into one line so the list stays short
  const pr=tx.filter(t=>t.type==="POINTS");let out=tx.filter(t=>t.type!=="POINTS");
  if(pr.length){const seen=r2(pr.reduce((s,t)=>s+t.amt,0));out.push({d:pr[0].d,t:"",desc:"Paid with reward points ("+pr.length+" redemptions)",amt:pts>0?pts:seen,cr:true,type:"POINTS"})};
  out.sort((a,b)=>a.d.localeCompare(b.d));o.tx=out;
  o.prev=open;o.credits=r2(repay+pts+emi);o.purch=spends;o.fin=r2(interest+fees);o.interest=interest;o.fees=fees;o.pointsPaid=pts;o.repay=repay;o.emi=emi;
  const earned=r2(out.filter(t=>!t.cr).reduce((s,t)=>s+(t.pts||0),0)),used=pts>0?r2(pts*10):r2(pr.reduce((s,t)=>s+t.pts,0));o.rp={earned,used,open:null,bal:null};
  const iv=/Invoice\s+No\.?\s*-?\s*([A-Za-z0-9\/]+)/i.exec(T);if(iv)o.invoice=iv[1];
  const chk=r2(out.filter(t=>!t.cr).reduce((s,t)=>s+t.amt,0));o.check={spendsMatch:Math.abs(chk-spends)<0.02,totalMatch:Math.abs(o.total-calc)<0.02,txSum:chk};
  if(!o.check.totalMatch)o.warn="Total due does not equal opening + spends + interest + fees − repayments − points — check the figures.";
  return o}
if(typeof window!=="undefined"&&window.J)window.J._ccFed={is,parse};
if(typeof module!=="undefined")module.exports={is,parse};
})();
