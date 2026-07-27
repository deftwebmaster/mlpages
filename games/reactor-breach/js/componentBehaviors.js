import { CONFIG } from './config.js';

// Handles the special side effects of destroying/ticking advanced components:
// conduit power-cuts, volatile chain explosions, and corruption spread.

export function handleDestruction(component, ctx) {
  const { connectionGraph, particles } = ctx;

  if (component.typeDef.isConduit) {
    connectionGraph.onSourceDestroyed(component.id, {
      onDisabled: (target) => {
        particles.burst(target.x, target.y, 8, { color: '#3fd0ff', shape: 'square', minSpeed: 20 });
      }
    });
  }

  if (component.typeDef.isVolatile) {
    explodeVolatile(component, ctx);
  }
}

function explodeVolatile(component, ctx) {
  const { components, particles, audio, orbs, chainDepth = 0, onVolatileChain } = ctx;
  audio?.play('explosion');
  particles.burst(component.x, component.y, 26, {
    color: '#ff9d3f',
    shape: 'circle',
    minSpeed: 80,
    speedRange: 220,
    lifeRange: 0.5
  });

  const radius = CONFIG.orb.explosiveRadius * 1.4;
  for (const other of components) {
    if (other === component || other.destroyed) continue;
    const dx = other.x - component.x;
    const dy = other.y - component.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= radius) {
      const destroyed = other.damage(2, { pierceOrExplosive: true });
      if (destroyed) {
        ctx.onComponentDestroyed?.(other);
        if (other.typeDef.isVolatile && chainDepth < 6) {
          onVolatileChain?.();
          explodeVolatile(other, { ...ctx, chainDepth: chainDepth + 1 });
        } else {
          handleDestruction(other, ctx);
        }
      }
    }
  }

  // Push nearby orbs outward for readable feedback.
  for (const orb of orbs || []) {
    const dx = orb.x - component.x;
    const dy = orb.y - component.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist <= radius * 1.3) {
      const push = Math.max(0, (radius * 1.3 - dist) / (radius * 1.3)) * 220;
      orb.vx += (dx / dist) * push;
      orb.vy += (dy / dist) * push;
    }
  }
}

// Corruption nodes spread into adjacent empty grid cells on a fixed timer.
// `emptyCellFinder(node)` returns the next candidate cell (deterministic) or null.
export function updateCorruption(component, dt, ctx) {
  if (component.destroyed || !component.typeDef.isCorruption) return;
  component.corruptionSpreadTimer -= dt;
  component.nextSpreadWarning = component.corruptionSpreadTimer <= 1.0;
  if (component.corruptionSpreadTimer <= 0) {
    component.corruptionSpreadTimer = component.behaviorConfig.spreadInterval || 5;
    ctx.onCorruptionSpread?.(component);
  }
}
