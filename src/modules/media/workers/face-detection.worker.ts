import { parentPort } from 'worker_threads';
import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import { join } from 'path';

// Monkey patch canvas environment
const { Canvas, Image, createCanvas, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any });

async function initFaceDetection(): Promise<void> {
  const modelsPath = join(process.cwd(), 'models');
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
  ]);
}

async function processFile(data: {
  fileBuffer: Buffer;
  fileName: string;
}): Promise<void> {
  const { fileBuffer, fileName } = data;

  try {
    await initFaceDetection();

    const img = await loadImage(fileBuffer);
    const c = createCanvas(img.width, img.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    console.log('[Worker] Starting face detection...');
    const detections = await faceapi
      .detectAllFaces(c as any)
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log('[Worker] Detections length:', detections.length);

    const detectedFaces: Array<{
      faceBuffer: Buffer;
      faceDescriptor: number[];
      box: { x: number; y: number; width: number; height: number };
      score: number;
    }> = [];

    for (const detection of detections) {
      const box = detection.detection.box;

      const faceCanvas = createCanvas(box.width, box.height);
      const faceCtx = faceCanvas.getContext('2d');
      faceCtx.drawImage(
        c,
        box.x,
        box.y,
        box.width,
        box.height,
        0,
        0,
        box.width,
        box.height
      );

      const faceBuffer = faceCanvas.toBuffer('image/png');

      detectedFaces.push({
        faceBuffer,
        faceDescriptor: Array.from(detection.descriptor),
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        score: detection.detection.score,
      });
    }

    parentPort?.postMessage(detectedFaces);
  } catch (error: any) {
    parentPort?.postMessage({ error: error.message });
  }
}

// 🧠 Listen for incoming message from the main thread
parentPort?.on('message', async (data) => {
  await processFile(data);
});
