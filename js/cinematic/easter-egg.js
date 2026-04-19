(function () {
    'use strict';

    // Key
    const KEY_COLORS = {
        copper: '#b87333',
        silver: '#aaa9ad',
        crystal: '#88ccee'
    };

    function makeSVGKey(type) {
        const c = { 
            main: KEY_COLORS[type], 
            glow: KEY_COLORS[type] + '88'
        };
        
        // 鍵のSVG まあGoogle製ですよね
        const svgs = {
            copper: `<path d="M443.5-736.5Q467-760 500-760t56.5 23.5Q580-713 580-680t-23.5 56.5Q533-600 500-600t-56.5-23.5Q420-647 420-680t23.5-56.5ZM500 0 320-180l60-80-60-80 60-85v-47q-54-32-87-86.5T260-680q0-100 70-170t170-70q100 0 170 70t70 170q0 67-33 121.5T620-472v352L500 0ZM340-680q0 56 34 98.5t86 56.5v125l-41 58 61 82-55 71 75 75 40-40v-371q52-14 86-56.5t34-98.5q0-66-47-113t-113-47q-66 0-113 47t-47 113Z"/>`,
            silver: `<path d="M443.5-736.5Q467-760 500-760t56.5 23.5Q580-713 580-680t-23.5 56.5Q533-600 500-600t-56.5-23.5Q420-647 420-680t23.5-56.5ZM500 0 320-180l60-80-60-80 60-85v-47q-54-32-87-86.5T260-680q0-100 70-170t170-70q100 0 170 70t70 170q0 67-33 121.5T620-472v352L500 0ZM340-680q0 56 34 98.5t86 56.5v125l-41 58 61 82-55 71 75 75 40-40v-371q52-14 86-56.5t34-98.5q0-66-47-113t-113-47q-66 0-113 47t-47 113Z"/>`,
            crystal: `<path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70q66 0 121 33t87 87h432v240h-80v120H600v-120H488q-32 54-87 87t-121 33Zm0-80q66 0 106-40.5t48-79.5h246v120h80v-120h80v-80H434q-8-39-48-79.5T280-640q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-80q33 0 56.5-23.5T360-480q0-33-23.5-56.5T280-560q-33 0-56.5 23.5T200-480q0 33 23.5 56.5T280-400Zm0-80Z"/>`
        };

        return `<svg xmlns="http://www.w3.org/2000/svg" height="60px" viewBox="0 -960 960 960" width="60px" fill="${c.main}">
  <defs>
    <filter id="glow-${type}">
      <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#glow-${type})">
    ${svgs[type]}
  </g>
</svg>`;
    }

    class EasterEgg {
        constructor() {
            this.keys = [
                { type: 'copper', section: 'section-tenet', x: '88%', y: '15%' },
                { type: 'silver', section: 'shining-infinite-container', x: '5%', y: '45%' },
                { type: 'crystal', section: 'section-zero-gravity', x: '92%', y: '60%' }
            ];
            // 置く場所を決めます。ちゃんと原作準拠でシャイニング
            // カッパーは...まあ....「信念」に通じるシーンでしたし....TENET（クリストファーノーラン監督）のとこにおこうかなって
            // クリスタルは、まあなんか適当にレトロゲーム（もしくはアーケード）のコピーつくってもよかったんですけど　めんどくさいので
            this.foundCount = 0;
            this.eggVisible = false;
            this.isNegative = false;
            this.init();
        }

        init() {
            // まさか場所が分からなくなるとか思わんやん？
            console.log('--- ARTIFACT_LOCATIONS [DEBUG] ---');
            this.keys.forEach(k => console.log(`[${k.type.toUpperCase()}]: ID=${k.section} @ (${k.x}, ${k.y})`));
            
            if (!document.getElementById('rp1-global-styles')) {
                const style = document.createElement('style');
                style.id = 'rp1-global-styles';
                style.textContent = `
                    @keyframes keyFloat { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-15px) rotate(5deg); } }
                    .hidden-key { 
                        position: absolute; z-index: 1000; cursor: pointer;
                        transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                        animation: keyFloat 4s ease-in-out infinite alternate;
                        opacity: 0.12; 
                    }
                    .hidden-key:hover { opacity: 1; transform: scale(1.3); }
                    .negative-mode { 
                        filter: invert(1) hue-rotate(180deg) !important;
                        background-color: #000 !important;
                    }
                `;
                document.head.appendChild(style);
            }

            this.spawnKeys();
            // Since some sections like 'shining' generate content dynamically, we might need to retry spawning
            setTimeout(() => this.spawnKeys(), 2000); 
            // うーんEazy
        }

        spawnKeys() {
            this.keys.forEach(k => {
                if (document.querySelector(`.hidden-key[data-type="${k.type}"]`)) return;
                const section = document.getElementById(k.section) || document.querySelector(`#${k.section}`);
                if (!section) return;

                const el = document.createElement('div');
                el.className = 'hidden-key';
                el.dataset.type = k.type;
                el.style.left = k.x;
                el.style.top = k.y;
                el.innerHTML = makeSVGKey(k.type);
                
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.collectKey(k.type, el);
                });

                section.style.position = 'relative';
                section.appendChild(el);
            });
        }

        collectKey(type, el) {
            if (el.dataset.collected) return;
            el.dataset.collected = "true";
            this.foundCount++;

            el.style.transform = 'scale(4) rotate(90deg)';
            el.style.opacity = '0';
            el.style.filter = 'brightness(10) blur(30px)';
            
            if (window.interfaceHUD) {
                window.interfaceHUD.updateKey(type, KEY_COLORS[type]);
            }

            if (this.foundCount === 3) {
                setTimeout(() => this.showEgg(), 1500);
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
                        position:fixed; inset:0; z-index:9999;
                        display:flex; flex-direction:column; align-items:center; justify-content:center;
                        background:rgba(255,255,255,0.98); backdrop-filter:blur(15px);
                        cursor: pointer; pointer-events: auto;
                        opacity: 0; transition: opacity 1s ease;
                    `;

                    const artBox = document.createElement('div');
                    artBox.style.cssText = `
                        font-family:'Courier New', monospace;
                        font-size: clamp(3px, 0.5vw, 7px);
                        line-height: 1; white-space: pre;
                        color: #000; padding: 2rem;
                        transform: scale(0.9); transition: transform 1.5s cubic-bezier(0.16, 1, 0.3, 1);
                    `;
                    artBox.textContent = eggArt;
                    // 卵の出どころはなんか適当にegg cc0って書いたらでてきたやつを変換
                    
                    const msg = document.createElement('div');
                    msg.style.cssText = `
                        margin-top: 2rem; font-family: 'Inter', sans-serif;
                        font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5em;
                        color: #000; text-transform: uppercase;
                    `;
                    msg.textContent = "ARTIFACT_UNLOCKED // CLICK TO INVERT";
                    // msg(metal gear solid) <--戯言
                    
                    overlay.appendChild(artBox);
                    overlay.appendChild(msg);
                    document.body.appendChild(overlay);

                    requestAnimationFrame(() => {
                        overlay.style.opacity = '1';
                        artBox.style.transform = 'scale(1)';
                    });

                    overlay.addEventListener('click', () => {
                        this.toggleNegative();
                        overlay.style.opacity = '0';
                        setTimeout(() => overlay.remove(), 1000);
                    });
                });
        }

        toggleNegative() {
            this.isNegative = !this.isNegative;
            
            let overlay = document.getElementById('rp1-negative-layer');
            
            if (this.isNegative) {
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'rp1-negative-layer';
                    overlay.style.cssText = `
                        position: fixed; inset: 0; pointer-events: none;
                        background: #fff; mix-blend-mode: difference;
                        z-index: 999999; transform: translateZ(0);
                        will-change: transform;
                    `;
                    document.body.appendChild(overlay);
                }
            } else {
                if (overlay) overlay.remove();
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.easterEgg = new EasterEgg();
    });
})();
