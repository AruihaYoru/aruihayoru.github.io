document.addEventListener('DOMContentLoaded', () => {

    // --- 1. スクロールでの要素表示アニメーション ---
    const scrollAnimationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-target').forEach(target => {
        scrollAnimationObserver.observe(target);
    });

    // --- 2. 全要素対象のランダムグリッチエフェクト ---
    const allGlitchableElements = document.querySelectorAll('.glitch');
    const visibleElements = new Set(); // 画面内に表示されている要素を管理

	// グリッチ効果を適用する関数
	const applyGlitch = (target) => {
		if (target.classList.contains('is-glitching')) return; // すでにグリッチ中なら何もしない

		target.dataset.text = target.textContent;

		// 1. グリッチのタイプをランダムに決定 (50%の確率でshake)
		const glitchType = Math.random() < 0.5 ? 'shake' : 'scan';

		// 2. テキストサイズに応じた強度計算
		const fontSize = parseFloat(window.getComputedStyle(target).fontSize);
		// shakeはより激しく見えるように強度を少し上げる
		const intensityMultiplier = (glitchType === 'shake') ? 1.5 : 1;
		const intensity = Math.max(1, (fontSize / 15) * intensityMultiplier); 
		
		// 3. グリッチの継続時間を設定 (shakeは短く、scanは少し長く)
		const duration = (glitchType === 'shake') 
			? 100 + Math.random() * 100  // 100ms ~ 250ms
			: 150 + Math.random() * 400; // 150ms ~ 350ms

		// 4. data-text属性を更新
		target.dataset.text = target.textContent;
		
		// 5. CSSカスタムプロパティで強度を注入
		const offsetX = (Math.random() * intensity).toFixed(2);
		target.style.setProperty('--glitch-offset-x', `${offsetX}px`);

		// 6. グリッチ発動 (タイプに応じたクラスを付与)
		target.classList.add('is-glitching', `glitch-type-${glitchType}`);

		// 7. 一定時間後にグリッチ解除
		setTimeout(() => {
			target.classList.remove('is-glitching', `glitch-type-${glitchType}`);
			target.style.removeProperty('--glitch-offset-x');
		}, duration);
	};


    // 画面内に入った/出た要素を監視
    const glitchObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                visibleElements.add(entry.target);
            } else {
                visibleElements.delete(entry.target);
            }
        });
    });

    allGlitchableElements.forEach(el => glitchObserver.observe(el));

	// メインのグリッチ発生ループ
	const startGlitching = () => {
		// 確率でグリッチを発生させる (例: 25%の確率)
		if (Math.random() < 0.90 && visibleElements.size > 0) {
			const targets = Array.from(visibleElements);
			const randomTarget = targets[Math.floor(Math.random() * targets.length)];
			applyGlitch(randomTarget);
		}
		
		const nextGlitchTime = Math.random() * 50;
		setTimeout(startGlitching, nextGlitchTime);
	};

    // グリッチ開始
    startGlitching();
});
