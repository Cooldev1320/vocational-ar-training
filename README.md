# Vocational AR Training

A mobile-first WebXR application for vocational training with **AR mode** and **Pose Detection** capabilities. Built with Three.js WebXR and MediaPipe/MoveNet for real-time pose tracking.

## 🚀 Live Demo

**Try it now:** [https://vocational-ar-training.vercel.app/](https://vocational-ar-training.vercel.app/)

## Features

- **AR Mode**: Place 3D models in augmented reality using Three.js WebXR
- **Pose Detection**: Real-time body and hand tracking with two engine options:
  - **MediaPipe**: Google's ML solution for pose detection
  - **MoveNet**: TensorFlow.js-based faster alternative
- **FPS Counter**: Real-time framerate display for performance monitoring
- **Mode Selector**: Beautiful UI to choose between AR and Pose Detection modes
- **Mobile Optimized**: Works on Android devices with Chrome

## Setup

### Prerequisites
- Node.js (v14 or higher)
- A WebXR-compatible browser (Chrome on Android recommended)
- HTTPS connection (required for WebXR)

### Installation

```bash
npm install
npm run dev
```

The dev server will start on `https://localhost:3000` with SSL enabled.

### Accessing on Mobile

1. Connect your phone to the same network as your development machine
2. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
3. On your phone, open Chrome and navigate to `https://[YOUR-IP]:3000`
4. Accept the SSL certificate warning (it's a self-signed cert for development)

## Usage

### AR Mode
1. Click "AR Mode" from the main menu
2. Select "Three.js WebXR" engine
3. Grant camera permissions when prompted
4. Point your camera at a flat surface
5. Double-tap to place 3D models
6. FPS counter shows real-time performance

### Pose Detection Mode
1. Click "Pose Detection" from the main menu
2. Choose between:
   - **MediaPipe**: More accurate, Google's ML solution
   - **MoveNet**: Faster, TensorFlow.js-based
3. Grant camera permissions
4. See real-time pose tracking with dots and lines following your movements
5. Hand movements are highlighted with colored dots
6. FPS counter displays detection framerate

## Project Structure

```
vocational-ar-training/
├── public/
│   └── models/
│       └── boy.glb              # 3D model for AR
├── src/
│   ├── ar/
│   │   └── threejs-ar-controller.js  # Three.js WebXR AR controller
│   ├── pose/
│   │   ├── pose-detection.js    # MediaPipe pose detection
│   │   └── movenet-detection.js # MoveNet pose detection
│   ├── main.js                  # Mode manager and app entry
│   ├── style.css                # UI styles
│   ├── ARRenderer.ts            # WebXR renderer (enva-xr)
│   └── enva.ts                  # AR utilities
├── example/
│   └── boy-model.html           # Standalone AR example
├── index.html                   # Main HTML
├── vite.config.js               # Vite config with SSL
└── package.json
```

## Technologies

- **Three.js** - 3D graphics and WebXR rendering
- **enva-xr** - Environment-aware AR renderer
- **MediaPipe** - Google's ML pose detection
- **TensorFlow.js** - MoveNet pose detection
- **WebXR Device API** - AR/VR capabilities
- **Vite** - Dev server with HTTPS support

## Browser Compatibility

### Supported
- **Android**: Chrome 79+ (recommended)
- **Android**: Edge 79+

### Limited/No Support
- **iOS**: WebXR AR not yet supported in Safari (as of 2024)
- **Desktop**: AR mode requires mobile device, but Pose Detection works on desktop
- **Firefox**: Limited WebXR support

## Troubleshooting

### "WebXR not supported"
- Make sure you're using Chrome on Android
- Check that you're on HTTPS (required for WebXR)
- Update Chrome to the latest version

### Camera permission denied
- Go to Chrome Settings > Site Settings > Camera
- Find your site and set to "Allow"

### Pose detection not working
- Ensure camera permissions are granted
- Check internet connection (MediaPipe loads from CDN)
- Try the alternative engine (MediaPipe vs MoveNet)

### SSL certificate warning
- This is normal for local development with self-signed certs
- Click "Advanced" and "Proceed" to continue
- For production, use a proper SSL certificate

## Development

### Running the dev server
```bash
npm run dev
```

### Building for production
```bash
npm run build
```

The built files will be in the `dist/` folder.

## License

MIT

---

Built for vocational training with AR and pose detection capabilities.
