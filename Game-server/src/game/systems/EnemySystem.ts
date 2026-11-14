import {GridSystem} from "./GridSystem.ts";

export type PathCell = { row: number; col: number };

// Enemies enter from the bottom-right and walk to the Town Hall.
export const ENEMY_PATH: PathCell[] = [
    {row: 9, col: 9}, {row: 8, col: 9}, {row: 8, col: 8},
    {row: 7, col: 8}, {row: 7, col: 7}, {row: 7, col: 6},
    {row: 6, col: 6}, {row: 5, col: 6}, {row: 5, col: 5},
];

export type Enemy = {
    sprite: Phaser.GameObjects.Arc;
    healthBar: Phaser.GameObjects.Graphics;
    waypoint: number;
    health: number;
    maxHealth: number;
    speed: number;
};

export class EnemySystem {
    private readonly enemies: Enemy[] = [];
    private readonly townHallHealthBar: Phaser.GameObjects.Graphics;
    private readonly townHallHealthText: Phaser.GameObjects.Text;
    private townHallHealth = 20;
    private readonly maxTownHallHealth = 20;
    private gameOver = false;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly grid: GridSystem,
        private readonly onTownHallDestroyed: () => void,
    ) {
        this.townHallHealthBar = scene.add.graphics().setDepth(15);
        this.townHallHealthText = scene.add.text(0, 0, "", {
            fontFamily: "Arial, sans-serif", fontSize: "14px", color: "#ffffff", fontStyle: "bold",
        }).setOrigin(0.5).setDepth(16);
        grid.onResize(() => this.relayoutEnemies());
    }

    update(_time: number, delta: number) {
        if (this.gameOver) return;

        for (const enemy of [...this.enemies]) {
            const targetCell = ENEMY_PATH[enemy.waypoint];
            if (!targetCell) {
                this.damageTownHall(1);
                this.remove(enemy);
                continue;
            }

            const target = this.grid.getCellPosition(targetCell.row, targetCell.col);
            const distance = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, target.x, target.y);
            const step = enemy.speed * (delta / 1000);

            if (distance <= step) {
                enemy.sprite.setPosition(target.x, target.y);
                enemy.waypoint += 1;
            } else {
                const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, target.x, target.y);
                enemy.sprite.x += Math.cos(angle) * step;
                enemy.sprite.y += Math.sin(angle) * step;
            }

            this.drawEnemyHealth(enemy);
        }
    }

    getEnemies() {
        return this.enemies;
    }

    /** Penalty for a wrong external answer. */
    spawnWave(count = 5) {
        if (this.gameOver) return;

        for (let index = 0; index < count; index++) {
            this.scene.time.delayedCall(index * 400, () => this.spawn());
        }
    }

    damage(enemy: Enemy, amount: number) {
        if (!this.enemies.includes(enemy)) return false;

        enemy.health -= amount;
        this.drawEnemyHealth(enemy);
        enemy.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(70, () => {
            if (enemy.sprite.active) enemy.sprite.setFillStyle(0xd94b4b);
        });

        if (enemy.health <= 0) {
            this.remove(enemy);
            return true;
        }

        return false;
    }

    private spawn() {
        const start = this.grid.getCellPosition(ENEMY_PATH[0].row, ENEMY_PATH[0].col);
        const size = Math.max(8, this.grid.cellSize * 0.2);
        const sprite = this.scene.add.circle(start.x, start.y, size, 0xd94b4b)
            .setStrokeStyle(Math.max(1, this.grid.cellSize * 0.02), 0x5d1f1f)
            .setDepth(8);
        const healthBar = this.scene.add.graphics().setDepth(9);
        const enemy = {sprite, healthBar, waypoint: 1, health: 3, maxHealth: 3, speed: this.grid.cellSize * 0.9};
        this.enemies.push(enemy);
        this.drawEnemyHealth(enemy);
    }

    private remove(enemy: Enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index >= 0) this.enemies.splice(index, 1);
        enemy.sprite.destroy();
        enemy.healthBar.destroy();
    }

    private relayoutEnemies() {
        for (const enemy of this.enemies) {
            const cell = ENEMY_PATH[Math.min(enemy.waypoint, ENEMY_PATH.length - 1)];
            const position = this.grid.getCellPosition(cell.row, cell.col);
            const size = Math.max(8, this.grid.cellSize * 0.2);
            enemy.sprite.setPosition(position.x, position.y).setRadius(size);
            this.drawEnemyHealth(enemy);
        }
        this.drawTownHallHealth();
    }

    private drawEnemyHealth(enemy: Enemy) {
        const width = Math.max(22, this.grid.cellSize * 0.42);
        const height = Math.max(4, this.grid.cellSize * 0.06);
        const x = enemy.sprite.x - width / 2;
        const y = enemy.sprite.y - enemy.sprite.radius - height - 4;
        enemy.healthBar.clear();
        enemy.healthBar.fillStyle(0x241b1b, 0.95);
        enemy.healthBar.fillRect(x, y, width, height);
        enemy.healthBar.fillStyle(0x45d06f, 1);
        enemy.healthBar.fillRect(x, y, width * Math.max(0, enemy.health / enemy.maxHealth), height);
        enemy.healthBar.lineStyle(1, 0xffffff, 0.7);
        enemy.healthBar.strokeRect(x, y, width, height);
    }

    private damageTownHall(amount: number) {
        this.townHallHealth = Math.max(0, this.townHallHealth - amount);
        this.drawTownHallHealth();

        if (this.townHallHealth === 0 && !this.gameOver) {
            this.gameOver = true;
            this.onTownHallDestroyed();
        }
    }

    private drawTownHallHealth() {
        const topLeft = this.grid.getCellBounds(4, 4);
        const bottomRight = this.grid.getCellBounds(5, 5);
        const width = bottomRight.x + bottomRight.width - topLeft.x - 16;
        const height = Math.max(7, this.grid.cellSize * 0.1);
        const x = topLeft.x + 8;
        const y = topLeft.y + 10;
        const ratio = this.townHallHealth / this.maxTownHallHealth;

        this.townHallHealthBar.clear();
        this.townHallHealthBar.fillStyle(0x291a1a, 0.95);
        this.townHallHealthBar.fillRect(x, y, width, height);
        this.townHallHealthBar.fillStyle(ratio > 0.35 ? 0x45d06f : 0xde4a4a, 1);
        this.townHallHealthBar.fillRect(x, y, width * ratio, height);
        this.townHallHealthBar.lineStyle(1, 0xffffff, 0.8);
        this.townHallHealthBar.strokeRect(x, y, width, height);
        this.townHallHealthText.setText(`Town Hall ${this.townHallHealth}/${this.maxTownHallHealth}`);
        this.townHallHealthText.setPosition(topLeft.x + (bottomRight.x + bottomRight.width - topLeft.x) / 2, y + height + 9);
    }
}
