const { Worker } = require("worker_threads");

const worker = new Worker("./benchmarks/worker_json.js");
const obj = { id: 1, name: "User A", timestamp: Date.now() };
const jsonBuffer = JSON.stringify(obj);

worker.postMessage(jsonBuffer);

worker.on("message", (processedBuffer) => {
    const processedObj = JSON.parse(processedBuffer);
    console.log("[Main] Objeto processado recebido:", processedObj);
});

worker.on("error", (error) => console.error(error));
