import type { Area } from 'react-easy-crop';

/** Profile avatar output size (square). */
export const PROFILE_IMAGE_SIZE = 512;

/** Cover output width; height is derived from the on-screen cover aspect. */
export const COVER_OUTPUT_WIDTH = 1024;

/** On-screen cover band height (used with measured width for aspect). */
export const COVER_DISPLAY_HEIGHT = 168;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () =>
      reject(new Error('Failed to load image')),
    );
    image.crossOrigin = 'anonymous';
    image.src = src;
  });
}

export function coverOutputSize(aspect: number): {
  width: number;
  height: number;
} {
  const safeAspect = aspect > 0 ? aspect : COVER_OUTPUT_WIDTH / COVER_DISPLAY_HEIGHT;
  return {
    width: COVER_OUTPUT_WIDTH,
    height: Math.max(1, Math.round(COVER_OUTPUT_WIDTH / safeAspect)),
  };
}

/** Render the cropped pixel area to a JPEG/PNG/WebP `File`. */
export async function cropImageToFile(
  imageSrc: string,
  crop: Area,
  options: {
    fileName: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    quality?: number;
    /** Exact square output size (e.g. 512 → 512×512). */
    outputSize?: number;
    /** Rectangular output (e.g. cover 1024×H). Overrides `outputSize` when both set. */
    outputWidth?: number;
    outputHeight?: number;
  },
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  let width: number;
  let height: number;
  if (options.outputWidth && options.outputHeight) {
    width = Math.max(1, Math.round(options.outputWidth));
    height = Math.max(1, Math.round(options.outputHeight));
  } else if (options.outputSize) {
    width = options.outputSize;
    height = options.outputSize;
  } else {
    width = Math.max(1, Math.round(crop.width));
    height = Math.max(1, Math.round(crop.height));
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => {
        if (!next) {
          reject(new Error('Crop failed'));
          return;
        }
        resolve(next);
      },
      options.mimeType,
      options.quality ?? 0.85,
    );
  });

  return new File([blob], options.fileName, { type: options.mimeType });
}
