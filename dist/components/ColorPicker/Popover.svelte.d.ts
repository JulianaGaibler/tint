import { type Color } from '../../color';
import type { ColorFormat, ContrastOptions, WideGamutMode } from './format';
import { type PaletteColor } from './palette';
interface Props {
    value: unknown;
    format: ColorFormat;
    alpha: boolean;
    contrast?: ContrastOptions;
    gamutWarning: boolean;
    wideGamut: WideGamutMode;
    anchorEl: HTMLElement;
    onclose: () => void;
    onpick?: (e: {
        value: unknown;
        color: Color;
    }) => void;
    palette?: PaletteColor[];
}
declare const Popover: import("svelte").Component<Props, {}, "value">;
type Popover = ReturnType<typeof Popover>;
export default Popover;
