// For F**k moblie User 
//
// 俺が何週間もかけてこの完璧なレイアウトを作り上げたと思ってんだ。
// お前はこれを横向きで見るんだ。
// 話は以上だ。
//

document.addEventListener('DOMContentLoaded', () => {
    console.log('There is No cake!');
});

(function() {
    'use strict';

    const MOBILE_BREAKPOINT = 768; 
    const OVERLAY_ID = 'orientation-overlay';

    function handleOrientationChange() {
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        const isPortrait = window.innerHeight > window.innerWidth;
        const overlay = document.getElementById(OVERLAY_ID);

        if (isMobile && isPortrait) {
            if (!overlay) createOverlay();
			console.log('!! 横幅768以下からのアクセスを検知')
			console.log('え、君ってスマホ？')
        } else {
            if (overlay) {
                overlay.remove();
                document.body.classList.remove('no-scroll');
                const timerId = parseInt(document.body.dataset.trollTimerId || '0');
                if (timerId) clearInterval(timerId);
            }
        }
    }

    function createOverlay() {
        const styles = `
            body.no-scroll {
                position: fixed;
                width: 100%;
                overflow: hidden;
            }

            #${OVERLAY_ID} {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: #0d1117; z-index: 9999;
                display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
                color: #c9d1d9; font-family: 'Noto Sans JP', sans-serif; padding: 20px; box-sizing: border-box;
            }
            #${OVERLAY_ID} .status-bar {
                position: absolute; top: 0; left: 0; width: 100%; padding: 10px 20px;
                display: flex; justify-content: space-between; align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-weight: 500; font-size: 15px;
            }
            #${OVERLAY_ID} .status-bar-left, #${OVERLAY_ID} .status-bar-right {
                display: flex; align-items: center; gap: 8px;
            }
            #${OVERLAY_ID} .status-bar-left svg, #${OVERLAY_ID} .status-bar-right svg {
                width: 20px; height: 20px; fill: #fff;
            }
            #${OVERLAY_ID} .status-bar p { line-height: 1; }
            #${OVERLAY_ID} .message {
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                flex-grow: 1;
            }
            #${OVERLAY_ID} .rotate-icon {
                width: 120px; height: 120px; margin-bottom: 20px;
                fill: #34d399; animation: rotate-animation 2.5s ease-in-out infinite;
            }
            #${OVERLAY_ID} h3 { font-size: 1.5rem; margin-bottom: 10px; }
            @keyframes rotate-animation {
                0% { transform: rotate(0deg); } 40% { transform: rotate(90deg); }
                60% { transform: rotate(90deg); } 100% { transform: rotate(0deg); }
            }
        `;
        
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const overlayElement = document.createElement('div');
        overlayElement.id = OVERLAY_ID;

        overlayElement.innerHTML = `
            <div class="status-bar">
                <div class="status-bar-left">
                    <p>SIMなし</p>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-120q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM275-325 170-430q59-59 138.5-94.5T480-560q92 0 171.5 35T790-430L685-325q-44-40-94.5-62T480-409q-60 0-110.5 22T275-325ZM105-495 0-600q92-94 215-147t265-53q142 0 265 53t215 147L855-495q-77-73-170-113.5T480-649q-112 0-205 40.5T105-495Z"/></svg>
                </div>
                <div class="status-bar-center" id="troll-clock"><bold>12:00</bold></div>
                <div class="status-bar-right">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-46q-87 0-164.5-32.5t-136-88.5q-58.5-56-94-131.5T46-461h127q3 61 28.5 114t66.5 92q41 39 95.5 61.5T480-171q129 0 218.5-89.5T788-479q0-129-89.5-218.5T480-787q-75 0-139 32.5T235-666h104v125H46v-293h125v49q60-60 139-94.5T480-914q90 0 169 34t138 93q59 59 93 138t34 169q0 90-34 169t-93 138q-59 59-138 93T480-46Zm-80-274q-17 0-28.5-11.5T360-360v-120q0-17 11.5-28.5T400-520v-40q0-33 23.5-56.5T480-640q33 0 56.5 23.5T560-560v40q17 0 28.5 11.5T600-480v120q0 17-11.5 28.5T560-320H400Zm40-200h80v-40q0-17-11.5-28.5T480-600q-17 0-28.5 11.5T440-560v40Z"/></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-46q-81 0-153-31t-125.5-84.5Q148-215 117-287T86-440q0-81 31-153t84.5-125.5Q255-772 327-803t153-31q81 0 153 31t125.5 84.5Q812-665 843-593t31 153q0 81-31 153t-84.5 125.5Q705-108 633-77T480-46Zm0-394Zm104 176 69-69-125-125v-182h-96v224l152 152ZM209-908l68 67L79-643l-67-68 197-197Zm542 0 197 197-67 68-198-198 68-67ZM480-172q112 0 190-78t78-190q0-112-78-190t-190-78q-112 0-190 78t-78 190q0 112 78 190t190 78Z"/></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M388-89H212q-53 0-89.5-36.5T86-215v-265q0-81 31-153t84.5-125.5Q255-812 327-843t153-31q81 0 153 31t125.5 84.5Q812-705 843-633t31 153v265q0 53-36.5 89.5T748-89H572v-382h176v-9q0-111.99-78.01-189.99-78.01-78.01-190-78.01T290-669.99q-78 78-78 189.99v9h176v382ZM262-345h-50v130h50v-130Zm436 0v130h50v-130h-50Zm-436 0h-50 50Zm436 0h50-50Z"/></svg>
                    <p><bold>0%</bold></p>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M157-206q-65.42 0-111.21-45.79Q0-297.58 0-363v-235q0-65 45.79-110.5T157-754h501q65 0 110.5 45.5T814-598v235q0 65.42-45.5 111.21Q723-206 658-206H157Zm1-126h499q13.17 0 22.09-9.5Q688-351 688-364v-233q0-13.17-8.91-22.09Q670.17-628 657-628H158q-13 0-22.5 8.91-9.5 8.92-9.5 22.09v233q0 13 9.5 22.5T158-332Zm696-31v-234h43q26 0 44.5 18.5T960-534v108q0 26-18.5 44.5T897-363h-43Zm-728 31v-296 296Z"/></svg>
                </div>
            </div>
            <div class="message">
                <svg class="rotate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m560 13-89-89 50-50H310q-43 0-73-30t-30-73v-418l126 126v269h188l-49-50 88-89 203 202L560 13Zm193-326L627-439v-269H439l49 50-88 89-203-202 203-202 89 89-50 50h211q43 0 73 30t30 73v418Z"/></svg>
                <h3>画面を横向きにしてください</h3>
                <p>このサイトは、横向き表示での閲覧に最適化されています。</p>
				<p>「スマホだと表示崩れますぅ～～～～」って言われたのでね！</p>
				<p>（あとそれのために署名機能使わないでください、DMにでも送ってもらって、どうぞ。誰が書いたかはちゃんとデータ取ってますからね？）</p>
				<p>画像とかはすべてレスポンシブにしたいので許してください。</p>
				<p>さっさと画面縦向きのロックを外してiPhoneを横にしてやがれくださいませ♡ご主人様♡</p>
            </div>
        `;
        document.body.appendChild(overlayElement);
        
        document.body.classList.add('no-scroll');

        const clockElement = document.getElementById('troll-clock');
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            clockElement.textContent = `${hours}:${minutes}`;
        };
        updateClock();
        const timerId = setInterval(updateClock, 1000);
        document.body.dataset.trollTimerId = timerId;
    }

    window.addEventListener('DOMContentLoaded', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

})();

// -------------------------------------------------------------------------------

/* ちょーちょーちょーじゅうよう！！！

cd "C:\Users\Mecat\Documents\aruihayoru.github.io-main\aruihayoru.github.io-main"
git add .
git commit -m "ここに詳細を入力"
git push

*/

// -------------------------------------------------------------------------------


