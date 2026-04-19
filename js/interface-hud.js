class InterfaceHUD {
    constructor() {
        this.elements = {};
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.spring = { x: 0, y: 0, vx: 0, vy: 0, friction: 0.94, tension: 0.1 }; 
        this.startTime = Date.now();
        
        this.init();
    }

    init() {
        const container = document.createElement('div');
        container.id = 'interface-hud';
        document.body.appendChild(container);

        container.innerHTML = `
            <div class="hud-corner top-left">
                <div class="hud-label">SYST_STATUS</div>
                <div class="hud-value" id="hud-status">ACTIVE</div>
                <div class="hud-mini-bar"><div id="hud-bar-time" class="hud-bar-fill"></div></div>
                <div class="hud-data" id="hud-session-time">00:00:00</div>
            </div>
            <div class="hud-corner top-right">
                <div class="hud-label">LOC_DATA</div>
                <div class="hud-data">X: <span id="hud-mouse-x">0000</span></div>
                <div class="hud-data">Y: <span id="hud-mouse-y">0000</span></div>
                <div id="hud-key-inventory">
                    <div class="hud-key-slot" data-key="copper"></div>
                    <div class="hud-key-slot" data-key="silver"></div>
                    <div class="hud-key-slot" data-key="crystal"></div>
                </div>
            </div>
            <div class="hud-corner bottom-left">
                <div class="hud-label">DEPLOY_LOG</div>
                <div id="hud-scroll-prog">000%</div>
                <div class="hud-mini-bar" style="width: 100px;"><div id="hud-bar-scroll" class="hud-bar-fill"></div></div>
                <div class="hud-data" style="font-size: 0.6rem; opacity: 0.3;">KERN_LVL: STABLE</div>
            </div>
            <div class="hud-corner bottom-right">
                <div class="hud-label">IDENT_MARK</div>
                <div class="hud-data">ARUIHA_YORU</div>
                <div class="hud-data" style="opacity: 0.5;">PRTCL_V: 2.0.4-B</div>
            </div>
        `;

        this.container = container;
        // Cache elements
        this.elements.mouseX = document.getElementById('hud-mouse-x');
        this.elements.mouseY = document.getElementById('hud-mouse-y');
        this.elements.sessionTime = document.getElementById('hud-session-time');
        this.elements.barTime = document.getElementById('hud-bar-time');
        this.elements.scrollProg = document.getElementById('hud-scroll-prog');
        this.elements.barScroll = document.getElementById('hud-bar-scroll');

        window.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
        
        // Register hook
        window.ABS.addHook({
            onTick: (t, state) => this.update(t, state),
            onScroll: (s) => this.onScroll(s)
        });
    }

    handleMouseMove(e) {
        this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        
        this.elements.mouseX.innerText = e.clientX.toString().padStart(4, '0');
        this.elements.mouseY.innerText = e.clientY.toString().padStart(4, '0');
    }

    onScroll(scroll) {
        this.spring.vy += scroll.delta * 0.02;
        
        if (!window.shiningUnlocked) {
            const p = Math.round(scroll.progress * 100);
            this.elements.scrollProg.innerText = `${p.toString().padStart(3, '0')}%`;
            this.elements.barScroll.style.width = `${p}%`;
        }
    }

    update(time, state) {
        // Smoothing
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

        const offsetX = this.spring.x * 0.15;
        const offsetY = this.spring.y * 0.15;

        this.container.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;

        const elapsed = Date.now() - this.startTime;
        const sec = Math.floor(elapsed / 1000) % 60;
        const min = Math.floor(elapsed / 60000) % 60;
        const hrs = Math.floor(elapsed / 3600000);
        
        this.elements.sessionTime.innerText = 
            `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        
        this.elements.barTime.style.width = `${(elapsed % 2000) / 20}%`;
    }

    setDeployLog(perc) {
        if (this.elements.scrollProg) this.elements.scrollProg.innerText = `${perc.toString().padStart(3, '0')}%`;
        if (this.elements.barScroll) this.elements.barScroll.style.width = `${Math.min(500, perc)}%`; 
    }

    updateKey(type, color) {
        const slot = this.container.querySelector(`.hud-key-slot[data-key="${type}"]`);
        if (slot) {
            slot.classList.add('active');
            slot.style.backgroundColor = color;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.interfaceHUD = new InterfaceHUD();
});
