import {GridSystem} from "./GridSystem.ts";
import {ENEMY_PATH, EnemySystem} from "./EnemySystem.ts";

type TowerType = "archer" | "cannon" | "magic";

type PlacedTower = {
    row: number;
    col: number;
    tower: Phaser.GameObjects.Image;
    lastShotAt: number;
};

export class BuildingPlacementSystem {
    private scene: Phaser.Scene;
    private grid: GridSystem;

    private occupiedCells = new Set<string>();
    private placedTowers: PlacedTower[] = [];
    private mapGraphics: Phaser.GameObjects.Graphics;
    private townHall: Phaser.GameObjects.Image;

    private buildableMap = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 3, 3, 3, 3, 1, 1, 1],
        [1, 1, 3, 3, 3, 3, 3, 3, 1, 1],
        [1, 1, 3, 2, 2, 2, 2, 3, 1, 1],
        [1, 1, 3, 2, 4, 4, 2, 3, 1, 1],
        [1, 1, 3, 2, 4, 4, 2, 3, 1, 1],
        [1, 1, 3, 2, 2, 2, 2, 3, 1, 1],
        [1, 1, 3, 3, 3, 3, 3, 3, 1, 1],
        [1, 1, 1, 3, 3, 3, 3, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    private towerPermissions: Record<TowerType, number[]> = {
        archer: [2, 3],
        cannon: [2],
        magic: [3],
    };

    constructor(scene: Phaser.Scene, grid: GridSystem, private readonly onEnemyDefeated: () => void) {
        this.scene = scene;
        this.grid = grid;
        this.mapGraphics = scene.add.graphics().setDepth(1);
        this.townHall = scene.add.image(0, 0, 'town-hall').setDepth(5);
        this.grid.onResize(() => this.layoutMap());
    }

    canPlace(
        row: number,
        col: number,
        towerType: TowerType
    ): boolean {
        const zone = this.buildableMap[row]?.[col];

        if (zone === undefined) return false;

        if (!this.towerPermissions[towerType].includes(zone)) {
            return false;
        }

        // The road is intentionally unavailable, and is now visibly drawn.
        if (this.isPathCell(row, col)) {
            return false;
        }

        const key = `${row},${col}`;

        return !this.occupiedCells.has(key);
    }

    placeTower(
        row: number,
        col: number,
        towerType: TowerType
    ) {
        if (!this.canPlace(row, col, towerType)) {
            return false;
        }

        const key = `${row},${col}`;

        this.occupiedCells.add(key);

        const position = this.grid.getCellPosition(row, col);

        const colors: Record<TowerType, number> = {
            archer: 0x3b82f6,
            cannon: 0xf59e0b,
            magic: 0xa855f7,
        };

        const towerSize = this.grid.cellSize * 0.9;
        const tower = this.scene.add.image(
            position.x,
            position.y,
            'tower-archer'
        ).setDisplaySize(towerSize, towerSize).setDepth(10);

        // Keep the generated archer art natural; temporarily tint the other
        // types until they receive their own sprite assets.
        if (towerType !== "archer") tower.setTint(colors[towerType]);
        this.placedTowers.push({row, col, tower, lastShotAt: 0});

        return true;
    }

    /** Called by an external correct-answer event; player clicks never place towers directly. */
    placeRewardTower() {
        const availableCells: { row: number; col: number; distanceToPath: number }[] = [];

        for (let row = 0; row < this.grid.rowCount; row++) {
            for (let col = 0; col < this.grid.columnCount; col++) {
                if (!this.canPlace(row, col, "archer")) continue;

                const distanceToPath = Math.min(...ENEMY_PATH.map((cell) => (
                    Math.abs(cell.row - row) + Math.abs(cell.col - col)
                )));
                availableCells.push({row, col, distanceToPath});
            }
        }

        if (availableCells.length === 0) return false;

        // Put reward towers next to the road so they can help immediately.
        availableCells.sort((a, b) => a.distanceToPath - b.distanceToPath);
        const cell = availableCells[0];
        return this.placeTower(cell.row, cell.col, "archer");
    }

    /** Removes the newest reward tower after a wrong external answer. */
    removeMostRecentTower() {
        const placedTower = this.placedTowers.pop();
        if (!placedTower) return false;

        this.occupiedCells.delete(`${placedTower.row},${placedTower.col}`);
        placedTower.tower.destroy();
        return true;
    }

    /** Draw the authored map using the same cell bounds as clicks and towers. */
    private layoutMap() {
        this.mapGraphics.clear();

        for (let row = 0; row < this.grid.rowCount; row++) {
            for (let col = 0; col < this.grid.columnCount; col++) {
                const bounds = this.grid.getCellBounds(row, col);
                const zone = this.buildableMap[row][col];

                // 2 = buildable ground, 3 = wall / defence zone.
                if (zone === 2 || zone === 3) {
                    this.mapGraphics.fillStyle(zone === 2 ? 0x94a85f : 0x6f7880, 0.76);
                    this.mapGraphics.fillRect(bounds.x + 1, bounds.y + 1, bounds.width - 2, bounds.height - 2);
                }
            }
        }

        // This is the only non-buildable route. Showing it prevents the
        // invisible path rule from making otherwise valid-looking cells fail.
        for (const cell of ENEMY_PATH) {
            const bounds = this.grid.getCellBounds(cell.row, cell.col);
            this.mapGraphics.fillStyle(0x805a3c, 0.95);
            this.mapGraphics.fillRect(bounds.x + 2, bounds.y + 2, bounds.width - 4, bounds.height - 4);
        }

        // The four adjacent 4 values are one 2-by-2 Town Hall image.
        const topLeft = this.grid.getCellBounds(4, 4);
        const bottomRight = this.grid.getCellBounds(5, 5);
        const width = bottomRight.x + bottomRight.width - topLeft.x;
        const height = bottomRight.y + bottomRight.height - topLeft.y;
        this.townHall.setPosition(topLeft.x + width / 2, topLeft.y + height / 2);
        this.townHall.setDisplaySize(width * 0.98, height * 0.98);

        // Keep towers centered and proportional if the game window changes size.
        this.placedTowers.forEach(({row, col, tower}) => {
            const position = this.grid.getCellPosition(row, col);
            const towerSize = this.grid.cellSize * 0.9;
            tower.setPosition(position.x, position.y);
            tower.setDisplaySize(towerSize, towerSize);
        });
    }

    update(time: number, enemies: EnemySystem) {
        const range = this.grid.cellSize * 3.25;

        for (const placedTower of this.placedTowers) {
            if (time - placedTower.lastShotAt < 700) continue;

            const target = enemies.getEnemies()
                .filter((enemy) => enemy.sprite.active)
                .sort((a, b) => (
                    Phaser.Math.Distance.Between(placedTower.tower.x, placedTower.tower.y, a.sprite.x, a.sprite.y)
                    - Phaser.Math.Distance.Between(placedTower.tower.x, placedTower.tower.y, b.sprite.x, b.sprite.y)
                ))[0];

            if (!target || Phaser.Math.Distance.Between(placedTower.tower.x, placedTower.tower.y, target.sprite.x, target.sprite.y) > range) {
                continue;
            }

            placedTower.lastShotAt = time;
            this.fireAt(placedTower.tower, target, enemies);
        }
    }

    private fireAt(tower: Phaser.GameObjects.Image, target: ReturnType<EnemySystem["getEnemies"]>[number], enemies: EnemySystem) {
        const projectile = this.scene.add.circle(tower.x, tower.y, Math.max(3, this.grid.cellSize * 0.05), 0xffe08a)
            .setDepth(12);
        this.scene.tweens.add({
            targets: projectile,
            x: target.sprite.x,
            y: target.sprite.y,
            duration: 180,
            onComplete: () => {
                projectile.destroy();
                if (enemies.damage(target, 1)) this.onEnemyDefeated();
            },
        });
    }

    private isPathCell(row: number, col: number) {
        return ENEMY_PATH.some((cell) => cell.row === row && cell.col === col);
    }
}
