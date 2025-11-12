// Pose Detection Controller using MediaPipe
class PoseDetectionController {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.detector = null;
    this.camera = null;
    this.isActive = false;
    this.animationFrameId = null;
    this.poseLandmarks = null;

    this.init();
  }

  async init() {
    console.log('🎯 Initializing Pose Detection...');

    // Get video and canvas elements
    this.video = document.querySelector('#pose-video');
    this.canvas = document.querySelector('#pose-canvas');
    this.ctx = this.canvas.getContext('2d');

    console.log('📦 Checking MediaPipe availability...');
    console.log('window.Pose:', typeof window.Pose, window.Pose);
    console.log('window.Camera:', typeof window.Camera, window.Camera);
    console.log('window.drawConnectors:', typeof window.drawConnectors);
    console.log('window.drawLandmarks:', typeof window.drawLandmarks);
    console.log('window.POSE_CONNECTIONS:', typeof window.POSE_CONNECTIONS);

    // Check if scripts are still loading
    const scripts = document.querySelectorAll('script[src*="mediapipe"]');
    console.log('MediaPipe script tags found:', scripts.length);
    scripts.forEach((script, i) => {
      console.log(`Script ${i + 1}:`, script.src, 'loaded:', script.complete);
    });

    // Wait for MediaPipe to load if not already available
    if (window.Pose) {
      console.log('✅ MediaPipe Pose found immediately');
      await this.setupMediaPipePose();
    } else {
      console.log('⏳ Waiting for MediaPipe scripts to load...');
      // Wait for MediaPipe scripts to load
      await this.waitForMediaPipe();
      if (window.Pose) {
        console.log('✅ MediaPipe Pose loaded after waiting');
        await this.setupMediaPipePose();
      } else {
        console.error('❌ MediaPipe Pose not available');
        this.showError('MediaPipe failed to load. Check internet connection.');
      }
    }
  }

  waitForMediaPipe() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max wait

      const checkInterval = setInterval(() => {
        attempts++;

        if (window.Pose) {
          console.log(`✅ MediaPipe Pose loaded after ${attempts * 100}ms`);
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('❌ MediaPipe not loaded after 10 seconds');
          console.error('Final check - window.Pose:', window.Pose);
          resolve();
        } else if (attempts % 10 === 0) {
          console.log(`⏳ Still waiting... (${attempts * 100}ms)`);
        }
      }, 100);
    });
  }


  async setupMediaPipePose() {
    try {
      console.log('🔧 Setting up MediaPipe Pose...');

      if (!window.Pose) {
        throw new Error('MediaPipe Pose not available');
      }

      // Create Pose instance
      this.detector = new window.Pose({
        locateFile: (file) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`;
          console.log('Loading file:', url);
          return url;
        }
      });

      console.log('✅ Pose instance created');

      // Set options
      this.detector.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      console.log('✅ Pose options set');

      // Set results callback
      this.detector.onResults((results) => {
        this.onResults(results);
      });

      console.log('✅ onResults callback set');

      // Initialize the detector if method exists
      if (typeof this.detector.initialize === 'function') {
        await this.detector.initialize();
        console.log('✅ Pose initialized');
      } else {
        console.log('ℹ️ Pose detector doesn\'t require explicit initialization');
      }

      // Start camera with Camera utility
      await this.startCameraWithMediaPipe();

    } catch (error) {
      console.error('❌ Error setting up MediaPipe pose detection:', error);
      console.error('Error details:', error.message, error.stack);
      this.showError(`MediaPipe setup failed: ${error.message}`);
    }
  }

  async setupAlternativePoseDetection() {
    // Fallback: Use TensorFlow.js MoveNet if MediaPipe fails
    try {
      console.log('Trying TensorFlow.js MoveNet as fallback...');
      // This is a simpler approach using webcam and basic pose estimation
      await this.startWebcam();
      this.startBasicPoseDetection();
    } catch (error) {
      console.error('All pose detection methods failed:', error);
      this.showError('Pose detection not available. Please check camera permissions.');
    }
  }

  async startCameraWithMediaPipe() {
    try {
      console.log('📷 Starting camera with MediaPipe Camera utility...');

      if (!window.Camera) {
        throw new Error('MediaPipe Camera utility not available');
      }

      // Create Camera instance
      this.camera = new window.Camera(this.video, {
        onFrame: async () => {
          if (this.detector && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            await this.detector.send({ image: this.video });
          }
        },
        width: 640,
        height: 480
      });

      console.log('✅ Camera instance created');

      // Start the camera
      await this.camera.start();

      console.log('✅ Camera started');
      this.isActive = true;

      // Set canvas size
      this.canvas.width = 640;
      this.canvas.height = 480;

      // Update status
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = 'Camera active - waiting for detection...';
      }

    } catch (error) {
      console.error('❌ Camera access error:', error);
      this.showError(`Camera failed: ${error.message}`);
    }
  }

  async startWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });

    this.video.srcObject = stream;
    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.video.play();
        resolve();
      };
    });
  }

  // detectPose method removed - Camera utility handles frame loop

  onResults(results) {
    // Clear canvas
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (results.poseLandmarks) {
      this.poseLandmarks = results.poseLandmarks;

      console.log('🎯 Pose detected! Drawing landmarks...');

      // ALWAYS draw manually for reliability - don't rely on MediaPipe drawing utils
      // Draw connections first (lines behind dots)
      this.drawConnectionsManual(results.poseLandmarks);

      // Draw body landmarks (green dots)
      this.drawLandmarksManual(results.poseLandmarks);

      // Highlight hands specifically with LARGE colorful dots
      const leftWrist = results.poseLandmarks[15];
      const rightWrist = results.poseLandmarks[16];
      const leftIndex = results.poseLandmarks[19];
      const rightIndex = results.poseLandmarks[20];
      const leftThumb = results.poseLandmarks[21];
      const rightThumb = results.poseLandmarks[22];

      // Draw left hand tracking
      if (leftWrist) {
        this.drawHandLandmarks(leftWrist, leftIndex, leftThumb, '#FF00FF', 'LEFT');
      }

      // Draw right hand tracking
      if (rightWrist) {
        this.drawHandLandmarks(rightWrist, rightIndex, rightThumb, '#00FFFF', 'RIGHT');
      }

      // Update status
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = '✅ Tracking active';
      }
    } else {
      // No pose detected
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = '⚠️ No person detected';
      }
    }

    this.ctx.restore();
  }

  drawLandmarksManual(landmarks) {
    // Draw all body landmarks as visible green dots
    landmarks.forEach((landmark, index) => {
      // Draw even if visibility is low for better feedback
      const x = landmark.x * this.canvas.width;
      const y = landmark.y * this.canvas.height;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#00FF00';
      this.ctx.fill();

      // Add white border for better visibility
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    });
  }

  drawConnectionsManual(landmarks) {
    // Key connections for pose (simplified)
    const connections = [
      [11, 12], // shoulders
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], // torso
      [23, 24], // hips
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28]  // right leg
    ];

    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        this.ctx.beginPath();
        this.ctx.moveTo(
          startPoint.x * this.canvas.width,
          startPoint.y * this.canvas.height
        );
        this.ctx.lineTo(
          endPoint.x * this.canvas.width,
          endPoint.y * this.canvas.height
        );
        this.ctx.stroke();
      }
    });
  }

  drawHandLandmarks(wrist, index, thumb, color, label) {
    if (!wrist) return;

    const wristX = wrist.x * this.canvas.width;
    const wristY = wrist.y * this.canvas.height;

    // Draw LARGE wrist dot with pulsing effect
    this.ctx.beginPath();
    this.ctx.arc(wristX, wristY, 15, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();

    // White border for better visibility
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Draw label
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(label, wristX + 20, wristY);

    // Draw line from wrist to index finger
    if (index) {
      this.ctx.beginPath();
      this.ctx.moveTo(wristX, wristY);
      this.ctx.lineTo(
        index.x * this.canvas.width,
        index.y * this.canvas.height
      );
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 5;
      this.ctx.stroke();

      // Draw index finger dot
      this.ctx.beginPath();
      this.ctx.arc(
        index.x * this.canvas.width,
        index.y * this.canvas.height,
        10,
        0,
        2 * Math.PI
      );
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw line from wrist to thumb
    if (thumb) {
      this.ctx.beginPath();
      this.ctx.moveTo(wristX, wristY);
      this.ctx.lineTo(
        thumb.x * this.canvas.width,
        thumb.y * this.canvas.height
      );
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 5;
      this.ctx.stroke();

      // Draw thumb dot
      this.ctx.beginPath();
      this.ctx.arc(
        thumb.x * this.canvas.width,
        thumb.y * this.canvas.height,
        10,
        0,
        2 * Math.PI
      );
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  startBasicPoseDetection() {
    // Basic fallback visualization
    this.isActive = true;
    const draw = () => {
      if (!this.isActive) return;
      
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      // Simple message overlay
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, 60);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Pose detection initializing...', this.canvas.width / 2, 35);
      
      this.animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
  }

  showError(message) {
    if (this.ctx) {
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  stop() {
    console.log('🛑 Stopping Pose Detection - FULL CLEANUP');
    this.isActive = false;

    // Close MediaPipe detector to release WebGL resources
    if (this.detector) {
      console.log('Closing MediaPipe Pose detector...');
      try {
        if (typeof this.detector.close === 'function') {
          this.detector.close();
        }
      } catch (error) {
        console.warn('Error closing detector:', error);
      }
      this.detector = null;
    }

    // Stop MediaPipe Camera if using it
    if (this.camera) {
      console.log('Stopping MediaPipe Camera...');
      try {
        this.camera.stop();
      } catch (error) {
        console.warn('Error stopping camera:', error);
      }
      this.camera = null;
    }

    // Stop any manual animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop video stream tracks
    if (this.video) {
      if (this.video.srcObject) {
        const tracks = this.video.srcObject.getTracks();
        console.log(`Stopping ${tracks.length} video tracks...`);
        tracks.forEach(track => {
          track.stop();
          console.log(`Track ${track.kind} stopped`);
        });
        this.video.srcObject = null;
      }
      // Pause and clear video
      this.video.pause();
      this.video.src = '';
    }

    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    console.log('✅ Pose detection fully stopped - WebGL resources released');
  }
}

export default PoseDetectionController;

