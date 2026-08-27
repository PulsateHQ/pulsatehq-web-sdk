# Web SDK Visual Regression Tests

Playwright-based screenshot comparison tests for all Web SDK UI components.

## Prerequisites

- Node.js 18+
- Chromium (installed automatically by Playwright)

## Quick Start

```bash
cd sdk

# Install dependencies (first time only)
npm install
npx playwright install chromium

# Build the SDK (required before running tests)
npm run build

# Run all visual tests
npm run test:pw
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run test:pw` | Run all visual tests |
| `npm run test:pw:update` | Run tests and update baseline screenshots |
| `npm run build` | Build SDK (must run before tests) |

## Test Coverage

| Spec File | Component | Tests |
|-----------|-----------|-------|
| `inapp-large.spec.ts` | InApp Large Modal | default state, dismissed state |
| `inapp-large.spec.ts` | InApp Large Narrow Viewport (720px) | narrow default (vertical layout), narrow dismissed |
| `inapp-large.spec.ts` | InApp Large Image Only | image-only campaign (no headline/text) |
| `inapp-large.spec.ts` | InApp Large Text Only | text-only campaign (no image) |
| `inapp-large.spec.ts` | InApp Large Headline Only | headline-only campaign (minimal) |
| `inapp-large.spec.ts` | InApp Large Reordered | reordered elements (text above headline) |
| `inapp-large.spec.ts` | InApp Large Branded Buttons | both buttons with custom branding colors (pink + green) |
| `inapp-large.spec.ts` | InApp Large Empty Colors | empty btn_color/txt_color CSS fallback |
| `inapp-large.spec.ts` | InApp Large Branded Primary | single branded primary button (pink) |
| `inapp-large.spec.ts` | InApp Large Branded Secondary | single branded secondary button (green) |
| `inapp-large.spec.ts` | InApp Large Buttons | two CTA buttons rendered, URL href assertion |
| `inapp-small.spec.ts` | InApp Small Card | default state, dismissed state |
| `inapp-small.spec.ts` | InApp Small Attributes | card anchor href assertion |
| `feed.spec.ts` | Feed Cards | default grid, hover state, card back detail view |
| `feed.spec.ts` | Feed Empty State | empty feed placeholder |
| `feed.spec.ts` | Delete Modal | confirmation dialog, dismissed after cancel |
| `feed.spec.ts` | Feed URL Button | URL button rendered, href assertion |
| `feed.spec.ts` | Feed Deeplink Button | deeplink button rendered |
| `feed.spec.ts` | Feed Single Post | single post layout, card back navigation |
| `feed.spec.ts` | Feed Rich Media | GIF rich media rendered, card back navigation |
| `feed.spec.ts` | Feed Image Only | image-only feed card |
| `feed.spec.ts` | Feed Text Only | text-only feed card (no image) |
| `feed.spec.ts` | Feed Headline Only | headline-only feed card (minimal) |
| `feed.spec.ts` | Feed Table Back | table card back screenshot, table row count assertion |
| `feed.spec.ts` | Feed Branded Button | branded orange dismiss button |
| `feed.spec.ts` | Feed Narrow Viewport (720px) | narrow grid layout, narrow card back |

**Total: 38 tests** (visual screenshots + DOM attribute assertions)

## How It Works

1. **Build** produces `dist/web-sdk.umd.cjs` + `dist/web-sdk.css`
2. Playwright starts a static file server (`npx serve` on port 4173)
3. Each test loads an **HTML harness** (`test/visual/*.html`) that initializes the SDK
4. **Route mocks** (`page.route()`) intercept all API calls and return fixture data
5. `toHaveScreenshot()` compares the rendered page against baseline PNGs

## File Structure

```
test/
  fixtures/                  # Mock API response data (JSON)
    inapp-large-notification.json
    inapp-large-image-only.json
    inapp-large-text-only.json
    inapp-large-headline-only.json
    inapp-large-reordered.json
    inapp-large-branded.json
    inapp-large-empty-colors.json
    inapp-large-branded-primary.json
    inapp-large-branded-secondary.json
    inapp-small-notification.json
    feed-notifications.json
    feed-url-button.json
    feed-deeplink-button.json
    feed-single-post.json
    feed-rich-media.json
    feed-image-only.json
    feed-text-only.json
    feed-headline-only.json
    feed-table-back.json
    feed-branded.json
  visual/                    # HTML harnesses loaded by Playwright
    inapp-large.html
    inapp-small.html
    feed.html
  playwright/
    playwright.config.ts     # Viewport 1280x720, maxDiffPixels: 50
    helpers/
      mock-routes.ts         # Shared API route mocks for all specs
    inapp-large.spec.ts
    inapp-small.spec.ts
    feed.spec.ts
    snapshots/               # Baseline screenshots (committed to git)
      *.spec.ts-snapshots/
        *-chromium-darwin.png
```

## Updating Baselines

When the SDK's visual output intentionally changes (new styles, layout tweaks):

```bash
npm run build
npm run test:pw:update
```

This regenerates all baseline PNGs. Review the diff before committing.

## Adding a New Component Test

1. **Create fixture** in `test/fixtures/` with mock API response data. Use `data:image/svg+xml` URIs for images (deterministic, no network).
2. **Create HTML harness** in `test/visual/`. Include `<link>` to `../../dist/web-sdk.css`, the SDK queue stub, and `<script src="../../dist/web-sdk.umd.cjs">`.
3. **Create spec file** in `test/playwright/`. Import `mockCommonRoutes` from `./helpers/mock-routes.js` and add component-specific route mocks.
4. **Generate baselines**: `npm run test:pw:update`
5. **Verify**: `npm run test:pw`

## Troubleshooting

**Tests fail with "X pixels are different"**
- Rebuild first: `npm run build && npm run test:pw`
- If the visual change is intentional: `npm run test:pw:update`

**"Cannot find module" errors**
- Run `npm install && npx playwright install chromium`

**Baselines don't match on different OS**
- Baselines include platform suffix (e.g., `-chromium-darwin.png`). Linux/CI will need separate baselines generated on that platform.

**Port 4173 already in use**
- Kill the process: `lsof -ti:4173 | xargs kill`
- Or Playwright will reuse it if `reuseExistingServer` is true (non-CI)

## CI Pipeline

Visual tests run in GitHub Actions in two places:

1. **On pull requests** targeting `stage` or `main` (`pr_check.yml`) — builds and tests only, no deploy. This lets you catch visual regressions before merging.
2. **On push** to `stage` or `main` (`push_stage.yml` / `push_main.yml`) — builds, tests, and deploys. If tests fail, deploy is skipped.

### How CI Works

1. `npm install` installs dependencies (including `serve`)
2. `npm run build` produces `dist/web-sdk.umd.cjs` + `dist/web-sdk.css`
3. `npx playwright install --with-deps chromium` installs the browser
4. `npm run test:pw` runs all 38 visual tests
5. If tests pass → deploy to S3 (push workflows only)
6. If tests fail → upload `test-results/` artifact for debugging

### Cross-Platform Baselines

**Why do we need both macOS and Linux baselines?**

Playwright takes pixel-perfect screenshots. Fonts render differently between macOS and Linux — even the same font at the same size produces slightly different pixel output due to different text rendering engines (Core Text on macOS vs FreeType on Linux). This means a screenshot taken on macOS will never match one taken on Linux, even with identical code.

Since CI runs on `ubuntu-latest` (Linux) but developers work on macOS, we maintain two sets of baselines:
- `*-chromium-darwin.png` — used when running tests locally on macOS
- `*-chromium-linux.png` — used by CI on ubuntu-latest

Playwright automatically picks the correct set based on the platform.

**Why Docker for Linux baselines?**

You can't generate Linux baselines on a Mac natively. The `npm run test:pw:update:linux` script runs a Playwright Docker container (`mcr.microsoft.com/playwright:v1.58.2-noble`) that:
1. Installs dependencies (`npm ci`)
2. Builds the SDK (`npm run build`) — must happen inside the container because font rendering affects the build output screenshots
3. Runs tests with `--update-snapshots` to generate `-chromium-linux.png` baselines

The Docker container uses the same Ubuntu + Chromium environment as CI, so the baselines match exactly.

### Updating Baselines

When adding new tests or changing SDK styles, update **both** macOS and Linux baselines:

```bash
# 1. Update macOS baselines (run on your Mac)
npm run build
npm run test:pw:update

# 2. Update Linux baselines (requires Docker Desktop running)
npm run test:pw:update:linux
```

### Debugging CI Failures

1. Go to the failed GitHub Actions run
2. Download the `playwright-results-*` artifact (named `playwright-results-pr-<number>`, `playwright-results-stage`, or `playwright-results-prod`)
3. The artifact contains diff images showing what changed (expected vs actual vs diff)
4. If the visual change is intentional, update both baseline sets (see above)
