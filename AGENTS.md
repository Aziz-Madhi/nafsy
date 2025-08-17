# Repository Guidelines

## Project Structure & Module Organization

- Source: `src/` (routes in `src/app`, UI in `src/components`, state in `src/store`, utilities in `src/lib`, providers in `src/providers`, config in `src/config`).
- Backend (Convex): `convex/` (functions, schema, generated API types).
- Tests: `src/__tests__/` (use `*.test.ts` / `*.test.tsx`).
- Assets: `assets/` (images, fonts); platform projects: `android/`, `ios/`.

## Build, Test, and Development Commands

- `npm install` or `bun install`: install dependencies.
- `npm run start`: start Expo dev server; `npm run web` for web.
- `npm run android` / `npm run ios`: run on device/simulator (Expo dev client required).
- `npm run convex:dev`: start Convex local dev; `npm run convex:deploy` to deploy.
- `npm test` / `npm run test:watch` / `npm run test:coverage`: run Jest tests.
- `npm run lint` / `npm run lint:fix`: lint code; `npm run format` to Prettier-format.

## Coding Style & Naming Conventions

- Language: TypeScript, React Native + Expo Router.
- Formatting: Prettier (2 spaces, single quotes, semicolons, 80 char width).
- Linting: ESLint (`eslint-config-expo`, Prettier plugin). Fix before PRs.
- Naming: PascalCase for React components/files (e.g., `ChatScreen.tsx`), camelCase for functions/vars, SCREAMING_SNAKE_CASE for constants. Keep folders lowercase.

## Testing Guidelines

- Frameworks: Jest + `@testing-library/react-native` and `jest-native` matchers.
- Place tests in `src/__tests__/` or alongside modules using `*.test.ts(x)`.
- Prefer behavior-focused tests; mock platform/Convex calls where needed.
- Run `npm test` locally; maintain meaningful coverage for changed code.

## Commit & Pull Request Guidelines

- Commits: imperative mood, concise summary (<= 72 chars), optional scope (e.g., "chat:"), descriptive body when needed.
- PRs: include clear description, linked issues (`Fixes #123`), screenshots/GIFs for UI changes, test plan (devices/platforms), and notes on Convex or env changes.
- Ensure: builds locally, lints clean, tests pass, and no unused files.

## Security & Configuration Tips

- Secrets/keys: never commit; use `.env` and reference through `src/config/env.ts` or platform configs.
- Verify Convex auth settings in `convex/auth.config.js`; app config in `app.config.ts`.
- For RTL/i18n changes, validate Arabic/English flows and layout direction.
