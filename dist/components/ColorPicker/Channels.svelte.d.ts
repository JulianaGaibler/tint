import type { EditorSpace } from './core';
interface Props {
    editor: EditorSpace;
    components: [number, number, number];
    alpha: number;
    showAlpha: boolean;
    /**
     * The canonical hex/CSS string for the current color. The hex field
     * displays this whenever it isn't being actively edited.
     */
    hexOrCss: string;
    onChannel: (index: 0 | 1 | 2, value: number) => void;
    onAlpha: (value: number) => void;
    /**
     * Try to apply `value` as a color. Return true when applied, false when the
     * input couldn't be parsed. On false, the field silently reverts to
     * `hexOrCss` with no red border or error message.
     */
    onHex: (value: string) => boolean;
}
declare const Channels: import("svelte").Component<Props, {}, "">;
type Channels = ReturnType<typeof Channels>;
export default Channels;
