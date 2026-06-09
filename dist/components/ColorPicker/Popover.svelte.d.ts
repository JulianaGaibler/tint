import { type Color } from '../../color';
import type { ColorFormat, ContrastOptions, WideGamutMode } from './format';
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
}
declare const Popover: import("svelte").Component<Props, {}, "value">;
type Popover = ReturnType<typeof Popover>;
export default Popover;
