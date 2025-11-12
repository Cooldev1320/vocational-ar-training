# Hand Washing AR Training

A mobile-first WebXR application for vocational training built with **A-Frame**. Place 3D hand-washing models in augmented reality with an interactive UI overlay that persists in AR mode.

## Features

- **Mobile AR Support**: Works on Android phones with Chrome
- **WebXR Hit-Test**: Accurate floor detection and model placement
- **Persistent UI Overlay**: Interactive buttons and status display work in AR mode
- **Tap-to-Place**: Simple touch interaction to place models
- **Model Counter**: Track how many models you've placed
- **Reset Functionality**: Clear all models with one button
- **Responsive Design**: Optimized for mobile, tablet, and desktop

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

The dev server will start on https://localhost:3000 with SSL enabled.

### Accessing on Mobile

1. Connect your phone to the same network as your development machine
2. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
3. On your phone, open Chrome and navigate to `https://[YOUR-IP]:3000`
4. Accept the SSL certificate warning (it's a self-signed cert for development)

## Usage

### Mobile AR (Android)
1. Open the app in Chrome on your Android device
2. Tap "Enter AR" button
3. Grant camera permissions when prompted
4. Point your camera at the floor/ground
5. Tap anywhere on the screen to place hand-washing models
6. Use "Reset Models" button to clear all placed models

### Desktop Preview
- Open in desktop Chrome to see the 3D scene
- Press SPACEBAR or click to place models
- AR mode won't work on desktop (requires mobile device with AR support)

## Project Structure

```
vocational-ar-training_aframe/
├── public/
│   └── models/
│       └── hand-washing.glb    # 3D model file
├── src/
│   ├── main.js                 # AR logic and components
│   └── style.css               # UI overlay styles
├── index.html                  # Main HTML with A-Frame scene
├── vite.config.js              # Vite config with SSL
└── package.json
```

## Technologies

- **A-Frame 1.6.0** - WebXR framework
- **WebXR Device API** - AR/VR capabilities
- **WebXR Hit-Test API** - Surface detection
- **Vite** - Dev server with HTTPS support

## How It Works

### A-Frame Scene
The app uses A-Frame's declarative HTML approach to create a 3D/AR scene:
- `<a-scene webxr>` enables WebXR mode with hit-test support
- `dom-overlay` feature keeps HTML UI visible in AR mode
- Custom `ar-hit-test` component handles surface detection

### UI Overlay
The UI overlay (`#ui-overlay`) is specified in the WebXR session options and persists in AR mode:
- Header with title and status
- Control buttons (Enter AR, Reset Models)
- Instructions and model counter
- All styled with glassmorphism effects for better visibility

### Tap-to-Place
The `ARController` class handles user interactions:
1. Detects touch/click events
2. Gets hit-test results from the AR session
3. Places models at the detected surface location
4. Falls back to camera-relative placement if hit-test unavailable

### Model Management
- Models are loaded from `/public/models/hand-washing.glb`
- Each placement creates a new entity cloned from the asset
- Animated scale effect on placement
- Random rotation for variety

## Customization

### Change Model
Replace `/public/models/hand-washing.glb` with your own GLB/GLTF model and update `index.html:40`:
```html
<a-asset-item id="hand-washing-model" src="/models/your-model.glb"></a-asset-item>
```

### Adjust Model Scale
Edit scale in `src/main.js:162`:
```javascript
modelEntity.setAttribute('scale', '0.2 0.2 0.2'); // Adjust these values
```

### Modify UI Colors
Edit `src/style.css` - look for the gradient in `.btn-primary`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Change Placement Distance
Edit distance in `src/main.js:192`:
```javascript
const distance = 1.5; // Meters in front of camera
```

## Browser Compatibility

### Supported
- **Android**: Chrome 79+ (recommended)
- **Android**: Edge 79+

### Limited/No Support
- **iOS**: WebXR AR not yet supported in Safari (as of 2024)
- **Desktop**: No AR capability (3D preview works)
- **Firefox**: Limited WebXR support

## Troubleshooting

### "WebXR not supported"
- Make sure you're using Chrome on Android
- Check that you're on HTTPS (required for WebXR)
- Update Chrome to the latest version

### Camera permission denied
- Go to Chrome Settings > Site Settings > Camera
- Find your site and set to "Allow"

### Models not placing
- Make sure hit-test is working (check console logs)
- Try the fallback by tapping screen multiple times
- Ensure good lighting and a visible floor/surface

### UI not showing in AR
- This should work automatically with `dom-overlay` feature
- If not, your device may not support this WebXR feature
- Check console for error messages

### SSL certificate warning
- This is normal for local development with self-signed certs
- Click "Advanced" and "Proceed" to continue
- For production, use a proper SSL certificate

## Development Notes

- The `ar-hit-test` component in `main.js` integrates with WebXR's hit-test API
- Hit-test requires `local-floor` reference space and viewer space
- The scene uses A-Frame's entity-component system for modularity
- UI overlay uses `pointer-events: none` on the container but enables it for interactive elements

## Production Deployment

For production:
1. Build the project: `npm run build`
2. Deploy the `dist` folder to a static host with HTTPS
3. Ensure your domain has a valid SSL certificate
4. Test on real Android devices

## References

- [A-Frame Documentation](https://aframe.io/docs/)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [WebXR Hit-Test](https://immersive-web.github.io/hit-test/)
- [WebXR Samples](https://immersive-web.github.io/webxr-samples/)

## License

MIT

---

Built with A-Frame for vocational training in augmented reality.
