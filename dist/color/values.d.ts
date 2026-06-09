export interface RgbValue {
    r: number;
    g: number;
    b: number;
    alpha: number;
}
export interface HslValue {
    h: number;
    s: number;
    l: number;
    alpha: number;
}
export interface OklchValue {
    l: number;
    c: number;
    h: number;
    alpha: number;
}
export interface OklabValue {
    l: number;
    a: number;
    b: number;
    alpha: number;
}
/** Display-P3 RGB. r/g/b are 0-1 (NOT 0-255) to match `color(display-p3 …)`. */
export interface P3Value {
    r: number;
    g: number;
    b: number;
    alpha: number;
}
