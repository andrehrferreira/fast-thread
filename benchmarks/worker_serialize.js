const { parentPort } = require("worker_threads");
const { decode, encode } = require("msgpack-lite");

parentPort.on("message", (sharedBuffer) => {
    const data = decode(sharedBuffer);
    console.log(`[Worker] Dados recebidos:`, data);
    data.processed = true;
    parentPort.postMessage(encode(data));
});
