# Implementation Plan

- [ ] 1. Set up types and data layer

  - [x] 1.1 Extend lib/types/index.ts with money-specific utility types



    - Add `NewAccount`, `NewTransaction`, `NewGoal`, `NewLedgerEntry`, `NewBill`, `NewReminder` insert types
    - Add `TransactionFilters` type
    - Add `BillFrequency` type
    - _Requirements: 8.2_


  - [x] 1.2 Implement lib/actions/money.ts — accounts and transactions

    - Implement `getAccounts()`, `addAccount()`, `updateAccountBalance()`
    - Implement `getTransactions(filters?)`, `addTransaction()` (with balance update), `deleteTransaction()` (with balance revert)
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 8.1, 8.3_

  - [ ]* 1.3 Write property test: Transaction filter correctness (Property 1)
    - **Property 1: Transaction filter correctness**
    - **Validates: Requirements 1.2**

  - [ ]* 1.4 Write property test: Account round-trip persistence (Property 2)
    - **Property 2: Account round-trip persistence**
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 1.5 Write property test: Transaction sort order (Property 3)
    - **Property 3: Transaction sort order**
    - **Validates: Requirements 2.2**

  - [ ]* 1.6 Write property test: Transaction balance update (Property 4)
    - **Property 4: Transaction balance update**
    - **Validates: Requirements 2.3**

  - [ ]* 1.7 Write property test: Transaction type filter correctness (Property 5)
    - **Property 5: Transaction type filter correctness**
    - **Validates: Requirements 2.4**

  - [ ]* 1.8 Write property test: Monthly summary correctness (Property 6)
    - **Property 6: Monthly summary correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3**


  - [x] 1.9 Implement lib/actions/money.ts — goals, ledger, bills, reminders



    - Implement `getGoals()`, `addGoal()`, `provisionToGoal()`, `updateGoalStatus()`, `deleteGoal()`
    - Implement `getLedger()`, `addLedgerEntry()`, `settleLedgerEntry()`, `deleteLedgerEntry()`
    - Implement `getBills()`, `addBill()`, `markBillPaid()`, `toggleBillActive()`
    - Implement `getReminders()`, `addReminder()`, `markReminderDone()`
    - _Requirements: 4.2, 4.3, 4.5, 5.2, 5.3, 6.2, 6.5, 8.4_

  - [ ]* 1.10 Write property test: Goal creation round-trip (Property 7)
    - **Property 7: Goal creation round-trip**
    - **Validates: Requirements 4.2**

  - [ ]* 1.11 Write property test: Provision invariant (Property 8)
    - **Property 8: Provision invariant**
    - **Validates: Requirements 4.3**

  - [ ]* 1.12 Write property test: Ledger round-trip and state transitions (Property 10)
    - **Property 10: Ledger round-trip and state transitions**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 1.13 Write property test: Bill sort order (Property 11)
    - **Property 11: Bill sort order**
    - **Validates: Requirements 6.1**

  - [ ]* 1.14 Write property test: Mark bill paid advances due date correctly (Property 12)
    - **Property 12: Mark bill paid advances due date correctly**
    - **Validates: Requirements 6.2**

  - [ ]* 1.15 Write property test: Upcoming bills filter (Property 13)
    - **Property 13: Upcoming bills filter**
    - **Validates: Requirements 6.4**

  - [ ]* 1.16 Write property test: Reminder round-trip (Property 14)
    - **Property 14: Reminder round-trip**
    - **Validates: Requirements 6.5**

- [ ] 2. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 3. Money section layout and navigation


  - [x] 3.1 Create app/money/layout.tsx with horizontal tab bar

    - Tabs: Overview, Transactions, Goals, Ledger, Bills
    - Active tab: accent color underline (not filled pill)
    - Mobile: overflow-x-auto, no wrapping
    - Tab bar sits below page header, above content
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [-] 4. Account components and overview skeleton

  - [x] 4.1 Create components/money/account-card.tsx

    - Props: `account: Account`, `onSelect?: () => void`, `isSelected?: boolean`
    - Display: name, type badge, balance (Geist Mono), currency
    - Hover and selected states per design system
    - _Requirements: 1.1, 1.5, 9.1, 9.2_

  - [ ]* 4.2 Write property test: Goal progress calculation (Property 9)
    - **Property 9: Goal progress calculation**
    - **Validates: Requirements 4.4**


  - [x] 4.3 Create components/money/add-account-dialog.tsx

    - Fields: name, type (select), balance (number), currency (select), icon (text)
    - Submit calls `addAccount()`, closes dialog, refreshes data
    - Error toast on failure
    - _Requirements: 1.3, 1.4, 10.2, 10.3_


  - [x] 4.4 Create app/money/page.tsx — accounts row and summary bar sections

    - Accounts: horizontal scroll on mobile, grid on desktop, "+" button at end
    - Clicking account card filters transactions below
    - Summary bar: Total In, Total Out, Net for current month
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 9.1_


- [ ] 5. Transaction components
  - [x] 5.1 Create components/money/transaction-row.tsx


    - Left: colored type dot, description, category tag, date
    - Right: amount (Geist Mono, colored by type), account name in small text
    - Color: income=success, expense=danger, transfer=neutral, provision=accent
    - _Requirements: 2.5, 9.2, 9.4_

  - [x] 5.2 Create components/money/add-transaction-dialog.tsx


    - Fields: description, amount, type (select), category, account (select), date, goal (select, shown when type=provision)
    - Submit calls `addTransaction()`, closes dialog, refreshes
    - _Requirements: 2.3, 10.2, 10.3_

  - [x] 5.3 Complete app/money/page.tsx — recent transactions section


    - Last 10 transactions (filtered by selected account if any)
    - "View all →" link to /money/transactions
    - Empty state if no transactions
    - _Requirements: 2.1, 10.1_

  - [x] 5.4 Create app/money/transactions/page.tsx


    - Full list, newest first, grouped by date (Today / Yesterday / "12 Mar")
    - Filter bar: All | Income | Expense | Transfer | Provision + account selector
    - "Add transaction" button top-right
    - Empty state
    - _Requirements: 2.2, 2.4, 10.1_

- [x] 6. Goals components


  - [x] 6.1 Create components/money/goal-card.tsx

    - Display: icon, name, status badge, progress bar, "₹X of ₹Y", target date
    - Progress bar: 6px height, accent fill, computed as saved/target
    - Actions: "Add money" button, "..." menu (edit, mark complete, delete)


    - _Requirements: 4.1, 4.4, 9.2_

  - [x] 6.2 Create components/money/add-goal-dialog.tsx

    - Fields: name, target_amount, icon, account (select), target_date (optional)

    - Submit calls `addGoal()` with status=active
    - _Requirements: 4.2, 10.2, 10.3_


  - [ ] 6.3 Create components/money/provision-dialog.tsx
    - Fields: amount, source account (select)
    - Submit calls `provisionToGoal()`, updates both account balance and goal saved_amount
    - _Requirements: 4.3, 10.2, 10.3_



  - [x] 6.4 Complete app/money/page.tsx — goals snapshot section


    - Up to 3 active goals as cards
    - "View all →" link to /money/goals
    - "+" to add goal
    - _Requirements: 4.1_




  - [ ] 6.5 Create app/money/goals/page.tsx
    - Grid: 2 col mobile, 3 col desktop
    - All goals with goal-card components


    - "Add goal" button top-right
    - Empty state
    - _Requirements: 4.1, 4.2, 4.5, 10.1_


- [ ] 7. Ledger components
  - [ ] 7.1 Create components/money/ledger-row.tsx
    - Display: person name (bold), description (muted), amount (Geist Mono), due date
    - "Settle" button for pending entries
    - _Requirements: 5.4, 9.2_



  - [ ] 7.2 Create components/money/add-ledger-dialog.tsx
    - Fields: person name, amount, direction toggle (I owe / They owe), description, due date (optional)
    - Submit calls `addLedgerEntry()` with status=pending
    - _Requirements: 5.2, 10.2, 10.3_


  - [ ] 7.3 Complete app/money/page.tsx — ledger snapshot section
    - "I owe" sub-section: up to 3 pending i_owe entries
    - "They owe me" sub-section: up to 3 pending they_owe entries
    - "View all →" link to /money/ledger
    - _Requirements: 5.1_

  - [x] 7.4 Create app/money/ledger/page.tsx

    - Two sections: "I owe" (left/top) and "They owe me" (right/bottom)
    - Settled entries in collapsed accordion at bottom
    - "Add entry" button top-right
    - Empty state per section
    - _Requirements: 5.1, 5.3, 5.5, 10.1_

- [-] 8. Bills and reminders components

  - [x] 8.1 Create components/money/bill-row.tsx

    - Display: name, category tag, frequency badge, account name, due date (red if overdue/within 3 days), amount
    - "..." menu: edit, mark paid, deactivate
    - _Requirements: 6.1, 6.3, 9.2_


  - [x] 8.2 Create components/money/add-bill-dialog.tsx

    - Fields: name, amount, frequency (select), next_due_date, account (select), category, auto_pay (checkbox)
    - Submit calls `addBill()`
    - _Requirements: 6.1, 10.2, 10.3_

  - [x] 8.3 Create components/money/reminder-row.tsx


    - Display: title, linked bill name (if bill_id set), remind_on date
    - Checkbox to mark done (calls `markReminderDone()`)
    - _Requirements: 6.5_


  - [ ] 8.4 Complete app/money/page.tsx — upcoming bills section
    - Bills with next_due_date within 14 days, sorted by date
    - Overdue bills show due date in danger color
    - _Requirements: 6.4_


  - [x] 8.5 Create app/money/bills/page.tsx

    - Active bills sorted by next_due_date ascending
    - bill-row components with mark paid / deactivate actions
    - Reminders subsection below: upcoming undone reminders sorted by date
    - "Add bill" and "Add reminder" buttons
    - Empty states
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 10.1_

- [ ] 9. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.
