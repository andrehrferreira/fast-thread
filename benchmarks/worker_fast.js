const { parentPort } = require("worker_threads");
const { unpackObject, packObject } = require("../index.js");

parentPort.on("message", (sharedBuffer) => {
    const data = unpackObject(sharedBuffer);
    console.log(`[Worker] Dados recebidos:`, data);
    data.processed = true;
    parentPort.postMessage(packObject(data));
});