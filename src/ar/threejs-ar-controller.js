// Pure Three.js WebXR AR Controller
class ThreeJSARController {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.xrSession = null;
    this.isARActive = false;
    this.hitTestSource = null;
    this.reticle = null;
    this.placedObjects = [];
    this.modelCount = 0;

    this.arButton = document.querySelector('#ar-button');
    this.resetButton = document.querySelector('#reset-button');
    this.statusText = document.querySelector('#status');
    this.modelCountText = document.querySelector('#model-count');

    this.init();
  }

  init() {
    console.log('🔷 Init Three.js WebXR AR Controller');

    // Setup button listeners
    this.arButton.addEventListener('click', () => this.toggleAR());
    this.resetButton.addEventListener('click', () => this.resetModels());

    // Setup Three.js scene
    this.setupThreeJS();

    // Check AR support
    this.checkARSupport();
  }

  setupThreeJS() {
    console.log('🎨 Setting up Three.js scene...');

    // Get the scene element container
    const sceneContainer = document.querySelector('#scene');

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    // Append renderer to scene container
    sceneContainer.innerHTML = ''; // Clear A-Frame scene
    sceneContainer.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 1);
    this.scene.add(directionalLight);

    // Create reticle (placement indicator)
    this.reticle = this.createReticle();
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    console.log('✅ Three.js scene setup complete');
  }

  createReticle() {
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const reticle = new THREE.Mesh(geometry, material);
    reticle.rotation.x = -Math.PI / 2; // Lay flat
    return reticle;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  async checkARSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
      this.statusText.textContent = '💻 Use mobile device';
      this.arButton.disabled = true;
      return;
    }

    if (!window.isSecureContext) {
      this.statusText.textContent = '🔒 Needs HTTPS';
      this.arButton.disabled = true;
      return;
    }

    if (!navigator.xr) {
      this.statusText.textContent = '❌ WebXR not available';
      this.arButton.disabled = true;
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');

      if (supported) {
        this.statusText.textContent = '✅ Ready (Three.js)';
        this.arButton.disabled = false;
        console.log('✅ AR supported (Three.js mode)');
      } else {
        this.statusText.textContent = '❌ AR unavailable';
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
    console.log('🔷 Entering AR with Three.js WebXR...');
    this.statusText.textContent = 'Starting AR...';

    try {
      // Request XR session with local-floor (standard for AR)
      this.xrSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.querySelector('#ui-overlay') }
      });

      console.log('✅ XR Session created');
      console.log('Session mode:', this.xrSession.mode);
      console.log('Session features:', Array.from(this.xrSession.enabledFeatures || []));

      // Set the session for the renderer
      await this.renderer.xr.setSession(this.xrSession);

      // Request hit test source using 'local-floor' reference space (standard for AR)
      const localFloorSpace = await this.xrSession.requestReferenceSpace('local-floor');
      this.hitTestSource = await this.xrSession.requestHitTestSource({ space: localFloorSpace });

      console.log('✅ Hit test source created');

      // Listen for select events (tap to place)
      this.xrSession.addEventListener('select', (event) => this.onSelect(event));

      // Listen for session end
      this.xrSession.addEventListener('end', () => this.onSessionEnd());

      // Start render loop
      this.renderer.setAnimationLoop((time, frame) => this.onXRFrame(time, frame));

      this.isARActive = true;
      this.statusText.textContent = 'Scanning...';
      this.arButton.textContent = 'Exit AR';

      console.log('✅ AR session started successfully');

    } catch (error) {
      console.error('❌ Failed to enter AR:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);

      // CRITICAL: End session if it was created but setup failed
      if (this.xrSession) {
        console.log('🧹 Cleaning up failed session...');
        try {
          await this.xrSession.end();
          console.log('✅ Failed session cleaned up');
        } catch (endError) {
          console.warn('⚠️ Error ending failed session:', endError);
        }
        this.xrSession = null;
        this.hitTestSource = null;
      }

      if (error?.name === 'NotAllowedError') {
        this.statusText.textContent = '❌ AR blocked - check permissions';
      } else if (error?.name === 'NotSupportedError') {
        this.statusText.textContent = '❌ AR features not supported';
      } else if (error?.message) {
        this.statusText.textContent = `❌ ${error.message}`;
      } else {
        this.statusText.textContent = '❌ AR failed';
      }
    }
  }

  onXRFrame(time, frame) {
    if (!frame) return;

    const referenceSpace = this.renderer.xr.getReferenceSpace();
    const session = frame.session;

    // Perform hit test
    if (this.hitTestSource && referenceSpace) {
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        if (pose) {
          this.reticle.visible = true;
          this.reticle.matrix.fromArray(pose.transform.matrix);
          this.statusText.textContent = '👆 Tap to place';
        }
      } else {
        this.reticle.visible = false;
        this.statusText.textContent = 'Scanning...';
      }
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  onSelect(event) {
    if (!this.reticle.visible) return;

    console.log('🎯 Object placed!');

    // Create a red sphere at reticle position
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);

    // Copy reticle position
    sphere.position.setFromMatrixPosition(this.reticle.matrix);

    this.scene.add(sphere);
    this.placedObjects.push(sphere);

    this.modelCount++;
    this.updateModelCount();

    console.log(`✅ Model ${this.modelCount} placed!`);

    // Show feedback
    this.statusText.textContent = `✅ Placed ${this.modelCount}`;
    setTimeout(() => {
      this.statusText.textContent = '👆 Tap to place';
    }, 1500);
  }

  async exitAR() {
    console.log('⏹️ Exiting AR');

    if (this.xrSession) {
      await this.xrSession.end();
    }
  }

  onSessionEnd() {
    console.log('🛑 AR session ended');

    this.isARActive = false;
    this.xrSession = null;
    this.hitTestSource = null;
    this.reticle.visible = false;

    this.statusText.textContent = '✅ Ready (Three.js)';
    this.arButton.textContent = 'Start AR';

    // Stop animation loop
    this.renderer.setAnimationLoop(null);
  }

  async stopAR() {
    return this.exitAR();
  }

  resetModels() {
    console.log('🗑️ Reset');

    this.placedObjects.forEach(obj => {
      this.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    });

    this.placedObjects = [];
    this.modelCount = 0;
    this.updateModelCount();
    this.statusText.textContent = '🗑️ Cleared';

    setTimeout(() => {
      this.statusText.textContent = this.isARActive ? '👆 Tap to place' : '✅ Ready (Three.js)';
    }, 1500);
  }

  updateModelCount() {
    this.modelCountText.textContent = `Models: ${this.modelCount}`;
  }
}

export default ThreeJSARController;
