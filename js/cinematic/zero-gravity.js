(function () {
    'use strict';

    // あの短さであの面白さだいぶ好き
    class ZeroGravity {
        constructor(section) {
            this.section = section;
            this.canvas = null;
            this.ctx = null;
            this.points = [];
            this.navEls = [];
            this.lastScrollY = window.scrollY;
            this.isInertiaActive = false;
            this.targetScrollY = window.scrollY;
            this.isActive = false;
            this.dpr = 1;

            this.W = 0;
            this.H = 0;
            this.mouseX = -9999;
            this.mouseY = -9999;

            this.build();
        }

        build() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'tether-canvas';
            this.canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;`;
            this.section.style.position = 'relative';
            this.section.insertBefore(this.canvas, this.section.firstChild);

            // コンテキストは一度だけ取得（resize() で再取得しない）
            this.ctx = this.canvas.getContext('2d');

            window.ABS.registerCinematic('section-zero-gravity', {
                start: () => {
                    this.isActive = true;
                    // セクションに入ったとき、スクロール位置を同期
                    this.lastScrollY = window.scrollY;
                    this.targetScrollY = window.scrollY;
                },
                stop: () => {
                    this.isActive = false;
                    this.isInertiaActive = false;
                    // セクション外に出たとき、マウス位置をリセット
                    this.mouseX = -9999;
                    this.mouseY = -9999;
                }
            });

            window.ABS.addHook({
                onResize: () => this.resize(),
                onTick: (t, s) => this.update(t, s)
            });

            // ホイールハンドラ: このセクション内のカーソルのときのみ介入
            this._wheelHandler = (e) => this.handleWheel(e);
            window.addEventListener('wheel', this._wheelHandler, { passive: false });

            // マウスムーブ: セクションがアクティブなときのみ更新
            window.addEventListener('mousemove', (e) => {
                if (!this.isActive) return;
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            }, { passive: true });

            this.resize();
            this.initTethers();
        }

        resize() {
            const { dpr } = window.ABS.state.viewport;
            this.dpr = dpr;
            const newW = this.section.offsetWidth;
            const newH = this.section.offsetHeight;

            // ポイントが初期化済みの場合、origin座標を新サイズに比例更新
            if (this.points.length > 0 && this.W > 0 && this.H > 0) {
                const scaleX = newW / this.W;
                const scaleY = newH / this.H;
                this.points.forEach(p => {
                    p.ox *= scaleX;
                    p.oy *= scaleY;
                    p.x = p.ox;
                    p.y = p.oy;
                    p.vx = 0;
                    p.vy = 0;
                });
            }

            this.W = newW;
            this.H = newH;
            this.canvas.width = this.W * dpr;
            this.canvas.height = this.H * dpr;

            // Bug fix: scale累積を防ぐため setTransform で絶対指定
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        initTethers() {
            const nodeCount = 15;
            this.points = [];
            const anchorX = this.W * 0.12;
            for (let i = 0; i < nodeCount; i++) {
                const oy = (this.H / (nodeCount - 1)) * i;
                this.points.push({
                    x: anchorX,
                    y: oy,
                    ox: anchorX,
                    oy: oy,
                    vx: 0,
                    vy: 0
                });
            }

            // UIラベル用コンテナ
            const container = document.createElement('div');
            container.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;';
            this.section.appendChild(container);

            const menu = ['noconf init', 'noconf connect username@host', 'noconf check', 'noconf deploy', 'noconf start'];
            this.navEls = [];
            menu.forEach((text, i) => {
                const el = document.createElement('div');
                el.textContent = text;
                el.style.cssText = `position:absolute;font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;letter-spacing:0.15em;color:rgba(0,0,0,0.7);text-transform:uppercase;will-change:transform;transition:color 0.4s ease;`;
                container.appendChild(el);
                // ラベルを割り当てるポイントインデックス（均等に分散）
                this.navEls.push({ dom: el, pdi: 2 + i * 2 });
            });
        }

        handleWheel(e) {
            if (!this.isActive) return;

            // セクションの現在のビューポート座標を取得
            const rect = this.section.getBoundingClientRect();
            const isOverSection = e.clientY >= rect.top && e.clientY <= rect.bottom;

            if (!isOverSection) return; // セクション外ならブロックしない

            e.preventDefault();

            if (!this.isInertiaActive) {
                this.targetScrollY = window.scrollY;
            }
            this.targetScrollY += e.deltaY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            this.targetScrollY = Math.max(0, Math.min(maxScroll, this.targetScrollY));
            this.isInertiaActive = true;
        }

        update(time, state) {
            if (!this.isActive) return;

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // 慣性スクロール
            if (this.isInertiaActive) {
                const diff = this.targetScrollY - window.scrollY;
                if (Math.abs(diff) > 0.5) {
                    window.scrollTo(0, window.scrollY + diff * 0.08);
                } else {
                    this.isInertiaActive = false;
                }
            }

            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - this.lastScrollY;
            this.lastScrollY = currentScrollY;

            // スクロールδを一定範囲にクランプして暴走を防ぐ
            const clampedDelta = Math.max(-25, Math.min(25, scrollDelta));

            // === Verlet物理 ===
            const SPRING_K   = 0.012;   // スプリング定数（弱め）
            const FRICTION    = 0.88;    // 摩擦（高めで素早く減衰）
            const MAX_SPEED   = 8.0;     // ノード最大速度
            const DRIFT_AMP_X = 0.025;   // ドリフト振幅（穏やか）
            const DRIFT_AMP_Y = 0.018;
            const REPEL_RADIUS = 200;

            this.points.forEach((p, i) => {
                if (i === 0 || i === this.points.length - 1) {
                    // 両端を固定（スプリングで即座に原点へ）
                    p.x = p.ox;
                    p.y = p.oy;
                    p.vx = 0;
                    p.vy = 0;
                    return;
                }

                // スクロール慣性: 縦方向のみ（横揺れの原因だった vx += scroll は廃止）
                p.vy += clampedDelta * 0.006;

                // 穏やかなゼロG漂流（時間と位置でオフセット、振幅小）
                const phase = time * 0.0008 + i * 0.6;
                p.vx += Math.sin(phase) * DRIFT_AMP_X;
                p.vy += Math.cos(phase + 1.2) * DRIFT_AMP_Y;

                // マウス反発フィールド
                const dxm = p.x - this.mouseX;
                const dym = p.y - this.mouseY;
                const distSq = dxm * dxm + dym * dym;
                if (distSq < REPEL_RADIUS * REPEL_RADIUS && distSq > 0.01) {
                    const dist = Math.sqrt(distSq);
                    const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
                    p.vx += (dxm / dist) * force * 1.5;
                    p.vy += (dym / dist) * force * 1.5;
                }

                // スプリング（原点への引き戻し）
                p.vx += (p.ox - p.x) * SPRING_K;
                p.vy += (p.oy - p.y) * SPRING_K;

                // 摩擦
                p.vx *= FRICTION;
                p.vy *= FRICTION;

                // 速度クランプ（発散防止）
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > MAX_SPEED) {
                    const ratio = MAX_SPEED / speed;
                    p.vx *= ratio;
                    p.vy *= ratio;
                }

                p.x += p.vx;
                p.y += p.vy;
            });

            // === テザー描画（Catmull-Rom風スムーズライン）===
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                const p = this.points[i];
                const prev = this.points[i - 1];
                const cx = (p.x + prev.x) / 2;
                const cy = (p.y + prev.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }
            ctx.lineTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
            ctx.stroke();

            // === ノード描画 ===
            this.points.forEach((p, i) => {
                if (i % 3 === 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.35)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });

            // === UIラベル更新 ===
            this.navEls.forEach(({ dom, pdi }) => {
                const p = this.points[pdi];
                if (!p) return;
                const dx = p.x - p.ox;
                // 回転は変位に比例、クランプして過度な傾きを防ぐ
                const rotateDeg = Math.max(-15, Math.min(15, dx * 0.25));
                dom.style.transform = `translate3d(${p.x + 18}px, ${p.y - 7}px, 0) rotate(${rotateDeg}deg)`;

                const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                dom.style.color = vel > 2.5 ? 'rgba(180,40,40,0.8)' : 'rgba(0,0,0,0.7)';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('section-zero-gravity');
        if (section) new ZeroGravity(section);
    });
})();
