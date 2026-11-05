import React from 'react'
import dynamic from "next/dynamic";

const ReactTooltip = dynamic(() => import("react-tooltip"), {
  ssr: false,
});

function CreateTooltip({id, background, action, icon, type, effect, text, stylesClass, label = text, disabled = false}) {
    return (
        <div>
            <button type="button" data-tip data-for={id} style={background} onClick={action} className={stylesClass} aria-label={label} disabled={disabled}>
                {icon}
            </button>
            <ReactTooltip id={id} type={type} effect={effect}>
                <span>{text}</span>
            </ReactTooltip>
        </div>
    )
}

export default CreateTooltip
