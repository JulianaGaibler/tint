interface Props {
    open?: boolean;
    notClosable?: boolean;
    fullscreen?: boolean;
    align?: 'center' | 'top';
    onclose?: () => void;
    children: import('svelte').Snippet;
    class?: string;
}
declare const Modal: import("svelte").Component<Props, {}, "open">;
type Modal = ReturnType<typeof Modal>;
export default Modal;
