class GridManager {
    constructor() {
        this.canvas = document.getElementById('grid-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false });
        
        this.lines = [];
        this.heroDots = [];
        this.currentGrid = '';
        this.sections = [];
        this.time = 0;
        this.needsStaticUpdate = false;
        
        this.init();
    }

    init() {
        this.sections = Array.from(document.querySelectorAll('.v-section'));
        
        window.ABS.addHook({
            onTick: (t, state) => this.draw(t, state),
            onResize: (v) => this.onResize(v),
            onScroll: (s) => this.onScroll(s)
        });

        this.onResize(window.ABS.state.viewport);
        // Trigger initial grid detection
        this.onScroll({ y: window.scrollY });
    }

    onResize(viewport) {
        const { w, h, dpr } = viewport;
        this.canvas.width = this.offscreenCanvas.width = w * dpr;
        this.canvas.height = this.offscreenCanvas.height = h * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.offscreenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = w;
        this.height = h;

        this.initHeroDots();
        this.refreshCurrentGrid();
    }

    initHeroDots() {
        this.heroDots = [];
        const s = 100; 
        for (let x = -s; x < this.width + s; x += s) {
            for (let y = -s; y < this.height + s; y += s) this.heroDots.push({ ox: x, oy: y });
        }
    }

    onScroll(scroll) {
        let activeSection = null;
        const viewCenter = this.height * 0.5;
        
        for (const section of this.sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= viewCenter && rect.bottom >= viewCenter) {
                activeSection = section;
                break;
            }
        }

        if (activeSection) {
            const gridType = activeSection.getAttribute('data-grid');
            if (gridType !== this.currentGrid) {
                this.setGrid(gridType);
            }
        }
    }

    setGrid(type) {
        this.currentGrid = type;
        const newLines = this.generateLines(type);
        this.transitionTo(newLines);
    }

    refreshCurrentGrid() {
        if (this.currentGrid) {
            if (this.currentGrid === 'hero') { this.lines = []; this.needsStaticUpdate = true; return; }
            const newLines = this.generateLines(this.currentGrid);
            this.lines = newLines.map(l => ({ ...l, drawP: 1, eraseP: 0, phase: 'active' }));
            this.needsStaticUpdate = true;
        }
    }

    generateLines(type) {
        if (type === 'hero' || !type) return [];
        const lines = [];
        const s = 100;
        const cols = Math.ceil(this.width / s) + 2;
        const rows = Math.ceil(this.height / s) + 2;
        const black = 'rgba(0, 0, 0, 0.08)';

        if (type === 'grid') {
            for (let y = 0; y < rows; y++) lines.push({ x1: 0, y1: y * s, x2: this.width, y2: y * s, color: black, x: 0, y: y, drawP: 0, eraseP: 0, phase: 'drawing' });
            for (let x = 0; x < cols; x++) lines.push({ x1: x * s, y1: 0, x2: x * s, y2: this.height, color: black, x: x, y: 0, drawP: 0, eraseP: 0, phase: 'drawing' });
        } else if (type === 'diagonal') {
            const diagH = rows * s;
            for (let i = -rows; i < cols; i++) lines.push({ x1: i * s, y1: 0, x2: (i + rows) * s, y2: diagH, color: black, x: i, y: 0, drawP: 0, eraseP: 0, phase: 'drawing' });
            for (let i = 0; i < cols + rows; i++) lines.push({ x1: i * s, y1: 0, x2: (i - rows) * s, y2: diagH, color: black, x: i, y: 0, drawP: 0, eraseP: 0, phase: 'drawing' });
        } else if (type === 'dots') {
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    const px = x * s; const py = y * s;
                    lines.push({ x1: px-6, y1: py, x2: px+6, y2: py, color: black, x: x, y: y, drawP: 0, eraseP: 0, phase: 'drawing' });
                    lines.push({ x1: px, y1: py-6, x2: px, y2: py+6, color: black, x: x, y: y, drawP: 0, eraseP: 0, phase: 'drawing' });
                }
            }
        }
        return lines;
    }

    transitionTo(newLines) {
        this.lines.forEach(l => {
            if (l.phase !== 'erasing') {
                l.phase = 'erasing';
                l.delay = (l.x + (l.y * 0.5)) * 10;
            }
        });
        newLines.forEach(l => {
            l.delay = (l.x + (l.y * 0.5)) * 10 + 50;
            this.lines.push(l);
        });
        this.needsStaticUpdate = true;
    }

    updateStaticCanvas() {
        const ctx = this.offscreenCtx;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        let activeCount = 0;
        this.lines.forEach(l => {
            if (l.phase === 'active') {
                ctx.moveTo(l.x1, l.y1);
                ctx.lineTo(l.x2, l.y2);
                activeCount++;
            }
        });
        ctx.stroke();
        this.needsStaticUpdate = false;
        this.hasActiveLines = activeCount > 0;
    }

    draw(ts, state) {
        this.time += 0.012;
        
        let hasChangingLines = false;
        this.lines.forEach(l => {
            if (l.phase === 'drawing' || l.phase === 'erasing') hasChangingLines = true;
        });

        if (this.needsStaticUpdate || hasChangingLines) {
            this.updateStaticCanvas();
        }

        this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
        
        if (this.currentGrid === 'hero') {
            // Adaptive skipping for low performance
            if (!state.isLowPerf || (Math.floor(ts / 16) % 2 === 0)) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
                for (const d of this.heroDots) {
                    const angle = this.time + (d.ox + d.oy) * 0.005;
                    this.ctx.fillRect(d.ox + Math.cos(angle) * 8, d.oy + Math.sin(angle) * 8, 1.2, 1.2);
                }
            }
        }

        if (hasChangingLines) {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            this.ctx.beginPath();
            for (let i = this.lines.length - 1; i >= 0; i--) {
                const l = this.lines[i];
                if (l.phase === 'active') continue;
                if (l.delay > 0) { l.delay -= 16; continue; }

                const speed = 0.08;
                if (l.phase === 'drawing') {
                    l.drawP = Math.min(1, l.drawP + speed);
                    if (l.drawP >= 1) { l.phase = 'active'; this.needsStaticUpdate = true; }
                } else if (l.phase === 'erasing') {
                    l.eraseP = Math.min(1, l.eraseP + speed);
                    if (l.eraseP >= 1) { this.lines.splice(i, 1); this.needsStaticUpdate = true; continue; }
                }

                if (l.drawP > l.eraseP) {
                    this.ctx.moveTo(l.x1 + (l.x2 - l.x1) * l.eraseP, l.y1 + (l.y2 - l.y1) * l.eraseP);
                    this.ctx.lineTo(l.x1 + (l.x2 - l.x1) * l.drawP, l.y1 + (l.y2 - l.y1) * l.drawP);
                }
            }
            this.ctx.stroke();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GridManager();
});
