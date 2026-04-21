class InterfaceHUD {
    constructor() {
        this.elements = {};
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.spring = { x: 0, y: 0, vx: 0, vy: 0, friction: 0.94, tension: 0.1 }; 
        this.startTime = Date.now();
        this.lastMouseTime = Date.now();
        this.logs = [];
        
        this.init();
    }

    async init() {
        // Reduced restriction to ensure HUD is visible on most devices.
        // The overflow issues are handled by CSS.
        if (window.innerWidth < 500) {
            console.log('ABS_SYSTEM: HUD_DISABLED // Screen too narrow');
            return;
        }

        const container = document.createElement('div');
        container.id = 'interface-hud';
        // Ensure the container itself doesn't cause overflow when transformed
        container.style.overflow = 'hidden'; 
        document.body.appendChild(container);

        container.innerHTML = `
            <div id="hud-inner" style="position:relative; width:100%; height:100%;">
                <div class="hud-corner top-left">
                    <div class="hud-label">SYST_STATUS</div>
                    <div class="hud-value" id="hud-status">ACTIVE</div>
                    <div class="hud-data" style="font-size: 0.65rem;">PERF: <span id="hud-perf-mode">OPTIMAL</span></div>
                    <div class="hud-mini-bar"><div id="hud-bar-time" class="hud-bar-fill"></div></div>
                    <div class="hud-data" id="hud-session-time">00:00:00</div>
                    
                    <div class="hud-label" style="margin-top: 20px;">REPO_INF</div>
                    <div class="hud-data" style="font-size: 0.6rem; color: rgba(0,0,0,0.4);">LAST_COMMIT:</div>
                    <div class="hud-data" id="hud-commit-msg" style="font-size: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">FETCHING...</div>
                    <div class="hud-data" id="hud-commit-author" style="font-size: 0.6rem; opacity: 0.5;">---</div>
                </div>

                <div class="hud-corner top-right">
                    <div class="hud-label">LOC_DATA</div>
                    <div class="hud-data">MX: <span id="hud-mouse-x">0000</span></div>
                    <div class="hud-data">MY: <span id="hud-mouse-y">0000</span></div>
                    <div class="hud-data" style="margin-top:4px;">SY: <span id="hud-scroll-y">00000</span></div>
                    <div class="hud-data">DPR: <span id="hud-dpr">1.0</span></div>
                    
                    <div class="hud-label" style="margin-top: 20px;">ENV_DATA</div>
                    <div class="hud-data">VW: <span id="hud-view-w">0000</span></div>
                    <div class="hud-data">VH: <span id="hud-view-h">0000</span></div>
                    <div class="hud-data">NET: <span id="hud-net-type">UNKNOWN</span></div>

                    <div id="hud-key-inventory" style="margin-top: 15px;">
                        <div class="hud-key-slot" data-key="copper"></div>
                        <div class="hud-key-slot" data-key="jade"></div>
                        <div class="hud-key-slot" data-key="quartz"></div>
                    </div>
                </div>

                <div class="hud-corner bottom-left">
                    <div class="hud-label">SYSTEM_LOG</div>
                    <div id="hud-ticker" class="hud-ticker">
                        <div>> SYSTEM_INITIALIZED</div>
                        <div>> KERNEL_LOADED_OK</div>
                    </div>
                    <div id="hud-scroll-prog" style="margin-top: 15px;">000%</div>
                    <div class="hud-mini-bar" style="width: 100px;"><div id="hud-bar-scroll" class="hud-bar-fill"></div></div>
                    <div class="hud-data" style="font-size: 0.6rem; opacity: 0.3;">KERN_LVL: STABLE</div>
                </div>

                <div class="hud-corner bottom-right">
                    <div class="hud-label">RESOURCE_MONITOR</div>
                    <div class="hud-data" style="font-size:0.75rem;">FPS: <span id="hud-fps">--</span></div>
                    <div class="hud-data" style="font-size:0.75rem;">MEM: <span id="hud-memory">--</span></div>
                    
                    <div class="hud-label" style="margin-top: 20px;">FLAG_REGISTRY</div>
                    <div class="hud-data" style="font-size:0.65rem;">CINEMA: <span id="hud-cinema-count">0</span></div>
                    <div class="hud-data" style="font-size:0.65rem;">ARTIFACTS: <span id="hud-found-count">0</span>/3</div>
                    <div class="hud-data" style="font-size:0.65rem;">ADV: <span id="hud-adv-flag">IDLE</span></div>
                    <div class="hud-mini-bar" style="width: 80px; margin: 4px 0;"><div id="hud-bar-entropy" class="hud-bar-fill"></div></div>
                    <div class="hud-data" style="opacity: 0.5; font-size: 0.6rem;">PRTCL_V: 2.1.0-A</div>
                </div>
            </div>
        `;

        this.container = container;
        this.inner = document.getElementById('hud-inner');
        this.cacheElements();
        this.setupEventListeners();
        this.fetchLatestCommit();
        
        window.ABS.addHook({
            onTick: (t, state) => this.update(t, state),
            onScroll: (s) => this.onScroll(s),
            onResize: (v) => this.onResize(v)
        });

        this.onResize(window.ABS.state.viewport);
        this.addLog("HUD_INTERFACE_READY");
    }

    cacheElements() {
        const ids = [
            'hud-mouse-x', 'hud-mouse-y', 'hud-session-time', 'hud-bar-time',
            'hud-scroll-prog', 'hud-bar-scroll', 'hud-fps', 'hud-cinema-count',
            'hud-adv-flag', 'hud-bar-entropy', 'hud-perf-mode', 'hud-scroll-y',
            'hud-dpr', 'hud-found-count', 'hud-commit-msg', 'hud-commit-author',
            'hud-view-w', 'hud-view-h', 'hud-net-type', 'hud-memory', 'hud-ticker'
        ];
        ids.forEach(id => this.elements[id.replace('hud-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = document.getElementById(id));
    }

    setupEventListeners() {
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
    }

    async fetchLatestCommit() {
        const owner = 'AruihaYoru';
        const repo = 'AruihaYoru.github.io';
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
                headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'aruiha-portfolio' }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    const latest = data[0];
                    this.elements.commitMsg.innerText = latest.commit.message.split('\n')[0];
                    this.elements.commitAuthor.innerText = `@${latest.commit.author.name} // ${new Date(latest.commit.author.date).toLocaleDateString()}`;
                    this.addLog(`NEW_COMMIT_DETECTED: ${latest.sha.substring(0,7)}`);
                }
            }
        } catch (e) {
            this.elements.commitMsg.innerText = "OFFLINE_OR_ERROR";
        }
    }

    handleMouseMove(e) {
        this.lastMouseTime = Date.now();
        this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        
        if (this.elements.mouseX) this.elements.mouseX.innerText = e.clientX.toString().padStart(4, '0');
        if (this.elements.mouseY) this.elements.mouseY.innerText = e.clientY.toString().padStart(4, '0');
    }

    onScroll(scroll) {
        let p = 0;
        const originalMax = window.ABS.state.originalMaxScroll;
        if (originalMax && originalMax > 0) {
            p = Math.round((window.scrollY / originalMax) * 100);
        } else {
            p = Math.round(scroll.progress * 100);
        }

        if (this.elements.scrollProg) this.elements.scrollProg.innerText = `${p.toString().padStart(3, '0')}%`;
        if (this.elements.barScroll) this.elements.barScroll.style.width = `${p}%`;
    }

    onResize(v) {
        if (this.elements.viewW) this.elements.viewW.innerText = v.w.toString().padStart(4, '0');
        if (this.elements.viewH) this.elements.viewH.innerText = v.h.toString().padStart(4, '0');
        if (this.elements.dpr) this.elements.dpr.innerText = v.dpr.toFixed(1);
    }

    addLog(msg) {
        this.logs.push(`> ${msg}`);
        if (this.logs.length > 5) this.logs.shift();
        if (this.elements.ticker) {
            this.elements.ticker.innerHTML = this.logs.map(l => `<div>${l}</div>`).join('');
        }
    }

    update(time, state) {
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

        const maxDrift = 30; // Maximum px drift
        const driftX = Math.max(-maxDrift, Math.min(maxDrift, this.spring.x * 0.15));
        const driftY = Math.max(-maxDrift, Math.min(maxDrift, this.spring.y * 0.15));
        
        if (this.inner) {
            this.inner.style.transform = `translate3d(${driftX}px, ${driftY}px, 0)`;
        }

        const elapsed = Date.now() - this.startTime;
        const sec = Math.floor(elapsed / 1000) % 60;
        const min = Math.floor(elapsed / 60000) % 60;
        const hrs = Math.floor(elapsed / 3600000);
        
        if (this.elements.sessionTime) this.elements.sessionTime.innerText = `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        if (this.elements.barTime) this.elements.barTime.style.width = `${(elapsed % 2000) / 20}%`;

        if (state) {
            if (this.elements.fps) this.elements.fps.innerText = state.fps;
            if (this.elements.cinemaCount) this.elements.cinemaCount.innerText = state.activeCinematics.size;
            if (this.elements.perfMode) this.elements.perfMode.innerText = state.isLowPerf ? "POOR" : "OPTIMAL";
            if (this.elements.scrollY) this.elements.scrollY.innerText = Math.floor(window.scrollY).toString().padStart(5, '0');
        }

        // Memory usage (if available)
        if (window.performance && window.performance.memory && this.elements.memory) {
            const mem = window.performance.memory.usedJSHeapSize / 1048576;
            this.elements.memory.innerText = `${mem.toFixed(1)}MB`;
        }

        // Network status
        if (navigator.connection && this.elements.netType) {
            this.elements.netType.innerText = `${navigator.connection.effectiveType.toUpperCase()} (${navigator.connection.downlink}Mbps)`;
        }

        if (this.elements.foundCount && window.easterEgg) this.elements.foundCount.innerText = window.easterEgg.foundCount;
        if (this.elements.advFlag) this.elements.advFlag.innerText = window.adventureActive ? (window.crystal_key ? "CRYS_KEY" : "ACTIVE") : "IDLE";
        if (this.elements.barEntropy) this.elements.barEntropy.style.width = `${40 + Math.random() * 60}%`;

        // Random log events
        if (Math.random() < 0.005) {
            const events = ["SIGNAL_DRIFT", "SYNC_OK", "BUFFER_CLEARED", "GRID_STABLE", "ENTROPY_LOW"];
            this.addLog(events[Math.floor(Math.random() * events.length)]);
        }
    }

    updateKey(type, color) {
        const slot = this.container.querySelector(`.hud-key-slot[data-key="${type}"]`);
        if (slot) {
            slot.classList.add('active');
            slot.style.backgroundColor = color;
            this.addLog(`KEY_ACQUIRED: ${type.toUpperCase()}`);
        }
    }

    setDeployLog(perc) {
        if (this.elements.scrollProg) this.elements.scrollProg.innerText = `${perc.toString().padStart(3, '0')}%`;
        if (this.elements.barScroll) this.elements.barScroll.style.width = `${perc}%`;
        if (perc > 100 && Math.random() < 0.3) {
            this.addLog(`DEPLOY_OVERRIDE: ${perc}%`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.interfaceHUD = new InterfaceHUD();
});
