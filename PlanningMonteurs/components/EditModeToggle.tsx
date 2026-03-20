import * as React from "react";

interface EditModeToggleProps {
    isEditMode: boolean;
    onToggle: () => void;
}

/**
 * Button to toggle edit mode for drag-and-drop project rescheduling.
 */
const EditModeToggle: React.FC<EditModeToggleProps> = ({ isEditMode, onToggle }) => {
    return (
        <button
            className={`pm-edit-mode-toggle ${isEditMode ? "pm-edit-mode-toggle--active" : ""}`}
            onClick={onToggle}
            type="button"
            title={isEditMode ? "Quitter le mode édition" : "Activer le mode édition (glisser-déposer)"}
        >
            {isEditMode ? (
                <><span className="pm-edit-mode-toggle-icon">🔒</span> Lecture seule</>
            ) : (
                <><span className="pm-edit-mode-toggle-icon">✏️</span> Edit Mode</>
            )}
        </button>
    );
};

export default EditModeToggle;
