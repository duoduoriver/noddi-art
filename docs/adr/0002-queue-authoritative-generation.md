# ADR 0002: Make the Queue consumer authoritative for charge and provider execution

## Status
Accepted

## Context
The HTTP request that creates a generation cannot atomically enqueue a message, charge credits, and call an image provider. Image gateways can time out after accepting work and may have incompatible idempotency behavior.

## Decision
The request creates one idempotent Generation Job and enqueues only its ID. The Queue consumer conditionally debits credits, reserves a conservative monthly budget for every provider attempt, checkpoints raw output in private R2, and records each primary or fallback attempt. Primary is tried first; only transient and compatibility failures qualify for fallback.

## Consequences
A crash after a provider call can incur a separately budgeted retry. This intentionally favors a hard budget cap and a recoverable ledger over optimistic accounting.
