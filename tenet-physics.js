(function () {
    'use strict';

    const SATOR_TEXT = 'SATOR\nAREPO\nTENET\nOPERA\nROTAS';
    const CHARS = SATOR_TEXT.replace(/\n/g, '').split('');

    let Engine, Runner, Bodies, Body, World;

    function waitForMatter(cb) {
        if (window.Matter) {
            ({ Engine, Runner, Bodies, Body, World } = window.Matter);
            cb();
        } else {
            setTimeout(() => waitForMatter(cb), 50);
        }
    }

    class TenetPhysics {
        constructor(section) {
            this.section = section;
            this.canvas = null;
            this.engine = null;
            this.bodies = [];
            this.targetPositions = []; 
            this.scrollProgress = 0;   
            this.raf = null;
            this.cols = 5;
            this.rows = 5;
            this.charSize = 48;        
            this.ready = false;
            this.build();
        }

        build() {
            const section = this.section;

            this.canvas = document.createElement('canvas');
            this.canvas.id = 'tenet-canvas';
            this.canvas.style.cssText = `
                position:absolute;inset:0;width:100%;height:100%;
                pointer-events:none;z-index:2;
            `;
            section.style.position = 'relative';
            section.style.overflow = 'hidden';
            section.appendChild(this.canvas);

            this.resize();
            window.addEventListener('resize', () => {
                this.resize();
                if (this.engine) this.initBodies();
            });
            window.addEventListener('scroll', () => this.onScroll(), { passive: true });

            this.engine = Engine.create({ gravity: { y: 0 } });
            
            this.initBodies();
            this.ready = true;
            this.animate();
        }

        resize() {
            this.W = this.section.offsetWidth;
            this.H = this.section.offsetHeight;
            this.canvas.width = this.W;
            this.canvas.height = this.H;
            this.computeTargets();
        }

        computeTargets() {
            const cellW = this.charSize * 2.5; 
            const cellH = this.charSize * 1.6;
            const gridW = this.cols * cellW;
            const gridH = this.rows * cellH;
            const ox = (this.W - gridW) / 2 + cellW / 2 + (this.W * 0.08); // Right shifted
            const oy = (this.H - gridH) / 2 + cellH / 2;
            this.targetPositions = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    this.targetPositions.push({
                        x: ox + c * cellW,
                        y: oy + r * cellH,
                    });
                }
            }
        }

        initBodies() {
            if (this.bodies.length) World.remove(this.engine.world, this.bodies.map(b => b.body));
            this.bodies = [];

            const cx = this.W / 2;
            const cy = this.H / 2;

            CHARS.forEach((ch, i) => {
                const target = this.targetPositions[i] || { x: cx, y: cy };
                
                const body = Bodies.rectangle(target.x, target.y, 32, 40, {
                    frictionAir: 0.02,
                    restitution: 0.5,
                    label: ch,
                });
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 18 + Math.random() * 25;
                Body.setVelocity(body, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                });
                Body.setAngularVelocity(body, (Math.random() - 0.5) * 5.0);

                this.bodies.push({ body, char: ch, index: i, history: [] });
                World.add(this.engine.world, body);
            });

            const MAX_FRAMES = 150;
            for (let f = 0; f < MAX_FRAMES; f++) {
                this.bodies.forEach(b => {
                    b.history.push({
                        x: b.body.position.x,
                        y: b.body.position.y,
                        angle: b.body.angle
                    });
                });
                Engine.update(this.engine, 1000 / 60);
            }
        }

        onScroll() {
            const currentScroll = window.scrollY;
            const direction = currentScroll > (this.lastScrollY || 0) ? 'down' : 'up';
            this.lastScrollY = currentScroll;

            const rect = this.section.getBoundingClientRect();
            const viewH = window.innerHeight;
            
            // Trigger
            const isVisible = rect.top < viewH * 0.8 && rect.bottom > viewH * 0.2;

            if (isVisible) {
                if (direction === 'down' && rect.top > 0) {
                    // Scrolling down, section is coming from below --> Inverse
                    this.targetProgress = 1;
                } else if (direction === 'up' && rect.bottom < viewH) {
                    // Scrolling up, section is coming from above --> verse （間違い）
                    this.targetProgress = 0;
                }
            }
        }

        animate() {
            this.raf = requestAnimationFrame(() => this.animate());
            if (!this.ready || !this.bodies.length) return;

            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.W, this.H);

            // Playback interpolation
            const target = this.targetProgress !== undefined ? this.targetProgress : 0;
            const speed = 0.015; // Adjust for playback speed
            if (this.scrollProgress < target) {
                this.scrollProgress = Math.min(target, this.scrollProgress + speed);
            } else if (this.scrollProgress > target) {
                this.scrollProgress = Math.max(target, this.scrollProgress - speed);
            }

            const p = this.scrollProgress; 
            
            const maxFrame = this.bodies[0].history.length - 1;
            const targetFrame = (1 - p) * maxFrame;
            
            const frameInt = Math.floor(targetFrame);
            const frameP = targetFrame - frameInt;

            this.bodies.forEach(({ char, history }) => {
                let state;
                if (frameInt >= maxFrame) {
                    state = history[maxFrame];
                } else if (frameInt < 0) {
                    state = history[0];
                } else {
                    const st1 = history[frameInt];
                    const st2 = history[frameInt + 1];
                    state = {
                        x: st1.x + (st2.x - st1.x) * frameP,
                        y: st1.y + (st2.y - st1.y) * frameP,
                        angle: st1.angle + (st2.angle - st1.angle) * frameP
                    };
                }

                ctx.save();
                ctx.translate(state.x, state.y);
                ctx.rotate(state.angle);
                // Use Monospace and letter-spacing for true SATOR square
                ctx.font = `300 ${this.charSize}px 'Courier New', monospace`;
                ctx.letterSpacing = '1em'; 
                
                // Opacity fades slightly when scattered, lighter total
                ctx.fillStyle = `rgba(0,0,0,${0.1 + p * 0.4})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(char, 0, 0);
                ctx.restore();
            });

            // Perfect overlay at p > 0.98 to ensure pixel-perfect assembly
            if (p > 0.98) {
                const alpha = (p - 0.98) / 0.02;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = `300 ${this.charSize}px 'Courier New', monospace`;
                ctx.letterSpacing = '1em';
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                this.targetPositions.forEach((pos, i) => {
                    ctx.fillText(CHARS[i], pos.x, pos.y);
                });
                ctx.restore();
            }
        }
    }

    function init() {
        const section = document.getElementById('section-tenet');
        if (!section) return;

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
        script.onload = () => waitForMatter(() => new TenetPhysics(section));
        document.head.appendChild(script);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
