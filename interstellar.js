(function () {
    'use strict';

    // ミラーの惑星
    class ChronoTick {
        constructor() {
            this.ctx = null;
            this.active = false;
        }
        init() {
            if (this.ctx) return;
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        play() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const gain = this.ctx.createGain();
            const osc = this.ctx.createOscillator();
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.12);
        }
        start() {
            if (this.active) return;
            this.active = true;
            this.init();
            this.timerId = setInterval(() => this.play(), 1250);
        }
        stop() { this.active = false; clearInterval(this.timerId); }
    }

    // Morse Signal (STAY)
    // ぶれるような
    class StaySignal {
        constructor() {
            // Morse信号: STAY
            this.sequence = [
				1,0,1,0,1, 0,0,0,                // S
				1,1,1, 0,0,0,                    // T
				1,0,1,1,1, 0,0,0,                // A
				1,1,1,0,1,0,1,1,1,0,1,1,1, 0,0,0 // Y
			];
            this.index = 0;
            this.target = 1.0; 
            this.phase = 1.0;
            this.active = false;
        }
        tick() {
            if (!this.active) return;
            this.target = this.sequence[this.index] > 0 ? 1.0 : -1.0;
            this.index = (this.index + 1) % this.sequence.length;
            setTimeout(() => this.tick(), 180);
        }
        update() {
            if (!this.active) return;
            
            const diff = this.target - this.phase;
            this.phase += diff * 0.15;

            // Add "Over-shoot" .....over-shootっていうらしいです。
            const noise = (Math.random() - 0.5) * 0.2;
            if (Math.random() > 0.95) this.phase += (Math.random() - 0.5) * 1.5;

            this.displayOpacity = 0.4 + (Math.max(-1, Math.min(1, this.phase)) + 1) * 0.3;
            if (this.displayOpacity > 1) this.displayOpacity = 1;

            requestAnimationFrame(() => this.update());
        }
        start() { 
            this.active = true; 
            this.tick(); 
            this.update(); 
        }
        stop() { this.active = false; }
    }

    // 特異点ッ！！ブラックッ・ホールッ！！ （WebGL）
    const FRAG = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_tex;
        uniform vec2 u_mouse;
        uniform float u_intensity;
        uniform float u_aspect;

        void main() {
            vec2 uv = v_uv;
            vec2 m = u_mouse;
            vec2 diff = uv - m;
            diff.x *= u_aspect;
            float dist = length(diff);

            float rs = 0.18 * u_intensity;
            if (dist < rs * 0.4) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                return;
            }

            float distortion = (rs * rs) / (dist * dist + 0.001);
            vec2 dUV = uv - (uv - m) * distortion;
            
            vec4 texColor = texture2D(u_tex, dUV);
            float glow = exp(-dist * 12.0) * u_intensity;
            gl_FragColor = vec4(texColor.rgb + vec3(1.0, 0.7, 0.4) * glow, 1.0);
        }
    `;
    // Xで言った、DOM版は本当に　ブラクラ判定で**また**規制されそうなのでまたいつかの期待に
    //日本の刑法では、相手の意図に反してPCを制御不能にさせたりするプログラムは「ウイルス」なので。
    
    class InterstellarPortfolio {
        constructor(section) {
            this.section = section;
            this.inner = section.querySelector('.interstellar-inner');
            this.canvas = document.createElement('canvas');
            this.gl = this.canvas.getContext('webgl', { alpha: false, antialias: false });
            
            this.sourceCanvas = document.createElement('canvas');
            this.sCtx = this.sourceCanvas.getContext('2d', { alpha: false });
            
            // Cache canvas for static parts
            // なんでtoじゃないんですかね（英語勉強中の或いは）
            this.cacheCanvas = document.createElement('canvas');
            this.cCtx = this.cacheCanvas.getContext('2d', { alpha: false });
            
            this.mouse = { x: 0.5, y: 0.5, curX: 0.5, curY: 0.5, targetI: 0 };
            this.intensity = 0;
            this.signal = new StaySignal();
            this.init();
        }

        init() {
            this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;';
            this.section.insertBefore(this.canvas, this.section.firstChild);
            
            this.inner.style.opacity = '0';
            this.inner.style.pointerEvents = 'none';

            const gl = this.gl;
            const program = gl.createProgram();
            const createShader = (type, src) => {
                const s = gl.createShader(type);
                gl.shaderSource(s, src); gl.compileShader(s); return s;
            };
            gl.attachShader(program, createShader(gl.VERTEX_SHADER, "attribute vec2 v_pos;varying vec2 v_uv;void main(){v_uv=v_pos*0.5+0.5;gl_Position=vec4(v_pos,0.0,1.0);}"));
            gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FRAG));
            gl.linkProgram(program);
            this.prog = program;

            const quad = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
            const pos = gl.getAttribLocation(program, 'v_pos');
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

            this.tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            window.addEventListener('resize', () => {
                this.resize();
                this.preRenderStatic();
            });
            this.section.addEventListener('mousemove', e => {
                const rect = this.section.getBoundingClientRect();
                this.mouse.curX = (e.clientX - rect.left) / rect.width;
                this.mouse.curY = 1.0 - (e.clientY - rect.top) / rect.height;
                this.mouse.targetI = 1.0;
            });
            this.section.addEventListener('mouseleave', () => this.mouse.targetI = 0.0);
            
            this.resize();
            this.preRenderStatic();
            this.render();
            
            // WebGLってJSのわりにむずすぎると思う
        }

        resize() {
            this.W = this.section.offsetWidth;
            this.H = this.section.offsetHeight;
            this.canvas.width = this.sourceCanvas.width = this.cacheCanvas.width = this.W;
            this.canvas.height = this.sourceCanvas.height = this.cacheCanvas.height = this.H;
            this.gl.viewport(0, 0, this.W, this.H);
        }

        preRenderStatic() {
            const ctx = this.cCtx;
            const { W, H } = this;
            ctx.fillStyle = '#fafafc';
            ctx.fillRect(0, 0, W, H);
            
            // Grid
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let x=0; x<W; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,H); }
            for(let y=0; y<H; y+=40) { ctx.moveTo(0,y); ctx.lineTo(W,y); }
            ctx.stroke();

            // Image
            const win = this.inner.querySelector('.observation-window');
            const img = win?.querySelector('.obs-image');
            if (win && img) {
                const r = win.getBoundingClientRect();
                const sR = this.section.getBoundingClientRect();
                const x = r.left - sR.left;
                const y = r.top - sR.top;

                if (img.complete) {
                    ctx.save();
                    ctx.beginPath(); ctx.rect(x, y, r.width, r.height); ctx.clip();
                    const iw = img.naturalWidth, ih = img.naturalHeight;
                    const scale = Math.max(r.width/iw, r.height/ih);
                    ctx.drawImage(img, x+(r.width-iw*scale)/2, y+(r.height-ih*scale)/2, iw*scale, ih*scale);
                    ctx.restore();
                } else {
                    img.onload = () => this.preRenderStatic();
                }
            }
            
            // Description
            ctx.textAlign = 'center';
            const desc = this.inner.querySelector('.interstellar-description')?.textContent || "";
            ctx.font = "400 0.95rem Inter, sans-serif";
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillText(desc, W/2, H*0.32);

            // Infobox
            const infoItems = this.inner.querySelectorAll('.info-item');
            const infoY = H * 0.75;
            const spacing = 320; 
            const startX = W/2 - (infoItems.length - 1) * spacing / 2;
            infoItems.forEach((item, i) => {
                const label = item.querySelector('.info-label')?.textContent || "";
                const val = item.querySelector('.info-value')?.textContent || "";
                ctx.font = "700 0.6rem Inter, sans-serif";
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.fillText(label, startX + i*spacing, infoY);
                ctx.font = "700 0.75rem Inter, sans-serif";
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillText(val, startX + i*spacing, infoY + 20);
            });
        }

        captureContent() {
            const ctx = this.sCtx;
            const { W, H } = this;
            
            // Draw pre-rendered static content
            ctx.drawImage(this.cacheCanvas, 0, 0);

            // Dynamically render blinking Title
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.globalAlpha = this.signal.displayOpacity;
            const title = this.inner.querySelector('.interstellar-title')?.textContent || "";
            ctx.font = "700 3.2rem Inter, sans-serif";
            const jitterX = (Math.random() - 0.5) * (this.intensity * 2);
            ctx.fillText(title, W/2 + jitterX, H*0.25);
            ctx.globalAlpha = 1.0;

            const gl = this.gl;
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.sourceCanvas);
        }

        render() {
            this.captureContent();
            const gl = this.gl;
            this.mouse.x += (this.mouse.curX - this.mouse.x) * 0.12;
            this.mouse.y += (this.mouse.curY - this.mouse.y) * 0.12;
            this.intensity += (this.mouse.targetI - this.intensity) * 0.08;

            gl.useProgram(this.prog);
            gl.uniform2f(gl.getUniformLocation(this.prog, 'u_mouse'), this.mouse.x, this.mouse.y);
            gl.uniform1f(gl.getUniformLocation(this.prog, 'u_intensity'), this.intensity);
            gl.uniform1f(gl.getUniformLocation(this.prog, 'u_aspect'), this.W / this.H);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(() => this.render());
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('section-interstellar');
        if (!section) return;

        const ticker = new ChronoTick();
        const portfolio = new InterstellarPortfolio(section);

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    ticker.start();
                    portfolio.signal.start();
                } else {
                    ticker.stop();
                    portfolio.signal.stop();
                }
            });
        }, { threshold: 0.1 });
        obs.observe(section);
        document.addEventListener('mousedown', () => ticker.init(), { once: true });
    });
})();
