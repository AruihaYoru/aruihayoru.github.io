(function () {
    'use strict';

    // シャイニングはなあ.....迷路に逃げ込んだウェンディとかを
    // どっかにあった「連動している迷路模型」から斧を振りかざすシーンがあったと思うんだけど
    // なかった
    class ShiningInfinity {
        constructor() {
            this.footer = document.querySelector('footer');
            this.container = null;
            this.progressValue = 0;
            this.isUnlocked = false;
            this.boardCount = 0;
            this.isTypewriterMode = false;
            this.hexPatternCache = {}; 
            
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

            window.ABS.addHook({
                onScroll: (s) => this.handleScroll(s),
                onTick: (t, state) => this.update(t, state)
            });
        }

        handleScroll(scroll) {
            if (this.isUnlocked && !this.isTypewriterMode) {
                const docH = document.documentElement.scrollHeight;
                const viewH = window.ABS.state.viewport.h;
                if (scroll.y + viewH > docH - viewH * 0.2) {
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
                const ratio = Math.min(1, (this.boardCount - 4) / 8);
                this.applyHexBackground(board, ratio);
            }

            this.container.appendChild(board);
        }

        applyHexBackground(board, ratio) {
            // Optimization: Cache patterns by approximate ratio
            const cacheKey = Math.floor(ratio * 10);
            if (!this.hexPatternCache[cacheKey]) {
                this.hexPatternCache[cacheKey] = this.generateHexPattern(ratio);
            }
            board.style.backgroundImage = `url(${this.hexPatternCache[cacheKey]})`;
            board.style.backgroundRepeat = 'repeat';
        }

        generateHexPattern(ratio) {
            const tempCanvas = document.createElement('canvas');
            const size = 38;
            const hexW = Math.sqrt(3) * size;
            const rowH = 1.5 * size;
            
            // Pattern tile size
            const dpr = 1; // Pattern doesn't need high dpr usuallyamless
            tempCanvas.width = hexW * 2;
            tempCanvas.height = rowH * 2;
            const ctx = tempCanvas.getContext('2d');
            
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 1;

            const drawHex = (x, y) => {
                if (Math.random() > ratio) return;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 180) * (60 * i + 30);
                    const px = x + size * Math.cos(angle);
                    const py = y + size * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            };

            // Draw a few overlapping hexes for a seamless pattern
            for(let r=0; r<4; r++) {
                const offsetX = (r % 2 === 1) ? hexW / 2 : 0;
                for(let c=0; c<4; c++) {
                    drawHex(c * hexW + offsetX - hexW, r * rowH - rowH);
                }
            }

            return tempCanvas.toDataURL();
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

        update(time, state) {
            if (this.isUnlocked) return;

            const viewH = state.viewport.h;
            const docH = document.documentElement.scrollHeight;
            const atBottom = (state.scroll.y + viewH) > docH - 10;

            if (atBottom) {
                this.progressValue = Math.min(100, this.progressValue + 0.2); // Slowed down from 0.6
                if (this.progressValue >= 100) {
                    this.isUnlocked = true;
                    window.shiningUnlocked = true; 
                    this.progressBarWrapper.style.opacity = '0';
                    setTimeout(() => {
                        this.progressBarWrapper.style.display = 'none';
                        this.addBoard(); 
                    }, 500);
                }
            } else {
                this.progressValue = Math.max(0, this.progressValue - 0.4); // Slower decay too
            }

            this.progressBarFill.style.width = `${this.progressValue}%`;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new ShiningInfinity();
    });
})();
