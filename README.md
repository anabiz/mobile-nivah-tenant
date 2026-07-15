# Nivah Properties — Tenant & Technician Mobile App

Expo (managed) + TypeScript + expo-router + NativeWind, talking to the same backend as
`fe-nivah-tenant-web` (`be-nivah-properties`). Covers the Tenant role (Dashboard, My Leases, My
Requests) and the Technician role (My Jobs) — the same two roles that app serves, not the admin
staff portal and not the separate Contractor/vendor-portal RFQ flow.

## Setup

```bash
pnpm install --node-linker=hoisted
```

**Use `--node-linker=hoisted` on the very first install.** pnpm's default "isolated"
`node_modules` layout (packages symlinked out of a central `.pnpm` store) breaks Metro's module
resolution for packages that resolve their own dependencies via subpath exports — concretely,
`nativewind` fails to resolve `react-native-css-interop/jsx-runtime` and every screen throws on
bundle. The project's `.npmrc` also sets `node-linker=hoisted`, but in practice `pnpm install`
without the explicit flag did not reliably apply it (a corepack/pnpm quirk on this setup) — the
CLI flag is what actually works. Once applied on a fresh `node_modules`, subsequent plain
`pnpm install` runs preserve the hoisted layout correctly.

Copy `.env.example` to `.env` and point `EXPO_PUBLIC_API_BASE_URL` at your backend.

## Run

```bash
npx expo start          # then press `i`/`a`/`w`, or scan the QR code with Expo Go
```

## Structure

- `src/app/(auth)/login.tsx` — password login (with 2FA-OTP follow-up) and standalone OTP login,
  against the same `/api/v1/auths/*` endpoints as the web app.
- `src/app/(tenant)/` — Dashboard, My Leases (list/detail/renewal/pay), My Requests
  (list/detail/create), Profile.
- `src/app/(technician)/` — My Jobs (list/detail with Start Work, Submit Investigation, Mark
  Complete), Profile.
- `src/services/` — ported line-for-line from `fe-nivah-tenant-web/services/*.ts` (same DTOs,
  same status/priority/SLA color maps, same endpoints) so the mobile app stays in contract lockstep
  with the web app and the backend.
- `src/lib/api.ts` — axios client mirroring the web app's `lib/axios.ts` interceptor behavior
  (bearer token, refresh-token mutex with 2-failure logout), but backed by `expo-secure-store`
  instead of `localStorage`.

## Known gaps (intentionally out of scope for this pass)

- No push notifications (no FCM/APNs integration exists on the backend yet — only email and
  SignalR, and SignalR only delivers while the socket is alive). Screens use pull-to-refresh /
  refetch-on-focus instead.
- Lease payment opens the Paystack checkout URL in the system browser (`expo-web-browser`) but
  doesn't intercept the return callback — return to the app manually and pull to refresh.
- Everything else in the web app (visitor passes, amenity bookings, documents, announcements page,
  move requests, feedback, KYC, vendor-portal) isn't built yet.
