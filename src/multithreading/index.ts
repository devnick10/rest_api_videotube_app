import path from "path";
import { Worker } from "worker_threads";
const WORKER_FILE_PATH = path.join(__dirname, "worker.js");

type FileData = string[];

function runWorker(data: FileData) {
  return new Promise((resolve, reject) => {
    // we send data from main thread using WorkerData option;
    const worker = new Worker(WORKER_FILE_PATH, {
      workerData: data,
    });
    // here we recieved data from other thread using worker.on("message") event;
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Woker stopped with exit code ${code}`));
    });
  });
}

export async function muiltithreadUpload(files: FileData) {
  const data = await runWorker(files);
  return data;
}
