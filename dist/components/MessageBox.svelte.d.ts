interface Props {
    icon?: string | undefined;
    tone?: 'neutral' | 'warning';
    element?: HTMLDivElement | undefined;
    children?: import('svelte').Snippet;
    actions?: import('svelte').Snippet;
    onclose?: (e: MouseEvent) => void;
    class?: string;
}
declare const MessageBox: import("svelte").Component<Props, {}, "element">;
type MessageBox = ReturnType<typeof MessageBox>;
export default MessageBox;
