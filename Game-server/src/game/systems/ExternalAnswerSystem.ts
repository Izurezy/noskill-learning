const sessionId = new URLSearchParams(window.location.search).get("sessionId")
    ?? import.meta.env.VITE_GAME_SESSION_ID
    ?? "default";
const eventsEndpoint = "/api/game-events/next";

/** Receives answer outcomes that an external frontend has submitted to the API. */
export class ExternalAnswerSystem {
    private requestInFlight = false;

    constructor(
        scene: Phaser.Scene,
        private readonly onCorrect: () => boolean,
        private readonly onWrong: () => void,
        private readonly onRestart: () => void,
    ) {
        scene.time.addEvent({delay: 500, loop: true, callback: () => void this.poll()});
    }

    private async poll() {
        if (this.requestInFlight) return;
        this.requestInFlight = true;

        try {
            const response = await fetch(`${eventsEndpoint}?sessionId=${encodeURIComponent(sessionId)}`);
            const result: unknown = await response.json();
            if (!response.ok || typeof result !== "object" || result === null || !("event" in result)) return;

            const event = result.event;
            if (typeof event !== "object" || event === null || !("type" in event) || typeof event.type !== "string") return;

            if (event.type === "restart") {
                this.onRestart();
            } else if (event.type === "answer" && "correct" in event && typeof event.correct === "boolean") {
                if (event.correct) {
                    this.onCorrect();
                } else {
                    this.onWrong();
                }
            }
        } catch {
            // The external answer service may be temporarily unavailable.
            // Polling will retry on the next scheduled interval.
        } finally {
            this.requestInFlight = false;
        }
    }
}
