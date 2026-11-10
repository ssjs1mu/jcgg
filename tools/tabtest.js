// Opens every module and tab in a headless browser with an empty local book and reports screens that fail.
// Usage: python3 -m http.server 8765 (in the repo) then: node tools/tabtest.js
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];
  p.on('pageerror',e=>errs.push('pageerror: '+e.message));
  await p.route(/gstatic|googleapis|firebase|cdnjs|jsdelivr|unpkg/,r=>r.abort());
  await p.goto('http://localhost:8765/index.html',{waitUntil:'load'});
  const res=await p.evaluate(async()=>{const J=window.J,S=J.S;S.mode="local";S.me={owner:true,name:"Test",email:"test@local",role:"owner"};S.ready=true;try{J.gate()}catch(e){}
    const out=[];const list=J.MODS;const SKIP=["settings/logins"];// needs the cloud database
    try{const t=J.today(),m=t.slice(0,7);const cash=J.sysAcc("cash")?.id||await J.ensureAcc("Cash in Hand","cash","cash");const ex=await J.ensureAcc("Test expense","expense");
      await J.store.put("accounts",{id:"t-staff",kind:"staff",name:"Test Staff",code:"JCGG-999",active:true,salary:12000,doj:m+"-01"});
      await J.postVoucher({type:"expense",date:t,lines:[{a:ex,dr:100,cr:0},{a:cash,dr:0,cr:100}],narr:"self-test"});
      J.ui("staff",{}).emp="t-staff"}catch(e){out.push({m:"seed",t:"data",ok:false,msg:String(e.message)})}
    for(const m of list){for(const t of m.tabs||[]){if(SKIP.includes(m.id+"/"+t[0]))continue;try{J.go(m.id,t[0]);await new Promise(r=>setTimeout(r,30));const v=document.getElementById('view');const bad=v.querySelector('.err');out.push({m:m.id,t:t[0],ok:!bad,msg:bad?bad.textContent.slice(0,200):"",len:v.innerHTML.length})}catch(e){out.push({m:m.id,t:t[0],ok:false,msg:String(e.message)})}}}
    return {n:list.length,out,log:J.errLog?.()||[]}});
  const bad=res.out.filter(x=>!x.ok);console.log('modules',res.n,'tabs',res.out.length,'failed',bad.length);for(const x of bad)console.log('FAIL',x.m+'/'+x.t,'—',x.msg);
  for(const e of errs.slice(0,15))console.log(e);console.log('error log entries',res.log.length);
  await b.close();process.exit(bad.length?1:0)})();
