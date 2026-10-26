/* Edit and delete for every kind of entry in the app.
   - Whole records: J.delBtn(col,id) → guarded delete that also removes the accounting entries the record created.
   - Entries kept inside a record (service logs, premiums, claims, reward entries, reviews, staff notes, salary revisions):
     J.subBtns(col,id,key,index) → edit in a small form or delete; a linked accounting entry is updated or removed with it. */
(()=>{
const J=window.J,{S,esc,fld,txt,num,dateI,selO,area,toast,r2,today}=J;
const arr=x=>Array.isArray(x)?x:[];
// ---------- guards: records that other entries depend on ----------
const used=a=>(J.D.post?.get(a)||[]).length;
const GUARD={
  items:it=>J.all("moves").some(m=>arr(m.lines).some(l=>l.item===it.id))?"This item has purchases or consumption recorded — delete those first, or untick Active to hide it.":J.all("recipes").some(r=>arr(r.lines).some(l=>l.item===it.id))?"A recipe uses this item — take it out of the recipe first.":"",
  accounts:a=>a.sys?"Built-in ledgers cannot be deleted.":a.kind==="staff"?(used(a.id)||used("adv-"+a.id)||used("loan-"+a.id)||J.all("attendance").some(m=>Object.values(m.days||{}).some(d=>d?.[a.id]))||J.all("kots").some(k=>k.staff===a.id)?"This person has attendance, salary, advance or food history. Use “Record exit” instead so the history stays correct.":""):used(a.id)?"This ledger has entries — move or delete them first, or mark the ledger inactive.":"",
  menu:m=>"",policies:p=>"",assets:a=>a.disposed?"This asset has a disposal entry — delete that entry in Accounts first if it was a mistake.":"",
  feedback:()=>J.isCC?.()?"Only the owner or a manager can delete feedback.":"",clients:()=>J.isCC?.()?"Only the owner or a manager can delete clients.":""};
J.recDelete=async(col,id)=>{const r=J.get(col,id);if(!r)return "Already deleted.";const why=GUARD[col]?.(r);if(why)return why;
  // accounting entries this record created
  const vids=new Set([r.vid,...arr(r.maint).map(x=>x.vid),...arr(r.payments).map(x=>x.vid)].filter(Boolean));
  for(const v of J.all("vouchers"))if(v.src?.col===col&&v.src?.id===id)vids.add(v.id);
  for(const v of vids)if(J.get("vouchers",v))await J.store.del("vouchers",v);
  if(col==="accounts"&&r.kind==="staff")for(const k of ["adv-","loan-"])if(J.get("accounts",k+id))await J.store.del("accounts",k+id);
  await J.store.del(col,id);return ""};
J.delBtn=(col,id,label="Delete")=>J.readOnly()?"":`<button type="button" class="btn small danger" data-a="recDel" data-x="${esc(col)}|${esc(id)}">${esc(label)}</button>`;
J.act("recDel",async el=>{const [col,id]=el.dataset.x.split("|");const r=J.get(col,id);const why=r&&GUARD[col]?.(r);if(why)return toast(why);
  if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to delete";setTimeout(()=>{if(el.isConnected){delete el.dataset.armed;el.textContent="Delete"}},4000);return}
  const err=await J.safe(()=>J.recDelete(col,id));if(typeof err==="string"&&err)return toast(err);toast("Deleted");J.closeDrawer();J.render()});
// ---------- entries inside a record ----------
const SUB={
  "assets.maint":{t:"Service record",f:[["date","Date","date"],["type","Type","text"],["note","Note","text"],["cost","Cost (₹)","num"]],amt:"cost"},
  "policies.payments":{t:"Premium payment",f:[["date","Paid on","date"],["amt","Amount (₹)","num"]],amt:"amt"},
  "policies.claims":{t:"Claim",f:[["date","Date of loss","date"],["amt","Amount claimed (₹)","num"],["settled","Amount settled (₹)","num"],["status","Status",["Intimated","Surveyed","Documents submitted","Settled","Rejected"]],["note","What happened","text"]]},
  "clients.pts":{t:"Reward entry",f:[["date","Date","date"],["time","Time","time"],["bill","Bill no.","text"],["amt","Bill amount (₹)","num"],["points","Points","num"],["note","Note","text"]]},
  "clients.reviews":{t:"Google review",f:[["at","Review date & time","datetime-local"],["bill","Against bill","text"],["stars","Stars (1–5)","num"],["note","Review text / link","area"]]},
  "accounts.notes":{t:"Notebook entry",f:[["date","Date","date"],["tag","Type",["Note","Award","Appreciation","Warning","Reprimand","Training","Medical","Other"]],["by","Recorded by","text"],["text","Note","area"]]},
  "accounts.revisions":{t:"Salary revision",f:[["date","Effective date","date"],["to","New monthly gross (₹)","num"],["desig","Designation","text"],["reason","Reason","text"]]}};
J.subBtns=(col,id,key,i,opt={})=>J.readOnly()||(J.isCC?.()&&!["clients"].includes(col))?"":`<span class="row" style="gap:4px;display:inline-flex"><button type="button" class="linkbtn" data-a="subEdit" data-x="${esc(col)}|${esc(id)}|${key}|${i}">edit</button>${opt.noDel||(J.isCC?.()&&key!=="reviews")?"":`<button type="button" class="linkbtn" style="color:var(--bad)" data-a="subDel" data-x="${esc(col)}|${esc(id)}|${key}|${i}">delete</button>`}</span>`;
async function syncVoucher(e,amtKey){if(!e.vid)return;const v=J.get("vouchers",e.vid);if(!v)return;const amt=+e[amtKey]||0;
  if(!amt){await J.store.del("vouchers",v.id);e.vid=null;return}
  if(arr(v.lines).length===2)await J.postVoucher({...v,id:v.id,date:e.date||v.date,lines:v.lines.map(l=>l.dr?{...l,dr:amt}:{...l,cr:amt})})}
async function saveSub(col,id,key,list){const r=J.get(col,id);let n={...r,[key]:list};if(col==="accounts"&&n.kind==="staff"&&J.H?.sync)n=J.H.sync(n);await J.store.put(col,n);if(col==="accounts"&&key==="revisions")J.H?.syncSoon?.("salary revision edited")}
J.act("subEdit",el=>{const [col,id,key,i]=el.dataset.x.split("|");const r=J.get(col,id);const list=arr(r?.[key]);const e=list[+i];const def=SUB[col+"."+key];if(!e||!def)return;
  const inp=([k,l,t])=>fld(l,Array.isArray(t)?selO(k,t.includes(e[k])||!e[k]?t:[e[k],...t],e[k]||t[0]):t==="date"?dateI(k,e[k]||""):t==="num"?num(k,e[k]??""):t==="area"?area(k,e[k]||"",3):`<input type="${t}" name="${k}" id="f-${k}" value="${esc(e[k]??"")}">`);
  const back=J.S.drawerBack;J.drawer({title:"Edit "+def.t.toLowerCase(),submit:"Save",body:`<div class="form">${def.f.map(inp).join("")}</div>${e.vid?'<p class="hint">The linked accounting entry is updated too.</p>':""}`,
    onSubmit:async fd=>{const n={...e};for(const [k,,t] of def.f)n[k]=t==="num"?(fd[k]===""?"":+fd[k]):String(fd[k]??"").trim();n.editedAt=Date.now();n.editedBy=S.me.name||S.me.email||"";
      if(def.amt)await syncVoucher(n,def.amt);const nl=list.slice();nl[+i]=n;await saveSub(col,id,key,nl);toast(def.t+" saved")}})});
J.act("subDel",async el=>{if(!el.dataset.armed){el.dataset.armed="1";el.textContent="tap again";return}const [col,id,key,i]=el.dataset.x.split("|");const r=J.get(col,id);const list=arr(r?.[key]).slice();const e=list[+i];if(!e)return;
  await J.safe(async()=>{if(e.vid&&J.get("vouchers",e.vid))await J.store.del("vouchers",e.vid);list.splice(+i,1);await saveSub(col,id,key,list)},"Deleted");J.closeDrawer();J.render()});
// ---------- supplier bill: header edit (lines: delete and upload again) ----------
J.act("billEdit",el=>{const b=J.get("bills",el.dataset.x);if(!b)return;J.drawer({title:"Edit bill · "+(b.invNo||""),submit:"Save",body:`<div class="form">${fld("Bill date",dateI("date",b.date))}${fld("Invoice no.",txt("inv",b.invNo))}${fld("Order no.",txt("ord",b.orderNo||""))}</div>${fld("Note",area("note",b.note||"",2))}<p class="hint">The accounting entry and stock receipt move to the new date. To change the items, delete the bill and upload it again.</p>`,
  onSubmit:async fd=>{const v=J.get("vouchers",b.vid);if(v)await J.postVoucher({...v,id:v.id,date:fd.date,ref:fd.inv.trim()});const mv=b.moveId&&J.get("moves",b.moveId);if(mv)await J.store.put("moves",{...mv,date:fd.date,m:fd.date.slice(0,7),inv:fd.inv.trim()});
    await J.store.patch("bills",b.id,{date:fd.date,invNo:fd.inv.trim(),orderNo:fd.ord.trim(),note:fd.note.trim(),editedAt:Date.now(),editedBy:S.me.email});toast("Bill updated");setTimeout(()=>J.billsReconcile?.(),800)}})});
// ---------- staff KOT: edit date, person, items, quantities, prices ----------
J.act("skEdit",el=>{const k=J.all("kots").find(x=>x.id===el.dataset.x);if(!k)return;const items=arr(k.items);const menu=(J.skMenuList?J.skMenuList():[]);const staff=J.staffList(true);const n=items.length+3;
  const rt=[["","Keep as is"],["staff","Staff rate"],["gr","Gr. Floor"],["mez","Mez. Floor"],["grBf","Gr. Breakfast"],["mezBf","Mez. Breakfast"]];
  const rows=[...Array(n)].map((_,i)=>{const it=items[i]||{};return `<tr><td><input name="n${i}" id="f-n${i}" list="sk-edl" value="${esc(it.name||"")}" placeholder="${it.name?"":"Add an item…"}" style="min-width:170px" autocomplete="off"></td><td><input type="number" step="any" min="0" name="q${i}" id="f-q${i}" value="${it.qty??""}" style="width:70px"></td><td><select name="t${i}" id="f-t${i}">${rt.map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select></td><td><input type="number" step="any" min="0" name="r${i}" id="f-r${i}" value="${it.rate??""}" style="width:80px"></td></tr>`}).join("");
  J.drawer({title:"Edit KOT "+k.no,wide:true,submit:"Save KOT",body:`<div class="form">${fld("Date",dateI("date",k.date))}${fld("Staff member",`<select name="staff" id="f-staff">${staff.map(s=>`<option value="${s.id}" ${s.id===k.staff?"selected":""}>${esc((s.code?s.code+" · ":"")+s.name)}</option>`).join("")}</select>`)}</div>
    <datalist id="sk-edl">${menu.map(m=>`<option value="${esc(m.name)}">`).join("")}</datalist>
    <div class="tbl-wrap"><table><thead><tr><th>Item</th><th class="num">Qty</th><th>Price list</th><th class="num">Rate ₹</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="hint">Change the person, rename or swap an item (pick from the menu), set the quantity, and choose a price list — Staff, Ground Floor, Mezzanine or breakfast — to re-price the line from the Kitchen menu, or type any rate. Quantity 0 removes the line; fill a spare row to add an item.</p>`,
    onSubmit:async fd=>{const ni=[];for(let i=0;i<n;i++){const nm=(fd["n"+i]||"").trim();const q=+fd["q"+i]||0;if(!nm||!(q>0))continue;const old=items[i];const m=menu.find(x=>x.name.toLowerCase()===nm.toLowerCase());const t=fd["t"+i];
        let rate=+fd["r"+i]||0,basis=old?.basis||"manual";
        if(t&&m){const v=J.menuRate(m,t);if(!(v>0))return nm+" has no "+(J.RATE_LABEL[t]||t)+".";rate=v;basis=t}
        else if(m&&(!old||old.name.toLowerCase()!==nm.toLowerCase())&&!(+fd["r"+i]>0)){const p=J.staffPrice(m);rate=p.rate;basis=p.basis}
        else if(old&&rate!==old.rate)basis="manual";
        if(!(rate>=0))return "Enter a rate for "+nm+".";
        const {flag,...rest}=old||{};ni.push({...rest,mid:m?.id||old?.mid||"",name:m?.name||nm,qty:q,rate,basis,...(old?.flag&&rate===old.rate&&nm===old.name?{flag}:{})})}
      if(!ni.length)return "Keep at least one item, or delete the KOT.";
      const s=J.get("accounts",fd.staff);if(!s)return "Choose the staff member.";const dupe=fd.staff!==k.staff&&J.all("kots").find(x=>x.id!==k.id&&x.kind==="staff"&&x.date===fd.date&&x.staff===fd.staff);
      const nk={...k,date:fd.date,m:fd.date.slice(0,7),staff:s.id,staffName:s.name,items:ni,total:r2(ni.reduce((t,x)=>t+x.qty*x.rate,0)),editedAt:Date.now(),editedBy:S.me.name||S.me.email||""};
      if(nk.date!==k.date)await J.store.del("kots",k.id);await J.store.put("kots",nk);const lc=J.H?.lastClosedMonth?.()||"";if(k.date.slice(0,7)<=lc||nk.date.slice(0,7)<=lc)J.H.syncSoon("staff food edited");
      for(const m of new Set([k.date.slice(0,7),nk.date.slice(0,7)]))if(J.foodViaHouse?.(m))setTimeout(()=>J.skHouseSync?.(m),800);
      toast(k.no+" saved"+(k.staff!==s.id?" · now "+s.name:"")+(dupe?" — note: "+s.name+" already has a KOT that day":""))}})});
})();
