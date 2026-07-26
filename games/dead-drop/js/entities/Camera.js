// Advances one camera by exactly one rotation step, in place, per the turn engine.
// mode: 'continuous' free-runs the full sequence; 'pause' holds at each index for
// pauseDuration turns before advancing; 'sweep' bounces back and forth across the
// sequence instead of wrapping (a shorter oscillation, e.g. N<->E only).
export function advanceCamera(camera, cameraDef) {
  const seqLen = cameraDef.sequence.length;
  if (seqLen <= 1) return camera;

  if (cameraDef.mode === 'sweep') {
    let next = camera.sequenceIndex + camera.sweepDirection;
    if (next < 0 || next >= seqLen) {
      camera.sweepDirection *= -1;
      next = camera.sequenceIndex + camera.sweepDirection;
    }
    camera.sequenceIndex = next;
    return camera;
  }

  if (cameraDef.mode === 'pause') {
    if (camera.pauseTimer > 0) {
      camera.pauseTimer -= 1;
      return camera;
    }
    camera.sequenceIndex = (camera.sequenceIndex + 1) % seqLen;
    if (cameraDef.pauseDuration > 0) camera.pauseTimer = cameraDef.pauseDuration;
    return camera;
  }

  // continuous
  camera.sequenceIndex = (camera.sequenceIndex + 1) % seqLen;
  return camera;
}
