const { Worker } = require("worker_threads");
const { encode, decode } = require("msgpack-lite");

const worker = new Worker("./benchmarks/worker_serialize.js");
const obj = { id: 1, name: "User A", timestamp: Date.now() };
const sharedBuffer = encode(obj);

worker.postMessage(sharedBuffer);

worker.on("message", (processedBuffer) => {
    const processedObj = decode(processedBuffer);
    console.log("[Main] Objeto processado recebido:", processedObj);
});

worker.on("error", (error) => console.error(error));
