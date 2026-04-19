class MagneticUI {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || 100, 
            strength: options.strength || 0.3,   
            ...options
        };

        this.targets = [];
        this.mouseX = 0;
        this.mouseY = 0;

        this.init();
    }

    init() {
        const elements = document.querySelectorAll('[data-magnetic]');
        
        this.targets = Array.from(elements).map(el => {
            const customStrength = parseFloat(el.getAttribute('data-magnetic-strength'));
            const customThreshold = parseFloat(el.getAttribute('data-magnetic-threshold'));

            return {
                el: el,
                inner: el.querySelector('.magnetic-inner'),
                strength: isNaN(customStrength) ? this.options.strength : customStrength,
                threshold: isNaN(customThreshold) ? this.options.threshold : customThreshold,
                rect: null,
                currentX: 0,
                currentY: 0
            };
        });

        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, { passive: true });

        window.ABS.addHook({
            onTick: () => this.update(),
            onResize: () => this.refreshRects(),
            onScroll: () => this.refreshRects()
        });

        this.refreshRects();
    }

    refreshRects() {
        this.targets.forEach(t => {
            const r = t.el.getBoundingClientRect();
            t.rect = {
                centerX: r.left + r.width / 2,
                centerY: r.top + r.height / 2
            };
        });
    }

    update() {
        this.targets.forEach(target => {
            if (!target.rect) return;

            const dx = this.mouseX - target.rect.centerX;
            const dy = this.mouseY - target.rect.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let targetX = 0;
            let targetY = 0;

            if (distance < target.threshold) {
                targetX = dx * target.strength;
                targetY = dy * target.strength;
            }

            target.currentX += (targetX - target.currentX) * 0.15;
            target.currentY += (targetY - target.currentY) * 0.15;

            if (Math.abs(target.currentX) < 0.01) target.currentX = 0;
            if (Math.abs(target.currentY) < 0.01) target.currentY = 0;

            target.el.style.transform = `translate3d(${target.currentX}px, ${target.currentY}px, 0)`;
            if (target.inner) {
                target.inner.style.transform = `translate3d(${target.currentX * 0.4}px, ${target.currentY * 0.4}px, 0)`;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.magneticInstance = new MagneticUI();
});
