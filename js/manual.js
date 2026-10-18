/* Operating manual — built into every screen.
   Each module (and its tabs) and each kind of ledger has: what it is for, how to use it, what it is linked to,
   its impact on the books, what to do and what not to do.
   - "Manual" button in every module header opens the manual for that module, with the open tab first.
   - Ledger forms carry a "How this ledger works" link for their kind.
   - The Manual module shows the whole manual, searchable and printable. */
(()=>{
const J=window.J,{S,esc}=J;
// ---------- content ----------
// p = purpose · s = steps · l = linked to · i = impact on the books · d = do · n = don't
const M={
home:{t:"Home",p:"The day at a glance: sales, cash and bank, what needs attention (attendance not marked, stock running out, bills unpaid, renewals).",
  s:["Open Home first each morning.","Tap any card to go to the screen behind it and act there."],
  l:["Accounts","Staff & Payroll","Inventory","Insurance"],i:"Read-only — nothing here changes the books.",
  d:["Clear the red items before the day's service."],n:["Don't treat Home figures as final until the bank statement for the period is uploaded."]},
jdash:{t:"Joshi's Dashboard",p:"Opens the Stock Analyst terminal (ssjs1mu.github.io/jc-stock-analyst) inside the suite with the same sign-in.",
  s:["Pick the stock or scan in the terminal as usual."],l:["Investments (holdings and trades are recorded there, not here)"],i:"None — market data only; no entries are posted.",
  d:["Record actual buys and sells in Investments → Trades."],n:["Don't use it as a record of trades; it keeps no books."]},
inventory:{t:"Inventory",p:"Stock of every kitchen item: what came in (purchases, supplier bills), what went out (consumption, returns), what is left and its value.",
  l:["Accounts → Kitchen Purchases (Raw Material), vendor ledgers, Input GST","Kitchen → recipe costing","Bills → bank payments"],
  i:"Purchases debit Kitchen Purchases (Groceries) and credit the vendor (or the bank if paid at once). Month-end valuation posts closing stock. Consumption and adjustments move quantity only.",
  d:["Upload every Hyperpure / supplier PDF bill in the Bills tab — it books stock and matches the payment.","Create an item once (Item master) and reuse it; set the unit carefully (KG, LTR, PCS).","Record wastage under Adjustments with a reason."],
  n:["Don't enter the same bill both in Purchases and Bills.","Don't delete an item that has purchases or recipes — untick Active instead.","Don't record a supplier payment here; the bank statement brings it."],
  tabs:{stock:"Quantity and value of each item now. Tap an item for its movement history.",expiry:"Batches expiring soon — use or discard, then record an adjustment.",
    purchases:"Hand-entered purchases (cash market buys). Paid now from cash → posts at once; on credit → the vendor's ledger.",consumption:"Daily issue to the kitchen. Quantity only.",
    returns:"Goods sent back to a supplier — posts a debit note to the vendor.",adjust:"Wastage, breakage, count differences. Quantity only; always give a reason.",
    bills:"Upload supplier PDF bills. Items → stock, charges → expense heads, payment matched from the bank statement; any difference goes to Suspense to verify.",
    items:"The item list: unit, category, GST, preferred vendor, picture.",best:"Lowest price paid per item and from whom.",recipes:"Cost of each dish from its recipe and current item rates."}},
bills:{t:"Supplier bills",p:"Hyperpure and other supplier PDF bills: read automatically, mapped to stock and expenses, matched with the payment.",
  s:["Inventory → Bills → Upload bills (several PDFs at once).","Check the mapping of each line (stock item or expense head) and save.","Open the bill later to see whether it is matched, unpaid or has a difference."],
  l:["Accounts → vendor ledger, Kitchen Purchases, expense heads, Suspense","Bank statement import"],i:"One purchase entry per bill (Dr purchases/expenses, Cr vendor). The bank payment is moved onto the vendor when matched; any bill-vs-payment difference sits in Suspense.",
  d:["Upload the bill even if the payment is already in the bank — that is how it gets matched.","Check Suspense for bill differences each week."],n:["Don't also record the bill by hand.","Don't delete a matched bill unless the bill itself was wrong."]},
kitchen:{t:"Kitchen",p:"Menu with recipes, serving sizes, languages, videos, new items under trial and costing per serve.",
  l:["Inventory (item rates for costing)","Staff KOT (menu prices)"],i:"None on the books — costing reads inventory rates.",
  d:["Keep recipes and video links current.","Use New items for dishes on trial — they have no price until promoted."],n:["Don't change menu prices here without updating the POS (Petpooja)."],
  tabs:{menu:"Recipes by dish: choose servings, language; linked sub-recipes open in a pop-up.",new:"Dishes being tried from shared videos; promote to the menu when ready.",cost:"Cost per serve from current stock rates or standard rates."}},
kot:{t:"Staff KOT",p:"Food taken by staff (or the owner's account) during the month, billed monthly and recovered from salary or the client ledger.",
  l:["Staff & Payroll → Staff Food Recovery","Accounts → client ledger, Dine-in Sales"],i:"Monthly bill posts the food value: recovered from salary (staff) or billed to the client ledger.",
  d:["Enter a KOT the same day.","Correct quantity mistakes with Edit before the month is closed."],n:["Don't edit a KOT of a month whose salary is paid — it changes the recovery."],
  tabs:{new:"Make a staff KOT.",book:"All KOTs with edit and delete.",bill:"Monthly total per person; posts the recovery."}},
staff:{t:"Staff & Payroll",p:"Team records, attendance, salary, advances, loans, notebook and HR policies. Every person has three ledgers: salary, Advance — name, Loan — name.",
  l:["Accounts → Staff Salary, staff ledgers, advances, loans, Professional Tax, Staff Food Recovery","Customer Care (attendance view)","Kitchen logins"],
  i:"Posting the month books salary earned (Dr Staff Salary, Cr staff). Pay records the payment (Dr staff, Cr bank/cash). Advances debit the person's Advance ledger and are recovered from salary.",
  d:["Mark attendance daily.","Record an advance on the day it is paid, from the bank or wallet it actually left.","Set the month's salary status (Draft → Processed → Paid) on Payroll — it locks attendance editing for Customer Care.","Pay salaries through Payroll → Pay, choosing the right bank."],
  n:["Don't pay salary by a hand-made Payment entry as well as Payroll → Pay.","Don't delete a staff member who has history — use Record exit.","Don't change attendance of a Paid month."],
  tabs:{team:"Profiles, KYC, salary structure, joining and exit.",attendance:"Day sheet: present, absent, half day, leave, weekly off, punch times.",empatt:"One person's month with late marks and overtime.",
    payroll:"Calculate, post and pay the month; salary status; payslips.",advances:"Advances and loans per person with recovery.",notebook:"HR notes, awards and warnings (not visible to Customer Care).",policy:"Rules used for late marks, OT and leave."}},
care:{t:"Customer Care",p:"Thank-you and review messages, top clients, bill feedback, masked staff profiles and attendance for this and last month.",
  l:["Directory → Client master (points, history)","Staff & Payroll → attendance (this and last month only)"],i:"No accounting entries. Writes client points, reviews, feedback and attendance marks.",
  d:["Log every Google review against the last bill.","Close feedback with a resolution note."],n:["Don't edit last month's attendance after salary is Processed — it is locked.","Don't share staff KYC outside the business."],
  tabs:{bills:"Bills of a day: send thanks, ask for a review, log feedback.",top:"Leaderboards by day, month and year.",feedback:"Bill-wise feedback with status.",staff:"Staff profiles without salary or bank details.",attendance:"Mark or correct attendance (current month; last month while Draft)."}},
directory:{t:"Directory",p:"Clients (with points, transaction history and spending study), reward register, birthdays and all contacts.",
  l:["Customer Care","Accounts → client ledgers (credit customers)"],i:"Points and reviews only; credit sales are posted in Accounts.",
  d:["Upload Petpooja sales regularly so points and history stay current (owner / manager).","Fill Active since for old clients."],n:["Don't create the same client twice — search by phone first."],
  tabs:{clients:"Client master; tap a client for the full history and study.",rewards:"Points earned and redeemed; earning rule.",occasions:"Birthdays and anniversaries this month.",all:"All contacts; staff open as profile view."}},
accounts:{t:"Accounts",p:"Double-entry books. Every module posts here; bank statements are imported here.",
  l:["All modules"],i:"Every entry has equal debits and credits. Bank, cash, card and wallet balances must match their statements.",
  d:["Import each bank, card and wallet statement once a week or month.","Clear Suspense after each import.","Check Bank check after each import."],
  n:["Don't import the same statement twice.","Don't post to Suspense on purpose — it is a waiting room.","Don't delete entries created by other modules; edit them in their module."],
  tabs:{overview:"Balances, payables, receivables and this month's expenses.",entry:"Hand entries: expense, purchase, payment, receipt, contra (bank ↔ cash, card bill), salary, advance, loan, journal.",
    book:"Every entry by date; edit or delete.",ledger:"One ledger's statement; print or export.",recon:"Tick entries against the bank statement.",
    suspense:"Bank lines not yet classified — move them to the right ledger and tick remember.",dups:"Doubles: statement imported twice, or typed by hand and also in the statement. Fix with a tap.",
    cats:"Categories: banks, cards, wallets, cash and expense categories with their sub-categories — add, rename, move, delete.",reports:"Trial balance, P&L, expenses by month and by category, GST, payables ageing."}},
invest:{t:"Investments",p:"Shares held by the business: trades, holdings, levels and results.",l:["Accounts → investment ledger, bank"],i:"Buys and sells post to the investment ledger against the bank.",
  d:["Record each contract note as a trade."],n:["Don't record a trade only in Joshi's Dashboard."]},
assets:{t:"Fixed Assets",p:"Equipment and fit-out: cost, depreciation, service records, disposal.",l:["Accounts → asset ledgers, Depreciation, Repairs & Maintenance"],
  i:"Purchase posts to the asset ledger; depreciation is posted yearly; service costs go to Maintenance.",d:["Add an asset when bought, with its bill.","Log every service and repair against the asset."],n:["Don't book an asset purchase as an expense."],
  tabs:{register:"All assets with value and service log.",schedule:"Depreciation by year."}},
insurance:{t:"Insurance",p:"Policies, premiums, claims and renewals.",l:["Accounts → insurance expense, bank"],i:"Premium payments post as expense; claims settled post as income.",
  d:["Upload the policy PDF.","Renew from the Renewal radar before the due date."],n:["Don't let a policy lapse — the radar warns 30 days ahead."],
  tabs:{policies:"All policies with premiums and claims.",radar:"Renewals due soon.",compare:"Compare quotes."}},
settings:{t:"Settings",p:"Business details, users and roles, logins (kitchen, Customer Care), backup.",l:["Every module (roles decide what each person sees)"],i:"No accounting entries.",
  d:["Give each person the smallest role that works.","Back up to Drive regularly."],n:["Don't share the owner login.","Don't change the book start month after entries exist."]},
import:{t:"Import data",p:"Bring in statements and old records from PDF, Excel or CSV. Every import can be undone from Import history.",
  l:["Accounts (bank, card, wallet statements)","Staff, Inventory, Directory"],i:"Creates entries and records; matched lines are ticked, not duplicated.",
  d:["Press Import once and wait for “Import finished”.","Read the Check column before importing."],n:["Don't import the same file twice — use Undo if a file went in wrong."]},
manual:{t:"Manual",p:"This manual: every module and every kind of ledger, with what to do and what not to do.",l:[],i:"None.",d:["Open the Manual button on any screen when unsure."],n:[]}
};
// ledger kinds (account manual)
const A={
cash:{t:"Cash in Hand / Petty Cash",p:"Notes and coins in the till or petty box.",i:"Money out from cash credits it; deposits to the bank are a Contra (cash → bank).",d:["Count cash daily and post the difference as a journal with a reason."],n:["Don't choose Cash for a payment that went by UPI or bank."]},
bank:{t:"Bank account",p:"Each current or savings account (Kotak, IndusInd, UCO…). Its balance must equal the bank statement.",i:"Import its statement; each line becomes or ticks an entry against the right ledger.",d:["Keep one ledger per account number.","Import the statement for every month."],n:["Don't post bank charges by hand — the statement brings them."]},
card:{t:"Credit card",p:"Each card (e.g. HDFC CC 0495). Spends credit the card; paying the card bill from the bank is a Contra (bank → card).",i:"Card balance = amount owed to the bank.",d:["Import the card statement monthly.","Map CRED / card-bill payments to the card, not to an expense."],n:["Don't book the card bill payment as an expense — the spends are the expenses."]},
wallet:{t:"Wallet / prepaid",p:"Paytm, Amazon Pay, PhonePe wallet or prepaid cards that hold money of the business.",i:"Top-ups are a Contra (bank → wallet); spends from the wallet credit it.",d:["Add one wallet ledger per wallet and import its statement."],n:["Don't confuse a wallet with a UPI app that pays straight from the bank."]},
aggregator:{t:"Settlements & UPI apps",p:"Money collected for you and paid out later: Zomato Settlement, Swiggy, Google Pay / Paytm settlements.",i:"Sales on the app debit it; the payout to the bank credits it. Balance = amount still to come.",d:["Book only sales and payouts here."],n:["Don't book supplier payments (e.g. Hyperpure) here — they are grocery purchases."]},
vendor:{t:"Vendor / supplier",p:"What you owe each supplier. Bills credit it; payments debit it.",i:"Balance (Cr) = still payable; a Dr balance = advance paid.",d:["Upload bills so payments match."],n:["Don't create two ledgers for the same supplier — add an alias instead."]},
customer:{t:"Customer / client ledger",p:"Credit customers and the owner's food account.",i:"Credit sales debit it; receipts credit it.",d:["Collect and record receipts against it."],n:["Don't use it for walk-in cash sales."]},
staff:{t:"Staff (salary)",p:"One per person: salary earned is credited, salary paid is debited.",i:"Cr balance = salary still to pay.",d:["Pay through Payroll."],n:["Don't book advances here — they have their own ledger."]},
staffadv:{t:"Staff advance",p:"Advance given to a person, recovered from salary.",i:"Dr balance = advance still to recover.",d:["Record the advance from the bank or wallet it left."],n:["Don't record the same advance again when the statement arrives — it is matched."]},
staffloan:{t:"Staff loan",p:"Loan to a person, recovered by monthly EMI.",i:"Dr balance = loan outstanding.",d:["Set the EMI on the profile."],n:["Don't mix with advances."]},
expense:{t:"Expense head (sub-category)",p:"Where spending is booked. Each expense ledger is a sub-category of a category (Groceries, Rent, Electricity, Subscriptions…).",i:"Shown in P&L and Reports → Expenses by category.",d:["Set its category in the ledger form.","Add sub-categories in Accounts → Categories."],n:["Don't create a new head for every vendor — vendors are tracked as payees inside the sub-category."]},
income:{t:"Income head",p:"Sales and other income.",i:"Shown in P&L.",d:["Keep dine-in, takeaway, delivery and party sales separate."],n:["Don't book capital or loans as income."]},
tax:{t:"Tax / statutory",p:"GST input and output, professional tax, TDS.",i:"Balances are payable to or claimable from the government.",d:["Check GST summary monthly."],n:["Don't post GST into expense heads."]},
capital:{t:"Capital / owner",p:"Money the owner puts in or takes out.",i:"Capital infusions credit it; drawings debit it.",d:["Map “Capital infusion” bank receipts here."],n:["Don't book owner money as sales."]},
loan:{t:"Loan",p:"Loans taken by the business.",i:"Cr balance = amount owed.",d:["Split EMI into principal and interest."],n:["Don't book the full EMI as an expense."]},
deprec:{t:"Deposit received",p:"Security deposits you hold.",i:"Cr balance = to be returned.",d:[],n:[]},deppaid:{t:"Deposit paid",p:"Security deposits you gave (rent deposit).",i:"Dr balance = recoverable.",d:[],n:["Don't book the deposit as rent."]},
asset:{t:"Fixed asset",p:"Equipment and fit-out.",i:"Depreciated yearly.",d:["Create it from Fixed Assets."],n:[]},invest:{t:"Investment",p:"Shares and funds held.",i:"Valued at cost in the books.",d:[],n:[]},stock:{t:"Stock / inventory",p:"Closing stock value.",i:"Posted by month-end valuation.",d:[],n:["Don't post to it by hand."]},
suspense:{t:"Suspense",p:"Waiting room for bank lines not yet classified and bill differences to verify.",i:"Should be zero at month end.",d:["Move each entry to its proper ledger and tick remember."],n:["Don't leave entries here at month end."]}};
J.MANUAL=M;J.ACC_MANUAL=A;
// ---------- rendering ----------
const li=a=>a&&a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
const block=(x,tab)=>`<div class="man">${x.p?`<p><b>${esc(x.p)}</b></p>`:""}
  ${tab&&x.tabs?.[tab]?`<div class="man-now"><span class="chip plain">This screen</span> ${esc(x.tabs[tab])}</div>`:""}
  ${x.s?.length?`<h4>How to use</h4><ol>${x.s.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>`:""}
  ${x.l?.length?`<h4>Linked to</h4>${li(x.l)}`:""}
  ${x.i?`<h4>Impact on the books</h4><p>${esc(x.i)}</p>`:""}
  ${x.d?.length?`<h4 class="ok">Do</h4>${li(x.d)}`:""}${x.n?.length?`<h4 class="bad">Don't</h4>${li(x.n)}`:""}
  ${x.tabs?`<h4>Sections</h4><table><tbody>${Object.entries(x.tabs).map(([k,v])=>`<tr><td style="white-space:nowrap"><b>${esc(tabName(x,k))}</b></td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`:""}</div>`;
function tabName(x,k){for(const m of J.MODS){const t=m.tabs.find(t=>t[0]===k);if(t&&(M[m.id]===x||(m.id==="inventory"&&x===M.inventory)))return t[1]}return k}
J.manualHtml=(mod,tab)=>{const x=M[mod];if(!x)return "<p class='muted'>No manual for this screen yet.</p>";let h=block(x,tab);if(mod==="inventory"&&tab==="bills")h=block(M.bills)+h;
  if(mod==="accounts"&&(tab==="ledger"||tab==="cats")){const k=tab==="ledger"&&J.get("accounts",J.ui("acc.ledger")?.acc)?.kind;h+=`<h3>Ledgers by kind</h3>${Object.entries(A).filter(([kk])=>!k||kk===k).map(([kk,v])=>`<details ${k?"open":""}><summary><b>${esc(v.t)}</b></summary>${block(v)}</details>`).join("")}`}return h};
J.manualBtn=(mod,tab)=>M[mod]?`<button class="btn w" data-a="manOpen" data-x="${esc(mod)}|${esc(tab||"")}" title="Operating manual for this screen">📘 Manual</button>`:"";
J.act("manOpen",el=>{const [mod,tab]=el.dataset.x.split("|");J.drawer({title:"Manual · "+(M[mod]?.t||mod),wide:true,submit:"Close",body:J.manualHtml(mod,tab)+`<p class="hint"><a href="#manual" data-go="manual">Open the full manual</a></p>`,onSubmit:()=>{}})});
J.accManualLink=kind=>A[kind]?`<button type="button" class="linkbtn" data-a="accMan" data-x="${esc(kind)}">How this kind of ledger works</button>`:"";
J.act("accMan",el=>{const k=el.dataset.x;const box=document.getElementById("accManBox");if(box){box.innerHTML=box.innerHTML?"":block(A[k]);return}});
// ---------- the Manual module ----------
function vManual(){const q=(J.ui("man",{q:""}).q||"").toLowerCase();const vis=J.MODS.filter(m=>J.canSee(m.id)&&M[m.id]);
  const hit=x=>!q||JSON.stringify(x).toLowerCase().includes(q);
  const mods=vis.filter(m=>hit(M[m.id])||(m.id==="inventory"&&hit(M.bills)));const accs=(!S.me.kitchen&&!S.me.cc)?Object.entries(A).filter(([,v])=>hit(v)):[];
  return `<div class="filters"><input type="search" id="man-q" data-ui="man.q" value="${esc(q)}" placeholder="Search the manual (e.g. advance, statement, Hyperpure)" style="min-width:280px"><button class="btn" data-a="manPrint">Print / save PDF</button></div>
  <section class="panel"><h2>The five rules</h2><div class="pb"><ol>
   <li>Record a payment once, on the day you pay, from the account the money really left.</li>
   <li>Import each bank, card and wallet statement once; then check Accounts → Bank check and Suspense.</li>
   <li>Upload supplier bills; don't type them again.</li>
   <li>Book spending to a sub-category; vendors are tracked inside it.</li>
   <li>Fix mistakes with Edit in the module that made the entry; delete only true duplicates.</li></ol></div></section>
  ${mods.map(m=>`<section class="panel" id="man-${m.id}"><h2>${esc(M[m.id].t)} <button class="linkbtn" data-go="${m.id}">open →</button></h2><div class="pb">${m.id==="inventory"?block(M.inventory)+`<h3>Supplier bills</h3>`+block(M.bills):block(M[m.id])}</div></section>`).join("")}
  ${accs.length?`<section class="panel" id="man-ledgers"><h2>Ledgers and accounts</h2><div class="pb">${accs.map(([,v])=>`<details><summary><b>${esc(v.t)}</b></summary>${block(v)}</details>`).join("")}</div></section>`:""}
  ${!mods.length&&!accs.length?`<div class="panel pb muted">Nothing matches “${esc(q)}”.</div>`:""}`}
J.act("manPrint",()=>{const vis=J.MODS.filter(m=>J.canSee(m.id)&&M[m.id]);J.printDoc("Operating manual",`<h1>${esc(J.settings().business)} — Operating manual</h1>${vis.map(m=>`<h2>${esc(M[m.id].t)}</h2>${block(M[m.id])}${m.id==="inventory"?"<h3>Supplier bills</h3>"+block(M.bills):""}`).join("")}<h2>Ledgers and accounts</h2>${Object.values(A).map(v=>`<h3>${esc(v.t)}</h3>${block(v)}`).join("")}`)});
J.mod({id:"manual",label:"Manual",group:"Governance",icon:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h7"/>',sub:"How to use every screen and ledger — what it does, its impact on the books, and what to do and not do.",tabs:[["manual","Manual",vManual]]});
})();
