// Night Market Logo Component - matches official branding
interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
    const sizes = {
        sm: { icon: 'w-8 h-8', text: 'text-base' },
        md: { icon: 'w-10 h-10', text: 'text-xl' },
        lg: { icon: 'w-16 h-16', text: 'text-3xl' },
    };

    const iconSize = sizes[size].icon;
    const textSize = sizes[size].text;

    return (
        <div className={`flex items-center gap-2.5 ${className || ''}`}>
            {/* Minimal Monochromatic Icon */}
            <div className={`relative ${iconSize} transition-transform duration-300 group-hover:scale-105`}>
                <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    className="w-full h-full"
                >
                    <path
                        d="M8 32 C8 16, 16 8, 32 8 C48 8, 56 16, 56 32"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                        className="text-slate-900 dark:text-white"
                        fill="none"
                    />
                    <path
                        d="M20 24 C24 20, 28 28, 32 24 C36 20, 40 28, 44 24"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                        className="text-primary-500"
                        fill="none"
                    />
                    <path
                        d="M16 36 L16 52 C16 56, 20 56, 24 52"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                        className="text-slate-900 dark:text-white"
                        fill="none"
                    />
                    <path
                        d="M48 36 L48 52 C48 56, 44 56, 40 52"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                        className="text-slate-900 dark:text-white"
                        fill="none"
                    />
                </svg>
            </div>

            {/* Text - Clean, small, monochromatic */}
            {showText && (
                <div className={`leading-[1.1] ${textSize} flex flex-col justify-center`}>
                    <span className="font-semibold text-slate-900 dark:text-white tracking-tight">Night</span>
                    <span className="font-light text-slate-400 dark:text-slate-500 tracking-tight -mt-0.5">Market</span>
                </div>
            )}
        </div>
    );
}
