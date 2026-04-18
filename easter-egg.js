(function () {
    'use strict';

    // Key Color Constants
    const KEY_COLORS = {
        copper: '#b87333',
        silver: '#aaa9ad',
        crystal: '#88ccee'
    };

    // key SVG factor
    function makeSVGKey(type) {
        const c = { 
            main: KEY_COLORS[type], 
            shine: '#fff', 
            dark: '#333' 
        };

        const svgs = {
            copper: `<path d="M30 5 C15 5 10 18 15 28 C10 38 18 50 30 50 C42 50 50 38 45 28 C50 18 45 5 30 5 Z" fill="none" stroke="${c.main}" stroke-width="4"/><rect x="26" y="50" width="8" height="40" fill="${c.main}"/><path d="M34 70 L48 70 L48 75 L40 75 L40 80 L48 80 L48 88 L34 88 Z" fill="${c.main}"/>`,
            silver: `<path d="M30 5 L45 20 L40 45 L20 45 L15 20 Z" fill="none" stroke="${c.main}" stroke-width="4"/><circle cx="30" cy="25" r="8" fill="${c.shine}"/><rect x="27" y="45" width="6" height="45" fill="${c.main}"/><path d="M33 65 L46 65 L46 72 L33 72 M33 78 L42 78 L42 85 L33 85" stroke="${c.main}" stroke-width="5" fill="none"/>`,
            crystal: `<polygon points="30,2 45,15 50,35 30,48 10,35 15,15" fill="none" stroke="${c.main}" stroke-width="3"/><rect x="28" y="48" width="4" height="45" fill="${c.main}"/><path d="M32 70 L45 65 L45 72 L32 78 M32 82 L40 78 L40 85 L32 88" fill="${c.main}"/>`
        };

        // たぶん書きなおします
        return `<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" width="60" height="100">
  <g filter="drop-shadow(2px 4px 2px rgba(0,0,0,0.3))">
    ${svgs[type]}
  </g>
</svg>`;
    }

    // Easter Egg
    class EasterEgg {
        constructor(section) {
            this.section = section;
            this.keys = ['copper', 'silver', 'crystal'];
            this.found = new Set();
            this.eggVisible = false;
            this.build();
        }

        build() {
            const section = this.section;
            section.style.position = 'relative';

            const keyWrap = document.createElement('div');
            keyWrap.id = 'rp1-keys';
            keyWrap.style.cssText = `
                display:flex;gap:3rem;align-items:center;justify-content:center;
                margin-top:2rem;flex-wrap:wrap;
            `;

            this.keys.forEach(type => {
                const wrapper = document.createElement('div');
                wrapper.className = 'rp1-key-wrapper';
                wrapper.setAttribute('data-key-type', type);
                wrapper.style.cssText = `
                    cursor:pointer;transition:transform 0.3s ease,filter 0.3s ease;
                    filter:drop-shadow(0 4px 12px rgba(0,0,0,0.15));
                    position:relative;
                `;
                wrapper.innerHTML = makeSVGKey(type);

                const label = document.createElement('div');
                label.style.cssText = `
                    text-align:center;font-size:0.65rem;letter-spacing:0.15em;
                    color:rgba(0,0,0,0.4);margin-top:0.5rem;text-transform:uppercase;
                `;
                label.textContent = type;
                wrapper.appendChild(label);

                wrapper.addEventListener('click', () => this.collectKey(type, wrapper));
                keyWrap.appendChild(wrapper);
            });

            this.section.appendChild(keyWrap);
        }

        collectKey(type, wrapper) {
            if (this.found.has(type)) return;
            this.found.add(type);

            // Animate world object fade out
            wrapper.style.transform = 'scale(0.85)';
            wrapper.style.filter = 'grayscale(1) opacity(0.2)';
            wrapper.style.cursor = 'default';
            wrapper.style.pointerEvents = 'none';

            // Update Global Integrated HUD
            if (window.interfaceHUD) {
                window.interfaceHUD.updateKey(type, KEY_COLORS[type]);
            }

            // Check win
            if (this.found.size === 3) {
                setTimeout(() => this.showEgg(), 800);
            }
        }

        showEgg() {
            if (this.eggVisible) return;
            this.eggVisible = true;

            fetch('asset/egg.txt')
                .then(r => r.text())
                .then(eggArt => {
                    const overlay = document.createElement('div');
                    overlay.id = 'rp1-egg-overlay';
                    overlay.style.cssText = `
                        position:fixed;inset:0;z-index:9999;
                        display:flex;align-items:center;justify-content:center;
                        pointer-events:none;background:rgba(255,255,255,0.1);
                        backdrop-filter:blur(2px);
                    `;

                    const eggBox = document.createElement('div');
                    eggBox.style.cssText = `
                        font-family:'Courier New',monospace;
                        font-size:clamp(4px, 0.8vw, 10px); color:#000;
                        white-space:pre; line-height:1;
                        border:1px solid rgba(0,0,0,0.1); padding:2rem;
                        background:rgba(255,255,255,0.98); border-radius:2px;
                        opacity:0; transform:translateY(30px);
                        box-shadow: 0 30px 60px rgba(0,0,0,0.2);
                    `;
                    eggBox.textContent = eggArt;
                    overlay.appendChild(eggBox);
                    document.body.appendChild(overlay);

                    const steps = [
                        { o: 0.2, y: 25 }, { o: 0.4, y: 18 }, { o: 0.5, y: 12 },
                        { o: 0.6, y: 8 }, { o: 0.8, y: 4 }, { o: 1.0, y: 0 }
                    ];
                    
                    steps.forEach((s, i) => {
                        setTimeout(() => {
                            eggBox.style.opacity = s.o;
                            eggBox.style.transform = `translateY(${s.y}px)`;
                        }, i * 60);
                    });

                    // Remove after 5 seconds
                    setTimeout(() => {
                        [...steps].reverse().forEach((s, i) => {
                            setTimeout(() => {
                                eggBox.style.opacity = s.o - 0.2;
                                eggBox.style.transform = `translateY(${30 - s.y}px)`;
                            }, i * 60);
                        });
                        setTimeout(() => { overlay.remove(); this.eggVisible = false; }, steps.length * 60 + 200);
                    }, 5000);
                });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('section-rp1');
        if (section) window.easterEgg = new EasterEgg(section);
    });
})();
