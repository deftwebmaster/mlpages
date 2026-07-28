import { TILE_WIDTH, TILE_HEIGHT, FLOOR_TYPES, COLORS, CONVEYOR_TIERS, DIRECTION_VECTORS, ITEM_RADIUS_SCALE } from './constants.js';
import { PLACEABLE_TYPES } from '../entities/placedObject.js';
import { machineUtilizationColor, beltCongestionColor } from './analysis.js';

// Canvas 2D isometric renderer. Fixed render order per spec Part 6:
// Floor -> Decorations -> Belts -> Items -> Machines -> Effects -> Lighting.
// (Decorations are a no-op — no decoration data exists yet.)
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  resize() {
    const { clientWidth, clientHeight } = this.canvas;
    this.canvas.width = clientWidth * this.dpr;
    this.canvas.height = clientHeight * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.viewW = clientWidth;
    this.viewH = clientHeight;
  }

  // Determine the tile range currently visible, with a small margin, so we
  // never iterate the full grid regardless of factory size.
  visibleTileRange(camera, grid) {
    const corners = [
      camera.screenToTile(0, 0, this.viewW, this.viewH),
      camera.screenToTile(this.viewW, 0, this.viewW, this.viewH),
      camera.screenToTile(0, this.viewH, this.viewW, this.viewH),
      camera.screenToTile(this.viewW, this.viewH, this.viewW, this.viewH),
    ];
    const margin = 2;
    const minX = Math.max(0, Math.floor(Math.min(...corners.map(c => c.x)) - margin));
    const maxX = Math.min(grid.width - 1, Math.ceil(Math.max(...corners.map(c => c.x)) + margin));
    const minY = Math.max(0, Math.floor(Math.min(...corners.map(c => c.y)) - margin));
    const maxY = Math.min(grid.height - 1, Math.ceil(Math.max(...corners.map(c => c.y)) + margin));
    return { minX, maxX, minY, maxY };
  }

  drawDiamond(sx, sy, halfW, halfH, fill, stroke) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(sx, sy - halfH);
    ctx.lineTo(sx + halfW, sy);
    ctx.lineTo(sx, sy + halfH);
    ctx.lineTo(sx - halfW, sy);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  render({ grid, camera, placedObjects, conveyors, machines, machineDefs, recipes, items, preview, analysisMode }) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    ctx.fillStyle = COLORS.charcoal;
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    const halfW = (TILE_WIDTH / 2) * camera.zoom;
    const halfH = (TILE_HEIGHT / 2) * camera.zoom;
    const { minX, maxX, minY, maxY } = this.visibleTileRange(camera, grid);

    // --- Floor ---
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = grid.getTile(x, y);
        if (!tile) continue;
        const { x: sx, y: sy } = camera.tileToScreen(x, y, this.viewW, this.viewH);
        const def = FLOOR_TYPES[tile.floorType] || FLOOR_TYPES.concrete;
        this.drawDiamond(sx, sy, halfW, halfH, def.color, 'rgba(0,0,0,0.25)');
        if (def.tint > 0) {
          this.drawDiamond(sx, sy, halfW, halfH, `rgba(90,60,30,${def.tint * 0.5})`, null);
        }
      }
    }

    // --- Decorations: none yet ---

    // --- Belts ---
    if (conveyors) {
      const animOffset = (performance.now() / 900) % 1; // idle creep so belts never look dead
      for (const conveyor of conveyors.values()) {
        const { x: sx, y: sy } = camera.tileToScreen(conveyor.x, conveyor.y, this.viewW, this.viewH);
        this.drawConveyor(sx, sy, halfW, halfH, conveyor.rotation, animOffset, analysisMode ? conveyor.utilization : null);
      }
    }

    // --- Items ---
    if (items && conveyors) {
      for (const item of items.values()) {
        const conveyor = conveyors.get(item.conveyorId);
        if (!conveyor) continue;
        const { dx, dy } = DIRECTION_VECTORS[conveyor.rotation];
        const worldX = conveyor.x + dx * item.progress;
        const worldY = conveyor.y + dy * item.progress;
        const { x: sx, y: sy } = camera.tileToScreen(worldX, worldY, this.viewW, this.viewH);
        this.drawItem(sx, sy, Math.min(halfW, halfH) * ITEM_RADIUS_SCALE);
      }
    }

    // --- Machines ---
    if (machines && machineDefs) {
      for (const machine of machines.values()) {
        const def = machineDefs[machine.type];
        const recipe = def && recipes?.[def.recipe];
        const { x: sx, y: sy } = camera.tileToScreen(machine.x, machine.y, this.viewW, this.viewH);
        this.drawMachine(sx, sy, halfW, halfH, def, recipe, machine, camera.zoom, analysisMode);
      }
    }

    // --- Buildings (Sink and other non-machine placed objects) ---
    for (const obj of placedObjects) {
      const [fw, fh] = obj.rotatedFootprint;
      const centerX = obj.x + fw / 2 - 0.5;
      const centerY = obj.y + fh / 2 - 0.5;
      const { x: sx, y: sy } = camera.tileToScreen(centerX, centerY, this.viewW, this.viewH);
      const def = PLACEABLE_TYPES[obj.type];
      this.drawPlacedObject(sx, sy, halfW * fw, halfH * fh, def?.color || COLORS.orange, obj.rotation, camera.zoom);
    }

    // --- Effects: none yet ---

    // --- Preview (build mode ghost) ---
    if (preview) {
      const [fw, fh] = preview.rotatedFootprint;
      const centerX = preview.x + fw / 2 - 0.5;
      const centerY = preview.y + fh / 2 - 0.5;
      const { x: sx, y: sy } = camera.tileToScreen(centerX, centerY, this.viewW, this.viewH);
      const color = preview.valid ? COLORS.cyan : COLORS.red;
      ctx.globalAlpha = 0.55;
      this.drawPlacedObject(sx, sy, halfW * fw, halfH * fh, color, preview.rotation, camera.zoom);
      ctx.globalAlpha = 1;
    }

    // --- Lighting: ambient darkening for the "abandoned" look, deepened
    // further in Analysis Mode so the factory reads as "engineering
    // dashboard" per spec ("factory darkens slightly" when activated).
    const darkness = analysisMode ? 0.6 : 0.35;
    const gradient = ctx.createRadialGradient(
      this.viewW / 2, this.viewH / 2, Math.min(this.viewW, this.viewH) * 0.25,
      this.viewW / 2, this.viewH / 2, Math.max(this.viewW, this.viewH) * 0.75
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${darkness})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
  }

  drawConveyor(sx, sy, halfW, halfH, rotation, animOffset, utilization) {
    const ctx = this.ctx;
    const tier = CONVEYOR_TIERS.basic;
    const analysisColor = utilization !== null && utilization !== undefined ? beltCongestionColor(utilization) : null;
    // Low-profile lane (flatter than a full tile diamond) so belts read
    // distinctly from machines/buildings. In Analysis Mode the lane itself
    // tints toward the congestion color, not just the chevrons.
    this.drawDiamond(sx, sy, halfW * 0.82, halfH * 0.5, analysisColor ? `${analysisColor}33` : 'rgba(30,34,38,0.9)', 'rgba(0,0,0,0.35)');

    // Screen-space direction must use the same iso projection as
    // tileToScreen (screenDelta = (dx-dy)*halfW, (dx+dy)*halfH), not a
    // naive on-screen angle — otherwise the chevrons drift off the lane
    // instead of following the belt's actual direction.
    const { dx, dy } = DIRECTION_VECTORS[rotation] ?? DIRECTION_VECTORS[0];
    const dirX = dx - dy;
    const dirY = dx + dy;

    ctx.fillStyle = analysisColor || tier.color;
    ctx.globalAlpha = 0.85;
    const chevronCount = 3;
    for (let i = 0; i < chevronCount; i++) {
      const t = ((i / chevronCount) + animOffset) % 1;
      const cx = sx + dirX * halfW * 0.68 * (t - 0.5);
      const cy = sy + dirY * halfH * 0.68 * (t - 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, halfW * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawItem(sx, sy, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(2, radius), 0, Math.PI * 2);
    ctx.fillStyle = COLORS.amber;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // State-color tint per spec Part 2 ("each state has unique colors").
  // In Analysis Mode, the tint switches to utilization color (Milestone 5)
  // instead of workflow state — see src/analysis.js. Heat/maintenance
  // states are still out of scope.
  drawMachine(sx, sy, halfW, halfH, def, recipe, machine, zoom, analysisMode) {
    const ctx = this.ctx;
    const pad = 0.1;
    const bodyColor = def?.color || COLORS.orange;
    const behavior = def?.behavior || 'recipe';

    // Unpowered machines dim out entirely rather than showing a colored
    // tint — reads clearly as "off" instead of just another work state.
    // Analysis Mode skips the dimming: it communicates state through the
    // utilization color (red for blocked/unpowered) instead of transparency.
    const dimmed = !analysisMode && behavior === 'recipe' && machine.state === 'power_loss';
    if (dimmed) ctx.globalAlpha = 0.45;

    this.drawDiamond(sx, sy, halfW * (1 - pad), halfH * (1 - pad), bodyColor, 'rgba(0,0,0,0.45)');

    if (behavior === 'recipe' && !dimmed) {
      let tint, innerScale;
      if (analysisMode) {
        tint = machineUtilizationColor(machine.utilization, machine.state);
        innerScale = 0.3 + 0.55 * machine.utilization;
      } else {
        const stateTints = {
          idle: 'rgba(139,146,156,0.5)',
          waiting_for_input: 'rgba(245,197,66,0.55)',
          processing: 'rgba(255,145,66,0.7)',
          waiting_for_output: 'rgba(229,72,77,0.7)',
        };
        tint = stateTints[machine.state] || stateTints.idle;
        // While processing, the inner tint grows toward full size as the
        // recipe nears completion — free "how close is it done" feedback.
        innerScale = 0.72;
        if (machine.state === 'processing' && recipe?.time) {
          innerScale = 0.3 + 0.55 * Math.min(1, machine.processTimer / recipe.time);
        }
      }
      this.drawDiamond(sx, sy, halfW * (1 - pad) * innerScale, halfH * (1 - pad) * innerScale, tint, null);
    } else if (behavior === 'storage') {
      // No workflow states for storage — the inner diamond is just a fill gauge.
      const total = Object.values(machine.outputBuffer || {}).reduce((sum, n) => sum + n, 0);
      const fill = def?.capacity ? Math.min(1, total / def.capacity) : 0;
      const innerScale = 0.22 + 0.68 * fill;
      this.drawDiamond(sx, sy, halfW * (1 - pad) * innerScale, halfH * (1 - pad) * innerScale, 'rgba(224,229,233,0.55)', null);
    }
    // 'generator': flat body color only, no inner tint — always producing
    // in this milestone (no fuel/heat model yet).

    const { dx, dy } = DIRECTION_VECTORS[machine.rotation] ?? DIRECTION_VECTORS[0];
    ctx.strokeStyle = 'rgba(10,12,14,0.85)';
    ctx.lineWidth = Math.max(1.5, 2 * zoom);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (dx - dy) * halfW * 0.42, sy + (dx + dy) * halfH * 0.42);
    ctx.stroke();

    if (dimmed) ctx.globalAlpha = 1;
  }

  drawPlacedObject(sx, sy, halfW, halfH, color, rotation, zoom) {
    const ctx = this.ctx;
    const pad = 0.12;
    this.drawDiamond(sx, sy, halfW * (1 - pad), halfH * (1 - pad), color, 'rgba(0,0,0,0.4)');
    // Direction indicator so rotation is visually obvious. Uses the same
    // iso screen-projection as tileToScreen/drawConveyor (see note there)
    // so it points the same way the object actually feeds/faces.
    const { dx, dy } = DIRECTION_VECTORS[rotation] ?? DIRECTION_VECTORS[0];
    const len = 0.42;
    ctx.strokeStyle = 'rgba(10,12,14,0.85)';
    ctx.lineWidth = Math.max(1.5, 2 * zoom);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (dx - dy) * halfW * len, sy + (dx + dy) * halfH * len);
    ctx.stroke();
  }
}
