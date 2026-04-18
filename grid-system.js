class GridManager {
    constructor() {
        this.canvas = document.getElementById('grid-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.lines = [];
        this.heroDots = [];
        this.currentGrid = '';
        this.sections = [];
        this.width = 0; this.height = 0;
        this.spacing = 100; this.time = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('scroll', () => this.handleScroll());
        this.init();
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.initHeroDots();
        this.refreshCurrentGrid();
    }

    initHeroDots() {
        this.heroDots = [];
        const s = 60;
        for (let x = -s; x < this.width + s; x += s) {
            for (let y = -s; y < this.height + s; y += s) this.heroDots.push({ ox: x, oy: y });
        }
    }

    init() {
        this.sections = Array.from(document.querySelectorAll('.v-section'));
        this.handleScroll();
    }

    handleScroll() {
        let activeSection = null;
        this.sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
                activeSection = section;
            }
        });
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
            if (this.currentGrid === 'hero') { this.lines = []; return; }
            const newLines = this.generateLines(this.currentGrid);
            this.lines = newLines.map(l => ({ ...l, drawP: 1, eraseP: 0, phase: 'active' }));
        }
    }

    generateLines(type) {
        if (type === 'hero' || !type) return [];
        const lines = [];
        const s = this.spacing;
        const cols = Math.ceil(this.width / s) + 2;
        const rows = Math.ceil(this.height / s) + 2;
        const black = 'rgba(0, 0, 0, 0.1)';

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
                l.delay = (l.x + (l.y * 0.5)) * 15;
            }
        });

        newLines.forEach(l => {
            l.delay = (l.x + (l.y * 0.5)) * 15 + 100;
            this.lines.push(l);
        });
    }

    animate() {
        this.time += 0.012;
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.currentGrid === 'hero') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.heroDots.forEach(d => {
                const angle = this.time + (d.ox + d.oy) * 0.005;
                const r = 8;
                const x = d.ox + Math.cos(angle) * r;
                const y = d.oy + Math.sin(angle) * r;
                this.ctx.fillRect(x, y, 1.5, 1.5);
            });
        }

        for (let i = this.lines.length - 1; i >= 0; i--) {
            const l = this.lines[i];
            if (l.delay > 0) {
                l.delay -= 16;
                continue;
            }

            const speed = 0.05;
            if (l.phase === 'drawing') {
                l.drawP = Math.min(1, l.drawP + speed);
                if (l.drawP >= 1) l.phase = 'active';
            } else if (l.phase === 'erasing') {
                l.eraseP = Math.min(1, l.eraseP + speed);
            }

            if (l.eraseP >= 1) { this.lines.splice(i, 1); continue; }

            const startX = l.x1 + (l.x2 - l.x1) * l.eraseP;
            const startY = l.y1 + (l.y2 - l.y1) * l.eraseP;
            const endX = l.x1 + (l.x2 - l.x1) * l.drawP;
            const endY = l.y1 + (l.y2 - l.y1) * l.drawP;

            if (l.drawP > l.eraseP) {
                this.ctx.strokeStyle = l.color;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GridManager();
});
