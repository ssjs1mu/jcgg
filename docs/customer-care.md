# Customer Care role, loyalty engine and feedback — architecture

JCGG Suite is a static single-page app (GitHub Pages) on Firebase Auth + Cloud Firestore. There is no app
server: **"middleware" is two layers** that must agree —

1. **Firestore security rules** (`firestore.rules`) — the real guard. Every read and write is checked on Google's
   servers; a modified browser cannot get past them.
2. **Client guards** (`js/core.js`, `js/care.js`) — decide which modules, tabs, buttons and fields are rendered,
   and which collections a session subscribes to, so the role never even requests data it may not read.

"API routes" are therefore Firestore paths plus the app actions (`data-a="…"`) that write them.

## 1. Authentication & role configuration

| Item | Implementation |
|---|---|
| Role name | `CUSTOMER_CARE` (shown as *Customer Care*; `J.myRole()` → `"Customer Care"`) |
| User ID | `jcgg` → Firebase email/password account `jcgg@care.joshiscorner.app` (`J.ccEmail`) |
| Password | Typed by the owner in **Settings → Logins & devices → Customer Care login** (≥10 chars, letters + digits). Created through a separate Firebase app instance so the owner's session is untouched. Never stored or shown by the app. Change needs the current password. |
| Enable / disable | `ccusers/jcgg@care.joshiscorner.app.active`. Switching off signs open sessions out within seconds (listener on the record) and the rules refuse all data at once. |
| Google accounts | The owner may also list Google emails as Customer Care (`ccusers/<gmail>`, `google:true`). Such an account must not also hold a role in Users & roles. |
| Session | Firebase session, local persistence. Every sign-in, app open, sign-out, failed or refused attempt goes to the append-only login log with device, browser, IP and server time. |

## 2. Data models (Firestore)

```
ccusers/{email}            { userId:"jcgg", email, uid, google?, name, active:boolean, createdAt, by, changedAt?, changedBy? }
staffcc/{staffId}          masked staff copy (written only by owner/admin sessions)
                           { name, code, desig, dept, img, phone, phone2, altContact, emergency, email, dob, anniv,
                             father, mother, family[{name,rel,phone,dob}], address, permAddress, mapLink,
                             aadhaar, pan, voter, ration, dl, kyc[{fid,col:"ccfiles",cat,name,type,of,thumb,pages}],
                             stints[{join,exit,code,desig,dept}], active, weekOff, shiftStart, shiftEnd, days, syncedAt }
                           NEVER: sal.*, gross/basic/HRA, deductions, net, bonuses, bankName/bankAc/ifsc/upi,
                           salary revisions, notes (HR / disciplinary), audit trail, bank or agreement scans
ccfiles/{fid-i}            copies of KYC scan chunks only (Aadhaar, PAN, voter, DL, ration, photo, passport)
paystatus/{YYYY-MM}        { status: DRAFT | PROCESSED | LOCKED | PAID, at, by }   mirror of payroll status
payroll/{YYYY-MM}          (existing) + status, statusAt, statusBy        — owner/admin only
attendance/{YYYY-MM}       (existing) days{ "<day>": { "<staffId>": { s, in, out, in2, out2, ot, auto } } }
                           + cclog[{at, by, sid, day, f, from, to}]  Customer Care change log
clients/{id}               (existing client master) + pts[] earn entries now carry {bill, date, time, amt, points, src:"petpooja"}
                           + lastBill, lastBillDate, lastBillTime, reviews[{id, at, bill, stars, note, by, loggedAt}],
                             lastReviewAt, lastReviewBill, msgs[{at, kind, bill, by}]
feedback/{id}              { clientId, clientName, code, phone, bill, at (date-time), rating 1–5, food, service,
                             status: Open | In progress | Resolved, resolution, by, createdAt, updatedAt, updatedBy,
                             resolvedAt?, resolvedBy?, history[{at, by, text}] }
meta/settings              + rewardPer (₹ per point), rewardValue (₹ per point), reviewLink, waTpl{thanks, points}
users / staff              staff records stay in accounts/{staffId} (kind:"staff"); users are Firebase Auth +
                           meta/roles (members), kitchenusers (kitchen staff), ccusers (Customer Care)
```

Petpooja uploads are not stored as separate files: each bill becomes one `earn` entry on the client, keyed by bill
number (a bill number already present anywhere is skipped, so re-uploading is safe).

## 3. Permissions & access matrix

| Area | Customer Care | Enforced in rules by |
|---|---|---|
| Kitchen menu & recipes | read only (no prices, no costing, no edit, no attachments) | `menu/*` read: `isCC()`; no write |
| Staff & Payroll module | hidden | generic rule: `isMember()` excludes Customer Care |
| Attendance — this month | view + edit | `attendance/{m}` read if `m ∈ {curM, prevM}`; write if `ccMayEditAttendance(m)`; only `days`, `cclog` may change |
| Attendance — last month | edit only while salary is `DRAFT` | `payLocked(m)` reads `paystatus/{m}` |
| Attendance — older months | none | `m` must equal `curM()`/`prevM()` (India time) |
| Payroll, advances, reports, pay figures | none | not in any allow rule for the role |
| Staff profile | name, phone, emergency contact, photo, designation, family, KYC numbers & scans | role reads only `staffcc`, `ccfiles` |
| Salary, bank, HR notes | none | fields never written to `staffcc` |
| Directory — clients | full client master incl. *Active since*, transaction history and spending & visits study; add / edit, no delete, no import | `clients/*` |
| Directory — contacts | read, add, edit (no delete); staff appear as profile view only (masked) | `contacts/*`, `staffcc/*` |
| Clients, points, reviews | read, create, update (no delete) | `clients/*` |
| Bill feedback | read, create, update (no delete) | `feedback/*` |
| Everything else (accounts, stock, bills, assets…) | none | generic rule excludes the role |

Client-side guards: `ACCESS["Customer Care"]=["care","kitchen","directory"]`, `J.isCC()` hides Settings, attachments,
costing, kitchen editing, client delete and client import; `subscribeCC()` subscribes only to the collections above.

## 4. Attendance lock logic

```
status(m) = "PAID"       if payroll/{m}.paid has any entry or a "salaries settled" voucher exists
          = payroll/{m}.status  if it is PROCESSED or LOCKED   (owner sets it on Staff → Payroll)
          = "DRAFT"      otherwise
editable(m) = m == thisMonth
           or (m == lastMonth and status(m) == "DRAFT")
```

The owner/admin session mirrors `status(m)` into `paystatus/{m}` (every 30 s and after any data change). The rules
check `paystatus` so the lock holds even if the browser is modified. Automatic salary postings do **not** lock a
month — only the explicit PROCESSED / LOCKED choice or an actual payment does. Attendance changes by Customer Care
are picked up by the owner's payroll the next time it recalculates.

## 5. Loyalty engine

* **Upload** (owner / manager only): Directory → Client master → *Upload Petpooja sales* (CSV or Excel). Customer Care cannot upload. Columns are found by header:
  mobile / customer phone, bill / invoice / order number, date (with time if present), grand total / bill amount,
  optional customer name. Rows without a 10-digit mobile are skipped and counted.
* **Points**: `floor(bill amount / rewardPer)` per bill (default ₹100 per point; Directory → Reward register →
  rule). Balance = earned − redeemed ± adjustments.
* **Aggregates** (`J.clientSales`): lifetime, this year, this month, today, by month and by year.
* **Leaderboards**: Customer Care → Top clients — daily / monthly / yearly by sales.

## 6. WhatsApp & reviews

* Templates in `meta/settings.waTpl` with placeholders `{name} {bill} {amount} {date} {points} {worth} {per} {review} {business}`;
  review link in `meta/settings.reviewLink` (owner edits via *Messages & review link*).
* Triggers open WhatsApp (`https://wa.me/<91mobile>?text=…`) with the message ready; sending is one tap
  (fully automatic WhatsApp needs a paid Business API). Each trigger is logged in `clients.msgs`.
* *Log Google review* stores `{at: review date-time, bill: last bill number, stars, note, by}` on the client found by
  client number (CL-xxxx) / mobile.

## 7. UI routes and actions

| Screen (hash route) | Purpose | Actions (writes) |
|---|---|---|
| `#care-bills` | bills of a day, thank-you, review, feedback | `ccWa` (clients.msgs), `ccReview` (clients.reviews), `fbNew` (feedback), `ccTpl` (meta/settings, owner) |
| `#directory-clients` | client master (Active since column), click → transaction history + spending & visits study | `cliSpend`, `cliRedeem`, `cliEdit`, `subEdit` (clients); `ppUpload` owner/manager only |
| `#directory-contacts` | contacts; staff open the masked profile | `conEdit` (contacts) |
| `#care-top` | daily / monthly / yearly leaderboards | `ccWa` |
| `#care-feedback` | bill-wise feedback register with status filter | `fbNew`, `fbEdit` (feedback) |
| `#care-staff` | masked staff profiles with KYC scans | read only |
| `#care-attendance` | this / last month, day sheet + month grid | `ccAttSet` (attendance.days, attendance.cclog) |
| `#kitchen-menu`, `#kitchen-new` | recipes, read only | none |
| `#settings-logins` (owner) | Customer Care login, Google CC accounts, login log | `ccCreate`, `ccPwChange`, `ccToggle`, `ccGAdd`, `ccGToggle` (ccusers) |
| `#staff-payroll` (owner) | salary status per month | `payStatusSet` (payroll.status → paystatus) |

## 8. Edit and delete across the app (`js/entries.js`)

* Whole records: a guarded **Delete** (tap twice) in each record's form. Deleting also removes the accounting entries
  the record created. Blocked when other data depends on it — items with stock movements or in recipes, ledgers with
  entries or built-in ledgers, staff with history (use *Record exit*), disposed assets. Customer Care never deletes
  clients or feedback.
* Entries inside a record — service records, premiums, claims, reward entries, reviews, staff notes, salary revisions —
  have **edit / delete** links; a linked accounting entry follows the new amount and date or is removed.
* Supplier bills: header edit (date, invoice, order, note; voucher and stock receipt follow). Staff KOTs: date, quantity, rate.
