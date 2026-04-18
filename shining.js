/**
 * shining.js
 */

(function () {
    'use strict';

    class ShiningInfinity {
        constructor() {
            this.footer = document.querySelector('footer');
            this.container = null;
            this.progressValue = 0;
            this.isUnlocked = false;
            this.boardCount = 0;
            this.lastScrollY = window.scrollY;
            this.isTypewriterMode = false;
            
            this.init();
        }

        init() {
            if (!this.footer) return;

            this.progressBarWrapper = document.createElement('div');
            this.progressBarWrapper.id = 'shining-footer-bar-wrapper';
            this.progressBarWrapper.innerHTML = `<div id="shining-footer-bar-fill"></div>`;
            this.footer.appendChild(this.progressBarWrapper);
            this.progressBarFill = this.progressBarWrapper.querySelector('#shining-footer-bar-fill');

            this.container = document.createElement('div');
            this.container.id = 'shining-infinite-container';
            document.body.appendChild(this.container);

            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            this.animate();
        }

        handleScroll() {
            const currentScrollY = window.scrollY;
            const viewH = window.innerHeight;
            const docH = document.documentElement.scrollHeight;
            const scrollBottom = currentScrollY + viewH;

            if (!this.isUnlocked && scrollBottom > docH - 5) {
                if (Math.abs(currentScrollY - this.lastScrollY) > 1) {
                    this.progressValue = 0;
                }
            } else if (!this.isUnlocked) {
                this.progressValue = 0;
            }

            this.lastScrollY = currentScrollY;

            if (this.isUnlocked && !this.isTypewriterMode) {
                if (scrollBottom > docH - viewH * 0.2) {
                    this.addBoard();
                }
            }
        }

        addBoard() {
            this.boardCount++;
            if (window.interfaceHUD) {
                window.interfaceHUD.setDeployLog(Math.floor(100 + this.boardCount * 14.5));
            }

            const board = document.createElement('div');
            board.className = 'shining-board';
            board.style.height = `${window.innerHeight}px`;
            
            if (this.boardCount >= 14) {
                this.triggerTypewriter();
                return;
            }

            if (this.boardCount >= 5) {
                this.renderHoneycombCanvas(board, this.boardCount);
            }

            this.container.appendChild(board);
        }

        renderHoneycombCanvas(board, count) {
            const canvas = document.createElement('canvas');
            canvas.className = 'shining-hex-canvas';
            board.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const w = window.innerWidth;
            const h = window.innerHeight;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);

            const size = 38; 
            const hexW = Math.sqrt(3) * size;
            const rowH = 1.5 * size;
            const cols = Math.ceil(w / hexW) + 2;
            const rows = Math.ceil(h / rowH) + 2;
            const ratio = Math.min(1, (count - 4) / 8);

            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;

            for (let r = 0; r < rows; r++) {
                const offsetX = (r % 2 === 1) ? hexW / 2 : 0;
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > ratio) continue;
                    const x = c * hexW + offsetX - hexW / 2;
                    const y = r * rowH;
                    this.drawHex(ctx, x, y, size);
                }
            }
        }

        drawHex(ctx, x, y, s) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 180) * (60 * i + 30);
                const px = x + s * Math.cos(angle);
                const py = y + s * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }

        triggerTypewriter() {
            if (this.isTypewriterMode) return;
            this.isTypewriterMode = true;
            
            const twBoard = document.createElement('div');
            twBoard.className = 'shining-board typewriter-board';
            twBoard.style.height = `${window.innerHeight}px`;
            twBoard.innerHTML = `
                <div class="tw-wrapper">
                    <div id="tw-content">
                        <img src="asset/writter.png" class="tw-inline-icon" alt="typewriter">
                    </div>
                </div>
                <a href="#" class="back-to-top">BACK TO TOP</a>
            `;
            this.container.appendChild(twBoard);

            const contentEl = twBoard.querySelector('#tw-content');
            const phrase = "All work and no play makes Jack a dull boy. ";
            let charIdx = 0;

            const type = () => {
                if (!this.isTypewriterMode) return;
                const char = phrase[charIdx % phrase.length];
                const node = document.createTextNode(char);
                contentEl.appendChild(node);
                charIdx++;
                setTimeout(type, 35);
            };
            type();
        }

        animate() {
            const currentScrollY = window.scrollY;
            const viewH = window.innerHeight;
            const docH = document.documentElement.scrollHeight;
            const atBottom = (currentScrollY + viewH) > docH - 5;

            if (atBottom && !this.isUnlocked) {
                this.progressValue = Math.min(100, this.progressValue + 0.5);
                if (this.progressValue >= 100) {
                    this.isUnlocked = true;
                    // Global flag to stop standard progress updates
                    window.shiningUnlocked = true; 
                    this.progressBarWrapper.style.opacity = '0';
                    setTimeout(() => {
                        this.progressBarWrapper.style.display = 'none';
                        this.addBoard(); 
                    }, 500);
                }
            }

            this.progressBarFill.style.width = `${this.progressValue}%`;
            requestAnimationFrame(() => this.animate());
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new ShiningInfinity();
    });
})();
