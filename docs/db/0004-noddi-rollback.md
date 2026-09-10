# Migration 0004 rollback notes

`0004_amused_famine.sql` creates noddi accounting, project, generation, asset, export, and operations tables, then rebuilds `payment` to make `user_id` nullable and add anonymous-retention fields.

## Forward migration

The payment rebuild explicitly projects `NULL` for the two new columns so existing D1 rows remain readable. It is an expand/migrate/contract change: deploy code that tolerates null `user_id` before deleting accounts or anonymizing payments.

## Rollback

Do not run a destructive down migration automatically. If rollback is required before production use, stop new payments and jobs, export the new tables for audit, and rebuild `payment` back to a non-null `user_id` only after proving no anonymized rows exist. New noddi tables can then be dropped in reverse dependency order: download events → exports/generated assets/attempts/jobs/versions → projects → ledger/accounts/usage/budgets/webhooks/settings → admin records.
