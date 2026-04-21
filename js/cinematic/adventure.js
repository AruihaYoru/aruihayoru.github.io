(function () {
    'use strict';

    class AdventureCinematic {
        constructor() {
            this.section = document.getElementById('section-adventure');
            if (!this.section) return;

            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d', { alpha: false });
            this.imageData = this.ctx.createImageData(320, 224);
            
            window.crystal_key = 0;
            this.lastCrystalKey = 0;
            this.isActive = false;

            this.setupWASM();
            this.setupAudio();
            this.setupUI();
            this.setupInput();
        }

        setupUI() {
            const playBtn = document.getElementById('adventure-play-btn');
            const overlay = document.getElementById('adventure-overlay');
            if (playBtn && overlay) {
                playBtn.addEventListener('click', () => {
                    this.isActive = true;
                    window.adventureActive = true;
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.style.pointerEvents = 'none', 400);
                    // Resume audio context if suspended
                    if (this.audioCtx && this.audioCtx.state === 'suspended') {
                        this.audioCtx.resume();
                    }
                });
            }
        }

        setupWASM() {
            window.renderAdventureFrame = (wasmBufferView) => {
                if (!wasmBufferView) return;
                
                this.imageData.data.set(wasmBufferView);
                this.ctx.putImageData(this.imageData, 0, 0);

                if (window.crystal_key !== this.lastCrystalKey) {
                    this.lastCrystalKey = window.crystal_key;
                    if (window.crystal_key === 0x01) {
                        const statusEl = document.getElementById('adventure-status');
                        if (statusEl) {
                            statusEl.innerText = "✨ Easter Egg Room Reached! ✨";
                            statusEl.style.color = "#FFD84C";
                        }
                        
                        // 数秒待ってから、Canvasの真上にスポーンさせる
                        setTimeout(() => {
                            if (window.easterEgg && window.easterEgg.spawnQuartzKey) {
                                window.easterEgg.spawnQuartzKey();
                            }
                        }, 2000);
                    }
                }
            };

            window.Module = {
                locateFile: function(path) {
                    if (path.endsWith('.wasm')) {
                        return 'adventure/' + path;
                    }
                    return path;
                },
                onRuntimeInitialized: function() {
                    const statusEl = document.getElementById('adventure-status');
                    if (statusEl) statusEl.innerText = "Game Running";
                }
            };

            // Load the wasm JS wrapper dynamically
            const script = document.createElement('script');
            script.src = 'adventure/adventure_peaceful.js';
            script.async = true;
            document.body.appendChild(script);
        }

        setupAudio() {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.soundBuffers = {};
            // Using correct paths relative to index.html
            // Assuming sounds are in adventure/sounds/ based on original context
            // Or maybe they are in 'sounds/'? peaceful.html was in 'adventure/', so 'sounds/won.wav' was in 'adventure/sounds/'.
            const soundFiles = {
                0: 'adventure/sounds/won.wav',
                1: 'adventure/sounds/roar.wav',
                2: 'adventure/sounds/eaten.wav',
                3: 'adventure/sounds/dragondie.wav',
                4: 'adventure/sounds/putdown.wav',
                5: 'adventure/sounds/pickup.wav'
            };

            const loadSounds = async () => {
                for (const [id, url] of Object.entries(soundFiles)) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) continue;
                        const arrayBuffer = await response.arrayBuffer();
                        this.soundBuffers[id] = await this.audioCtx.decodeAudioData(arrayBuffer);
                    } catch (e) {
                        console.error("Failed to load sound:", url, e);
                    }
                }
            };
            loadSounds();

            window.playAdventureSound = (soundId) => {
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume().then(() => {
                        this.playSound(soundId);
                    });
                } else {
                    this.playSound(soundId);
                }
            };
        }

        playSound(soundId) {
            if (this.soundBuffers[soundId]) {
                const source = this.audioCtx.createBufferSource();
                source.buffer = this.soundBuffers[soundId];
                source.connect(this.audioCtx.destination);
                source.start(0);
            }
        }

        setupInput() {
            window.addEventListener('keydown', (e) => {
                if (!this.isActive || !window.Module || !window.Module._set_key) return;
                
                if ([13, 32, 37, 38, 39, 40].includes(e.keyCode)) {
                    e.preventDefault();
                }
                window.Module._set_key(e.keyCode, true);
            }, { passive: false });

            window.addEventListener('keyup', (e) => {
                if (!this.isActive || !window.Module || !window.Module._set_key) return;
                window.Module._set_key(e.keyCode, false);
            });

            // Mobile button controls
            const mBtns = document.querySelectorAll('.m-btn');
            mBtns.forEach(btn => {
                const keyCode = parseInt(btn.dataset.key, 10);
                if (isNaN(keyCode)) return;

                const press = (e) => {
                    e.preventDefault();
                    if (!this.isActive || !window.Module || !window.Module._set_key) return;
                    window.Module._set_key(keyCode, true);
                };
                const release = (e) => {
                    e.preventDefault();
                    if (!this.isActive || !window.Module || !window.Module._set_key) return;
                    window.Module._set_key(keyCode, false);
                };

                btn.addEventListener('mousedown', press);
                btn.addEventListener('touchstart', press, { passive: false });
                btn.addEventListener('mouseup', release);
                btn.addEventListener('touchend', release, { passive: false });
                btn.addEventListener('mouseleave', release);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new AdventureCinematic();
    });
})();
