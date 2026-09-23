# ADR 003: Offline-First Mobile Architecture with Local SQLite and Riverpod State Management

## Status
Accepted

## Context
Field sales officers frequently visit retail shops in areas with poor or intermittent cellular network connectivity. If the mobile app depended exclusively on direct HTTP requests, officers could not book orders, log visits, or view catalogs when offline.

## Decision
We adopted an **Offline-First Architecture** in Flutter:
1. **Local SQLite Cache (`sqflite`)**: All products, customers, and pending orders are stored locally on the device database (`stockflow_local.db`).
2. **Sync Queue Engine (`SyncProvider` & `OfflineSyncQueues`)**: Orders created offline are stamped with a UUID and queued with status `PendingSync`. When network connectivity resumes, the queue automatically syncs batches to `POST /api/field/sync`.
3. **State Management (`flutter_riverpod`)**: Reactive, immutable state management decoupling UI components from network calls and database access.
4. **Secure Storage (`flutter_secure_storage`)**: JWT tokens, encryption keys, and session metadata are stored in hardware-backed Android Keystore / iOS Keychain.

## Consequences
- **Pros**: Zero disruption for field officers during network dropouts; instant UI responsiveness.
- **Cons**: Requires conflict resolution and synchronization queue tracking logic.
