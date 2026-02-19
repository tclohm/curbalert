/**
 * Compress an image file to base64 with size limit 
 * @param   file            - The image from input 
 * @param   maxSizeKB       - Maximum size in KB (default: 500)
 * @param   maxWidth        - Maximum width in pixel (default: 1920)
 * @param   quality         - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<string> - Base64 string (with: data:image/jpeg;base64, prefix)
 */
export async function compressImageToBase64(
  file: File,
  options: {
    maxSizeKB?: number;
    maxWidth?: number;
    quality?: number;
  } = {}
): Promise<string> {
  const { maxSizeKB = 500, maxWidth = 1920, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels until we're under size limit  
        let currentQuality = quality;
        let base64 = canvas.toDataURL('image/jpeg', currentQuality);

        // Check size (base64 length / 1.37 = file size in bytes)
        while (base64.length / 1.37 / 1024 > maxSizeKB && currentQuality > 0.1) {
          currentQuality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', currentQuality);
        }

        if (base64.length / 1.37 / 1024 > maxSizeKB) {
          reject(
            new Error(
              `Could not compress image below ${maxSizeKB}KB. Try a smaller image or lower quality.`
            )
          );
          return;
        }

        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/*
 * Validates image file type and size 
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type 
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    };
  }

  // Check file size (max 10MB before compression)
  const maxSizeMB = 10; 
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`
    };
  }
  return { valid: true };
}

/**
 * Get estimated base64 size in KB 
 */
export function getBase64Size(base64: string): number {
  // Remove data URL prefix if present 
  const base64Data = base64.split(',')[1] || base64;
  return (base64Data.length * 0.75) / 1024 // convert to KB
}
