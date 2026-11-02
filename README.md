# Duck Season: crash game front end

A crash-style betting game built in **React 18 + TypeScript + Vite**. Sir Reginald, a portly English gentleman with a monocle and a pipe, aims his shotgun at Mallow the duck. While the duck flies the multiplier climbs; cash out before he fires.

Everything (the characters, the marsh scene, chips, coin, logo) is drawn as SVG in React components, so there are no image files to manage and every piece scales cleanly. Sounds are synthesised with Web Audio, so there are no audio files either.

> Demo build: it plays with **demo credits only** and computes round results in the browser. Read "Going live" before connecting real money.

## Quick start

You need Node.js 18 or newer.

```bash
npm install
npm run dev          # opens http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-checks, then builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm run typecheck` | TypeScript only |
| `npm run export:assets` | Re-renders the art components to SVG files in `public/assets/` |

Open the folder in VS Code; the Prettier extension is recommended (`.vscode/extensions.json`).

## What's in the game

- **Two bet panels** (Bet 1 / Bet 2). Each has an amount field, ½ and 2× steppers, 10/50/100/500 chips, MAX, and switches for **Auto bet** and **Auto cash-out**. The big button changes with the moment: Place bet → Cancel → Cash out (live value) → Collected / Bet next round.
- **Auto play** panel: rounds (10, 25, 50, 100, ∞), stop on profit and stop on loss, shared by both panels. It stops itself and says why.
- **Stage**: animated dusk marsh (manor house, drifting clouds, swaying reeds, mist, fireflies), a crosshair that tracks the duck, history pills, a live flight-curve chart, and an altitude gauge. The edges glow red as the multiplier rises.
- **Sir Reginald's moods**: relaxed with his pipe while you bet, squinting down the barrel in flight, "Confound it!" when you cash out, "Tally-ho!" when he hits. Every shot comes with a muzzle flash, smoke, camera shake and flying feathers.
- **Wins**: coin burst on every cash-out, plus a Big win (≥5×), Huge win (≥10×) or Mega win (≥25×) plaque.
- **Sidebar**: session stats, a chart of the last 30 rounds, your last 12 bets, and a **Provably fair** panel with a working *Verify* button.
- **How to play** pop-up, sound toggle, and a responsive layout down to phone width.

## Project structure

```
src/
  main.tsx                App entry: mounts <App/> and the CSS
  App.tsx                 Page layout
  game/
    GameEngine.ts         The game loop and all player actions (framework-free)
    engine.ts             Pure maths: multiplier curve, crash formula, duck path, aim
    fairness.ts           RoundProvider interface, SHA-256 seeds, LocalDemoProvider, verifyRound
    useGame.ts            React hooks: useEngine() and useGameState() (useSyncExternalStore)
    sound.ts              Web Audio sound effects (shot, quack, chime)
    format.ts             en-ZA credits (10 000,00) and multiplier formatting
    types.ts              Shared types
  art/
    Hunter.tsx            Sir Reginald: <Hunter mood aim recoil flash smoke bubble/> + <HunterArt/>
    Duck.tsx              Mallow: <Duck state="float|fly|hit"/> + <DuckArt/>
    Scene.tsx             Scene layers: sky, clouds, land and water, bank, foreground
    KeyArt.tsx            Full-scene still for lobby cards and banners
    Tokens.tsx            Chips, coin and logo
  components/
    Stage.tsx             Composes the scene and all stage overlays
    BetPanel.tsx          One bet panel
    Sidebar.tsx           Stats, Auto play, round history, bet history, fairness
    Header.tsx            Top bar and footer
    HowToPlay.tsx         Rules pop-up
    Switch.tsx, icons.tsx
  styles/
    tokens.css            Design tokens (colours, type, radii, shadows) as CSS variables
    global.css            Reset, utilities, keyframes
    app.css               Layout, panels, buttons
    stage.css             Stage overlays and SVG animation hooks
public/
  favicon.svg
  assets/                 Exported SVGs: hunter-*.svg, duck-*.svg, chip-*.svg, coin, logo, key-art
scripts/
  export-assets.tsx       Builds public/assets from the React art
```

## How it works

`GameEngine` runs a `requestAnimationFrame` loop with three phases:

1. **waiting**: 5 s to place bets. The hash of the next server seed is already shown.
2. **flying**: the multiplier is `floor(e^(0.11·t) × 100) / 100`. Auto cash-outs fire the moment their target is reached.
3. **crashed**: when the multiplier reaches the round's crash point, the hunter fires, open bets are lost and the server seed is revealed. The next round starts after 3.4 s.

The engine never touches React. It keeps one immutable snapshot and notifies subscribers, and `useGameState` reads it with `useSyncExternalStore`. So you can unit-test it on its own, or drive a different renderer (Pixi, canvas) from the same engine.

Tuning lives in `src/game/engine.ts`: `WAIT_MS`, `HOLD_MS`, `GROWTH`, `HOUSE_EDGE`, `MAX_MULT`, `START_BALANCE`.

### Provably fair

```
r      = first 52 bits of SHA-256(serverSeed : clientSeed : nonce) / 2^52
crash  = max(1, floor(0.99 / (1 − r) × 100) / 100)        // 1% house edge, capped at 10 000×
```

`verifyRound(serverSeed, clientSeed, nonce)` recomputes any revealed round; the Verify button uses it.

## Customising the look

- **Colours and type**: `src/styles/tokens.css`. `--game` is this world's accent (sky blue). Gold is the only action colour; green only means money won and red only means money lost.
- **Characters**: edit the SVG paths in `src/art/Hunter.tsx` and `Duck.tsx`. Moods and states are plain props, so it's easy to add new ones.
- **Fonts**: Oxanium (display and numbers) and Barlow (body), loaded from Google Fonts in `index.html`.
- After changing art, run `npm run export:assets` to refresh the SVG files.

## Going live (real money)

The demo decides crash points in the browser, which is fine for practice and unsafe for real stakes. Before production:

1. **Move round generation to your server.** Implement `RoundProvider` (in `fairness.ts`) against your API. The server keeps the crash point secret, publishes the seed hash before betting closes, and reveals the seed after the crash. Swap it in at `useGame.ts`: `new GameEngine(new YourServerProvider())`.
2. **Make the server the authority for bets and cash-outs.** The client should *request* a cash-out; the server accepts it only if it arrives before the crash time. A WebSocket feed of round state works well.
3. **Wallet**: replace the local `balance` with your wallet API.
4. **Compliance**: gambling for real money needs a licence in your jurisdiction, age and identity checks, and responsible-gambling tools (deposit limits, self-exclusion, reality checks). The footer shows the South African Responsible Gambling helpline (0800 006 008); adjust it for your market.

## Notes

- Browsers only allow audio after a click, so sound starts off; the speaker button turns it on.
- `crypto.subtle` needs `https://` or `localhost`. On plain http the demo falls back to `Math.random()` and says so in the fairness panel.
- Animations respect `prefers-reduced-motion`.
