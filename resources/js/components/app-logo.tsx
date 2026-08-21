import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md">
                <img
                    src="/apple-touch-icon.png"
                    alt={typeof name === 'string' ? name : 'Logo'}
                    className="size-8 rounded-md object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    DK Creative
                </span>
            </div>
        </>
    );
}
