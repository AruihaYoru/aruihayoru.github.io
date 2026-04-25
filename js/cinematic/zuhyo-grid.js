// js/cinematicにいれたのは間違いなきがする

(function () {
    'use strict';

    const CELL        = 52;   // grid cell size px
    const TICK_MS     = 220;  // how often snakes step
    const SEG_MAXAGE  = 300;  // frames before a segment fades out
    const DOT_MAXAGE  = 380;
    const SPARK_COUNT = 8;
    const SPARK_LIFE  = 28;

    class ZuhyoGrid {
        constructor(section) {
            this.section  = section;
            this.active   = true;

            /* canvas sits below all other content */
            this.canvas        = document.createElement('canvas');
            this.canvas.style.cssText =
                'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
            section.insertBefore(this.canvas, section.firstChild);
            this.ctx = this.canvas.getContext('2d');

            this.segments = [];   // {x1,y1,x2,y2, age, progress}
            this.dots     = new Map();
            this.sparks   = [];   // {x,y,vx,vy,r,age,maxAge}
            this.clipRect = null;
            
            this.clipperImg = new Image();
            this.clipperImg.src = 'asset/clipper.svg';

            this._onResize = () => this.resize();
            window.addEventListener('resize', this._onResize);

            this.resize();
            this._snakes = this._initSnakes();

            this._tickId = setInterval(() => this._tick(), TICK_MS);
            this._raf    = requestAnimationFrame(ts => this._loop(ts));
        }

        destroy() {
            this.active = false;
            clearInterval(this._tickId);
            cancelAnimationFrame(this._raf);
            window.removeEventListener('resize', this._onResize);
        }

        // sizing
        resize() {
            this.W    = this.section.offsetWidth  || window.innerWidth;
            this.H    = this.section.offsetHeight || window.innerHeight;
            this.canvas.width  = this.W;
            this.canvas.height = this.H;
            this.cols = Math.ceil(this.W / CELL);
            this.rows = Math.ceil(this.H / CELL);
            this._updateClipRect();
        }

        _updateClipRect() {
            const el = this.section.querySelector('.tenet-clipper');
            if (!el) { this.clipRect = null; return; }
            const sr = this.section.getBoundingClientRect();
            const cr = el.getBoundingClientRect();
            // 
            this.clipRect = {
                x: cr.left - sr.left - 6,
                y: cr.top  - sr.top  - 6,
                w: cr.width  + 12,
                h: cr.height + 12
            };
        }

        _px(col) { return col * CELL; }
        _py(row) { return row * CELL; }

        _wrap(col, row) {
            const C = this.cols + 1, R = this.rows + 1;
            return { col: ((col % C) + C) % C, row: ((row % R) + R) % R };
        }

        // snakes
        _initSnakes() {
            const C = this.cols, R = this.rows;
            return [
                { col: 0,  row: 0,  dx:  1, dy: 0 },  // top-left  --> right
                { col: C,  row: 0,  dx: -1, dy: 0 },  // top-right --> left
                { col: 0,  row: R,  dx:  1, dy: 0 },  // bot-left  --> right
                { col: C,  row: R,  dx: -1, dy: 0 },  // bot-right --> left
            ];
        }
        // スネーク？？スネ――――――ク！！

        _turn(dx, dy) {
            const r = Math.random();
            // 何をやっているんだ君は.....
            if (r < 0.5) return [ dy, -dx]; // left
            return [-dy,  dx];              // right
        }

        // 4匹ってことはピースウォーカー？
        _tick() {
            if (!this.active) return;
            this._updateClipRect();

            for (const sn of this._snakes) {
                [sn.dx, sn.dy] = this._turn(sn.dx, sn.dy);

                const steps    = 1 + Math.floor(Math.random() * 3);
                const startCol = sn.col;
                const startRow = sn.row;

                const pxDot = this._px(sn.col), pyDot = this._py(sn.row);
                const key = `${sn.col},${sn.row}`;
                this.dots.set(key, { x: pxDot, y: pyDot, age: 0, maxAge: DOT_MAXAGE });

                for (let s = 0; s < steps; s++) {
                    const nxt  = this._wrap(sn.col + sn.dx, sn.row + sn.dy);
                    sn.col = nxt.col;
                    sn.row = nxt.row;
                }

                // segment from start --> end
                const x1 = this._px(startCol), y1 = this._py(startRow);
                const x2 = this._px(sn.col),   y2 = this._py(sn.row);

                this.segments.push({ x1, y1, x2, y2, age: 0, maxAge: SEG_MAXAGE, progress: 0 });
                this._spawnSpark(x2, y2);
            }

            this.segments = this.segments.filter(s => s.age < s.maxAge);
            this.sparks   = this.sparks.filter(sp => sp.age < sp.maxAge);
            for (const [k, d] of this.dots) if (d.age >= d.maxAge) this.dots.delete(k);
        }

        // sparks
        _spawnSpark(x, y) {
            for (let i = 0; i < SPARK_COUNT; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.6 + Math.random() * 2.8;
                this.sparks.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    r:  0.8 + Math.random() * 1.6,
                    age: 0,
                    maxAge: SPARK_LIFE + Math.floor(Math.random() * 14)
                });
            }
        }

        // grid drawing
        _drawGrid(ctx) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.045)';
            ctx.lineWidth   = 0.5;

            const step = (arr, getX, getY) => {
                for (const a of arr) {
                    ctx.beginPath();
                    for (let i = 0; i < arr.length; i++) {
                        const b = arr[i];
                        const px = getX(a, b), py = getY(a, b);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                }
            };

            const cols = Array.from({ length: this.cols + 1 }, (_, i) => i);
            const rows = Array.from({ length: this.rows + 1 }, (_, i) => i);

            // vertical lines
            step(cols, (c) => this._px(c), (c, r) => this._py(r));
            /// horizontal lines 
            step(rows, (r, c) => this._px(c), (r) => this._py(r));

            ctx.restore();
        }

        // render loop
        _loop() {
            if (!this.active) return;
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            this._drawGrid(ctx);

            for (const seg of this.segments) {
                seg.age++;
                seg.progress = Math.min(1, seg.age / 18);

                const fadeIn  = Math.min(1, seg.age / 10);
                const fadeOut = 1 - Math.max(0, (seg.age - seg.maxAge * 0.65) / (seg.maxAge * 0.35));
                const alpha   = fadeIn * fadeOut * 0.7;
                if (alpha <= 0) continue;

                const ex = seg.x1 + (seg.x2 - seg.x1) * seg.progress;
                const ey = seg.y1 + (seg.y2 - seg.y1) * seg.progress;

                ctx.save();
                ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
                ctx.lineWidth   = 1.5;
                ctx.lineCap     = 'round';
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.restore();
            }

            for (const d of this.dots.values()) {
                d.age++;
                const fadeIn  = Math.min(1, d.age / 6);
                const fadeOut = 1 - Math.max(0, (d.age - d.maxAge * 0.8) / (d.maxAge * 0.2));
                const alpha   = fadeIn * fadeOut * 0.55;
                if (alpha <= 0) continue;
                ctx.save();
                ctx.fillStyle = `rgba(0,0,0,${alpha})`;
                ctx.beginPath();
                ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }


            for (const sp of this.sparks) {
                sp.age++;
                sp.x  += sp.vx;
                sp.y  += sp.vy;
                sp.vy += 0.06;
                sp.vx *= 0.96;
                sp.vy *= 0.96;

                const t     = sp.age / sp.maxAge;
                const alpha = (1 - t) * 0.9;
                const r     = sp.r * (1 - t * 0.5);
                if (alpha <= 0 || r <= 0) continue;

                ctx.save();
                const bright = Math.max(0, 1 - t * 3);
                const red    = Math.round(200 * bright);
                const grn    = Math.round(180 * bright);
                ctx.fillStyle = `rgba(${red},${grn},0,${alpha})`;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // MASK
            if (this.clipRect && this.clipperImg.complete) {
                ctx.save();
                ctx.globalCompositeOperation = 'destination-out';
                ctx.drawImage(
                    this.clipperImg, 
                    this.clipRect.x, 
                    this.clipRect.y, 
                    this.clipRect.w, 
                    this.clipRect.h
                );
                ctx.restore();
            }

            this._raf = requestAnimationFrame(() => this._loop());
        }
    }

    // boot
    function launch() {
        const section = document.getElementById('section-tenet');
        if (!section) return;

        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                new ZuhyoGrid(section);
                io.disconnect();
            }
        }, { threshold: 0.05 });
        io.observe(section);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', launch);
    } else {
        launch();
    }
    
    // 蛇は一人でいい.....
})();
