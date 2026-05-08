// ── Constants (mirrors constants.py) ──────────────────────────────────────────
const SCREEN_WIDTH  = 600;
const SCREEN_HEIGHT = 400;

const GRID_COLUMNS   = 4;
const TILE_PADDING   = 20;
const TILE_LIGHT_GAP = 10;
const FONT_SIZE      = 24;

const FLASH_ON    = 600;   // ms  tile lit during sequence
const FLASH_OFF   = 100;   // ms  gap between sequence flashes
const CLICK_FLASH = 100;   // ms  tile lit after player click
const ROUND_DELAY = 400;   // ms  pause before replaying next round

const GRAY  = "#3c3c3c";
const WHITE = "#ffffff";

const BASE = "ASSETS/";

// ── Asset paths ───────────────────────────────────────────────────────────────
const IMG_PATHS = {
    lightOff:    BASE + "lightOFF.png",
    lightsOn:   [BASE + "blueON.png",         BASE + "greenON.png",
                 BASE + "redON.png",           BASE + "yellowON.png"],
    btns:       [BASE + "blueBTN.png",         BASE + "greenBTN.png",
                 BASE + "redBTN.png",          BASE + "yellowBTN.png"],
    btnsPressed:[BASE + "blueBTNpressed.png",  BASE + "greenBTNpressed.png",
                 BASE + "redBTNpressed.png",   BASE + "yellowBTNpressed.png"],
    startBtn:    BASE + "startBTN.png",
    quitBtn:     BASE + "quitBTN.png",
};

const SFX_PATHS = {
    click:      BASE + "buttonClick.ogg",
    lightOn:    BASE + "lightON.ogg",
    background: BASE + "backgroundSFX.ogg",
};

// ── Loaders ───────────────────────────────────────────────────────────────────
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load: " + src));
        img.src = src;
    });
}

// Sounds are created immediately; canplaythrough may fire later, but since
// playback only starts after user interaction that is fine.
function loadSound(src) {
    try {
        return new Audio(src);
    } catch (_) {
        return null;
    }
}

// ── Tile ──────────────────────────────────────────────────────────────────────
class Tile {
    /**
     * @param {{x:number,y:number,w:number,h:number}} lightRect
     * @param {{x:number,y:number,w:number,h:number}} btnRect
     */
    constructor(lightRect, btnRect, imgOff, imgOn, imgBtn, imgBtnPressed) {
        this.lightRect     = lightRect;
        this.btnRect       = btnRect;
        this.imgOff        = imgOff;
        this.imgOn         = imgOn;
        this.imgBtn        = imgBtn;
        this.imgBtnPressed = imgBtnPressed;
        this.lit     = false;
        this.pressed = false;
    }

    draw(ctx) {
        ctx.drawImage(this.lit     ? this.imgOn         : this.imgOff,
                      this.lightRect.x, this.lightRect.y);
        ctx.drawImage(this.pressed ? this.imgBtnPressed : this.imgBtn,
                      this.btnRect.x,   this.btnRect.y);
    }

    isClicked(mx, my) {
        const r = this.btnRect;
        return mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h;
    }
}

// ── Game ──────────────────────────────────────────────────────────────────────
class Game {
    constructor(images, sounds) {
        this.images = images;
        this.sounds = sounds;

        this.tiles        = [];
        this.pattern      = [];
        this.state        = "idle";      // idle | showing | waiting | click_flash | delay
        this.currentRound = 1;
        this.showIndex    = 0;
        this.showTimer    = 0;
        this.plyrProgress = 0;
        this.clickTileIndex = null;
        this.clickCorrect   = false;
        this.clickTimer     = 0;
        this.delayTimer     = 0;
        this.bgMusic        = null;

        this._createTiles();
        this._createButtons();
    }

    // ── Layout (mirrors Game.create_tiles / create_button) ───────────────────
    _createTiles() {
        const imgOff  = this.images.lightOff;
        const lightW  = imgOff.naturalWidth,  lightH = imgOff.naturalHeight;

        const sampleBtn = this.images.btns[0];
        const btnW      = sampleBtn.naturalWidth, btnH = sampleBtn.naturalHeight;

        const colW        = Math.max(lightW, btnW);
        const totalWidth  = GRID_COLUMNS * colW + (GRID_COLUMNS - 1) * TILE_PADDING;
        const totalHeight = lightH + TILE_LIGHT_GAP + btnH;

        const startX = Math.floor((SCREEN_WIDTH  - totalWidth)  / 2);
        const startY = Math.floor((SCREEN_HEIGHT - totalHeight) / 2);

        this.gridTop    = startY;
        this.gridBottom = startY + totalHeight;

        for (let col = 0; col < GRID_COLUMNS; col++) {
            const cx = startX + col * (colW + TILE_PADDING);

            const lightX    = cx + Math.floor((colW - lightW) / 2);
            const lightRect = { x: lightX, y: startY, w: lightW, h: lightH };

            const btnX   = cx + Math.floor((colW - btnW) / 2);
            const btnY   = startY + lightH + TILE_LIGHT_GAP;
            const btnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

            this.tiles.push(new Tile(
                lightRect, btnRect,
                imgOff,
                this.images.lightsOn[col],
                this.images.btns[col],
                this.images.btnsPressed[col]
            ));
        }
    }

    _createButtons() {
        const si = this.images.startBtn;
        const sw = si.naturalWidth, sh = si.naturalHeight;
        this.buttonRect = {
            x: Math.floor((SCREEN_WIDTH - sw) / 2),
            y: Math.floor((this.gridTop  - sh) / 2),
            w: sw, h: sh,
        };

        const qi = this.images.quitBtn;
        const qw = qi.naturalWidth, qh = qi.naturalHeight;
        this.quitRect = {
            x: Math.floor((SCREEN_WIDTH - qw) / 2),
            y: this.gridBottom + Math.floor((SCREEN_HEIGHT - this.gridBottom - qh) / 2),
            w: qw, h: qh,
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _resetTiles() {
        for (const t of this.tiles) { t.lit = false; t.pressed = false; }
    }

    _flashCurrent() {
        this.tiles[this.pattern[this.showIndex] - 1].lit = true;
        this._playSound("lightOn");
        this.showTimer = performance.now();
    }

    _pointInRect(mx, my, r) {
        return mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h;
    }

    _playSound(name) {
        const snd = this.sounds[name];
        if (!snd) return;
        const clone = snd.cloneNode();
        clone.volume = (name === "background") ? 0.02 : 0.2;
        clone.play().catch(() => {});
    }

    _startBgMusic() {
        const snd = this.sounds.background;
        if (!snd) return;
        this.bgMusic = snd.cloneNode();
        this.bgMusic.loop   = true;
        this.bgMusic.volume = 0.02;
        this.bgMusic.play().catch(() => {});
    }

    _stopBgMusic() {
        if (this.bgMusic) { this.bgMusic.pause(); this.bgMusic = null; }
    }

    // ── Public API ────────────────────────────────────────────────────────────
    startGame() {
        this.pattern      = Array.from({ length: 50 }, () => Math.floor(Math.random() * 4) + 1);
        this.currentRound = 1;
        this.showIndex    = 0;
        this.plyrProgress = 0;
        this._resetTiles();
        this._startBgMusic();
        this.state = "showing";
        this._flashCurrent();
    }

    endGame() {
        this._stopBgMusic();
        this._resetTiles();
        this.state = "idle";
    }

    update() {
        const now = performance.now();

        if (this.state === "showing") {
            const elapsed = now - this.showTimer;
            if (elapsed < FLASH_ON) {
                // tile stays lit — nothing to do
            } else if (elapsed < FLASH_ON + FLASH_OFF) {
                this._resetTiles();
            } else {
                this.showIndex++;
                if (this.showIndex >= this.currentRound) {
                    this.state        = "waiting";
                    this.plyrProgress = 0;
                } else {
                    this._flashCurrent();
                }
            }

        } else if (this.state === "click_flash") {
            if (now - this.clickTimer >= CLICK_FLASH) {
                this.tiles[this.clickTileIndex].lit     = false;
                this.tiles[this.clickTileIndex].pressed = false;

                if (this.clickCorrect) {
                    this.plyrProgress++;
                    if (this.plyrProgress >= this.currentRound) {
                        this.currentRound++;
                        if (this.currentRound > 50) {
                            this.endGame();
                        } else {
                            this.delayTimer = performance.now();
                            this.state = "delay";
                        }
                    } else {
                        this.state = "waiting";
                    }
                } else {
                    this.endGame();
                }
            }

        } else if (this.state === "delay") {
            if (now - this.delayTimer >= ROUND_DELAY) {
                this.showIndex = 0;
                this._resetTiles();
                this.state = "showing";
                this._flashCurrent();
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = GRAY;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        for (const tile of this.tiles) tile.draw(ctx);

        if (this.state === "idle") {
            ctx.drawImage(this.images.startBtn, this.buttonRect.x, this.buttonRect.y);
        } else {
            ctx.font         = `${FONT_SIZE}px GameFont`;
            ctx.fillStyle    = WHITE;
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                `Round: ${this.currentRound}`,
                this.buttonRect.x + this.buttonRect.w / 2,
                this.buttonRect.y + this.buttonRect.h / 2
            );
        }

        ctx.drawImage(this.images.quitBtn, this.quitRect.x, this.quitRect.y);
    }

    handleClick(mx, my) {
        // Quit — on the web there is nothing to quit; return to idle
        if (this._pointInRect(mx, my, this.quitRect)) {
            this._playSound("click");
            this.endGame();
            return;
        }

        // Start button
        if (this._pointInRect(mx, my, this.buttonRect)) {
            if (this.state === "idle") {
                this._playSound("click");
                this.startGame();
            }
            return;
        }

        if (this.state !== "waiting") return;

        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].isClicked(mx, my)) {
                this._playSound("click");
                this.tiles[i].lit     = true;
                this.tiles[i].pressed = true;
                this.clickTileIndex   = i;
                this.clickCorrect     = (i === this.pattern[this.plyrProgress] - 1);
                this.clickTimer       = performance.now();
                this.state            = "click_flash";
                break;
            }
        }
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────
(async function main() {
    const canvas = document.getElementById("gameCanvas");
    const ctx    = canvas.getContext("2d");

    // Loading screen
    ctx.fillStyle    = GRAY;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle    = WHITE;
    ctx.font         = "20px sans-serif";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Loading…", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    // Font
    try {
        const face = new FontFace("GameFont", `url(${BASE}QuinqueFiveFont.ttf)`);
        await face.load();
        document.fonts.add(face);
    } catch (_) { /* fall back to sans-serif */ }

    // Images
    const [
        lightOffImg,
        blueOnImg,  greenOnImg,  redOnImg,  yellowOnImg,
        blueBtnImg, greenBtnImg, redBtnImg, yellowBtnImg,
        bluePressedImg, greenPressedImg, redPressedImg, yellowPressedImg,
        startBtnImg, quitBtnImg,
    ] = await Promise.all([
        loadImage(IMG_PATHS.lightOff),
        loadImage(IMG_PATHS.lightsOn[0]),    loadImage(IMG_PATHS.lightsOn[1]),
        loadImage(IMG_PATHS.lightsOn[2]),    loadImage(IMG_PATHS.lightsOn[3]),
        loadImage(IMG_PATHS.btns[0]),        loadImage(IMG_PATHS.btns[1]),
        loadImage(IMG_PATHS.btns[2]),        loadImage(IMG_PATHS.btns[3]),
        loadImage(IMG_PATHS.btnsPressed[0]), loadImage(IMG_PATHS.btnsPressed[1]),
        loadImage(IMG_PATHS.btnsPressed[2]), loadImage(IMG_PATHS.btnsPressed[3]),
        loadImage(IMG_PATHS.startBtn),
        loadImage(IMG_PATHS.quitBtn),
    ]);

    const images = {
        lightOff:    lightOffImg,
        lightsOn:   [blueOnImg,     greenOnImg,     redOnImg,     yellowOnImg],
        btns:       [blueBtnImg,    greenBtnImg,    redBtnImg,    yellowBtnImg],
        btnsPressed:[bluePressedImg, greenPressedImg, redPressedImg, yellowPressedImg],
        startBtn:   startBtnImg,
        quitBtn:    quitBtnImg,
    };

    // Sounds (created eagerly; browsers allow playback after first user gesture)
    const sounds = {
        click:      loadSound(SFX_PATHS.click),
        lightOn:    loadSound(SFX_PATHS.lightOn),
        background: loadSound(SFX_PATHS.background),
    };

    const game = new Game(images, sounds);

    // Mouse / touch input — scale coordinates to canvas logical pixels
    function getCanvasPos(clientX, clientY) {
        const r  = canvas.getBoundingClientRect();
        return [
            (clientX - r.left) * (canvas.width  / r.width),
            (clientY - r.top)  * (canvas.height / r.height),
        ];
    }

    canvas.addEventListener("click", (e) => {
        const [mx, my] = getCanvasPos(e.clientX, e.clientY);
        game.handleClick(mx, my);
    });

    // Touch support
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        const [mx, my] = getCanvasPos(t.clientX, t.clientY);
        game.handleClick(mx, my);
    }, { passive: false });

    // Game loop
    function loop() {
        game.update();
        game.draw(ctx);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})().catch(console.error);
