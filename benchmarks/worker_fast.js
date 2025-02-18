const { workerData } = require("worker_threads");
const { schema } = require("./schema.js");
const { unpackObject, packObject } = require("../index.js");
const fastJson = require("fast-json-stringify");

const stringify = fastJson(schema);
const sharedBuffer = workerData;

async function processData() {
    while (true) {
        Atomics.wait(sharedBuffer.signal, 0, 0);

        let obj = unpackObject(sharedBuffer);
        if (!obj) continue;

        obj.processed = true;
        packObject(stringify(obj), sharedBuffer, 1);
    }
}

processData();
