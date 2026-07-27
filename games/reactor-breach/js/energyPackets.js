import { CONFIG } from './config.js';
import { circleIntersectsRect } from './utils.js';

let packetSerial = 1;

export class EnergyPacket {
  constructor(x, y, value) {
    this.id = packetSerial++;
    this.x = x;
    this.y = y;
    this.vy = -40; // small pop before falling
    this.value = value;
    this.radius = value >= CONFIG.energy.coreFragment ? 8 : value >= CONFIG.energy.large ? 6 : value >= CONFIG.energy.medium ? 5 : 4;
    this.alive = true;
    this.age = 0;
  }
}

export class EnergyPacketManager {
  constructor(chamberWidth, chamberHeight) {
    this.chamberWidth = chamberWidth;
    this.chamberHeight = chamberHeight;
    this.packets = [];
  }

  setChamberSize(w, h) {
    this.chamberWidth = w;
    this.chamberHeight = h;
  }

  spawnFromComponent(component) {
    const value = component.energyValue();
    if (value <= 0) return;
    this.packets.push(new EnergyPacket(component.x, component.y, value));
  }

  update(dt, deflector, world) {
    let collected = 0;
    let missed = 0;
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      p.age += dt;
      p.vy += CONFIG.energy.packetGravity * dt;
      p.vy = Math.min(p.vy, CONFIG.energy.packetFallSpeed);
      p.y += p.vy * dt;

      if (
        circleIntersectsRect(p.x, p.y, p.radius, deflector.left - 6, deflector.top - 6, deflector.width + 12, 14)
      ) {
        collected += p.value;
        world.audio?.play('energyCollect');
        world.particles.burst(p.x, p.y, 6, { color: '#5ad8ff', shape: 'circle', minSpeed: 30 });
        this.packets.splice(i, 1);
        continue;
      }

      if (p.y - p.radius > this.chamberHeight) {
        missed += p.value;
        this.packets.splice(i, 1);
      }
    }
    return { collected, missed };
  }

  clear() {
    this.packets.length = 0;
  }
}
