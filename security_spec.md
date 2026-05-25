# Security Specification - E. Moments

## Data Invariants
1. A wedding can only be created by an authenticated user.
2. Only the owner of a wedding can update its metadata or delete it.
3. Photos must belong to a valid wedding.
4. Only the owner of a wedding can delete photos from that wedding's gallery.
5. User profiles are private; only the owner can read or write their own profile.
6. All timestamps must be server-generated.

## The "Dirty Dozen" Payloads (Anti-Patterns to Reject)

1. **Identity Spoofing**: Attempting to create a wedding with someone else's `ownerId`.
2. **Ghost Field Injection**: Adding `isVerified: true` to a wedding document.
3. **ID Poisoning**: Using a 2KB string as a wedding ID.
4. **Orphaned Photo**: Creating a photo document for a wedding that doesn't exist.
5. **Unauthorized Multi-Delete**: Attempting to delete a wedding you don't own.
6. **Profile Takeover**: Writing to a `profiles/{userId}` document where `userId` != `request.auth.uid`.
7. **Timestamp Fraud**: Providing a manual `createdAt` string instead of `request.time`.
8. **Resource Exhaustion**: Sending a 1MB string in the `weddingName` field.
9. **Relational Bypass**: Adding a photo to a wedding the user doesn't own (depending on app logic, but here only owners/authorized should upload? Actually, usually guests can upload in such apps. Let's check `App.tsx`).
10. **State Skipping**: Manually setting a status field if one existed (e.g. `paymentStatus`).
11. **PII Leak**: Reading all profiles as an authenticated user.
12. **Update Gap**: Updating the `ownerId` of an existing wedding.

## Red Team Conflict Report

| Vulnerability | Status | Mitigation |
| :--- | :--- | :--- |
| Identity Spoofing | SECURED | `isValidWedding` checks `data.ownerId == request.auth.uid`. |
| ID Poisoning | SECURED | `isValidId()` applied to all doc path variables. |
| Resource Poisoning | SECURED | `.size()` checks on all string fields. |
| PII Leak | SECURED | `/profiles/{userId}` restricted to owner. |
| System Field Update | SECURED | `.diff().affectedKeys().hasOnly()` used in updates. |
