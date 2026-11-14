const params = new URLSearchParams(window.location.search);

export const gameSessionId = params.get("sessionId")
    ?? import.meta.env.VITE_GAME_SESSION_ID
    ?? "default";

export type GameFrameUpdate =
    | "ready"
    | "tower-placed"
    | "tower-removed"
    | "enemy-wave-spawned"
    | "enemy-progress"
    | "enemy-defeated"
    | "game-over"
    | "restart";

/** Safely reports game events to the trusted page that embeds this game. */
export class GameFrameBridge {
    private readonly parentOrigin: string | null;

    constructor() {
        const configuredOrigin = params.get("parentOrigin");
        try {
            this.parentOrigin = configuredOrigin ? new URL(configuredOrigin).origin : null;
        } catch {
            this.parentOrigin = null;
        }

        window.addEventListener("message", this.onMessage);
    }

    publish(type: GameFrameUpdate, detail: Record<string, number> = {}) {
        if (!this.parentOrigin || window.parent === window) return;

        window.parent.postMessage({
            channel: "noskill-learning-game",
            sessionId: gameSessionId,
            type,
            detail,
        }, this.parentOrigin);
    }

    destroy() {
        window.removeEventListener("message", this.onMessage);
    }

    private onMessage = (event: MessageEvent) => {
        if (
            !this.parentOrigin ||
            event.origin !== this.parentOrigin ||
            event.source !== window.parent ||
            !event.data ||
            event.data.channel !== "noskill-learning-game" ||
            event.data.sessionId !== gameSessionId ||
            event.data.type !== "request-status"
        ) return;

        this.publish("ready");
    };
}
