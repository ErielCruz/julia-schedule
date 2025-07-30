class PingPongGame {
  constructor() {
    this.gameArea = document.getElementById('gameArea');
    this.player = document.getElementById('player');
    this.ballsContainer = document.getElementById('balls-container');
    this.obstaclesContainer = document.getElementById('obstacles-container');
    this.scoreElement = document.getElementById('score');
    this.livesElement = document.getElementById('lives');
    this.levelElement = document.getElementById('level');
    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayMessage = document.getElementById('overlay-message');
    
    // Game state
    this.isPlaying = false;
    this.isPaused = false;
    this.currentLane = 2; // Start in middle lane (0, 1, 2, 3, 4)
    this.score = 0;
    this.lives = 5; // Increased from 3 to 5
    this.level = 1;
    this.balls = [];
    this.obstacles = [];
    
    // Mobile detection
    this.isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    // Speed adjustments - 35% slower on mobile
    const mobileSpeedMultiplier = this.isMobile ? 0.65 : 1; // 35% slower = 65% of original speed
    this.gameSpeed = 2.125 * mobileSpeedMultiplier; // Reduced by 15% from 2.5, then mobile adjustment
    this.ballSpawnRate = 1500; // milliseconds - faster spawn
    this.ballSpeed = 2.55 * mobileSpeedMultiplier; // Reduced by 15% from 3, then mobile adjustment
    this.obstacleSpawnRate = 4000; // spawn obstacles less frequently
    
    // Timers
    this.gameLoop = null;
    this.ballSpawner = null;
    this.obstacleSpawner = null;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateDisplay();
    this.positionPlayer();
    
    // Set current year
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
    
    // Show welcome message
    this.showOverlay('Welcome!', 'Get ready to defend your lanes!', 'Start Game');
  }
  
  setupEventListeners() {
    // Game control buttons
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const resetButton = document.getElementById('reset-button');
    const overlayButton = document.getElementById('overlay-button');
    
    startButton.addEventListener('click', () => this.startGame());
    pauseButton.addEventListener('click', () => this.togglePause());
    resetButton.addEventListener('click', () => this.resetGame());
    overlayButton.addEventListener('click', () => this.handleOverlayButton());
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Mobile controls
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const hitButton = document.getElementById('hit-button');
    
    if (leftButton) leftButton.addEventListener('click', () => this.moveTo(Math.max(0, this.currentLane - 1)));
    if (rightButton) rightButton.addEventListener('click', () => this.moveTo(Math.min(4, this.currentLane + 1)));
    if (hitButton) hitButton.addEventListener('click', () => this.hitBall());
    
    // Remove touch controls for game area since we now use buttons only
    
    // Prevent default behavior for game keys
    document.addEventListener('keydown', (e) => {
      if ([' ', 'ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }
  
  handleKeyDown(event) {
    if (!this.isPlaying || this.isPaused) return;
    
    switch(event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.moveTo(Math.max(0, this.currentLane - 1));
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.moveTo(Math.min(4, this.currentLane + 1));
        break;
      case ' ':
        this.hitBall();
        break;
    }
  }
  
  moveTo(lane) {
    if (lane === this.currentLane) return;
    
    // Add moving class for animation
    this.player.classList.add('moving');
    
    this.currentLane = lane;
    this.positionPlayer();
    this.updateLaneButtons();
    this.highlightLane(lane);
    
    // Remove moving class after animation
    setTimeout(() => {
      this.player.classList.remove('moving');
    }, 200);
  }
  
  positionPlayer() {
    // Remove all lane classes first
    this.player.classList.remove('lane-0', 'lane-1', 'lane-2', 'lane-3', 'lane-4');
    // Add the current lane class
    this.player.classList.add(`lane-${this.currentLane}`);
  }
  
  updateLaneButtons() {
    const laneButtons = document.querySelectorAll('.lane-button');
    laneButtons.forEach((button, index) => {
      button.classList.toggle('active', index === this.currentLane);
    });
  }
  
  highlightLane(lane) {
    const lanes = document.querySelectorAll('.lane');
    lanes.forEach((laneEl, index) => {
      laneEl.classList.toggle('active', index === lane);
    });
    
    setTimeout(() => {
      lanes.forEach(laneEl => laneEl.classList.remove('active'));
    }, 300);
  }
  
  startGame() {
    this.isPlaying = true;
    this.isPaused = false;
    this.hideOverlay();
    this.updateButtonStates();
    this.startGameLoop();
    this.startBallSpawner();
    this.startObstacleSpawner();
  }
  
  togglePause() {
    if (!this.isPlaying) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.stopGameLoop();
      this.stopBallSpawner();
      this.stopObstacleSpawner();
      this.showOverlay('Paused', 'Game is paused', 'Resume');
    } else {
      this.hideOverlay();
      this.startGameLoop();
      this.startBallSpawner();
      this.startObstacleSpawner();
    }
    
    this.updateButtonStates();
  }
  
  resetGame() {
    this.stopGame();
    this.score = 0;
    this.lives = 5; // Increased from 3 to 5
    this.level = 1;
    
    // Speed adjustments - 35% slower on mobile
    const mobileSpeedMultiplier = this.isMobile ? 0.65 : 1;
    this.gameSpeed = 2.125 * mobileSpeedMultiplier; // Reduced by 15% from 2.5, then mobile adjustment
    this.ballSpawnRate = 1500; // Faster spawn
    this.ballSpeed = 2.55 * mobileSpeedMultiplier; // Reduced by 15% from 3, then mobile adjustment
    this.obstacleSpawnRate = 4000;
    this.currentLane = 2; // Middle lane for 5 lanes
    this.clearBalls();
    this.clearObstacles();
    this.updateDisplay();
    this.positionPlayer();
    this.updateLaneButtons();
    this.showOverlay('Ready?', 'Defend your lanes and hit those balls back!', 'Start Game');
  }
  
  stopGame() {
    this.isPlaying = false;
    this.isPaused = false;
    this.stopGameLoop();
    this.stopBallSpawner();
    this.stopObstacleSpawner();
    this.updateButtonStates();
  }
  
  startGameLoop() {
    this.gameLoop = setInterval(() => {
      this.updateGame();
    }, 16); // ~60 FPS
  }
  
  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }
  
  startBallSpawner() {
    this.ballSpawner = setInterval(() => {
      this.spawnBall();
    }, this.ballSpawnRate);
  }
  
  stopBallSpawner() {
    if (this.ballSpawner) {
      clearInterval(this.ballSpawner);
      this.ballSpawner = null;
    }
  }
  
  spawnBall() {
    const lane = Math.floor(Math.random() * 5);
    const ball = {
      element: this.createBallElement(lane),
      lane: lane,
      y: -30,
      speed: this.ballSpeed * this.gameSpeed,
      hit: false
    };
    
    this.balls.push(ball);
    this.ballsContainer.appendChild(ball.element);
  }
  
  createBallElement(lane) {
    const ball = document.createElement('div');
    ball.className = `ball lane-${lane}`;
    return ball;
  }
  
  startObstacleSpawner() {
    if (this.level < 2) return; // No obstacles on level 1
    
    this.obstacleSpawner = setInterval(() => {
      this.spawnObstacle();
    }, this.obstacleSpawnRate);
  }
  
  stopObstacleSpawner() {
    if (this.obstacleSpawner) {
      clearInterval(this.obstacleSpawner);
      this.obstacleSpawner = null;
    }
  }
  
  spawnObstacle() {
    const lane = Math.floor(Math.random() * 5);
    const obstacle = {
      element: this.createObstacleElement(lane),
      lane: lane,
      y: -40,
      speed: this.ballSpeed * this.gameSpeed, // Same speed as balls
    };
    
    this.obstacles.push(obstacle);
    this.obstaclesContainer.appendChild(obstacle.element);
  }
  
  createObstacleElement(lane) {
    const obstacle = document.createElement('div');
    obstacle.className = `obstacle lane-${lane}`;
    return obstacle;
  }
  
  updateGame() {
    this.updateBalls();
    this.updateObstacles();
    this.checkCollisions();
    this.checkObstacleCollisions();
    this.checkLevelProgression();
  }
  
  updateBalls() {
    this.balls.forEach((ball, index) => {
      if (ball.hit) {
        // Ball is going back up
        ball.y -= ball.speed * 2;
        if (ball.y < -50) {
          this.removeBall(index);
        }
      } else {
        // Ball is coming down
        ball.y += ball.speed;
        if (ball.y > this.gameArea.offsetHeight + 30) {
          this.missedBall();
          this.removeBall(index);
        }
      }
      
      ball.element.style.top = ball.y + 'px';
    });
  }
  
  updateObstacles() {
    this.obstacles.forEach((obstacle, index) => {
      obstacle.y += obstacle.speed;
      
      if (obstacle.y > this.gameArea.offsetHeight + 40) {
        this.removeObstacle(index);
      }
      
      obstacle.element.style.top = obstacle.y + 'px';
    });
  }
  
  checkObstacleCollisions() {
    const playerRect = this.player.getBoundingClientRect();
    
    this.obstacles.forEach((obstacle, index) => {
      const obstacleRect = obstacle.element.getBoundingClientRect();
      
      // Check if player hits an obstacle
      if (obstacleRect.bottom >= playerRect.top && 
          obstacleRect.top <= playerRect.bottom &&
          obstacle.lane === this.currentLane) {
        
        this.hitObstacle();
        this.removeObstacle(index);
      }
    });
  }
  
  checkCollisions() {
    const playerRect = this.player.getBoundingClientRect();
    const gameAreaRect = this.gameArea.getBoundingClientRect();
    
    this.balls.forEach((ball, index) => {
      if (ball.hit) return;
      
      const ballRect = ball.element.getBoundingClientRect();
      
      // Check if ball is in hitting range
      if (ballRect.bottom >= playerRect.top - 20 && 
          ballRect.top <= playerRect.bottom + 20 &&
          ball.lane === this.currentLane) {
        
        // Ball can be hit in this position
        ball.canBeHit = true;
      }
      
      // Check if ball passed the player
      if (ballRect.top > playerRect.bottom + 20 && !ball.hit) {
        this.missedBall();
        this.removeBall(index);
      }
    });
  }
  
  hitBall() {
    let hitAny = false;
    
    this.balls.forEach((ball, index) => {
      if (ball.hit || ball.lane !== this.currentLane) return;
      
      const ballRect = ball.element.getBoundingClientRect();
      const playerRect = this.player.getBoundingClientRect();
      
      // Check if ball is in hitting range
      if (ballRect.bottom >= playerRect.top - 30 && 
          ballRect.top <= playerRect.bottom + 30) {
        
        this.hitBallSuccess(ball);
        hitAny = true;
      }
    });
    
    if (!hitAny) {
      // Visual feedback for missed hit
      this.player.style.animation = 'none';
      this.player.offsetHeight; // Trigger reflow
      this.player.style.animation = 'bounce 0.3s ease';
      setTimeout(() => {
        this.player.style.animation = '';
      }, 300);
    }
  }
  
  hitBallSuccess(ball) {
    ball.hit = true;
    ball.element.classList.add('hit');
    
    // Add score - constant 10 points regardless of level
    const points = 10;
    this.score += points;
    this.updateDisplay();
    
    // Show score popup
    this.showScorePopup(points, ball.element);
    
    // Player hit animation
    this.player.style.transform += ' scale(1.1)';
    setTimeout(() => {
      this.player.style.transform = this.player.style.transform.replace(' scale(1.1)', '');
    }, 150);
  }
  
  showScorePopup(points, ballElement) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    
    const rect = ballElement.getBoundingClientRect();
    const gameRect = this.gameArea.getBoundingClientRect();
    
    popup.style.left = (rect.left - gameRect.left) + 'px';
    popup.style.top = (rect.top - gameRect.top) + 'px';
    
    this.gameArea.appendChild(popup);
    
    setTimeout(() => {
      popup.remove();
    }, 1000);
  }
  
  missedBall() {
    this.lives--;
    this.updateDisplay();
    
    // Screen shake effect
    this.gameArea.style.animation = 'none';
    this.gameArea.offsetHeight; // Trigger reflow
    this.gameArea.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
      this.gameArea.style.animation = '';
    }, 500);
    
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  checkLevelProgression() {
    const newLevel = Math.floor(this.score / 200) + 1; // Changed from 100 to 200 - levels up twice as slow
    if (newLevel > this.level) {
      this.level = newLevel;
      
      // Keep speeds constant, only change spawn rates to increase difficulty
      // this.gameSpeed stays the same
      // this.ballSpeed stays the same
      
      // Increase spawn rates (decrease spawn intervals) as levels progress
      this.ballSpawnRate = Math.max(600, 1500 - (this.level - 1) * 100); // Balls spawn faster each level
      this.obstacleSpawnRate = Math.max(1500, 4000 - (this.level - 1) * 300); // Obstacles spawn much faster each level
      
      // Restart spawners with new rates
      this.stopBallSpawner();
      this.stopObstacleSpawner();
      this.startBallSpawner();
      this.startObstacleSpawner();
      
      this.updateDisplay();
      
      // Level up message
      this.showLevelUpMessage();
    }
  }
  
  showLevelUpMessage() {
    const message = document.createElement('div');
    message.className = 'level-up-message';
    const speedText = this.level === 2 ? 'Obstacles appear!' : 'More chaos incoming!';
    message.innerHTML = `<h2>Level ${this.level}!</h2><p>${speedText}</p>`;
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(145, 70, 255, 0.9);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-align: center;
      z-index: 50;
      animation: fadeInUp 0.5s ease;
    `;
    
    this.gameArea.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 2000);
  }
  
  gameOver() {
    this.stopGame();
    this.showOverlay('Game Over!', `Final Score: ${this.score} points!`, 'Play Again');
  }
  
  removeBall(index) {
    if (this.balls[index]) {
      this.balls[index].element.remove();
      this.balls.splice(index, 1);
    }
  }
  
  clearBalls() {
    this.balls.forEach(ball => ball.element.remove());
    this.balls = [];
  }
  
  removeObstacle(index) {
    if (this.obstacles[index]) {
      this.obstacles[index].element.remove();
      this.obstacles.splice(index, 1);
    }
  }
  
  clearObstacles() {
    this.obstacles.forEach(obstacle => obstacle.element.remove());
    this.obstacles = [];
  }
  
  hitObstacle() {
    // Remove a life when hit by obstacle
    this.lives--;
    this.updateDisplay();
    
    // Flash player red to indicate hit
    this.player.style.filter = 'hue-rotate(0deg) brightness(150%)';
    setTimeout(() => {
      this.player.style.filter = '';
    }, 200);
    
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  updateDisplay() {
    this.scoreElement.textContent = this.score;
    this.livesElement.textContent = this.lives;
    this.levelElement.textContent = this.level;
  }
  
  updateButtonStates() {
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    
    startButton.disabled = this.isPlaying && !this.isPaused;
    startButton.textContent = this.isPlaying ? 'Playing...' : 'Start Game';
    
    pauseButton.disabled = !this.isPlaying;
    pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
  }
  
  showOverlay(title, message, buttonText) {
    this.overlayTitle.textContent = title;
    this.overlayMessage.textContent = message;
    document.getElementById('overlay-button').textContent = buttonText;
    this.gameOverlay.style.display = 'flex';
  }
  
  hideOverlay() {
    this.gameOverlay.style.display = 'none';
  }
  
  handleOverlayButton() {
    if (this.isPaused) {
      this.togglePause();
    } else if (!this.isPlaying) {
      // Check if this is a game over scenario (lives <= 0) or initial start
      if (this.lives <= 0) {
        this.resetGame(); // Reset everything for "Play Again"
      } else {
        this.startGame(); // Just start for initial game or after pause
      }
    }
  }
}

// Add shake animation CSS
const shakeCSS = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
`;

// Inject the CSS
const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PingPongGame();
});
