# ADR 0003: Treat Waffo events as idempotent credit facts and retain anonymized finance records

## Status
Accepted

## Context
Subscription activation and successful-payment events can arrive more than once or out of order. Financial records require retention after account deletion, while creative assets must be deleted promptly.

## Decision
Waffo webhook events are deduplicated by event ID and subscription grants by order and period. The code-owned product catalog is the payment fact source. Before account deletion, payment, ledger, webhook, and administrative records are converted to an irreversible subject hash and retained for seven years; creative data and private objects are deleted.

## Consequences
Product changes require a code and hosted-product change together. Retention policy remains subject to legal review before production launch.
