// script.js


document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    //  1. Firebaseの初期設定
    // =========================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyDo2SgQbOLvyOgpqKa0cFuBxLTMrfZhqqQ",
        authDomain: "my-portfolio-counter-42d3c.firebaseapp.com",
        projectId: "my-portfolio-counter-42d3c",
        storageBucket: "my-portfolio-counter-42d3c.firebasestorage.app",
        messagingSenderId: "653888609053",
        appId: "1:653888609053:web:f3aafa1cadc24eec8cdff4",
        measurementId: "G-DSBKJGPGYG"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // =========================================================================
    //  2. 認証とメイン機能の初期化
    // =========================================================================
    
    // --- 認証状態を監視し、完了後に各機能を呼び出す ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // 匿名またはGoogleログイン済みのユーザー情報が確定
            // ★★★ 認証完了後にゲストブックの処理を開始する ★★★
            setupGuestbook(user);
        } else {
            // 未ログイン状態なら、匿名でサインインを試みる
            // (成功すると、この onAuthStateChanged が再度呼び出される)
            auth.signInAnonymously().catch(error => {
                console.error("匿名ログインエラー:", error);
                // エラー時もゲストブックは表示する（ボタンは出ない）
                setupGuestbook(null);
            });
        }
    });

    // --- ログイン状態に関係ない機能は先に実行 ---
    const adminLoginButton = document.getElementById('auth-button');
    if (adminLoginButton) {
        adminLoginButton.addEventListener('click', (e) => {
            e.preventDefault();
            alert('管理作業は、専用の管理者パネルから行います');
        });
    }
    setupVisitorCounter();

    // =========================================================================
    //  3. 訪問者カウンター機能
    // =========================================================================
    function setupVisitorCounter() {
        const countRef = db.collection('site').doc('counter');
        const visitorCountElement = document.getElementById('visitor-count');
        const visitedKey = 'aruihayoru-portfolio-visited';

        countRef.onSnapshot(doc => {
            const count = doc.exists ? (doc.data().count || 0) : 0;
            if (visitorCountElement) visitorCountElement.textContent = count;
        }, error => console.error("カウンター読み込みエラー: ", error));

        if (!localStorage.getItem(visitedKey)) {
            db.runTransaction(transaction => {
                return transaction.get(countRef).then(doc => {
                    const newCount = doc.exists ? (doc.data().count || 0) + 1 : 1;
                    transaction.set(countRef, { count: newCount }, { merge: true });
                });
            }).then(() => {
                localStorage.setItem(visitedKey, 'true');
            }).catch(error => console.error("カウンター更新エラー: ", error));
        }
    }

    // =========================================================================
    //  4. ゲストブック機能（本人編集・削除、レスポンシブ折りたたみ付き）
    // =========================================================================
    function setupGuestbook(currentUser) { // ★引数で現在のユーザー情報を受け取る
        const signaturesRef = db.collection('signatures').orderBy('createdAt', 'desc');
        const signatureListContainer = document.getElementById('signature-list');
        const nameInput = document.getElementById('signature-name');
        const submitButton = document.getElementById('submit-signature');
        
        const VISIBLE_COUNT_PC = 6;
        const VISIBLE_COUNT_MOBILE = 3;

        // --- 署名を追加する処理 ---
        if (submitButton) {
            // イベントリスナーの重複を防ぐため、一度古いリスナーを削除して新しいものを設定
            const newSubmitButton = submitButton.cloneNode(true);
            submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

            newSubmitButton.addEventListener('click', () => {
                if (!currentUser) {
                    alert('ユーザー情報の取得中です少し待ってから再度お試しください');
                    return;
                }
                const name = nameInput.value.trim();
                if (name === '') { alert('名前を入力してください'); return; }

                newSubmitButton.disabled = true;
                newSubmitButton.textContent = '送信中...';
                
                db.collection('signatures').add({
                    name: name,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    uid: currentUser.uid // ★認証済みのuidを保存
                }).then(() => {
                    nameInput.value = '';
                }).catch(error => {
                    alert("署名の追加に失敗しました: " + error.message);
                }).finally(() => {
                    newSubmitButton.disabled = false;
                    newSubmitButton.textContent = '署名する';
                });
            });
        }

        // --- 署名リストをリアルタイムで描画 ---
        signaturesRef.onSnapshot(snapshot => {
            if (!signatureListContainer) return;
            signatureListContainer.innerHTML = '';

            if (snapshot.empty) {
                signatureListContainer.innerHTML = '<p style="text-align: center; opacity: 0.7;">まだ誰も署名していません</p>';
                return;
            }

            const gridContainer = document.createElement('div');
            gridContainer.id = 'signature-grid';
            
            const allItems = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ja-JP') : '';
                
                const item = document.createElement('div');
                item.className = 'signature-item';

                const contentDiv = document.createElement('div');
                contentDiv.className = 'content';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'name';
                nameSpan.textContent = data.name;
                const dateSpan = document.createElement('span');
                dateSpan.className = 'date';
                dateSpan.textContent = date;
                contentDiv.appendChild(nameSpan);
                contentDiv.appendChild(dateSpan);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'actions';

                // ★引数で受け取ったcurrentUserと比較し、本人ならボタンを表示
                if (currentUser && currentUser.uid === data.uid) {
                    const editBtn = document.createElement('button');
                    editBtn.textContent = '編集'; editBtn.className = 'edit-btn';
                    editBtn.onclick = () => {
                        const newName = prompt("新しい名前を入力してください:", data.name);
                        if (newName && newName.trim() !== '') {
                            db.collection('signatures').doc(doc.id).update({ name: newName.trim() });
                        }
                    };
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = '削除'; deleteBtn.className = 'delete-btn';
                    deleteBtn.onclick = () => {
                        if (confirm(`「${data.name}」の署名を削除しますか？`)) {
                            db.collection('signatures').doc(doc.id).delete();
                        }
                    };
                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(deleteBtn);
                }
                
                item.appendChild(contentDiv);
                item.appendChild(actionsDiv);
                gridContainer.appendChild(item);
                allItems.push(item);
            });
            
            signatureListContainer.appendChild(gridContainer);
            
            // --- 折りたたみロジック ---
            let isExpanded;
            const isMobile = () => window.innerWidth <= 768;
            const threshold = isMobile() ? VISIBLE_COUNT_MOBILE : VISIBLE_COUNT_PC;

            if (allItems.length > threshold) {
                const toggleButton = document.createElement('button');
                toggleButton.id = 'toggle-signatures-btn';
                signatureListContainer.appendChild(toggleButton);

                const updateViewState = () => {
                    const visibleCount = isMobile() ? VISIBLE_COUNT_MOBILE : VISIBLE_COUNT_PC;
                    allItems.forEach((item, index) => {
                        item.classList.toggle('is-hidden', index >= visibleCount && !isExpanded);
                    });
                    toggleButton.textContent = isExpanded ? '一部を隠す' : 'もっと見る';
                };
                
                toggleButton.addEventListener('click', () => {
                    isExpanded = !isExpanded;
                    updateViewState();
                });

                isExpanded = !isMobile(); // PC:展開, スマホ:折りたたみ
                updateViewState();
            }
        }, error => console.error("署名リストの読み込みエラー:", error));
    }

    // =========================================================================
    //  5. スクロールアニメーション
    // =========================================================================
    let lastScrollY = window.scrollY;
    let isScrollingDown = true;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        isScrollingDown = currentScrollY > lastScrollY;
        lastScrollY = currentScrollY;
    }, { passive: true });
    
    const scrollAnimationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(isScrollingDown ? 'from-bottom' : 'from-top');
                requestAnimationFrame(() => entry.target.classList.add('is-visible'));
            } else {
                entry.target.classList.remove('is-visible', 'from-bottom', 'from-top');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-target').forEach(target => {
        scrollAnimationObserver.observe(target);
    });
});