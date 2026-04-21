window.ABS = (function() {
    'use strict';

    const state = {
        isLowPerf: false,
        fps: 60,
        sections: new Map(),
        activeCinematics: new Set(),
        scroll: { y: 0, lastY: 0, delta: 0, progress: 0 },
        viewport: { w: 0, h: 0, dpr: Math.min(window.devicePixelRatio || 1, 2) }
    };

    const registry = {
        hooks: [],
        cinematics: {}
    };

    let rafId = null;
    let observer = null;
    let lastTick = performance.now();
    let frameCount = 0;
    let perfCheckTime = 0;

    function init() {
        if (rafId) return; 
        
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        cacheViewport();
        setupEvents();
        startLoop();
        
        // オリジナルの最大スクロール量を記録（Shining等で増える前）
        setTimeout(() => {
            state.originalMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
        }, 1000);

        console.log('ABS_SYSTEM: Online // DPR:', state.viewport.dpr);
    }

    setupObserver();

    function cacheViewport() {
        state.viewport.w = window.innerWidth;
        state.viewport.h = window.innerHeight;
    }

    function setupObserver() {
        if (observer) return;
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const cinematic = registry.cinematics[id];
                if (!cinematic) return;

                if (entry.isIntersecting) {
                    if (cinematic.start && !state.activeCinematics.has(id)) {
                        cinematic.start();
                        state.activeCinematics.add(id);
                    }
                } else {
                    if (cinematic.stop && state.activeCinematics.has(id)) {
                        cinematic.stop();
                        state.activeCinematics.delete(id);
                    }
                }
            });
        }, { threshold: [0, 0.05, 0.95] });
    }

    function setupEvents() {
        window.addEventListener('resize', debounce(() => {
            cacheViewport();
            registry.hooks.forEach(h => h.onResize && h.onResize(state.viewport));
        }, 150));

        let scrollThrottle = false;
        window.addEventListener('scroll', () => {
            if (scrollThrottle) return;
            scrollThrottle = true;
            
            state.scroll.y = window.scrollY;
            state.scroll.delta = state.scroll.y - state.scroll.lastY;
            state.scroll.lastY = state.scroll.y;
            const maxScroll = document.documentElement.scrollHeight - state.viewport.h;
            state.scroll.progress = state.scroll.y / Math.max(1, maxScroll);
            
            registry.hooks.forEach(h => h.onScroll && h.onScroll(state.scroll));
            
            requestAnimationFrame(() => { scrollThrottle = false; });
        }, { passive: true });
    }

    function startLoop() {
        const tick = (time) => {
            const dt = time - lastTick;
            lastTick = time;
            
            frameCount++;
            perfCheckTime += dt;
            if (perfCheckTime > 1000) {
                state.fps = Math.round((frameCount * 1000) / perfCheckTime);
                state.isLowPerf = state.fps < 45;
                frameCount = 0;
                perfCheckTime = 0;
            }

            for (let i = 0; i < registry.hooks.length; i++) {
                const h = registry.hooks[i];
                if (h.onTick) h.onTick(time, state);
            }

            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
    }

    function registerCinematic(sectionId, instance) {
        const el = document.getElementById(sectionId);
        if (!el) return;
        registry.cinematics[sectionId] = instance;
        if (observer) observer.observe(el);
    }

    function addHook(hook) {
        registry.hooks.push(hook);
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    return {
        init,
        registerCinematic,
        addHook,
        state
    };


})();

document.addEventListener('DOMContentLoaded', () => ABS.init());
