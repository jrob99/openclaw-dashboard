// Virtual Office - Pixel Art Pokemon Wandering Agents
// Phaser 3 GameBoy-style office with wandering Pokemon NPCs tied to agent activity

var officeGame = null;
var officeScene = null;

// AGENTS with updated desk positions on floor
var AGENTS = {
  'Obi': { deskX: 240, deskY: 240, emoji: '🦉', pokeId: 25, pattern: 'main' }, // Pikachu
  'Devin': { deskX: 100, deskY: 200, emoji: '🛠️', pokeId: 4, pattern: 'dev' }, // Charmander
  'Dobby': { deskX: 380, deskY: 210, emoji: '🧦', pokeId: 7, pattern: 'subagent' }, // Squirtle
  'Rev': { deskX: 120, deskY: 280, emoji: '🔍', pokeId: 1, pattern: 'group' }, // Bulbasaur
  'Scout': { deskX: 400, deskY: 290, emoji: '🔭', pokeId: 132, pattern: 'cron' } // Ditto
};

function initOfficeGame() {
  if (officeGame || typeof Phaser === 'undefined') return;
  
  const config = {
    type: Phaser.CANVAS,
    width: 480,
    height: 360,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    parent: 'virtual-office-container',
    backgroundColor: '#1a1a2e',
    scene: { 
      preload: officePreload, 
      create: officeCreate, 
      update: officeUpdate 
    },
    scale: { 
      mode: Phaser.Scale.NONE 
    }
  };
  
  officeGame = new Phaser.Game(config);
  
  // Pixel perfect
  setTimeout(() => {
    const canvases = document.querySelectorAll('#virtual-office-container canvas');
    canvases.forEach(canvas => {
      canvas.style.imageRendering = 'pixelated';
      canvas.style.imageRendering = '-moz-crisp-edges';
      canvas.style.imageRendering = 'crisp-edges';
    });
  }, 100);
}

function officePreload() {
  Object.entries(AGENTS).forEach(([name, cfg]) => {
    if (cfg.pokeId) {
      this.load.image(`poke-${name.toLowerCase()}`, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${cfg.pokeId}.png`);
    }
  });
}

function officeCreate() {
  officeScene = this;
  
  // Floor tiles y > 140
  const tileSize = 32;
  for (let x = 0; x < 480; x += tileSize) {
    for (let y = 140; y < 360; y += tileSize) {
      const dark = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0);
      this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, dark ? 0x1e1e36 : 0x22223a);
    }
  }
  
  // Walls
  this.add.rectangle(240, 4, 480, 8, 0x2a2a4a); // top
  this.add.rectangle(240, 356, 480, 8, 0x2a2a4a); // bottom
  this.add.rectangle(4, 180, 8, 360, 0x2a2a4a); // left
  this.add.rectangle(476, 180, 8, 360, 0x2a2a4a); // right
  
  // Windows
  this.add.rectangle(100, 40, 80, 60, 0x87CEEB);
  this.add.rectangle(380, 40, 80, 60, 0x87CEEB);
  // blinds
  for (let i = 0; i < 7; i++) {
    this.add.rectangle(100 + i*11.5, 42, 8, 56, 0x708090 * 0.5);
    this.add.rectangle(380 + i*11.5, 42, 8, 56, 0x708090 * 0.5);
  }
  
  // Clock
  this.add.circle(240, 70, 15, 0x333333);
  this.add.rectangle(240, 70, 28, 2, 0x111);
  this.add.text(240, 71, '🕐', { fontSize: '18px' }).setOrigin(0.5);
  
  // Mission Board
  this.add.rectangle(240, 110, 160, 50, 0x3a3a5a);
  this.add.rectangle(240, 110, 152, 42, 0xdedede);
  this.add.text(240, 104, 'MISSION BOARD', { fontSize: '8px', fontFamily: 'monospace', color: '#333' }).setOrigin(0.5);
  this.add.text(240, 114, '• Pokemon wandering', { fontSize: '7px', fontFamily: 'monospace', color: '#555' }).setOrigin(0.5);
  this.add.text(240, 122, '• Collision avoidance', { fontSize: '7px', fontFamily: 'monospace', color: '#555' }).setOrigin(0.5);
  this.add.text(240, 130, '• Activity status', { fontSize: '7px', fontFamily: 'monospace', color: '#555' }).setOrigin(0.5);
  
  // Plants
  drawPlant(this, 40, 190);
  drawPlant(this, 440, 190);
  drawPlant(this, 40, 330);
  drawPlant(this, 440, 330);
  
  // Coffee machine
  this.add.rectangle(240, 308, 32, 24, 0x4a3728);
  this.add.rectangle(240, 304, 24, 6, 0x666);
  this.add.circle(248, 310, 3, 0xffa500);
  this.add.text(240, 320, '☕', { fontSize: '12px' }).setOrigin(0.5);
  
  // Obstacles
  let obstacles = [
    {x: 240, y: 135, w: 160, h: 50}, // mission board
    {x: 40, y: 200, w: 20, h: 35}, // plants adjusted centers
    {x: 440, y: 200, w: 20, h: 35},
    {x: 40, y: 342, w: 20, h: 35},
    {x: 440, y: 342, w: 20, h: 35},
    {x: 240, y: 320, w: 35, h: 25} // coffee
  ];
  
  // Desks & obstacles
  Object.entries(AGENTS).forEach(([name, cfg]) => {
    // Desk
    this.add.rectangle(cfg.deskX, cfg.deskY, 60, 24, 0x3d2b1f); // top
    this.add.rectangle(cfg.deskX, cfg.deskY + 10, 60, 14, 0x2d1f14); // front
    this.add.rectangle(cfg.deskX - 25, cfg.deskY + 20, 8, 18, 0x2d1f14); // legs
    this.add.rectangle(cfg.deskX + 25, cfg.deskY + 20, 8, 18, 0x2d1f14);
    
    // Monitor
    this.add.rectangle(cfg.deskX, cfg.deskY - 8, 24, 18, 0x333333);
    this.add.rectangle(cfg.deskX, cfg.deskY - 8, 20, 14, 0x4488ff);
    
    // Keyboard
    this.add.rectangle(cfg.deskX, cfg.deskY + 4, 42, 5, 0x222222);
    
    // Desk obstacle
    obstacles.push({x: cfg.deskX, y: cfg.deskY + 25, w: 70, h: 65});
  });
  
  this.obstacles = obstacles;
  this.walkBounds = {minX: 35, maxX: 445, minY: 155, maxY: 335};
  
  // Collision helpers
  this.isValidPos = function(x, y) {
    if (x < this.walkBounds.minX || x > this.walkBounds.maxX || 
        y < this.walkBounds.minY || y > this.walkBounds.maxY) return false;
    
    const hw = 28, hh = 35;
    const l = x - hw, r = x + hw, t = y - hh, b = y + hh;
    
    for (let o of this.obstacles) {
      const ol = o.x - o.w / 2, oor = o.x + o.w / 2;
      const ot = o.y - o.h / 2, ob = o.y + o.h / 2;
      if (r > ol && l < oor && b > ot && t < ob) return false;
    }
    return true;
  };
  
  this.pickValidTarget = function(currentX, currentY) {
    for (let i = 0; i < 30; i++) {
      let tx = this.walkBounds.minX + Math.random() * (this.walkBounds.maxX - this.walkBounds.minX);
      let ty = this.walkBounds.minY + Math.random() * (this.walkBounds.maxY - this.walkBounds.minY);
      if (this.isValidPos(tx, ty)) return {x: tx, y: ty};
    }
    // Fallback nearby
    for (let i = 0; i < 10; i++) {
      let angle = Math.random() * Math.PI * 2;
      let dist = 60 + Math.random() * 100;
      let tx = currentX + Math.cos(angle) * dist;
      let ty = currentY + Math.sin(angle) * dist;
      if (this.isValidPos(tx, ty)) return {x: tx, y: ty};
    }
    return {x: currentX, y: currentY};
  };
  
  // Agent data
  this.agentData = {};
  
  // State functions
  this.startIdle = function(data) {
    if (data.walkTween) {
      this.tweens.killTweensOf(data.container);
      data.walkTween = null;
    }
    data.state = 'idle';
    
    // Bounce tween
    if (data.idleTween) {
      this.tweens.killTweensOf(data.container);
    }
    data.idleTween = this.tweens.add({
      targets: data.container,
      y: data.baseY + 2,
      duration: 700 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Idle duration based on active
    let idleDur = data.active ? (1000 + Math.random() * 1000) : (4000 + Math.random() * 4000);
    data.idleEnd = this.time.now + idleDur;
  };
  
  this.startWalk = function(data, tx, ty) {
    if (data.idleTween) {
      this.tweens.killTweensOf(data.container);
      data.idleTween = null;
    }
    data.state = 'walking';
    
    let dist = Phaser.Math.Distance.Between(data.container.x, data.container.y, tx, ty);
    let duration = Math.max(800, Math.min(4000, (dist / 50) * 1000));
    
    data.walkTween = this.tweens.add({
      targets: data.container,
      x: tx,
      y: ty,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        data.walkTween = null;
        data.baseY = data.container.y;
        this.startIdle(data);
      }
    });
    
    // Flip sprite
    data.sprite.flipX = tx < data.container.x;
  };
  
  // Create agents
  Object.entries(AGENTS).forEach(([name, cfg]) => {
    const charGroup = this.add.container(cfg.deskX, cfg.deskY + 45);
    
    const pokeSprite = this.add.image(0, 0, `poke-${name.toLowerCase()}`)
      .setOrigin(0.5, 0.5)
      .setScale(1.2)
      .setTint(0xffffff);
    
    const sh = pokeSprite.displayHeight / 2;
    const sw = pokeSprite.displayWidth / 2;
    
    const label = this.add.text(0, -sh - 12, cfg.emoji + ' ' + name, {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#eee'
    }).setOrigin(0.5, 0.5);
    
    const statusDot = this.add.circle(sw + 18, -sh + 8, 4, 0x6b7280)
      .setStrokeStyle(1, 0xffffff, 0.3);
    
    const zzz = this.add.text(0, sh + 8, '', {
      fontSize: '12px',
      color: '#8888ff'
    }).setOrigin(0.5, 0.5);
    
    charGroup.add(pokeSprite);
    charGroup.add(label);
    charGroup.add(statusDot);
    charGroup.add(zzz);
    
    this.agentData[name] = {
      container: charGroup,
      sprite: pokeSprite,
      label,
      statusDot,
      zzz,
      state: 'idle',
      idleEnd: 0,
      walkTween: null,
      idleTween: null,
      active: false,
      baseY: charGroup.y
    };
  });
  
  // Initial positions and start idle
  Object.values(this.agentData).forEach(data => {
    let pos = this.pickValidTarget(data.container.x, data.container.y);
    data.container.x = pos.x;
    data.container.y = pos.y;
    data.baseY = pos.y;
    this.startIdle(data);
  });
  
  // Poll event every 10s
  this.pollEvent = this.time.addEvent({
    delay: 10000,
    callback: () => {
      fetch('/api/sessions')
        .then(r => r.json())
        .then(sessions => {
          const now = Date.now();
          Object.entries(this.agentData).forEach(([name, data]) => {
            const cfg = AGENTS[name];
            const recent = sessions.filter(s => 
              s.key && s.key.includes(cfg.pattern) && 
              now - parseInt(s.lastMessage || 0) < 60000
            );
            const active = recent.length > 0;
            data.active = active;
            data.statusDot.setFillStyle(active ? 0x10b981 : 0x6b7280);
            data.sprite.tint = active ? 0xffffff : 0x888888;
          });
        })
        .catch(() => {});
    },
    loop: true
  });
  
  // Initial poll
  this.pollEvent.callback.call(this);
}

function drawPlant(scene, x, y) {
  scene.add.rectangle(x, y + 8, 10, 12, 0x8B4513); // pot
  scene.add.circle(x, y - 2, 10, 0x228B22);
  scene.add.circle(x - 6, y - 6, 6, 0x2ecc40);
  scene.add.circle(x + 6, y - 4, 7, 0x27ae60);
}

function officeUpdate(time, delta) {
  Object.values(officeScene.agentData).forEach(data => {
    if (data.state === 'idle' && time > data.idleEnd) {
      const target = officeScene.pickValidTarget(data.container.x, data.container.y);
      officeScene.startWalk(data, target.x, target.y);
    }
  });
}

// DOM init
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      if (item.dataset.page === 'office') {
        if (!officeGame) initOfficeGame();
      }
    });
  });
});
