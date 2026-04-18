/**
 * battle-royale.js
 */

(function () {
    'use strict';

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Zen+Kurenaido&display=swap';
    document.head.appendChild(link);

    const TIME_POOL = [
        '午前0時', '0:00', '午前3時', '3:00', '午前6時', '6:00',
        '午前9時', '9:00', '正午', '12:00', '午後3時', '15:00',
        '午後6時', '18:00', '午後9時', '21:00', '深夜0時', '24:00',
    ];

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
            this.build();
        }

        build() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'br-canvas';
            this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1;opacity:0.8;';
            this.section.style.position = 'relative'; 
            this.section.insertBefore(this.canvas, this.section.firstChild);

            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initGrid();
            this.animate();
        }

        resize() {
            this.W = this.section.offsetWidth;
            this.H = this.section.offsetHeight;
            this.canvas.width = this.W;
            this.canvas.height = this.H;
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
            const count = 15; 
            for (let i = 0; i < count; i++) {
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

            const selected = free.slice(0, count);
            selected.forEach(cell => { cell.zone = true; });
        }

        animate() {
            this.raf = requestAnimationFrame(ts => this.animate());
            const now = performance.now();
            const dt = now - this.lastTime;
            this.lastTime = now;

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
            const ctx = this.canvas.getContext('2d');
            const { W, H, cellW, cellH } = this;
            ctx.clearRect(0, 0, W, H);

            const margin = 20;
            ctx.save();
            ctx.beginPath();
            ctx.rect(margin, margin, W - margin * 2, H - margin * 2);
            ctx.clip(); 

            this.infoLabels.forEach(lbl => {
                ctx.save();
                ctx.globalAlpha = lbl.opacity;
                ctx.font = "400 12px 'Zen Kurenaido', serif";
                ctx.fillStyle = 'rgba(200, 30, 30, 0.8)';
                ctx.fillText(lbl.text, lbl.x, lbl.y);
                ctx.restore();
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
                for (let o = -cellH; o < cellW; o += stp) {
                    ctx.beginPath();
                    const sX = x0 + o;
                    const sY = y0;
                    ctx.moveTo(sX, sY);
                    ctx.lineTo(sX + (x0+o+cellH - sX)*p, sY + (y0+cellH - sY)*p);
                    ctx.stroke();
                }
                ctx.restore();
            });
            ctx.restore();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const section = document.querySelector('.profile-section'); 
        if (section) window.battleRoyale = new BattleRoyale(section);
    });
})();
