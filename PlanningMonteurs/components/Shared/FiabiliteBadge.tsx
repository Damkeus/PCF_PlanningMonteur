import * as React from "react";
import { FiabiliteLevel } from "../../types";
import { getFiabiliteColor, getFiabiliteTextColor } from "../../utils/colorUtils";

interface FiabiliteBadgeProps {
    level: FiabiliteLevel;
    onClick?: () => void;
}

/**
 * Pill-shaped badge displaying fiabilité level with color coding.
 */
const FiabiliteBadge: React.FC<FiabiliteBadgeProps> = ({ level, onClick }) => {
    const bg = getFiabiliteColor(level);
    const color = getFiabiliteTextColor(level);

    return (
        <span
            className="pm-fiabilite-badge"
            style={{ backgroundColor: bg, color }}
            onClick={onClick}
            title={`Fiabilité: ${level}`}
        >
            {level}
        </span>
    );
};

export default FiabiliteBadge;
