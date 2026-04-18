const PROJECTS = [
    {
        title: "ZUHYO",
        description: "A sophisticated geometric drafting editor for the modern web.",
        size: "large",
        strength: 0.05
    },
    {
        title: "MONOCHROME SPACE",
        description: "Experimental grid system with dynamic scroll triggers.",
        size: "medium",
        strength: 0.08
    },
    {
        title: "NEON CITY",
        description: "WebGL experiments in urban lighting.",
        size: "normal",
        strength: 0.1
    },
    {
        title: "UI/UX",
        description: "Premium component exploration.",
        size: "normal",
        strength: 0.1
    },
    {
        title: "DIGITAL GARDEN",
        description: "A personal repository of thoughts and code snippets.",
        size: "medium",
        strength: 0.08
    },
    {
        title: "QUANTUM",
        description: "Exploring the boundaries of physics and design.",
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
                <div class="bg-accent"></div>
                <div class="magnetic-inner">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                </div>
            `;

            fragment.appendChild(card);
        });

        // コンテナを空にしてから、一気に流し込む
        this.container.innerHTML = '';
        this.container.appendChild(fragment);

        // レンダリングが終わってから磁力システムッッ起動ッ！！
        if (window.initMagnetic) window.initMagnetic();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProjectManager('works-grid');
});
