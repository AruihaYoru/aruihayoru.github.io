(function() {
    'use strict';
    // Security/Hidden check - Moved to external file for easy removal/adjustment
    // If this script is removed or the link is broken, the site will default to normal behavior.
    if (new URLSearchParams(window.location.search).get('debug') !== 'true') {
        document.documentElement.innerHTML = '<body><div style="background:#000;color:#333;height:100vh;display:flex;align-items:center;justify-content:center;font-family:monospace;letter-spacing:0.5em;font-size:0.8rem;text-align:center;padding:20px;">SIGNAL_LOST // ERROR_0x000418<br><br><span style="opacity:0.3;font-size:0.6rem;letter-spacing:0.1em;">AUTHORIZATION_REQUIRED_FOR_TERMINAL_ACCESS</span></div></body>';
    }
})();

// ええと、このファイルの意味は？ ない