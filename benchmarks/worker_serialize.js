const { parentPort } = require("worker_threads");
const { decode, encode } = require("msgpack-lite");

parentPort.on("message", (sharedBuffer) => {
    const data = decode(sharedBuffer);
    data.processed = true;
    parentPort.postMessage(encode(data));
});
