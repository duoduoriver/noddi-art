# ADR 0001: Use two credit wallets with an immutable ledger

## Status
Accepted

## Context
Subscription allowances expire while purchased packs do not. A refunded pack can have already been spent, so simply making a balance negative would blur paid eligibility and make future grants ambiguous.

## Decision
Each user has Plan Credits, Purchased Credits, and a separate Refund Debt balance. Every mutation is represented by an immutable ledger operation with an idempotency key. Generation consumes Plan Credits first. Pack or administrator permanent grants first settle Refund Debt; subscription grants never do. A debt freezes high-value work and exports until it reaches zero.

## Consequences
Balances are materialized for fast checks but the ledger is the audit record. Refunds can be replayed safely and an administrator can explicitly waive a debt with an audit action.
