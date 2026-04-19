// これは本当に適当です。JSDoc全部消しました（戯言しか書いてなかったので私が）

(function () {
    'use strict';

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Zen+Kurenaido&display=swap';
    document.head.appendChild(link);

    const TIME_POOL = ['午前0時', '0:00', '午前3時', '3:00', '午前6時', '6:00', '午前9時', '9:00', '正午', '12:00', '午後3時', '15:00', '午後6時', '18:00', '午後9時', '21:00', '深夜0時', '24:00'];

    class BattleRoyale {
        constructor(section) {
            this.section = section;
            this.canvas = null;
            this.cols = 0;
            this.rows = 0;
            this.cellW = 80; 
            this.cellH = 80;
            this.grid = [];
            this.infoLabels = [];
            this.nextTrigger = 1000;
            this.lastTime = performance.now();
            this.isActive = false;
            this.build();
        }

        build() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'br-canvas';
            this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0.8;';
            this.section.style.position = 'relative'; 
            this.section.insertBefore(this.canvas, this.section.firstChild);

            window.ABS.registerCinematic('profile', {
                start: () => { this.isActive = true; },
                stop: () => { this.isActive = false; }
            });

            window.ABS.addHook({
                onResize: () => this.resize(),
                onTick: (t, s) => this.update(t, s)
            });

            this.resize();
            this.initGrid();
        }

        resize() {
            const { w, h, dpr } = window.ABS.state.viewport;
            this.W = this.section.offsetWidth;
            this.H = this.section.offsetHeight;
            this.canvas.width = this.W * dpr;
            this.canvas.height = this.H * dpr;
            this.ctx = this.canvas.getContext('2d', { alpha: true });
            this.ctx.scale(dpr, dpr);
            this.cols = Math.ceil(this.W / this.cellW);
            this.rows = Math.ceil(this.H / this.cellH);
            this.initGrid();
        }

        initGrid() {
            this.grid = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    this.grid.push({ r, c, zone: false, progress: 0 });
                }
            }
            this.placeInfo();
        }

        placeInfo() {
            this.infoLabels = [];
            for (let i = 0; i < 15; i++) {
                this.infoLabels.push({
                    x: 30 + Math.random() * (this.W - 60),
                    y: 30 + Math.random() * (this.H - 60),
                    text: TIME_POOL[Math.floor(Math.random() * TIME_POOL.length)],
                    opacity: 0.15 + Math.random() * 0.4
                });
            }
        }

        triggerNewZone() {
            const free = this.grid.filter(cell => !cell.zone);
            if (free.length === 0) return;
            const count = Math.min(free.length, 10 + Math.floor(Math.random() * 8));
            free.sort((a, b) => {
                const distA = Math.min(a.r, this.rows-a.r, a.c, this.cols-a.c);
                const distB = Math.min(b.r, this.rows-b.r, b.c, this.cols-b.c);
                return distA - distB + (Math.random() - 0.5) * 4;
            });
            free.slice(0, count).forEach(cell => { cell.zone = true; });
        }

        update(ts) {
            if (!this.isActive) return;
            const dt = ts - this.lastTime;
            this.lastTime = ts;

            this.nextTrigger -= dt;
            if (this.nextTrigger <= 0) {
                this.triggerNewZone();
                this.nextTrigger = 900 + Math.random() * 1200;
            }

            this.grid.forEach(cell => {
                if (cell.zone && cell.progress < 1) {
                    cell.progress = Math.min(1, cell.progress + dt / 800);
                }
            });

            this.draw();
        }

        draw() {
            const ctx = this.ctx;
            const { W, H, cellW, cellH } = this;
            ctx.clearRect(0, 0, W, H);

            const margin = 20;
            ctx.save();
            ctx.beginPath(); ctx.rect(margin, margin, W - margin * 2, H - margin * 2); ctx.clip(); 

            ctx.font = "400 12px 'Zen Kurenaido', serif";
            ctx.fillStyle = 'rgba(220, 60, 60, 0.6)';
            this.infoLabels.forEach(lbl => {
                ctx.globalAlpha = lbl.opacity;
                ctx.fillText(lbl.text, lbl.x, lbl.y);
            });

            ctx.lineWidth = 1;
            this.grid.forEach(cell => {
                if (!cell.zone) return;
                const x0 = cell.c * cellW;
                const y0 = cell.r * cellH;
                const p = cell.progress;

                ctx.save();
                ctx.beginPath(); ctx.rect(x0, y0, cellW, cellH); ctx.clip();
                ctx.strokeStyle = `rgba(220, 60, 60, ${0.45 * p})`;
                const stp = 8;
                ctx.beginPath();
                for (let o = -cellH; o < cellW; o += stp) {
                    const sX = x0 + o;
                    ctx.moveTo(sX, y0);
                    ctx.lineTo(sX + (x0+o+cellH - sX)*p, y0 + cellH*p);
                }
                ctx.stroke();
                ctx.restore();
            });
            ctx.restore();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('profile'); 
        if (section) new BattleRoyale(section);
    });
})();
