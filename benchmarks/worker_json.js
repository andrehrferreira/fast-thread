const { parentPort } = require("worker_threads");

parentPort.on("message", (jsonBuffer) => {
    const data = JSON.parse(jsonBuffer);
    data.processed = true;
    parentPort.postMessage(JSON.stringify(data));
});
