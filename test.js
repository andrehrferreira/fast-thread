const { FastThread } = require("./index");

(async () => {
    const fastThread = new FastThread("./benchmarks/worker_fast.js")

    fastThread.on("message", (data) => {
        console.log("[Main] Processed data received:", data);
    });

    fastThread.on("terminated", () => console.log("Thread closed"));
    fastThread.on("exit", (code) => console.log("Exit " + code));

    for(let i = 0; i < 100; i++){
        await fastThread.send({
            id: i,
            name: "User " + i,
            timestamp: Date.now(),
            data: "x".repeat(512)
        });

        await fastThread.awaitThreadReponse();
    }

    setTimeout(() => fastThread.terminate(), 2000);
})();
