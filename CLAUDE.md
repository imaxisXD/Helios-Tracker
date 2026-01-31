# Helios-Tracker Project Reference

This document is the single source of truth for the Helios-Tracker codebase. Read it before making any change. Every rule here exists because of a decision made during the build. Do not deviate.

---

## What This App Is

A fitness tracker mobile app built with Expo (React Native) that visualizes real Xiaomi Mi Band wearable data exported as CSV files. It has 5 tabs: Dashboard, Activity, Sleep, Heart Rate, and Profile. The design follows a **neo-brutalist / sports data poster** aesthetic -- dark backgrounds, off-white cards, neon lime green accents, bold condensed typography, industrial monospace metrics.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 54, React 19.1, React Native 0.81 | Managed workflow, New Architecture enabled |
| Router | expo-router 6.x (file-based) | Native stack per tab, typed routes |
| Charts | react-native-gifted-charts 1.4.x | Bar, line, area, stacked -- all Expo-compatible |
| SVG | react-native-svg 15.x | Custom visuals (sleep timeline, activity ring, sparklines, barcode, dividers) |
| Lists | @shopify/flash-list 2.x | Performant virtualized lists for large datasets |
| Animations | react-native-reanimated 4.x | Worklet-based UI-thread animations |
| CSV parsing | papaparse 5.x | Handles BOM, quoted JSON fields, dynamic typing |
| Date utils | date-fns 4.x | Tree-shakeable date formatting |
| Icons | Ionicons via @expo/vector-icons | Sharp variants match the brutalist aesthetic |
| Fonts | Custom (see Design System) | Loaded via expo-font in root layout |
| Compiler | React Compiler enabled | `experiments.reactCompiler: true` in app.json |

### Libraries NOT to use

- Do NOT use `TouchableOpacity`. Use `Pressable` everywhere.
- Do NOT use `FlatList`. Use `FlashList` from `@shopify/flash-list`.
- Do NOT use `Platform.OS`. Use `process.env.EXPO_OS` where platform checks are needed.
- Do NOT use `StyleSheet.create`. Use inline style objects.
- Do NOT use `@expo/vector-icons` icon families other than `Ionicons`. All icons must be Ionicons with the `-sharp` suffix.
- Do NOT import from barrel files. Import directly from source files.

---

## Project Structure

```
app/
  _layout.tsx                    # Root Tabs layout + DataProvider + font loading
  (dashboard)/
    _layout.tsx                  # Stack navigator
    index.tsx                    # Dashboard screen (flagship)
  (activity)/
    _layout.tsx                  # Stack navigator
    index.tsx                    # Activity list + charts
    day/[date].tsx               # Single day deep-dive
  (sleep)/
    _layout.tsx                  # Stack navigator
    index.tsx                    # Sleep analysis
    night/[date].tsx             # Single night deep-dive
  (heart)/
    _layout.tsx                  # Stack navigator
    index.tsx                    # Heart rate trends + day nav
    day/[date].tsx               # Single day HR detail
  (profile)/
    _layout.tsx                  # Stack navigator
    index.tsx                    # Profile + lifetime stats
    sport/[id].tsx               # Sport type detail

components/
  ui/                            # Reusable UI primitives
    brutalist-card.tsx           # Off-white card with optional accentDot + verticalText
    metric-block.tsx             # Large monospace number + label
    date-range-selector.tsx      # 7D / 30D / ALL toggle
    dotted-divider.tsx           # Row of green SVG circles
    decorative-barcode.tsx       # SVG barcode visual element
    green-accent-dot.tsx         # Neon green circle
    ticker-bar.tsx               # Scrolling metrics bar (reanimated)
    section-header.tsx           # Section title with decorative line
  charts/                        # Data visualization components
    steps-bar-chart.tsx          # Green bar chart with goal line
    calories-area-chart.tsx      # Area chart for calories
    heart-rate-line-chart.tsx    # Red line chart for HR
    sleep-stacked-bar.tsx        # Stacked bar for sleep stages
    sleep-stage-timeline.tsx     # Custom SVG horizontal color blocks + HR overlay
    activity-ring.tsx            # SVG circular progress ring
    mini-sparkline.tsx           # Small inline SVG polyline

lib/                             # Pure logic, no React
  data-types.ts                  # TypeScript interfaces for all entities
  csv-loader.ts                  # CSV parsing, BOM stripping, Map indexing
  data-transforms.ts             # groupByWeek, rollingAverage, computeHRZones, downsampleHR
  date-utils.ts                  # Date formatting helpers
  format-utils.ts                # Number/distance/calorie formatting
  sport-types.ts                 # Sport code -> name/icon mapping

context/
  data-context.tsx               # React Context wrapping all fitness data

hooks/
  use-fitness-data.ts            # Consumer hook for DataContext
  use-computed-stats.ts          # Derived metrics (step goal %, sleep score, resting HR)
  use-date-range.ts              # State hook for date range filtering

constants/
  theme.ts                       # HeliosColors, HeliosFonts, HeliosTypography, HeliosSpacing

assets/
  data/                          # 9 CSV files (cleaned names from Xiaomi export)
  fonts/                         # 5 TTF font files
  images/                        # App icons, splash screen
```

---

## Data Layer

### CSV files in `assets/data/`

| File | Records | Key columns |
|---|---|---|
| heartrate.csv | 150,192 | date, time, heartRate |
| sleep-minute.csv | 49,071 | date, time, stage (LIGHT/DEEP/REM), hr |
| activity-minute.csv | 19,734 | date, time, steps |
| activity-stage.csv | 871 | date, start, stop, distance, calories, steps |
| activity.csv | 154 | date, steps, distance, runDistance, calories |
| sleep.csv | 154 | date, deepSleepTime, shallowSleepTime, wakeTime, REMTime, naps (JSON) |
| sport.csv | 157 | type, startTime, sportTime(s), distance(m), calories(kcal) |
| body.csv | 1 | weight, height, bmi, fatRate |
| user.csv | 1 | userId, gender, height, weight, nickName, birthday |

### Performance rules for large datasets

- **heartrate.csv** (150K rows) and **sleep-minute.csv** (49K rows) are indexed into `Map<string, T[]>` at load time, keyed by date.
- Daily HR summaries (min/max/avg/resting) are pre-computed at load time into `dailyHRSummary: Map<string, DailyHRSummary>`.
- Per-day data is only surfaced on demand via `getHeartRateForDay(date)`, `getSleepMinutesForNight(date)`, etc.
- When charting HR data for a single day, always downsample to max ~288 points using `downsampleHR()` from `data-transforms.ts`.
- Never iterate over the full 150K HR array in a render path. Always use the pre-built Map index.

### Data loading flow

1. `app/_layout.tsx` prevents splash screen hide
2. `DataProvider` in `context/data-context.tsx` calls `loadAllData()` from `csv-loader.ts`
3. `csv-loader.ts` uses `expo-asset` to resolve bundled CSVs, fetches them, strips BOM (`\uFEFF`), parses with papaparse (`{ header: true, dynamicTyping: true }`)
4. Builds indexed Maps for large datasets
5. Splash screen hides after fonts AND data are loaded

### Adding new data

To add a new CSV data source:
1. Place the CSV in `assets/data/` with a kebab-case name
2. Add a TypeScript interface in `lib/data-types.ts`
3. Add to the `FitnessData` interface
4. Add loader logic in `csv-loader.ts`
5. Expose accessor methods in `context/data-context.tsx`

---

## Design System

### Colors (`HeliosColors`)

```
background:       #141414    near-black base
surface:          #1E1E1E    elevated surfaces (tab bar)
cardLight:        #F2EFEA    warm off-white card backgrounds
cardBorder:       #E5E1DC    subtle card edge
accent:           #A8FF00    neon lime green -- THE signature color
accentDim:        rgba(168,255,0,0.12)
textPrimary:      #FFFFFF    white on dark backgrounds
textSecondary:    #777777    muted gray
textOnCard:       #1A1A1A    near-black on cards
textOnCardMuted:  #666666    gray on cards
heartRed:         #FF3B30    heart rate color
sleepDeep:        #6D28D9    deep sleep purple
sleepLight:       #C4B5FD    light sleep lavender
sleepREM:         #8B5CF6    REM sleep violet
wakeOrange:       #FF9500    wake periods
lineSubtle:       #333333    grid lines, rules
lineOnCard:       #D0CCC7    dividers on cards
```

Never introduce new colors without adding them to `constants/theme.ts` first. Never use hex values directly in components -- always reference `HeliosColors`.

### Typography (`HeliosFonts` / `HeliosTypography`)

| Token | Font | Use |
|---|---|---|
| `display` | BebasNeue-Regular | Hero titles, section headers, large labels (always uppercase) |
| `mono` | IBMPlexMono-Medium | Metrics, data values, labels, ticker text |
| `monoRegular` | IBMPlexMono-Regular | Secondary monospace text |
| `body` | DMSans-Variable | Body text, descriptions, readable content |
| `script` | Caveat-Variable | Decorative handwritten accents |

Pre-built text style objects in `HeliosTypography`:
- `heroTitle` (48px Bebas), `sectionTitle` (32px Bebas), `cardTitle` (22px Bebas)
- `metricLarge` (36px mono), `metricMedium` (24px mono), `metricSmall` (14px mono)
- `label` (11px mono, uppercase, letter-spacing 1.5)
- `body` (15px DM Sans), `bodySmall` (13px DM Sans)
- `script` (28px Caveat)

Always use these typography tokens. Never create ad-hoc font styles.

### Spacing (`HeliosSpacing`)

```
xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
screenPadding: 20, cardPadding: 16, cardRadius: 16, cardGap: 12
```

### Icons

All icons use **Ionicons** from `@expo/vector-icons` with the **`-sharp`** suffix variant. This gives geometric, angular icons that match the brutalist aesthetic.

```tsx
import { Ionicons } from '@expo/vector-icons';
<Ionicons name="flash-sharp" size={24} color={HeliosColors.accent} />
```

Tab bar icons:
- Dashboard: `flash-sharp`
- Activity: `footsteps-sharp`
- Sleep: `moon-sharp`
- Heart: `heart-sharp`
- Profile: `person-sharp`

Navigation icons:
- Back button: `chevron-back` (16px) + "BACK" text label
- Day nav prev/next: `chevron-back-sharp` / `chevron-forward-sharp` (24px)

Sport type icons (`lib/sport-types.ts`):
- Outdoor Run: `walk-sharp`
- Indoor Cycling: `bicycle-sharp`
- Gym: `barbell-sharp`

When adding new icons, always use the `-sharp` variant. Never use default or `-outline` variants.

---

## Coding Conventions

### File naming

All files use **kebab-case**: `brutalist-card.tsx`, `heart-rate-line-chart.tsx`, `use-computed-stats.ts`. Never PascalCase or camelCase file names.

### Exports

- UI primitives in `components/ui/` use **named exports**: `export function BrutalistCard`
- Chart components in `components/charts/` use **default exports**: `export default function StepsBarChart`
- Lib modules use **named exports**
- Screen files use **default exports** (required by expo-router)

When importing, match the export style. Named export = `{ BrutalistCard }`. Default export = `StepsBarChart` (no braces).

### React patterns

- Use `React.use(Context)` -- NOT `React.useContext(Context)`.
- Use ternary for conditional rendering: `condition ? <Component /> : null`. Never use `condition && <Component />` (falsy values can leak).
- Wrap all display text in `<Text>` components. Never bare strings.
- All numeric displays must use `fontVariant: ['tabular-nums']` for proper alignment.
- Rounded corners must use `borderCurve: 'continuous'` for iOS superellipse smoothing.
- Shadows use the `boxShadow` CSS prop, NOT legacy `shadowColor`/`shadowOffset`/`elevation`.
- Haptic feedback on iOS: dynamically import `expo-haptics` to avoid Android crashes:
  ```tsx
  async function triggerHaptic() {
    if (Platform.OS === 'ios') {
      try {
        const Haptics = await import('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }
  ```

### FlashList rules

- Use `FlashList` for any scrollable list of items
- Always provide `estimatedItemSize`
- Memoize item components with `React.memo`
- Extract callback refs outside render, stabilize with `useCallback`
- Do not use inline style objects inside list item components

### Animation rules

- Only animate `transform` and `opacity` (GPU-accelerated properties)
- Entrance animations use `FadeInDown.delay(i * 100).duration(400)` from reanimated
- Use `useDerivedValue` for computed animation values
- Ticker bar uses `withRepeat` + `withTiming` on `translateX`

### Type safety

- TypeScript strict mode is ON (`strict: true` in tsconfig)
- All data interfaces live in `lib/data-types.ts`
- Never use `any`. If a type is complex, define an interface.
- `fontVariant` in chart components must be cast as `('tabular-nums')[]` to avoid readonly array conflicts with `TextStyle`:
  ```tsx
  fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  ```

### Path aliases

Use `@/` for all imports from project root:
```tsx
import { HeliosColors } from '@/constants/theme';
import { useFitnessData } from '@/hooks/use-fitness-data';
```

Never use relative paths like `../../constants/theme`.

---

## Metro Configuration

`metro.config.js` adds `csv` to `resolver.assetExts` so CSV files in `assets/data/` are bundled as static assets and loadable via `expo-asset`.

---

## App Configuration

Key `app.json` settings:
- `userInterfaceStyle: "dark"` -- app is dark-mode only
- `newArchEnabled: true` -- React Native New Architecture
- `experiments.reactCompiler: true` -- React Compiler for auto-memoization
- `experiments.typedRoutes: true` -- type-safe route parameters
- Splash screen background: `#141414` (matches app background)

---

## Screen Patterns

Every tab screen follows this structure:
1. `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` and `backgroundColor: HeliosColors.background`
2. Hero title in `HeliosTypography.heroTitle` with neon green accent underline
3. Cards using `BrutalistCard` with optional `accentDot` and `verticalText` props
4. Metrics displayed via `MetricBlock` component
5. Sections separated by `DottedDivider` and headed by `SectionHeader`
6. Entrance animations with staggered `FadeInDown`

Every detail screen follows this structure:
1. Back button: `Pressable` with `<Ionicons name="chevron-back" />` + "BACK" text in accent color, triggers haptic on iOS
2. Hero title + subtitle date
3. Content cards
4. `DecorativeBarcode` as visual punctuation

---

## Adding a New Screen

1. Create the route file in the appropriate tab group: `app/(tab)/new-screen.tsx`
2. Use default export for the screen component
3. Import design tokens from `@/constants/theme` -- never hardcode colors/fonts/spacing
4. Use `BrutalistCard`, `MetricBlock`, `SectionHeader`, `DottedDivider` from `@/components/ui/`
5. Add `FadeInDown` entrance animation from `react-native-reanimated`
6. If it's a detail screen pushed onto the stack, include the standard back button pattern with Ionicons
7. Run `npx tsc --noEmit` to verify zero type errors

---

## Adding a New Chart

1. Create in `components/charts/` with kebab-case name
2. Use `export default`
3. Use `react-native-gifted-charts` for standard charts or `react-native-svg` for custom visuals
4. Style axes and labels with `HeliosColors.textSecondary`, `HeliosFonts.mono`, `fontSize: 9-10`
5. Use `fontVariant: ['tabular-nums'] as ('tabular-nums')[]` on all text style objects passed to chart libraries
6. Set `rulesColor={HeliosColors.lineSubtle}`, `rulesType="dashed"`, `backgroundColor={HeliosColors.background}`
7. Add `isAnimated` and `animationDuration={600}` for chart entrance

---

## Commands

```bash
bun install          # Install dependencies
npx expo start       # Start dev server
npx tsc --noEmit     # Type check (must pass with zero errors)
npx expo export --platform ios   # Build iOS bundle
npx expo lint        # Run ESLint
```

---

## Known Constraints

- `expo-linear-gradient` is required by `react-native-gifted-charts` -- do not remove it
- `@shopify/flash-list@2.2.1` shows a version warning (expected 2.0.2 for Expo 54) -- non-breaking, ignore
- `react-native-svg@15.15.1` shows a version warning (expected 15.12.1) -- non-breaking, ignore
- The React Compiler handles most memoization automatically -- do not add unnecessary `useMemo`/`useCallback` unless profiling shows a need
- Sleep naps field in CSV contains JSON strings that must be parsed with `JSON.parse()` after papaparse extraction
