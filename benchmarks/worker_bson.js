const { parentPort } = require("worker_threads");
const { BSON } = require("bson");

parentPort.on("message", (bsonBuffer) => {
    const data = BSON.deserialize(bsonBuffer);
    data.processed = true;
    parentPort.postMessage(BSON.serialize(data));
});
