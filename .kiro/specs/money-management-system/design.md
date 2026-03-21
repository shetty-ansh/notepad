# Design Document: Money Management System

## Overview

The Money Management System is a comprehensive personal finance application built with Next.js 14 App Router, Supabase, and shadcn/ui components. The system provides a single-user interface for managing financial accounts, tracking transactions, setting savings goals, managing personal ledgers, and tracking recurring bills.

The architecture follows a clear separation between data operations (server-side Supabase queries), UI components (client-side React components), and page layouts (server components for initial data fetching). All styling strictly adheres to the design system defined in design.md at the project root.

## Architecture

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui with Tailwind CSS
- **Type System**: TypeScript with strict mode
- **Fonts**: Geist (UI text) and Geist Mono (amounts, dates)

### Directory Structure

```
app/
  money/
    layout.tsx                 # Tab navigation wrapper
    page.tsx                   # Overview dashboard (server component)
    transactions/
      page.tsx                 # Full transaction list
    goals/
      page.tsx                 # Goals grid view
    ledger/
      page.tsx                 # Ledger tracking
    bills/
      page.tsx                 # Bills and reminders

components/
  money/
    account-card.tsx           # Account display card
    add-account-dialog.tsx     # Account creation form
    transaction-row.tsx        # Transaction list item
    add-transaction-dialog.tsx # Transaction creation form
    goal-card.tsx              # Goal progress card
    add-goal-dialog.tsx        # Goal creation form
    provision-dialog.tsx       # Goal funding form
    ledger-row.tsx             # Ledger entry item
    add-ledger-dialog.tsx      # Ledger entry form
    bill-row.tsx               # Bill list item
    add-bill-dialog.tsx        # Bill creation form
    reminder-row.tsx           # Reminder list item

lib/
  actions/
    money.ts                   # All Supabase data operations
  types/
    index.ts                   # Shared type definitions
  supabase/
    client.ts                  # Client-side Supabase instance
    server.ts                  # Server-side Supabase instance
```

### Data Flow

1. **Server Components** (pages) fetch initial data using `lib/supabase/server.ts`
2. **Client Components** (dialogs, interactive elements) use `lib/supabase/client.ts`
3. **Data Actions** in `lib/actions/money.ts` encapsulate all database operations
4. **Type Safety** enforced through types from `lib/types/index.ts`
5. **Optimistic Updates** applied in client components, with revalidation on success

## Components and Interfaces

### Data Layer (lib/actions/money.ts)

All database operations are centralized in this module. Each function is async and returns typed results.

**Account Operations:**
- `getAccounts(): Promise<Account[]>` - Fetch all accounts
- `addAccount(data: NewAccount): Promise<Account>` - Create new account
- `updateAccountBalance(id: string, newBalance: number): Promise<void>` - Update balance

**Transaction Operations:**
- `getTransactions(filters?: TransactionFilters): Promise<Transaction[]>` - Fetch transactions with optional filtering
- `addTransaction(data: NewTransaction): Promise<Transaction>` - Create transaction and update account balance
- `deleteTransaction(id: string): Promise<void>` - Remove transaction and revert balance

**Goal Operations:**
- `getGoals(): Promise<Goal[]>` - Fetch all goals
- `addGoal(data: NewGoal): Promise<Goal>` - Create new goal
- `provisionToGoal(goalId: string, amount: number, accountId: string): Promise<void>` - Create provision transaction and update goal
- `updateGoalStatus(id: string, status: GoalStatus): Promise<void>` - Change goal status
- `deleteGoal(id: string): Promise<void>` - Remove goal

**Ledger Operations:**
- `getLedger(): Promise<LedgerEntry[]>` - Fetch all ledger entries
- `addLedgerEntry(data: NewLedgerEntry): Promise<LedgerEntry>` - Create entry
- `settleLedgerEntry(id: string): Promise<void>` - Mark as settled
- `deleteLedgerEntry(id: string): Promise<void>` - Remove entry

**Bill Operations:**
- `getBills(): Promise<Bill[]>` - Fetch all bills
- `addBill(data: NewBill): Promise<Bill>` - Create new bill
- `markBillPaid(id: string): Promise<void>` - Advance due date based on frequency
- `toggleBillActive(id: string, isActive: boolean): Promise<void>` - Activate/deactivate bill

**Reminder Operations:**
- `getReminders(): Promise<Reminder[]>` - Fetch all reminders
- `addReminder(data: NewReminder): Promise<Reminder>` - Create reminder
- `markReminderDone(id: string): Promise<void>` - Mark as complete

### UI Components

**Account Card** (`account-card.tsx`)
- Props: `account: Account`, `onSelect?: () => void`, `isSelected?: boolean`
- Displays: name, type badge, balance (Geist Mono), currency
- Interactive: clickable to filter transactions
- Styling: white card with border, hover state

**Transaction Row** (`transaction-row.tsx`)
- Props: `transaction: Transaction`
- Layout: description + category/date on left, amount + account on right
- Color coding: income (green), expense (red), transfer (neutral), provision (accent)
- Grouping: parent component handles date grouping

**Goal Card** (`goal-card.tsx`)
- Props: `goal: Goal`, `onProvision: () => void`
- Displays: icon, name, status badge, progress bar, amounts, target date
- Actions: "Add money" button, menu for edit/complete/delete
- Progress bar: thin (6px), accent color fill

**Ledger Row** (`ledger-row.tsx`)
- Props: `entry: LedgerEntry`, `onSettle: () => void`
- Layout: person name (bold), description (muted), amount, due date
- Action: "Settle" button for pending entries
- Styling: border-bottom, hover background

**Bill Row** (`bill-row.tsx`)
- Props: `bill: Bill`, `onMarkPaid: () => void`
- Displays: name, category, frequency badge, account, due date, amount
- Due date coloring: red if overdue or within 3 days
- Actions: menu for edit/mark paid/deactivate

### Dialog Components

All dialogs follow the same structure:
- `DialogHeader` with title and optional description
- Form fields with labels above inputs
- `DialogFooter` with Cancel (ghost) and Submit (accent) buttons
- Form validation before submission
- Toast notification on error
- Close and refresh on success

**Form Field Types:**
- Text inputs: `type="text"`, background-subtle
- Number inputs: `type="number"`, `step="0.01"`, `min="0"`
- Date inputs: `type="date"`
- Dropdowns: shadcn Select component
- Toggle: for ledger direction (I owe / They owe)

## Data Models

### Database Schema

**accounts**
```typescript
{
  id: string (uuid, primary key)
  name: string
  type: string (e.g., "savings", "checking", "credit")
  balance: number
  currency: string (e.g., "INR", "USD")
  icon: string (emoji or icon identifier)
  is_active: boolean
  created_at: timestamp
}
```

**transactions**
```typescript
{
  id: string (uuid, primary key)
  account_id: string (foreign key → accounts.id)
  goal_id: string | null (foreign key → goals.id, for provisions)
  amount: number
  type: 'income' | 'expense' | 'transfer' | 'provision'
  category: string
  description: string
  txn_date: date
  created_at: timestamp
}
```

**goals**
```typescript
{
  id: string (uuid, primary key)
  account_id: string | null (foreign key → accounts.id)
  name: string
  target_amount: number
  saved_amount: number
  target_date: date | null
  icon: string
  status: 'active' | 'completed' | 'paused'
  created_at: timestamp
}
```

**ledger**
```typescript
{
  id: string (uuid, primary key)
  person_name: string
  amount: number
  direction: 'i_owe' | 'they_owe'
  description: string
  due_date: date | null
  status: 'pending' | 'settled'
  created_at: timestamp
}
```

**bills**
```typescript
{
  id: string (uuid, primary key)
  account_id: string (foreign key → accounts.id)
  name: string
  amount: number
  frequency: 'monthly' | 'weekly' | 'yearly' | 'once'
  next_due_date: date
  auto_pay: boolean
  category: string
  is_active: boolean
  created_at: timestamp
}
```

**reminders**
```typescript
{
  id: string (uuid, primary key)
  bill_id: string | null (foreign key → bills.id)
  title: string
  note: string
  remind_on: date
  is_done: boolean
  created_at: timestamp
}
```

### Type Definitions

All types are defined in `lib/types/index.ts` and match the database schema. Additional utility types:

```typescript
type TransactionFilters = {
  accountId?: string
  type?: 'income' | 'expense' | 'transfer' | 'provision'
}

type NewAccount = Omit<Account, 'id' | 'created_at'>
type NewTransaction = Omit<Transaction, 'id' | 'created_at'>
type NewGoal = Omit<Goal, 'id' | 'created_at' | 'saved_amount'>
type NewLedgerEntry = Omit<LedgerEntry, 'id' | 'created_at'>
type NewBill = Omit<Bill, 'id' | 'created_at'>
type NewReminder = Omit<Reminder, 'id' | 'created_at'>

type GoalStatus = 'active' | 'completed' | 'paused'
type LedgerDirection = 'i_owe' | 'they_owe'
type LedgerStatus = 'pending' | 'settled'
type BillFrequency = 'monthly' | 'weekly' | 'yearly' | 'once'
type TransactionType = 'income' | 'expense' | 'transfer' | 'provision'
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

**Property 1: Transaction filter correctness**
*For any* set of transactions and any account ID filter, all transactions returned by `getTransactions({ accountId })` should have an `account_id` equal to the provided filter value.
**Validates: Requirements 1.2**

---

**Property 2: Account round-trip persistence**
*For any* valid new account object, after calling `addAccount(data)` and then `getAccounts()`, the returned list should contain an account with matching name, type, balance, currency, and icon.
**Validates: Requirements 1.4, 1.5**

---

**Property 3: Transaction sort order**
*For any* set of transactions returned by `getTransactions()`, each transaction's `txn_date` should be greater than or equal to the `txn_date` of the next transaction in the list (newest first).
**Validates: Requirements 2.2**

---

**Property 4: Transaction balance update**
*For any* account with a known balance, adding an income transaction of amount X should result in the account balance increasing by X; adding an expense transaction of amount X should result in the account balance decreasing by X.
**Validates: Requirements 2.3**

---

**Property 5: Transaction type filter correctness**
*For any* transaction type filter value and any dataset, all transactions returned by `getTransactions({ type })` should have a `type` field equal to the filter value.
**Validates: Requirements 2.4**

---

**Property 6: Monthly summary correctness**
*For any* set of transactions, the computed monthly summary should satisfy: `totalIn` equals the sum of all income transaction amounts in the current month, `totalOut` equals the sum of all expense transaction amounts in the current month, and `net` equals `totalIn - totalOut`.
**Validates: Requirements 3.1, 3.2, 3.3**

---

**Property 7: Goal creation round-trip**
*For any* valid new goal object, after calling `addGoal(data)` and then `getGoals()`, the returned list should contain a goal with matching name, target_amount, and status equal to `'active'`.
**Validates: Requirements 4.2**

---

**Property 8: Provision invariant**
*For any* goal with `saved_amount` S and any account with `balance` B, after calling `provisionToGoal(goalId, amount, accountId)`, the goal's `saved_amount` should equal `S + amount` and the account's `balance` should equal `B - amount`.
**Validates: Requirements 4.3**

---

**Property 9: Goal progress calculation**
*For any* goal where `target_amount > 0`, the progress percentage displayed should equal `(saved_amount / target_amount) * 100`, clamped to the range [0, 100].
**Validates: Requirements 4.4**

---

**Property 10: Ledger round-trip and state transitions**
*For any* valid new ledger entry, after calling `addLedgerEntry(data)`, the entry should appear in `getLedger()` with `status = 'pending'`. After calling `settleLedgerEntry(id)`, the same entry should have `status = 'settled'`. All entries with `direction = 'i_owe'` should be distinct from entries with `direction = 'they_owe'`.
**Validates: Requirements 5.1, 5.2, 5.3**

---

**Property 11: Bill sort order**
*For any* set of active bills returned by `getBills()`, each bill's `next_due_date` should be less than or equal to the `next_due_date` of the next bill in the list (ascending order).
**Validates: Requirements 6.1**

---

**Property 12: Mark bill paid advances due date correctly**
*For any* bill with a given `next_due_date` and `frequency`, after calling `markBillPaid(id)`:
- `monthly` → new `next_due_date` equals old date + 1 month
- `weekly` → new `next_due_date` equals old date + 7 days
- `yearly` → new `next_due_date` equals old date + 1 year
- `once` → `is_active` is set to `false`
**Validates: Requirements 6.2**

---

**Property 13: Upcoming bills filter**
*For any* set of bills, the bills displayed on the overview should only include bills where `next_due_date` is within 14 days from today (i.e., `next_due_date <= today + 14 days`).
**Validates: Requirements 6.4**

---

**Property 14: Reminder round-trip**
*For any* valid new reminder, after calling `addReminder(data)` and then `getReminders()`, the returned list should contain a reminder with matching title, note, remind_on date, and optional bill_id.
**Validates: Requirements 6.5**

---

## Error Handling

### Data Layer Errors

All functions in `lib/actions/money.ts` should handle Supabase errors gracefully:

```typescript
const { data, error } = await supabase.from('accounts').select('*')
if (error) throw new Error(error.message)
return data
```

Errors propagate to the calling component, which displays a toast notification.

### Client Component Error Handling

```typescript
try {
  await addTransaction(formData)
  toast.success('Transaction added')
  onClose()
  router.refresh()
} catch (err) {
  toast.error(err instanceof Error ? err.message : 'Something went wrong')
}
```

### Balance Consistency

`addTransaction` and `deleteTransaction` must update account balance atomically with the transaction record. If either operation fails, neither should persist (use Supabase RPC or sequential operations with rollback logic).

### Provision Atomicity

`provisionToGoal` must:
1. Insert a provision transaction
2. Decrement account balance
3. Increment goal saved_amount

If any step fails, the error is surfaced to the user via toast.

---

## Testing Strategy

### Property-Based Testing Library

**Library**: `fast-check` (TypeScript-native, works in Jest/Vitest)

Install: `npm install --save-dev fast-check`

Each property-based test runs a minimum of **100 iterations** with randomly generated inputs.

### Dual Testing Approach

**Unit tests** verify specific examples and edge cases:
- Empty account list renders empty state
- Transaction with zero amount is rejected
- Bill with `once` frequency is deactivated after mark paid
- Ledger entry with no due date renders correctly

**Property-based tests** verify universal properties across all inputs:
- Every property listed in the Correctness Properties section above is implemented as a single property-based test
- Each test is tagged with the property it validates

### Property-Based Test Annotation Format

Every property-based test must include this comment:

```typescript
// **Feature: money-management-system, Property {N}: {property_text}**
// **Validates: Requirements {X.Y}**
```

### Test File Structure

```
lib/actions/__tests__/
  money.test.ts          # Unit + property tests for data layer functions

components/money/__tests__/
  account-card.test.tsx
  transaction-row.test.tsx
  goal-card.test.tsx
  ledger-row.test.tsx
  bill-row.test.tsx
```

### Test Generators (fast-check arbitraries)

```typescript
const arbAccount = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  type: fc.constantFrom('savings', 'checking', 'credit', 'cash'),
  balance: fc.float({ min: 0, max: 1_000_000 }),
  currency: fc.constantFrom('INR', 'USD', 'EUR'),
  icon: fc.string(),
  is_active: fc.boolean(),
})

const arbTransaction = fc.record({
  id: fc.uuid(),
  account_id: fc.uuid(),
  goal_id: fc.option(fc.uuid()),
  amount: fc.float({ min: 0.01, max: 100_000 }),
  type: fc.constantFrom('income', 'expense', 'transfer', 'provision'),
  category: fc.string({ minLength: 1 }),
  description: fc.string({ minLength: 1 }),
  txn_date: fc.date().map(d => d.toISOString().split('T')[0]),
})
```

### Checkpoint Strategy

Tests are run at two checkpoints:
1. After the data layer is complete (actions/money.ts)
2. After all components and pages are complete