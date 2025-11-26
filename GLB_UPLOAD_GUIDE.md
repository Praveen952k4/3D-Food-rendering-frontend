# GLB 3D Model Upload Guide

## Customer Home Page Features

### 1. **Camera Access for AR View**
- **Camera Toggle Button**: Located at bottom-left of the screen
- **Features**:
  - Click camera icon to activate rear camera
  - View live camera feed with AR overlay
  - Point camera at surfaces to preview 3D food models
  - Click X icon to close camera view

### 2. **Horizontal Food Carousel**
- **Scrollbar**: Now visible at the bottom of the food carousel
- **Custom Styling**: Purple gradient scrollbar matching app theme
- **Smooth Scrolling**: Swipe/scroll horizontally to browse food items

### 3. **3D Model Viewing**
- Click any food item to open 3D viewer
- Rotate, zoom, and pan the 3D model
- View with AR camera overlay
- Add directly to cart from 3D view

---

## Admin Panel - GLB File Upload

### Upload Options:

#### **Option 1: Direct GLB URL**
1. Go to Admin → Food Management
2. Click "Add New Food" or edit existing item
3. Find "3D Model URL (.glb file)" field
4. Paste URL of your GLB file
   - Example: `https://example.com/models/food.glb`
   - Or use CDN links from sites like Sketchfab, Poly Pizza, etc.

#### **Option 2: File Upload (Coming Soon)**
1. Click "Upload GLB File" button
2. Select .glb or .gltf file from your device
3. File will be uploaded to cloud storage
4. URL will automatically populate in the model field

### Where to Get GLB Models:

#### Free 3D Model Resources:
- **Poly Pizza**: https://poly.pizza (Free CC0 models)
- **Sketchfab**: https://sketchfab.com (Many free models)
- **Google Poly Archive**: https://poly.google.com
- **TurboSquid Free**: https://www.turbosquid.com/Search/3D-Models/free/glb

#### Create Your Own:
- **Blender** (Free): Export as GLB format
- **Spline** (Free): https://spline.design
- **Vectary** (Free tier): https://www.vectary.com

### Supported Formats:
- `.glb` (Binary GLTF) - **Recommended**
- `.gltf` (JSON GLTF)

### Best Practices:
1. **File Size**: Keep GLB files under 5MB for fast loading
2. **Textures**: Include embedded textures in GLB
3. **Optimization**: Use tools like gltf-pipeline to compress models
4. **Testing**: Always preview models in 3D viewer before saving

---

## Current Implementation Status

✅ **Completed Features:**
- Camera access with AR preview
- Bottom scrollbar on food carousel
- GLB model URL input field
- 3D viewer with GLB loader
- Backend modelUrl field in database
- File upload button (UI ready)

⚠️ **Next Steps for Production:**
1. Set up cloud storage (AWS S3, Cloudinary, Firebase Storage)
2. Implement file upload API endpoint
3. Add image upload for food photos
4. Compress and optimize uploaded GLB files
5. Add loading states for model loading

---

## Database Schema

The FoodItem model now includes:
```javascript
{
  name: String,
  category: String,
  price: Number,
  description: String,
  imageUrl: String,      // Food photo URL
  modelUrl: String,      // GLB 3D model URL (NEW)
  modelPath: String,     // Legacy field
  isVeg: Boolean,
  isAvailable: Boolean
}
```

---

## Testing the Features

### Test Camera Access:
1. Open customer home page
2. Click camera icon (bottom-left)
3. Allow camera permissions
4. Should see live camera feed in overlay

### Test GLB Model:
1. Admin panel → Add food item
2. Add this sample GLB URL:
   ```
   https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb
   ```
3. Save item
4. View in customer home page
5. Click item to see 3D avocado model

---

## Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Camera Access | ✅ | ✅ | ✅ | ✅ |
| GLB Loading | ✅ | ✅ | ✅ | ✅ |
| Custom Scrollbar | ✅ | ✅ | ⚠️ | ✅ |

⚠️ Firefox uses standard scrollbar styling

---

## Troubleshooting

### Camera Not Working:
- Check browser permissions
- Use HTTPS (camera requires secure context)
- Try different browser
- Check device camera availability

### GLB Model Not Loading:
- Verify URL is accessible
- Check file format (.glb extension)
- Ensure CORS headers are set on model host
- Try sample model from above
- Check browser console for errors

### Scrollbar Not Visible:
- Works on Chrome, Edge, Safari
- Firefox uses default scrollbar
- Mobile browsers may hide scrollbar

---

**Note**: For production deployment, implement proper file upload with cloud storage integration.
