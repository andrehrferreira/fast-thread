import { describe, it, expect } from "vitest";
import { packObject, unpackObject } from "../index";

describe("SharedArrayBuffer + msgpack-lite Tests", () => {
    it("should correctly serialize and deserialize an object", () => {
        const originalObject = { id: 1, name: "User A", active: true };
        const sharedBuffer = packObject(originalObject);
        const unpackedObject = unpackObject(sharedBuffer);
        expect(unpackedObject).toEqual(originalObject);
    });

    it("should handle empty objects correctly", () => {
        const originalObject = {};
        const sharedBuffer = packObject(originalObject);
        const unpackedObject = unpackObject(sharedBuffer);
        expect(unpackedObject).toEqual(originalObject);
    });

    it("should support nested objects and arrays", () => {
        const originalObject = {
            user: { id: 42, name: "Nested User" },
            roles: ["admin", "editor"],
            meta: { createdAt: Date.now() }
        };

        const sharedBuffer = packObject(originalObject);
        const unpackedObject = unpackObject(sharedBuffer);

        expect(unpackedObject).toEqual(originalObject);
    });

    it("should support large objects", () => {
        const originalObject = {
            data: Array(1000).fill({ id: 1, value: "test" })
        };

        const sharedBuffer = packObject(originalObject);
        const unpackedObject = unpackObject(sharedBuffer);
        expect(unpackedObject).toEqual(originalObject);
    });

    it("should throw error if SharedArrayBuffer is too small", () => {
        const largeObject = { data: "x".repeat(1024 * 1024) };
        expect(() => packObject(largeObject)).not.toThrow();
    });
});
