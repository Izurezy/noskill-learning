import {Scene} from "phaser";
import {GridSystem} from "../systems/GridSystem.ts";
import {BuildingPlacementSystem} from "../systems/BuildingPlacementSystem.ts";
import {ENEMY_PATH, EnemySystem} from "../systems/EnemySystem.ts";
import {ExternalAnswerSystem} from "../systems/ExternalAnswerSystem.ts";
import {GameFrameBridge} from "../systems/GameFrameBridge.ts";

export class MainGame extends Scene {
    private grid!: GridSystem;
    private buildingSystem!: BuildingPlacementSystem;
    private enemySystem!: EnemySystem;
    private frameBridge!: GameFrameBridge;
    private lastEnemyProgressAt = 0;

    constructor() {
        super('MainGame');
    }

    create() {
        this.frameBridge = new GameFrameBridge();
        this.events.once("shutdown", () => this.frameBridge.destroy());

        this.grid = new GridSystem(this);

        this.buildingSystem = new BuildingPlacementSystem(
            this,
            this.grid,
            () => {
                this.frameBridge.publish("enemy-defeated");
            },
        );
        this.enemySystem = new EnemySystem(this, this.grid, () => {
            this.frameBridge.publish("game-over");
            this.scene.start('GameOver');
        });
        new ExternalAnswerSystem(
            this,
            () => {
                const placed = this.buildingSystem.placeRewardTower();
                if (placed) this.frameBridge.publish("tower-placed");
                return placed;
            },
            () => {
                if (this.buildingSystem.removeMostRecentTower()) {
                    this.frameBridge.publish("tower-removed");
                }
                this.enemySystem.spawnWave();
                this.frameBridge.publish("enemy-wave-spawned");
            },
            () => {
                this.frameBridge.publish("restart");
                this.scene.restart();
            },
        );
        this.frameBridge.publish("ready");
    }

    update(time: number, delta: number) {
        this.enemySystem.update(time, delta);
        this.buildingSystem.update(time, this.enemySystem);

        const activeEnemies = this.enemySystem.getEnemies().filter((enemy) => enemy.sprite.active);
        if (activeEnemies.length > 0 && time - this.lastEnemyProgressAt >= 400) {
            const furthestWaypoint = Math.max(...activeEnemies.map((enemy) => enemy.waypoint));
            this.frameBridge.publish("enemy-progress", {
                activeEnemies: activeEnemies.length,
                progress: Math.min(100, Math.round((furthestWaypoint / ENEMY_PATH.length) * 100)),
            });
            this.lastEnemyProgressAt = time;
        }
    }
}
