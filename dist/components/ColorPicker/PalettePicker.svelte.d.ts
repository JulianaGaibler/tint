import { type PaletteColor } from './palette';
interface Props {
    palette: PaletteColor[];
    /** Current picker value as a CSS color string (already serialized). */
    currentCss: string;
    /** Fires when the user commits a row (click or Enter). */
    onpick: (value: string) => void;
}
declare const PalettePicker: import("svelte").Component<Props, {}, "">;
type PalettePicker = ReturnType<typeof PalettePicker>;
export default PalettePicker;
