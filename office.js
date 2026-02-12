// Virtual Office - Pixel Art Agent Monitor
// Uses Phaser 3 to render a GameBoy-style office with animated agent characters

var officeGame = null;
var officeScene = null;
var agentSprites = {};
var agentStatuses = {};

// AGENTS with Pokémon
var AGENTS = {
  'Obi': { deskX: 240, deskY: 160, emoji: '🦉', pokeId: 25, pattern: 'main' }, // Pikachu
  'Devin': { deskX: 80, deskY: 100, emoji: '🛠️', pokeId: 150, pattern: 'dev' }, // Mewtwo
  'Dobby': { deskX: 400, deskY: 100, emoji: '🧦', pokeId: 132, pattern: 'subagent' }, // Ditto
  'Rev': { deskX: 80, deskY: 220, emoji: '🔍', pokeId: 448, pattern: 'group' }, // Lucario
  'Scout': { deskX: 400, deskY: 220, emoji: '🔭', pokeId: 65, pattern: 'cron' } // Alakazam
};

function initOfficeGame() {
  if (officeGame || typeof Phaser === 'undefined') return;
  
  const config = {
    type: Phaser.CANVAS,
    width: 480,
    height: 360,
    pixelArt: true,
    roundPixels: true,
    parent: 'virtual-office-container',
    backgroundColor: '#1a1a2e',
    scene: { 
      preload: officePreload, 
      create: officeCreate, 
      update: officeUpdate 
    },
    scale: { 
      mode: Phaser.Scale.FIXED
    }
  };
  
  officeGame = new Phaser.Game(config);
  // Pixel perfect rendering
  setTimeout(() => {
    const canvases = document.querySelectorAll('#virtual-office-container canvas');
    canvases.forEach(canvas => {
      canvas.style.imageRendering = 'pixelated';
      canvas.style.imageRendering = '-moz-crisp-edges';
      canvas.style.imageRendering = 'crisp-edges';
      canvas.style.imageRendering = 'optimizespeed';
    });
  }, 100);
}

function officePreload() {
  // Load Pokémon sprites
  Object.entries(AGENTS).forEach(([name, cfg]) => {
    if (cfg.pokeId) {
      this.load.image(`poke-${name.toLowerCase()}`, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${cfg.pokeId}.png`);
    }
  });
}

function officeCreate() {
  officeScene = this;
  
  // Floor - dark checkerboard
  const tileSize = 32;
  for (let x = 0; x < 480; x += tileSize) {
    for (let y = 240; y < 360; y += tileSize) {  // floor only bottom
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
  this.add.rectangle(100, 40, 80, 60, 0x87CEEB); // left window
  this.add.rectangle(380, 40, 80, 60, 0x87CEEB); // right window
  // blinds
  for (let i = 0; i < 7; i++) {
    this.add.rectangle(100 + i*11.5, 42, 8, 56, 0x708090 * 0.5);
  }
  for (let i = 0; i < 7; i++) {
    this.add.rectangle(380 + i*11.5, 42, 8, 56, 0x708090 * 0.5);
  }
  
  // Clock
  this.add.circle(240, 70, 15, 0x333333);
  this.add.rectangle(240, 70, 28, 2, 0x111);
  this.add.text(240, 71, '🕐', { fontSize: '18px' }).setOrigin(0.5);
  
  // Whiteboard
  this.add.rectangle(240, 110, 160, 50, 0x3a3a5a); // frame
  this.add.rectangle(240, 110, 152, 42, 0xdedede); // board
  this.add.text(240, 104, 'MISSION BOARD', { fontSize: '8px', fontFamily: 'monospace', color: '#333' }).setOrigin(0.5);
  this.add.text(240, 114, '• Complete Virtual Office', { fontSize: '7px', fontFamily: 'monospace', color: '#555' }).setOrigin(0.5);
  this.add.text(240, 122, '• Fix login bugs', { fontSize: '7px', fontFamily: 'monospace', color: '#555' }).setOrigin(0.5);
  this.add.text(240, 130, '• Optimize dashboard', { fontSize: '7px', fontFamily: 'monospace', color: '#555' }).setOrigin(0.5);
  
  // Decorations
  // Plants
  drawPlant(this, 30, 320);
  drawPlant(this, 450, 320);
  drawPlant(this, 30, 200);
  drawPlant(this, 450, 200);
  
  // Coffee machine
  this.add.rectangle(240, 300, 32, 24, 0x4a3728); // body
  this.add.rectangle(240, 296, 24, 6, 0x666); // top
  this.add.circle(248, 302, 3, 0xffa500); // light
  this.add.text(240, 312, '☕', { fontSize: '12px' }).setOrigin(0.5);
  
  // Desks & Agents
  Object.entries(AGENTS).forEach(([name, cfg]) => {
    // Desk
    this.add.rectangle(cfg.deskX, cfg.deskY + 20, 60, 24, 0x3d2b1f); // top
    this.add.rectangle(cfg.deskX, cfg.deskY + 26, 60, 12, 0x2d1f14); // front
    // Legs
    this.add.rectangle(cfg.deskX - 22, cfg.deskY + 34, 6, 16, 0x2d1f14);
    this.add.rectangle(cfg.deskX + 22, cfg.deskY + 34, 6, 16, 0x2d1f14);
    
    // Monitor
    this.add.rectangle(cfg.deskX, cfg.deskY + 8, 22, 16, 0x333); // bezel
    this.add.rectangle(cfg.deskX, cfg.deskY + 8, 18, 12, 0x4488ff); // glow
    
    // Keyboard
    this.add.rectangle(cfg.deskX, cfg.deskY + 30, 40, 4, 0x222);
    
    // Character container
    const charGroup = this.add.container(cfg.deskX, cfg.deskY - 12);
    
    // Pokémon sprite
    const pokeSprite = this.add.image(0, 0, `poke-${name.toLowerCase()}`).setOrigin(0.5, 0.5).setScale(2.5);
    pokeSprite.setPipeline(this.renderer.pipelines['TextureTintPipeline']); // Pixel perfect tint if needed
    
    charGroup.add([pokeSprite]);
    
    // Name label
    const label = this.add.text(cfg.deskX, cfg.deskY - 40, cfg.emoji + ' ' + name, {
      fontSize: '8px', fontFamily: 'monospace', color: '#ccc'
    }).setOrigin(0.5);
    
    // Status dot
    const statusDot = this.add.circle(cfg.deskX + 35, cfg.deskY - 38, 5, 0x888888);
    statusDot.setStrokeStyle(1, 0xffffff * 0.5);
    
    // Zzz
    const zzz = this.add.text(cfg.deskX + 20, cfg.deskY - 28, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8888ff'
    }).setOrigin(0.5);
    
    agentSprites[name] = { 
      container: charGroup, 
      label, 
      statusDot, 
      zzz, 
      currentStatus: 'sleeping' 
    };
  });
  
  // Update loop
  this.time.addEvent({ 
    delay: 5000, 
    callback: updateOfficeVisuals, 
    callbackScope: this, 
    loop: true 
  });
  
  updateOfficeVisuals.call(this); // initial
}

function drawPlant(scene, x, y) {
  // Pot
  scene.add.rectangle(x, y + 8, 10, 12, 0x8B4513);
  // Leaves
  scene.add.circle(x, y - 2, 10, 0x228B22);
  scene.add.circle(x - 6, y - 6, 6, 0x2ecc40);
  scene.add.circle(x + 6, y - 4, 7, 0x27ae60);
}

function updateOfficeVisuals() {
  if (!officeScene || !window.agentStatuses) return;
  
  Object.entries(agentSprites).forEach(([name, sprite]) => {
    const agentStatus = agentStatuses[name];
    const status = agentStatus ? agentStatus.status : 'sleeping';
    
    const deskY = AGENTS[name].deskY;
    
    // Update status dot
    const dotColors = { 
      working: 0x10b981, 
      idle: 0xf59e0b, 
      sleeping: 0x6b7280 
    };
    sprite.statusDot.setFillStyle(dotColors[status] || 0x6b7280);
    
    // If status changed, kill tweens
    if (sprite.currentStatus !== status) {
      officeScene.tweens.killTweensOf(sprite.container);
      officeScene.tweens.killTweensOf(sprite.zzz);
      sprite.currentStatus = status;
    }
    
    // Apply visuals and restart tween
    if (status === 'working') {
      sprite.container.setRotation(0);
      sprite.container.y = deskY - 8;
      officeScene.tweens.killTweensOf(sprite.container);
      officeScene.tweens.add({
        targets: sprite.container,
        y: deskY - 10,
        duration: 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else if (status === 'idle') {
      sprite.container.setRotation(0);
      sprite.container.y = deskY - 8;
      officeScene.tweens.killTweensOf(sprite.container);
      officeScene.tweens.add({
        targets: sprite.container,
        y: deskY - 6,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else { // sleeping
      sprite.container.y = deskY - 2;
      sprite.container.setRotation(0.15);
      sprite.zzz.setText('z Z z');
      officeScene.tweens.killTweensOf(sprite.zzz);
      officeScene.tweens.add({
        targets: sprite.zzz,
        y: deskY - 42,
        alpha: 0,
        duration: 2200,
        repeat: -1,
        onRepeat: function() {
          this.targets[0].y = deskY - 28;
          this.targets[0].alpha = 1;
        }
      });
    }
  });
}

function officeUpdate() {
  // Per frame if needed
}

// Self-contained module - hook into nav and poll sessions
document.addEventListener('DOMContentLoaded', function() {
  // Find nav items and add office page handling
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (item.dataset.page === 'office') {
        if (!officeGame) initOfficeGame();
      }
    });
  });
  
  // Poll sessions for status updates
  setInterval(function() {
    fetch('/api/sessions').then(r => r.json()).then(function(sessions) {
      var now = Date.now();
      Object.keys(AGENTS).forEach(function(name) {
        var cfg = AGENTS[name];
        var active = sessions.filter(function(s) { return s.key && s.key.includes(cfg.pattern); });
        var working = active.filter(function(s) { return now - s.updatedAt < 120000; });
        var idle = active.filter(function(s) { return now - s.updatedAt >= 120000 && now - s.updatedAt < 1800000; });
        var status = 'sleeping';
        if (working.length > 0) status = 'working';
        else if (idle.length > 0) status = 'idle';
        agentStatuses[name] = { status: status, config: cfg, lastMessage: (active[0] && active[0].lastMessage) || '' };
      });
    }).catch(function() {});
  }, 5000);
});
