import * as React from "react";
import { LEGEND_ITEMS } from "./constants";

interface LegendProps {
    visible: boolean;
    onClose: () => void;
}

/**
 * Closeable floating legend panel explaining all color codes.
 */
const Legend: React.FC<LegendProps> = ({ visible, onClose }) => {
    if (!visible) return null;

    return (
        <div className="pm-legend">
            <div className="pm-legend-header">
                <span className="pm-legend-title">Légende</span>
                <button className="pm-legend-close" onClick={onClose} type="button">✕</button>
            </div>
            <div className="pm-legend-body">
                {LEGEND_ITEMS.map((item, i) => {
                    if (item.type === "section") {
                        return (
                            <div key={i} className="pm-legend-section">{item.label}</div>
                        );
                    }
                    if (item.type === "color") {
                        return (
                            <div key={i} className="pm-legend-item">
                                <div className="pm-legend-color-swatch" style={{ backgroundColor: item.color }} />
                                <span className="pm-legend-label">{item.label}</span>
                            </div>
                        );
                    }
                    if (item.type === "badge") {
                        return (
                            <div key={i} className="pm-legend-item">
                                <span
                                    className="pm-legend-badge"
                                    style={{
                                        backgroundColor: item.color,
                                        color: (item as { textColor?: string }).textColor || "#fff",
                                    }}
                                >
                                    {item.label.split(" — ")[0]}
                                </span>
                                <span className="pm-legend-label">{item.label.split(" — ")[1]}</span>
                            </div>
                        );
                    }
                    if (item.type === "status") {
                        return (
                            <div key={i} className="pm-legend-item">
                                <div
                                    className="pm-legend-status-swatch"
                                    style={{
                                        backgroundColor: (item as { bg?: string }).bg,
                                        borderColor: item.color,
                                    }}
                                />
                                <span className="pm-legend-label">{item.label}</span>
                            </div>
                        );
                    }
                    if (item.type === "demande") {
                        return (
                            <div key={i} className="pm-legend-item">
                                <div className="pm-legend-demande-swatch" style={{ borderColor: item.color, color: item.color }} >PM</div>
                                <span className="pm-legend-label">{item.label}</span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export default Legend;
