import * as React from "react";
import { IDataQualityIssue, DataQualityIssueType } from "../hooks/useDataQuality";

interface DataQualityCardProps {
    title: string;
    issues: IDataQualityIssue[];
    onOpenProject: (projectUniqID: string) => void;
    onDismiss: () => void;
}

const TYPE_LABELS: Record<DataQualityIssueType, string> = {
    "dates-manquantes": "📅 Dates de réalisation manquantes",
    "demande-manquante": "✍️ Input planning manquant",
    "pm-non-attribue": "👤 PM non attribué",
    "monteurs-non-attribues": "👷 Monteurs non attribués",
};

/**
 * Carte de notification "informations importantes non complétées".
 * Réutilisée pour le PM (dates/demandes manquantes sur ses projets)
 * et pour l'admin (PM ou monteurs non attribués).
 */
const DataQualityCard: React.FC<DataQualityCardProps> = ({
    title,
    issues,
    onOpenProject,
    onDismiss,
}) => {
    const [visible, setVisible] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const grouped = React.useMemo(() => {
        const map = new Map<DataQualityIssueType, IDataQualityIssue[]>();
        issues.forEach((issue) => {
            const list = map.get(issue.type) ?? [];
            list.push(issue);
            map.set(issue.type, list);
        });
        return map;
    }, [issues]);

    return (
        <div
            className={`pm-notification-card pm-dataquality-card ${visible ? "pm-notification-card--visible" : ""} ${expanded ? "pm-notification-card--expanded" : ""}`}
            role="alert"
            aria-live="polite"
        >
            <div className="pm-notification-card-bar pm-dataquality-bar" />
            <div className="pm-notification-card-header">
                <div className="pm-notification-toast-icon">📋</div>
                <div className="pm-notification-card-headtext">
                    <div className="pm-notification-toast-title">{title}</div>
                    <div className="pm-notification-toast-message">
                        <strong>{issues.length}</strong> information{issues.length > 1 ? "s" : ""}{" "}
                        importante{issues.length > 1 ? "s" : ""} non complétée{issues.length > 1 ? "s" : ""}.
                    </div>
                </div>
                <div className="pm-notification-toast-actions">
                    <button
                        className="pm-notification-toast-btn pm-notification-toast-btn--view"
                        onClick={() => setExpanded(!expanded)}
                        type="button"
                    >
                        {expanded ? "Réduire" : "Voir"}
                    </button>
                    <button
                        className="pm-notification-toast-btn pm-notification-toast-btn--close"
                        onClick={onDismiss}
                        type="button"
                        aria-label="Fermer la notification"
                    >
                        ✕
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="pm-notification-card-list">
                    {Array.from(grouped.entries()).map(([type, typeIssues]) => (
                        <div key={type} className="pm-dataquality-group">
                            <div className="pm-dataquality-group-label">
                                {TYPE_LABELS[type]} ({typeIssues.length})
                            </div>
                            {typeIssues.map((issue, i) => (
                                <button
                                    key={`${issue.projectUniqID}-${issue.type}-${i}`}
                                    className="pm-notification-card-item"
                                    onClick={() => onOpenProject(issue.projectUniqID)}
                                    type="button"
                                    title={issue.detail}
                                >
                                    {issue.pm && (
                                        <span className="pm-notification-card-pm">{issue.pm}</span>
                                    )}
                                    <span className="pm-notification-card-title">{issue.title}</span>
                                    <span className="pm-notification-card-arrow">→</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DataQualityCard;
