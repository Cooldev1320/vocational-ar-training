// Three.js WebXR AR Controller - Using exact boy-model.html code
import {ARRenderer, Cursor} from "../enva.ts";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {HemisphereLight, DirectionalLight} from "three";

class ThreeJSARController {
  constructor() {
    this.renderer = null;
    this.cursor = null;
    this.boyModel = null;
    this.modelLoaded = false;
    this.placedCount = 0;
    this.isARActive = false;
    this.sceneContainer = document.querySelector('#scene');

    this.init();
  }

  async init() {
    console.log('🔷 Initializing Three.js AR Controller (boy-model.html code)...');

    // Setup enva-xr renderer - EXACT same as boy-model.html
    await this.setupARRenderer();

    // Auto-start AR
    setTimeout(async () => {
      await this.startAR();
    }, 500);
  }

  async setupARRenderer() {
    console.log('🎨 Setting up enva-xr AR Renderer (boy-model.html)...');

    // EXACT same config as boy-model.html
    this.renderer = new ARRenderer({
      domOverlay: true,
      hitTest: true
    });

    // Append renderer canvas to scene container
    this.sceneContainer.innerHTML = '';
    this.sceneContainer.appendChild(this.renderer.canvas);

    // EXACT same as boy-model.html
    let cursor = new Cursor();
    this.renderer.scene.add(cursor);
    this.cursor = cursor;
    console.log('✅ Cursor added');

    // EXACT same lights as boy-model.html
    const hemiLight = new HemisphereLight(0xffffff, 0x444444, 1.0);
    hemiLight.position.set(0, 20, 0);
    this.renderer.scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    this.renderer.scene.add(dirLight);
    console.log('💡 Lights: HemisphereLight + DirectionalLight');

    // EXACT same model loading as boy-model.html
    this.loadBoyModel();

    // EXACT same double-tap handler as boy-model.html
    this.renderer.domContainer.ondblclick = (event) => {
      console.log(`🖱️ Tap! Cursor:${this.cursor.visible} Model:${this.modelLoaded}`);

      if (!this.modelLoaded) {
        console.log('⚠️ Model loading...');
        return;
      }

      if (!this.cursor.visible) {
        console.log('⚠️ Find surface first!');
        return;
      }

      if (this.cursor.visible && this.boyModel) {
        // Deep clone for GLTF models
        let modelClone = this.boyModel.clone(true);
        modelClone.position.copy(this.cursor.position);
        modelClone.position.y += 0.05;

        this.renderer.scene.add(modelClone);
        this.placedCount++;

        const pos = modelClone.position;
        console.log(`✅ PLACED #${this.placedCount} at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
      }
    };

    console.log('✅ AR Renderer setup complete (boy-model.html)');
  }

  loadBoyModel() {
    console.log('📦 Loading /models/boy.glb...');

    const loader = new GLTFLoader();
    loader.load(
      '/models/boy.glb',
      (gltf) => {
        this.boyModel = gltf.scene;
        this.boyModel.scale.set(0.3, 0.3, 0.3);

        // Setup materials and shadows
        this.boyModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.modelLoaded = true;
        console.log(`✅ MODEL LOADED! Meshes: ${this.boyModel.children.length}`);
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`Loading: ${percent}%`);
      },
      (error) => {
        console.error(`❌ ERROR: ${error.message}`);
        console.error('Full error:', error);
      }
    );
  }

  async startAR() {
    console.log('🚀 Starting AR (boy-model.html)...');
    try {
      await this.renderer.start();
      this.isARActive = true;
      console.log('✅ AR started! Double-tap to place.');
    } catch (error) {
      console.error('❌ Failed to start AR:', error);
    }
  }

  async stopAR() {
    console.log('⏹️ Stopping AR');
    try {
      await this.renderer.stop();
      this.isARActive = false;
      console.log('✅ AR stopped');
    } catch (error) {
      console.error('❌ Error stopping AR:', error);
    }
  }
}

export default ThreeJSARController;
