// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', () => {

    // アニメーションさせたい要素をすべて取得
    const targets = document.querySelectorAll('.animate-target');

    // 要素が画面に入ったか監視する「監視官」を準備
    const observer = new IntersectionObserver((entries, observer) => {
        // 監視している各要素に対して処理
        entries.forEach(entry => {
            // isIntersectingプロパティがtrue = 画面内に入った
            if (entry.isIntersecting) {
                // is-visibleクラスを追加して、CSSアニメーションを発火
                entry.target.classList.add('is-visible');
                // 一度表示されたら、もう監視する必要はないので監視を解除
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // 要素が10%見えたらトリガー
    });

    // 各要素の監視を開始
    targets.forEach(target => {
        observer.observe(target);
    });

});
