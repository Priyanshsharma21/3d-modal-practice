# Digital Jewellery Studio - POC

A high-performance 3D jewellery viewer built with Next.js and Three.js, featuring advanced material switching, multiple HDRI lighting presets, camera controls, diamond sparkle effects, and professional-grade rendering capabilities.

## ✨ Enhanced Features (Beyond POC Requirements)

### Core 3D Features
- **Advanced 3D Viewer**: Full 3D rotatable jewellery viewer with Three.js
- **Material Switching**: Real-time switching between Yellow Gold, Rose Gold, and Platinum with PBR materials
- **Multiple HDRI Lighting Presets**: Studio, Dramatic, Soft, and Natural lighting environments
- **Camera Presets**: 5 professional camera angles (Front, Side, Top, Detail, Isometric)
- **Zoom to Fit**: Smart camera positioning that automatically frames the model

### Advanced Rendering
- **Diamond Sparkle Effects**: Animated particle system for realistic diamond sparkles
- **Bloom Post-Processing**: Enhanced visual effects for gemstones and metals
- **Enhanced Diamond Material**: Realistic diamond rendering with proper IOR (2.417), transmission, and clearcoat
- **Multiple Point Lights**: Professional 3-light setup for optimal jewellery illumination
- **Shadow Mapping**: High-quality soft shadows (2048x2048 resolution)

### Professional Tools
- **High-Resolution Screenshot**: Capture 2x resolution images for marketing materials
- **Fullscreen Mode**: Immersive viewing experience for large displays
- **Performance Stats**: Real-time FPS counter and model statistics (vertices, faces, materials)
- **Keyboard Shortcuts**: Power user controls for efficient navigation
- **Drag & Drop**: Drop GLB/GLTF files directly into the viewer with auto-centering and scaling

### User Experience
- **Glassmorphism UI**: Modern, elegant interface with backdrop blur effects
- **Responsive Design**: Optimized for large screens (55") and tablets
- **Auto-Rotate**: Optional automatic rotation with smooth damping
- **Loading States**: Beautiful loading animations with progress feedback
- **Touch Optimized**: Smooth controls for tablet interactions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Usage

#### Basic Controls
1. **View Default Ring**: The app loads with a default procedural ring model with multiple diamonds
2. **Change Materials**: Click the metal material buttons (Gold, Rose Gold, Platinum) to change the appearance in real-time
3. **Toggle Auto-Rotate**: Use the checkbox or press `R` to enable/disable automatic rotation
4. **Load Custom Models**: Drag and drop any `.glb` or `.gltf` file onto the viewer (auto-centers and scales)

#### Camera Controls
- **Mouse/Touch**: Click and drag to rotate, scroll/pinch to zoom, right-click/drag to pan
- **Camera Presets**: Click preset buttons or use number keys (1-5):
  - `1` - Front view
  - `2` - Side view
  - `3` - Top view
  - `4` - Detail view (close-up)
  - `5` - Isometric view
- **Zoom to Fit**: Click "Zoom to Fit" button to automatically frame the model

#### Lighting
- **Lighting Presets**: Switch between Studio, Dramatic, Soft, and Natural HDRI environments
- Each preset loads a different HDRI map for varied lighting conditions

#### Advanced Features
- **Screenshot**: Press `C` or click the camera button to capture high-resolution images
- **Fullscreen**: Press `F` or click the fullscreen button for immersive viewing
- **Stats**: Press `S` or click the stats button to view model information and performance metrics
- **Reset**: Click "Reset to Default Ring" to return to the default model

#### Keyboard Shortcuts
- `R` - Toggle auto-rotate
- `F` - Toggle fullscreen
- `S` - Toggle statistics panel
- `C` - Capture screenshot
- `1-5` - Switch camera presets

## Project Structure

```
app/
  components/
    JewelleryViewer.tsx  # Main 3D viewer component
  page.tsx               # Home page
  layout.tsx             # Root layout
  globals.css            # Global styles
```

## Technologies

- **Next.js 16**: React framework with Turbopack
- **Three.js**: 3D graphics library with post-processing
- **TypeScript**: Type safety and better DX
- **Tailwind CSS 4**: Modern utility-first styling
- **RGBELoader**: HDRI environment map loading
- **GLTFLoader**: GLB/GLTF model loading
- **OrbitControls**: Smooth camera controls
- **EffectComposer**: Post-processing pipeline (bloom effects)

## POC Requirements Met

✅ **Full 3D rotatable jewellery viewer (GLB/GLTF)** - Complete with drag-and-drop support  
✅ **Rotate, zoom, pan controls** - Smooth OrbitControls with damping  
✅ **PBR materials (gold, rose gold, platinum)** - Realistic metal rendering with proper metalness/roughness  
✅ **HDRI/Environment lighting** - Multiple HDRI presets with real-time switching  
✅ **Quick load and smooth performance** - Optimized rendering with 60+ FPS  
✅ **Metal colour change** - Real-time material switching  
✅ **Modern UI with glassmorphism design** - Professional, elegant interface  

## 🚀 Extra Features (Beyond Requirements)

✨ **Diamond Sparkle Effects** - Animated particle system for realistic gemstone sparkles  
✨ **Camera Presets** - 5 professional viewing angles for showcasing jewellery  
✨ **Lighting Presets** - 4 different HDRI environments (Studio, Dramatic, Soft, Natural)  
✨ **High-Resolution Screenshots** - Capture 2x resolution images for marketing  
✨ **Fullscreen Mode** - Immersive viewing for large displays  
✨ **Performance Monitoring** - Real-time FPS and model statistics  
✨ **Keyboard Shortcuts** - Power user controls for efficient navigation  
✨ **Enhanced Diamond Material** - Realistic rendering with proper IOR and transmission  
✨ **Bloom Post-Processing** - Visual effects for enhanced gemstone appearance  
✨ **Smart Camera Controls** - Auto-centering, zoom-to-fit, and intelligent framing  
✨ **Professional Lighting Setup** - Multi-light configuration for optimal illumination  
✨ **Model Statistics** - Display vertices, faces, and material count  
✨ **Responsive Design** - Optimized for tablets and large screens (55")  

## Next Steps (Full Project)

- WebAR try-on functionality
- Advanced catalogue with filters
- Admin dashboard
- WhatsApp-based customer approval
- Backend API integration
- CDN for 3D models

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm run build
```

Then deploy to Vercel or your preferred hosting platform.

## License

All source code, UI, 3D pipeline, libraries & integrations belong to Aagam Jain.
