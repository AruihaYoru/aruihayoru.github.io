class MagneticUI {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || 100, // 磁力が効き始める距離 (px)
            strength: options.strength || 0.3,   // 吸い寄せの強さ (0 to 1)
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
            // 要素ごとの設定を読み取る（なければデフォルト値）
            const customStrength = parseFloat(el.getAttribute('data-magnetic-strength'));
            const customThreshold = parseFloat(el.getAttribute('data-magnetic-threshold'));

            return {
                el: el,
                strength: isNaN(customStrength) ? this.options.strength : customStrength,
                threshold: isNaN(customThreshold) ? this.options.threshold : customThreshold,
                x: 0,
                y: 0,
                currentX: 0,
                currentY: 0
            };
        });

        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        this.animate();
    }

    animate() {
        this.targets.forEach(target => {
            const rect = target.el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = this.mouseX - centerX;
            const dy = this.mouseY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let targetX = 0;
            let targetY = 0;

            // 個別の threshold を使用
            if (distance < target.threshold) {
                targetX = dx * target.strength;
                targetY = dy * target.strength;
            }

            // Lerpで動きを滑らかに
            target.currentX += (targetX - target.currentX) * 0.1;
            target.currentY += (targetY - target.currentY) * 0.1;
            // インラインスタイルで反映
            target.el.style.transform = `translate(${target.currentX}px, ${target.currentY}px)`;
            
            const inner = target.el.querySelector('.magnetic-inner');
            if (inner) {
                inner.style.transform = `translate(${target.currentX * 0.5}px, ${target.currentY * 0.5}px)`;
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ローバルに公開
window.initMagnetic = () => {
    if (window.magneticInstance) {
        window.magneticInstance.init();
    } else {
        window.magneticInstance = new MagneticUI();
    }
};

document.addEventListener('DOMContentLoaded', () => {
});
