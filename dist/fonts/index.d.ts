export interface FontMetadata {
    url: string;
    family: string;
    weight: number;
    style: 'normal' | 'italic';
    filename: string;
}
export declare const fonts: {
    readonly hkGroteskBold: {
        readonly url: string;
        readonly family: "HK Grotesk";
        readonly weight: 700;
        readonly style: "normal";
        readonly filename: "HKGrotesk-Bold";
    };
    readonly hkGroteskMedium: {
        readonly url: string;
        readonly family: "HK Grotesk";
        readonly weight: 500;
        readonly style: "normal";
        readonly filename: "HKGrotesk-Medium";
    };
    readonly hkGroteskMediumItalic: {
        readonly url: string;
        readonly family: "HK Grotesk";
        readonly weight: 500;
        readonly style: "italic";
        readonly filename: "HKGrotesk-MediumItalic";
    };
    readonly merriweatherBold: {
        readonly url: string;
        readonly family: "Merriweather";
        readonly weight: 700;
        readonly style: "normal";
        readonly filename: "Merriweather-Bold";
    };
    readonly merriweatherItalic: {
        readonly url: string;
        readonly family: "Merriweather";
        readonly weight: 400;
        readonly style: "italic";
        readonly filename: "Merriweather-Italic";
    };
    readonly merriweatherRegular: {
        readonly url: string;
        readonly family: "Merriweather";
        readonly weight: 400;
        readonly style: "normal";
        readonly filename: "Merriweather-Regular";
    };
    readonly azeretMonoRegular: {
        readonly url: string;
        readonly family: "Azeret Mono";
        readonly weight: 400;
        readonly style: "normal";
        readonly filename: "AzeretMono-Regular";
    };
    readonly azeretMonoMedium: {
        readonly url: string;
        readonly family: "Azeret Mono";
        readonly weight: 500;
        readonly style: "normal";
        readonly filename: "AzeretMono-Medium";
    };
    readonly azeretMonoBold: {
        readonly url: string;
        readonly family: "Azeret Mono";
        readonly weight: 700;
        readonly style: "normal";
        readonly filename: "AzeretMono-Bold";
    };
    readonly azeretMonoMediumItalic: {
        readonly url: string;
        readonly family: "Azeret Mono";
        readonly weight: 500;
        readonly style: "italic";
        readonly filename: "AzeretMono-MediumItalic";
    };
};
export type FontKey = keyof typeof fonts;
export declare const fontUrls: string[];
export interface FontPreloadProps {
    rel: 'preload';
    href: string;
    as: 'font';
    type: 'font/woff2';
    crossOrigin: 'anonymous';
}
/**
 * Generate props for font preload link tags
 *
 * @example
 *   // Preload specific fonts
 *   const preloads = getFontPreloads([
 *     'hkGroteskBold',
 *     'merriweatherRegular',
 *   ])
 *
 *   // Preload all fonts
 *   const preloads = getFontPreloads()
 *
 * @param fontKeys - Optional array of font keys to preload. If not provided,
 *   returns all fonts.
 */
export declare function getFontPreloads(fontKeys?: FontKey[]): FontPreloadProps[];
export default fonts;
