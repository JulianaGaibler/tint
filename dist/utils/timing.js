// Tiny debounce / throttle without lodash-es. lodash-es pulls in `_root.js`
// which uses `new Function('return this')()` to find the global object, and
// that trips AMO's `DANGEROUS_EVAL` warning in consuming extensions. These
// implementations cover only the call shapes tint uses internally.
export function debounce(fn, wait) {
    let timer;
    const debounced = ((...args) => {
        if (timer !== undefined)
            clearTimeout(timer);
        timer = setTimeout(() => {
            timer = undefined;
            fn(...args);
        }, wait);
    });
    debounced.cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    };
    return debounced;
}
export function throttle(fn, wait) {
    let lastInvoke = 0;
    let timer;
    let trailingArgs;
    const throttled = ((...args) => {
        const now = Date.now();
        const remaining = wait - (now - lastInvoke);
        if (remaining <= 0) {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
            }
            lastInvoke = now;
            trailingArgs = undefined;
            fn(...args);
            return;
        }
        trailingArgs = args;
        if (timer === undefined) {
            timer = setTimeout(() => {
                timer = undefined;
                lastInvoke = Date.now();
                const a = trailingArgs;
                trailingArgs = undefined;
                if (a)
                    fn(...a);
            }, remaining);
        }
    });
    throttled.cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
        trailingArgs = undefined;
        lastInvoke = 0;
    };
    return throttled;
}
