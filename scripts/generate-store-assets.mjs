import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const logo = await readFile('public/favicon.svg', 'utf8');
const iconDirectory = 'store-assets/icons';
const promoDirectory = 'store-assets/promotional';
await Promise.all([mkdir(iconDirectory, { recursive: true }), mkdir(promoDirectory, { recursive: true })]);

/** 用同一官网标记和收集场景生成无文字的商店宣传图，喵~ */
function promotion(mark) {
  return `<style>
    * { box-sizing: border-box; }
    body {
      display: grid; place-items: center; margin: 0; height: 100vh;
      background: radial-gradient(ellipse at 83% 25%, #3466eb 0%, #234cb4 43%, #14295b 100%);
    }
    .scene { position: relative; width: min(86vw, 173vh); height: 76vh; }
    .brand {
      position: absolute; z-index: 2; top: 21%; left: 0; display: grid; place-items: center;
      width: 32%; aspect-ratio: 1; background: #edf2ff; border-radius: 31%;
      box-shadow: 0 2vh 6vh #101c4b45;
    }
    .brand svg { width: 75%; height: 75%; }
    .browser {
      position: absolute; top: 8%; left: 29%; width: 64%; height: 72%;
      background: #e2eaff; border: max(1px, .4vh) solid #bacbfa; border-radius: 4vh;
      box-shadow: 0 3vh 7vh #0b174f45;
    }
    .chrome { display: flex; align-items: center; gap: 1.4vh; height: 16%; padding-inline: 3vh; }
    .chrome i { width: 1.5vh; height: 1.5vh; border-radius: 50%; background: #7f9add; }
    .chrome span { width: 67%; height: 1.7vh; margin-left: 1.7vh; border-radius: 1vh; background: #bfd0fa; }
    .document { display: grid; gap: 2.1vh; padding: 5vh 4vh; }
    .document b { width: 66%; height: 1.8vh; border-radius: 1vh; background: #bccbef; }
    .document b:nth-child(2) { width: 79%; }
    .document b:nth-child(3) { width: 53%; background: #85a6ff; }
    .document b:nth-child(4) { width: 72%; }
    .task {
      position: absolute; z-index: 1; right: 0; bottom: 3%; width: 42%;
      display: grid; gap: 2.2vh; padding: 3.6vh; background: #fff; border-radius: 3vh;
      box-shadow: 0 3vh 7vh #0b174f55;
    }
    .task i { display: block; height: 1.9vh; border-radius: 1vh; background: #c5d5f7; }
    .task i:first-child { width: 81%; height: 2.7vh; background: #5376ce; }
    .task i:nth-child(3) { width: 68%; }
    .task i:last-child { height: 4.3vh; border-radius: 1.2vh; background: #245ce6; }
  </style>
  <div class="scene">
    <div class="brand">${mark}</div>
    <div class="browser">
      <div class="chrome"><i></i><i></i><i></i><span></span></div>
      <div class="document"><b></b><b></b><b></b><b></b></div>
    </div>
    <div class="task"><i></i><i></i><i></i><i></i></div>
  </div>`;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [16, 24, 32, 48, 128]) {
    const artworkSize = size === 128 ? 96 : size;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<!doctype html><style>body { margin: 0; width: 100vw; height: 100vh; display: grid; place-items: center; } svg { width: ${artworkSize}px; height: ${artworkSize}px; }</style>${logo}`);
    await page.screenshot({ path: `${iconDirectory}/todo-${size}.png`, omitBackground: true });
  }

  for (const [name, width, height] of [['small-tile', 440, 280], ['marquee', 1400, 560]]) {
    await page.setViewportSize({ width, height });
    await page.setContent(`<!doctype html>${promotion(logo)}`);
    await page.screenshot({ path: `${promoDirectory}/${name}.png` });
  }
} finally {
  await browser.close();
}
