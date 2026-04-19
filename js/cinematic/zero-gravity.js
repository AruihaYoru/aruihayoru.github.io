(function () {
    'use strict';

    // あの短さであの面白さだいぶ好き
    class ZeroGravity {
        constructor(section) {
            this.section = section;
            this.canvas = null;
            this.ctx = null;
            this.points = []; 
            this.lastScrollY = window.scrollY;
            this.targetScrollY = window.scrollY;
            this.isInertiaActive = false;
            this.isActive = false;

            this.W = 0;
            this.H = 0;

            this.build();
        }

        build() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'tether-canvas';
            this.canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;`;
            this.section.style.position = 'relative';
            this.section.insertBefore(this.canvas, this.section.firstChild);

            this.mouseX = -1000;
            this.mouseY = -1000;

            window.ABS.registerCinematic('section-zero-gravity', {
                start: () => { this.isActive = true; },
                stop: () => { this.isActive = false; this.isInertiaActive = false; }
            });

            window.ABS.addHook({
                onResize: () => this.resize(),
                onTick: (t, s) => this.update(t, s)
            });

            this.resize();
            window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
            window.addEventListener('mousemove', (e) => {
                if (!this.isActive) return;
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            }, { passive: true });
            
            this.initTethers();
        }

        resize() {
            const { w, h, dpr } = window.ABS.state.viewport;
            this.W = this.section.offsetWidth;
            this.H = this.section.offsetHeight;
            this.canvas.width = this.W * dpr;
            this.canvas.height = this.H * dpr;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(dpr, dpr);
        }

        initTethers() {
            const nodeCount = 15;
            this.points = [];
            for (let i = 0; i < nodeCount; i++) {
                this.points.push({
                    x: this.W * 0.1, 
                    y: (this.H / (nodeCount - 1)) * i,
                    ox: this.W * 0.1,
                    oy: (this.H / (nodeCount - 1)) * i,
                    vx: 0, vy: 0
                });
            }
            
            this.navEls = [];
            const menu = ['INITIALIZE_SEQ', 'GRAV_DRIVE', 'COMM_LINK', 'O2_STABILIZE', 'EJECT_PROTOCOL'];
            const container = document.createElement('div');
            container.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:2;';
            this.section.appendChild(container);
            
            menu.forEach((text, i) => {
                const el = document.createElement('div');
                el.textContent = text;
                el.style.cssText = `position:absolute; font-family:'Inter',sans-serif; font-size:0.7rem; font-weight:700; letter-spacing:0.15em; color:rgba(0,0,0,0.7); text-transform:uppercase; transform-origin: left center; transition: color 0.3s;`;
                container.appendChild(el);
                this.navEls.push({ dom: el, pdi: 3 + i * 2 });
            });
        }

        handleWheel(e) {
            if (!this.isActive) return;
            const rect = this.section.getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                e.preventDefault();
                if (!this.isInertiaActive) this.targetScrollY = window.scrollY;
                this.targetScrollY += e.deltaY;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                this.targetScrollY = Math.max(0, Math.min(maxScroll, this.targetScrollY));
                this.isInertiaActive = true;
            }
        }

        update(time, state) {
            if (!this.isActive) return;
            
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            if (this.isInertiaActive) {
                const diff = this.targetScrollY - window.scrollY;
                if (Math.abs(diff) > 0.5) {
                    window.scrollTo(0, window.scrollY + diff * 0.08);
                } else {
                    this.isInertiaActive = false;
                }
            }

            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - this.lastScrollY;
            this.lastScrollY = currentScrollY;

            // Micro-gravity Physics Engine
            this.points.forEach((p, i) => {
                if (i > 0 && i < this.points.length - 1) {
                    // Scroll inertia
                    p.vy += scrollDelta * 0.008;
                    p.vx += scrollDelta * 0.015;
                    
                    // Continuous zero-g drift
                    p.vx += Math.sin(time * 0.0015 + i) * 0.08;
                    p.vy += Math.cos(time * 0.002 + i) * 0.05;

                    // Mouse repulsion field
                    const dxm = p.x - this.mouseX;
                    const dym = p.y - this.mouseY;
                    const dist = Math.sqrt(dxm * dxm + dym * dym);
                    if (dist < 250) {
                        const force = (250 - dist) / 250;
                        p.vx += (dxm / dist) * force * 2.0;
                        p.vy += (dym / dist) * force * 2.0;
                    }
                }

                // Spring constraints
                const dx = p.ox - p.x;
                const dy = p.oy - p.y;
                p.vx += dx * 0.015; 
                p.vy += dy * 0.015;

                // Friction
                p.vx *= 0.94; 
                p.vy *= 0.94; 

                p.x += p.vx;
                p.y += p.vy;
            });

            // Draw tether
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                const p = this.points[i];
                const prev = this.points[i-1];
                const cx = (p.x + prev.x) / 2;
                const cy = (p.y + prev.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }
            ctx.stroke();

            // Draw nodes
            this.points.forEach((p, i) => {
                if (i % 3 === 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });

            // Update UI Labels
            this.navEls.forEach(({dom, pdi}) => {
                const p = this.points[pdi];
                const dx = p.x - p.ox;
                const dy = p.y - p.oy;
                dom.style.transform = `translate3d(${p.x + 20}px, ${p.y - 6}px, 0) rotate(${dx * 0.3}deg)`;
                
                // Color change on high velocity
                const vel = Math.abs(p.vx) + Math.abs(p.vy);
                if (vel > 3) dom.style.color = 'rgba(255,50,50,0.8)';
                else dom.style.color = 'rgba(0,0,0,0.7)';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('section-zero-gravity');
        if (section) new ZeroGravity(section);
    });
})();
