export type FilmstripStaticFrame = 'first' | 'last' | number;
export interface FilmstripInstance {
    play(): void;
    pause(): void;
    stop(): void;
    restart(): void;
    seek(frame: number): void;
}
interface Props {
    svg: string;
    duration?: number;
    fps?: number;
    frameCount?: number;
    frameSize?: number;
    renderSize?: number;
    loop?: boolean;
    autoplay?: boolean;
    playing?: boolean;
    staticFrame?: FilmstripStaticFrame;
    label?: string;
    oncomplete?: () => void;
    onplay?: () => void;
    onpause?: () => void;
    class?: string;
}
declare const Filmstrip: import("svelte").Component<Props, {
    play: () => void;
    pause: () => void;
    stop: () => void;
    restart: () => void;
    seek: (frame: number) => void;
}, "playing">;
type Filmstrip = ReturnType<typeof Filmstrip>;
export default Filmstrip;
