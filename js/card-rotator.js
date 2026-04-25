/**
 * ID Card Dynamic Rotator
 * Calculates card rotation based on viewport width to ensure it always fits.
 */
(function() {
    'use strict';

    function init() {
        const card = document.getElementById('profile-id-card');
        if (!card) return;

        // Integrated Flip Logic
        card.addEventListener('click', () => {
            card.classList.toggle('is-flipped');
        });

        // Proportional Rotation Logic
        function updateRotation() {
            const width = window.innerWidth;
            
            // 設定値
            const desktopWidth = 1200; // 回転を開始
            const mobileWidth = 320;   // 完全に回転
            const startAngle = -2.5;   // デフォ
            const endAngle = 87.5;     // マックス

            // JIS!!!!!!
            const cardW = 856;
            const cardH = 539.8;

            // 画面幅に基づ
            const t = Math.max(0, Math.min(1, (desktopWidth - width) / (desktopWidth - mobileWidth)));
            const targetAngle = startAngle + t * (endAngle - startAngle);

            // バウンディングボックスの幅を算出
            const rad = targetAngle * (Math.PI / 180);
            const boundingWidth = Math.abs(cardW * Math.cos(rad)) + Math.abs(cardH * Math.sin(rad));

            // 3画面内に収めるためのスケール計算
            let targetScale = Math.min(1.0, (width * 0.95) / boundingWidth);
            // あんま縮めたくない

            if (width > desktopWidth && cardW > width * 0.9) {
                targetScale = (width * 0.9) / cardW;
            }
            
            card.style.transform = `translateZ(0) scale(${targetScale}) rotate(${targetAngle}deg)`;
        }

        if (window.ABS && window.ABS.addHook) {
            window.ABS.addHook({
                onResize: () => updateRotation()
            });
        } else {
            window.addEventListener('resize', updateRotation);
        }

        updateRotation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();



document.addEventListener("DOMContentLoaded", () => {
    const card = document.getElementById('profile-id-card');
    if(!card) return;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-placed');
            }
        });
    }, { threshold: 0.3 });
    obs.observe(card);
});