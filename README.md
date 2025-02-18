# 🚀 fast-thread

**fast-thread** is a high-performance module designed for **ultra-fast** object transmission between threads in **Node.js**, optimizing **parallel processing** with **SharedArrayBuffer**, **Atomics**, and **fast-json-stringify**.

## 🔥 Why fast-thread?

In **Node.js**, thread communication has inherent limitations:
- **No native memory sharing** like in other languages.
- **All data must be serialized and sent via messaging**, adding **overhead**.
- **Complex objects cannot be shared natively**, requiring costly serialization.

For **high-performance applications**, reducing serialization time **directly improves parallel processing speed**.

## 🚀 The Challenge: Finding the Fastest Serialization Method

We tested multiple serialization methods to find the **fastest** approach for inter-thread communication in **Node.js**.

| Serialization Method       | Pros                                      | Cons                                        |
|---------------------------|-------------------------------------------|---------------------------------------------|
| **JSON (`JSON.stringify`)** | Built-in, no dependencies                 | Slower serialization, larger payload       |
| **msgpack-lite**          | Compact binary format                     | Slower than JSON in V8                     |
| **CBOR**                  | Compact and structured binary format      | Still slower than JSON                     |
| **BSON**                  | Optimized for MongoDB, fast parsing       | High overhead for small objects            |
| **Protobuf.js**           | Compact, schema-based, high performance   | Requires pre-defined schema                |
| **fast-json-stringify**   | Faster than `JSON.stringify` with schema  | Still requires copying in `postMessage()` |
| **fast-thread** 🚀        | **SharedArrayBuffer + Atomics** (No Copy) | Requires structured memory handling        |

After extensive benchmarking, **the fastest approach** was a combination of:

* ✅ **SharedArrayBuffer** for **direct memory access**  
* ✅ **Atomics.wait()/Atomics.notify()** for **ultra-fast synchronization**  
* ✅ **fast-json-stringify** for **zero-copy, schema-based serialization**  

---

## 📊 Benchmark Results

Our tests measured **message throughput** (msg/sec) and **bandwidth** (MB/sec) over a 10s test period.

| Name                     | Messages | Messages Per Second | MB Per Second |
|--------------------------|----------|---------------------|--------------|
| **fast-thread**         | 617,483  | 61,748.30          | 65.34        |
| **JSON**                | 524,235  | 52,423.50          | 55.48        |
| **fast-json-stringify** | 500,024  | 50,002.40          | 52.10        |
| **BSON**                | 420,946  | 42,094.60          | 44.19        |
| **Protobuf.js**         | 296,340  | 29,634.00          | 29.75        |
| **msgpack-lite**        | 288,180  | 28,818.00          | 29.86        |
| **CBOR**                | 223,945  | 22,394.50          | 23.20        |

🚀 **fast-thread** achieved the best performance with a throughput of **~61,748 messages per second** and **65.34 MB/sec**.

---

## ⚡ Solution: **SharedArrayBuffer + Atomics + fast-json-stringify**

### How It Works
- **SharedArrayBuffer** is used for **zero-copy** memory sharing.
- **Atomics.wait()/Atomics.notify()** provide **fast synchronization** between threads.
- **fast-json-stringify** eliminates JSON parsing overhead.

---

## 📌 Installation

```sh
pnpm install fast-thread
```

## 🛠 Example Usage

### **Worker Thread (worker_fast.js)**
```javascript
const { workerData } = require("worker_threads");
const fastJson = require("fast-json-stringify");
const { unpackObject, packObject } = require("fast-thread");

const sharedBuffer = workerData;
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
```

---

### **Main Thread (test.js)**

```javascript
const { FastThread } = require("fast-thread");

(async () => {
    const fastThread = new FastThread("./worker_fast.js", 1024 * 1024)

    fastThread.on("message", (data) => {
        console.log("[Main] Processed data received:", data);
    });

    fastThread.on("terminated", () => {
        console.log("Thread closed");
    });

    for(let i = 0; i < 100; i++){
        fastThread.send({
            id: i,
            name: "User " + i,
            timestamp: Date.now(),
            data: "x".repeat(512)
        });

        await fastThread.awaitThreadReponse();
    }

    setTimeout(() => fastThread.terminate(), 2000);
})();
```

Since `SharedArrayBuffer` has a fixed size, it's essential to send messages sequentially, waiting for a response before sending the next job. This prevents buffer overwriting, ensuring each message is processed correctly.

Currently, no parallel message handling system has been implemented, meaning multiple messages cannot be processed simultaneously within the same thread instance.

To handle this limitation, the `await fastThread.awaitThreadResponse();` call ensures that each message is processed before sending the next one. Without this mechanism, sending multiple messages at once could result in data loss or overwritten responses.

### **Main Thread (test-alternative.js)**

```javascript
const { Worker } = require("worker_threads");
const fastJson = require("fast-json-stringify");

const { 
    createSharedBuffer, packObject, 
    unpackObject 
} = require("fast-thread");

const sharedBuffer = createSharedBuffer();
const worker = new Worker("./worker_fast.js", { workerData: sharedBuffer });

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

packObject(stringify({ 
    id: 1, 
    name: "User A", 
    timestamp: Date.now(), 
    data: "x".repeat(512) 
}), sharedBuffer);

const checkResponses = () => {
    Atomics.wait(sharedBuffer.signal, 1, 0);
    const processedData = unpackObject(sharedBuffer, 1);
    console.log("[Main] Processed data received:", processedData);
    setImmediate(checkResponses);
};
```

---

## 📌 Conclusion
**fast-thread** enables **blazing-fast** thread communication in Node.js using **SharedArrayBuffer**, **Atomics**, and **fast-json-stringify**. This approach eliminates **message serialization overhead**, delivering **unparalleled performance** in **high-throughput parallel workloads**.
