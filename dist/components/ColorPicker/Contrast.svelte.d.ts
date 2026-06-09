import type { ContrastResult } from '../../color';
import type { ContrastCategory } from './format';
export type CurveMode = 'none' | 'aa' | 'aaa';
interface Props {
    /** Current contrast computation (against the picked color). */
    result: ContrastResult;
    /**
     * Whether the picked color is foreground or background. Only affects the
     * preview square's role labelling.
     */
    role: 'foreground' | 'background';
    /** CSS string for the counterpart color (rendered as the preview backdrop). */
    againstCss: string;
    /** CSS string for the picked color (rendered as the preview foreground). */
    pickedCss: string;
    /** Active WCAG category. Bindable so the parent can read it for curves. */
    category: ContrastCategory;
    /** Active curve overlay mode. Bindable so the parent can read it. */
    curveMode: CurveMode;
    /** Notification when the user picks a new category. */
    onCategoryChange: (c: ContrastCategory) => void;
    /** Notification when the user changes the curve overlay choice. */
    onCurveModeChange: (m: CurveMode) => void;
}
declare const Contrast: import("svelte").Component<Props, {}, "">;
type Contrast = ReturnType<typeof Contrast>;
export default Contrast;
