export class GridSystem {
    // @ts-ignore
    private scene: Phaser.Scene;
    private tileSize = 64;
    private rows = 10;
    private cols = 10;
    private readonly boardPadding = 24;
    private originX = 0;
    private originY = 0;

    private graphics: Phaser.GameObjects.Graphics;
    private hoverGraphics: Phaser.GameObjects.Graphics;
    private resizeListeners = new Set<() => void>();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        this.graphics = scene.add.graphics();
        this.hoverGraphics = scene.add.graphics();

        this.resize();
        scene.scale.on("resize", this.resize, this);
        scene.events.once("shutdown", () => scene.scale.off("resize", this.resize, this));
    }

    get rowCount() { return this.rows; }
    get columnCount() { return this.cols; }
    get cellSize() { return this.tileSize; }

    onResize(listener: () => void) {
        this.resizeListeners.add(listener);
        listener();
    }

    private resize() {
        const availableWidth = Math.max(1, this.scene.scale.width - this.boardPadding * 2);
        const availableHeight = Math.max(1, this.scene.scale.height - this.boardPadding * 2);
        this.tileSize = Math.max(1, Math.floor(Math.min(
            availableWidth / this.cols,
            availableHeight / this.rows
        )));

        const boardWidth = this.cols * this.tileSize;
        const boardHeight = this.rows * this.tileSize;
        this.originX = Math.floor((this.scene.scale.width - boardWidth) / 2);
        this.originY = Math.floor((this.scene.scale.height - boardHeight) / 2);
        this.drawGrid();
        this.resizeListeners.forEach((listener) => listener());
    }

    private drawGrid() {
        this.graphics.clear();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = this.originX + col * this.tileSize;
                const y = this.originY + row * this.tileSize;

                this.graphics.fillStyle(0x568b52);
                this.graphics.fillRect(
                    x, y,
                    this.tileSize,
                    this.tileSize
                );

                this.graphics.lineStyle(1, 0x263c30, 0.5);
                this.graphics.strokeRect(
                    x, y,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }

    getCellAt(worldX: number, worldY: number) {
        const col = Math.floor((worldX - this.originX) / this.tileSize);
        const row = Math.floor((worldY - this.originY) / this.tileSize);

        if (
            row < 0 || row >= this.rows ||
            col < 0 || col >= this.cols
        ) {
            return null;
        }

        return {row, col};
    }

    getCellPosition(row: number, col: number) {
        return {
            x: this.originX + col * this.tileSize + this.tileSize / 2,
            y: this.originY + row * this.tileSize + this.tileSize / 2,
        };
    }

    getCellBounds(row: number, col: number) {
        return {
            x: this.originX + col * this.tileSize,
            y: this.originY + row * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
        };
    }

    highlightCell(row: number, col: number, color = 0xffffff) {
        this.hoverGraphics.clear();

        this.hoverGraphics.lineStyle(3, color, 1);

        this.hoverGraphics.strokeRect(
            this.originX + col * this.tileSize,
            this.originY + row * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    clearHighlight() {
        this.hoverGraphics.clear();
    }
}
