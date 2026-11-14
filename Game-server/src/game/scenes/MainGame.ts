import {Scene} from "phaser";
import {GridSystem} from "../systems/GridSystem.ts";
import {BuildingPlacementSystem} from "../systems/BuildingPlacementSystem.ts";
import {EnemySystem} from "../systems/EnemySystem.ts";
import {ExternalAnswerSystem} from "../systems/ExternalAnswerSystem.ts";

export class MainGame extends Scene {
    private grid!: GridSystem;
    private buildingSystem!: BuildingPlacementSystem;
    private enemySystem!: EnemySystem;

    constructor() {
        super('MainGame');
    }

    create() {

        this.grid = new GridSystem(this);

        this.buildingSystem = new BuildingPlacementSystem(
            this,
            this.grid
        );
        this.enemySystem = new EnemySystem(this, this.grid, () => this.scene.start('GameOver'));
        new ExternalAnswerSystem(
            this,
            () => this.buildingSystem.placeRewardTower(),
            () => this.enemySystem.spawnWave(),
            () => this.scene.restart(),
        );
    }

    update(time: number, delta: number) {
        this.enemySystem.update(time, delta);
        this.buildingSystem.update(time, this.enemySystem);
    }
}
