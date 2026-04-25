const PROJECTS = [
    {
        title: "No-js-Minesweeper",
        description: "とち狂ってたころの作品です。CSSのhasとか、チェックボックスだけでクリア判定とマインスイーパーをします。",
        tag: "wtf",
        size: "medium",
        strength: 0.05,
        url: "https://github.is-a.tokyo/no-js-Minesweeper",
        image: "static/NojsMs.png"
    },
    {
        title: "Hello World!",
        description: "本プログラムは、エンタープライズ級の防御的設計を適用した極めて堅牢なフレームワークです。DIコンテナによる依存性管理、CQRSとイベント駆動、有限状態機械による状態遷移制御など、モダンなアーキテクチャを重層的に採用しています。Web Workerへの処理移譲や指数バックオフ付きリトライ機構を備え、フェイルファスト原則に基づいた厳格な表明により、いかなる環境下でも予測可能かつ安定した動作を保証します。一行一責務を徹底した記述により、追跡可能性と保守性を極限まで高めた設計となっています。",
        tag: "wtf",
        size: "large",
        strength: 0.08,
        url: "https://github.com/AruihaYoru/HelloWorld",
        image: "static/HelloWorld.png"
    },
    {
        title: "PhantomWords",
        description: "文字通り、「ファントム」な「ワード」。存在しない単語と意味が永遠に流れてきます。戯言／虚言ジェネレータ。",
        tag: "game",
        size: "normal",
        strength: 0.1,
        url: "https://github.is-a.tokyo/PhantomWords",
        image: "static/PhantomWords.png"
    },
    {
        title: "gba2mp3",
        description: "mp32gbaの間違いです。具体的に言うと、サウンドを8000Hzに変換して.gbaファイルにコンパイルし、ゲームボーイアドバンスを音声プレイヤーにします。",
        tag: "tool",
        size: "normal",
        strength: 0.1,
        url: "https://github.com/AruihaYoru/gba2mp3",
        image: ""
    },
    {
        title: "Mimi",
        description: "人間やめた人用の音声フォーマットです。チップチューンピコピコ鳴らせて楽しいですよぉ。少し前、作曲家の方とお話しする機会がありまして、目の前でこれ打ち込んで見せたら、クソドン引きされましたね。",
        tag: "WebAudioAPI",
        size: "large",
        strength: 0.08,
        url: "https://github.com/AruihaYoru/Mimi",
        image: "static/mimi.png"
    },
    {
        title: "全国亜住所管理協会",
        description: "「今日の配達物は～....えびの川郡中央県高望特区中原 944-9916。」そんな世界観です。技術的にはPhantomWordsと同じ。また、このころからロゴデザインやウェブデザインを真面目にやり始めてます。",
        tag: "game",
        size: "normal",
        strength: 0.1,
        url: "https://github.is-a.tokyo/Sub-addres",
        image: "static/subaddres.png"
    },
    {
        title: "EzCLI",
        description: "文字通り、EzなCLIです。私が欲しいものを作って配布しているので、クソ便利ですよ。",
        tag: "tool",
        size: "medium",
        strength: 0.1,
        url: "https://github.com/AruihaYoru/EzCLI",
        image: ""
    },
    {
        title: "judgeman-bot",
        description: "領域展開 誅伏賜死。日車寛見の式神「ジャッジマン」を強制的に召喚するDiscord Botです。割と楽しかったですが、公式アカウントが凍結されたため大変。",
        tag: "game",
        size: "medium",
        strength: 0.1,
        url: "https://github.com/AruihaYoru/judgeman-bot",
        image: ""
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
            const card = document.createElement('a'); // Changed to a tag
            card.href = project.url || "#";
            card.target = "_blank"; // Open in new tab
            card.rel = "noopener noreferrer";
            
            // クラスの設定
            card.className = `work-card ${project.size}`;
            card.style.position = "relative"; // 確実に親にする
            card.style.display = "flex";
            card.style.textDecoration = "none";
            card.style.color = "inherit";
            
            // Magneticの付与
            card.setAttribute('data-magnetic', '');
            card.setAttribute('data-magnetic-strength', project.strength || 0.1);
            card.setAttribute('data-magnetic-threshold', '300');


            const hasImage = !!project.image;

            card.innerHTML = `
                <div class="card-visual-wrapper">
                    <div class="card-visual ${hasImage ? '' : 'no-image'}"${hasImage ? ` style="background-image: url('${project.image}');"` : ''}>
                        ${hasImage ? '' : `<div class="no-image-placeholder"><span>NO_IMAGE</span></div>`}
                    </div>
                </div>
                <div class="magnetic-inner card-fill">
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

            // Hover effects
            card.addEventListener('mouseenter', () => {
                const visual = card.querySelector('.card-visual');
                if(visual && project.image) visual.style.opacity = '0.8';
                const btn = card.querySelector('.view-btn');
                if(btn) {
                    btn.style.background = '#000';
                    btn.style.color = '#fff';
                }
            });
            card.addEventListener('mouseleave', () => {
                const visual = card.querySelector('.card-visual');
                if(visual && project.image) visual.style.opacity = '0.4';
                const btn = card.querySelector('.view-btn');
                if(btn) {
                    btn.style.background = 'rgba(0,0,0,0.05)';
                    btn.style.color = 'inherit';
                }
            });

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
