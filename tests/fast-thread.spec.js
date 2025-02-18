import { describe, it, expect } from "vitest";
import { createSharedBuffer, packObject, unpackObject } from "../index";

describe("SharedArrayBuffer + Atomics + fast-json-stringify Tests", () => {
    it("should correctly serialize and deserialize an object", () => {
        const sharedBuffer = createSharedBuffer();
        const originalObject = { id: 1, name: "User A", active: true };

        packObject(JSON.stringify(originalObject), sharedBuffer, 0);
        const unpackedObject = unpackObject(sharedBuffer, 0);

        expect(unpackedObject).toEqual(originalObject);
    });

    it("should handle empty objects correctly", () => {
        const sharedBuffer = createSharedBuffer();
        const originalObject = {};

        packObject(JSON.stringify(originalObject), sharedBuffer, 0);
        const unpackedObject = unpackObject(sharedBuffer, 0);

        expect(unpackedObject).toEqual(originalObject);
    });

    it("should support nested objects and arrays", () => {
        const sharedBuffer = createSharedBuffer();
        const originalObject = {
            user: { id: 42, name: "Nested User" },
            roles: ["admin", "editor"],
            meta: { createdAt: Date.now() }
        };

        packObject(JSON.stringify(originalObject), sharedBuffer, 0);
        const unpackedObject = unpackObject(sharedBuffer, 0);

        expect(unpackedObject).toEqual(originalObject);
    });

    it("should support large objects", () => {
        const sharedBuffer = createSharedBuffer();
        const originalObject = {
            data: Array(1000).fill({ id: 1, value: "test" })
        };

        packObject(JSON.stringify(originalObject), sharedBuffer, 0);
        const unpackedObject = unpackObject(sharedBuffer, 0);

        expect(unpackedObject).toEqual(originalObject);
    });

    it("should correctly handle multiple signals", () => {
        const sharedBuffer = createSharedBuffer();
        const originalObject = { message: "Thread Communication Test" };

        packObject(JSON.stringify(originalObject), sharedBuffer, 0);
        const unpackedObject = unpackObject(sharedBuffer, 0);

        expect(unpackedObject).toEqual(originalObject);

        packObject(JSON.stringify(originalObject), sharedBuffer, 1);
        const unpackedObject2 = unpackObject(sharedBuffer, 1);

        expect(unpackedObject2).toEqual(originalObject);
    });

    it("should throw an error if SharedArrayBuffer is too small", () => {
        const sharedBuffer = createSharedBuffer(512); // Small buffer
        const largeObject = { data: "x".repeat(1024) };

        expect(() => packObject(JSON.stringify(largeObject), sharedBuffer, 0)).toThrow();
    });
});
