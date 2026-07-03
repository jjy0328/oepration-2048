const POWER_STEP = 256;
const ENEMY_FIRE_INTERVAL = 58;
const STARTING_LIFETIME_MS = 120000;
const SCORE_TIME_BONUS_MS = 1000;
const WARNING_TIME_MS = 10000;
const HIT_DAMAGE_MS = 2500;

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
    this.enemyHp = 0.64;
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
    this.enemyHp = 0.64;
    this.playerX = this.canvas.width / 2;
    this.playerY = 352;
    this.remainingLifeMs = STARTING_LIFETIME_MS;
    this.playerDestroyed = false;
    this.paused = false;
    this.stopped = false;
    this.autoEvade = true;
    this.keyboardControlFrames = 0;
    this.playerHitFrames = 0;
    this.screenShakeFrames = 0;
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
        STARTING_LIFETIME_MS,
        this.remainingLifeMs + SCORE_TIME_BONUS_MS,
      );
      this.fireBurst(gained);
      this.enemyHp = Math.max(0.08, this.enemyHp - Math.min(0.18, gained / 4096));
      this.updateHpBars();
    }
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
    const lifeRatio = Math.min(1, this.remainingLifeMs / STARTING_LIFETIME_MS);
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
    this.updateLifeTimer(delta);

    const autoFireRate = Math.max(8, 25 - this.power * 2);

    if (!this.playerDestroyed && Math.floor(this.frame) % autoFireRate === 0) {
      this.spawnMissile(this.playerX, this.playerY - 20);
    }

    if (!this.playerDestroyed && Math.floor(this.frame) % ENEMY_FIRE_INTERVAL === 0) {
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

      if (missile.y < 118 && Math.abs(missile.x - this.canvas.width / 2) < 118) {
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

    this.missiles = this.missiles.filter((missile) => missile.y > -30);
    this.enemyShots = this.enemyShots.filter((shot) => shot.y < this.canvas.height + 20);
    this.explosions = this.explosions.filter((explosion) => explosion.life > 0);
    this.impactSparks = this.impactSparks.filter((spark) => spark.life > 0);
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
    if (this.playerDestroyed) return;

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
    const y = 86 + Math.sin(this.frame / 42) * 8;

    ctx.fillStyle = "#d9e6ff";
    ctx.fillRect(x - 44, y - 8, 88, 15);
    ctx.fillRect(x - 18, y - 24, 36, 42);
    ctx.fillStyle = "#91a3c8";
    ctx.fillRect(x - 62, y - 2, 22, 10);
    ctx.fillRect(x + 40, y - 2, 22, 10);
    ctx.fillStyle = "#050711";
    ctx.fillRect(x - 8, y - 15, 16, 10);
    ctx.fillStyle = "#ff6f9f";
    ctx.fillRect(x - 3, y + 18, 6, 10);
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
      ctx.fillStyle = "#f2d46b";
      ctx.fillRect(Math.floor(shot.x), Math.floor(shot.y), shot.size, shot.size);
      ctx.fillStyle = "#ff9b4a";
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
