// Mode Manager - Handles switching between AR and Pose Detection modes
class ModeManager {
  constructor() {
    this.modeSelector = document.querySelector('#mode-selector');
    this.arEngineSelector = document.querySelector('#ar-engine-selector');
    this.poseEngineSelector = document.querySelector('#pose-engine-selector');
    this.arMode = document.querySelector('#ar-mode');
    this.poseMode = document.querySelector('#pose-mode');
    this.arModeBtn = document.querySelector('#ar-mode-btn');
    this.poseModeBtn = document.querySelector('#pose-mode-btn');
    this.threejsARBtn = document.querySelector('#threejs-ar-btn');
    this.aframeARBtn = document.querySelector('#aframe-ar-btn');
    this.eighthwallARBtn = document.querySelector('#eighthwall-ar-btn');
    this.mediaPipeBtn = document.querySelector('#mediapipe-btn');
    this.moveNetBtn = document.querySelector('#movenet-btn');
    this.backToMainARBtn = document.querySelector('#back-to-main-ar-btn');
    this.backToMainPoseBtn = document.querySelector('#back-to-main-pose-btn');
    this.backToSelectorBtn = document.querySelector('#back-to-selector');

    this.arController = null;
    this.poseController = null;
    this.currentMode = null;
    this.currentPoseEngine = null;
    this.currentAREngine = null;
    this.switching = false;

    this.init();
  }

  init() {
    console.log('🎮 Initializing Mode Manager');

    // Show mode selector by default
    this.showModeSelector();

    // Set up event listeners
    this.arModeBtn.addEventListener('click', () => this.showAREngineSelector());
    this.poseModeBtn.addEventListener('click', () => this.showPoseEngineSelector());
    this.threejsARBtn.addEventListener('click', () => this.startThreeJSAR());
    this.aframeARBtn.addEventListener('click', () => this.startAFrameAR());
    this.eighthwallARBtn.addEventListener('click', () => this.startEighthWallAR());
    this.mediaPipeBtn.addEventListener('click', () => this.startMediaPipePose());
    this.moveNetBtn.addEventListener('click', () => this.startMoveNetPose());
    this.backToMainARBtn.addEventListener('click', () => this.showModeSelector());
    this.backToMainPoseBtn.addEventListener('click', () => this.showModeSelector());
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
    this.arEngineSelector.classList.add('hidden');
    this.poseEngineSelector.classList.add('hidden');
    this.arMode.classList.add('hidden');
    this.poseMode.classList.add('hidden');

    this.currentMode = null;
    this.switching = false;
    console.log('✅ Mode selector ready');
  }

  showAREngineSelector() {
    console.log('🔧 Showing AR engine selector');

    // Hide main selector, show AR engine selector
    this.modeSelector.classList.add('hidden');
    this.arEngineSelector.classList.remove('hidden');
    this.poseEngineSelector.classList.add('hidden');
    this.arMode.classList.add('hidden');
    this.poseMode.classList.add('hidden');

    console.log('✅ AR engine selector ready');
  }

  showPoseEngineSelector() {
    console.log('🔧 Showing pose engine selector');

    // Hide main selector, show pose engine selector
    this.modeSelector.classList.add('hidden');
    this.arEngineSelector.classList.add('hidden');
    this.poseEngineSelector.classList.remove('hidden');
    this.arMode.classList.add('hidden');
    this.poseMode.classList.add('hidden');

    console.log('✅ Pose engine selector ready');
  }

  async startThreeJSAR() {
    if (this.switching) {
      console.log('⚠️ Already switching modes, please wait...');
      return;
    }

    this.switching = true;
    console.log('🔷 Opening boy-model.html...');

    // CRITICAL: Ensure pose detection is fully stopped
    if (this.poseController) {
      console.log('🛑 Force stopping pose detection before AR...');
      this.poseController.stop();
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('✅ Pose cleanup done, WebGL released');
    }

    // Simply navigate to boy-model.html
    window.location.href = '/example/boy-model.html';
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

  startAFrameAR() {
    console.log('🌐 A-Frame WebXR - Coming Soon');
    alert('A-Frame WebXR is coming soon!');
  }

  startEighthWallAR() {
    console.log('🎯 Opening 8th Wall AR experience');
    window.open('https://hoft.8thwall.app/vocational-ar-training/', '_blank');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM Ready');
  
  // Initialize mode manager
  new ModeManager();
});

