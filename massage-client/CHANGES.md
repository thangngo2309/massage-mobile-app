Changes made:

- Disabled `/(auth)/login` to immediately redirect to `/(tabs)` for quick entry during development.
-- Added `ClientLayout`, `ClientHeader`, and `ClientMobileNav` under `src/components` to mirror the web app layout shell. (now removed)
-- Wrapped `src/app/(tabs)/_layout.tsx` with `ClientLayout` to provide header and mobile nav. (now removed)

Notes / next steps:

- TypeScript typecheck reported existing errors in multiple files (likely due to missing types and API exports). These errors appear pre-existing and unrelated to the layout changes; see `yarn typecheck` output.
- If you want full parity with the web app layout, we can copy additional components/styles from `massage-app/apps/web/src/components/layouts` and adapt them to React Native.
- Optionally: stub or mock missing API exports and vector-icons types to clean up typecheck for development.

How to run locally:

1. Start Expo dev server:

```bash
cd massage-booking-app
yarn dev
```

2. Run typecheck:

```bash
cd massage-booking-app
yarn typecheck
```
