/* Bank statement PDF reader: text positions → transaction rows (any bank that prints date / narration / amounts / running balance),
   plus counterparty extraction (UPI, NEFT, IMPS, RTGS narrations) for ledger mapping. Works in the browser (pdf.js) and in Node for tests. */
(function(root){
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
const pad=n=>String(n).padStart(2,"0");
function parseDate(s){s=String(s||"").trim();let m=s.match(/^(\d{1,2})[\s\-\/.]([A-Za-z]{3,4})[\s\-\/.,]*(\d{2,4})$/);if(m){const mo=MON[m[2].toLowerCase()];if(!mo)return null;let y=+m[3];if(y<100)y+=2000;return y+"-"+pad(mo)+"-"+pad(+m[1])}
  m=s.match(/^(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{2,4})$/);if(m){let y=+m[3];if(y<100)y+=2000;if(+m[2]>12)return null;return y+"-"+pad(+m[2])+"-"+pad(+m[1])}
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return s;return null}
const AMT=/^(?:INR|Rs\.?|₹)?\s*-?(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}(?:\s*(?:Cr|Dr|CR|DR))?$/;
const LOOSE=/^(?:INR|Rs\.?|₹)?\s*-?(?:\d{1,3}(?:,\d{2,3})*|\d+)(?:\.\d{1,2})?(?:\s*(?:Cr|Dr|CR|DR))?$/;
const num=s=>{const n=parseFloat(String(s).replace(/INR|Rs\.?|₹|[,\s]|Cr|Dr|CR|DR/g,""));return isNaN(n)?null:n};
// group text items into lines per page
function toLines(pages){const lines=[];for(const [pi,p] of pages.entries()){const rows=[];for(const it of p.items){const t=String(it.str||"").trim();if(!t)continue;let r=rows.find(r=>Math.abs(r.y-it.y)<=(p.ocr?4.5:2.5));if(!r){r={y:it.y,page:pi,items:[]};rows.push(r)}r.items.push({t,x:it.x,w:it.w||0})}
  rows.sort((a,b)=>b.y-a.y);for(const r of rows){r.items.sort((a,b)=>a.x-b.x);
    // an amount split in two ("474." + "16", "46,027." + "10 CR") is joined again
    for(let k=0;k<r.items.length-1;k++){const a=r.items[k],b=r.items[k+1];if(((/\d\.$/.test(a.t)&&/^\d{1,2}(\s*(?:CR|DR))?$/i.test(b.t))||(/^\d{1,3}(,\d{2,3})*,$/.test(a.t)&&/^\d{3}\.\d{2}(\s*(?:CR|DR))?$/i.test(b.t)))&&b.x-(a.x+(a.w||0))<8){a.t=a.t+b.t;a.w=(b.x+(b.w||0))-a.x;r.items.splice(k+1,1)}}r.text=r.items.map(i=>i.t).join(" ");lines.push(r)}}return lines}
function splitDate(r){// a line starts a transaction when one of its first items (or first 3 tokens) is a date
  const its=r.items;for(let k=0;k<Math.min(its.length,4);k++){const d=parseDate(its[k].t);if(d)return {date:d,at:k,span:1};if(k+2<its.length){const d3=parseDate(its[k].t+" "+its[k+1].t+" "+its[k+2].t);if(d3)return {date:d3,at:k,span:3}}}
  const m=r.text.match(/^(?:\d{1,4}\s+)?(\d{1,2}[\s\-\/.][A-Za-z]{3,4}[\s\-\/.,]*\d{2,4}|\d{1,2}[\-\/.]\d{1,2}[\-\/.]\d{2,4})\b/);if(m){const d=parseDate(m[1]);if(d)return {date:d,text:m[0]}}return null}
// a narration cut at the column width (23 or 48 characters) continues without a space (…/U + P → …/UP)
const joinD=(a,b,n,full)=>{a=String(a||"");b=String(b||"");n=n==null?a.length:n;return (full===true||(full==null&&(n===23||n===48)))&&a&&b?(a+b).replace(/\s+/g," ").trim():(a+" "+b).replace(/\s+/g," ").trim()};
function parse(pages){const lines=toLines(pages);const all=lines.map(l=>l.text).join("\n");
  const meta={};const g=re=>{const m=all.match(re);return m?m[1].trim():""};
  meta.acNo=g(/Account\s*(?:No\.?|Number)\s*[:\-]?\s*([0-9Xx*]{6,20})/i);meta.ifsc=g(/IFSC(?:\s*Code)?\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})/);meta.micr=g(/MICR\s*(?:Code)?\s*[:\-]?\s*(\d{9})/i);
  const IF={UCBA:"UCO Bank",SBIN:"State Bank of India",HDFC:"HDFC Bank",ICIC:"ICICI Bank",UTIB:"Axis Bank",PUNB:"Punjab National Bank",BARB:"Bank of Baroda",CNRB:"Canara Bank",UBIN:"Union Bank of India",IDFB:"IDFC FIRST Bank",YESB:"Yes Bank",INDB:"IndusInd Bank",BKID:"Bank of India",CBIN:"Central Bank of India",IDIB:"Indian Bank",KKBK:"Kotak Mahindra Bank"};
  meta.ifscBank=IF[(meta.ifsc||"").slice(0,4)]||"";
  meta.bank=meta.ifscBank||(lines.slice(0,40).map(l=>l.text).join("\n").match(/(Kotak Mahindra Bank|State Bank of India|HDFC Bank|ICICI Bank|Axis Bank|Punjab National Bank|Bank of Baroda|Canara Bank|Union Bank of India|IDFC FIRST Bank|Yes Bank|IndusInd Bank|Bank of India|Central Bank of India|Indian Bank|UCO Bank|Federal Bank|Bandhan Bank|AU Small Finance Bank)/i)||[])[1]||(meta.ifsc?({KKBK:"Kotak Mahindra Bank",SBIN:"State Bank of India",HDFC:"HDFC Bank",ICIC:"ICICI Bank",UTIB:"Axis Bank",PUNB:"Punjab National Bank",BARB:"Bank of Baroda",CNRB:"Canara Bank",UBIN:"Union Bank of India",IDFB:"IDFC FIRST Bank",YESB:"Yes Bank",INDB:"IndusInd Bank"})[meta.ifsc.slice(0,4)]||"":"");
  meta.type=g(/Account\s*Type\s*[:\-]?\s*([A-Za-z ]{3,20}?)(?:\s{2,}|\n|$)/i);meta.branch=g(/Branch\s*[:\-]?\s*([A-Za-z][A-Za-z .,\-]{2,40}?)(?:\s{2,}|\n|Branch Phone|$)/);
  {const f=all.match(/From\W{0,4}(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})\W{0,6}To\W{0,4}(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/i);if(f){meta.from=parseDate(f[1]);meta.to=parseDate(f[2])}}
  const per=all.match(/(\d{1,2}[\s\-\/][A-Za-z]{3}[\s\-\/]\d{4}|\d{2}[\-\/]\d{2}[\-\/]\d{4})\s*(?:-|to|–|and)\s*(\d{1,2}[\s\-\/][A-Za-z]{3}[\s\-\/]\d{4}|\d{2}[\-\/]\d{2}[\-\/]\d{4})/i);if(per){meta.from=parseDate(per[1]);meta.to=parseDate(per[2])}
  {const sp=all.match(/statement\s+from\s+(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{4})\s+to\s+(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{4})/i);if(sp){meta.from=parseDate(sp[1].replace(/\s+/g,""));meta.to=parseDate(sp[2].replace(/\s+/g,""))}}
  // account block above the table: "Label  value" pairs, several per line (left and right column)
  {const LBL=/^(Customer ID|CKYC ID|Branch Code|Branch Name|Name|Account Holder(?: Name)?|Customer Name|IFSC Code|MICR Code|A\/c Type|Account Type|Mobile No\.?|Phone No\.?|E-?Mail ID|Nominee(?: Name)?|Branch)$/i;
   for(const l of lines){if(/opening balance/i.test(l.text)||(/date/i.test(l.text)&&/balance/i.test(l.text)))break;let key=null;const kv={};
     for(const it of l.items){const t=it.t.trim();if(LBL.test(t)){key=t.toLowerCase().replace(/[^a-z]/g,"");continue}
       if(key){const m=t.match(/^(Customer ID|CKYC ID|Branch Code|Branch Name|IFSC Code|MICR Code|A\/c Type|Mobile No\.?|Phone No\.?|E-?Mail ID)\s+(.*)$/i);if(m&&!LBL.test(t)){key=null}else kv[key]=((kv[key]||"")+" "+t).trim()}}
     const put=(f,k)=>{if(kv[k]&&(!meta[f]||f==="type"||f==="branch"||!meta["_"+f])){meta[f]=kv[k].replace(/\s+/g," ");meta["_"+f]=1}};
     put("holder","name");put("holder","accountholder");put("holder","accountholdername");put("holder","customername");put("custId","customerid");put("type","actype");put("type","accounttype");put("branch","branchname");put("mobile","mobileno");put("email","emailid");put("nominee","nominee");put("nominee","nomineename")}
   if(meta.mobile)meta.mobile=String(meta.mobile).replace(/\D/g,"").slice(-10);
   if(meta.email&&meta.email.includes(" ")&&!/@/.test(meta.email.split(" ")[0]))meta.email=meta.email.split(" ").find(x=>/@/.test(x))||meta.email;
   if(meta.branch)meta.branch=meta.branch.replace(/^Name\s+/i,"");for(const k of Object.keys(meta))if(k[0]==="_")delete meta[k]}
  if(!meta.acNo)meta.acNo=g(/Account\s*No[^0-9A-Za-z]{0,8}([0-9]{8,20})/i);if(!meta.micr)meta.micr=g(/MICR\W{0,8}(\d{9})/i);if(!meta.ifsc)meta.ifsc=g(/IFSC\W{0,12}([A-Z]{4}0[A-Z0-9]{6})/);
  if(!meta.custId){const x=g(/Cust(?:omer)?\s*ID\W{0,8}(\d{5,12})/i);if(x)meta.custId=x}if(!meta.email){const x=g(/E-?mail\W{0,6}([\w.\-]+@[\w.\-]+\.[A-Za-z]{2,})/i);if(x)meta.email=x}
  {const ty=g(/Account\s*Type\W{0,6}([A-Z][A-Za-z ()0-9]{3,40})/)||g(/\b((?:WOMENS?|SENIOR|REGULAR|BASIC)?\s*(?:SAVINGS?|CURRENT)\s+ACCOUNT\S*)/i);if(ty&&!meta.type)meta.type=/saving/i.test(ty)?"Savings":/current/i.test(ty)?"Current":ty.trim()}
  {const br=g(/Account\s*Branch\W{0,6}([A-Z][A-Za-z0-9 \-]{3,40})/);if(br)meta.branch=br.trim()}
  if(!meta.holder){const m=all.match(/(?:^|\n)\s*(?:MRS|MR|MS|M\/S|SMT|SHRI|MISS)\.?\s+([A-Z]+(?: [A-Z]+){0,3}?)(?=\s+(?:State|City|Address|HOUSE|Phone|OD|Currency|Email|Cust|Account|RTGS|Branch)\b|\s*(?:\n|$))/);if(m)meta.holder=m[1].replace(/\s+/g," ").trim()}
  // label above its value (Bank of Baroda): the value sits on the next line under (or beside) the label
  {const below=re=>{for(let i=0;i<Math.min(lines.length-1,80);i++){const it=lines[i].items.find(x=>re.test(x.t));if(!it)continue;for(let j=i+1;j<Math.min(i+3,lines.length);j++){const c=lines[j].items.map(x=>({x,d:Math.min(Math.abs(x.x-it.x),Math.abs(x.x+(x.w||0)-(it.x+(it.w||0))))})).filter(o=>o.d<70).sort((a,b)=>a.d-b.d)[0];if(c&&!/^(Account|Branch|IFSC|MICR|Scheme|Mobile|Nominee|Email|CKYC|Helpline|Customer)\b/i.test(c.x.t))return c.x.t.trim()}}return ""};
   const bad=v=>!v||/^(Details|Account number|Name|Holding Status|Customer ID)$/i.test(v);
   if(bad(meta.holder)){const v=below(/^Account holder name$/i)||below(/^Name$/i);if(v&&!/^(Holding Status|Customer ID)$/i.test(v))meta.holder=v}
   if(!meta.acNo){const v=(below(/^Account number$/i)||below(/^Account No\.?$/i)).replace(/\s+/g,"");if(/^[0-9Xx*]{6,20}$/.test(v))meta.acNo=v}
   if(!meta.ifsc){const v=below(/^IFSC code$/i);if(/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v))meta.ifsc=v}
   if(!meta.micr){const v=below(/^MICR code$/i);if(/^\d{9}$/.test(v))meta.micr=v}
   if(bad(meta.branch)){const v=below(/^Branch name$/i);if(v)meta.branch=v}
   if(!meta.type||/^(Details)$|Currency|Lien|Balance/i.test(meta.type)){const v=below(/^Account type$/i);if(v)meta.type=/saving/i.test(v)?"Savings":/current/i.test(v)?"Current":v}
   if(!meta.mobile){const v=below(/^Mobile number$/i).replace(/\D/g,"");if(v.length>=10)meta.mobile=v.slice(-10)}
   if(!meta.email){const v=below(/^Email ID$/i);if(/@/.test(v))meta.email=v}
   if(!meta.nominee){const v=below(/^Nominee Name$/i);if(v)meta.nominee=v}
   if(meta.ifsc&&!meta.ifscBank){meta.ifscBank=IF[meta.ifsc.slice(0,4)]||"";if(!meta.bank)meta.bank=meta.ifscBank}}
  // header row: find the x positions of the amount columns
  let hdr=null;for(const l of lines){const t=l.text.toLowerCase();if(/balance/.test(t)&&/(withdraw|debit|dr\.)/.test(t)&&/(deposit|credit|cr\.)/.test(t)&&(/date/.test(t)||/narration|particulars|chq/.test(t))){const col=re=>{const it=l.items.find(i=>re.test(i.t.toLowerCase()));return it?it.x+(it.w||0)/2:null};hdr={dr:col(/withdraw|debit/),cr:col(/deposit|credit/),bal:col(/balance/),ref:col(/ref|chq|cheque/),desc:col(/desc|narr|partic|details/),descL:(()=>{const it=l.items.find(i=>/desc|narr|partic|details/.test(i.t.toLowerCase()));return it?it.x:null})()};break}}
  const zone=hdr?Math.min(...[hdr.dr,hdr.cr,hdr.bal].filter(v=>v!=null))-70:null;
  const isAmt=i=>AMT.test(i.t)||(zone!=null&&LOOSE.test(i.t)&&i.x+(i.w||0)/2>=zone);
  // narrations wrapped at the column edge: a line that reaches the widest right edge was cut mid-word
  let Rmax=null,Rlim=null;if(hdr?.descL!=null){Rlim=(hdr.ref??hdr.dr??1e9)-25;for(const l of lines)for(const i of l.items){if(Math.abs(i.x-hdr.descL)<8&&!isAmt(i)){const rr=i.x+(i.w||0);if(rr<Rlim&&(Rmax==null||rr>Rmax))Rmax=rr}}}
  // layout where each transaction's narration is centred on the date line (lines above AND below it)?
  let centred=false;{let st=false;for(const l of lines){const low=l.text.toLowerCase();const isH=/balance/.test(low)&&/(withdraw|debit|dr\.)/.test(low)&&/(deposit|credit|cr\.)/.test(low)&&/date/.test(low);if(isH){st=true;continue}if(!st)continue;if(/opening balance/.test(low))continue;if(splitDate(l)&&l.items.some(isAmt))break;if(!l.items.some(isAmt)&&l.text.length>3){centred=true;break}}}
  // some statements put the first narration line a few points ABOVE the date line (Bank of Baroda): a text-only line sitting just over a date line
  if(!centred){let st=false;const isH=l=>{const low=l.text.toLowerCase();return /balance/.test(low)&&/(withdraw|debit|dr\.)/.test(low)&&/(deposit|credit|cr\.)/.test(low)&&/date/.test(low)};
    for(let i=0;i<lines.length;i++){const l=lines[i];if(isH(l)){st=true;continue}if(!st)continue;if(splitDate(l)||l.items.some(isAmt)||l.text.length<=3||/balance|statement|page \d/i.test(l.text))continue;
      const nx=lines.slice(i+1,i+8).find(q=>q.page===l.page&&splitDate(q)&&q.items.some(isAmt));if(nx&&l.y-nx.y>0&&l.y-nx.y<=6){centred=true;break}}}
  const rows=[];let opening=null,cur=null,inTable=!!hdr,pend=[];
  for(const l of lines){const low=l.text.toLowerCase();
    if(/opening balance/.test(low)){const a=l.items.filter(i=>isAmt(i)).map(i=>num(i.t));if(a.length&&opening==null)opening=a.at(-1);cur=null;continue}
    if(/closing balance|ending balance|statement summary|account summary|end of statement|page \d+ of \d+|statement generated|^\s*#?\s*date\b.*balance|computer.generated|statement is generated|maintained in the bank|customer account details/i.test(l.text)||(/balance/.test(low)&&/(withdraw|debit|dr\.)/.test(low)&&/(deposit|credit|cr\.)/.test(low)&&/date/.test(low))){if(centred&&cur&&pend.length){cur.desc=(cur.desc+" "+pend.map(q=>q.t).join(" ")).replace(/\s+/g," ").trim()}pend=[];if(/closing balance|ending balance/.test(low)){const a=l.items.filter(isAmt).map(i=>num(i.t));if(a.length)meta.closing=a.at(-1)}cur=null;continue}
    const sd=splitDate(l);const amts=l.items.filter(isAmt);
    if(sd&&amts.length>=1){// new transaction line
      const dateEnd=sd.at!=null?sd.at+sd.span:0;const txt=l.items.slice(dateEnd).filter(i=>!isAmt(i));
      let ref="",desc=[],rr=0;for(const i of txt){const cx=i.x+(i.w||0)/2;if(i.t==="-"||(hdr?.desc!=null&&cx<hdr.desc-5&&parseDate(i.t)))continue;if(hdr?.ref!=null&&hdr?.dr!=null&&cx>hdr.ref-60&&cx<hdr.dr-20&&/^[A-Za-z0-9\-\/]{6,}$/.test(i.t)&&!ref)ref=i.t;else if(!(hdr?.ref!=null&&cx>hdr.ref&&parseDate(i.t))){desc.push(i.t);rr=Math.max(rr,i.x+(i.w||0))}}
      // strip a leading serial number
      if(sd.at>0){}
      const vals=amts.map(i=>({v:num(i.t),x:i.x+(i.w||0)/2,raw:i.t}));let bal=vals.length>=2?vals.at(-1).v:null;let amtItem=vals.length>=2?vals.at(-2):vals[0];let force=null;
      if(vals.length>=3){const w=vals.at(-3),d2=vals.at(-2);if(w.v>0&&!(d2.v>0)){amtItem=w;force="out"}else if(d2.v>0&&!(w.v>0)){amtItem=d2;force="in"}else amtItem=w.v>=d2.v?w:d2}
      const prevRow=cur;cur={date:sd.date,desc:desc.join(" "),ref,amt:Math.abs(amtItem.v),amtX:amtItem.x,raw:amtItem.raw,bal,page:l.page,y:l.y,force,_last:desc.join(" ").length,_r:rr};
      if(centred){const up=[];for(const q of pend){if(prevRow&&prevRow.page===q.page&&Math.abs(q.y-prevRow.y)<Math.abs(q.y-l.y))prevRow.desc=joinD(prevRow.desc,q.t);else up.push(q.t)}cur.desc=joinD(up.join(" "),cur.desc)}pend=[];rows.push(cur);continue}
    if(centred&&!amts.length&&!sd&&l.text.length<120&&!/^\s*#?\s*date\b/i.test(l.text)){pend.push({t:l.text,y:l.y,page:l.page});continue}
    if(cur&&!amts.length&&l.page===cur.page&&!sd&&l.text.length<120){cur.desc=joinD(cur.desc,l.text,cur._last,Rmax!=null?cur._r>=Rmax-6:undefined);cur._last=l.text.length;cur._r=Math.max(0,...l.items.map(i=>i.x+(i.w||0)).filter(x=>Rlim==null||x<Rlim));continue}
    if(cur&&amts.length)cur=null}
  // newest-first statements (IndusInd): put the lines in date order so the running balance can be followed
  if(rows.length>1&&rows[0].date>rows.at(-1).date){rows.reverse();meta.newestFirst=true}
  // direction: running balance first, then column position, then Dr/Cr suffix
  let prev=opening;for(const r of rows){let dir=r.force||null;if(!dir&&prev!=null&&r.bal!=null){const d=Math.round((r.bal-prev)*100)/100;if(Math.abs(Math.abs(d)-r.amt)<0.011)dir=d<0?"out":"in"}
    if(!dir&&/dr$/i.test(r.raw))dir="out";if(!dir&&/cr$/i.test(r.raw))dir="in";
    if(!dir&&hdr?.dr!=null&&hdr?.cr!=null)dir=Math.abs(r.amtX-hdr.dr)<Math.abs(r.amtX-hdr.cr)?"out":"in";
    r.out=dir==="out"?r.amt:0;r.inn=dir==="in"?r.amt:0;r.dirBy=dir?"ok":"unknown";if(r.bal!=null)prev=r.bal}
  if(opening==null&&rows.length&&rows[0].bal!=null&&rows[0].dirBy==="ok"){opening=Math.round((rows[0].bal+rows[0].out-rows[0].inn)*100)/100;meta.openingDerived=true}
  {let pv=opening,bad=0;for(const r of rows){if(pv!=null&&r.bal!=null&&Math.abs(Math.round((pv+r.inn-r.out)*100)/100-r.bal)>0.011){bad++;r.chain=false}if(r.bal!=null)pv=r.bal}meta.badRows=bad}
  for(const r of rows)r.desc=r.desc.replace(/^[|¦J]+(?=UPI)/,"").replace(/(^|\s)[|¦]+(?=\s|$)/g," ").replace(/\s\d{2}\/\d{2}\/\d{2}(?=\s|$)/g," ").replace(/\s+/g," ").trim();
  meta.opening=opening;if(meta.closing==null&&rows.length)meta.closing=rows.at(-1).bal;
  // check: opening + deposits − withdrawals = closing
  const net=rows.reduce((t,r)=>t+r.inn-r.out,0);meta.check=opening!=null&&meta.closing!=null?Math.abs(opening+net-meta.closing)<0.05:null;
  return {meta,rows}}
// counterparty from the narration
function party(desc){const d=String(desc||"").replace(/\s+/g," ").trim();const p={raw:d};let m;
  if((m=d.match(/^(?:REVERSED\s*:\s*)?UPI\/(\d{6,})\/(CR|DR)\/([^\/]*)\/([^\/]*)\/([^\/]*)(?:\/(.*))?$/i))){p.mode="UPI";p.utr=m[1];p.dir=m[2].toUpperCase();p.name=m[3].trim();p.short=true;p.ifscBank=m[4];const h=m[5].trim();if(/@/.test(h))p.vpa=h;else if(h)p.acNo=h.replace(/\D/g,"")||"";p.remark=(m[6]||"").trim();if(/^REVERSED/i.test(d))p.reversed=true}
  // Bank of Baroda: UPI/<utr>/<hh:mm:ss>/UPI/<vpa>/<remark>, NEFT-<utr>-<name>, ACHDR|ACHCR|APBCR/<name>/<id>/<ref>
  else if((m=d.match(/^UPI\/(\d{9,14})\/\d{1,2}:\d{2}:\d{2}\/UPI\/([^\/\s]+)\/?(.*)$/i))){p.mode="UPI";p.utr=m[1];p.short=true;const h=m[2];if(/@/.test(h)){p.vpa=h;const loc=h.split("@")[0];p.name=/^gpay-\d+$/i.test(loc)?"Google Pay "+loc.replace(/\D/g,""):loc.replace(/[-_.]\d{1,2}$/,"").replace(/[-_.]+/g," ")}else p.name=h;p.remark=m[3].trim()}
  else if((m=d.match(/^NEFT-([A-Z0-9]{8,})-(.+)$/i))){p.mode="NEFT";p.utr=m[1];p.name=m[2].trim()}
  else if((m=d.match(/^(?:ACH|APB)(?:DR|CR)\/([^\/]+)\/(\d+)(?:\/(\d+))?/i))){p.mode=/^APB/i.test(d)?"APBS":"ACH";p.name=m[1].replace(/([a-z])([A-Z])/g,"$1 $2").trim();p.utr=m[3]||m[2]}
  else if((m=d.match(/^UPI\/([^\/]+)\/(\d{6,})\/?(.*)$/i))){p.mode="UPI";p.name=m[1].trim();p.utr=m[2];p.remark=m[3].trim()}
  else if((m=d.match(/^UPI[-\/](?:CR|DR)?[-\/]?(\d{6,})[-\/]([^\/]+)\/([^\/]*)\/([^\/]*)\/?(.*)$/i))){p.mode="UPI";p.utr=m[1];p.name=m[2].trim();p.ifscBank=m[3];p.vpa=/@/.test(m[4])?m[4]:"";p.remark=m[5]}
  else if((m=d.match(/(?:MB|IB|NB)?:?\s*Sent\s*(NEFT|IMPS|RTGS)\s*\/\s*([^\/]+)\/\s*([^\/]*)\/\s*([0-9Xx*]{4,20})\/?\s*(.*)$/i))){p.mode=m[1].toUpperCase();p.name=m[2].trim();p.bank=m[3].trim();p.acNo=m[4];p.remark=m[5].trim()}
  else if((m=d.match(/^(NEFT|RTGS|IMPS)\s+([A-Z]{4}[A-Z0-9]+)\s+(.+?)\s+([A-Z]{4}0[A-Z0-9]{6})\b\s*(.*)$/))){p.mode=m[1];p.utr=m[2];p.name=m[3].trim();p.ifsc=m[4];p.remark=m[5]}
  else if((m=d.match(/^(NEFT|RTGS|IMPS)\s+([A-Z]{4}[A-Z0-9]+)\s+(.+)$/))){p.mode=m[1];p.utr=m[2];p.name=m[3].trim()}
  else if((m=d.match(/^Sent\s*IMPS\s*(\d+)\/([A-Z]{4}X?\d*)\/(.*)$/i))){p.mode="IMPS";p.utr=m[1];p.bank=m[2];p.remark=m[3].trim();p.name=""}
  else if(/^CHRG|charges/i.test(d)){p.mode="CHARGES"}
  const v=d.match(/[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}/);if(v&&!p.vpa)p.vpa=v[0];const i=d.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/);if(i&&!p.ifsc)p.ifsc=i[1];
  if(p.name)p.name=p.name.replace(/\s+/g," ").replace(/[^A-Za-z0-9 .&\-]/g,"").trim();return p}
async function fromPdf(data,lib,opt){const pdf=await lib.getDocument({data,useSystemFonts:true,isEvalSupported:false}).promise;const pages=[];for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();pages.push({items:tc.items.map(it=>({str:it.str,x:it.transform[4],y:it.transform[5],w:it.width}))})}if(opt&&opt.ocr&&pages.reduce((t,p)=>t+p.items.length,0)<40){// printed-to-PDF / scanned statement: no text layer → read the page images
    const T=await opt.ocr();const worker=await T.createWorker("eng");const out=[];
    try{for(let i=1;i<=pdf.numPages;i++){opt.progress&&opt.progress("Reading page "+i+" of "+pdf.numPages+" (scanned statement)…");const pg=await pdf.getPage(i);const vp=pg.getViewport({scale:4});const cv=document.createElement("canvas");cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;
      const {data:d}=await worker.recognize(cv);out.push(ocrPage((d.words||[]).map(w=>({t:w.text,x0:w.bbox.x0,x1:w.bbox.x1,y0:w.bbox.y0,y1:w.bbox.y1})),cv.height,72/ (72*4)*1))}}finally{await worker.terminate()}
    const r=parse(out);r.meta.ocr=true;return r}
  return parse(pages)}
// words from OCR (pixels, y down) → items in PDF-like points (y up)
function ocrPage(words,H,scale){return {ocr:true,items:words.filter(w=>String(w.t).trim()).map(w=>({str:w.t,x:w.x0*scale*1,y:(H-(w.y0+w.y1)/2)*scale,w:(w.x1-w.x0)*scale}))}}
const api={parse,party,parseDate,fromPdf,ocrPage};if(typeof module!=="undefined")module.exports=api;else root.BankPDF=api})(typeof window!=="undefined"?window:globalThis);
