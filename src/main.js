// Mode Manager - Handles switching between AR and Pose Detection modes
class ModeManager {
  constructor() {
    this.modeSelector = document.querySelector('#mode-selector');
    this.poseEngineSelector = document.querySelector('#pose-engine-selector');
    this.arMode = document.querySelector('#ar-mode');
    this.poseMode = document.querySelector('#pose-mode');
    this.arModeBtn = document.querySelector('#ar-mode-btn');
    this.poseModeBtn = document.querySelector('#pose-mode-btn');
    this.mediaPipeBtn = document.querySelector('#mediapipe-btn');
    this.moveNetBtn = document.querySelector('#movenet-btn');
    this.backToMainBtn = document.querySelector('#back-to-main-btn');
    this.backToSelectorBtn = document.querySelector('#back-to-selector');

    this.arController = null;
    this.poseController = null;
    this.currentMode = null;
    this.currentPoseEngine = null; // Track which pose engine is active
    this.switching = false; // Prevent rapid mode switches

    this.init();
  }

  init() {
    console.log('🎮 Initializing Mode Manager');

    // Show mode selector by default
    this.showModeSelector();

    // Set up event listeners
    this.arModeBtn.addEventListener('click', () => this.switchToAR());
    this.poseModeBtn.addEventListener('click', () => this.showPoseEngineSelector());
    this.mediaPipeBtn.addEventListener('click', () => this.startMediaPipePose());
    this.moveNetBtn.addEventListener('click', () => this.startMoveNetPose());
    this.backToMainBtn.addEventListener('click', () => this.showModeSelector());
    this.backToSelectorBtn.addEventListener('click', () => this.showModeSelector());
  }

  async showModeSelector() {
    if (this.switching) {
      console.log('⚠️ Already switching modes, please wait...');
      return;
    }

    this.switching = true;
    console.log('📋 Showing mode selector');

    // CRITICAL: Stop pose detection FIRST before switching
    if (this.currentMode === 'pose' && this.poseController) {
      console.log('🛑 Stopping pose detection before mode switch...');
      this.poseController.stop();

      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('✅ Pose detection cleanup complete');

      // Reset pose controller
      this.poseController = null;
      this.currentPoseEngine = null;
    }

    // Stop AR if active
    if (this.currentMode === 'ar' && this.arController && this.arController.isARActive) {
      console.log('🛑 Stopping AR before mode switch...');
      await this.arController.stopAR();

      // Wait for AR cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ AR cleanup complete');
    }

    // Hide all mode screens
    this.modeSelector.classList.remove('hidden');
    this.poseEngineSelector.classList.add('hidden');
    this.arMode.classList.add('hidden');
    this.poseMode.classList.add('hidden');

    this.currentMode = null;
    this.switching = false;
    console.log('✅ Mode selector ready');
  }

  showPoseEngineSelector() {
    console.log('🔧 Showing pose engine selector');

    // Hide main selector, show engine selector
    this.modeSelector.classList.add('hidden');
    this.poseEngineSelector.classList.remove('hidden');
    this.arMode.classList.add('hidden');
    this.poseMode.classList.add('hidden');

    console.log('✅ Pose engine selector ready');
  }

  async switchToAR() {
    if (this.switching) {
      console.log('⚠️ Already switching modes, please wait...');
      return;
    }

    this.switching = true;
    console.log('📱 Switching to AR mode');

    // CRITICAL: Ensure pose detection is fully stopped
    if (this.poseController) {
      console.log('🛑 Force stopping pose detection before AR...');
      this.poseController.stop();
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('✅ Pose cleanup done, WebGL released');
    }

    this.modeSelector.classList.add('hidden');
    this.poseMode.classList.add('hidden');
    this.arMode.classList.remove('hidden');
    this.currentMode = 'ar';

    // Initialize AR controller if not already done
    if (!this.arController) {
      try {
        const { default: WebXRARController } = await import('./ar/ar-controller.js');
        const scene = document.querySelector('#scene');
        if (scene && scene.hasLoaded) {
          console.log('✅ Scene already loaded, creating AR controller');
          this.arController = new WebXRARController();
        } else if (scene) {
          console.log('⏳ Waiting for scene to load...');
          scene.addEventListener('loaded', () => {
            console.log('✅ Scene loaded, creating AR controller');
            this.arController = new WebXRARController();
          });
        }
      } catch (error) {
        console.error('❌ Error loading AR controller:', error);
      }
    }

    this.switching = false;
    console.log('✅ AR mode ready');
  }

  async startMediaPipePose() {
    if (this.switching) {
      console.log('⚠️ Already switching modes, please wait...');
      return;
    }

    this.switching = true;
    console.log('🔮 Starting MediaPipe Pose Detection');

    // CRITICAL: Ensure AR is fully stopped
    if (this.arController && this.arController.isARActive) {
      console.log('🛑 Force stopping AR before pose detection...');
      await this.arController.stopAR();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ AR cleanup done, WebGL released');
    }

    // Hide all selectors, show pose mode
    this.modeSelector.classList.add('hidden');
    this.poseEngineSelector.classList.add('hidden');
    this.arMode.classList.add('hidden');
    this.poseMode.classList.remove('hidden');
    this.currentMode = 'pose';
    this.currentPoseEngine = 'mediapipe';

    // Initialize MediaPipe pose detection controller
    try {
      console.log('🔧 Creating MediaPipe PoseDetectionController...');
      const { default: PoseDetectionController } = await import('./pose/pose-detection.js');
      this.poseController = new PoseDetectionController();

      // Update status text
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = 'Initializing MediaPipe...';
      }
    } catch (error) {
      console.error('❌ Error initializing MediaPipe:', error);
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = 'Error loading MediaPipe';
      }
    }

    this.switching = false;
    console.log('✅ MediaPipe pose detection mode ready');
  }

  async startMoveNetPose() {
    if (this.switching) {
      console.log('⚠️ Already switching modes, please wait...');
      return;
    }

    this.switching = true;
    console.log('⚡ Starting MoveNet Pose Detection');

    // CRITICAL: Ensure AR is fully stopped
    if (this.arController && this.arController.isARActive) {
      console.log('🛑 Force stopping AR before pose detection...');
      await this.arController.stopAR();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ AR cleanup done, WebGL released');
    }

    // Hide all selectors, show pose mode
    this.modeSelector.classList.add('hidden');
    this.poseEngineSelector.classList.add('hidden');
    this.arMode.classList.add('hidden');
    this.poseMode.classList.remove('hidden');
    this.currentMode = 'pose';
    this.currentPoseEngine = 'movenet';

    // Initialize MoveNet pose detection controller
    try {
      console.log('🔧 Creating MoveNet DetectionController...');
      const { default: MoveNetDetectionController } = await import('./pose/movenet-detection.js');
      this.poseController = new MoveNetDetectionController();

      // Update status text
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = 'Initializing MoveNet...';
      }
    } catch (error) {
      console.error('❌ Error initializing MoveNet:', error);
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = 'Error loading MoveNet';
      }
    }

    this.switching = false;
    console.log('✅ MoveNet pose detection mode ready');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM Ready');
  
  // Initialize mode manager
  new ModeManager();
});