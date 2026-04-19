(function () {
    'use strict';

    // 今気づいたんですけどSATOR方陣って上下左右対称ですね　すごすぎる
    const SATOR_TEXT = 'SATOR\nAREPO\nTENET\nOPERA\nROTAS';
    const CHARS = SATOR_TEXT.replace(/\n/g, '').split('');

    let Engine, Bodies, Body, World, Vector;

    class TenetPhysics {
        constructor(section) {
            this.section = section;
            this.elements = [];
            this.bodies = [];
            this.targetPositions = [];
            this.isActive = false;
            this.charSize = 42;
            this.totalFrames = 120;
            this.currentFrame = 119; 
            this.targetFrame = 119;
            
            ({ Engine, Bodies, Body, World, Vector } = window.Matter);
            this.init();
        }

        init() {
            // allow overflowing for cinematic effect
            // うーんEZ english
            this.section.style.position = 'relative';
            this.section.style.overflow = 'visible';

            this.engine = Engine.create({ gravity: { x: 0, y: 0 } });

            // Create DOM elements for each character
            const container = document.createElement('div');
            container.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;overflow:visible;';
            this.section.appendChild(container);
            this.container = container;

            CHARS.forEach((char, i) => {
                const el = document.createElement('div');
                el.innerText = char;
                el.style.cssText = `
                    position: absolute;
                    font: 300 ${this.charSize}px "Inter", sans-serif;
                    color: #000;
                    will-change: transform;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: ${this.charSize}px;
                    height: ${this.charSize}px;
                `;
                this.container.appendChild(el);
                this.elements.push(el);
            });

            window.ABS.registerCinematic('section-tenet', {
                start: () => { 
                    this.isActive = true; 
                    if (window.ABS.state.scroll.delta > 0) this.targetFrame = 0;
                    else this.targetFrame = this.totalFrames - 1;
                },
                stop: () => { 
                    this.isActive = false; 
                }
            });

            window.ABS.addHook({
                onResize: () => this.resize(),
                onTick: (ts, state) => this.render(ts, state)
            });

            this.resize();
            this.runSimulation();
        }

        resize() {
            this.W = this.section.offsetWidth;
            this.H = this.section.offsetHeight;
            this.computeTargets();
        }

        computeTargets() {
            const spacing = this.charSize * 1.8;
            // 70%の位置にシフト
            const ox = (this.W * 0.7) - (2 * spacing); 
            const oy = (this.H * 0.5) - (2 * spacing);
            this.targetPositions = [];
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    this.targetPositions.push({
                        x: ox + c * spacing,
                        y: oy + r * spacing
                    });
                }
            }
        }

        // 重さを求めます（！？？！？！？！？？！？）
        calculateCharMass(char) {
            const tempCanvas = document.createElement('canvas');
            const size = 60;
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tCtx = tempCanvas.getContext('2d', { alpha: true });
            tCtx.font = `300 ${this.charSize}px "Inter"`;
            tCtx.textAlign = 'center';
            tCtx.textBaseline = 'middle';
            tCtx.fillStyle = '#000';
            tCtx.fillText(char, size/2, size/2);
            
            const pixels = tCtx.getImageData(0, 0, size, size).data;
            let area = 0;
            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] > 10) area++;
            }
            return Math.max(1, area / 100);
        }

        runSimulation() {
            this.bodies = [];
            const spacing = this.charSize * 1.8;
            const ox = (this.W * 0.7) - (2 * spacing); 
            const oy = (this.H * 0.5) - (2 * spacing);

            //左下寄り
            const epicenter = { 
                x: ox + 1.2 * spacing, 
                y: oy + 3.8 * spacing 
            };

            CHARS.forEach((char, i) => {
                const target = this.targetPositions[i];
                const mass = this.calculateCharMass(char);
                
                const body = Bodies.rectangle(target.x, target.y, this.charSize, this.charSize, {
                    frictionAir: 0.12, 
                    restitution: 0.4,
                    mass: mass
                });

                const dx = body.position.x - epicenter.x;
                const dy = body.position.y - epicenter.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 0.1;
                
                const shockwavePower = Math.max(0, 1 - (dist / 1000));
                const forceBase = (110 + Math.random() * 40) * shockwavePower;
                const noise = () => (Math.random() - 0.5) * 0.2;
                
                Body.setVelocity(body, {
                    x: ((dx / dist) + noise()) * forceBase,
                    y: ((dy / dist) + noise()) * forceBase
                });
                Body.setAngularVelocity(body, (Math.random() - 0.5) * 2.2);

                this.bodies.push({ body, history: [] });
                World.add(this.engine.world, body);
            });

            for (let i = 0; i < this.totalFrames; i++) {
                this.bodies.forEach(b => {
                    b.history.push({
                        x: b.body.position.x,
                        y: b.body.position.y,
                        a: b.body.angle
                    });
                });
                Engine.update(this.engine, 1000 / 60);
            }

            World.clear(this.engine.world);
            Engine.clear(this.engine);
        }

        render(ts, state) {
            if (!this.isActive && this.currentFrame === this.targetFrame) return;

            const rect = this.section.getBoundingClientRect();
            const viewH = window.innerHeight;
            const centerOffset = (rect.top + rect.height / 2) - (viewH / 2);
            const dist = Math.abs(centerOffset);
            const coreThreshold = viewH * 0.2;

            if (this.isActive) {
                if (dist < coreThreshold) {
                    this.targetFrame = 0;
                } else {
                    const isMovingAway = (centerOffset > 0 && state.scroll.delta < 0) || 
                                         (centerOffset < 0 && state.scroll.delta > 0);
                    if (isMovingAway) this.targetFrame = this.totalFrames - 1;
                    else if (state.scroll.delta !== 0) this.targetFrame = 0;
                }
            } else {
                this.targetFrame = this.totalFrames - 1;
            }

            let speed = 1.2;
            if (this.targetFrame === 0) {
                // 収束時
                if (this.currentFrame > this.totalFrames * 0.8) {
                    speed = 7.5; // 超高速スナップ
                } else if (this.currentFrame > this.totalFrames * 0.5) {
                    speed = 3.2; // 中速加速
                } else {
                    speed = 1.4; // 最終的な滑らかな収束
                }
            }

            if (this.currentFrame > this.targetFrame) this.currentFrame = Math.max(this.targetFrame, this.currentFrame - speed);
            else if (this.currentFrame < this.targetFrame) this.currentFrame = Math.min(this.targetFrame, this.currentFrame + speed);

            const frameIdx = Math.max(0, Math.min(this.totalFrames - 1, this.currentFrame));
            const f1 = Math.floor(frameIdx);
            const f2 = Math.ceil(frameIdx);
            const ratio = frameIdx - f1;

            this.bodies.forEach((b, i) => {
                const s1 = b.history[f1];
                const s2 = b.history[f2];
                if (!s1 || !s2) return;

                const x = s1.x + (s2.x - s1.x) * ratio;
                const y = s1.y + (s2.y - s1.y) * ratio;
                const a = s1.a + (s2.a - s1.a) * ratio;

                // DOM positioning: Center the element on the (x, y) point
                this.elements[i].style.transform = `translate3d(${x - this.charSize/2}px, ${y - this.charSize/2}px, 0) rotate(${a}rad)`;
            });
        }
    }

    function launch() {
        const section = document.getElementById('section-tenet');
        if (section && window.Matter) {
            new TenetPhysics(section);
        } else if (section) {
            setTimeout(launch, 30);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', launch);
    } else {
        launch();
    }
})();
