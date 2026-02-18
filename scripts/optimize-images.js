const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../public/gallery');
const outputDir = path.join(__dirname, '../public/gallery-optimized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeImage(filename) {
  const inputPath = path.join(inputDir, filename);
  const name = path.parse(filename).name;
  
  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  ${filename} not found, skipping...`);
    return;
  }

  console.log(`🔄 Processing ${filename}...`);
  
  const originalSize = fs.statSync(inputPath).size;
  
  try {
    // Create multiple sizes and formats
    const sizes = [
      { suffix: '', width: 800, quality: 85 }, // Main size
      { suffix: '-lg', width: 1200, quality: 80 }, // Large screens
      { suffix: '-sm', width: 400, quality: 90 }, // Mobile/thumbnails
    ];

    for (const size of sizes) {
      // WebP format (best compression for modern browsers)
      const webpPath = path.join(outputDir, `${name}${size.suffix}.webp`);
      await sharp(inputPath)
        .resize(size.width, null, { 
          withoutEnlargement: true,
          fastShrinkOnLoad: true 
        })
        .webp({ quality: size.quality, effort: 6 })
        .toFile(webpPath);

      // JPEG fallback (better compatibility)
      const jpegPath = path.join(outputDir, `${name}${size.suffix}.jpg`);
      await sharp(inputPath)
        .resize(size.width, null, { 
          withoutEnlargement: true,
          fastShrinkOnLoad: true 
        })
        .jpeg({ quality: size.quality, progressive: true, mozjpeg: true })
        .toFile(jpegPath);
    }

    // Create low-quality placeholder (blur-up effect)
    const blurPath = path.join(outputDir, `${name}-blur.webp`);
    await sharp(inputPath)
      .resize(20, null, { withoutEnlargement: true })
      .blur(2)
      .webp({ quality: 20 })
      .toFile(blurPath);

    const optimizedSize = fs.statSync(path.join(outputDir, `${name}.webp`)).size;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${filename}: ${(originalSize/1024/1024).toFixed(2)}MB → ${(optimizedSize/1024/1024).toFixed(2)}MB (${compressionRatio}% reduction)`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');
  
  const images = ['1.jpg', '2.png', '3.png', '4.png'];
  
  for (const image of images) {
    await optimizeImage(image);
  }
  
  console.log('\n🎉 Image optimization complete!');
  console.log('\n📁 Optimized images saved to: public/gallery-optimized/');
  console.log('\n📋 Files created per image:');
  console.log('   • name.webp (800px, main)');
  console.log('   • name-lg.webp (1200px, large screens)'); 
  console.log('   • name-sm.webp (400px, mobile)');
  console.log('   • name.jpg (JPEG fallbacks)');
  console.log('   • name-blur.webp (blur placeholder)');
}

main().catch(console.error);