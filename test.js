const { Worker } = require("worker_threads");
const { createSharedBuffer, packObject, unpackObject } = require("./index");

const sharedBuffer = createSharedBuffer();
const worker = new Worker("./benchmarks/worker_fast.js", { workerData: sharedBuffer });

packObject(JSON.stringify({ id: 1, name: "User A", timestamp: Date.now(), data: "x".repeat(512) }), sharedBuffer);

(async () => {
    while(true){
        Atomics.wait(sharedBuffer.signal, 1, 0);
        const processedData = unpackObject(sharedBuffer, 1)
        console.log("[Main] Processed data received:", processedData);
    }
})();

