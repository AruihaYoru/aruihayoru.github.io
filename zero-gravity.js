(function () {
    'use strict';

    class ZeroGravity {
        constructor(section) {
            this.section = section;
            this.canvas = null;
            this.ctx = null;
            this.points = []; // Tether points
            this.scrollVelocity = 0;
            this.lastScrollY = window.scrollY;
            this.targetScrollY = window.scrollY;
            this.isInertiaActive = false;

            this.W = 0;
            this.H = 0;

            this.build();
        }

        build() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'tether-canvas';
            this.canvas.style.cssText = `
                position:absolute;inset:0;width:100%;height:100%;
                pointer-events:none;z-index:1;
            `;
            this.section.style.position = 'relative';
            this.section.insertBefore(this.canvas, this.section.firstChild);

            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            // Custom scroll handling for inertia
            window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
            
            this.initTethers();
            this.animate();
        }

        resize() {
            this.W = this.section.offsetWidth;
            this.H = this.section.offsetHeight;
            this.canvas.width = this.W;
            this.canvas.height = this.H;
        }

        initTethers() {
            // Create a vertical "tether" line with nodes
            const nodeCount = 12;
            this.points = [];
            for (let i = 0; i < nodeCount; i++) {
                this.points.push({
                    x: this.W * 0.1, // Sidebar position
                    y: (this.H / (nodeCount - 1)) * i,
                    ox: this.W * 0.1,
                    oy: (this.H / (nodeCount - 1)) * i,
                    vx: 0,
                    vy: 0
                });
            }
            
            // Create tethered UI menu elements
            this.navEls = [];
            const menu = ['INITIALIZE_SEQ', 'GRAV_DRIVE', 'COMM_LINK', 'O2_STABILIZE', 'EJECT_PROTOCOL'];
            const container = document.createElement('div');
            container.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:2;';
            this.section.appendChild(container);
            
            menu.forEach((text, i) => {
                const el = document.createElement('div');
                el.textContent = text;
                el.style.cssText = `
                    position:absolute; font-family:'Inter',sans-serif; font-size:0.75rem; 
                    font-weight:700; letter-spacing:0.15em; color:rgba(0,0,0,0.85);
                    text-transform:uppercase; transform-origin: left center;
                `;
                container.appendChild(el);
                // Bind to specific points along the tether
                this.navEls.push({ dom: el, pdi: 2 + i * 2 });
            });
        }

        handleWheel(e) {
            // Check if mouse is within section's vertical bounds
            const rect = this.section.getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                e.preventDefault();
                
                if (!this.isInertiaActive) {
                    this.targetScrollY = window.scrollY;
                }
                
                this.targetScrollY += e.deltaY;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                this.targetScrollY = Math.max(0, Math.min(maxScroll, this.targetScrollY));
                
                this.isInertiaActive = true;
                this.scrollVelocity += e.deltaY * 0.05;
            } else {
                this.isInertiaActive = false;
            }
            // ちなみにこういうコードを書いたら現代の現場では間違いなくしょっ引かれて懲戒処分です
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            
            this.ctx = this.canvas.getContext('2d');
            this.ctx.clearRect(0, 0, this.W, this.H);

            // 1. Inertia Scroll
            if (this.isInertiaActive) {
                const diff = this.targetScrollY - window.scrollY;
                if (Math.abs(diff) > 0.5) {
                    window.scrollTo(0, window.scrollY + diff * 0.08);
                } else {
                    this.isInertiaActive = false;
                    this.targetScrollY = window.scrollY;
                }
            } else {
                this.targetScrollY = window.scrollY;
            }
            // ああ～～JS楽～～～～（なおJS構文に関する記憶を障害のせいでほぼ忘れてる模様）
            // バイブスでかけるコードっていいよね

            // 2. Physics Update
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - this.lastScrollY;
            this.lastScrollY = currentScrollY;

            this.points.forEach((p, i) => {
                // Drag effect from scroll
                if (i > 0 && i < this.points.length - 1) {
                    p.vx += scrollDelta * 0.012;
                }

                // Spring back to center
                const dx = p.ox - p.x;
                p.vx += dx * 0.05;
                p.vx *= 0.92; // Friction
                p.x += p.vx;
            });

            // 3. Draw Tether
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            this.ctx.lineWidth = 1;

            this.ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                const p = this.points[i];
                const prev = this.points[i-1];
                const cx = (p.x + prev.x) / 2;
                const cy = (p.y + prev.y) / 2;
                this.ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }
            this.ctx.stroke();

            // Draw small "knots" or markers along the tether
            this.points.forEach((p, i) => {
                if (i % 3 === 0) {
                    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });

            // 4. Update UI node.JSON
            // カスみたいな誤字したから見てほしい
            this.navEls.forEach(({dom, pdi}) => {
                const p = this.points[pdi];
                const dx = p.x - p.ox;
                // Position element at the point, rotate based on displacement for realistic swing
                dom.style.transform = `translate3d(${p.x + 12}px, ${p.y - 6}px, 0) rotate(${dx * 0.4}deg)`;
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('section-zero-gravity');
        if (section) {
            new ZeroGravity(section);
        }
    });
})();
