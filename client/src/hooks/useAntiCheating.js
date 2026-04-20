import { useEffect, useRef } from 'react';

const useAntiCheating = ({ enabled, onViolation }) => {
    const onViolationRef = useRef(onViolation);
    const startTimeRef = useRef(0);
    const lastViolationTime = useRef(0);
    const isActiveRef = useRef(false);

    const VIOLATION_COOLDOWN_MS = 3000; 
    const FULLSCREEN_GRACE_MS = 2500;   

    useEffect(() => {
        onViolationRef.current = onViolation;
    }, [onViolation]);

    useEffect(() => {
        if (!enabled) {
            console.log('[AntiCheat] Service Disabled');
            isActiveRef.current = false;
            return;
        }

        console.log('[AntiCheat] Service ACTIVE');
        isActiveRef.current = true;
        startTimeRef.current = Date.now();

        const fire = (type, useGrace = false) => {
            if (!isActiveRef.current) return;
            
            const now = Date.now();
            console.log(`[AntiCheat] Evaluation: ${type} (Grace: ${useGrace})`);
            
            if (useGrace && (now - startTimeRef.current < FULLSCREEN_GRACE_MS)) {
                console.log(`[AntiCheat] Ignored ${type} - within grace period`);
                return;
            }
            
            if (now - lastViolationTime.current < VIOLATION_COOLDOWN_MS) {
                console.log(`[AntiCheat] Ignored ${type} - cooldown active`);
                return;
            }

            console.log(`[AntiCheat] !!! VIOLATION DETECTED: ${type} !!!`);
            lastViolationTime.current = now;
            onViolationRef.current(type);
        };

        const checkFullscreen = () => {
            const isFS = !!(
                document.fullscreenElement || 
                document.webkitFullscreenElement || 
                document.mozFullScreenElement || 
                document.msFullscreenElement
            );
            return isFS;
        };

        // Initial Check - if enabled but not in FS, trigger immediately
        // We delay slightly to allow the browser a moment to settle if just launched
        const initialCheckTimeout = setTimeout(() => {
            if (enabled && !checkFullscreen()) {
                console.log('[AntiCheat] Initial check failed: Not in fullscreen');
                fire('exited-fullscreen', true);
            }
        }, 1000);

        // Visibility Change (Tab Switch / Minimized)
        const handleVisibilityChange = () => {
            const state = document.visibilityState || document.webkitVisibilityState || 'visible';
            console.log(`[AntiCheat] Event: visibilitychange. State: ${state}`);
            if (state === 'hidden' || document.hidden || document.webkitHidden) {
                fire('tab-switch');
            }
        };

        // Window Blur (Window Switch / Focus Lost)
        const handleBlur = () => {
            console.log('[AntiCheat] Event: window blur');
            // Check focus immediately, and then again shortly after
            if (!document.hasFocus()) {
                fire('tab-switch');
            } else {
                setTimeout(() => {
                    if (!document.hasFocus()) {
                        console.log('[AntiCheat] Confirmed blur after timeout');
                        fire('tab-switch');
                        }
                }, 100);
            }
        };

        const handleFocus = () => {
            console.log('[AntiCheat] Event: window focus regained');
        };

        // Fullscreen Change
        const handleFullscreenChange = () => {
            const isFS = checkFullscreen();
            console.log(`[AntiCheat] Event: fullscreenchange. isFS: ${isFS}`);
            if (!isFS) {
                fire('exited-fullscreen', true);
            }
        };

        // Basic Security
        const preventDefault = (e) => e.preventDefault();
        const handleKeys = (e) => {
            // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+P, Alt+Home, etc.
            const isDevTools = e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'));
            const isForbidden = e.ctrlKey && (e.key === 'u' || e.key === 'p' || e.key === 's');
            
            if (isDevTools || isForbidden) {
                e.preventDefault();
                console.log(`[AntiCheat] Blocked shortcut: ${e.key}`);
            }

            // Block Clipboard shortcuts
            if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                e.preventDefault();
                console.log('[AntiCheat] Blocked Clipboard shortcut');
            }
        };

        // Attach listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('webkitvisibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        
        const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        fsEvents.forEach(evt => document.addEventListener(evt, handleFullscreenChange));

        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);
        document.addEventListener('keydown', handleKeys);

        return () => {
            console.log('[AntiCheat] Service Shutting Down');
            isActiveRef.current = false;
            clearTimeout(initialCheckTimeout);
            
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('webkitvisibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            fsEvents.forEach(evt => document.removeEventListener(evt, handleFullscreenChange));

            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
            document.removeEventListener('keydown', handleKeys);

            // Exit fs if cleaning up
            try {
                if (checkFullscreen()) {
                    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
                    if (exit) exit.call(document);
                }
            } catch (e) {}
        };
    }, [enabled]);
};

export default useAntiCheating;

