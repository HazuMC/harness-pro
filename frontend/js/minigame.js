// minigame.js - Mini Game Giải Trí Trong Lúc Chờ Tạo Ảnh (HARNESS STUDIO)

let runnerAnimationId = null;
let isRunnerRunning = false;
let runnerGameInstance = null;

// ==========================================
// 1. GAME 1: CLAPPERBOARD RUNNER (Canvas Jump)
// ==========================================
class ClapperboardRunner {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width = 600;
        this.height = this.canvas.height = 160;

        this.player = {
            x: 50,
            y: 110,
            width: 28,
            height: 28,
            vy: 0,
            gravity: 0.65,
            jumpStrength: -10.5,
            isGrounded: true
        };

        this.obstacles = [];
        this.obstacleTimer = 0;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem("harness_minigame_highscore") || "0", 10);
        this.gameOver = false;
        this.speed = 4.5;

        this.bindEvents();
    }

    bindEvents() {
        this.handleJump = (e) => {
            if (e.type === "keydown" && e.code !== "Space") return;
            if (e.type === "keydown") e.preventDefault();

            if (this.gameOver) {
                this.restart();
                return;
            }

            if (this.player.isGrounded) {
                this.player.vy = this.player.jumpStrength;
                this.player.isGrounded = false;
            }
        };

        window.addEventListener("keydown", this.handleJump);
        this.canvas.addEventListener("pointerdown", this.handleJump);
    }

    destroy() {
        window.removeEventListener("keydown", this.handleJump);
        if (runnerAnimationId) {
            cancelAnimationFrame(runnerAnimationId);
            runnerAnimationId = null;
        }
        isRunnerRunning = false;
    }

    restart() {
        this.player.y = 110;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.score = 0;
        this.gameOver = false;
        this.speed = 4.5;
        this.loop();
    }

    spawnObstacle() {
        const types = ["🎥", "🎞️", "🍿", "📐"];
        const emoji = types[Math.floor(Math.random() * types.length)];
        this.obstacles.push({
            x: this.width,
            y: 110,
            width: 24,
            height: 24,
            emoji: emoji
        });
    }

    update() {
        if (this.gameOver) return;

        // Player physics
        this.player.vy += this.player.gravity;
        this.player.y += this.player.vy;

        if (this.player.y >= 110) {
            this.player.y = 110;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        // Spawn obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer > 65 + Math.random() * 40) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
        }

        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.speed;

            // Collision check
            if (
                this.player.x < obs.x + obs.width - 6 &&
                this.player.x + this.player.width > obs.x + 6 &&
                this.player.y < obs.y + obs.height - 6 &&
                this.player.y + this.player.height > obs.y + 6
            ) {
                this.gameOver = true;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem("harness_minigame_highscore", this.highScore.toString());
                }
            }

            if (obs.x < -30) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                if (this.score % 100 === 0) {
                    this.speed += 0.3;
                }
            }
        }
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Ground Line
        this.ctx.strokeStyle = "#e4e4e7";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 138);
        this.ctx.lineTo(this.width, 138);
        this.ctx.stroke();

        // Draw Player (Clapperboard 🎬)
        this.ctx.font = "26px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("🎬", this.player.x + 14, this.player.y + 14);

        // Draw Obstacles
        this.obstacles.forEach(obs => {
            this.ctx.font = "22px sans-serif";
            this.ctx.fillText(obs.emoji, obs.x + 12, obs.y + 14);
        });

        // Draw Scores
        this.ctx.fillStyle = "#09090b";
        this.ctx.font = "bold 12px 'JetBrains Mono', monospace";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`SCORE: ${this.score}`, 16, 24);
        this.ctx.fillStyle = "#71717a";
        this.ctx.fillText(`HIGH: ${this.highScore}`, 110, 24);

        // Draw Game Over Overlay
        if (this.gameOver) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = "#09090b";
            this.ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText("ĐÃ CHẠM VẬT CẢN! NHẤN PHÍM CÁCH ĐỂ CHƠI LẠI", this.width / 2, this.height / 2 - 8);

            this.ctx.font = "11px 'JetBrains Mono', monospace";
            this.ctx.fillStyle = "#71717a";
            this.ctx.fillText(`Điểm số của bạn: ${this.score}`, this.width / 2, this.height / 2 + 16);
        }
    }

    loop() {
        if (!isRunnerRunning) return;
        this.update();
        this.draw();
        runnerAnimationId = requestAnimationFrame(() => this.loop());
    }
}

// ==========================================
// 2. GAME 2: MOVIE MEMORY MATCH (Lật Thẻ Bài)
// ==========================================
const MEMORY_EMOJIS = ["🎬", "🎥", "🍿", "🏆", "🎞️", "🎭"];
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;

function initMemoryGame(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Nhân đôi bộ emoji và xáo trộn
    const deck = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS].sort(() => Math.random() - 0.5);
    memoryCards = deck;
    flippedCards = [];
    matchedPairs = 0;

    container.innerHTML = `
        <div class="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            ${deck.map((emoji, idx) => `
                <button type="button" onclick="handleFlipCard(${idx})" id="mem-card-${idx}"
                    class="h-14 rounded-xl bg-zinc-100 border border-zinc-200 text-xl flex items-center justify-center font-bold transition-all duration-200 hover:bg-zinc-200 cursor-pointer shadow-2xs">
                    <span class="opacity-0 transition-opacity duration-150" id="mem-val-${idx}">${emoji}</span>
                </button>
            `).join("")}
        </div>
        <div class="text-[11px] font-mono text-zinc-500 text-center mt-2" id="mem-status-text">
            Tìm các cặp hình điện ảnh giống nhau! (${matchedPairs}/6)
        </div>
    `;
}

window.handleFlipCard = function(index) {
    if (flippedCards.length >= 2) return;
    const cardEl = document.getElementById(`mem-card-${index}`);
    const valEl = document.getElementById(`mem-val-${index}`);
    if (!cardEl || !valEl || cardEl.classList.contains("matched") || cardEl.classList.contains("flipped")) return;

    // Flip card
    cardEl.classList.add("flipped", "bg-white", "border-black");
    cardEl.classList.remove("bg-zinc-100");
    valEl.classList.remove("opacity-0");
    flippedCards.push({ index, emoji: memoryCards[index] });

    if (flippedCards.length === 2) {
        const [c1, c2] = flippedCards;
        if (c1.emoji === c2.emoji) {
            // Match!
            matchedPairs++;
            document.getElementById(`mem-card-${c1.index}`).classList.add("matched", "bg-emerald-50", "border-emerald-300");
            document.getElementById(`mem-card-${c2.index}`).classList.add("matched", "bg-emerald-50", "border-emerald-300");
            flippedCards = [];

            const status = document.getElementById("mem-status-text");
            if (status) {
                status.textContent = matchedPairs === 6 ? "🎉 Xuất sắc! Bạn đã tìm đủ 6 cặp thẻ!" : `Đã tìm thấy: ${matchedPairs}/6 cặp!`;
            }
        } else {
            // No match -> flip back
            setTimeout(() => {
                const el1 = document.getElementById(`mem-card-${c1.index}`);
                const el2 = document.getElementById(`mem-card-${c2.index}`);
                const v1 = document.getElementById(`mem-val-${c1.index}`);
                const v2 = document.getElementById(`mem-val-${c2.index}`);

                if (el1) {
                    el1.classList.remove("flipped", "bg-white", "border-black");
                    el1.classList.add("bg-zinc-100");
                    if (v1) v1.classList.add("opacity-0");
                }
                if (el2) {
                    el2.classList.remove("flipped", "bg-white", "border-black");
                    el2.classList.add("bg-zinc-100");
                    if (v2) v2.classList.add("opacity-0");
                }
                flippedCards = [];
            }, 700);
        }
    }
};

// ==========================================
// 3. KHỞI TẠO & ĐIỀU KHIỂN MINI GAME
// ==========================================
function startWaitingMiniGame() {
    const gameArea = document.getElementById("waiting-minigame-area");
    if (!gameArea) return;

    gameArea.classList.remove("hidden");

    // Chọn ngẫu nhiên giữa Runner Game hoặc Memory Game
    const isRunner = Math.random() > 0.4;

    if (isRunner) {
        document.getElementById("runner-game-container")?.classList.remove("hidden");
        document.getElementById("memory-game-container")?.classList.add("hidden");

        if (runnerGameInstance) {
            runnerGameInstance.destroy();
        }
        isRunnerRunning = true;
        runnerGameInstance = new ClapperboardRunner("minigame-canvas");
        runnerGameInstance.restart();
    } else {
        document.getElementById("runner-game-container")?.classList.add("hidden");
        document.getElementById("memory-game-container")?.classList.remove("hidden");
        initMemoryGame("memory-game-board");
    }
}

function stopWaitingMiniGame() {
    if (runnerGameInstance) {
        runnerGameInstance.destroy();
    }
    const gameArea = document.getElementById("waiting-minigame-area");
    if (gameArea) {
        gameArea.classList.add("hidden");
    }
}
