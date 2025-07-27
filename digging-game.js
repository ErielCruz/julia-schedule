// Digging Game Logic
class DiggingGame {
  constructor() {
    this.clicks = 0;
    this.depth = 0;
    this.digPower = 1;
    this.doublePowerActive = false;
    this.doublePowerEndTime = 0;
    this.achievements = [];
    this.treasuresFound = [];
    this.upgrades = {
      power: { cost: 50, level: 0, maxLevel: 10 },
      auto: { cost: 500, owned: false }
    };
    
    this.init();
  }

  init() {
    // Reset game on page load/reload
    this.resetGameOnLoad();
    
    this.loadProgress();
    this.setupEventListeners();
    this.updateDisplay();
    this.updateTreasureDisplay();
    this.checkAchievements();
    this.updateUpgradeButtons();
    
    // Auto-save every 10 seconds
    setInterval(() => this.saveProgress(), 10000);
    
    // Update double power timer every second
    setInterval(() => this.updateDoublePower(), 1000);
  }

  resetGameOnLoad() {
    // Clear saved data to reset game on every page load
    localStorage.removeItem('digging-game-save');
  }

  setupEventListeners() {
    const digButton = document.getElementById('dig-button');
    if (digButton) {
      digButton.addEventListener('click', () => this.dig(true));
    }
    
    // Save progress when leaving the page
    window.addEventListener('beforeunload', () => this.saveProgress());
  }

  dig(isManual = true) {
    if (isManual) {
      // Check if double power is active
      const effectiveClicks = this.doublePowerActive ? 2 : 1;
      this.clicks += effectiveClicks;
      this.createEnhancedDigEffect();
      this.animateButton();
      this.createSoilAnimation();
      this.checkForTreasures();
    }
    
    const depthIncrease = this.digPower * 0.1; // 0.1m per dig power
    this.depth += depthIncrease;
    
    this.updateDisplay();
    this.checkAchievements();
    this.saveProgress();
  }

  createEnhancedDigEffect() {
    const digArea = document.getElementById('dig-area');
    if (!digArea) return;
    
    // Create multiple particles for enhanced effect
    const particleCount = this.doublePowerActive ? 8 : 5;
    
    for (let i = 0; i < particleCount; i++) {
      const effect = document.createElement('div');
      
      // Vary particle types
      const particleType = Math.random();
      if (particleType < 0.1 && this.doublePowerActive) {
        effect.className = 'dig-effect sparkle';
      } else if (particleType < 0.3) {
        effect.className = 'dig-effect rock';
      } else {
        effect.className = 'dig-effect dirt';
      }
      
      // Random position and direction
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = 40 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      effect.style.setProperty('--dx', `${x}px`);
      effect.style.setProperty('--dy', `${y}px`);
      effect.style.left = '50%';
      effect.style.top = '50%';
      effect.style.transform = 'translate(-50%, -50%)';
      
      digArea.appendChild(effect);
      
      // Remove effect after animation
      setTimeout(() => {
        if (effect.parentNode) {
          effect.parentNode.removeChild(effect);
        }
      }, this.doublePowerActive ? 800 : 600);
    }
  }

  checkForTreasures() {
    const treasureDefinitions = [
      // Common treasures (every 10-50 clicks)
      { type: 'bone', emoji: '🦴', rarity: 0.35, minClicks: 10, name: 'Old Bone' },
      { type: 'pottery', emoji: '🏺', rarity: 0.30, minClicks: 15, name: 'Ancient Pottery' },
      { type: 'fossil', emoji: '🐚', rarity: 0.25, minClicks: 20, name: 'Fossil Shell' },
      
      // Uncommon treasures (every 50-100 clicks)
      { type: 'coin', emoji: '🪙', rarity: 0.20, minClicks: 30, name: 'Ancient Coin' },
      { type: 'skull', emoji: '💀', rarity: 0.15, minClicks: 40, name: 'Mysterious Skull' },

      // Rare treasures (every 100+ clicks)
      { type: 'gold', emoji: '🥇', rarity: 0.08, minClicks: 50, name: 'Gold Nugget' },
      { type: 'ruby', emoji: '💎', rarity: 0.05, minClicks: 65, name: 'Precious Ruby' },
      { type: 'emerald', emoji: '💚', rarity: 0.03, minClicks: 80, name: 'Emerald Gem' },

      // Epic treasures (every 500+ clicks)
      { type: 'diamond', emoji: '💍', rarity: 0.02, minClicks: 100, name: 'Diamond Ring' },
      { type: 'crown', emoji: '👑', rarity: 0.01, minClicks: 150, name: 'Royal Crown' },
      
      // Legendary treasures (every 1000+ clicks)
      { type: 'artifact', emoji: '🏛️', rarity: 0.005, minClicks: 180, name: 'Ancient Artifact' },
      { type: 'treasure', emoji: '🗝️', rarity: 0.002, minClicks: 220, name: 'Master Key' }
    ];

    treasureDefinitions.forEach(treasure => {
      if (this.clicks >= treasure.minClicks && Math.random() < treasure.rarity) {
        this.foundTreasure(treasure);
      }
    });
  }

  foundTreasure(treasure) {
    // Check if we already found this type recently (prevent spam)
    const recentlyFound = this.treasuresFound.filter(t => 
      t.type === treasure.type && Date.now() - t.timestamp < 30000
    );
    
    if (recentlyFound.length > 0) return;

    // Add to treasures found
    this.treasuresFound.push({
      ...treasure,
      timestamp: Date.now()
    });

    // Create floating treasure animation
    this.createTreasureAnimation(treasure);
    
    // Show notification
    this.showNotification(`Found ${treasure.name}! ${treasure.emoji}`);
    
    this.updateDisplay();
    this.updateTreasureDisplay();
  }

  createTreasureAnimation(treasure) {
    const holeContainer = document.getElementById('hole-container');
    if (!holeContainer) return;

    const treasureEl = document.createElement('div');
    treasureEl.className = 'treasure-float';
    treasureEl.textContent = treasure.emoji;
    treasureEl.style.cssText = `
      position: absolute;
      font-size: 2rem;
      z-index: 100;
      pointer-events: none;
      left: ${20 + Math.random() * 60}%;
      bottom: 20px;
      animation: treasureFloat 4s ease-out forwards;
    `;

    holeContainer.appendChild(treasureEl);

    // Remove after animation
    setTimeout(() => {
      if (treasureEl.parentNode) {
        treasureEl.parentNode.removeChild(treasureEl);
      }
    }, 4000);
  }

  createSoilAnimation() {
    const holeContainer = document.getElementById('hole-container');
    if (!holeContainer) return;

    // Array of soil/dirt emojis
    const soilEmojis = ['🟫', '🪨', '⬛', '🟤', '🔸', '🔹', '⚫'];
    
    // Create 3-5 soil particles
    const particleCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const soilEl = document.createElement('div');
      soilEl.className = 'soil-particle';
      soilEl.textContent = soilEmojis[Math.floor(Math.random() * soilEmojis.length)];
      
      soilEl.style.cssText = `
        position: absolute;
        font-size: ${0.8 + Math.random() * 0.6}rem;
        z-index: 90;
        pointer-events: none;
        left: ${30 + Math.random() * 40}%;
        bottom: 30%;
        animation: soilFloat ${2 + Math.random() * 2}s ease-out forwards;
        animation-delay: ${Math.random() * 0.5}s;
      `;

      holeContainer.appendChild(soilEl);

      // Remove after animation
      setTimeout(() => {
        if (soilEl.parentNode) {
          soilEl.parentNode.removeChild(soilEl);
        }
      }, 4500);
    }
  }

  animateButton() {
    const digButton = document.getElementById('dig-button');
    if (digButton) {
      digButton.classList.add('digging');
      setTimeout(() => {
        digButton.classList.remove('digging');
        this.isDigging = false;
      }, 500);
    } else {
      this.isDigging = false;
    }
  }

  updateDoublePower() {
    if (this.doublePowerActive && Date.now() > this.doublePowerEndTime) {
      this.doublePowerActive = false;
      this.updateDisplay();
    }
  }

  activateDoublePower() {
    this.doublePowerActive = true;
    this.doublePowerEndTime = Date.now() + 60000; // 1 minute
    this.updateDisplay();
    
    // Show activation message
    this.showNotification('Double Power Activated! 🚀 Clicks count double for 1 minute!');
  }

  updateDisplay() {
    const clickCounter = document.getElementById('click-counter');
    const depthDisplay = document.getElementById('depth-display');
    const powerDisplay = document.getElementById('power-display');
    
    if (clickCounter) clickCounter.textContent = this.clicks.toLocaleString();
    if (depthDisplay) depthDisplay.textContent = `${this.depth.toFixed(1)}m`;
    
    if (powerDisplay) {
      let powerText = `${this.digPower}x`;
      
      if (this.doublePowerActive) {
        const timeLeft = Math.max(0, this.doublePowerEndTime - Date.now());
        const secondsLeft = Math.ceil(timeLeft / 1000);
        powerText += `<span class="double-power-indicator">2x (${secondsLeft}s)</span>`;
      }
      
      powerDisplay.innerHTML = powerText;
    }

    this.updateUpgradeButtons();
  }

  updateTreasureDisplay() {
    const treasureList = document.getElementById('treasure-list');
    if (!treasureList) return;

    if (this.treasuresFound.length === 0) {
      treasureList.innerHTML = '<p class="no-treasures">Start digging to find treasures!</p>';
      return;
    }

    // Group treasures by type and count them
    const treasureCounts = {};
    this.treasuresFound.forEach(treasure => {
      if (!treasureCounts[treasure.type]) {
        treasureCounts[treasure.type] = {
          ...treasure,
          count: 0
        };
      }
      treasureCounts[treasure.type].count++;
    });

    treasureList.innerHTML = '';
    Object.values(treasureCounts).forEach(treasure => {
      const treasureEl = document.createElement('div');
      let rarityClass = '';
      if (treasure.rarity <= 0.005) rarityClass = 'legendary';
      else if (treasure.rarity <= 0.02) rarityClass = 'epic';
      else if (treasure.rarity <= 0.08) rarityClass = 'rare';
      
      treasureEl.className = `treasure-item ${rarityClass}`;
      treasureEl.innerHTML = `
        <span class="treasure-emoji">${treasure.emoji}</span>
        <span>${treasure.name}</span>
        ${treasure.count > 1 ? `<span>x${treasure.count}</span>` : ''}
      `;
      treasureList.appendChild(treasureEl);
    });
  }

  checkAchievements() {
    const achievementDefs = [
      { id: 'first-dig', name: 'First Dig', desc: 'Already better than Julia', icon: '🕳️', requirement: () => this.clicks >= 1 },
      { id: 'dedicated-digger', name: 'Dedicated Digger', desc: 'Make 100 clicks', icon: '⛏️', requirement: () => this.clicks >= 100 },
      { id: 'hole-master', name: 'Hole Master', desc: 'Make 1000 clicks', icon: '👑', requirement: () => this.clicks >= 1000 },
      { id: 'deep-diver', name: 'Deep Diver', desc: 'Reach 10m depth', icon: '🌊', requirement: () => this.depth >= 10 },
      { id: 'underground', name: 'Underground', desc: 'Reach 50m depth', icon: '🌍', requirement: () => this.depth >= 50 },
      { id: 'abyss-explorer', name: 'Abyss Explorer', desc: 'Reach 100m depth', icon: '🌑', requirement: () => this.depth >= 100 },
      { id: 'power-user', name: 'Power User', desc: 'Upgrade your shovel', icon: '💪', requirement: () => this.upgrades.power.level >= 1 },
      { id: 'double-power', name: 'Power Surge', desc: 'Use the Double Power boost', icon: '⚡', requirement: () => this.doublePowerActive || this.doublePowerEndTime > 0 },
      { id: 'treasure-hunter', name: 'Treasure Hunter', desc: 'Find your first treasure', icon: '🏆', requirement: () => this.treasuresFound.length >= 1 },
      { id: 'archaeologist', name: 'Archaeologist', desc: 'Find 10 treasures', icon: '🗿', requirement: () => this.treasuresFound.length >= 10 },
      { id: 'legend-seeker', name: 'Legend Seeker', desc: 'Find a legendary treasure', icon: '✨', requirement: () => this.treasuresFound.some(t => t.rarity <= 0.005) }
    ];

    const achievementList = document.getElementById('achievement-list');
    let newAchievements = 0;

    achievementDefs.forEach(def => {
      if (!this.achievements.includes(def.id) && def.requirement()) {
        this.achievements.push(def.id);
        newAchievements++;
      }
    });

    // Update achievement display
    if (achievementList) {
      achievementList.innerHTML = '';
      achievementDefs.forEach(def => {
        const achieved = this.achievements.includes(def.id);
        const achievementEl = document.createElement('div');
        achievementEl.className = `achievement ${achieved ? 'unlocked' : ''}`;
        achievementEl.innerHTML = `
          <div class="achievement-icon">${def.icon}</div>
          <div class="achievement-name">${def.name}</div>
          <div class="achievement-desc">${def.desc}</div>
        `;
        achievementList.appendChild(achievementEl);
      });
    }

    if (newAchievements > 0) {
      this.showAchievementNotification(newAchievements);
    }
  }

  showAchievementNotification(count) {
    this.showNotification(`🏆 ${count} new achievement${count > 1 ? 's' : ''} unlocked!`);
  }

  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      ${isMobile ? 'left: 10px; right: 10px;' : 'right: 20px;'}
      background: linear-gradient(45deg, #9146ff, #772ce8);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      ${isMobile ? 'max-width: calc(100vw - 20px);' : 'max-width: 300px;'}
      font-weight: bold;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  updateUpgradeButtons() {
    // Power upgrade
    const powerButton = document.getElementById('power-upgrade');
    const powerCost = document.getElementById('power-cost');
    
    if (powerButton && powerCost) {
      const currentCost = this.upgrades.power.cost * Math.pow(2, this.upgrades.power.level);
      
      powerCost.textContent = `Cost: ${currentCost.toLocaleString()} clicks`;
      powerButton.disabled = this.clicks < currentCost || this.upgrades.power.level >= this.upgrades.power.maxLevel;
      
      if (this.upgrades.power.level >= this.upgrades.power.maxLevel) {
        powerCost.textContent = 'MAX LEVEL';
      }
    }

    // Double Power boost
    const autoButton = document.getElementById('auto-dig');
    if (autoButton) {
      const autoCost = autoButton.querySelector('.upgrade-cost');
      
      if (this.doublePowerActive) {
        const timeLeft = Math.max(0, this.doublePowerEndTime - Date.now());
        const secondsLeft = Math.ceil(timeLeft / 1000);
        if (autoCost) autoCost.textContent = `Active (${secondsLeft}s left)`;
        autoButton.disabled = true;
      } else {
        if (autoCost) autoCost.textContent = `Cost: ${this.upgrades.auto.cost.toLocaleString()} clicks`;
        autoButton.disabled = this.clicks < this.upgrades.auto.cost;
      }
    }
  }

  buyUpgrade(type) {
    if (type === 'power') {
      const currentCost = this.upgrades.power.cost * Math.pow(2, this.upgrades.power.level);
      if (this.clicks >= currentCost && this.upgrades.power.level < this.upgrades.power.maxLevel) {
        this.clicks -= currentCost;
        this.upgrades.power.level++;
        this.digPower = 1 + this.upgrades.power.level;
        this.updateDisplay();
        this.updateUpgradeButtons();
        this.saveProgress();
      }
    } else if (type === 'auto') {
      if (this.clicks >= this.upgrades.auto.cost && !this.doublePowerActive) {
        this.clicks -= this.upgrades.auto.cost;
        this.activateDoublePower();
        
        this.updateDisplay();
        this.updateUpgradeButtons();
        this.checkAchievements();
        this.saveProgress();
      }
    }
  }

  saveProgress() {
    const saveData = {
      clicks: this.clicks,
      depth: this.depth,
      digPower: this.digPower,
      doublePowerActive: this.doublePowerActive,
      doublePowerEndTime: this.doublePowerEndTime,
      achievements: this.achievements,
      treasuresFound: this.treasuresFound,
      upgrades: this.upgrades,
      version: 3
    };
    
    try {
      localStorage.setItem('digging-game-save', JSON.stringify(saveData));
    } catch (e) {
      console.warn('Could not save progress:', e);
    }
  }

  loadProgress() {
    try {
      const saveData = localStorage.getItem('digging-game-save');
      if (saveData) {
        const data = JSON.parse(saveData);
        
        // Handle version compatibility
        if (data.version >= 1) {
          this.clicks = data.clicks || 0;
          this.depth = data.depth || 0;
          this.digPower = data.digPower || 1;
          this.doublePowerActive = data.doublePowerActive || false;
          this.doublePowerEndTime = data.doublePowerEndTime || 0;
          this.achievements = data.achievements || [];
          this.treasuresFound = data.treasuresFound || [];
          this.upgrades = { ...this.upgrades, ...data.upgrades };
        }
      }
    } catch (e) {
      console.warn('Could not load progress:', e);
    }
  }

  resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
      localStorage.removeItem('digging-game-save');
      location.reload();
    }
  }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.game = new DiggingGame();
});

// Make buyUpgrade available globally for the HTML buttons
function buyUpgrade(type) {
  if (window.game) {
    window.game.buyUpgrade(type);
  }
}
