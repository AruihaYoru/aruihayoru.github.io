class InterfaceHUD {
    constructor() {
        this.container = null;
        this.elements = {};
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.rotation = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.spring = { x: 0, y: 0, vx: 0, vy: 0, friction: 0.94, tension: 0.1 }; 
        this.scroll = { last: 0, delta: 0 };
        this.startTime = Date.now();
        
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'interface-hud';
        document.body.appendChild(this.container);

        this.container.innerHTML = `
            <div class="hud-corner top-left" style="transform: rotateX(-5deg) rotateY(10deg);">
                <div class="hud-label">SYST_STATUS</div>
                <div class="hud-value" id="hud-status">ACTIVE</div>
                <div class="hud-mini-bar"><div id="hud-bar-time" class="hud-bar-fill"></div></div>
                <div class="hud-data" id="hud-session-time">00:00:00</div>
            </div>
            <div class="hud-corner top-right" style="transform: rotateX(-5deg) rotateY(-10deg);">
                <div class="hud-label">LOC_DATA</div>
                <div class="hud-data">X: <span id="hud-mouse-x">0</span></div>
                <div class="hud-data">Y: <span id="hud-mouse-y">0</span></div>
                
                <!-- Integrated Easter Egg Key Slots -->
                <div id="hud-key-inventory">
                    <div class="hud-key-slot" data-key="copper"></div>
                    <div class="hud-key-slot" data-key="silver"></div>
                    <div class="hud-key-slot" data-key="crystal"></div>
                </div>
            </div>
            <div class="hud-corner bottom-left" style="transform: rotateX(5deg) rotateY(10deg);">
                <div class="hud-label">DEPLOY_LOG</div>
                <div id="hud-scroll-prog">000%</div>
                <div class="hud-mini-bar" style="width: 100px;"><div id="hud-bar-scroll" class="hud-bar-fill"></div></div>
                <div class="hud-data" style="font-size: 0.6rem; opacity: 0.3;">KERN_LVL: STABLE</div>
            </div>
            <div class="hud-corner bottom-right" style="transform: rotateX(5deg) rotateY(-10deg);">
                <div class="hud-label">IDENT_MARK</div>
                <div class="hud-data">ARUIHA_YORU</div>
                <div class="hud-data" style="opacity: 0.5;">PRTCL_V: 2.0.4-B</div>
            </div>
        `;

        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        
        this.animate();
    }

    handleMouseMove(e) {
        this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        
        document.getElementById('hud-mouse-x').innerText = e.clientX.toString().padStart(4, '0');
        document.getElementById('hud-mouse-y').innerText = e.clientY.toString().padStart(4, '0');
    }

    handleScroll() {
        const currentScroll = window.scrollY;
        const delta = currentScroll - this.scroll.last;
        this.scroll.delta = delta;
        this.scroll.last = currentScroll;

        this.spring.vy += delta * 0.02;
        
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const prog = Math.round((currentScroll / Math.max(1, maxScroll)) * 100);
        
        if (!window.shiningUnlocked) {
            document.getElementById('hud-scroll-prog').innerText = `${prog.toString().padStart(3, '0')}%`;
            document.getElementById('hud-bar-scroll').style.width = `${prog}%`;
        }
    }

    updateKey(type, color) {
        const slot = this.container.querySelector(`.hud-key-slot[data-key="${type}"]`);
        if (slot) {
            slot.classList.add('active');
            slot.style.backgroundColor = color;
            slot.animate([
                { opacity: 0.5, transform: 'scale(1.2)' },
                { opacity: 1, transform: 'scale(1)' }
            ], { duration: 400, easing: 'ease-out' });
        }
    }

    animate() {
        // 多分今までやった中で本当にめんどくさいマジックナンバー探しだったかも。
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

        const ax = (this.mouse.x * 8 - this.spring.x) * this.spring.tension;
        const ay = (this.mouse.y * 8 - this.spring.y) * this.spring.tension;
        
        this.spring.vx += ax;
        this.spring.vy += ay;
        this.spring.vx *= this.spring.friction;
        this.spring.vy *= this.spring.friction;
        this.spring.x += this.spring.vx;
        this.spring.y += this.spring.vy;

        const rotX = 0; 
        const rotY = 0;
        const rotZ = 0;

        const offsetX = this.spring.x * 0.15;
        const offsetY = this.spring.y * 0.15;

        this.container.style.transform = `
            perspective(3000px) 
            rotateX(${rotX}deg) 
            rotateY(${rotY}deg)
            rotateZ(${rotZ}deg)
            translate3d(${offsetX}px, ${offsetY}px, 0)
        `;

        const elapsed = Date.now() - this.startTime;
        const sec = Math.floor(elapsed / 1000) % 60;
        const min = Math.floor(elapsed / 60000) % 60;
        const hrs = Math.floor(elapsed / 3600000);
        document.getElementById('hud-session-time').innerText = 
            `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        
        document.getElementById('hud-bar-time').style.width = `${(elapsed % 2000) / 20}%`;

        requestAnimationFrame(() => this.animate());
    }
    setDeployLog(perc) {
        const el = document.getElementById('hud-scroll-prog');
        const bar = document.getElementById('hud-bar-scroll');
        if (el) el.innerText = `${perc.toString().padStart(3, '0')}%`;
        // ええと、シャイニングんとこは100%以上をかかせます
        if (bar) bar.style.width = `${Math.min(500, perc)}%`; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.interfaceHUD = new InterfaceHUD();
});
