const { Worker } = require("node:worker_threads");
const { EventEmitter } = require("events");
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

const MAIN_INDEX = 0;
const THREAD_INDEX = 1;

function createSharedBuffer(BUFFER_SIZE = 1024 * 1024) {
    const buffer = new SharedArrayBuffer(BUFFER_SIZE);
    const uint8Array = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const signal = new Int32Array(buffer, 0, 2);
    const sizeOffset = 8;

    return { buffer, uint8Array, view, signal, BUFFER_SIZE, sizeOffset };
}

function packObject(objString, sharedBuffer, index = MAIN_INDEX) {
    const encoded = textEncoder.encode(objString);
    const size = encoded.byteLength;

    if (size + sharedBuffer.sizeOffset > sharedBuffer.BUFFER_SIZE)
        throw new Error("Buffer overflow! Increase SharedArrayBuffer size.");

    sharedBuffer.view.setUint32(sharedBuffer.sizeOffset, size, true);
    sharedBuffer.uint8Array.set(encoded, sharedBuffer.sizeOffset + 4);

    Atomics.store(sharedBuffer.signal, index, 1);
    Atomics.notify(sharedBuffer.signal, index);
}

function unpackObject(sharedBuffer, index = MAIN_INDEX) {
    try {
        //Atomics.wait(sharedBuffer.signal, index, 0);

        const offset = sharedBuffer.sizeOffset + 4;
        const size = sharedBuffer.view.getUint32(sharedBuffer.sizeOffset, true);

        if (size === 0) return null;

        const jsonData = textDecoder.decode(
            sharedBuffer.uint8Array.subarray(offset, offset + size)
        );

        sharedBuffer.view.setUint32(sharedBuffer.sizeOffset, 0, true);
        Atomics.store(sharedBuffer.signal, index, 0);

        return JSON.parse(jsonData);
    } catch (e) {
        //console.error("[Error] unpackObject failed:", e);
        return null;
    }
}

class FastThread extends EventEmitter {
    exit = false;

    constructor(workerFile, BUFFER_SIZE = 1024 * 1024, options = {}) {
        super();
        this.exit = false;
        this.sharedBuffer = createSharedBuffer(BUFFER_SIZE);
        this.worker = new Worker(workerFile, {
            ...options,
            workerData: {
                ...(options.workerData ?? {}),
                ...this.sharedBuffer
            },
        });

        this.worker.on("online", (err) => this.listenForResponses());
        this.worker.on("error", (err) => this.emit("error", err));
        this.worker.on("exit", (code) => this.emit("exit", code));
    }

    send(data) {
        packObject(JSON.stringify(data), this.sharedBuffer, MAIN_INDEX);
    }

    async listenForResponses() {
        const checkResponses = () => {
            if (this.exit)
                return;

            const processedData = unpackObject(this.sharedBuffer, THREAD_INDEX);

            if (processedData)
                this.emit("message", processedData);

            setImmediate(checkResponses);
        };

        checkResponses();
    }

    awaitThreadReponse(){
        return new Promise((resolve, reject) => {
            this.once("message", async () => resolve());
        });
    }

    terminate() {
        if(!this.exit){
            this.exit = true;
            this.worker.terminate();
            this.emit("terminated");
        }
    }
}

module.exports = {
    default: FastThread,
    FastThread,
    packObject,
    unpackObject,
    createSharedBuffer
};
