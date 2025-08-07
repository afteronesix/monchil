// src/components/GameCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import bgImage from '../assets/bg.png';
import heroSprite from '../assets/led.png';

// --- Types and Interfaces ---
interface IFloor {
    x: number;
    y: number;
    seq: number;
    draw(context: CanvasRenderingContext2D, time: number): void;
    getHeight(): number;
    landing(hero: Hero, time: number, gameRefs: GameRefs): void;
    standing(hero: Hero, time: number): void;
    leaving(hero: Hero, time: number): void;
}

type GameRefs = {
    floorVelocity: number;
};

// --- ### CONSTANTS (ALL SCALED UP) ### ---
const STAGE_WIDTH = 480;
const LOGICAL_GAME_HEIGHT = 640;
const MARGIN_TOP = 40;
const STAGE_HEIGHT = LOGICAL_GAME_HEIGHT + MARGIN_TOP;
const FLOOR_WIDTH = 133;
const FLOOR_HEIGHT = 16;
const FLOOR_DISTANCE = 80;
const SPRING_HEIGHT = FLOOR_HEIGHT - 5;
const HERO_WIDTH = 35;
const ARROW_HEIGHT = 20;
const ARROW_WIDTH = 7;

// Physics
const FLOOR_VELOCITY_BASE = -0.133;
const GRAVITY_ACC = 0.002;
const SPRINGING_VELOCITY = -0.667;
const ROLLING_VELOCITY = 0.133;
const CONTROL_VELOCITY = 0.267;
const SPRING_TIME = 100;
const FAKE_FLOOR_TIME = 300;
const FAKE_FLOOR_TIME2 = 600;
const MAX_ACTION_INTERVAL = 20;


// --- Utility Functions ---
function roundRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w * 0.5;
    if (h < 2 * r) r = h * 0.5;
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
}

// --- Game Logic Classes ---
class Hero {
    x: number;
    y: number;
    width: number;
    height: number;
    sprite: HTMLImageElement;
    direction: -1 | 0 | 1;
    onFloor: IFloor | null;
    vx: number;
    vy: number;
    life: number;
    hurtTime: number;
    blinkTime: number;
    blink: boolean;
    frameIndex: number;
    frameTime: number;

    pos = {
        standing: { middle: [2], right: [62, 32, 62, 92] },
        falling: { middle: [122, 152], right: [182, 212] }
    };

    constructor(x: number, y: number, sprite: HTMLImageElement) {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.width = HERO_WIDTH;
        this.height = HERO_WIDTH;
        this.direction = 0;
        this.onFloor = null;
        this.vx = 0;
        this.vy = 0;
        this.life = 10;
        this.hurtTime = 0;
        this.blinkTime = 0;
        this.blink = false;
        this.frameIndex = 0;
        this.frameTime = 0;
    }

    turnLeft = () => { this.direction = -1; };
    turnRight = () => { this.direction = 1; };
    stay = () => { this.direction = 0; };

    draw(context: CanvasRenderingContext2D, time: number) {
        context.save();
        if (this.direction < 0) {
            context.scale(-1, 1);
            context.translate(-this.x - this.width, this.y);
        } else {
            context.translate(this.x, this.y);
        }

        if (this.life < 10 && this.hurtTime > 0 && time - this.hurtTime < 1000) {
            if (this.blinkTime < this.hurtTime) {
                this.blink = true; this.blinkTime = time;
            } else if (time - this.blinkTime >= 100) {
                this.blink = !this.blink; this.blinkTime = time;
            }
        } else if (this.blink) {
            this.blink = false;
        }

        const state = this.onFloor ? this.pos.standing : this.pos.falling;
        const frames = this.direction === 0 ? state.middle : state.right;
        if (time - this.frameTime >= 60) {
            this.frameTime = time; this.frameIndex++;
        }
        this.frameIndex %= frames.length;
        context.drawImage(this.sprite,
            frames[this.frameIndex], this.blink ? 32 : 2, 26, 26,
            0, -this.height, this.width, this.height);
        context.restore();
    }

    regain() { if (this.life < 10) this.life++; }
    hurt(num: number, time: number) {
        this.hurtTime = time;
        this.life = Math.max(0, this.life - num);
    }
}

class Floor implements IFloor {
    x: number;
    y: number;
    seq: number;

    constructor(x: number, y: number, seq: number) {
        this.x = x;
        this.y = y;
        this.seq = seq;
    }

    draw(context: CanvasRenderingContext2D, _time: number) {
        context.save();
        context.translate(this.x, this.y);

        const brickRowCount = 2;
        const brickColumnCount = 5;
        const mortarColor = '#8D8D8D';
        const brickColor = '#B22222';
        const mortarThickness = 2;

        const availableWidth = FLOOR_WIDTH - (brickColumnCount + 1) * mortarThickness;
        const brickWidth = availableWidth / brickColumnCount;
        const availableHeight = FLOOR_HEIGHT - (brickRowCount + 1) * mortarThickness;
        const brickHeight = availableHeight / brickRowCount;

        context.fillStyle = mortarColor;
        context.fillRect(0, -FLOOR_HEIGHT, FLOOR_WIDTH, FLOOR_HEIGHT);

        context.fillStyle = brickColor;
        for (let i = 0; i < brickRowCount; i++) {
            const y = -FLOOR_HEIGHT + mortarThickness + i * (brickHeight + mortarThickness);

            if (i % 2 === 0) {
                for (let j = 0; j < brickColumnCount; j++) {
                    const x = mortarThickness + j * (brickWidth + mortarThickness);
                    context.fillRect(x, y, brickWidth, brickHeight);
                }
            } else {
                context.fillRect(mortarThickness, y, brickWidth / 2, brickHeight);
                for (let j = 0; j < brickColumnCount - 1; j++) {
                    const x = mortarThickness + brickWidth / 2 + mortarThickness + j * (brickWidth + mortarThickness);
                    context.fillRect(x, y, brickWidth, brickHeight);
                }
                const lastX = FLOOR_WIDTH - mortarThickness - (brickWidth / 2);
                context.fillRect(lastX, y, brickWidth / 2, brickHeight);
            }
        }
        context.restore();
    }
    getHeight() { return FLOOR_HEIGHT; }
    landing(hero: Hero, _time: number, gameRefs: GameRefs) {
        hero.vy = gameRefs.floorVelocity;
        hero.regain();
    }
    standing(_hero: Hero, _time: number) {}
    leaving(_hero: Hero, _time: number) {}
}

class Spring extends Floor {
    spring: number;
    restoring: boolean;
    touchTime: number;
    leavingTime: number;

    constructor(x: number, y: number, seq: number) {
        super(x, y, seq);
        this.spring = SPRING_HEIGHT;
        this.restoring = false;
        this.touchTime = 0;
        this.leavingTime = 0;
    }

    getHeight() { return this.spring + 4; }

    draw(context: CanvasRenderingContext2D, time: number) {
        if (this.restoring) this.restore(time);
        const currentHeight = this.getHeight();
        context.save();
        context.translate(this.x, this.y);
        context.fillStyle = '#000';
        context.fillRect(0, -2, FLOOR_WIDTH, 2);
        context.fillRect(0, -currentHeight, FLOOR_WIDTH, 2);
        const gap = 10;
        const width = (FLOOR_WIDTH - gap * 4) / 3;
        context.lineWidth = width;
        context.strokeStyle = '#e74c3c';
        context.setLineDash([1, 2]);
        context.beginPath();
        let xPos = gap + width * 0.5;
        context.moveTo(xPos, -currentHeight + 2); context.lineTo(xPos, -2);
        xPos += gap + width;
        context.moveTo(xPos, -currentHeight + 2); context.lineTo(xPos, -2);
        xPos += gap + width;
        context.moveTo(xPos, -currentHeight + 2); context.lineTo(xPos, -2);
        context.stroke();
        context.restore();
    }
    landing(hero: Hero, time: number, gameRefs: GameRefs) {
        this.touchTime = time;
        this.spring = SPRING_HEIGHT;
        hero.vy = gameRefs.floorVelocity;
        hero.regain();
    }
    standing(hero: Hero, time: number) {
        const offset = time - this.touchTime;
        if (offset < SPRING_TIME) {
            this.spring = SPRING_HEIGHT - offset / SPRING_TIME * 5;
        } else if (offset < SPRING_TIME * 2) {
            this.spring = SPRING_HEIGHT - 15 + offset / SPRING_TIME * 10;
        } else {
            hero.vy = SPRINGING_VELOCITY;
            hero.onFloor = null;
            this.leaving(hero, time);
        }
    }
    leaving(_hero: Hero, time: number) {
        this.leavingTime = time;
        this.restoring = true;
    }
    restore(time: number) {
        const offset = time - this.leavingTime;
        const distance = 5 / SPRING_TIME * offset;
        if (this.spring < SPRING_HEIGHT) {
            this.spring += distance;
            if (this.spring >= SPRING_HEIGHT) { this.spring = SPRING_HEIGHT; this.restoring = false; }
        } else {
            this.spring -= distance;
            if (this.spring <= SPRING_HEIGHT) { this.spring = SPRING_HEIGHT; this.restoring = false; }
        }
    }
}

class RollingRight extends Floor {
    offset: number;
    constructor(x: number, y: number, seq: number) {
        super(x, y, seq);
        this.offset = 20;
    }
    draw(context: CanvasRenderingContext2D, _time: number) {
        if (--this.offset < 0) this.offset = 20;
        context.save();
        context.translate(this.x, this.y);
        context.strokeStyle = '#000';
        context.fillStyle = '#000';
        context.setLineDash([15, 5]);
        context.lineWidth = 2;
        context.lineDashOffset = this.offset;
        const midH = FLOOR_HEIGHT * 0.5;
        roundRect(context, 1, -FLOOR_HEIGHT + 1, FLOOR_WIDTH - 2, FLOOR_HEIGHT - 2, midH);
        context.stroke();
        context.setLineDash([]);
        context.beginPath();
        const markX = FLOOR_WIDTH * 0.2;
        context.moveTo(markX, -midH - 3); context.lineTo(markX + 4, -midH); context.lineTo(markX, -midH + 3);
        context.moveTo(markX + 8, -midH - 3); context.lineTo(markX + 12, -midH); context.lineTo(markX + 8, -midH + 3);
        context.stroke();
        context.beginPath();
        context.arc(midH, -midH, midH - 3, 0, 2 * Math.PI, false);
        context.arc(FLOOR_WIDTH - midH, -midH, midH - 3, 0, 2 * Math.PI, false);
        context.fill();
        context.restore();
    }
    landing(hero: Hero, _time: number, gameRefs: GameRefs) {
        hero.vy = gameRefs.floorVelocity;
        hero.vx = ROLLING_VELOCITY;
        hero.regain();
    }
    leaving(hero: Hero, _time: number) { 
        if (!hero) return;
        hero.vx = 0; 
    }
}

class RollingLeft extends Floor {
    offset: number;
    constructor(x: number, y: number, seq: number) {
        super(x,y,seq);
        this.offset = 0;
    }
    draw(context: CanvasRenderingContext2D, _time: number) {
        if (++this.offset >= 20) this.offset = 0;
        context.save();
        context.translate(this.x, this.y);
        context.strokeStyle = '#000';
        context.fillStyle = '#000';
        context.setLineDash([15, 5]);
        context.lineWidth = 2;
        context.lineDashOffset = this.offset;
        const midH = FLOOR_HEIGHT * 0.5;
        roundRect(context, 1, -FLOOR_HEIGHT + 1, FLOOR_WIDTH - 2, FLOOR_HEIGHT - 2, midH);
        context.stroke();
        context.setLineDash([]);
        context.beginPath();
        const markX = FLOOR_WIDTH * 0.8;
        context.moveTo(markX, -midH - 3); context.lineTo(markX - 4, -midH); context.lineTo(markX, -midH + 3);
        context.moveTo(markX - 8, -midH - 3); context.lineTo(markX - 12, -midH); context.lineTo(markX - 8, -midH + 3);
        context.stroke();
        context.beginPath();
        context.arc(midH, -midH, midH - 3, 0, 2 * Math.PI, false);
        context.arc(FLOOR_WIDTH - midH, -midH, midH - 3, 0, 2 * Math.PI, false);
        context.fill();
        context.restore();
    }
    landing(hero: Hero, _time: number, gameRefs: GameRefs) {
        hero.vy = gameRefs.floorVelocity;
        hero.vx = -ROLLING_VELOCITY;
        hero.regain();
    }
    leaving(hero: Hero, _time: number) { 
        if (!hero) return;
        hero.vx = 0; 
    }
}

class ArrowFloor extends Floor {
    draw(context: CanvasRenderingContext2D, _time: number) {
        context.save();
        context.translate(this.x, this.y);
        context.strokeStyle = '#c0392b';
        context.fillStyle = '#e74c3c';
        context.fillRect(0, -this.getHeight(), FLOOR_WIDTH, 3);
        context.fillRect(0, 6 - this.getHeight(), FLOOR_WIDTH, 3);
        context.beginPath();
        const bottom = -this.getHeight() + 0.5;
        const top = bottom - ARROW_HEIGHT;
        const left = 0.5;
        const right = FLOOR_WIDTH - 0.5;
        context.moveTo(left, bottom);
        for (let xPos = 0; xPos < right;) {
            context.lineTo(xPos += ARROW_WIDTH, top);
            context.lineTo(Math.min(xPos += ARROW_WIDTH, right), bottom);
        }
        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
    }
    landing(hero: Hero, time: number, gameRefs: GameRefs) {
        hero.vy = gameRefs.floorVelocity;
        hero.hurt(4, time);
    }
}

class FakeFloor extends Floor {
    height: number;
    restoring: boolean;
    touchTime: number;

    constructor(x: number, y: number, seq: number) {
        super(x, y, seq);
        this.height = FLOOR_HEIGHT;
        this.restoring = false;
        this.touchTime = 0;
    }
    
    getHeight() { return this.height; }

    draw(context: CanvasRenderingContext2D, time: number) {
        if (this.restoring) this.restore(time);
        context.save();
        context.translate(this.x, this.y);
        if (this.height >= FLOOR_HEIGHT || this.height <= 0) {
            context.fillStyle = '#999';
            context.fillRect(0, -FLOOR_HEIGHT, FLOOR_WIDTH, FLOOR_HEIGHT);
        } else {
            const percent = this.height / FLOOR_HEIGHT;
            const colorInc = Math.round(0x66 * percent);
            let color = 0x33 + colorInc;
            context.fillStyle = `rgb(${color},${color},${color})`;
            context.fillRect(0, -this.getHeight(), FLOOR_WIDTH, this.getHeight());
            color = 0x99 + colorInc;
            context.fillStyle = `rgb(${color},${color},${color})`;
            context.fillRect(0, -FLOOR_HEIGHT, FLOOR_WIDTH, FLOOR_HEIGHT - this.getHeight());
        }
        context.restore();
    }
    landing(hero: Hero, time: number, gameRefs: GameRefs) {
        this.touchTime = time;
        hero.vy = gameRefs.floorVelocity;
        hero.regain();
    }
    standing(hero: Hero, time: number) {
        const offset = time - this.touchTime;
        if (offset < FAKE_FLOOR_TIME) {
            this.height = FLOOR_HEIGHT;
        } else if (offset < FAKE_FLOOR_TIME2) {
            this.height = FLOOR_HEIGHT / (FAKE_FLOOR_TIME - FAKE_FLOOR_TIME2) * (offset - FAKE_FLOOR_TIME2);
        } else {
            this.height = 0;
            hero.onFloor = null;
            this.leaving(hero, time);
        }
    }
    leaving(_hero: Hero, time: number) {
        const offset = time - this.touchTime;
        if (offset >= FAKE_FLOOR_TIME && offset < FAKE_FLOOR_TIME2) {
            this.restoring = true;
        }
    }
    restore(time: number) {
        const offset = time - this.touchTime;
        if (offset < FAKE_FLOOR_TIME2) {
            this.height = FLOOR_HEIGHT / (FAKE_FLOOR_TIME - FAKE_FLOOR_TIME2) * (offset - FAKE_FLOOR_TIME2);
        } else {
            this.height = 0; this.restoring = false;
        }
    }
}

// --- The React Component ---

interface GameCanvasProps {
  onGameOver: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [life, setLife] = useState(10);
    // PERUBAHAN 1: Tambahkan state untuk layar game over
    const [isGameOverScreenVisible, setIsGameOverScreenVisible] = useState(false);

    const game = useRef({
        hero: null as Hero | null,
        floorArray: [] as IFloor[],
        floorVelocity: FLOOR_VELOCITY_BASE,
        level: 0,
        floorSeqCounter: 0,
        highestSeq: -1, 
        isRunning: false,
        lastTime: 0,
        animationFrameId: 0,
        assets: {
            bg: new Image(),
            hero: new Image(),
            loaded: false,
        }
    }).current;

    const drawAll = useCallback((time: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        ctx.drawImage(game.assets.bg, 0, MARGIN_TOP, STAGE_WIDTH, LOGICAL_GAME_HEIGHT);
        
        game.floorArray.forEach(floor => floor.draw(ctx, time));
        game.hero?.draw(ctx, time);

        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.moveTo(0.5, MARGIN_TOP + 0.5);
        for (let x = 0.5; x < STAGE_WIDTH;) {
            ctx.lineTo(x += ARROW_WIDTH, MARGIN_TOP + ARROW_HEIGHT - 0.5);
            ctx.lineTo(x += ARROW_WIDTH, MARGIN_TOP + 0.5);
        }
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();

    }, [game]);

    const updateScoreAndLevel = useCallback(() => {
        if (game.hero?.onFloor && game.hero.onFloor.seq > game.highestSeq) {
            game.highestSeq = game.hero.onFloor.seq;
            setScore(game.highestSeq); 

            const newLevel = Math.floor(game.highestSeq / 10); 
            if (newLevel > game.level) {
                game.level = newLevel;
                game.floorVelocity = (1 + 0.1 * game.level) * FLOOR_VELOCITY_BASE;
            }
        }
    }, [game]);

    const loop = useCallback((time: number) => {
        // PERUBAHAN 2: Guard clause utama untuk memastikan hero ada dan game berjalan
        if (!game.isRunning || !game.hero) return;
        const step = Math.min(MAX_ACTION_INTERVAL, time - game.lastTime);

        const totalVelocityX = game.hero.vx + (game.hero.direction * CONTROL_VELOCITY);
        if (totalVelocityX !== 0) {
            game.hero.x = Math.max(0, Math.min(STAGE_WIDTH - HERO_WIDTH, game.hero.x + totalVelocityX * step));
        }
        
        if (game.hero.onFloor) {
            const floor = game.hero.onFloor;
            if (game.hero.x + HERO_WIDTH < floor.x || game.hero.x > floor.x + FLOOR_WIDTH) {
                floor.leaving(game.hero, time);
                game.hero.onFloor = null;
            } else {
                floor.standing(game.hero, time);
            }
        }

        const floorDistance = step * game.floorVelocity;
        game.floorArray.forEach(f => f.y += floorDistance);

        if (game.hero.onFloor) {
            game.hero.y = game.hero.onFloor.y - game.hero.onFloor.getHeight();
            game.hero.vy = game.floorVelocity;
        } else {
            const heroDistance = game.hero.vy * step + 0.5 * GRAVITY_ACC * step * step;
            const newY = game.hero.y + heroDistance;
            let hasCollision = false;

            for (const floor of game.floorArray) {
                if (game.hero.x + HERO_WIDTH > floor.x && game.hero.x < floor.x + FLOOR_WIDTH && floor.getHeight() > 0 &&
                    newY >= floor.y - floor.getHeight() && game.hero.y < floor.y - floor.getHeight() - (floorDistance * 1.1)) {
                    
                    game.hero.y = floor.y - floor.getHeight();
                    game.hero.onFloor = floor;
                    floor.landing(game.hero, time, { floorVelocity: game.floorVelocity });
                    hasCollision = true;
                    break;
                }
            }
            if (!hasCollision) {
                game.hero.y = newY;
                game.hero.vy += GRAVITY_ACC * step;
            }
        }

        const lastFloor = game.floorArray[game.floorArray.length - 1];
        if (lastFloor?.y < STAGE_HEIGHT + FLOOR_DISTANCE) {
            const floorY = lastFloor.y + FLOOR_DISTANCE;
            const floorX = Math.round(Math.random() * (STAGE_WIDTH - FLOOR_WIDTH));
            
            const seed = Math.random();
            let newFloor: IFloor;
            if (seed > 0.5) newFloor = new Floor(floorX, floorY, game.floorSeqCounter);
            else if (seed > 0.4) newFloor = new FakeFloor(floorX, floorY, game.floorSeqCounter);
            else if (seed > 0.3) newFloor = new ArrowFloor(floorX, floorY, game.floorSeqCounter);
            else if (seed > 0.2) newFloor = new RollingLeft(floorX, floorY, game.floorSeqCounter);
            else if (seed > 0.1) newFloor = new RollingRight(floorX, floorY, game.floorSeqCounter);
            else newFloor = new Spring(floorX, floorY, game.floorSeqCounter);
            game.floorArray.push(newFloor);
            game.floorSeqCounter++;
        }
        game.floorArray = game.floorArray.filter(f => f.y > MARGIN_TOP - 50);

        if (game.hero.y - HERO_WIDTH < MARGIN_TOP + ARROW_HEIGHT) {
            game.hero.y = MARGIN_TOP + ARROW_HEIGHT + HERO_WIDTH;
            game.hero.vy = 0;
            game.hero.hurt(5, time);
        }

        updateScoreAndLevel();
        setLife(game.hero.life);

        // PERUBAHAN 3: Ubah logika game over
        if (game.hero.y > STAGE_HEIGHT + HERO_WIDTH || game.hero.life <= 0) {
            game.isRunning = false;
            setIsGameOverScreenVisible(true); // Tampilkan layar game over
        }
    }, [game, updateScoreAndLevel]);

    const frame = useCallback((time: number) => {
        if (!game.isRunning) {
            cancelAnimationFrame(game.animationFrameId);
            return;
        }
        if (!game.lastTime) game.lastTime = time;
        let duration = time - game.lastTime;
        while (duration > MAX_ACTION_INTERVAL) {
            loop(game.lastTime + MAX_ACTION_INTERVAL);
            duration -= MAX_ACTION_INTERVAL;
            game.lastTime += MAX_ACTION_INTERVAL;
        }
        loop(time);
        game.lastTime = time;
        drawAll(time);
        game.animationFrameId = requestAnimationFrame(frame);
    }, [game, loop, drawAll]);

    const startGame = useCallback(() => {
        if (game.isRunning) return;
        
        // PERUBAHAN 4: Reset layar game over saat mulai
        setIsGameOverScreenVisible(false);
        
        game.floorArray = [];
        game.floorSeqCounter = 1;
        game.highestSeq = 0;
        game.hero = new Hero((STAGE_WIDTH - HERO_WIDTH) / 2, STAGE_HEIGHT - FLOOR_DISTANCE, game.assets.hero);
        game.floorVelocity = FLOOR_VELOCITY_BASE;
        game.level = 0;

        game.floorArray.push(new Floor((STAGE_WIDTH - FLOOR_WIDTH) / 2, STAGE_HEIGHT, 0));

        setScore(0);
        setLife(10);
        game.lastTime = 0;
        game.isRunning = true;
        game.animationFrameId = requestAnimationFrame(frame);
    }, [game, frame]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ratio = window.devicePixelRatio || 1;
        canvas.width = STAGE_WIDTH * ratio;
        canvas.height = STAGE_HEIGHT * ratio;
        canvas.style.width = `${STAGE_WIDTH}px`;
        canvas.style.height = `${STAGE_HEIGHT}px`;
        const ctx = canvas.getContext('2d');
        ctx?.scale(ratio, ratio);

        let loadedImages = 0;
        const totalImages = 2;
        const onImageLoad = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                game.assets.loaded = true;
                drawAll(0);
            }
        };
        game.assets.bg.src = bgImage;
        game.assets.hero.src = heroSprite;
        game.assets.bg.onload = onImageLoad;
        game.assets.hero.onload = onImageLoad;
    }, [game.assets, drawAll]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // PERUBAHAN 5: Tambahkan null check dan screen check
            if (!game.hero) return;
            if (e.key === 'ArrowLeft') game.hero.turnLeft();
            if (e.key === 'ArrowRight') game.hero.turnRight();
            if (e.key === ' ' && !game.isRunning && !isGameOverScreenVisible) startGame();
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!game.hero) return;
            if (e.key === 'ArrowLeft' && game.hero.direction === -1) game.hero.stay();
            if (e.key === 'ArrowRight' && game.hero.direction === 1) game.hero.stay();
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [game, startGame, isGameOverScreenVisible]);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        // PERUBAHAN 6: Tambahkan null check
        if (!game.isRunning || !game.hero) return;
        const touchX = e.touches[0].clientX;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        if (touchX < rect.left + rect.width / 2) {
            game.hero.turnLeft();
        } else {
            game.hero.turnRight();
        }
    };

    const handleTouchEnd = () => {
        // PERUBAHAN 7: Tambahkan null check
        if (!game.isRunning || !game.hero) return;
        game.hero.stay();
    };

    // PERUBAHAN 8: Update struktur JSX
    return (
        <div className="relative w-full h-full">
            <div
                className="relative select-none w-full h-full cursor-pointer"
                onClick={!game.isRunning && !isGameOverScreenVisible ? startGame : undefined}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <div className="absolute top-0 left-0 w-full bg-black text-white p-2 font-mono text-sm z-10" style={{ height: MARGIN_TOP }}>
                    <span>Life: {'❤️'.repeat(life)}{'🤍'.repeat(Math.max(0, 10 - life))}</span>
                    <span className="ml-4">Score: {score}</span>
                </div>
                <canvas ref={canvasRef} className="absolute top-0 left-0" />
            </div>

            {isGameOverScreenVisible && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 text-white text-center">
                    <h2 className="text-5xl font-bold mb-4 text-red-500 animate-pulse">Game Over</h2>
                    <p className="text-2xl mb-8">Your Score: {score}</p>
                    <button
                        onClick={onGameOver}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105"
                    >
                        Back to Menu
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameCanvas;