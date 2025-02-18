module.exports = { schema: {
    title: "Example",
    type: "object",
    properties: {
        id: { type: "integer" },
        name: { type: "string" },
        timestamp: { type: "integer" },
        data: { type: "string" },
        processed: { type: "boolean", nullable: true }
    }
} };
