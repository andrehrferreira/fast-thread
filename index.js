const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

function createSharedBuffer(BUFFER_SIZE = 1024 * 1024) {
    const buffer = new SharedArrayBuffer(BUFFER_SIZE);
    const uint8Array = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const signal = new Int32Array(buffer, 0, 2);
    const sizeOffset = 8;

    return { buffer, uint8Array, view, signal, BUFFER_SIZE, sizeOffset };
}

function packObject(objString, sharedBuffer, index = 0) {
    const encoded = textEncoder.encode(objString);
    const size = encoded.byteLength;

    if (size + sharedBuffer.sizeOffset > sharedBuffer.BUFFER_SIZE)
        throw new Error("Buffer overflow! Increase SharedArrayBuffer size.");

    sharedBuffer.view.setUint32(sharedBuffer.sizeOffset, size, true);
    sharedBuffer.uint8Array.set(encoded, sharedBuffer.sizeOffset + 4);

    Atomics.store(sharedBuffer.signal, index, 1);
    Atomics.notify(sharedBuffer.signal, index);
}

function unpackObject(sharedBuffer, index = 0) {
    try {
        Atomics.wait(sharedBuffer.signal, index, 0);

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
        console.error("[Error] unpackObject failed:", e);
        return null;
    }
}

module.exports = { packObject, unpackObject, createSharedBuffer };
