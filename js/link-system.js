/**
 * LinkSystem.js
 * A dynamic link banner injection system.
 * Usage: <div data-link="URL" data-title="Title" data-desc="Description" data-color="#accent" data-image="IMG_URL"></div>
 */

class LinkSystem {
    constructor() {
        this.init();
    }

    init() {
        const elements = document.querySelectorAll('[data-link]');
        elements.forEach(el => {
            if (el.dataset.linkInitialized) return;
            this.render(el);
        });
    }

    render(el) {
        const url = el.getAttribute('data-link');
        const title = el.getAttribute('data-title') || 'LINK';
        const desc = el.getAttribute('data-desc') || '';
        const color = el.getAttribute('data-color') || '#000000';
        const image = el.getAttribute('data-image');
        const theme = el.getAttribute('data-theme') || 'light';

        el.classList.add('link-banner-container');
        el.dataset.linkInitialized = "true";

        const imageHtml = image ? `
            <div class="lb-image" style="background-image: url('${image}')">
                <div class="lb-image-overlay"></div>
            </div>
        ` : '';

        el.innerHTML = `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-banner-inner" style="--accent-color: ${color}">
                ${imageHtml}
                <div class="lb-content">
                    <div class="lb-header">
                        <span class="lb-tag">EXTERNAL_LINK</span>
                        <span class="lb-protocol">SECURE_TRANS_OK</span>
                    </div>
                    <div class="lb-body">
                        <h3 class="lb-title">${title}</h3>
                        ${desc ? `<p class="lb-desc">${desc}</p>` : ''}
                    </div>
                    <div class="lb-footer">
                        <span class="lb-url">${new URL(url).hostname}</span>
                        <svg class="lb-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    </div>
                </div>
            </a>
        `;
    }

    // Call this if you dynamically add data-link elements later
    refresh() {
        this.init();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.linkSystem = new LinkSystem();
});
