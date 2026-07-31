interface Props {
    open?: boolean;
    variant?: 'bg' | 'bg-secondary';
    padded?: boolean;
    element?: HTMLDivElement | undefined;
    summary?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    class?: string;
}
declare const CollapsibleCard: import("svelte").Component<Props, {}, "element" | "open">;
type CollapsibleCard = ReturnType<typeof CollapsibleCard>;
export default CollapsibleCard;
