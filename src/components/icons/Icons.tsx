/**
 * SVG icon components for BistroBot UI.
 * Clean line-art style, designed for sidebar nav and chatbot avatar.
 * All icons accept size and color via props, defaulting to 1em/currentColor.
 */

import React from 'react';

interface IconProps {
    size?: number | string;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
}

const defaults: Required<Pick<IconProps, 'size' | 'color'>> = {
    size: '1em',
    color: 'currentColor',
};

/** BistroBot logo — robot/chef face */
export function BotIcon({ size = defaults.size, color = defaults.color, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
            {/* Antenna */}
            <line x1="12" y1="2" x2="12" y2="5" />
            <circle cx="12" cy="2" r="1" fill={color} stroke="none" />
            {/* Head */}
            <rect x="4" y="5" width="16" height="13" rx="3" />
            {/* Eyes */}
            <circle cx="9" cy="11" r="1.5" fill={color} stroke="none" />
            <circle cx="15" cy="11" r="1.5" fill={color} stroke="none" />
            {/* Mouth */}
            <path d="M9 15h6" />
            {/* Ears */}
            <line x1="2" y1="10" x2="4" y2="10" />
            <line x1="20" y1="10" x2="22" y2="10" />
        </svg>
    );
}

/** Chat bubble icon */
export function ChatIcon({ size = defaults.size, color = defaults.color, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="8" y1="9" x2="16" y2="9" />
            <line x1="8" y1="13" x2="13" y2="13" />
        </svg>
    );
}

/** Menu / utensils icon */
export function MenuIcon({ size = defaults.size, color = defaults.color, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
            {/* Fork */}
            <path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" />
            <line x1="6" y1="2" x2="6" y2="11" />
            <line x1="6" y1="11" x2="6" y2="22" />
            {/* Knife */}
            <path d="M18 2a4 4 0 0 1 0 8v12" />
        </svg>
    );
}

/** Package / orders icon */
export function OrdersIcon({ size = defaults.size, color = defaults.color, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
            <path d="M21 8V21H3V8" />
            <rect x="1" y="3" width="22" height="5" rx="1" />
            <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
    );
}

/** Shopping cart icon */
export function CartIcon({ size = defaults.size, color = defaults.color, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    );
}

/** User / person icon */
export function UserIcon({ size = defaults.size, color = defaults.color, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
