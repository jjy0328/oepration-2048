const POWER_STEP = 256;
const ENEMY_FIRE_INTERVAL = 58;
const STARTING_LIFETIME_MS = 30000;
const ENEMY_TIME_STEP_MS = 10000;
const SCORE_TIME_BONUS_MS = 1000;
const WARNING_TIME_MS = 10000;
const HIT_DAMAGE_MS = 2500;
const ENEMY_RESPAWN_FRAMES = 76;
const NEXT_LEVEL_FRAMES = 108;
const ENEMY_SCORE_TARGETS = [1000, 1500, 2200, 3000];
const ENEMY_SCORE_TARGET_STEP = 800;

const ENEMY_THEMES = [
  {
    name: "VANGUARD",
    hull: "#d9e6ff",
    wing: "#91a3c8",
    core: "#69d2ff",
    flame: "#ff6f9f",
    shot: "#f2d46b",
    shotTrail: "#ff9b4a",
  },
  {
    name: "EMBER",
    hull: "#ffe0a3",
    wing: "#ff8c4a",
    core: "#ff2f4f",
    flame: "#f2d46b",
    shot: "#ff6f9f",
    shotTrail: "#ffd5dc",
  },
  {
    name: "NEBULA",
    hull: "#cbb8ff",
    wing: "#7ee6b8",
    core: "#d971b8",
    flame: "#69d2ff",
    shot: "#7ee6b8",
    shotTrail: "#69d2ff",
  },
  {
    name: "ONYX",
    hull: "#9ea7bd",
    wing: "#4a5b8c",
    core: "#f2d46b",
    flame: "#ff6f9f",
    shot: "#c8d8ff",
    shotTrail: "#91a3c8",
  },
];

export class ShooterBattle {
  constructor(canvas, powerElement, enemyHpElement, playerHpElement, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.powerElement = powerElement;
    this.enemyHpElement = enemyHpElement;
    this.playerHpElement = playerHpElement;
    this.onPlayerDestroyed = options.onPlayerDestroyed || (() => {});
    this.power = 1;
    this.score = 0;
    this.playerX = canvas.width / 2;
    this.playerY = 352;
    this.remainingLifeMs = STARTING_LIFETIME_MS;
    this.playerDestroyed = false;
    this.paused = false;
    this.stopped = false;
    this.autoEvade = true;
    this.keyboardControlFrames = 0;
    this.playerHitFrames = 0;
    this.screenShakeFrames = 0;
    this.frame = 0;
    this.missiles = [];
    this.enemyShots = [];
    this.explosions = [];
    this.impactSparks = [];
    this.stars = this.createStars(95);
    this.enemyIndex = 0;
    this.enemyTheme = ENEMY_THEMES[0];
    this.enemyHp = 1;
    this.enemyMaxLifeMs = STARTING_LIFETIME_MS;
    this.enemyStartScore = 0;
    this.enemyScoreTarget = this.getEnemyScoreTarget(0);
    this.enemyDefeated = false;
    this.enemyFallY = 0;
    this.enemyRespawnFrames = 0;
    this.nextLevelFrames = 0;
    this.lastTime = 0;
    this.loop = this.loop.bind(this);
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  reset() {
    this.power = 1;
    this.score = 0;
    this.frame = 0;
    this.missiles = [];
    this.enemyShots = [];
    this.explosions = [];
    this.impactSparks = [];
    this.enemyIndex = 0;
    this.playerX = this.canvas.width / 2;
    this.playerY = 352;
    this.startEnemy(0);
    this.playerDestroyed = false;
    this.paused = false;
    this.stopped = false;
    this.autoEvade = true;
    this.keyboardControlFrames = 0;
    this.playerHitFrames = 0;
    this.screenShakeFrames = 0;
    this.nextLevelFrames = 0;
    this.updatePowerText();
    this.updateHpBars();
  }

  movePlayer(x, y) {
    this.playerX = Math.min(this.canvas.width - 30, Math.max(30, x));
    this.playerY = Math.min(this.canvas.height - 56, Math.max(210, y));
  }

  nudgePlayer(direction) {
    if (this.playerDestroyed || this.paused || this.stopped) return;

    const distance = 34;
    const movement = {
      L: [-distance, 0],
      R: [distance, 0],
      U: [0, -distance],
      D: [0, distance],
    }[direction];

    if (!movement) return;

    this.movePlayer(this.playerX + movement[0], this.playerY + movement[1]);
    this.keyboardControlFrames = 22;
  }

  setScore(score, gained = 0) {
    this.score = score;
    this.power = Math.min(9, Math.floor(score / POWER_STEP) + 1);
    this.updatePowerText();

    if (gained > 0) {
      this.remainingLifeMs = Math.min(
        this.enemyMaxLifeMs,
        this.remainingLifeMs + SCORE_TIME_BONUS_MS,
      );
      this.fireBurst(gained);
      this.updateEnemyScoreProgress();
    }
  }

  startEnemy(index) {
    this.enemyIndex = index;
    this.enemyTheme = ENEMY_THEMES[index % ENEMY_THEMES.length];
    this.enemyHp = 1;
    this.enemyMaxLifeMs = STARTING_LIFETIME_MS + index * ENEMY_TIME_STEP_MS;
    this.enemyStartScore = this.score;
    this.enemyScoreTarget = this.getEnemyScoreTarget(index);
    this.remainingLifeMs = this.enemyMaxLifeMs;
    this.enemyDefeated = false;
    this.enemyFallY = 0;
    this.enemyRespawnFrames = 0;
    this.nextLevelFrames = index > 0 ? NEXT_LEVEL_FRAMES : 0;
    this.enemyShots = [];
    this.updateHpBars();
  }

  getEnemyScoreTarget(index) {
    if (index < ENEMY_SCORE_TARGETS.length) {
      return ENEMY_SCORE_TARGETS[index];
    }

    return (
      ENEMY_SCORE_TARGETS[ENEMY_SCORE_TARGETS.length - 1] +
      (index - ENEMY_SCORE_TARGETS.length + 1) * ENEMY_SCORE_TARGET_STEP
    );
  }

  createStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() < 0.82 ? 1 : 2,
      speed: 0.25 + Math.random() * 1.2,
      color: Math.random() < 0.12 ? "#69d2ff" : "#ffffff",
    }));
  }

  updatePowerText() {
    this.powerElement.textContent = `LV ${this.power}`;
  }

  updateHpBars() {
    this.enemyHpElement.style.width = `${Math.round(this.enemyHp * 100)}%`;
    this.enemyHpElement.style.background = `linear-gradient(90deg, ${this.enemyTheme.core}, ${this.enemyTheme.flame})`;
    const lifeRatio = Math.min(1, this.remainingLifeMs / this.enemyMaxLifeMs);
    this.playerHpElement.style.width = `${Math.round(lifeRatio * 100)}%`;
    this.playerHpElement.style.background =
      this.remainingLifeMs <= WARNING_TIME_MS
        ? "linear-gradient(90deg, #ff2f4f, #ff9b4a)"
        : "linear-gradient(90deg, #69d2ff, #eaf2ff)";
  }

  fireBurst(gained) {
    const count = Math.min(8, Math.max(2, Math.floor(Math.log2(gained)) + 1));
    const center = this.playerX;
    const spread = Math.min(96, 16 + this.power * 8);

    for (let i = 0; i < count; i++) {
      const ratio = count === 1 ? 0 : i / (count - 1) - 0.5;
      this.spawnMissile(center + ratio * spread, this.playerY - 20, ratio * 0.9);
    }
  }

  spawnMissile(x, y, drift = 0) {
    this.missiles.push({
      x,
      y,
      drift,
      speed: 4.7 + this.power * 0.55,
      width: 3 + Math.floor(this.power / 3),
      height: 12 + this.power,
      color: this.power >= 7 ? "#ff6f9f" : this.power >= 4 ? "#f2d46b" : "#69d2ff",
    });
  }

  spawnEnemyShot() {
    this.enemyShots.push({
      x: 44 + Math.random() * (this.canvas.width - 88),
      y: 96 + Math.random() * 60,
      speed: 1.9 + Math.random() * 1,
      size: 3 + Math.random() * 2,
      color: this.enemyTheme.shot,
      trail: this.enemyTheme.shotTrail,
    });
  }

  loop(time) {
    const delta = Math.min(32, time - this.lastTime || 16);
    this.lastTime = time;

    if (!this.paused && !this.stopped) {
      this.frame += delta / 16.67;
      this.update(delta);
    }

    this.draw();

    requestAnimationFrame(this.loop);
  }

  setPaused(paused) {
    this.paused = paused;
  }

  stop() {
    this.stopped = true;
  }

  update(delta) {
    if (this.enemyDefeated) {
      this.updateEnemyDefeat();
    }

    this.updateLifeTimer(delta);

    const autoFireRate = Math.max(8, 25 - this.power * 2);

    if (!this.playerDestroyed && !this.enemyDefeated && Math.floor(this.frame) % autoFireRate === 0) {
      this.spawnMissile(this.playerX, this.playerY - 20);
    }

    if (!this.playerDestroyed && !this.enemyDefeated && Math.floor(this.frame) % ENEMY_FIRE_INTERVAL === 0) {
      this.spawnEnemyShot();
    }

    this.updateAutoEvade();

    this.stars.forEach((star) => {
      star.y += star.speed / this.canvas.height;

      if (star.y > 1) {
        star.x = Math.random();
        star.y = 0;
      }
    });

    this.missiles.forEach((missile) => {
      missile.x += missile.drift;
      missile.y -= missile.speed;

      if (this.isEnemyHit(missile)) {
        this.explosions.push({
          x: missile.x,
          y: missile.y,
          radius: 4 + this.power,
          life: 18,
          color: missile.color,
        });
        missile.y = -40;
      }
    });

    this.enemyShots.forEach((shot) => {
      shot.y += shot.speed;

      if (this.isPlayerHit(shot)) {
        this.damageLife(HIT_DAMAGE_MS);
        this.spawnPlayerHitEffect(shot.x, shot.y);
        this.explosions.push({
          x: shot.x,
          y: shot.y,
          radius: 8,
          life: 22,
          color: "#ff6f9f",
        });
        shot.y = this.canvas.height + 40;
      }
    });

    this.explosions.forEach((explosion) => {
      explosion.life -= 1;
      explosion.radius += 0.6;
    });

    this.impactSparks.forEach((spark) => {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 1;
    });

    if (this.playerHitFrames > 0) {
      this.playerHitFrames -= 1;
    }

    if (this.screenShakeFrames > 0) {
      this.screenShakeFrames -= 1;
    }

    if (this.nextLevelFrames > 0) {
      this.nextLevelFrames -= 1;
    }

    this.missiles = this.missiles.filter((missile) => missile.y > -30);
    this.enemyShots = this.enemyShots.filter((shot) => shot.y < this.canvas.height + 20);
    this.explosions = this.explosions.filter((explosion) => explosion.life > 0);
    this.impactSparks = this.impactSparks.filter((spark) => spark.life > 0);
  }

  updateEnemyDefeat() {
    if (!this.enemyDefeated) return;

    this.enemyRespawnFrames -= 1;
    const fallProgress = 1 - Math.max(0, this.enemyRespawnFrames) / ENEMY_RESPAWN_FRAMES;
    this.enemyFallY = fallProgress * fallProgress * (this.canvas.height + 120);

    if (Math.floor(this.enemyRespawnFrames) % 5 === 0) {
      this.impactSparks.push({
        x: this.canvas.width / 2 - 44 + Math.random() * 88,
        y: 92 + Math.min(this.enemyFallY, this.canvas.height - 80),
        vx: -0.8 + Math.random() * 1.6,
        vy: -1.2 - Math.random() * 1.4,
        life: 18,
        color: Math.random() < 0.5 ? this.enemyTheme.flame : this.enemyTheme.core,
      });
    }

    if (this.enemyRespawnFrames <= 0) {
      this.startEnemy(this.enemyIndex + 1);
    }
  }

  updateEnemyScoreProgress() {
    if (this.enemyDefeated || this.playerDestroyed || this.stopped) return;

    const progress = Math.max(0, this.score - this.enemyStartScore);
    this.enemyHp = Math.max(0, 1 - progress / this.enemyScoreTarget);
    this.updateHpBars();

    if (progress >= this.enemyScoreTarget) {
      this.destroyEnemy();
    }
  }

  destroyEnemy() {
    if (this.enemyDefeated) return;

    this.enemyHp = 0;
    this.updateHpBars();
    this.enemyDefeated = true;
    this.enemyFallY = 0;
    this.enemyRespawnFrames = ENEMY_RESPAWN_FRAMES;
    this.enemyShots = [];

    for (let i = 0; i < 12; i++) {
      this.explosions.push({
        x: this.canvas.width / 2 - 72 + Math.random() * 144,
        y: 70 + Math.random() * 54,
        radius: 7 + Math.random() * 8,
        life: 24 + Math.floor(Math.random() * 16),
        color: i % 2 === 0 ? this.enemyTheme.flame : this.enemyTheme.core,
      });
    }
  }

  isEnemyHit(missile) {
    if (this.enemyDefeated) return false;

    const x = this.canvas.width / 2;
    const y = 86 + Math.sin(this.frame / 42) * 8;

    return missile.y < y + 42 && missile.y > y - 34 && Math.abs(missile.x - x) < 72;
  }

  updateAutoEvade() {
    if (!this.autoEvade || this.playerDestroyed) return;

    if (this.keyboardControlFrames > 0) {
      this.keyboardControlFrames -= 1;
      return;
    }

    const targetX = this.findSafePlayerX();
    const step = 3;
    const distance = targetX - this.playerX;

    if (Math.abs(distance) <= step) {
      this.playerX = targetX;
      return;
    }

    this.playerX += Math.sign(distance) * step;
  }

  findSafePlayerX() {
    const candidates = [];

    for (let x = 34; x <= this.canvas.width - 34; x += 18) {
      candidates.push(x);
    }

    let bestX = this.playerX;
    let bestScore = Number.POSITIVE_INFINITY;

    candidates.forEach((x) => {
      let danger = Math.abs(x - this.canvas.width / 2) * 0.08;

      this.enemyShots.forEach((shot) => {
        if (shot.y < 130 || shot.y > this.playerY + 34) return;

        const horizontalThreat = Math.max(0, 72 - Math.abs(x - shot.x));
        const verticalThreat = Math.max(0.25, 1 - Math.abs(this.playerY - shot.y) / 230);
        danger += horizontalThreat * horizontalThreat * verticalThreat;
      });

      if (danger < bestScore) {
        bestScore = danger;
        bestX = x;
      }
    });

    return bestX;
  }

  spawnPlayerHitEffect(x, y) {
    this.playerHitFrames = 16;
    this.screenShakeFrames = 10;

    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 1.2 + Math.random() * 2.3;

      this.impactSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 14 + Math.floor(Math.random() * 10),
        color: i % 2 === 0 ? "#ff2f4f" : "#ffd5dc",
      });
    }
  }

  isPlayerHit(shot) {
    return (
      shot.x + shot.size >= this.playerX - 28 &&
      shot.x <= this.playerX + 28 &&
      shot.y + shot.size >= this.playerY - 28 &&
      shot.y <= this.playerY + 20
    );
  }

  updateLifeTimer(delta) {
    if (this.playerDestroyed || this.enemyDefeated) return;

    this.damageLife(delta);
  }

  damageLife(amount) {
    if (this.playerDestroyed) return;

    this.remainingLifeMs = Math.max(0, this.remainingLifeMs - amount);
    this.updateHpBars();

    if (this.remainingLifeMs === 0) {
      this.playerDestroyed = true;
      this.stop();
      this.onPlayerDestroyed();
    }
  }

  draw() {
    const { ctx } = this;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    if (this.screenShakeFrames > 0) {
      const shake = this.screenShakeFrames % 2 === 0 ? 2 : -2;
      ctx.translate(shake, 0);
    }

    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, width, height);
    this.drawStars();
    this.drawEnemy();
    this.drawEnemyShots();
    this.drawMissiles();
    this.drawExplosions();
    this.drawImpactSparks();
    this.drawPlayer();
    this.drawNextLevelBanner();
    this.drawScanlines();
    ctx.restore();
  }

  drawStars() {
    const { ctx } = this;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.stars.forEach((star) => {
      ctx.fillStyle = star.color;
      ctx.fillRect(Math.floor(star.x * width), Math.floor(star.y * height), star.size, star.size);
    });
  }

  drawEnemy() {
    const { ctx } = this;
    const x = this.canvas.width / 2;
    const y = 86 + Math.sin(this.frame / 42) * 8 + this.enemyFallY;
    const theme = this.enemyTheme;

    ctx.save();
    ctx.translate(x, y);

    if (this.enemyDefeated) {
      const fallProgress = 1 - Math.max(0, this.enemyRespawnFrames) / ENEMY_RESPAWN_FRAMES;
      ctx.globalAlpha = fallProgress < 0.72 ? 1 : Math.max(0, 1 - (fallProgress - 0.72) / 0.28);
      ctx.rotate(0.12 + fallProgress * 0.55 + Math.sin(this.frame / 5) * 0.08);
    }

    ctx.fillStyle = theme.hull;
    ctx.fillRect(-44, -8, 88, 15);
    ctx.fillRect(-18, -24, 36, 42);
    ctx.fillStyle = theme.wing;
    ctx.fillRect(-62, -2, 22, 10);
    ctx.fillRect(40, -2, 22, 10);
    ctx.fillStyle = "#050711";
    ctx.fillRect(-8, -15, 16, 10);
    ctx.fillStyle = theme.flame;
    ctx.fillRect(-3, 18, 6, 10);
    ctx.fillStyle = theme.core;
    ctx.fillRect(-12, 1, 24, 5);
    ctx.restore();
  }

  drawNextLevelBanner() {
    if (this.nextLevelFrames <= 0) return;

    const { ctx } = this;
    const progress = 1 - this.nextLevelFrames / NEXT_LEVEL_FRAMES;
    const alpha =
      progress < 0.18
        ? progress / 0.18
        : progress > 0.74
          ? Math.max(0, 1 - (progress - 0.74) / 0.26)
          : 1;
    const y = 166 - Math.sin(progress * Math.PI) * 8;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(5, 7, 17, 0.82)";
    ctx.fillRect(58, y - 28, this.canvas.width - 116, 56);
    ctx.strokeStyle = this.enemyTheme.core;
    ctx.lineWidth = 3;
    ctx.strokeRect(62, y - 24, this.canvas.width - 124, 48);
    ctx.fillStyle = "#f2d46b";
    ctx.font = "900 28px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NEXT LEVEL", this.canvas.width / 2, y - 3);
    ctx.fillStyle = this.enemyTheme.core;
    ctx.font = "900 12px monospace";
    ctx.fillText(this.enemyTheme.name, this.canvas.width / 2, y + 18);
    ctx.restore();
  }

  drawPlayer() {
    const { ctx } = this;
    const x = this.playerX;
    const y = this.playerY;
    const warning = !this.playerDestroyed && this.remainingLifeMs <= WARNING_TIME_MS;
    const hit = this.playerHitFrames > 0 && Math.floor(this.playerHitFrames / 2) % 2 === 0;
    const blinkOn = !warning || Math.floor(this.frame / 5) % 2 === 0;
    const hullColor = warning || hit ? "#ff2f4f" : "#69d2ff";
    const bodyColor = warning || hit ? "#ffd5dc" : "#eaf2ff";
    const wingColor = warning || hit ? "#ff6f9f" : "#91a3c8";

    if (!blinkOn) {
      ctx.globalAlpha = 0.28;
    }

    ctx.fillStyle = hullColor;
    ctx.fillRect(x - 5, y - 28, 10, 34);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - 14, y - 12, 28, 16);
    ctx.fillStyle = wingColor;
    ctx.fillRect(x - 28, y, 20, 8);
    ctx.fillRect(x + 8, y, 20, 8);
    ctx.fillStyle = "#f2d46b";
    ctx.fillRect(x - 4, y + 8, 8, 12 + Math.sin(this.frame / 3) * 3);
    ctx.globalAlpha = 1;
  }

  drawMissiles() {
    const { ctx } = this;

    this.missiles.forEach((missile) => {
      ctx.fillStyle = missile.color;
      ctx.fillRect(
        Math.floor(missile.x - missile.width / 2),
        Math.floor(missile.y - missile.height),
        missile.width,
        missile.height,
      );
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.floor(missile.x - 1), Math.floor(missile.y - missile.height - 4), 2, 4);
    });
  }

  drawEnemyShots() {
    const { ctx } = this;

    this.enemyShots.forEach((shot) => {
      ctx.fillStyle = shot.color;
      ctx.fillRect(Math.floor(shot.x), Math.floor(shot.y), shot.size, shot.size);
      ctx.fillStyle = shot.trail;
      ctx.fillRect(Math.floor(shot.x - 1), Math.floor(shot.y + shot.size), shot.size + 2, 2);
    });
  }

  drawExplosions() {
    const { ctx } = this;

    this.explosions.forEach((explosion) => {
      ctx.globalAlpha = Math.max(0, explosion.life / 18);
      ctx.strokeStyle = explosion.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        explosion.x - explosion.radius,
        explosion.y - explosion.radius,
        explosion.radius * 2,
        explosion.radius * 2,
      );
      ctx.globalAlpha = 1;
    });
  }

  drawImpactSparks() {
    const { ctx } = this;

    this.impactSparks.forEach((spark) => {
      ctx.globalAlpha = Math.max(0, spark.life / 22);
      ctx.fillStyle = spark.color;
      ctx.fillRect(Math.floor(spark.x), Math.floor(spark.y), 3, 3);
      ctx.globalAlpha = 1;
    });
  }

  drawScanlines() {
    const { ctx } = this;

    ctx.fillStyle = "rgba(105, 210, 255, 0.05)";
    for (let y = 0; y < this.canvas.height; y += 6) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
  }
}
