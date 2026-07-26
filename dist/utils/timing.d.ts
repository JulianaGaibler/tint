export interface Cancelable {
    cancel(): void;
}
type AnyFn = (...args: any[]) => any;
export declare function debounce<T extends AnyFn>(fn: T, wait: number): T & Cancelable;
export declare function throttle<T extends AnyFn>(fn: T, wait: number): T & Cancelable;
export {};
