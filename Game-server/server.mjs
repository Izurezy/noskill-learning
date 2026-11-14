import {createServer} from "node:http";

const port = Number(process.env.PORT ?? 3001);
const answerEvents = new Map();

const sendJson = (response, status, payload) => {
    response.writeHead(status, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify(payload));
};

const readJson = (request) => new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
        body += chunk;
        if (body.length > 10_000) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
        try {
            resolve(JSON.parse(body || "{}"));
        } catch {
            reject(new Error("Request body must be valid JSON"));
        }
    });
    request.on("error", reject);
});

const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "OPTIONS") {
        sendJson(response, 204, {});
        return;
    }

    // External frontend: submit its already-evaluated result.
    if (request.method === "POST" && url.pathname === "/api/game-events/answer") {
        try {
            const {sessionId = "default", correct} = await readJson(request);
            if (typeof sessionId !== "string" || sessionId.length === 0 || typeof correct !== "boolean") {
                sendJson(response, 400, {error: "sessionId and boolean correct are required"});
                return;
            }

            const queue = answerEvents.get(sessionId) ?? [];
            queue.push({type: "answer", correct});
            answerEvents.set(sessionId, queue);
            sendJson(response, 202, {accepted: true, sessionId, correct});
        } catch (error) {
            sendJson(response, 400, {error: error instanceof Error ? error.message : "Invalid request"});
        }
        return;
    }

    // External frontend: request a fresh game for one session.
    if (request.method === "POST" && url.pathname === "/api/game-events/restart") {
        try {
            const {sessionId = "default"} = await readJson(request);
            if (typeof sessionId !== "string" || sessionId.length === 0) {
                sendJson(response, 400, {error: "sessionId is required"});
                return;
            }

            const queue = answerEvents.get(sessionId) ?? [];
            queue.push({type: "restart"});
            answerEvents.set(sessionId, queue);
            sendJson(response, 202, {accepted: true, sessionId, restart: true});
        } catch (error) {
            sendJson(response, 400, {error: error instanceof Error ? error.message : "Invalid request"});
        }
        return;
    }

    // Game client: consume one queued result for its session.
    if (request.method === "GET" && url.pathname === "/api/game-events/next") {
        const sessionId = url.searchParams.get("sessionId") ?? "default";
        const queue = answerEvents.get(sessionId) ?? [];
        const event = queue.shift() ?? null;
        if (queue.length === 0) answerEvents.delete(sessionId);
        sendJson(response, 200, {event});
        return;
    }

    sendJson(response, 404, {error: "Not found"});
});

server.listen(port, () => {
    console.log(`Game event API listening on http://localhost:${port}/api/game-events/answer`);
});
