import { Coin, Logo } from '../art/Tokens';
import type { GameEngine } from '../game/GameEngine';
import { fmt } from '../game/format';
import type { SoundFx } from '../game/sound';
import { BackIcon, HelpIcon, MuteIcon, NextIcon, PrevIcon, SoundIcon } from './icons';

interface Props {
  balance: number;
  soundOn: boolean;
  engine: GameEngine;
  sfx: SoundFx;
  onHelp: () => void;
}

export function Header({ balance, soundOn, engine, sfx, onHelp }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="icon-btn" aria-label="Back to lobby">
          <BackIcon />
        </button>
        <Logo />
        <div className="topbar__title">
          <span className="kicker">Crash world · Marsh at dusk</span>
          <h1>Duck Season</h1>
        </div>
        <div className="topbar__tags">
          <span className="tag">RTP 99%</span>
          <span className="tag">Max 10 000×</span>
          <span className="tag">
            Volatility
            <span className="vol" aria-label="3 of 4">
              <i style={{ height: 6 }} />
              <i style={{ height: 9 }} />
              <i style={{ height: 12 }} />
              <i className="off" style={{ height: 15 }} />
            </span>
          </span>
        </div>
      </div>
      <div className="topbar__right">
        <div className="balance">
          <Coin size={26} />
          <div className="balance__text">
            <span className="balance__value num">{fmt(balance)}</span>
            <span className="balance__unit">demo credits</span>
          </div>
          {balance < 100 && (
            <button className="btn-ghost btn-ghost--sm" onClick={() => engine.refill()}>
              Refill
            </button>
          )}
        </div>
        <button className="icon-btn" aria-label="How to play" onClick={onHelp}>
          <HelpIcon />
        </button>
        <button
          className={`icon-btn${soundOn ? ' is-on' : ''}`}
          aria-label={soundOn ? 'Sound on' : 'Sound off'}
          aria-pressed={soundOn}
          onClick={() => {
            sfx.unlock();
            engine.toggleSound();
          }}
        >
          {soundOn ? <SoundIcon /> : <MuteIcon />}
        </button>
        <button className="icon-btn nav-btn" aria-label="Previous game">
          <PrevIcon />
        </button>
        <button className="icon-btn nav-btn" aria-label="Next game">
          <NextIcon />
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <span>Demo credits only · no cash value · 18+ only</span>
      <span>
        Play responsibly. South African Responsible Gambling helpline: <a href="tel:0800006008">0800 006 008</a>
      </span>
    </footer>
  );
}
