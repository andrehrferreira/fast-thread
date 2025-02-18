const { parentPort } = require("worker_threads");
const fastJson = require("fast-json-stringify");

const stringify = fastJson({
    title: "Example",
    type: "object",
    properties: {
        id: { type: "integer" },
        name: { type: "string" },
        timestamp: { type: "integer" },
        data: { type: "string" }
    }
});

parentPort.on("message", (jsonString) => {
    const data = JSON.parse(jsonString);
    data.processed = true;
    parentPort.postMessage(stringify(data));
});
