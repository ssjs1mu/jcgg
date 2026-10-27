/* Personal categories & ledgers — kept out of every login except the Super Admin.
   A category is personal when listed in meta/cats.personal; a ledger is personal when flagged `personal`
   (or it is an expense ledger sitting in a personal category). Personal ledgers and the entries that touch
   them disappear from lists, reports and pickers for everyone else; bank balances stay true. */
(()=>{
const J=window.J,{S}=J;
const arr=x=>Array.isArray(x)?x:[];
const raw=J.all;J.allRaw=raw;
J.personalCats=()=>arr(J.get("meta","cats")?.personal);
J.seePersonal=()=>{try{return J.canSee("mkjacc")}catch(e){return true}};
J.isPersonalAcc=a=>{if(!a)return false;if(a.personal===true)return true;if(a.kind==="expense"){const pc=J.personalCats();return pc.length>0&&pc.includes(J.expCatOf?.(a)||a.cat||"")}return false};
const hidden=()=>{if(J.seePersonal())return null;const P=new Set();for(const a of raw("accounts"))if(J.isPersonalAcc(a))P.add(a.id);return P.size?P:null};
J.personalIds=hidden;
J.all=col=>{const l=raw(col);if(col!=="accounts"&&col!=="vouchers")return l;const P=hidden();if(!P)return l;
  return col==="accounts"?l.filter(a=>!P.has(a.id)):l.filter(v=>!arr(v.lines).some(x=>P.has(x.a)))};
// category list for pickers/reports: personal categories vanish for everyone else
const ec=J.expCats;J.expCatsAll=ec;
if(ec){J.expCats=()=>{const l=ec();if(J.seePersonal())return l;const pc=J.personalCats();return pc.length?l.filter(c=>!pc.includes(c)):l}}
// ledger rows of other accounts (bank, cash…) show personal entries without their details
J.onDerive(D=>{if(J.seePersonal())return;const P=new Set();for(const a of S.c.accounts.values())if(J.isPersonalAcc(a))P.add(a.id);if(!P.size)return;
  for(const [id,list] of D.post)for(let i=0;i<list.length;i++){const p=list[i];if(!arr(p.v.lines).some(x=>P.has(x.a)))continue;
    list[i]={...p,n:"",v:{...p.v,narr:"Personal entry",ref:"",party:"",lines:arr(p.v.lines).map(l=>({...l,n:""})),bank:p.v.bank?{from:p.v.bank.from,date:p.v.bank.date}:p.v.bank}}}});
})();
