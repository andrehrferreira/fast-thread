const { parentPort } = require('worker_threads')
const { Writable } = require('stream')

function run (opts) {
    parentPort.on('message', function ({ payload, port }) {
        const data = JSON.parse(payload);
        data.processed = true;
        port.postMessage(JSON.stringify(data))
    })

    return new Writable({
        autoDestroy: true,
        write (chunk, enc, cb) {
            cb()
        }
    });
}

module.exports = run
