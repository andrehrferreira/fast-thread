# 🚀 fast-thread

**fast-thread** is a module designed to implement the **most optimized solution** for transmitting data objects between threads in **Node.js**, ensuring **maximum performance** in parallel processing.

## 🔥 Motivation

Communication between **threads in Node.js** presents significant challenges compared to other languages due to the **lack of native memory sharing**. In Node.js:
- **Threads cannot share native objects** directly.
- **All data must be serialized and sent via messaging**, adding overhead.
- **Complex objects cannot be transmitted natively**, unlike other languages that allow direct memory access.

For this reason, **the faster the object serialization and deserialization process, the better the parallelism performance**. This is particularly relevant for **mass data processing**, such as:
- **Real-time data analytics**
- **Large-scale JSON processing**
- **Big data transformations**
- **High-performance parallel computations**

For **tasks like video encoding or image processing**, where workers mainly execute computations rather than exchanging large data sets, this solution may be less critical but still improves communication speed.

---

## 🚀 **The Challenge: Finding the Fastest Serialization Method**

Since Node.js **requires messaging for thread communication**, we tested various serialization methods to determine **the fastest approach**. The following technologies were evaluated:

| Serialization Method | Pros | Cons |
|----------------------|------|------|
| **JSON (`JSON.stringify`)** | Built-in, no dependencies | Slow serialization, large output |
| **msgpack-lite** | Compact, efficient binary format | Slower than JSON in V8 |
| **CBOR** | More compact than JSON, structured binary format | Still slower than JSON in benchmarks |
| **BSON** | Optimized for MongoDB, fast parsing | High overhead for small objects |
| **Protobuf.js** | Compact, schema-based, high performance | Requires pre-defined schema |
| **fast-json-stringify** | Faster than `JSON.stringify` with optimized schema | Still requires copying in `postMessage()` |
| **SharedArrayBuffer + Atomics + fast-json-stringify** | 🚀 **Best performance** 🚀 | Requires structured memory handling |

After extensive benchmarking, **the fastest approach** was a **combination of `fast-json-stringify` + SharedArrayBuffer + Atomics**, which significantly reduced **serialization overhead and unnecessary data copying**.

---

## ⚡ **Solution: fast-thread**
**fast-thread** uses:
✅ **SharedArrayBuffer** to store and share data between threads  
✅ **Atomics.wait()/Atomics.notify()** for fast synchronization  
✅ **fast-json-stringify** for **ultra-fast serialization**  
✅ **Zero-copy message passing** to avoid unnecessary overhead  

This allows **thread-to-thread communication to happen at maximum speed**, eliminating excessive **serialization/deserialization costs** and reducing **latency bottlenecks**.

---

## 📌 **Installation**
```sh
pnpm install fast-thread
```
