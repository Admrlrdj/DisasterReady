import type { SVGAttributes } from 'react';

interface AppLogoIconProps extends SVGAttributes<SVGElement> {
    beaconColor?: string;
}

export default function AppLogoIcon({
    beaconColor = 'var(--brand-accent-beacon, #45BEBD)',
    ...props
}: AppLogoIconProps) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M12 2.5L4.5 5.6V11.3C4.5 16.2 7.7 20.6 12 21.8C16.3 20.6 19.5 16.2 19.5 11.3V5.6L12 2.5Z"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="11.5" r="2.75" fill={beaconColor} />
        </svg>
    );
}
