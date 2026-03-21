# Requirements Document

## Introduction

The Money Management System is a comprehensive personal finance tracking application that enables a single user to manage accounts, transactions, financial goals, personal ledgers, and recurring bills. The system provides a centralized overview of financial health with detailed views for each financial aspect, built on Next.js 14 with Supabase backend and following strict design system guidelines.

## Glossary

- **Money System**: The complete personal finance management application
- **Account**: A financial account (bank, cash, credit card) with a balance and transaction history
- **Transaction**: A financial movement (income, expense, transfer, or provision) associated with an account
- **Goal**: A savings target with progress tracking and provision capability
- **Provision**: A special transaction type that allocates money from an account to a goal
- **Ledger Entry**: A record of money owed to or by another person
- **Bill**: A recurring payment obligation with automatic due date tracking
- **Reminder**: A notification for an upcoming bill or custom event
- **Overview Page**: The main dashboard showing summary statistics and recent activity
- **Supabase Client**: The database connection utility for data operations

## Requirements

### Requirement 1: Account Management

**User Story:** As a user, I want to manage multiple financial accounts, so that I can track balances across different sources.

#### Acceptance Criteria

1. WHEN the user views the overview page THEN the Money System SHALL display all active accounts in a horizontal scrolling row
2. WHEN the user clicks an account card THEN the Money System SHALL filter the transactions section to show only transactions for that account
3. WHEN the user clicks the add account button THEN the Money System SHALL open a dialog to create a new account with name, type, balance, currency, and icon fields
4. WHEN the user submits a new account THEN the Money System SHALL persist the account to the accounts table and display it in the accounts row
5. WHEN an account card is displayed THEN the Money System SHALL show the account name, type badge, balance in Geist Mono font, and currency

### Requirement 2: Transaction Tracking

**User Story:** As a user, I want to record and view all financial transactions, so that I can understand my spending and income patterns.

#### Acceptance Criteria

1. WHEN the user views the overview page THEN the Money System SHALL display the 10 most recent transactions across all accounts
2. WHEN the user navigates to the transactions page THEN the Money System SHALL display all transactions sorted by date descending
3. WHEN the user adds a transaction THEN the Money System SHALL update the associated account balance accordingly
4. WHEN the user filters transactions by type THEN the Money System SHALL display only transactions matching the selected type (income, expense, transfer, or provision)
5. WHEN a transaction is displayed THEN the Money System SHALL show description, amount in Geist Mono with color coding by type, category, date, and account name

### Requirement 3: Financial Summary Statistics

**User Story:** As a user, I want to see summary statistics of my finances, so that I can quickly understand my financial position.

#### Acceptance Criteria

1. WHEN the user views the overview page THEN the Money System SHALL display total income for the current month
2. WHEN the user views the overview page THEN the Money System SHALL display total expenses for the current month
3. WHEN the user views the overview page THEN the Money System SHALL display net amount (income minus expenses) for the current month
4. WHEN displaying positive amounts THEN the Money System SHALL use the success color from the design system
5. WHEN displaying negative amounts THEN the Money System SHALL use the danger color from the design system

### Requirement 4: Goal Management and Provisioning

**User Story:** As a user, I want to set savings goals and allocate money toward them, so that I can track progress toward financial objectives.

#### Acceptance Criteria

1. WHEN the user views the goals page THEN the Money System SHALL display all goals with their progress, saved amount, target amount, and target date
2. WHEN the user creates a goal THEN the Money System SHALL persist it to the goals table with status set to active
3. WHEN the user provisions money to a goal THEN the Money System SHALL create a provision transaction, deduct from the source account, and increment the goal saved amount
4. WHEN a goal card is displayed THEN the Money System SHALL show a progress bar calculated as saved amount divided by target amount
5. WHEN the user marks a goal as complete THEN the Money System SHALL update the goal status to completed

### Requirement 5: Personal Ledger Tracking

**User Story:** As a user, I want to track money I owe and money owed to me, so that I can manage personal debts and loans.

#### Acceptance Criteria

1. WHEN the user views the ledger page THEN the Money System SHALL display two sections: entries where direction equals i_owe and entries where direction equals they_owe
2. WHEN the user adds a ledger entry THEN the Money System SHALL persist it with person name, amount, direction, description, due date, and status set to pending
3. WHEN the user settles a ledger entry THEN the Money System SHALL update the status to settled
4. WHEN displaying ledger entries THEN the Money System SHALL show person name, description, amount in Geist Mono, and due date if set
5. WHEN the user views settled entries THEN the Money System SHALL display them in a collapsed accordion section

### Requirement 6: Bill Management and Reminders

**User Story:** As a user, I want to track recurring bills and set reminders, so that I never miss a payment.

#### Acceptance Criteria

1. WHEN the user views the bills page THEN the Money System SHALL display all active bills sorted by next due date ascending
2. WHEN the user marks a bill as paid THEN the Money System SHALL advance the next due date based on the bill frequency (monthly adds 1 month, weekly adds 7 days, yearly adds 1 year, once sets is_active to false)
3. WHEN a bill is due within 3 days or overdue THEN the Money System SHALL display the due date in danger color
4. WHEN the user views the overview page THEN the Money System SHALL display upcoming bills where next due date is within 14 days
5. WHEN the user creates a reminder THEN the Money System SHALL persist it with title, note, remind date, and optional bill association

### Requirement 7: Navigation and Layout Structure

**User Story:** As a user, I want to navigate between different financial views, so that I can access specific information quickly.

#### Acceptance Criteria

1. WHEN the user is in the money section THEN the Money System SHALL display a horizontal tab bar with Overview, Transactions, Goals, Ledger, and Bills tabs
2. WHEN the user clicks a tab THEN the Money System SHALL navigate to the corresponding page
3. WHEN a tab is active THEN the Money System SHALL display an accent color underline below the tab text
4. WHEN viewing on mobile THEN the Money System SHALL allow horizontal scrolling of tabs without wrapping
5. WHEN the user views any money page THEN the Money System SHALL display the tab bar below the page header and above the content

### Requirement 8: Data Persistence and Type Safety

**User Story:** As a developer, I want all data operations to be type-safe and properly persisted, so that the application is reliable and maintainable.

#### Acceptance Criteria

1. WHEN any data operation is performed THEN the Money System SHALL use the Supabase client from lib/supabase/client.ts for client components or lib/supabase/server.ts for server components
2. WHEN any data structure is defined THEN the Money System SHALL use types from lib/types/index.ts without using any type
3. WHEN a transaction is created THEN the Money System SHALL update the associated account balance in the same operation
4. WHEN a provision transaction is created THEN the Money System SHALL update both the account balance and the goal saved amount atomically
5. WHEN data is fetched from the database THEN the Money System SHALL return properly typed results matching the database schema

### Requirement 9: Design System Compliance

**User Story:** As a user, I want the money section to follow the established design system, so that the interface is consistent and visually cohesive.

#### Acceptance Criteria

1. WHEN any page in the money section is rendered THEN the Money System SHALL use background color #FCF9F5
2. WHEN displaying any amount or date THEN the Money System SHALL use Geist Mono font
3. WHEN displaying any text THEN the Money System SHALL use Geist font family
4. WHEN using colors THEN the Money System SHALL reference CSS variables from the design system and never hardcode hex values
5. WHEN displaying cards THEN the Money System SHALL use white background, 1px border with --border color, and rounded-lg radius

### Requirement 10: Empty States and Error Handling

**User Story:** As a user, I want clear feedback when sections are empty or errors occur, so that I understand the system state.

#### Acceptance Criteria

1. WHEN a section has no data THEN the Money System SHALL display a simple two-line empty state with descriptive text and an action button
2. WHEN a dialog form submission fails THEN the Money System SHALL display a toast notification with the error message
3. WHEN a dialog form submission succeeds THEN the Money System SHALL close the dialog and update the UI optimistically or refetch data
4. WHEN displaying empty states THEN the Money System SHALL not include illustrations or decorative elements
5. WHEN an error occurs during data fetching THEN the Money System SHALL display an appropriate error message to the user
