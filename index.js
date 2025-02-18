const { encode, decode } = require("msgpack-lite");

/**
* Serializes an object and stores it in a SharedArrayBuffer.
* @param {Object} obj Object to be wrapped
* @returns {SharedArrayBuffer} Shared buffer containing the data
*/
function packObject(obj) {
    const encoded = encode(obj);
    const sharedBuffer = new SharedArrayBuffer(encoded.length);
    const uint8Array = new Uint8Array(sharedBuffer);
    uint8Array.set(encoded);
    return sharedBuffer;
}

/**
* Deserializes a SharedArrayBuffer to an object.
* @param {SharedArrayBuffer} sharedBuffer Shared buffer containing the data
* @returns {Object} Unpacked object
*/
function unpackObject(sharedBuffer) {
    const uint8Array = new Uint8Array(sharedBuffer);
    return decode(uint8Array);
}

module.exports = { packObject, unpackObject };
