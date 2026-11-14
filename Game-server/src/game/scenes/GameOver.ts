import {Scene} from "phaser";
import {ExternalAnswerSystem} from "../systems/ExternalAnswerSystem.ts";

export class GameOver extends Scene {
    private backdrop!: Phaser.GameObjects.Rectangle;
    private title!: Phaser.GameObjects.Text;
    private message!: Phaser.GameObjects.Text;

    constructor() {
        super("GameOver");
    }

    create() {
        this.cameras.main.setBackgroundColor(0x190f17);
        this.backdrop = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x28131c, 0.96)
            .setOrigin(0)
            .setDepth(0);
        this.title = this.add.text(0, 0, "GAME OVER", {
            fontFamily: "Arial Black, Arial, sans-serif", fontSize: "52px", color: "#ff7b7b",
            stroke: "#4a1010", strokeThickness: 8,
        }).setOrigin(0.5).setDepth(1);
        this.message = this.add.text(0, 0, "The Town Hall has fallen.", {
            fontFamily: "Arial, sans-serif", fontSize: "20px", color: "#ffffff", align: "center", lineSpacing: 8,
        }).setOrigin(0.5).setDepth(1);

        this.layout();
        this.scale.on("resize", this.layout, this);
        this.events.once("shutdown", () => this.scale.off("resize", this.layout, this));

        new ExternalAnswerSystem(
            this,
            () => false,
            () => undefined,
            () => this.scene.start("MainGame"),
        );
    }

    private layout() {
        this.backdrop.setSize(this.scale.width, this.scale.height);
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        this.title.setPosition(centerX, centerY - 42);
        this.message.setPosition(centerX, centerY + 36);
    }
}
