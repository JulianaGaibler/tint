interface Props {
    id: string;
    value: string;
    label?: string;
    disabled?: boolean;
    filledBackdrop?: boolean;
    elementInput?: HTMLInputElement | undefined;
    elementButton?: HTMLButtonElement | undefined;
    onsearch?: (term: string) => void;
    class?: string;
}
declare const SearchField: import("svelte").Component<Props, {}, "value" | "elementInput" | "elementButton">;
type SearchField = ReturnType<typeof SearchField>;
export default SearchField;
