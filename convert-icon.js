const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function convertSvgToPng() {
  try {
    const svgPath = path.join(__dirname, 'assets/icons/icon.svg');
    
    console.log('Reading SVG from:', svgPath);
    
    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.error('SVG file does not exist:', svgPath);
      return;
    }
    
    // Create assets/icons directory if it doesn't exist
    const iconsDir = path.join(__dirname, 'assets/icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    // Load the SVG image
    const img = await loadImage(svgPath);
    
    // Create standard icon (512x512)
    await createPngIcon(img, 'icon.png', 512);
    
    // Create macOS specific icon (16x16)
    await createPngIcon(img, 'icon-mac.png', 16);
    
    // Create macOS Retina icon (32x32)
    await createPngIcon(img, 'icon-mac@2x.png', 32);
    
    console.log('All PNG files created successfully');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

async function createPngIcon(img, filename, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw the image on the canvas
  ctx.drawImage(img, 0, 0, size, size);
  
  // Convert canvas to PNG buffer
  const buffer = canvas.toBuffer('image/png');
  
  // Write the PNG file
  const pngPath = path.join(__dirname, 'assets/icons', filename);
  fs.writeFileSync(pngPath, buffer);
  
  console.log(`PNG file created successfully: ${pngPath} (${size}x${size})`);
}

convertSvgToPng();