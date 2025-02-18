const { parentPort } = require("worker_threads");
const { encode, decode } = require("cbor");

parentPort.on("message", (jsonBuffer) => {
    const data = decode(jsonBuffer);
    data.processed = true;
    parentPort.postMessage(encode(data));
});
