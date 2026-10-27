/* Bank statement PDF reader: text positions → transaction rows (any bank that prints date / narration / amounts / running balance),
   plus counterparty extraction (UPI, NEFT, IMPS, RTGS narrations) for ledger mapping. Works in the browser (pdf.js) and in Node for tests. */
(function(root){
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
const pad=n=>String(n).padStart(2,"0");
function parseDate(s){s=String(s||"").trim();let m=s.match(/^(\d{1,2})[\s\-\/.]([A-Za-z]{3,4})[\s\-\/.,]*(\d{2,4})$/);if(m){const mo=MON[m[2].toLowerCase()];if(!mo)return null;let y=+m[3];if(y<100)y+=2000;return y+"-"+pad(mo)+"-"+pad(+m[1])}
  m=s.match(/^(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{2,4})$/);if(m){let y=+m[3];if(y<100)y+=2000;if(+m[2]>12)return null;return y+"-"+pad(+m[2])+"-"+pad(+m[1])}
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return s;return null}
const AMT=/^-?(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}(?:\s*(?:Cr|Dr|CR|DR))?$/;
const num=s=>{const n=parseFloat(String(s).replace(/[,\s]|Cr|Dr|CR|DR/g,""));return isNaN(n)?null:n};
// group text items into lines per page
function toLines(pages){const lines=[];for(const [pi,p] of pages.entries()){const rows=[];for(const it of p.items){const t=String(it.str||"").trim();if(!t)continue;let r=rows.find(r=>Math.abs(r.y-it.y)<=2.5);if(!r){r={y:it.y,page:pi,items:[]};rows.push(r)}r.items.push({t,x:it.x,w:it.w||0})}
  rows.sort((a,b)=>b.y-a.y);for(const r of rows){r.items.sort((a,b)=>a.x-b.x);r.text=r.items.map(i=>i.t).join(" ");lines.push(r)}}return lines}
function splitDate(r){// a line starts a transaction when one of its first items (or first 3 tokens) is a date
  const its=r.items;for(let k=0;k<Math.min(its.length,4);k++){const d=parseDate(its[k].t);if(d)return {date:d,at:k,span:1};if(k+2<its.length){const d3=parseDate(its[k].t+" "+its[k+1].t+" "+its[k+2].t);if(d3)return {date:d3,at:k,span:3}}}
  const m=r.text.match(/^(?:\d{1,4}\s+)?(\d{1,2}[\s\-\/.][A-Za-z]{3,4}[\s\-\/.,]*\d{2,4}|\d{1,2}[\-\/.]\d{1,2}[\-\/.]\d{2,4})\b/);if(m){const d=parseDate(m[1]);if(d)return {date:d,text:m[0]}}return null}
function parse(pages){const lines=toLines(pages);const all=lines.map(l=>l.text).join("\n");
  const meta={};const g=re=>{const m=all.match(re);return m?m[1].trim():""};
  meta.acNo=g(/Account\s*(?:No\.?|Number)\s*[:\-]?\s*([0-9Xx*]{6,20})/i);meta.ifsc=g(/IFSC(?:\s*Code)?\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})/);meta.micr=g(/MICR\s*(?:Code)?\s*[:\-]?\s*(\d{9})/i);
  meta.bank=(all.match(/(Kotak Mahindra Bank|State Bank of India|HDFC Bank|ICICI Bank|Axis Bank|Punjab National Bank|Bank of Baroda|Canara Bank|Union Bank of India|IDFC FIRST Bank|Yes Bank|IndusInd Bank|Bank of India|Central Bank of India|Indian Bank|UCO Bank|Federal Bank|Bandhan Bank|AU Small Finance Bank)/i)||[])[1]||(meta.ifsc?({KKBK:"Kotak Mahindra Bank",SBIN:"State Bank of India",HDFC:"HDFC Bank",ICIC:"ICICI Bank",UTIB:"Axis Bank",PUNB:"Punjab National Bank",BARB:"Bank of Baroda",CNRB:"Canara Bank",UBIN:"Union Bank of India",IDFB:"IDFC FIRST Bank",YESB:"Yes Bank",INDB:"IndusInd Bank"})[meta.ifsc.slice(0,4)]||"":"");
  meta.type=g(/Account\s*Type\s*[:\-]?\s*([A-Za-z ]{3,20}?)(?:\s{2,}|\n|$)/i);meta.branch=g(/Branch\s*[:\-]?\s*([A-Za-z][A-Za-z .,\-]{2,40}?)(?:\s{2,}|\n|Branch Phone|$)/);
  const per=all.match(/(\d{1,2}[\s\-\/][A-Za-z]{3}[\s\-\/]\d{4}|\d{2}[\-\/]\d{2}[\-\/]\d{4})\s*(?:-|to|–)\s*(\d{1,2}[\s\-\/][A-Za-z]{3}[\s\-\/]\d{4}|\d{2}[\-\/]\d{2}[\-\/]\d{4})/i);if(per){meta.from=parseDate(per[1]);meta.to=parseDate(per[2])}
  // header row: find the x positions of the amount columns
  let hdr=null;for(const l of lines){const t=l.text.toLowerCase();if(/balance/.test(t)&&/(withdraw|debit|dr\.)/.test(t)&&/(deposit|credit|cr\.)/.test(t)&&/date/.test(t)){const col=re=>{const it=l.items.find(i=>re.test(i.t.toLowerCase()));return it?it.x+(it.w||0)/2:null};hdr={dr:col(/withdraw|debit/),cr:col(/deposit|credit/),bal:col(/balance/),ref:col(/ref|chq|cheque/),desc:col(/desc|narr|partic|details/)};break}}
  const rows=[];let opening=null,cur=null,inTable=!!hdr;
  for(const l of lines){const low=l.text.toLowerCase();
    if(/opening balance/.test(low)){const a=l.items.filter(i=>AMT.test(i.t)).map(i=>num(i.t));if(a.length&&opening==null)opening=a.at(-1);cur=null;continue}
    if(/closing balance|statement summary|account summary|end of statement|page \d+ of \d+|statement generated|^\s*#?\s*date\b.*balance/i.test(l.text)){if(/closing balance/.test(low)){const a=l.items.filter(i=>AMT.test(i.t)).map(i=>num(i.t));if(a.length)meta.closing=a.at(-1)}cur=null;continue}
    const sd=splitDate(l);const amts=l.items.filter(i=>AMT.test(i.t));
    if(sd&&amts.length>=1){// new transaction line
      const dateEnd=sd.at!=null?sd.at+sd.span:0;const txt=l.items.slice(dateEnd).filter(i=>!AMT.test(i.t));
      let ref="",desc=[];for(const i of txt){const cx=i.x+(i.w||0)/2;if(hdr?.ref!=null&&hdr?.dr!=null&&cx>hdr.ref-60&&cx<hdr.dr-20&&/^[A-Za-z0-9\-\/]{6,}$/.test(i.t)&&!ref)ref=i.t;else desc.push(i.t)}
      // strip a leading serial number
      if(sd.at>0){}
      const vals=amts.map(i=>({v:num(i.t),x:i.x+(i.w||0)/2,raw:i.t}));const bal=vals.length>=2?vals.at(-1).v:null;const amtItem=vals.length>=2?vals.at(-2):vals[0];
      cur={date:sd.date,desc:desc.join(" "),ref,amt:Math.abs(amtItem.v),amtX:amtItem.x,raw:amtItem.raw,bal,page:l.page};rows.push(cur);continue}
    if(cur&&!amts.length&&l.page===cur.page&&!sd&&l.text.length<120){cur.desc=(cur.desc+" "+l.text).replace(/\s+/g," ").trim();continue}
    if(cur&&amts.length)cur=null}
  // direction: running balance first, then column position, then Dr/Cr suffix
  let prev=opening;for(const r of rows){let dir=null;if(prev!=null&&r.bal!=null){const d=Math.round((r.bal-prev)*100)/100;if(Math.abs(Math.abs(d)-r.amt)<0.011)dir=d<0?"out":"in"}
    if(!dir&&/dr$/i.test(r.raw))dir="out";if(!dir&&/cr$/i.test(r.raw))dir="in";
    if(!dir&&hdr?.dr!=null&&hdr?.cr!=null)dir=Math.abs(r.amtX-hdr.dr)<Math.abs(r.amtX-hdr.cr)?"out":"in";
    r.out=dir==="out"?r.amt:0;r.inn=dir==="in"?r.amt:0;r.dirBy=dir?"ok":"unknown";if(r.bal!=null)prev=r.bal}
  meta.opening=opening;if(meta.closing==null&&rows.length)meta.closing=rows.at(-1).bal;
  // check: opening + deposits − withdrawals = closing
  const net=rows.reduce((t,r)=>t+r.inn-r.out,0);meta.check=opening!=null&&meta.closing!=null?Math.abs(opening+net-meta.closing)<0.05:null;
  return {meta,rows}}
// counterparty from the narration
function party(desc){const d=String(desc||"").replace(/\s+/g," ").trim();const p={raw:d};let m;
  if((m=d.match(/^(?:REVERSED\s*:\s*)?UPI\/(\d{6,})\/(CR|DR)\/([^\/]*)\/([^\/]*)\/([^\/]*)(?:\/(.*))?$/i))){p.mode="UPI";p.utr=m[1];p.dir=m[2].toUpperCase();p.name=m[3].trim();p.short=true;p.ifscBank=m[4];const h=m[5].trim();if(/@/.test(h))p.vpa=h;else if(h)p.acNo=h.replace(/\D/g,"")||"";p.remark=(m[6]||"").trim();if(/^REVERSED/i.test(d))p.reversed=true}
  else if((m=d.match(/^UPI\/([^\/]+)\/(\d{6,})\/?(.*)$/i))){p.mode="UPI";p.name=m[1].trim();p.utr=m[2];p.remark=m[3].trim()}
  else if((m=d.match(/^UPI[-\/](?:CR|DR)?[-\/]?(\d{6,})[-\/]([^\/]+)\/([^\/]*)\/([^\/]*)\/?(.*)$/i))){p.mode="UPI";p.utr=m[1];p.name=m[2].trim();p.ifscBank=m[3];p.vpa=/@/.test(m[4])?m[4]:"";p.remark=m[5]}
  else if((m=d.match(/(?:MB|IB|NB)?:?\s*Sent\s*(NEFT|IMPS|RTGS)\s*\/\s*([^\/]+)\/\s*([^\/]*)\/\s*([0-9Xx*]{4,20})\/?\s*(.*)$/i))){p.mode=m[1].toUpperCase();p.name=m[2].trim();p.bank=m[3].trim();p.acNo=m[4];p.remark=m[5].trim()}
  else if((m=d.match(/^(NEFT|RTGS|IMPS)\s+([A-Z]{4}[A-Z0-9]+)\s+(.+?)\s+([A-Z]{4}0[A-Z0-9]{6})\b\s*(.*)$/))){p.mode=m[1];p.utr=m[2];p.name=m[3].trim();p.ifsc=m[4];p.remark=m[5]}
  else if((m=d.match(/^(NEFT|RTGS|IMPS)\s+([A-Z]{4}[A-Z0-9]+)\s+(.+)$/))){p.mode=m[1];p.utr=m[2];p.name=m[3].trim()}
  else if((m=d.match(/^Sent\s*IMPS\s*(\d+)\/([A-Z]{4}X?\d*)\/(.*)$/i))){p.mode="IMPS";p.utr=m[1];p.bank=m[2];p.remark=m[3].trim();p.name=""}
  else if(/^CHRG|charges/i.test(d)){p.mode="CHARGES"}
  const v=d.match(/[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}/);if(v&&!p.vpa)p.vpa=v[0];const i=d.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/);if(i&&!p.ifsc)p.ifsc=i[1];
  if(p.name)p.name=p.name.replace(/\s+/g," ").replace(/[^A-Za-z0-9 .&\-]/g,"").trim();return p}
async function fromPdf(data,lib){const pdf=await lib.getDocument({data,useSystemFonts:true,isEvalSupported:false}).promise;const pages=[];for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();pages.push({items:tc.items.map(it=>({str:it.str,x:it.transform[4],y:it.transform[5],w:it.width}))})}return parse(pages)}
const api={parse,party,parseDate,fromPdf};if(typeof module!=="undefined")module.exports=api;else root.BankPDF=api})(typeof window!=="undefined"?window:globalThis);
