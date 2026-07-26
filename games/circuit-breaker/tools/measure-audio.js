/**
 * Audio level check.
 *
 * Paste into the browser console on the running game, or run it from a test
 * harness. It renders every voice offline (no user gesture needed) and reports
 * peak, RMS and audible duration so levels can be balanced objectively.
 *
 * What it can prove: nothing clips, voices sit at comparable loudness, and no
 * sound outlasts the animation it accompanies.
 * What it cannot judge: whether the sounds are *nice*. That needs ears.
 */

export async function measureAudio(audio, { verbose = true } = {}) {
  const rows = [];

  for (const name of audio.voiceNames) {
    const buffer = await audio.render(name, 3, { seconds: 2.5 });
    if (!buffer) continue;
    const data = buffer.getChannelData(0);

    let peak = 0;
    let sumSquares = 0;
    let lastAudible = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
      sumSquares += data[i] * data[i];
      if (v > 0.002) lastAudible = i;
    }
    const rms = Math.sqrt(sumSquares / data.length);

    rows.push({
      voice: name,
      peak: +peak.toFixed(3),
      peakDb: +(20 * Math.log10(peak || 1e-6)).toFixed(1),
      rmsDb: +(20 * Math.log10(rms || 1e-6)).toFixed(1),
      seconds: +(lastAudible / buffer.sampleRate).toFixed(2),
      clips: peak >= 1,
    });
  }

  const peaks = rows.map((r) => r.peakDb);
  const summary = {
    voices: rows.length,
    clipping: rows.filter((r) => r.clips).map((r) => r.voice),
    loudest: rows.reduce((a, b) => (a.peak > b.peak ? a : b)).voice,
    quietest: rows.reduce((a, b) => (a.peak < b.peak ? a : b)).voice,
    peakSpreadDb: +(Math.max(...peaks) - Math.min(...peaks)).toFixed(1),
    longest: rows.reduce((a, b) => (a.seconds > b.seconds ? a : b)),
  };

  if (verbose && typeof console !== 'undefined') {
    console.table(rows);
    console.log(summary);
  }
  return { rows, summary };
}
