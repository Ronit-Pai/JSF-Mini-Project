import React from 'react';

const paths = {
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    door: <><path d="M14 21H4V3h10v5M14 16v5M10 12h11m-4-4 4 4-4 4" /><path d="M7 12h.01" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    moon: <path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z" />,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></>,
    undo: <><path d="M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12h-3" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z" /><path d="M7 3v6h9V3M7 21v-8h10v8" /></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" /></>,
    download: <><path d="M12 3v13m-5-5 5 5 5-5M4 15v6h16v-6" /></>,
    tools: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="9" cy="18" r="2" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    pencil: <><path d="m16 3 5 5L8 21H3v-5L16 3ZM13 6l5 5M3 16l5 5" /></>,
    eraser: <><path d="m14 3 7 7-11 11H6l-5-5L14 3ZM7 10l7 7M10 21h12" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    users: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 3a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5v2" /></>,
    mouse: <><rect x="5" y="2" width="14" height="20" rx="7" /><path d="M12 2v7M5 10h14" /></>,
    touch: <><path d="M8 13V5a2 2 0 0 1 4 0v7l2-1 6 3v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-4-2l-4-5a2 2 0 0 1 3-2l2 2" /></>,
    room: <><path d="m3 10 9-7 9 7v11H3V10Z" /><path d="M9 21v-8h6v8" /></>,
    link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" /></>,
    info: <><circle cx="12" cy="12" r="10" /><path d="M12 11v6m0-10h.01" /></>,
};

function Icon({name, size = 22, className, style}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={className}
            style={{display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style}}
        >
            {paths[name]}
        </svg>
    );
}

export default Icon;
