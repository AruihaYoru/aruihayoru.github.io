(function() {
    'use strict';

    const selectorsToHide = [
        '*' 
    ];

    const mobileBreakpoint = 768; 

    function checkAndHideElements() {
        if (window.innerWidth <= mobileBreakpoint) {
            selectorsToHide.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.display = 'none';
                }
            });
        } else {
            selectorsToHide.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.display = ''; 
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', checkAndHideElements);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(checkAndHideElements, 250); // 250ミリ秒後に実行
    });

})();