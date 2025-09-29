document.addEventListener('DOMContentLoaded', () => {

	const firebaseConfig = {
		apiKey: "AIzaSyDo2SgQbOLvyOgpqKa0cFuBxLTMrfZhqqQ",
		authDomain: "my-portfolio-counter-42d3c.firebaseapp.com",
		projectId: "my-portfolio-counter-42d3c",
		storageBucket: "my-portfolio-counter-42d3c.firebasestorage.app",
		messagingSenderId: "653888609053",
		appId: "1:653888609053:web:f3aafa1cadc24eec8cdff4",
		measurementId: "G-DSBKJGPGYG"
	};

    const ADMIN_UID = "MFBEiq2e7aZMSJSjO4F5koHFNgn1" ;

    // Firebaseの初期化
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    let currentUser = null;
    let isAdmin = false;

    // --- 0. 認証状態の監視 ---
    auth.onAuthStateChanged(user => {
        currentUser = user;
        isAdmin = user && user.uid === ADMIN_UID;
        
        updateUIForAuthState();

        if (!currentUser) {
            // 未ログインなら匿名認証を試みる
            auth.signInAnonymously().catch(error => console.error("匿名ログインエラー:", error));
        } else {
            console.log(isAdmin ? "管理者としてログイン中:" : "ユーザーとしてログイン中:", currentUser.uid);
            initializeFeatures();
        }
    });

    // 認証状態に応じてUIを更新
    const authButton = document.getElementById('auth-button');
    const adminPanel = document.getElementById('admin-panel');

    function updateUIForAuthState() {
        if (isAdmin) {
            authButton.textContent = 'ログアウト';
            adminPanel.style.display = 'block';
        } else {
            authButton.textContent = '管理者としてログイン';
            adminPanel.style.display = 'none';
        }
        // 署名リストの再描画をトリガー（表示切替のため）
        setupGuestbook(); 
    }
    
    // ログイン/ログアウトボタンの処理
    authButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser && currentUser.uid === ADMIN_UID) {
            // ログアウト処理
            auth.signOut();
        } else {
            // Googleログイン処理
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(error => console.error("Googleログインエラー:", error));
        }
    });


    function initializeFeatures() {
        setupVisitorCounter();
        setupGuestbook();
    }

    // --- 1. 人数カウンター機能 ---
    const countRef = db.collection('site').doc('counter');
    const visitorCountElement = document.getElementById('visitor-count');
    const adminCountInput = document.getElementById('admin-count-input');
    const adminCountSubmit = document.getElementById('admin-count-submit');
    const visitedKey = 'aruihayoru-portfolio-visited';

    function setupVisitorCounter() {
        countRef.onSnapshot(doc => { // onSnapshotでリアルタイム更新に対応
            const count = doc.exists ? doc.data().count : 0;
            visitorCountElement.textContent = count;
            if (isAdmin) {
                adminCountInput.value = count;
            }
        }, error => {
            console.error("カウンターの読み込みエラー: ", error);
        });

        if (!localStorage.getItem(visitedKey) && !isAdmin) { // 管理者はカウントしない
            db.runTransaction(transaction => {
                return transaction.get(countRef).then(doc => {
                    let newCount = doc.exists ? (doc.data().count || 0) + 1 : 1;
                    transaction.set(countRef, { count: newCount }, { merge: true });
                });
            }).then(() => {
                localStorage.setItem(visitedKey, 'true');
            }).catch(error => console.error("カウンター更新エラー: ", error));
        }
    }
    
    // 管理者によるカウンター更新
    adminCountSubmit.addEventListener('click', () => {
        const newCount = parseInt(adminCountInput.value, 10);
        if (!isNaN(newCount)) {
            countRef.set({ count: newCount }).then(() => {
                alert("カウンターを更新しました。");
            }).catch(error => alert("更新に失敗しました: " + error.message));
        }
    });


    // --- 2. 署名機能 (編集・削除対応) ---
    function setupGuestbook() {
        const signaturesRef = db.collection('signatures').orderBy('createdAt', 'desc').limit(20);
        const signatureListElement = document.getElementById('signature-list');
        const nameInput = document.getElementById('signature-name');
        const submitButton = document.getElementById('submit-signature');
        const formArea = document.getElementById('signature-form-area');

        let isEditing = false;
        let editingDocId = null;

        // submitButtonにイベントリスナーが重複しないように一度削除
        const newSubmitButton = submitButton.cloneNode(true);
        submitButton.parentNode.replaceChild(newSubmitButton, submitButton);
        
        newSubmitButton.addEventListener('click', () => {
            if (!currentUser) return alert("ログインが完了するまでお待ちください。");
            
            const name = nameInput.value.trim();
            if (name === '') return alert('名前を入力してください。');

            newSubmitButton.disabled = true;
            newSubmitButton.textContent = '送信中...';

            if (isEditing) {
                db.collection('signatures').doc(editingDocId).update({ name: name })
                    .then(() => cancelEditing())
                    .catch(e => alert("更新失敗:" + e.message))
                    .finally(() => newSubmitButton.disabled = false);
            } else {
                db.collection('signatures').add({
                    name: name,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    uid: currentUser.uid
                }).then(() => nameInput.value = '')
                  .catch(e => alert("追加失敗:" + e.message))
                  .finally(() => {
                      newSubmitButton.disabled = false;
                      newSubmitButton.textContent = '署名する';
                  });
            }
        });

        function startEditing(docId, currentName) {
            isEditing = true; editingDocId = docId;
            nameInput.value = currentName; nameInput.focus();
            newSubmitButton.textContent = '更新する';
            formArea.classList.add('is-editing');
        }

        function cancelEditing() {
            isEditing = false; editingDocId = null;
            nameInput.value = '';
            newSubmitButton.textContent = '署名する';
            formArea.classList.remove('is-editing');
        }

        signaturesRef.onSnapshot(snapshot => {
            signatureListElement.innerHTML = '';
            if (snapshot.empty) {
                signatureListElement.innerHTML = '<p>まだ誰も署名していません。</p>';
                return;
            }
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ja-JP') : '';
                const item = document.createElement('div');
                item.classList.add('signature-item');
                if (isAdmin) item.classList.add('admin-view');
                
                let actionsHtml = '';
                if (isAdmin || (currentUser && currentUser.uid === data.uid)) {
                    actionsHtml = `
                        <div class="actions">
                            <button class="edit-btn" data-id="${doc.id}" data-name="${data.name}">編集</button>
                            <button class="delete-btn" data-id="${doc.id}">削除</button>
                        </div>`;
                }
                item.innerHTML = `<div><span class="name">${data.name}</span><span class="date">${date}</span></div>${actionsHtml}`;
                signatureListElement.appendChild(item);
            });

            signatureListElement.querySelectorAll('.delete-btn').forEach(b => b.onclick = (e) => {
                if (confirm('この署名を削除しますか？')) db.collection('signatures').doc(e.target.dataset.id).delete();
            });
            signatureListElement.querySelectorAll('.edit-btn').forEach(b => b.onclick = (e) => {
                startEditing(e.target.dataset.id, e.target.dataset.name);
            });
        }, error => console.error("署名リストの読み込みエラー:", error));
    }


    // --- ここからスクロールアニメーションのコード ---
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
    document.querySelectorAll('.animate-target').forEach(target => scrollAnimationObserver.observe(target));
});