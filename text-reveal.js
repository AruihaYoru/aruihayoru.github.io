/**
 * text-reveal.js (Library)
 * A standalone, scroll-triggered marker effect with dynamic CSS injection.
 * 
 * Usage:
 * Link this script and add .marker-wrapper class to your elements.
 * Customize with data attributes:
 * - data-marker-color: Custom color (default: black)
 * - data-marker-trigger: Scroll threshold (0-1, default: 0.5)
 */

(function() {
    // Dynamic CSS Injection
    const css = `
        .marker-wrapper {
            position: relative;
            display: inline-block;
            padding: 0.1em 0.2em;
            --accent-color: #000000;
            --marker-width: 0%;
        }

        .marker-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: var(--marker-width);
            background-color: var(--accent-color);
            z-index: 1;
            transition: width 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .marker-text {
            position: relative;
            z-index: 2;
            color: #ffffff;
            mix-blend-mode: difference;
            display: inline-block;
        }
    `;

    const injectCSS = () => {
        if (document.getElementById('text-reveal-styles')) return;
        const style = document.createElement('style');
        style.id = 'text-reveal-styles';
        style.textContent = css;
        document.head.appendChild(style);
    };

    const updateMarkers = (markers) => {
        const vh = window.innerHeight;

        markers.forEach(marker => {
            const rect = marker.getBoundingClientRect();
            const center = rect.top + rect.height / 2;

            const color = marker.getAttribute('data-marker-color');
            const trigger = parseFloat(marker.getAttribute('data-marker-trigger')) || 0.5;
            
            if (color) {
                marker.style.setProperty('--accent-color', color);
            }

            const targetPoint = vh * trigger;
            const startThreshold = vh * (trigger + 0.3); 

            if (center > startThreshold) {
                marker.style.setProperty('--marker-width', '0%');
            } else if (center < targetPoint) {
                marker.style.setProperty('--marker-width', '100%');
            } else {
                const range = startThreshold - targetPoint;
                const progress = ((startThreshold - center) / range) * 100;
                marker.style.setProperty('--marker-width', `${Math.min(100, Math.max(0, progress))}%`);
            }
        });
    };

    const init = () => {
        injectCSS();
        const markers = document.querySelectorAll('.marker-wrapper');
        
        const handler = () => updateMarkers(markers);
        window.addEventListener('scroll', handler, { passive: true });
        window.addEventListener('resize', handler, { passive: true });
        handler(); 
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
