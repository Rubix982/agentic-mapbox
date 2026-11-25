// Do setSnow and setRain (experimental) draw anything, and does the map still go idle while they fall?
import { mapExperiment, page, diff, fact } from '../lib.mjs';

// share of pixels brighter by more than 30 in every channel: flakes and streaks are sparse, so a whole-frame mean
// difference stays small (the first run's snow gave 2.2 against a guessed threshold of 5)
const whitened = (a, b) => {
  let n = 0, all = 0;
  for (let k = 0; k < a.data.length; k += 4) { all++; if (b.data[k] - a.data[k] > 30 && b.data[k + 1] - a.data[k + 1] > 30 && b.data[k + 2] - a.data[k + 2] > 30) n++; }
  return Math.round((n / all) * 10000) / 100;
};

const html = page({
  title: 'Snow and rain',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: [-79.3832, 43.6532], zoom: 15.5, pitch: 60, bearing: 30 });
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Do setSnow and setRain draw anything, and does the map still go idle while they fall?',
  html,
  check: async (t) => {
    const clear = await t.shot('clear');
    await t.eval(() => window.map.setSnow({ density: 1, intensity: 1 }));
    await t.wait(1500);
    const snowA = await t.shot('snow');
    await t.wait(300);
    const snowB = await t.screenshot();
    const snowRead = await t.eval(() => window.map.getSnow && window.map.getSnow());
    const idleSnow = await t.idle(5000);
    await t.eval(() => { window.map.setSnow(null); window.map.setRain({ density: 1, intensity: 1 }); });
    await t.wait(1500);
    const rainA = await t.shot('rain');
    await t.wait(300);
    const rainB = await t.screenshot();
    const idleRain = await t.idle(5000);
    const d = { snow_vs_clear: diff(clear, snowA), snow_frame_to_frame: diff(snowA, snowB), rain_vs_clear: diff(clear, rainA), rain_frame_to_frame: diff(rainA, rainB), snow_whitened_pct: whitened(clear, snowA), rain_whitened_pct: whitened(clear, rainA) };
    return {
      facts: [
        fact('Snow whitens at least 0.2% of the pixels', d.snow_whitened_pct >= 0.2, d),
        fact('Snow moves: two frames 300 ms apart differ (mean difference over 0.5)', d.snow_frame_to_frame > 0.5),
        fact('Rain changes the picture (mean difference over 5 from the clear map)', d.rain_vs_clear > 5),
        fact('Rain moves between frames', d.rain_frame_to_frame > 0.5),
        fact('With snow falling the map still fires idle within 5 s', idleSnow, { idle_with_snow: idleSnow, idle_with_rain: idleRain }),
      ],
      numbers: { snow_read_back: snowRead },
    };
  },
});
