import * as React from "react";
import { UnaffectedProject } from "../hooks/useNotification";

interface NotificationCardProps {
    projects: UnaffectedProject[];
    onOpenProject: (projectUniqID: string) => void;
    onDismiss: () => void;
}

/**
 * Carte de notification admin : liste les projets pour lesquels les PM ont
 * saisi des dates/demandes de placement mais qui n'ont pas encore été
 * affectés en réel. Un clic sur un projet l'ouvre dans la grille.
 */
const NotificationCard: React.FC<NotificationCardProps> = ({
    projects,
    onOpenProject,
    onDismiss,
}) => {
    const [visible, setVisible] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const count = projects.length;

    React.useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`pm-notification-card ${visible ? "pm-notification-card--visible" : ""} ${expanded ? "pm-notification-card--expanded" : ""}`}
            role="alert"
            aria-live="polite"
        >
            <div className="pm-notification-card-bar" />
            <div className="pm-notification-card-header">
                <div className="pm-notification-toast-icon">🔔</div>
                <div className="pm-notification-card-headtext">
                    <div className="pm-notification-toast-title">Demandes PM en attente</div>
                    <div className="pm-notification-toast-message">
                        <strong>{count}</strong> projet{count > 1 ? "s" : ""} avec des dates
                        souhaitées sans affectation réelle.
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
                    {projects.map((p) => (
                        <button
                            key={p.projectUniqID}
                            className="pm-notification-card-item"
                            onClick={() => onOpenProject(p.projectUniqID)}
                            type="button"
                            title="Ouvrir ce projet dans le planning"
                        >
                            {p.pm && <span className="pm-notification-card-pm">{p.pm}</span>}
                            <span className="pm-notification-card-title">{p.title}</span>
                            <span className="pm-notification-card-weeks">
                                {p.weekStart != null
                                    ? p.weekStart === p.weekEnd
                                        ? `S${p.weekStart}`
                                        : `S${p.weekStart}–S${p.weekEnd}`
                                    : "—"}
                            </span>
                            <span className="pm-notification-card-demande">
                                {p.totalDemande > 0 ? `${Math.round(p.totalDemande)} mont.` : ""}
                            </span>
                            <span className="pm-notification-card-arrow">→</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationCard;
