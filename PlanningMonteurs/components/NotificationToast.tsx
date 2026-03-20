import * as React from "react";

interface NotificationToastProps {
    count: number;
    onView: () => void;
    onDismiss: () => void;
}

/**
 * Admin notification toast for unaffected projects.
 * Slides in from the top-right. Nexans red left border, white background.
 */
const NotificationToast: React.FC<NotificationToastProps> = ({ count, onView, onDismiss }) => {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        // Trigger slide-in animation after mount
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`pm-notification-toast ${visible ? "pm-notification-toast--visible" : ""}`}
            role="alert"
            aria-live="polite"
        >
            <div className="pm-notification-toast-bar" />
            <div className="pm-notification-toast-body">
                <div className="pm-notification-toast-icon">🔔</div>
                <div className="pm-notification-toast-content">
                    <div className="pm-notification-toast-title">Planning Monteurs</div>
                    <div className="pm-notification-toast-message">
                        Il y a <strong>{count}</strong> projet{count > 1 ? "s" : ""} à affecter
                        sur les 8 prochaines semaines.
                    </div>
                </div>
                <div className="pm-notification-toast-actions">
                    <button
                        className="pm-notification-toast-btn pm-notification-toast-btn--view"
                        onClick={onView}
                        type="button"
                    >
                        Voir
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
        </div>
    );
};

export default NotificationToast;
