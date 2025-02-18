const { Worker } = require("worker_threads");
const { unpackObject, packObject } = require("../index");

const worker = new Worker("./benchmarks/worker_fast.js");
const obj = { id: 1, name: "User A", timestamp: Date.now() };
const sharedBuffer = packObject(obj);

worker.postMessage(sharedBuffer);

worker.on("message", (processedBuffer) => {
    const processedObj = unpackObject(processedBuffer);
    console.log("[Main] Objeto processado recebido:", processedObj);
});

worker.on("error", (error) => console.error(error));
