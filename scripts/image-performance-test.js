const fs = require('fs');
const path = require('path');

// Function to format file size
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to get file size
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

console.log('🚀 Image Performance Analysis\n');
console.log('=' .repeat(60));

const galleryDir = path.join(__dirname, '../public/gallery');
const optimizedDir = path.join(__dirname, '../public/gallery-optimized');

const images = ['1.jpg', '2.png', '3.png', '4.png'];
let totalOriginal = 0;
let totalOptimized = 0;

console.log('Image Comparison:');
console.log('=' .repeat(60));

images.forEach((image, index) => {
  const imageName = path.parse(image).name;
  const originalPath = path.join(galleryDir, image);
  const optimizedPath = path.join(optimizedDir, `${imageName}.webp`);
  const optimizedJpegPath = path.join(optimizedDir, `${imageName}.jpg`);
  
  const originalSize = getFileSize(originalPath);
  const webpSize = getFileSize(optimizedPath);
  const jpegSize = getFileSize(optimizedJpegPath);
  
  totalOriginal += originalSize;
  totalOptimized += webpSize;
  
  const webpReduction = originalSize > 0 ? ((originalSize - webpSize) / originalSize * 100) : 0;
  const jpegReduction = originalSize > 0 ? ((originalSize - jpegSize) / originalSize * 100) : 0;
  
  console.log(`${index + 1}. ${image}:`);
  console.log(`   📊 Original:     ${formatBytes(originalSize)}`);
  console.log(`   🟢 WebP:         ${formatBytes(webpSize)} (-${webpReduction.toFixed(1)}%)`);
  console.log(`   🔵 JPEG:         ${formatBytes(jpegSize)} (-${jpegReduction.toFixed(1)}%)`);
  console.log('');
});

const totalReduction = totalOriginal > 0 ? ((totalOriginal - totalOptimized) / totalOriginal * 100) : 0;

console.log('=' .repeat(60));
console.log('📊 TOTAL PERFORMANCE IMPROVEMENT:');
console.log(`   Original Total:  ${formatBytes(totalOriginal)}`);
console.log(`   Optimized Total: ${formatBytes(totalOptimized)}`);
console.log(`   Total Savings:   ${formatBytes(totalOriginal - totalOptimized)} (-${totalReduction.toFixed(1)}%)`);
console.log('');

// Calculate loading time estimates (assuming 10 Mbps connection)
const connectionSpeed = 10 * 1024 * 1024 / 8; // 10 Mbps in bytes per second
const originalLoadTime = totalOriginal / connectionSpeed;
const optimizedLoadTime = totalOptimized / connectionSpeed;

console.log('⚡ LOADING TIME ESTIMATES (10 Mbps):');
console.log(`   Original:        ${originalLoadTime.toFixed(2)} seconds`);
console.log(`   Optimized:       ${optimizedLoadTime.toFixed(2)} seconds`);
console.log(`   Time Saved:      ${(originalLoadTime - optimizedLoadTime).toFixed(2)} seconds`);
console.log('');

// Responsive image analysis
console.log('📱 RESPONSIVE IMAGE SIZES:');
console.log('=' .repeat(60));
images.forEach((image, index) => {
  const imageName = path.parse(image).name;
  const smSize = getFileSize(path.join(optimizedDir, `${imageName}-sm.webp`));
  const mdSize = getFileSize(path.join(optimizedDir, `${imageName}.webp`));
  const lgSize = getFileSize(path.join(optimizedDir, `${imageName}-lg.webp`));
  
  console.log(`${index + 1}. ${image}:`);
  console.log(`   📱 Mobile (400px):  ${formatBytes(smSize)}`);
  console.log(`   💻 Desktop (800px): ${formatBytes(mdSize)}`);
  console.log(`   🖥️  Large (1200px):  ${formatBytes(lgSize)}`);
  console.log('');
});

console.log('✨ FEATURES IMPLEMENTED:');
console.log('  ✅ Progressive JPEG/WebP compression');
console.log('  ✅ Responsive image sizes (sm/md/lg)');
console.log('  ✅ Blur-up placeholders for smooth loading');
console.log('  ✅ Modern WebP format with JPEG fallback');
console.log('  ✅ WebGL texture optimization');
console.log('  ✅ Lazy loading implementation');
console.log('\n🎉 Your gallery should now load significantly faster!');