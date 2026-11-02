import { Duck } from './Duck';
import { Hunter } from './Hunter';
import { Clouds, SceneBank, SceneForeground, SceneLand, SceneSky } from './Scene';

/** The full scene as one still: lobby cards, banners, social posts. */
export function KeyArt({ width = 1000 }: { width?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 560"
      width={width}
      height={(width * 560) / 1000}
      role="img"
      aria-label="Duck Season key art: Sir Reginald aims at Mallow the duck over a marsh at sunset"
    >
      <SceneSky />
      <Clouds x={0} />
      <SceneLand />
      <g transform="translate(560 230) rotate(-14) scale(1.25)">
        <Duck state="fly" />
      </g>
      <SceneBank />
      <Hunter mood="aim" aim={-17} />
      <SceneForeground />
    </svg>
  );
}
