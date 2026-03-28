# ARCHITECTURE_DECISION_LOG.md

## 2026-03-25: POS System Hardening (Iron Gate & R0 Math Engine)

### **Context**
A fatal schema crash was identified where the administrative HUD was sending non-existent columns (specifically `balance_due` and `xmin`) to the Supabase `.update()` API, causing 400 Bad Request errors. Simultaneously, an "R0 Bug" was identified where partial updates would reset financial fields (`player_count`, `duration_hours`) to 0, wiping out booking revenue.

### **Decisions**

#### **1. The Iron Gate Sanitization (Iron Gate Pattern)**
- **Problem**: View-calculated or hallucinated columns (`xmin`, `balance_due`) were being included in the update payload.
- **Solution**: Implemented a strict whitelist of 27 physical database columns (`BOOKING_TABLE_COLUMNS`) in `app/api/bookings/update/route.ts`. 
- **Mechanism**: All incoming payloads are now merged with the `existingRecord` from Supabase and then filtered against the whitelist. Any key not present in the whitelist is stripped before the `update()` call.

#### **2. Deterministic Financial Math (R0 Math Engine)**
- **Problem**: `calculateFinancials` would cast missing or undefined keys to `0`, resulting in a R0 total.
- **Solution**: The `calculateFinancials` engine was hardened to strictly fallback to the `existingRecord` values if a key is missing from the update payload.
- **Mechanism**: Every currency/quantity output is now wrapped in `Math.max(0, ...)` and strictly parses numbers with a default fallback (e.g., `payload.player_count || existingRecord.player_count`).

#### **3. 23P01 (Overlap) Conflict Resolution (Self-Healing Fallback)**
- **Problem**: Concurrent booking updates or ghost records during creation caused 409 Conflict errors.
- **Solution**: Implemented a two-tier resolution strategy in `admin-create/route.ts`.
- **Mechanism**:
  1. Trigger a synchronous `purge_ghost_bookings` RPC.
  2. If the collision persists, the system queries the bay availability across `[1, 2, 3]` and automatically re-assigns the booking to an available slot (**Auto-Bay Allocation**).

#### **4. HUD Clarity (UI Refinement)**
- **Problem**: Managers were confused by showing "Total Price" when extensions were unpaid.
- **Solution**: Standardized session settlement cards to display `amount_due` (labeled as "DUE") as the primary display metric, showing only the unsettled difference to floor managers.

### **Consequences**
- **Pros**: Fatal crashes eliminated. Data persistence guaranteed. Zero-recovery needed for R0 events (Math is self-correcting on save).
- **Cons**: Whitelist requires manual maintenance if database schema columns are added.

---

## 2026-03-20: SAST (+02:00) Timezone Enforcement

### **Context**
Edge computing environments (Cloudflare) use UTC, which caused 2-hour drift in booking times.

### **Decisions**
- **Decision**: Centralized all timestamp generation through the `calculateSASTTimestamps` helper.
- **Mechanism**: Explicitly appends `+02:00` to date-time strings before generating ISO strings.

---

## 2026-03-15: Cloudflare Runtime Optimization

### **Context**
Conflict between `export const runtime = 'edge'` and project-wide Edge Native bundling.

### **Decisions**
- **Decision**: Removed individual route runtime exports to allow standard binary compatibility with the Cloudflare adapter.
- **Impact**: Resolved bundling failures with Supabase SDK.
