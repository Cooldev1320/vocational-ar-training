// A-Frame Native WebXR AR Controller
class WebXRARController {
  constructor() {
    this.scene = document.querySelector('#scene');
    this.arButton = document.querySelector('#ar-button');
    this.resetButton = document.querySelector('#reset-button');
    this.statusText = document.querySelector('#status');
    this.modelCountText = document.querySelector('#model-count');
    this.reticleTarget = document.querySelector('#reticle-target');

    this.modelCount = 0;
    this.isARActive = false;
    this.placedModels = [];

    this.init();
  }

  init() {
    console.log('🚀 Init A-Frame AR Controller');

    this.arButton.addEventListener('click', () => this.toggleAR());
    this.resetButton.addEventListener('click', () => this.resetModels());

    // Listen to A-Frame's AR hit-test events
    this.scene.addEventListener('ar-hit-test-start', () => {
      console.log('🔍 Hit test started - scanning surfaces');
      this.statusText.textContent = 'Scanning...';
    });

    this.scene.addEventListener('ar-hit-test-achieved', () => {
      console.log('✅ Surface detected!');
      this.statusText.textContent = '👆 Tap to place';
    });

    this.scene.addEventListener('ar-hit-test-select', (event) => {
      console.log('🎯 Object placed!', event.detail);
      this.placeModel(event.detail);
    });

    // Listen to enter/exit AR events with more logging
    this.scene.addEventListener('enter-vr', (event) => {
      console.log('🎬 enter-vr event fired', event);
      // Check if we're entering AR (not VR)
      if (this.scene.is('ar-mode')) {
        console.log('✅ Confirmed: entering AR mode');
        this.onEnterAR();
      } else {
        console.log('ℹ️ Entering VR mode (not AR)');
      }
    });

    this.scene.addEventListener('exit-vr', (event) => {
      console.log('🎬 exit-vr event fired', event);
      this.onExitAR();
    });

    // Wait for scene to be fully loaded before checking support
    if (this.scene.hasLoaded) {
      this.checkARSupport();
    } else {
      this.scene.addEventListener('loaded', () => {
        console.log('✅ A-Frame scene loaded');
        this.checkARSupport();
      });
    }
  }

  async checkARSupport() {
    // Check if running on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (!isMobile) {
      this.statusText.textContent = '💻 Use mobile device';
      this.arButton.disabled = true;
      return;
    }

    // Check for secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.warn('⚠️ Not a secure context - WebXR requires HTTPS or localhost');
      this.statusText.textContent = '🔒 Needs HTTPS';
      this.arButton.disabled = true;
      return;
    }

    // Check for WebXR API
    if (!navigator.xr) {
      console.error('❌ WebXR not available');
      if (isAndroid) {
        this.statusText.textContent = '❌ Enable WebXR in chrome://flags';
      } else {
        this.statusText.textContent = '❌ WebXR not supported';
      }
      this.arButton.disabled = true;
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');

      if (supported) {
        this.statusText.textContent = '✅ Ready';
        this.arButton.disabled = false;
        console.log('✅ AR supported');
      } else {
        console.warn('❌ AR session not supported');
        if (isAndroid) {
          this.statusText.textContent = '❌ Install Google ARCore';
        } else {
          this.statusText.textContent = '❌ AR unavailable';
        }
        this.arButton.disabled = true;
      }
    } catch (error) {
      console.error('❌ Support check error:', error);
      this.statusText.textContent = '❌ Check setup';
      this.arButton.disabled = true;
    }
  }

  toggleAR() {
    if (this.isARActive) {
      this.exitAR();
    } else {
      this.enterAR();
    }
  }

  async enterAR() {
    console.log('▶️ Entering AR - Starting WebXR session');
    this.statusText.textContent = 'Starting AR...';

    try {
      const sceneEl = this.scene;

      // Check if scene is ready
      if (!sceneEl.renderer) {
        console.error('❌ Scene renderer not ready');
        this.statusText.textContent = '❌ Scene not ready';
        return;
      }

      // Check WebGL context
      const gl = sceneEl.renderer.getContext();
      if (gl.isContextLost()) {
        console.error('❌ WebGL context is lost');
        this.statusText.textContent = '❌ WebGL error - reload page';
        return;
      }

      console.log('📱 Scene ready, WebGL context OK');
      console.log('Has WebXR system:', !!sceneEl.systems.webxr);

      // Verify AR is still supported before entering
      if (!navigator.xr) {
        console.error('❌ navigator.xr not available');
        this.statusText.textContent = '❌ WebXR not available';
        return;
      }

      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!supported) {
        console.error('❌ AR session not supported at this moment');
        this.statusText.textContent = '❌ AR not available';
        return;
      }

      console.log('✅ AR support verified, entering AR...');

      // Enable hit testing (optional feature)
      this.scene.setAttribute('ar-hit-test', 'enabled', true);

      // Show the reticle when in AR
      this.reticleTarget.setAttribute('visible', true);

      // Use A-Frame's enterVR method directly
      console.log('📱 Calling A-Frame enterVR()...');
      this.statusText.textContent = 'Opening AR...';

      // enterVR() may not return a proper promise, so we rely on events
      const enterVRResult = sceneEl.enterVR();

      // If it returns a promise, await it
      if (enterVRResult && typeof enterVRResult.then === 'function') {
        try {
          await enterVRResult;
          console.log('✅ enterVR() resolved');
        } catch (vrError) {
          console.error('❌ enterVR() rejected:', vrError);
          throw vrError;
        }
      } else {
        console.log('⚠️ enterVR() did not return a promise, relying on events');
      }

    } catch (error) {
      console.error('❌ Failed to enter AR:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      console.error('Error stack:', error?.stack);

      // Provide user-friendly error messages
      let errorMsg = 'AR failed';
      if (error?.name === 'SecurityError') {
        errorMsg = '❌ Camera permission denied';
      } else if (error?.name === 'NotSupportedError') {
        errorMsg = '❌ AR not supported';
      } else if (error?.name === 'InvalidStateError') {
        errorMsg = '❌ Invalid state - try reload';
      } else if (error?.message) {
        errorMsg = `❌ ${error.message}`;
      } else {
        errorMsg = '❌ AR failed - check ARCore';
      }

      this.statusText.textContent = errorMsg;
    }
  }

  async exitAR() {
    console.log('⏹️ Exiting AR');

    try {
      // Use A-Frame's exitVR method
      if (this.scene) {
        this.scene.exitVR();
        console.log('✅ Exited AR session');

        // Wait for session to fully close
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('❌ Error exiting AR:', error);
    }
  }

  async stopAR() {
    return this.exitAR();
  }

  onEnterAR() {
    console.log('✅✅✅ AR SESSION ACTIVE');
    this.isARActive = true;
    this.statusText.textContent = 'Scanning...';
    this.arButton.textContent = 'Exit AR';
  }

  onExitAR() {
    console.log('🛑 AR SESSION ENDED');
    this.isARActive = false;
    this.statusText.textContent = '✅ Ready';
    this.arButton.textContent = 'Start AR';

    // Hide reticle
    if (this.reticleTarget) {
      this.reticleTarget.setAttribute('visible', false);
    }

    // Disable hit testing
    this.scene.setAttribute('ar-hit-test', 'enabled', false);
  }

  placeModel(hitTestData) {
    console.log('🎨 Placing model at:', hitTestData.position);

    const modelContainer = document.querySelector('#model-container');

    // Create a bright red sphere
    const sphere = document.createElement('a-sphere');
    sphere.setAttribute('radius', '0.2');
    sphere.setAttribute('color', '#FF0000');
    sphere.setAttribute('material', 'shader: flat');

    // Position from hit-test data
    const pos = hitTestData.position;
    sphere.setAttribute('position', `${pos.x} ${pos.y + 0.2} ${pos.z}`);

    console.log(`🎯 Creating sphere at: ${pos.x} ${pos.y + 0.2} ${pos.z}`);

    modelContainer.appendChild(sphere);
    this.placedModels.push(sphere);

    this.modelCount++;
    this.updateModelCount();

    console.log(`✅ Model ${this.modelCount} placed!`);
    console.log(`📊 Total models: ${this.placedModels.length}`);

    // Show feedback
    this.statusText.textContent = `✅ Placed ${this.modelCount}`;
    setTimeout(() => {
      this.statusText.textContent = '👆 Tap to place';
    }, 1500);
  }

  resetModels() {
    console.log('🗑️ Reset');

    const modelContainer = document.querySelector('#model-container');

    // Remove all placed models
    this.placedModels.forEach(model => {
      if (model && model.parentNode) {
        modelContainer.removeChild(model);
      }
    });

    this.placedModels = [];
    this.modelCount = 0;
    this.updateModelCount();
    this.statusText.textContent = '🗑️ Cleared';

    setTimeout(() => {
      this.statusText.textContent = this.isARActive ? '👆 Tap to place' : '✅ Ready';
    }, 1500);
  }

  updateModelCount() {
    this.modelCountText.textContent = `Models: ${this.modelCount}`;
  }
}

export default WebXRARController;
