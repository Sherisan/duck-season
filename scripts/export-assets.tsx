/**
 * Renders the React art components to standalone SVG files in public/assets.
 * Run with: npm run export:assets
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DuckArt } from '../src/art/Duck';
import { HunterArt } from '../src/art/Hunter';
import { KeyArt } from '../src/art/KeyArt';
import { Chip, Coin, Logo } from '../src/art/Tokens';

const OUT = 'public/assets';
mkdirSync(OUT, { recursive: true });

const files: [string, ReactElement][] = [
  ['hunter-idle.svg', <HunterArt mood="idle" />],
  ['hunter-aim.svg', <HunterArt mood="aim" />],
  ['hunter-cheer.svg', <HunterArt mood="cheer" aim={-40} />],
  ['hunter-annoyed.svg', <HunterArt mood="annoyed" />],
  ['duck-float.svg', <DuckArt state="float" />],
  ['duck-fly.svg', <DuckArt state="fly" />],
  ['duck-hit.svg', <DuckArt state="hit" />],
  ['chip-10.svg', <Chip value={10} size={88} />],
  ['chip-50.svg', <Chip value={50} size={88} />],
  ['chip-100.svg', <Chip value={100} size={88} />],
  ['chip-500.svg', <Chip value={500} size={88} />],
  ['coin.svg', <Coin size={96} />],
  ['logo.svg', <Logo size={128} />],
  ['key-art.svg', <KeyArt width={1600} />],
];

for (const [name, el] of files) {
  writeFileSync(`${OUT}/${name}`, '<?xml version="1.0" encoding="UTF-8"?>\n' + renderToStaticMarkup(el));
  console.log('wrote', `${OUT}/${name}`);
}
writeFileSync('public/favicon.svg', renderToStaticMarkup(<Logo size={64} />));
console.log('wrote public/favicon.svg');
