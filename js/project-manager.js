const PROJECTS = [
    {
        title: "ZUHYO",
        description: "A sophisticated geometric drafting editor for the modern web.",
        tag: "Application",
        size: "large",
        strength: 0.05
    },
    {
        title: "MONOCHROME",
        description: "Experimental grid system with dynamic scroll triggers.",
        tag: "Motion",
        size: "medium",
        strength: 0.08
    },
    {
        title: "NEON CITY",
        description: "WebGL experiments in urban lighting.",
        tag: "Creative",
        size: "normal",
        strength: 0.1
    },
    {
        title: "UI/UX",
        description: "Premium component exploration.",
        tag: "Design",
        size: "normal",
        strength: 0.1
    },
    {
        title: "DIGITAL GARDEN",
        description: "A personal repository of thoughts and code snippets.",
        tag: "Archive",
        size: "medium",
        strength: 0.08
    },
    {
        title: "QUANTUM",
        description: "Exploring the boundaries of physics and design.",
        tag: "Core",
        size: "normal",
        strength: 0.1
    }
];

class ProjectManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
    }

    render() {
        const fragment = document.createDocumentFragment();

        PROJECTS.forEach(project => {
            const card = document.createElement('div');
            
            // クラスの設定
            card.className = `work-card ${project.size}`;
            
            // Magneticの付与
            card.setAttribute('data-magnetic', '');
            card.setAttribute('data-magnetic-strength', project.strength || 0.1);
            card.setAttribute('data-magnetic-threshold', '300'); // カードは大きいので広めに検知

            card.innerHTML = `
                <div class="card-visual"></div>
                <div class="magnetic-inner" style="width: 100%; height: 100%;">
                    <div class="card-content">
                        <div class="card-header">
                            <span class="project-tag">${project.tag || 'Experimental'}</span>
                            <span class="project-id">#${project.title.substring(0,3).toUpperCase()}_0${PROJECTS.indexOf(project) + 1}</span>
                        </div>
                        <div class="project-meta">
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                        </div>
                        <div class="view-btn">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </div>
                    </div>
                </div>
            `;

            // マウス追従グラデーションのための変数更新
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mouse-x', `${x}%`);
                card.style.setProperty('--mouse-y', `${y}%`);
            });

            fragment.appendChild(card);
        });

        // コンテナを空にしてから、一気に流し込む
        this.container.innerHTML = '';
        this.container.appendChild(fragment);

        // レンダリングが終わってから磁力システムッッ起動ッ！！
        if (window.magneticInstance) window.magneticInstance.refresh();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProjectManager('works-grid');
});
