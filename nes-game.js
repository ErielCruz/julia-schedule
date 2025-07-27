// NES Emulator Game Logic
class NESEmulator {
  constructor() {
    this.nes = null;
    this.canvas = null;
    this.canvasContext = null;
    this.frameBuffer = null;
    this.audioContext = null;
    this.isRunning = false;
    this.isPaused = false;
    this.frameTimer = null;
    this.isFullscreen = false;
    this.imageData = null;
    
    // Initialize key mapping after JSNES is confirmed to be loaded
    this.keyMapping = null;
    
    this.init();
  }
  
  init() {
    // Set up key mapping now that JSNES is available
    this.keyMapping = {
      // Player 1 controls
      'ArrowUp': jsnes.Controller.BUTTON_UP,
      'ArrowDown': jsnes.Controller.BUTTON_DOWN,
      'ArrowLeft': jsnes.Controller.BUTTON_LEFT,
      'ArrowRight': jsnes.Controller.BUTTON_RIGHT,
      'KeyZ': jsnes.Controller.BUTTON_A,
      'KeyX': jsnes.Controller.BUTTON_B,
      'Enter': jsnes.Controller.BUTTON_START,
      'Space': jsnes.Controller.BUTTON_SELECT
    };
    
    this.setupCanvas();
    this.setupAudio();
    this.setupNES();
    this.setupEventListeners();
    this.loadROM();
    
    // Set current year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }
  
  setupCanvas() {
    this.canvas = document.getElementById('nes-canvas');
    if (!this.canvas) {
      this.showError('Canvas element not found');
      return;
    }
    
    this.canvasContext = this.canvas.getContext('2d');
    if (!this.canvasContext) {
      this.showError('Could not get canvas context');
      return;
    }
    
    // Set up image data for frame buffer
    this.imageData = this.canvasContext.createImageData(256, 240);
  }
  
  setupAudio() {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.audioSampleRate = this.audioContext.sampleRate;
      this.audioBufferSize = 4096;
      
      // Create audio buffer for NES audio output
      this.audioBuffer = [];
      this.audioBufferIndex = 0;
    } catch (error) {
      console.warn('Audio setup failed:', error);
      // Continue without audio
    }
  }
  
  setupNES() {
    try {
      console.log('Setting up NES emulator...');
      if (!jsnes || !jsnes.NES) {
        throw new Error('JSNES library not properly loaded');
      }
      
      this.nes = new jsnes.NES({
        onFrame: (frameBuffer) => {
          this.onFrame(frameBuffer);
        },
        onAudioSample: (left, right) => {
          this.onAudioSample(left, right);
        }
      });
      console.log('NES emulator setup complete');
    } catch (error) {
      console.error('NES setup error:', error);
      this.showError('Failed to initialize NES emulator: ' + error.message);
    }
  }
  
  setupEventListeners() {
    // Game control buttons
    const testButton = document.getElementById('test-button');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const resetButton = document.getElementById('reset-button');
    const fullscreenButton = document.getElementById('fullscreen-button');
    
    if (testButton) {
      testButton.addEventListener('click', () => this.runTests());
    }
    
    if (startButton) {
      startButton.addEventListener('click', () => this.startGame());
    }
    
    if (pauseButton) {
      pauseButton.addEventListener('click', () => this.togglePause());
    }
    
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetGame());
    }
    
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Resume audio on first user interaction
    const resumeAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      document.removeEventListener('keydown', resumeAudio);
      document.removeEventListener('mousedown', resumeAudio);
    };
    document.addEventListener('keydown', resumeAudio);
    document.addEventListener('mousedown', resumeAudio);
    
    // Prevent default browser behavior for game keys
    document.addEventListener('keydown', (e) => {
      if (this.keyMapping[e.code]) {
        e.preventDefault();
      }
    });
    
    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
  }
  
  async loadROM() {
    try {
      console.log('Loading Dig Dug ROM...');
      
      // Show loading overlay
      this.showLoading(true);
      
      // Check if NES emulator is ready
      if (!this.nes) {
        throw new Error('NES emulator not initialized');
      }
      
      // Fetch the ROM file with the new filename
      console.log('Fetching ROM file: Dig-Dug.nes');
      const response = await fetch('Dig-Dug.nes');
      console.log('Fetch response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to load ROM: ${response.status} ${response.statusText}`);
      }
      
      // Get ROM data as an ArrayBuffer
      console.log('Reading ROM data...');
      const arrayBuffer = await response.arrayBuffer();
      console.log('ROM data size:', arrayBuffer.byteLength, 'bytes');

      // Convert ArrayBuffer to binary string
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      // Load ROM into NES emulator
      console.log('Loading ROM into emulator...');
      this.nes.loadROM(binary);
      
      console.log('ROM loaded successfully!');
      this.showLoading(false);
      
      // Automatically start the game since it's loaded
      this.startGame();
      
    } catch (error) {
      console.error('ROM loading error:', error);
      this.showError('Failed to load Dig Dug ROM: ' + error.message);
    }
  }
  
  onFrame(frameBuffer) {
    if (!this.canvasContext || !this.imageData) return;
    
    // Convert NES frame buffer to canvas image data
    const data = this.imageData.data;
    
    for (let i = 0; i < frameBuffer.length; i++) {
      const pixel = frameBuffer[i];
      const index = i * 4;
      
      // Extract RGB from NES color
      data[index] = (pixel >> 16) & 0xFF;     // Red
      data[index + 1] = (pixel >> 8) & 0xFF;  // Green
      data[index + 2] = pixel & 0xFF;         // Blue
      data[index + 3] = 255;                  // Alpha
    }
    
    // Draw to canvas
    this.canvasContext.putImageData(this.imageData, 0, 0);
  }
  
  onAudioSample(left, right) {
    if (!this.audioContext) return;
    
    // Simple audio buffering (basic implementation)
    this.audioBuffer.push(left);
    this.audioBuffer.push(right);
    
    // Keep buffer from getting too large
    if (this.audioBuffer.length > this.audioBufferSize * 2) {
      this.audioBuffer.splice(0, this.audioBufferSize);
    }
  }
  
  startGame() {
    if (!this.nes) {
      this.showError('NES emulator not initialized');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    
    // Update button states
    this.updateButtonStates();
    
    // Start the game loop
    this.startGameLoop();
    
    console.log('Game started!');
  }
  
  togglePause() {
    if (!this.isRunning) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.stopGameLoop();
    } else {
      this.startGameLoop();
    }
    
    this.updateButtonStates();
    console.log(this.isPaused ? 'Game paused' : 'Game resumed');
  }
  
  resetGame() {
    this.stopGameLoop();
    
    // The jsnes library handles the reset internally when the ROM is loaded.
    // Calling nes.reset() can cause issues. We just need to reset our state.
    this.isRunning = false;
    this.isPaused = false;
    this.updateButtonStates();
    this.loadROM(); // Reload the ROM to reset the game
    
    console.log('Game reset');
  }
  
  startGameLoop() {
    this.stopGameLoop(); // Clear any existing timer
    
    // Run at approximately 60 FPS
    this.frameTimer = setInterval(() => {
      if (this.nes && this.isRunning && !this.isPaused) {
        this.nes.frame();
      }
    }, 1000 / 60);
  }
  
  stopGameLoop() {
    if (this.frameTimer) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
    }
  }
  
  handleKeyDown(event) {
    if (!this.isRunning || this.isPaused) return;
    
    const nesButton = this.keyMapping[event.code];
    if (nesButton !== undefined) {
      this.nes.buttonDown(1, nesButton); // Player 1
      event.preventDefault();
    }
  }
  
  handleKeyUp(event) {
    if (!this.isRunning) return;
    
    const nesButton = this.keyMapping[event.code];
    if (nesButton !== undefined) {
      this.nes.buttonUp(1, nesButton); // Player 1
      event.preventDefault();
    }
  }
  
  toggleFullscreen() {
    const container = document.querySelector('.screen-container');
    
    if (!this.isFullscreen) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    }
  }
  
  handleFullscreenChange() {
    this.isFullscreen = !!(document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.mozFullScreenElement);
    
    const fullscreenButton = document.getElementById('fullscreen-button');
    if (fullscreenButton) {
      fullscreenButton.textContent = this.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
    }
    
    // Add/remove fullscreen class for styling
    const container = document.querySelector('.screen-container');
    if (container) {
      container.classList.toggle('fullscreen-active', this.isFullscreen);
    }
  }
  
  updateButtonStates() {
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const resetButton = document.getElementById('reset-button');
    
    if (startButton) {
      startButton.disabled = this.isRunning && !this.isPaused;
      startButton.textContent = this.isRunning ? 'Running...' : 'Start Game';
    }
    
    if (pauseButton) {
      pauseButton.disabled = !this.isRunning;
      pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    if (resetButton) {
      resetButton.disabled = false;
    }
  }
  
  async runTests() {
    console.log('🔧 Running diagnostic tests...');
    const results = [];
    
    // Test 1: JSNES Library
    try {
      if (typeof jsnes !== 'undefined' && jsnes.NES) {
        results.push('✅ JSNES library loaded');
        console.log('JSNES available:', Object.keys(jsnes));
      } else {
        results.push('❌ JSNES library not available');
      }
    } catch (e) {
      results.push('❌ JSNES error: ' + e.message);
    }
    
    // Test 2: Canvas
    if (this.canvas && this.canvasContext) {
      results.push('✅ Canvas setup successful');
    } else {
      results.push('❌ Canvas setup failed');
    }
    
    // Test 3: NES Emulator
    if (this.nes) {
      results.push('✅ NES emulator initialized');
    } else {
      results.push('❌ NES emulator not initialized');
    }
    
    // Test 4: ROM File Access
    try {
      const response = await fetch('Dig-Dug.nes', { method: 'HEAD' });
      if (response.ok) {
        results.push('✅ ROM file accessible');
      } else {
        results.push(`❌ ROM file not accessible: ${response.status}`);
      }
    } catch (e) {
      results.push('❌ ROM fetch error: ' + e.message);
    }
    
    // Display results
    const message = 'Diagnostic Results:\n\n' + results.join('\n');
    alert(message);
    console.log(message);
  }
  
  showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }
  
  showError(message) {
    console.error('NES Emulator Error:', message);
    
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    
    if (errorOverlay) {
      errorOverlay.style.display = 'flex';
    }
    
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    
    // Disable start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.disabled = true;
      startButton.textContent = 'Error Loading Game';
    }
  }
}

// Initialize the emulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  
  // Check if JSNES is available
  if (typeof jsnes === 'undefined') {
    console.error('JSNES library not loaded');
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');
    
    if (errorOverlay) errorOverlay.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = 'JSNES library failed to load. Please check your internet connection.';
    return;
  }
  
  console.log('JSNES library loaded successfully');
  console.log('JSNES version info:', jsnes);
  
  try {
    window.nesEmulator = new NESEmulator();
    console.log('NES Emulator initialized successfully');
  } catch (error) {
    console.error('Failed to initialize NES emulator:', error);
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');
    
    if (errorOverlay) errorOverlay.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = 'Failed to initialize emulator: ' + error.message;
  }
});
