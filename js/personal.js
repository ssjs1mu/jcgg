/* Personal categories, ledgers and accounts — kept out of every login except the Super Admin.
   - A category is personal when listed in meta/cats.personal; a ledger is personal when flagged `personal`
     (or it is an expense ledger in a personal category): the ledger and every entry touching it disappear.
   - A personal bank / cash / card account (ticked "Personal (MKJ) account") is hidden itself. Entries that
     moved money between it and a business ledger (expense, vendor, staff…) stay on the business ledger, with the
     bank's details (account, balance, reference) removed. Any other entry on it — transfers, owner money,
     unclassified lines — is hidden completely. */
(()=>{
const J=window.J,{S}=J;
const arr=x=>Array.isArray(x)?x:[];
const raw=J.all;J.allRaw=raw;
const MONEYK=["bank","cash","card","wallet"];
const OPEN=new Set(["expense","vendor","staff","customer","income","aggregator","tax","asset","loan","deprec","deppaid","staffadv","staffloan","escrow","purch","cogs"]);
J.personalCats=()=>arr(J.get("meta","cats")?.personal);
J.seePersonal=()=>{try{return J.canSee("mkjacc")}catch(e){return true}};
J.isPersonalAcc=a=>{if(!a)return false;if(a.personal===true)return true;if(a.kind==="expense"){const pc=J.personalCats();return pc.length>0&&pc.includes(J.expCatOf?.(a)||a.cat||"")}return false};
J.isPersonalMoney=a=>!!a&&a.mkj===true&&MONEYK.includes(a.kind);
// sets of hidden ledgers: hard (entry vanishes) and bank (entry stays on business side if every other line is a business ledger)
const sets=()=>{if(J.seePersonal())return null;const H=new Set(),B=new Set();for(const a of raw("accounts")){if(J.isPersonalAcc(a))H.add(a.id);else if(J.isPersonalMoney(a))B.add(a.id)}return H.size||B.size?{H,B}:null};
const TAG=/\s*\|\s*Bank stmt ·.*$/;
const clean=v=>({...v,narr:String(v.narr||"").replace(TAG,""),ref:/^S\d{5,}$/.test(v.ref||"")?"":v.ref,bank:undefined,rec:undefined,lines:arr(v.lines).map(l=>({...l,n:String(l.n||"").replace(TAG,"")}))});
// "hide" | "strip" | "" for a voucher
const verdict=(v,X)=>{let bank=false;for(const l of arr(v.lines)){if(X.H.has(l.a))return "hide";if(X.B.has(l.a))bank=true}
  if(!bank)return "";for(const l of arr(v.lines)){if(X.B.has(l.a))continue;const k=J.get("accounts",l.a)?.kind;if(!OPEN.has(k))return "hide"}return "strip"};
J.personalVerdict=v=>{const X=sets();return X?verdict(v,X):""};
J.all=col=>{const l=raw(col);if(col!=="accounts"&&col!=="vouchers")return l;const X=sets();if(!X)return l;
  if(col==="accounts")return l.filter(a=>!X.H.has(a.id)&&!X.B.has(a.id));
  const out=[];for(const v of l){const d=verdict(v,X);if(d==="hide")continue;out.push(d==="strip"?clean(v):v)}return out};
// category list for pickers/reports
const ec=J.expCats;J.expCatsAll=ec;
if(ec){J.expCats=()=>{const l=ec();if(J.seePersonal())return l;const pc=J.personalCats();return pc.length?l.filter(c=>!pc.includes(c)):l}}
// a hidden account's name never shows to others
const an=J.accName;
if(an){J.accName=id=>{if(!J.seePersonal()){const a=J.get("accounts",id);if(a&&(J.isPersonalAcc(a)||J.isPersonalMoney(a)))return "Personal account"}return an(id)}}
// ledger rows of other accounts show hidden entries without details, and bank details are removed from kept ones
J.onDerive(D=>{if(J.seePersonal())return;const X=sets();if(!X)return;
  for(const [id,list] of D.post)for(let i=0;i<list.length;i++){const p=list[i];const d=verdict(p.v,X);if(!d)continue;
    list[i]=d==="strip"?{...p,n:String(p.n||"").replace(TAG,""),v:clean(p.v)}:{...p,n:"",v:{...p.v,narr:"Personal entry",ref:"",party:"",bank:undefined,rec:undefined,lines:arr(p.v.lines).map(l=>({...l,n:""}))}}}});
})();
