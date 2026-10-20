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
home:{t:"Home",p:"The day at a glance — the slim header carries the weather in its background (sky colour, the sun's path from sunrise to sunset, temperature, next hours and next 2 days; free Open-Meteo data, refreshed every 30 minutes). Panchang and Astrology are tabs on the right: tap one to open it, tap again to close. Astrology shows only your chosen rashi — yesterday (past), today (present) and tomorrow (future). Also: sales, cash and bank, what needs attention (attendance not marked, stock running out, bills unpaid, renewals).",
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
    items:"The item list: unit, category, GST, preferred vendor, picture.",pics:"Pictures for purchased items without opening each item: tap Find on Hyperpure (opens beside), then drag the product picture onto the item box, or Copy image and paste (Ctrl+V) into it. Photos from the phone also work.",best:"Lowest price paid per item and from whom.",recipes:"Cost of each dish from its recipe and current item rates."}},
bills:{t:"Supplier bills",p:"Hyperpure and other supplier PDF bills: read automatically, mapped to stock and expenses, matched with the payment.",
  s:["Inventory → Bills → Upload bills (several PDFs at once).","Check the mapping of each line (stock item or expense head) and save.","Open the bill later to see whether it is matched, unpaid or has a difference."],
  l:["Accounts → vendor ledger, Kitchen Purchases, expense heads, Suspense","Bank statement import"],i:"One purchase entry per bill (Dr purchases/expenses, Cr vendor). The bank payment is moved onto the vendor when matched; any bill-vs-payment difference sits in Suspense.",
  d:["Upload the bill even if the payment is already in the bank — that is how it gets matched.","Check Suspense for bill differences each week."],n:["Don't also record the bill by hand.","Don't delete a matched bill unless the bill itself was wrong."]},
kitchen:{t:"Kitchen",p:"Menu with recipes, serving sizes, languages, videos, new items under trial and costing per serve.",
  l:["Inventory (item rates for costing)","Staff KOT (menu prices)"],i:"None on the books — costing reads inventory rates.",
  d:["Keep recipes and video links current.","Use New items for dishes on trial — they have no price until promoted."],n:["Don't change menu prices here without updating the POS (Petpooja)."],
  tabs:{menu:"Recipes by dish: choose servings, language; linked sub-recipes open in a pop-up.",pics:"Dish pictures, strictly 400 × 400: tap Google Images (opens beside, asks for the dish on a black plate with black cutlery, square), then drag the chosen picture onto the dish box, or Copy image and paste (Ctrl+V). The app crops the centre and saves exactly 400 × 400; dishes without one are listed first.",new:"Dishes being tried from shared videos; promote to the menu when ready.",cost:"Cost per serve from current stock rates or standard rates."}},
kot:{t:"Staff KOT",p:"Food taken by staff (or the owner's account) during the month, billed monthly and recovered from salary or the client ledger.",
  l:["Staff & Payroll → Staff Food Recovery","Accounts → client ledger, Dine-in Sales"],i:"Monthly bill posts the food value: recovered from salary (staff) or billed to the client ledger.",
  d:["Enter a KOT the same day.","Correct quantity mistakes with Edit before the month is closed."],n:["Don't edit a KOT of a month whose salary is paid — it changes the recovery."],
  tabs:{new:"Make a staff KOT.",book:"All KOTs with edit and delete.",bill:"Monthly total per person; posts the recovery.",tally:"House account (e.g. Suraj Joshi): each day's staff KOTs (Suraj included, as staff) vs the combined Petpooja bill. Each day's combined bill is posted to the house (client) ledger with one line per person and their KOT numbers; Suraj's payment clears it, so the ledger is nil when fully paid. Staff food is not cut from salary — the payslip notes it as reimbursed.",food:"Each person's staff KOTs by month for the financial year, with the yearly total; tap a name for the day-by-day list."}},
staff:{t:"Staff & Payroll",p:"Team records, attendance, salary, advances, loans, notebook and HR policies. Every person has three ledgers: salary, Advance — name, Loan — name.",
  l:["Accounts → Staff Salary, staff ledgers, advances, loans, Professional Tax, Staff Food Recovery","Customer Care (attendance view)","Kitchen logins"],
  i:"Posting the month books salary earned (Dr Staff Salary, Cr staff). Pay records the payment (Dr staff, Cr bank/cash). Advances debit the person's Advance ledger and are recovered from salary.",
  d:["Mark attendance daily.","Record an advance on the day it is paid, from the bank or wallet it actually left.","Set the month's salary status (Draft → Processed → Paid) on Payroll — it locks attendance editing for Customer Care.","Pay salaries through Payroll → Pay, choosing the right bank."],
  n:["Don't pay salary by a hand-made Payment entry as well as Payroll → Pay.","Don't delete a staff member who has history — use Record exit.","Don't change attendance of a Paid month."],
  tabs:{team:"Profiles, KYC, salary structure, joining and exit.",attendance:"Day sheet: present, absent, half day, leave, weekly off, punch times.",empatt:"One person's month with late marks and overtime.",
    payroll:"Two views. Month-wise: pick a month — every staff member of that month, editable, with settlement, payslips and pay. Staff-wise: pick a person and financial year — every month in service till date, each editable, with Settle and Payslip per month and Pay balances for all months still due. When paying, the Paying now amount can be changed: if it differs from the balance, choose Carry forward to next month (added to or recovered from next month's salary) or Move to escrow (held in the person's escrow ledger).",advances:"Advances and loans per person with recovery.",notebook:"HR notes, awards and warnings (not visible to Customer Care).",policy:"Rules used for late marks, OT and leave.",escrow:"Hold a salary (exit staff, pending work) in the person's escrow ledger; later pay it from escrow or carry it forward into a later month's salary."}},
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
  tabs:{overview:"Balances, payables, receivables and this month's expenses.",loans:"Every loan and advance with its terms, principal outstanding and interest due; post interest month by month, re-post after a change, or waive interest. Also lists deposits with a fixed monthly payment (e.g. non-refundable, life-long ₹1,000 a month).",entry:"Hand entries: expense, purchase, payment, receipt, contra (bank ↔ cash, card bill), salary, advance, loan, journal.",
    book:"Every entry by date; edit or delete.",ledger:"One ledger's statement; print or export.",recon:"Tick entries against the bank statement.",
    suspense:"Bank lines not yet classified. Press Move (or Move all for a party): choose Category → Sub-category → Connection, correct the narration, and tick remember so future statements map the party by themselves.",dups:"Doubles: statement imported twice, or typed by hand and also in the statement. Fix with a tap.",
    cats:"Categories: banks, cards, wallets, cash and expense categories with their sub-categories — add, rename, move, delete. Connections on a sub-category list each meter, phone number, broadband ID or building paid under it; bank lines are tagged by their number, and Reports → Bills by connection shows every month per connection.",reports:"Trial balance, P&L, expenses by month and by category, GST, payables ageing."}},
sales:{t:"Sales & Cash",p:"Petpooja orders turned into the books: daily sales by payment, UPI matched with Google Pay credits, Swiggy / Zomato payouts matched with orders, and the daily cash count.",
  s:["Petpooja → Reports → Order listing → export Excel (any date range, overlaps are fine).","Sales & Cash → Upload Petpooja order listing → check the summary (part payments, dues, house orders) → Import.","After the bank statement import, open UPI ↔ Google Pay and Swiggy / Zomato and clear any difference.","Every night: Cash counter → post cash expenses → count notes and coins → Save count."],
  l:["Accounts → Dine-in / Delivery / Takeaway Sales, Cash in Hand, Google Pay settlements, Swiggy / Zomato settlements, customer and staff ledgers, Discounts allowed","Directory → client history, habits and points","Staff KOT (house / staff orders)"],
  i:"One sales entry per day: Dr cash / UPI / aggregators / dues, Cr sales (gross), Dr discounts. Re-uploading a day replaces that day's entry — nothing doubles. Cash count differences post to Cash short & excess.",
  d:["Upload the order listing at least weekly, before the bank statement.","Record every cash expense in the Cash counter the same day.","Book aggregator commission when a payout is matched.","Settle part-payment dues against the customer's ledger when they pay."],
  n:["Don't post Petpooja sales by hand as well.","Don't mark staff food as UPI in Petpooja — it confuses the UPI match (it is excluded as a house order).","Don't leave a cash difference unexplained — write the reason in the note."],
  tabs:{daily:"Each day's orders, sales by payment and the posted entry; tap a date for every order.",upi:"Google Pay bank credits matched with the UPI sales days they cover.",agg:"Swiggy / Zomato payouts vs orders; book commission & fees.",cash:"Counter cash book for the day and the note / coin count.",items:"Best sellers, when and where, items ordered together, regulars and their habits."}},
dues:{t:"Bills, taxes & dues",p:"Every regular payment in one place: rent, maintenance, electricity, telecom, credit-card bills, subscriptions, salaries and EMI purchases — each with its own party ledger and terms (fixed, increasing every n months, or actual bills), due dates, reminders and a 12-month budget.",
  l:["Accounts → party ledgers (landlord, society, CESC, card…), expense sub-categories, bank / card / wallet / cash, “Reward points & cashback redeemed”, “Bank charges & convenience fees”","Staff & Payroll (salaries)","Home → Today's to-do (due reminders)"],
  i:"A bill posts Dr the expense head, Cr the party's own ledger; a payment posts Dr the party, Cr each source used (bank, card, wallet, cash) and the reward points / cashback as income; the party ledger shows what is still owed. EMI: the card is credited back each month with principal (to “EMI loan — item”), interest and GST.",
  d:["Create one commitment per bill you pay (e.g. three maintenance commitments, one per building, each with its connection).","For rent with a yearly increase use “Fixed, increasing” — the app works out each month's amount.","Enter electricity and card statements as they come (Enter bill), then Pay.","Split a payment when part is paid by wallet or reward points.","Press “Post fixed bills” once a month."],
  n:["Don't also book the same rent / maintenance as a direct expense from the bank — map the bank line to the party ledger instead.","Don't give a credit card commitment an expense head — card expenses are already booked."],
  tabs:{month:"What is due in a month, status (due, overdue, part paid, paid), Enter bill, Pay with split sources, post fixed bills and due EMIs.",list:"All commitments with their terms.",emi:"EMI purchases with the full schedule; post the conversion and each instalment.",lic:"Every licence and statutory tax in one place: number, authority, issue date, valid till / next due, renewal cycle, usual fee, portal, the consultant who handles it (name, firm, phone, email, fee) and the payment history (date, amount, mode, source, challan / UTR). Record renewal posts the fee, late fee and consultant fee and moves the validity forward; reminders show on Home before expiry.",budget:"Next 12 months projected per commitment and in total."}},
invest:{t:"Investments",p:"Shares held by the business: trades, holdings, levels and results.",l:["Accounts → investment ledger, bank"],i:"Buys and sells post to the investment ledger against the bank.",
  d:["Record each contract note as a trade."],n:["Don't record a trade only in Joshi's Dashboard."]},
assets:{t:"Fixed Assets",p:"Equipment and fit-out: cost, depreciation, service records, disposal.",l:["Accounts → asset ledgers, Depreciation, Repairs & Maintenance"],
  i:"Purchase posts to the asset ledger; depreciation is posted yearly; service costs go to Maintenance.",d:["Add an asset when bought, with its bill.","Log every service and repair against the asset."],n:["Don't book an asset purchase as an expense."],
  tabs:{register:"All assets with value and service log.",repairs:"Every repair and service in one log — fridge, AC, pump, kitchen equipment, pest control, plumbing — with problem, work done, parts, service centre, technician and phone, ticket and invoice no., cost (posted to Repairs & Maintenance or Pest control), warranty and next service. Filter by equipment, type and dates; totals by equipment.",plans:"Regular services with reminders (AC servicing, pest control, RO / pump, chimney, fire extinguisher): every n months or days, service centre and technician with phone, AMC / contract. Mark done logs the visit and sets the next date; reminders show on Home.",schedule:"Depreciation by year."}},
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
escrow:{t:"Salary held (escrow)",p:"Salary held back for one person — exit (full & final pending) or pending work.",i:"Cr balance = salary held, still owed to the person. Payroll does not pay it until released.",d:["Release it by paying from escrow or carrying it forward to a later salary."],n:["Don't pay a held salary through Payroll → Pay — release it here."]},
staffloan:{t:"Staff loan",p:"Loan to a person, recovered by monthly EMI.",i:"Dr balance = loan outstanding.",d:["Set the EMI on the profile."],n:["Don't mix with advances."]},
expense:{t:"Expense head (sub-category)",p:"Where spending is booked. Each expense ledger is a sub-category of a category (Groceries, Rent, Electricity, Subscriptions…).",i:"Shown in P&L and Reports → Expenses by category.",d:["Set its category in the ledger form.","Add sub-categories in Accounts → Categories."],n:["Don't create a new head for every vendor — vendors are tracked as payees inside the sub-category."]},
income:{t:"Income head",p:"Sales and other income.",i:"Shown in P&L.",d:["Keep dine-in, takeaway, delivery and party sales separate."],n:["Don't book capital or loans as income."]},
tax:{t:"Tax / statutory",p:"GST input and output, professional tax, TDS.",i:"Balances are payable to or claimable from the government.",d:["Check GST summary monthly."],n:["Don't post GST into expense heads."]},
capital:{t:"Capital / owner",p:"Money the owner puts in or takes out.",i:"Capital infusions credit it; drawings debit it.",d:["Map “Capital infusion” bank receipts here."],n:["Don't book owner money as sales."]},
loan:{t:"Loan",p:"Loans taken (or given) with their terms: interest-free, simple, compound (monthly / quarterly / yearly) or a fixed amount per month. Set the terms on the ledger; interest is posted from Accounts → Loans & interest.",i:"Cr balance = amount owed (taken). Interest is posted to the same ledger (expense “Interest paid on loans”); repayments clear unpaid interest first, then the loans (interest-bearing first, or oldest first); compound interest is added to its loan at each compounding date.",d:["Keep ONE ledger per person for all loans, advances and deposits with them. On the ledger add a terms line for each change (e.g. interest-free from the start, 12% simple from 01-07-2026) — every amount follows the terms in force on its date.","Post interest each month from Loans & interest; see Statement for the loan-by-loan table and the date-wise record.","If the lender lets the interest go at closure, use Waive interest — it is written back as income “Interest waived by lenders”."],n:["Don't book the full EMI as an expense — only the interest part.","Don't change an existing terms line to start interest on an old loan — add a new line with the date the new terms begin."]},
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

// ---------- versions (js/versions.js, generated from the git history by tools/release.py) ----------
const VER=()=>window.JCGG_VERSIONS||{app:{},mods:{}};
const when=s=>{if(!s)return "";const [d,tm]=s.split(" ");return J.fmtDate(d)+(tm?", "+tm:"")};
J.verOf=id=>VER().mods[id]||null;
J.verLine=id=>{const v=J.verOf(id);return v?`v${esc(v.v)} · updated ${esc(when(v.at))}`:""};
J.verBtn=id=>{const v=J.verOf(id);return v?`<button class="btn w" data-a="verHist" data-x="${esc(id)}" title="Version history">🕘 v${esc(v.v)}</button>`:""};
J.act("verHist",el=>{const id=el.dataset.x;const v=id==="app"?{v:VER().app.v,at:VER().app.at,hist:[]}:J.verOf(id);const m=J.MODS.find(x=>x.id===id);
  const all=id==="app"?Object.entries(VER().mods).map(([k,x])=>({k,...x})).sort((a,b)=>b.at.localeCompare(a.at)):null;
  J.drawer({title:(id==="app"?"JCGG Suite":id==="platform"?"Core platform":m?.label||id)+" · version history",wide:true,submit:"Close",onSubmit:()=>{},
    body:`<p><b>Current version v${esc(v?.v||"—")}</b> · updated ${esc(when(v?.at))} (India time)</p>
    ${all?`<div class="tbl-wrap"><table><thead><tr><th>Module</th><th>Version</th><th>Last updated</th><th></th></tr></thead><tbody>${all.map(x=>`<tr><td>${esc(x.k==="platform"?"Core platform":J.MODS.find(m=>m.id===x.k)?.label||x.k)}</td><td>v${esc(x.v)}</td><td>${esc(when(x.at))}</td><td><button class="linkbtn" data-a="verHist" data-x="${esc(x.k)}">history</button></td></tr>`).join("")}</tbody></table></div>`
    :`<div class="tbl-wrap"><table><thead><tr><th>Version</th><th>Date &amp; time</th><th>What changed</th></tr></thead><tbody>${(v?.hist||[]).map(h=>`<tr><td style="white-space:nowrap"><b>v${esc(h.v)}</b></td><td style="white-space:nowrap">${esc(when(h.at))}</td><td>${esc(h.msg)}</td></tr>`).join("")}</tbody></table></div>`}
    <p class="hint">Every module is free to use: the app runs on GitHub Pages and the free Firebase plan — no subscription, no paid add-ons.</p>`})});

// ---------- free to use: what the app runs on and how close it is to the free limits ----------
J.freePanel=()=>{if(!(S.me.owner||["Super Admin","Admin"].includes(J.myRole?.())))return "";const docs=J.DATA_KEYS.reduce((s,k)=>s+(J.S.c[k]?.size||0),0);let bytes=0;try{for(const k of J.DATA_KEYS)bytes+=JSON.stringify(J.all(k)).length}catch(e){}
  const mb=bytes/1048576;const estReads=docs*20;
  const row=(s,free,use,ok)=>`<tr><td>${s}</td><td>${free}</td><td>${use}</td><td>${ok?'<span class="chip ok">Free</span>':'<span class="chip warn">Watch</span>'}</td></tr>`;
  return `<section class="panel"><h2>Free to use — no subscription</h2><div class="pb"><p class="hint" style="margin-top:0">Every module runs on free services. Keep the Firebase project on the free <b>Spark</b> plan (no billing account): then nothing can ever be charged — if a daily limit were reached, the app would pause until the limit resets (midnight US Pacific time — about 12:30–1:30 pm India time).</p>
  <div class="tbl-wrap"><table><thead><tr><th>Service</th><th>Free allowance</th><th>This business now</th><th></th></tr></thead><tbody>
  ${row("Hosting — GitHub Pages","Free for public repositories (soft limit 100 GB traffic a month)","One small site",true)}
  ${row("Sign-in — Firebase Auth (Google, email / password)","Free up to 50,000 users a month",(J.all("ccusers").length+J.all("kitchenusers").length)+" staff logins + owner team",true)}
  ${row("Database — Cloud Firestore storage","1 GB",mb.toFixed(1)+" MB in "+docs.toLocaleString("en-IN")+" records",mb<700)}
  ${row("Database — reads","50,000 a day","about "+docs.toLocaleString("en-IN")+" per app open (20 opens a day ≈ "+estReads.toLocaleString("en-IN")+")",estReads<40000)}
  ${row("Database — writes","20,000 a day","entries, imports, attendance",true)}
  ${row("Files & bill PDFs","Kept inside Firestore (no paid Storage)","counted in the 1 GB above",true)}
  ${row("Backup — Google Drive","15 GB free Google account","Backup files",true)}
  ${row("WhatsApp / SMS messages","Free — opens WhatsApp or SMS on your phone","one tap to send",true)}
  ${row("Login emails — Apps Script relay","100 emails a day (Gmail)","optional",true)}
  ${row("Video titles (noembed), maps, YouTube","Free public services","as needed",true)}
  </tbody></table></div>
  <p class="hint">Don't: add a billing account to the Firebase project, switch on paid Firebase Storage / Functions, or use a paid WhatsApp Business API — none are needed.</p></div></section>`};
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
