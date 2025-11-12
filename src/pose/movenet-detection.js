// MoveNet Pose Detection Controller using TensorFlow.js
class MoveNetDetectionController {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.detector = null;
    this.isActive = false;
    this.animationFrameId = null;

    this.init();
  }

  async init() {
    console.log('⚡ Initializing MoveNet Pose Detection...');

    // Get video and canvas elements
    this.video = document.querySelector('#pose-video');
    this.canvas = document.querySelector('#pose-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Check TensorFlow.js availability
    console.log('📦 Checking TensorFlow.js availability...');
    console.log('window.tf:', typeof window.tf);
    console.log('window.poseDetection:', typeof window.poseDetection);

    if (!window.tf || !window.poseDetection) {
      console.error('❌ TensorFlow.js not loaded');
      this.showError('TensorFlow.js failed to load. Check internet connection.');
      return;
    }

    console.log('✅ TensorFlow.js available');

    await this.setupMoveNet();
  }

  async setupMoveNet() {
    try {
      console.log('🔧 Setting up MoveNet...');

      // Set WebGL backend
      await window.tf.setBackend('webgl');
      await window.tf.ready();
      console.log('✅ TensorFlow backend ready:', window.tf.getBackend());

      // Create MoveNet detector with Lightning model (fastest)
      const detectorConfig = {
        modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25
      };

      console.log('📥 Loading MoveNet model...');
      this.detector = await window.poseDetection.createDetector(
        window.poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );

      console.log('✅ MoveNet detector created');

      // Start camera
      await this.startCamera();

    } catch (error) {
      console.error('❌ Error setting up MoveNet:', error);
      console.error('Error details:', error.message, error.stack);
      this.showError(`MoveNet setup failed: ${error.message}`);
    }
  }

  async startCamera() {
    try {
      console.log('📷 Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      this.video.srcObject = stream;

      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          this.video.play();
          resolve();
        };
      });

      console.log('✅ Camera started');
      this.isActive = true;

      // Update status
      const statusText = document.querySelector('#pose-status-text');
      if (statusText) {
        statusText.textContent = '✅ MoveNet active';
      }

      // Start detection loop
      this.detectPose();

    } catch (error) {
      console.error('❌ Camera access error:', error);
      this.showError(`Camera failed: ${error.message}`);
    }
  }

  async detectPose() {
    if (!this.isActive) return;

    // Draw video frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.scale(-1, 1); // Mirror horizontally
    this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    try {
      // Estimate poses
      const poses = await this.detector.estimatePoses(this.video);

      if (poses.length > 0) {
        const pose = poses[0];

        // Draw keypoints and skeleton
        this.drawPose(pose);

        // Update status
        const statusText = document.querySelector('#pose-status-text');
        if (statusText) {
          statusText.textContent = '✅ Person detected';
        }
      } else {
        const statusText = document.querySelector('#pose-status-text');
        if (statusText) {
          statusText.textContent = '⚠️ No person detected';
        }
      }

    } catch (error) {
      console.error('Detection error:', error);
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(() => this.detectPose());
  }

  drawPose(pose) {
    const keypoints = pose.keypoints;

    // Draw skeleton connections
    const connections = [
      [5, 6],   // shoulders
      [5, 7],   // left shoulder to elbow
      [7, 9],   // left elbow to wrist
      [6, 8],   // right shoulder to elbow
      [8, 10],  // right elbow to wrist
      [5, 11],  // left shoulder to hip
      [6, 12],  // right shoulder to hip
      [11, 12], // hips
      [11, 13], // left hip to knee
      [13, 15], // left knee to ankle
      [12, 14], // right hip to knee
      [14, 16]  // right knee to ankle
    ];

    // Draw connections (lines)
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;

    connections.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      if (kp1.score > 0.3 && kp2.score > 0.3) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - kp1.x, kp1.y);
        this.ctx.lineTo(this.canvas.width - kp2.x, kp2.y);
        this.ctx.stroke();
      }
    });

    // Draw keypoints (dots)
    keypoints.forEach((keypoint, index) => {
      if (keypoint.score > 0.3) {
        const x = this.canvas.width - keypoint.x;
        const y = keypoint.y;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fill();

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });

    // Highlight hands with large colored dots
    // Left wrist (keypoint 9)
    const leftWrist = keypoints[9];
    if (leftWrist && leftWrist.score > 0.3) {
      const x = this.canvas.width - leftWrist.x;
      const y = leftWrist.y;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 15, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#FF00FF';
      this.ctx.fill();

      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Label
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText('LEFT', x + 20, y);
    }

    // Right wrist (keypoint 10)
    const rightWrist = keypoints[10];
    if (rightWrist && rightWrist.score > 0.3) {
      const x = this.canvas.width - rightWrist.x;
      const y = rightWrist.y;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 15, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.fill();

      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Label
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText('RIGHT', x + 20, y);
    }
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
    console.log('🛑 Stopping MoveNet Pose Detection');
    this.isActive = false;

    // Stop animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose TensorFlow.js detector
    if (this.detector) {
      console.log('Disposing MoveNet detector...');
      try {
        this.detector.dispose();
      } catch (error) {
        console.warn('Error disposing detector:', error);
      }
      this.detector = null;
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
      this.video.pause();
      this.video.src = '';
    }

    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    console.log('✅ MoveNet fully stopped');
  }
}

export default MoveNetDetectionController;
