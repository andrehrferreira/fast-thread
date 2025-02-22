const { Worker } = require("worker_threads");
const msgpack = require("msgpack-lite");
const cbor = require("cbor");
const { BSON } = require("bson");
const protobuf = require("protobufjs");
const fastJson = require("fast-json-stringify");
const { packObject, unpackObject, createSharedBuffer } = require("../index");
const { performance } = require("perf_hooks");
const ThreadStream = require('thread-stream');
const { once } = require('events')
const { join } = require('path');

const TEST_DURATION = 10000;
const MESSAGE_SIZE = 1024;

const protoSchema = `
    syntax = "proto3";
    message Data {
        int32 id = 1;
        string name = 2;
        int64 timestamp = 3;
        string data = 4;
        bool processed = 5;
    }
`;

const root = protobuf.parse(protoSchema).root;
const DataProto = root.lookupType("Data");

const schema = fastJson({
    title: "Example",
    type: "object",
    properties: {
        id: { type: "integer" },
        name: { type: "string" },
        timestamp: { type: "integer" },
        data: { type: "string" }
    }
});

const methods = [
    {
        name: "fast-thread",
        workerFile: "./benchmarks/worker_fast.js",
        pack: packObject,
        unpack: unpackObject,
        schema,
        sharedBuffer: createSharedBuffer()
    },
    {
        name: "thread-stream",
        workerFile: join(__dirname, 'worker_thread_stream.js'),
        pack: JSON.stringify, unpack: JSON.parse
    },
    { name: "JSON", workerFile: "./benchmarks/worker_json.js", pack: JSON.stringify, unpack: JSON.parse },
    { name: "msgpack-lite", workerFile: "./benchmarks/worker_serialize.js", pack: msgpack.encode, unpack: msgpack.decode },
    { name: "CBOR", workerFile: "./benchmarks/worker_cbor.js", pack: cbor.encode, unpack: cbor.decode },
    { name: "BSON", workerFile: "./benchmarks/worker_bson.js", pack: BSON.serialize, unpack: BSON.deserialize },
    { name: "Protobuf.js", workerFile: "./benchmarks/worker_protobuf.js", pack: (obj) => DataProto.encode(obj).finish(), unpack: (buf) => DataProto.decode(buf) },
    { name: "fast-json-stringify", workerFile: "./benchmarks/worker_fast_json.js", pack: schema, unpack: JSON.parse },
];

function generateRandomMessage() {
    return {
        id: Math.floor(Math.random() * 100000),
        name: `User_${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now(),
        data: "x".repeat(MESSAGE_SIZE)
    };
}

async function runBenchmark({ name, workerFile, pack, unpack, schema, sharedBuffer }) {
    return new Promise(async (resolve) => {
        const workerOptions = sharedBuffer ? { workerData: sharedBuffer } : undefined;
        const worker = (name === "thread-stream")
            ? new ThreadStream({
                filename: workerFile,
                sync: false
            })
            : new Worker(workerFile, workerOptions);

        let messagesSent = 0;
        let bytesTransferred = 0;
        const startTime = performance.now();

        async function handleResponse(port2){
            const result = await once(port2, "message")
            processResponse(result[0])
        }

        function sendMessage() {
            let obj = generateRandomMessage();

            if(sharedBuffer)
                obj = (schema) ? schema(obj) : JSON.stringify(obj);

            const packed = sharedBuffer ? pack(obj, sharedBuffer) : pack(obj);
            messagesSent++;

            if (!sharedBuffer) {
                if(worker instanceof ThreadStream){
                    const { port1, port2 } = new MessageChannel();
                    worker.emit('message', { payload: packed, port: port1 }, [port1]);
                    handleResponse(port2);
                }
                else
                    worker.postMessage(packed);
            }
        }

        function processResponse(processedBuffer) {
            bytesTransferred += (!sharedBuffer) ? processedBuffer.length :
                sharedBuffer.view.getUint32(sharedBuffer.sizeOffset, true);

            const message = (!sharedBuffer) ? unpack(processedBuffer)
                : unpackObject(sharedBuffer, 1);

            if (performance.now() - startTime < TEST_DURATION) {
                sendMessage();
            } else {
                if(worker instanceof ThreadStream){
                    worker.flushSync()
                    worker.end()
                }
                else
                    worker.terminate();

                resolve({
                    name,
                    messages: messagesSent,
                    messagesPerSecond: (messagesSent / (TEST_DURATION / 1000)),
                    mbPerSecond: (bytesTransferred / (1024 * 1024) / (TEST_DURATION / 1000)).toFixed(2) + "mb"
                });

                //process.forceUpdate();
            }
        }

        worker.on("error", (error) => console.error(`[Error] ${name}:`, error));

        if(!sharedBuffer){
            worker.on("message", async (processedBuffer) => {
                if(!(worker instanceof ThreadStream))
                    processResponse(processedBuffer);
            });

            sendMessage();
        }
        else {
            (async () => {
                sendMessage();

                while(true){
                    Atomics.wait(sharedBuffer.signal, 1, 0);

                    processResponse();

                    if(performance.now() - startTime > TEST_DURATION)
                        break;
                }
            })();
        }
    });
}

async function main() {
    console.log("🏁 Iniciando benchmarks...");
    const results = {};

    for (const method of methods) {
        console.log(`🚀 Testando ${method.name}...`);
        results[method.name] = { messages: [], messagesPerSecond: [], mbPerSecond: [] };

        const result = await runBenchmark(method);
        results[method.name].messages.push(result.messages);
        results[method.name].messagesPerSecond.push(parseFloat(result.messagesPerSecond));
        results[method.name].mbPerSecond.push(parseFloat(result.mbPerSecond));
    }

    const finalResults = Object.keys(results).map((key) => {
        const avgMessages = results[key].messages.reduce((a, b) => a + b, 0);
        const avgMessagesPerSec = results[key].messagesPerSecond.reduce((a, b) => a + b, 0);
        const avgMBps = results[key].mbPerSecond.reduce((a, b) => a + b, 0);
        return { name: key, messages: Math.round(avgMessages), messagesPerSecond: avgMessagesPerSec.toFixed(2), mbPerSecond: avgMBps.toFixed(2) };
    });

    finalResults.sort((a, b) => b.messages - a.messages);
    console.table(finalResults);
}

main();
