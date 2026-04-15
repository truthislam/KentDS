import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, '..', 'public', 'images');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function optimizeImages() {
  const files = fs.readdirSync(imagesDir);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    
    // Cleanup any existing low quality .webp so we can overwrite
    if (ext === '.webp' && file !== 'DDS car.webp') {
       fs.unlinkSync(path.join(imagesDir, file));
    }
  }

  const freshFiles = fs.readdirSync(imagesDir);
  for (const file of freshFiles) {
    const ext = path.extname(file).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const inputPath = path.join(imagesDir, file);
      const outputFilename = file.replace(new RegExp(`\\${ext}$`, 'i'), '.webp');
      const outputPath = path.join(imagesDir, outputFilename);

      console.log(`Converting High-Quality ${file} -> ${outputFilename}...`);
      try {
        await sharp(inputPath)
          .webp({ quality: 98, effort: 6 }) // Max quality to prevent blurriness
          .toFile(outputPath);
        
        fs.unlinkSync(inputPath);
      } catch (err) {
        console.error(`Error converting ${file}:`, err);
      }
    }
  }
}

optimizeImages().then(() => console.log('Done optimizing images!'));
