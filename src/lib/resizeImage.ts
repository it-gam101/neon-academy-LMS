/**
 * Resize an image to a maximum dimension while preserving aspect ratio.
 * Exports as webp (fallback to jpeg if unsupported).
 */
export async function resizeImageToBlob(file: File, maxPx = 256): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate scaled dimensions (longest side = maxPx)
      const { width, height } = img;
      let targetWidth: number;
      let targetHeight: number;

      if (width >= height) {
        targetWidth = Math.min(width, maxPx);
        targetHeight = Math.round(height / width * targetWidth);
      } else {
        targetHeight = Math.min(height, maxPx);
        targetWidth = Math.round(width / height * targetHeight);
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Try webp first, fallback to jpeg
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to jpeg
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob);
                } else {
                  reject(new Error('Failed to create image blob'));
                }
              },
              'image/jpeg',
              0.9
            );
          }
        },
        'image/webp',
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
