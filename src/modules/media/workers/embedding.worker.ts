import { parentPort } from 'worker_threads';
import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import { join } from 'path';

// Patch the face-api environment with canvas support
const { Canvas, Image, createCanvas, loadImage } = canvas;
(faceapi.env as any).monkeyPatch({ Canvas, Image });

// Ensure models are loaded only once per worker thread
let modelsLoaded = false;

async function initModels(): Promise<void> {
  if (modelsLoaded) return;

  const modelsPath = join(process.cwd(), 'models');
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
  ]);
  modelsLoaded = true;
}

// Handle incoming tasks from main thread
parentPort?.on('message', async (data: {
  imageBuffer: Buffer;
  mediaId: string;
  memberId: string;
}) => {
  try {
    const { imageBuffer, mediaId, memberId } = data;

    await initModels();

    const img = await loadImage(imageBuffer);
    const c = createCanvas(img.width, img.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const result = await faceapi
      .detectSingleFace(c as any)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (result?.descriptor) {
      parentPort?.postMessage({
        mediaId,
        memberId,
        faceDescriptor: Array.from(result.descriptor),
      });
    } else {
      parentPort?.postMessage({
        mediaId,
        memberId,
        error: 'No face detected in the image.',
      });
    }
  } catch (error: any) {
    parentPort?.postMessage({
      error: error.message,
    });
  }
});

// Optional: Notify readiness (not strictly necessary unless you await this in main thread)
parentPort?.postMessage({ status: 'ready' });
