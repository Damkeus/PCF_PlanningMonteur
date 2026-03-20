import * as React from "react";

interface TooltipProps {
    content: string;
    visible: boolean;
    x: number;
    y: number;
}

/**
 * Dark popover tooltip for displaying comment content.
 */
const Tooltip: React.FC<TooltipProps> = ({ content, visible, x, y }) => {
    if (!visible || !content) return null;

    return (
        <div
            className="pm-tooltip"
            style={{
                left: x,
                top: y,
            }}
        >
            <div className="pm-tooltip-content">{content}</div>
            <div className="pm-tooltip-arrow" />
        </div>
    );
};

export default Tooltip;
