// benchmarks/worker_protobuf.js
const { parentPort } = require("worker_threads");
const protobuf = require("protobufjs");

protobuf.load("./benchmarks/schema.proto", (err, root) => {
    if (err) throw err;

    const Data = root.lookupType("Data");

    parentPort.on("message", (protoBuffer) => {
        const data = Data.decode(protoBuffer);
        data.processed = true;
        parentPort.postMessage(Data.encode(data).finish());
    });
});
