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
        <div className={`flex items-center gap-3 ${className || ''}`}>
            {/* Night Market Icon - Storefront with curved awning */}
            <div className={`relative ${iconSize}`}>
                <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    className="w-full h-full"
                >
                    {/* Main storefront shape with curved awning */}
                    <path
                        d="M8 32 C8 16, 16 8, 32 8 C48 8, 56 16, 56 32"
                        stroke="#FDE047"
                        strokeWidth="5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Wavy awning decoration */}
                    <path
                        d="M20 24 C24 20, 28 28, 32 24 C36 20, 40 28, 44 24"
                        stroke="#FDE047"
                        strokeWidth="5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Left leg with curved bottom */}
                    <path
                        d="M16 36 L16 52 C16 56, 20 56, 24 52"
                        stroke="#FDE047"
                        strokeWidth="5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Right leg with curved bottom */}
                    <path
                        d="M48 36 L48 52 C48 56, 44 56, 40 52"
                        stroke="#FDE047"
                        strokeWidth="5"
                        strokeLinecap="round"
                        fill="none"
                    />
                </svg>
            </div>

            {/* Text - "Night" regular weight, "Market" bold, both yellow */}
            {showText && (
                <div className={`leading-tight ${textSize}`}>
                    <span className="font-normal text-[#FDE047] tracking-wide">Night</span>
                    <br />
                    <span className="font-bold text-[#FDE047] tracking-wide">Market</span>
                </div>
            )}
        </div>
    );
}
