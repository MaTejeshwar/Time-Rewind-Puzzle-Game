/**
 * Temporal Echo - Core Game Logic
 */

// Levels Definition
const LEVELS = [
    {
        name: "The First Echo",
        desc: "Step on the plate to open the gate. Your past echo will repeat the action while you cross.",
        grid: [
            "W W W W W W W W W W",
            "W P . . . W . . E W",
            "W . S1 . . G1 . . W",
            "W . . . . W . . . W",
            "W W W W W W W W W W"
        ],
        maxClones: 1
    },
    {
        name: "Parallel Paths",
        desc: "Multiple gates block the exit. Create two distinct echoes to press both plates simultaneously.",
        grid: [
            "W W W W W W W W W W W",
            "W P . . W W W . . E W",
            "W . S1 . G1 G2 . . . W",
            "W . S2 . W W W . . . W",
            "W W W W W W W W W W W"
        ],
        maxClones: 2
    },
    {
        name: "Temporal Spikes",
        desc: "Spikes are lethal when active. Record a path to the plate to retract them, then cross safely.",
        grid: [
            "W W W W W W W W W W",
            "W P . . W . . . E W",
            "W . W . W . W W W W",
            "W . W . H1 . . . W",
            "W . S1 . W . W W . W",
            "W W W W W W W W W W"
        ],
        maxClones: 2
    },
    {
        name: "The Switchback",
        desc: "One plate opens the first gate, allowing you to reach the second plate. Wait for your echo.",
        grid: [
            "W W W W W W W W W W W",
            "W P . G1 . . . G2 . E W",
            "W W W W W . W W W W W",
            "W S2 . . . . . . . S1 W",
            "W W W W W W W W W W W"
        ],
        maxClones: 2
    },
    {
        name: "The Grand Loop",
        desc: "Link all three echoes in a sequence to disable spikes, raise gates, and open the exit.",
        grid: [
            "W W W W W W W W W W W W",
            "W P . . . W . . . G3 E W",
            "W . W W H1 W . W W W W W",
            "W . S1 . . W . . . S3 . W",
            "W W W W . W W G2 W W W W",
            "W . S2 . . . . . . . . W",
            "W W W W W W W W W W W W"
        ],
        maxClones: 3
    }
];

// Game State Class
class Game {
    constructor() {
        this.canvas = document.getElementById("game-canvas");
        this.ctx = this.canvas.getContext("2d");
        
        // Navigation states
        this.currentLevelIndex = 0;
        this.maxLevelReached = 0;
        this.activeScreen = 'start'; // 'start', 'select', 'game', 'end'
        
        // Game stats
        this.stepsCount = 0;
        this.rewindsCount = 0;
        this.totalStepsJourney = 0;
        this.totalRewindsJourney = 0;
        
        // Level data
        this.level = null; // Parsed level details
        this.player = {
            x: 0, y: 0,
            animX: 0, animY: 0
        };
        this.clones = []; // Array of Clones: { steps: [{x, y}], currentStepIndex }
        this.playerHistory = []; // Path of current run: [{x, y}]
        
        // Particle Engine
        this.particles = [];
        
        // Timing
        this.isMoving = false;
        this.portalAngle = 0;
        
        // Save state loaded
        this.loadGame();
    }

    init() {
        this.bindEvents();
        this.renderMenu();
        
        // Start animation frame loop
        const loop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    bindEvents() {
        // Start Journey Button
        document.getElementById("btn-start-journey").addEventListener("click", () => {
            window.audioSynth.resume();
            this.changeScreen('select');
        });

        // Select screen Back button
        document.getElementById("btn-select-back").addEventListener("click", () => {
            this.changeScreen('start');
        });

        // Game Action - Rewind
        document.getElementById("btn-action-rewind").addEventListener("click", () => {
            this.rewindTime();
        });

        // Game Action - Restart Loop
        document.getElementById("btn-action-restart").addEventListener("click", () => {
            this.restartLoop();
        });

        // Game Action - Reset Level
        document.getElementById("btn-action-reset-level").addEventListener("click", () => {
            this.resetLevel();
        });

        // Game Action - Select timelines
        document.getElementById("btn-action-select").addEventListener("click", () => {
            this.changeScreen('select');
        });

        // Win Overlay - Next Level
        document.getElementById("btn-next-level").addEventListener("click", () => {
            document.getElementById("overlay-level-win").classList.remove("active");
            if (this.currentLevelIndex < LEVELS.length - 1) {
                this.loadLevel(this.currentLevelIndex + 1);
            } else {
                this.changeScreen('end');
            }
        });

        // Win Overlay - Replay Level
        document.getElementById("btn-win-replay").addEventListener("click", () => {
            document.getElementById("overlay-level-win").classList.remove("active");
            this.loadLevel(this.currentLevelIndex);
        });

        // Win Overlay - Back to Select
        document.getElementById("btn-win-select").addEventListener("click", () => {
            document.getElementById("overlay-level-win").classList.remove("active");
            this.changeScreen('select');
        });

        // End Screen - Play Again
        document.getElementById("btn-replay-all").addEventListener("click", () => {
            this.totalStepsJourney = 0;
            this.totalRewindsJourney = 0;
            this.loadLevel(0);
        });

        // End Screen - Timelines
        document.getElementById("btn-end-select").addEventListener("click", () => {
            this.changeScreen('select');
        });

        // Sound Toggle Button
        const soundBtn = document.getElementById("btn-sound");
        soundBtn.addEventListener("click", () => {
            const isMuted = window.audioSynth.toggleMuted();
            const icon = document.getElementById("sound-icon");
            if (isMuted) {
                icon.innerHTML = `
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                `;
                soundBtn.style.opacity = 0.5;
            } else {
                icon.innerHTML = `
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                `;
                soundBtn.style.opacity = 1.0;
            }
        });

        // Keyboard Inputs
        window.addEventListener("keydown", (e) => {
            if (this.activeScreen !== 'game') return;

            // Prevent scroll for arrows/space
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
                e.preventDefault();
            }

            if (this.isMoving) return;

            let dx = 0;
            let dy = 0;
            let waitStep = false;

            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    dy = -1;
                    break;
                case 's':
                case 'arrowdown':
                    dy = 1;
                    break;
                case 'a':
                case 'arrowleft':
                    dx = -1;
                    break;
                case 'd':
                case 'arrowright':
                    dx = 1;
                    break;
                case ' ':
                case 'spacebar':
                    waitStep = true;
                    break;
                case 'r':
                    this.rewindTime();
                    return;
                case 'backspace':
                    this.restartLoop();
                    return;
                case 'delete':
                    this.resetLevel();
                    return;
                case 'escape':
                    this.changeScreen('select');
                    return;
                default:
                    return; // Ignore other keys
            }

            if (dx !== 0 || dy !== 0 || waitStep) {
                this.executeTurn(dx, dy, waitStep);
            }
        });
    }

    /**
     * Changes active UI screens.
     */
    changeScreen(screenId) {
        this.activeScreen = screenId;
        document.querySelectorAll('.screen').forEach(scr => {
            scr.classList.remove('active');
        });
        document.getElementById(`screen-${screenId}`).classList.add('active');

        if (screenId === 'select') {
            this.renderMenu();
        } else if (screenId === 'game') {
            this.loadLevel(this.currentLevelIndex);
        } else if (screenId === 'end') {
            document.getElementById("end-stats-text").innerText = `${this.totalStepsJourney} steps • ${this.totalRewindsJourney} loops`;
        }
    }

    renderMenu() {
        const grid = document.getElementById("level-selection-grid");
        grid.innerHTML = "";

        LEVELS.forEach((lvl, idx) => {
            const card = document.createElement("div");
            card.className = "level-card";
            
            const isLocked = idx > this.maxLevelReached;
            if (isLocked) {
                card.classList.add("locked");
            } else {
                if (idx < this.maxLevelReached) {
                    card.classList.add("completed");
                }
                card.addEventListener("click", () => {
                    this.currentLevelIndex = idx;
                    this.changeScreen('game');
                });
            }

            const numStr = (idx + 1).toString().padStart(2, '0');
            card.innerHTML = `
                <div class="num">${numStr}</div>
                <div class="name">${lvl.name}</div>
                <div class="stars">
                    <div class="star"></div>
                    <div class="star"></div>
                    <div class="star"></div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    /**
     * Parse level from level configuration grid string array.
     */
    loadLevel(index) {
        this.currentLevelIndex = index;
        const levelData = LEVELS[index];
        
        // Parse level grid
        const parsed = this.parseLevelMap(levelData.grid);
        this.level = parsed;
        this.level.maxClones = levelData.maxClones;

        // Reset state values
        this.stepsCount = 0;
        this.rewindsCount = 0;
        this.clones = [];
        this.particles = [];
        this.isMoving = false;
        
        // Reset player start
        this.player.x = parsed.playerStart.x;
        this.player.y = parsed.playerStart.y;
        this.player.animX = this.player.x * this.getCellSize() + this.getOffsets().x + this.getCellSize() / 2;
        this.player.animY = this.player.y * this.getCellSize() + this.getOffsets().y + this.getCellSize() / 2;

        this.playerHistory = [{ x: this.player.x, y: this.player.y }];

        this.updateHUD();
        this.updateBoardState();
    }

    parseLevelMap(gridArray) {
        const grid = [];
        const switches = {};
        const gates = {};
        const spikes = {};
        let exit = null;
        let playerStart = null;

        for (let y = 0; y < gridArray.length; y++) {
            const rowStr = gridArray[y].trim().split(/\s+/);
            const row = [];
            for (let x = 0; x < rowStr.length; x++) {
                const token = rowStr[x];
                let cell = {
                    type: 'floor',
                    baseType: 'floor',
                    id: null
                };

                if (token === 'W') {
                    cell.type = 'wall';
                    cell.baseType = 'wall';
                } else if (token === 'E') {
                    cell.type = 'exit';
                    cell.baseType = 'exit';
                    exit = { x, y };
                } else if (token === 'P') {
                    cell.type = 'floor';
                    cell.baseType = 'floor';
                    playerStart = { x, y };
                } else if (token.startsWith('S')) {
                    const id = parseInt(token.substring(1));
                    cell.type = 'switch';
                    cell.baseType = 'switch';
                    cell.id = id;
                    switches[id] = { x, y, active: false };
                } else if (token.startsWith('G')) {
                    const id = parseInt(token.substring(1));
                    cell.type = 'gate';
                    cell.baseType = 'gate';
                    cell.id = id;
                    gates[id] = { x, y, open: false };
                } else if (token.startsWith('H')) {
                    const id = parseInt(token.substring(1));
                    cell.type = 'spike';
                    cell.baseType = 'spike';
                    cell.id = id;
                    spikes[id] = { x, y, active: true };
                }
                row.push(cell);
            }
            grid.push(row);
        }

        const height = grid.length;
        const width = grid[0].length;

        return { grid, switches, gates, spikes, exit, playerStart, width, height };
    }

    getCellSize() {
        const margin = 10;
        const sizeX = (this.canvas.width - margin * 2) / this.level.width;
        const sizeY = (this.canvas.height - margin * 2) / this.level.height;
        return Math.min(sizeX, sizeY);
    }

    getOffsets() {
        const size = this.getCellSize();
        const offsetX = (this.canvas.width - this.level.width * size) / 2;
        const offsetY = (this.canvas.height - this.level.height * size) / 2;
        return { x: offsetX, y: offsetY };
    }

    updateHUD() {
        document.getElementById("hud-level-number").innerText = `Timeline ${(this.currentLevelIndex + 1).toString().padStart(2, '0')}`;
        document.getElementById("hud-level-name").innerText = LEVELS[this.currentLevelIndex].name;
        document.getElementById("hud-level-desc").innerText = LEVELS[this.currentLevelIndex].desc;
        document.getElementById("hud-steps").innerText = this.stepsCount;
        document.getElementById("hud-clones").innerHTML = `${this.clones.length}<span class="sub">/ ${this.level.maxClones}</span>`;
    }

    /**
     * Executes a single game tick when the player moves or waits.
     */
    executeTurn(dx, dy, waitStep) {
        const targetX = this.player.x + dx;
        const targetY = this.player.y + dy;

        // Check if movement is valid
        let canMove = true;
        if (!waitStep) {
            canMove = this.isValidMove(targetX, targetY);
        }

        if (canMove) {
            // Update Player Position
            if (!waitStep) {
                this.player.x = targetX;
                this.player.y = targetY;
                window.audioSynth.playMove(1.0);
                this.spawnMovementParticles(targetX - dx, targetY - dy, dx, dy, 'player');
            } else {
                // Wait step: player stands still, subtle pitch shift down
                window.audioSynth.playMove(0.7);
            }

            this.stepsCount++;
            this.totalStepsJourney++;
            this.playerHistory.push({ x: this.player.x, y: this.player.y });

            // Update Clones Position
            this.clones.forEach((clone, idx) => {
                const nextStepIndex = this.stepsCount;
                let prevPos = { x: clone.x, y: clone.y };
                
                // Get position at this step, or stay at last position if path finished
                const stepPos = clone.steps[nextStepIndex] || clone.steps[clone.steps.length - 1];
                clone.x = stepPos.x;
                clone.y = stepPos.y;

                if (prevPos.x !== clone.x || prevPos.y !== clone.y) {
                    this.spawnMovementParticles(prevPos.x, prevPos.y, clone.x - prevPos.x, clone.y - prevPos.y, 'clone');
                }
            });

            // Update Switch, Gate and Spikes states
            this.updateBoardState();
            this.updateHUD();

            // Check spikes mortality / clone collisions
            this.checkBoardCollisions();

            // Check if player reached the exit
            if (this.player.x === this.level.exit.x && this.player.y === this.level.exit.y) {
                this.levelComplete();
            }
        }
    }

    isValidMove(x, y) {
        // Out of bounds checks
        if (x < 0 || x >= this.level.width || y < 0 || y >= this.level.height) return false;

        const cell = this.level.grid[y][x];

        // Wall check
        if (cell.type === 'wall') return false;

        // Closed Gate check
        if (cell.type === 'gate') {
            const gate = this.level.gates[cell.id];
            if (!gate.open) return false;
        }

        return true;
    }

    /**
     * Evaluates pressure plate triggers and opens/closes gates and retracts spikes dynamically.
     */
    updateBoardState() {
        const switchStatePrev = {};
        for (const [id, sw] of Object.entries(this.level.switches)) {
            switchStatePrev[id] = sw.active;
            sw.active = false;
        }

        // Helper to check if entity occupies switch coordinates
        const isOnSwitch = (entity, sw) => entity.x === sw.x && entity.y === sw.y;

        // Check switches status
        for (const [id, sw] of Object.entries(this.level.switches)) {
            // Check player
            if (isOnSwitch(this.player, sw)) {
                sw.active = true;
            }
            // Check active clones
            this.clones.forEach(clone => {
                if (isOnSwitch(clone, sw)) {
                    sw.active = true;
                }
            });

            // Trigger click audio on plate toggles
            if (sw.active !== switchStatePrev[id]) {
                window.audioSynth.playSwitchPress(sw.active);
                this.spawnSwitchRipple(sw.x, sw.y, sw.active);
            }
        }

        // Apply switch states to gates and spikes
        let gateOrSpikeToggled = false;
        
        // 1. Gates
        for (const [id, gate] of Object.entries(this.level.gates)) {
            const prevOpen = gate.open;
            // A gate opens if its corresponding switch ID is active
            const correspondingSwitch = this.level.switches[id];
            if (correspondingSwitch) {
                gate.open = correspondingSwitch.active;
            }

            if (gate.open !== prevOpen) {
                gateOrSpikeToggled = true;
                this.spawnGateDust(gate.x, gate.y);
            }
        }

        // 2. Spikes
        for (const [id, spike] of Object.entries(this.level.spikes)) {
            const prevActive = spike.active;
            // Spikes retract (inactive) if corresponding switch ID is active
            const correspondingSwitch = this.level.switches[id];
            if (correspondingSwitch) {
                spike.active = !correspondingSwitch.active;
            }

            if (spike.active !== prevActive) {
                gateOrSpikeToggled = true;
            }
        }

        if (gateOrSpikeToggled) {
            window.audioSynth.playDoorOpen();
        }
    }

    /**
     * Checks if clones or player have triggered lethal hazards or invalid coordinates.
     */
    checkBoardCollisions() {
        // 1. Spikes hazard for player
        for (const spike of Object.values(this.level.spikes)) {
            if (spike.active && this.player.x === spike.x && this.player.y === spike.y) {
                this.handlePlayerDeath();
                return;
            }
        }

        // 2. Clone checks (Did they hit active spikes, walls, or closed gates due to bad timing?)
        let cloneDephased = false;
        this.clones = this.clones.filter(clone => {
            const cell = this.level.grid[clone.y][clone.x];
            
            // Hitting wall or closed gate is a paradox
            let isBlocked = cell.type === 'wall';
            if (cell.type === 'gate') {
                const gate = this.level.gates[cell.id];
                if (!gate.open) isBlocked = true;
            }

            // Hitting active spikes is lethal
            let hitSpike = false;
            for (const spike of Object.values(this.level.spikes)) {
                if (spike.active && clone.x === spike.x && clone.y === spike.y) {
                    hitSpike = true;
                }
            }

            if (isBlocked || hitSpike) {
                this.spawnDephaseParticles(clone.x, clone.y);
                cloneDephased = true;
                return false; // Remove this clone
            }
            return true;
        });

        if (cloneDephased) {
            window.audioSynth.playFail();
            this.updateHUD();
            this.updateBoardState();
        }
    }

    handlePlayerDeath() {
        window.audioSynth.playFail();
        this.spawnDephaseParticles(this.player.x, this.player.y);
        
        // Brief screen shake / flash by restarting loop
        this.restartLoop();
    }

    /**
     * Resets the player and all clones back to the beginning of the current loop,
     * keeping all previously saved clones intact.
     */
    restartLoop() {
        if (!this.level) return;
        
        // Reset player back to starting position
        this.player.x = this.level.playerStart.x;
        this.player.y = this.level.playerStart.y;
        this.playerHistory = [{ x: this.player.x, y: this.player.y }];
        this.stepsCount = 0;

        // Reset all clones to their start coordinate for step 0
        this.clones.forEach(clone => {
            clone.x = clone.steps[0].x;
            clone.y = clone.steps[0].y;
            // Also reset visual positions if initialized
            if (clone.animX !== undefined && clone.animY !== undefined) {
                const cellSize = this.getCellSize();
                const offsets = this.getOffsets();
                clone.animX = clone.x * cellSize + offsets.x + cellSize / 2;
                clone.animY = clone.y * cellSize + offsets.y + cellSize / 2;
            }
        });

        // Snap player visual position as well
        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();
        this.player.animX = this.player.x * cellSize + offsets.x + cellSize / 2;
        this.player.animY = this.player.y * cellSize + offsets.y + cellSize / 2;

        this.particles = [];
        this.isMoving = false;

        this.updateHUD();
        this.updateBoardState();
    }

    /**
     * Resets current level loop from scratch.
     */
    resetLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

    /**
     * Creates a new clone from the player's path and resets player to start.
     */
    rewindTime() {
        if (this.clones.length >= this.level.maxClones) {
            // Cannot exceed level clone limit
            window.audioSynth.playFail();
            return;
        }

        window.audioSynth.playRewind();
        this.rewindsCount++;
        this.totalRewindsJourney++;

        // Add player path as a new clone
        // Deep copy the recorded history path
        const newClonePath = [...this.playerHistory];
        
        // Spawn rewind visual effects backwards
        this.spawnRewindVisuals();

        // Add to active clones list
        this.clones.push({
            steps: newClonePath,
            x: this.level.playerStart.x,
            y: this.level.playerStart.y
        });

        // Reset player back to starting position
        this.player.x = this.level.playerStart.x;
        this.player.y = this.level.playerStart.y;
        this.playerHistory = [{ x: this.player.x, y: this.player.y }];
        this.stepsCount = 0;

        // Reset all clones to their start coordinate for step 0
        this.clones.forEach(clone => {
            clone.x = clone.steps[0].x;
            clone.y = clone.steps[0].y;
        });

        this.updateHUD();
        this.updateBoardState();
    }

    levelComplete() {
        window.audioSynth.playSuccess();
        this.spawnSuccessBurst(this.player.x, this.player.y);
        
        // Update max level unlock
        const nextLevelIndex = this.currentLevelIndex + 1;
        if (nextLevelIndex > this.maxLevelReached && nextLevelIndex < LEVELS.length) {
            this.maxLevelReached = nextLevelIndex;
            this.saveGame();
        } else if (nextLevelIndex === LEVELS.length) {
            // Game fully completed
            this.maxLevelReached = LEVELS.length;
            this.saveGame();
        }

        // Show completed HUD / Overlay modal
        document.getElementById("win-score-text").innerText = `Completed in ${this.stepsCount} steps • ${this.rewindsCount} loop(s)`;
        
        // Hide standard HUD next level actions if last level
        const btnNext = document.getElementById("btn-next-level");
        if (this.currentLevelIndex === LEVELS.length - 1) {
            btnNext.innerText = "Complete Journey";
        } else {
            btnNext.innerText = "Next Timeline";
        }

        setTimeout(() => {
            document.getElementById("overlay-level-win").classList.add("active");
        }, 300);
    }

    // Save and Load System
    saveGame() {
        localStorage.setItem("temporal_echo_max_level", this.maxLevelReached.toString());
        localStorage.setItem("temporal_echo_total_steps", this.totalStepsJourney.toString());
        localStorage.setItem("temporal_echo_total_rewinds", this.totalRewindsJourney.toString());
    }

    loadGame() {
        const savedLvl = localStorage.getItem("temporal_echo_max_level");
        const savedSteps = localStorage.getItem("temporal_echo_total_steps");
        const savedRewinds = localStorage.getItem("temporal_echo_total_rewinds");

        if (savedLvl !== null) this.maxLevelReached = parseInt(savedLvl);
        if (savedSteps !== null) this.totalStepsJourney = parseInt(savedSteps);
        if (savedRewinds !== null) this.totalRewindsJourney = parseInt(savedRewinds);
    }

    // Canvas Rendering Loop & Animation Updates
    update() {
        if (this.activeScreen !== 'game' || !this.level) return;

        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();

        // 1. Smoothly interpolate player visual position
        const targetPlayerX = this.player.x * cellSize + offsets.x + cellSize / 2;
        const targetPlayerY = this.player.y * cellSize + offsets.y + cellSize / 2;
        
        let dx = targetPlayerX - this.player.animX;
        let dy = targetPlayerY - this.player.animY;
        
        let playerStillAnimating = false;
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
            this.player.animX += dx * 0.22;
            this.player.animY += dy * 0.22;
            playerStillAnimating = true;
        } else {
            this.player.animX = targetPlayerX;
            this.player.animY = targetPlayerY;
        }

        // 2. Interpolate clones visual positions
        let clonesStillAnimating = false;
        this.clones.forEach(clone => {
            // Make sure visual coordinates are initialized
            if (clone.animX === undefined || clone.animY === undefined) {
                clone.animX = clone.x * cellSize + offsets.x + cellSize / 2;
                clone.animY = clone.y * cellSize + offsets.y + cellSize / 2;
            }

            const targetCloneX = clone.x * cellSize + offsets.x + cellSize / 2;
            const targetCloneY = clone.y * cellSize + offsets.y + cellSize / 2;
            
            let cdx = targetCloneX - clone.animX;
            let cdy = targetCloneY - clone.animY;

            if (Math.abs(cdx) > 0.05 || Math.abs(cdy) > 0.05) {
                clone.animX += cdx * 0.22;
                clone.animY += cdy * 0.22;
                clonesStillAnimating = true;
            } else {
                clone.animX = targetCloneX;
                clone.animY = targetCloneY;
            }
        });

        this.isMoving = playerStillAnimating || clonesStillAnimating;

        // 3. Update Portal Rotation angle
        this.portalAngle += 0.02;

        // 4. Update Particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Friction
            p.vx *= p.friction || 0.96;
            p.vy *= p.friction || 0.96;

            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(idx, 1);
            }
        });

        // 5. Ambient portal particle emissions
        if (Math.random() < 0.3) {
            const exitX = this.level.exit.x * cellSize + offsets.x + cellSize / 2;
            const exitY = this.level.exit.y * cellSize + offsets.y + cellSize / 2;
            const angle = Math.random() * Math.PI * 2;
            const dist = cellSize * 0.45;
            this.particles.push({
                x: exitX + Math.cos(angle) * dist,
                y: exitY + Math.sin(angle) * dist,
                vx: -Math.cos(angle) * 0.3,
                vy: -Math.sin(angle) * 0.3,
                color: 'rgba(217, 160, 91, ' + (Math.random() * 0.4 + 0.3) + ')',
                size: Math.random() * 2.5 + 1,
                alpha: 1.0,
                decay: 0.02,
                friction: 1.0
            });
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.activeScreen !== 'game' || !this.level) return;

        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();

        // 1. Draw Grid floor cells
        this.ctx.fillStyle = "#e9e7df"; // var(--bg-grid)
        this.ctx.fillRect(offsets.x, offsets.y, this.level.width * cellSize, this.level.height * cellSize);

        // Draw light grid lines
        this.ctx.strokeStyle = "#e0ddd2";
        this.ctx.lineWidth = 1;
        for (let col = 0; col <= this.level.width; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(offsets.x + col * cellSize, offsets.y);
            this.ctx.lineTo(offsets.x + col * cellSize, offsets.y + this.level.height * cellSize);
            this.ctx.stroke();
        }
        for (let row = 0; row <= this.level.height; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(offsets.x, offsets.y + row * cellSize);
            this.ctx.lineTo(offsets.x + this.level.width * cellSize, offsets.y + row * cellSize);
            this.ctx.stroke();
        }

        // 2. Draw plates, walls, gates, and spikes
        for (let y = 0; y < this.level.height; y++) {
            for (let x = 0; x < this.level.width; x++) {
                const cell = this.level.grid[y][x];
                const cx = x * cellSize + offsets.x;
                const cy = y * cellSize + offsets.y;

                if (cell.type === 'wall') {
                    // Draw warm volcanic wall blocks
                    this.ctx.fillStyle = "#4f4c42"; // var(--bg-wall)
                    const padding = 2;
                    this.drawRoundedRect(
                        cx + padding, 
                        cy + padding, 
                        cellSize - padding * 2, 
                        cellSize - padding * 2, 
                        8
                    );
                    // Add inset border highlights
                    this.ctx.strokeStyle = "#5f5c52";
                    this.ctx.lineWidth = 1.5;
                    this.ctx.stroke();
                }

                else if (cell.type === 'switch') {
                    const sw = this.level.switches[cell.id];
                    const centerX = cx + cellSize / 2;
                    const centerY = cy + cellSize / 2;

                    // Concave outer rim
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, cellSize * 0.35, 0, Math.PI * 2);
                    this.ctx.fillStyle = "#dfdbd0";
                    this.ctx.fill();
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeStyle = sw.active ? "#d9a05b" : "#c5c1b6";
                    this.ctx.stroke();

                    // Inner plate
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, cellSize * 0.22, 0, Math.PI * 2);
                    this.ctx.fillStyle = sw.active ? "#d9a05b" : "#bca693";
                    this.ctx.fill();

                    // Concentric active ring glow
                    if (sw.active) {
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, cellSize * 0.28, 0, Math.PI * 2);
                        this.ctx.strokeStyle = "rgba(217, 160, 91, 0.4)";
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                    }
                }

                else if (cell.type === 'gate') {
                    const gate = this.level.gates[cell.id];
                    const padding = 6;
                    
                    if (gate.open) {
                        // Open: Draw faint, dotted copper guides
                        this.ctx.strokeStyle = "rgba(142, 91, 63, 0.15)";
                        this.ctx.lineWidth = 2;
                        this.ctx.setLineDash([4, 4]);
                        this.ctx.beginPath();
                        this.ctx.rect(cx + padding, cy + padding, cellSize - padding * 2, cellSize - padding * 2);
                        this.ctx.stroke();
                        this.ctx.setLineDash([]);
                    } else {
                        // Closed: Solid copper barrier block
                        this.ctx.fillStyle = "#8e5b3f"; // copper
                        this.drawRoundedRect(cx + padding, cy + padding, cellSize - padding * 2, cellSize - padding * 2, 4);
                        
                        // Metallic stripes
                        this.ctx.strokeStyle = "#a27053";
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(cx + padding + 4, cy + cellSize / 2);
                        this.ctx.lineTo(cx + cellSize - padding - 4, cy + cellSize / 2);
                        this.ctx.moveTo(cx + padding + 4, cy + cellSize / 2 - 6);
                        this.ctx.lineTo(cx + cellSize - padding - 4, cy + cellSize / 2 - 6);
                        this.ctx.moveTo(cx + padding + 4, cy + cellSize / 2 + 6);
                        this.ctx.lineTo(cx + cellSize - padding - 4, cy + cellSize / 2 + 6);
                        this.ctx.stroke();
                    }
                }

                else if (cell.type === 'spike') {
                    const spike = this.level.spikes[cell.id];
                    const centerX = cx + cellSize / 2;
                    const centerY = cy + cellSize / 2;

                    // Slate backing plate
                    this.ctx.fillStyle = "#d2cfc4";
                    this.ctx.fillRect(cx + 4, cy + 4, cellSize - 8, cellSize - 8);

                    if (spike.active) {
                        // Draw sharp spikes
                        this.ctx.fillStyle = "#615e55"; // Spike dark slate
                        this.ctx.strokeStyle = "#4c4a43";
                        this.ctx.lineWidth = 1;
                        
                        // Draw 4 small triangular spikes
                        const drawTriangle = (px, py, rotation) => {
                            this.ctx.save();
                            this.ctx.translate(px, py);
                            this.ctx.rotate(rotation);
                            this.ctx.beginPath();
                            this.ctx.moveTo(0, -cellSize * 0.2);
                            this.ctx.lineTo(cellSize * 0.08, cellSize * 0.1);
                            this.ctx.lineTo(-cellSize * 0.08, cellSize * 0.1);
                            this.ctx.closePath();
                            this.ctx.fill();
                            this.ctx.stroke();
                            this.ctx.restore();
                        };

                        const dist = cellSize * 0.18;
                        drawTriangle(centerX - dist, centerY - dist, -Math.PI/4);
                        drawTriangle(centerX + dist, centerY - dist, Math.PI/4);
                        drawTriangle(centerX - dist, centerY + dist, -3*Math.PI/4);
                        drawTriangle(centerX + dist, centerY + dist, 3*Math.PI/4);
                    } else {
                        // Retracted: just small metal hole indicators
                        this.ctx.fillStyle = "#a8a59b";
                        const dist = cellSize * 0.18;
                        const drawHole = (px, py) => {
                            this.ctx.beginPath();
                            this.ctx.arc(px, py, 3, 0, Math.PI*2);
                            this.ctx.fill();
                        };
                        drawHole(centerX - dist, centerY - dist);
                        drawHole(centerX + dist, centerY - dist);
                        drawHole(centerX - dist, centerY + dist);
                        drawHole(centerX + dist, centerY + dist);
                    }
                }
            }
        }

        // 3. Draw Exit Portal (Swirling Sun Gate)
        const exitX = this.level.exit.x * cellSize + offsets.x + cellSize / 2;
        const exitY = this.level.exit.y * cellSize + offsets.y + cellSize / 2;
        
        this.ctx.save();
        this.ctx.translate(exitX, exitY);
        this.ctx.rotate(this.portalAngle);

        // Core sun fill
        const gradient = this.ctx.createRadialGradient(0, 0, 5, 0, 0, cellSize * 0.4);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.3, "#f4cf9b");
        gradient.addColorStop(0.8, "rgba(217, 160, 91, 0.7)");
        gradient.addColorStop(1, "rgba(217, 160, 91, 0)");
        this.ctx.beginPath();
        this.ctx.arc(0, 0, cellSize * 0.45, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Double rotating rings
        this.ctx.strokeStyle = "#d9a05b";
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([8, 12, 16, 8]);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, cellSize * 0.32, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.rotate(-this.portalAngle * 1.8);
        this.ctx.strokeStyle = "#eabf88";
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([4, 6, 8, 4]);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, cellSize * 0.24, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();

        // 4. Draw Particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            
            if (p.isGlitch) {
                // Square glitch particles
                this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            } else {
                // Round puff particles
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });

        // 5. Draw Ghost Clones
        this.clones.forEach((clone, idx) => {
            const rad = cellSize * 0.35;
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(clone.animX, clone.animY, rad, 0, Math.PI * 2);
            // Rich translucent terracotta
            this.ctx.fillStyle = "rgba(196, 85, 62, 0.4)";
            this.ctx.fill();
            this.ctx.strokeStyle = "#c4553e";
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            // Inner echo ring
            this.ctx.beginPath();
            this.ctx.arc(clone.animX, clone.animY, rad * 0.55, 0, Math.PI * 2);
            this.ctx.strokeStyle = "rgba(196, 85, 62, 0.6)";
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            this.ctx.restore();
        });

        // 6. Draw Player (Active Self)
        const playerRad = cellSize * 0.35;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.player.animX, this.player.animY, playerRad, 0, Math.PI * 2);
        // Slate indigo
        this.ctx.fillStyle = "#2d3e50";
        this.ctx.fill();
        
        // Outermost ring
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();

        // Inner glowing core
        this.ctx.beginPath();
        this.ctx.arc(this.player.animX, this.player.animY, playerRad * 0.45, 0, Math.PI * 2);
        this.ctx.fillStyle = "#4a5d73";
        this.ctx.fill();

        // Tiny center dot
        this.ctx.beginPath();
        this.ctx.arc(this.player.animX, this.player.animY, 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fill();
        this.ctx.restore();
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // Particle Generation Helpers
    spawnMovementParticles(gridX, gridY, dx, dy, type) {
        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();
        const startX = gridX * cellSize + offsets.x + cellSize/2;
        const startY = gridY * cellSize + offsets.y + cellSize/2;
        
        // Particles shoot opposite to movement direction
        const baseAngle = Math.atan2(-dy, -dx);
        const count = 4 + Math.floor(Math.random() * 3);
        const color = type === 'player' ? 'rgba(45, 62, 80, 0.25)' : 'rgba(196, 85, 62, 0.25)';

        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (Math.random() * 0.8 - 0.4);
            const speed = Math.random() * 0.8 + 0.3;
            this.particles.push({
                x: startX + dx * cellSize * 0.25,
                y: startY + dy * cellSize * 0.25,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 3 + 2,
                alpha: 0.8,
                decay: 0.04
            });
        }
    }

    spawnSwitchRipple(gridX, gridY, isActive) {
        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();
        const cx = gridX * cellSize + offsets.x + cellSize/2;
        const cy = gridY * cellSize + offsets.y + cellSize/2;
        const count = 10;
        const color = isActive ? 'rgba(217, 160, 91, 0.5)' : 'rgba(197, 193, 182, 0.5)';

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = isActive ? 0.9 : 0.4;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 2 + 2,
                alpha: 1.0,
                decay: 0.03
            });
        }
    }

    spawnGateDust(gridX, gridY) {
        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();
        const cx = gridX * cellSize + offsets.x + cellSize/2;
        const cy = gridY * cellSize + offsets.y + cellSize/2;
        const count = 6;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.4 + 0.1;
            this.particles.push({
                x: cx + (Math.random() * 20 - 10),
                y: cy + (Math.random() * 20 - 10),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: 'rgba(142, 91, 63, 0.25)',
                size: Math.random() * 4 + 2,
                alpha: 0.7,
                decay: 0.03
            });
        }
    }

    spawnDephaseParticles(gridX, gridY) {
        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();
        const cx = gridX * cellSize + offsets.x + cellSize/2;
        const cy = gridY * cellSize + offsets.y + cellSize/2;
        const count = 22;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2.2 + 0.8;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: 'rgba(196, 85, 62, ' + (Math.random() * 0.5 + 0.4) + ')',
                size: Math.random() * 5 + 3,
                alpha: 1.0,
                decay: 0.03,
                friction: 0.94,
                isGlitch: true // Square particle
            });
        }
    }

    spawnSuccessBurst(gridX, gridY) {
        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();
        const cx = gridX * cellSize + offsets.x + cellSize/2;
        const cy = gridY * cellSize + offsets.y + cellSize/2;
        const count = 35;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.5 + 1.2;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: 'rgba(217, 160, 91, ' + (Math.random() * 0.6 + 0.4) + ')',
                size: Math.random() * 4 + 2,
                alpha: 1.0,
                decay: 0.02,
                friction: 0.95
            });
        }
    }

    spawnRewindVisuals() {
        const cellSize = this.getCellSize();
        const offsets = this.getOffsets();

        // Spawn particles along the path we are leaving behind
        this.playerHistory.forEach((pt, index) => {
            if (index % 2 === 0) { // Don't cluster too densely
                const cx = pt.x * cellSize + offsets.x + cellSize/2;
                const cy = pt.y * cellSize + offsets.y + cellSize/2;
                
                // Spawn a few imploding portal sparks
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 15 + 5;
                    this.particles.push({
                        x: cx + Math.cos(angle) * dist,
                        y: cy + Math.sin(angle) * dist,
                        vx: -Math.cos(angle) * 1.5,
                        vy: -Math.sin(angle) * 1.5,
                        color: 'rgba(196, 85, 62, 0.6)',
                        size: 2,
                        alpha: 0.9,
                        decay: 0.05,
                        friction: 1.0
                    });
                }
            }
        });
    }
}

// Initialise Game on load
window.addEventListener("DOMContentLoaded", () => {
    const game = new Game();
    game.init();
    window.gameEngine = game; // Make globally accessible
});
