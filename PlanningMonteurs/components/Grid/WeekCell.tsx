import * as React from "react";
import { IPlanningAffectation, ResourceType, IFicheChantier } from "../../types";
import { getResourceColor, getResourceBgColor, getResourceTextColor } from "../../utils/colorUtils";
import { RESOURCE_COLORS } from "../Shared/constants";
import CommentEditor from "../Shared/CommentEditor";

interface WeekCellProps {
    affectation: IPlanningAffectation | undefined;
    resourceType: ResourceType;
    weekNumber: number;
    year: number;
    projectUniqID: string;
    isCurrentWeek: boolean;
    isAdmin: boolean;
    isDemandePM?: boolean;
    onSave: (record: IPlanningAffectation) => void;
    onDelete?: (id: number) => void;
    pm: string | null;
    isHorsMarche: boolean;
    /** Project info for the rich comment card */
    project?: IFicheChantier;
    weekCellWidth: number;
    movementDirection?: "left" | "right" | null;
}

const WeekCell: React.FC<WeekCellProps> = ({
    affectation,
    resourceType,
    weekNumber,
    year,
    projectUniqID,
    isCurrentWeek,
    isAdmin,
    isDemandePM,
    onSave,
    onDelete,
    pm,
    isHorsMarche,
    project,
    weekCellWidth,
    movementDirection,
}) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState("");
    const [showCommentEditor, setShowCommentEditor] = React.useState(false);
    const [showInfoCard, setShowInfoCard] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const cellRef = React.useRef<HTMLDivElement>(null);

    const hasMonteurs = affectation && affectation.NbMonteurs > 0;
    const hasComment = affectation?.Commentaire && affectation.Commentaire.trim().length > 0;

    // PERMISSION MODEL:
    // - PM (viewer) can ONLY edit Demande PM rows
    // - Admin (responsable) can ONLY edit real affectation rows (NOT Demande PM)
    const canEdit = isDemandePM ? !isAdmin : isAdmin;

    const handleClick = () => {
        if (!canEdit) return;
        setIsEditing(true);
        setEditValue(hasMonteurs ? affectation!.NbMonteurs.toString() : "");
    };

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const saveValue = () => {
        const num = parseInt(editValue, 10);
        const record: IPlanningAffectation = {
            ...(affectation || {}),
            ProjectUniqID: projectUniqID,
            Year: year,
            WeekNumber: weekNumber,
            ResourceType: resourceType,
            NbMonteurs: isNaN(num) ? 0 : num,
            Commentaire: affectation?.Commentaire || null,
            PM: pm,
            IsHorsMarche: isHorsMarche,
            IsDemandePM: isDemandePM || false,
        };
        if (affectation?.ID) record.ID = affectation.ID;
        onSave(record);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") saveValue();
        else if (e.key === "Escape") setIsEditing(false);
        else if (e.key === "Tab") { e.preventDefault(); saveValue(); }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (affectation?.ID && onDelete) onDelete(affectation.ID);
    };

    const handleCommentSave = (comment: string) => {
        const record: IPlanningAffectation = {
            ...(affectation || {
                ProjectUniqID: projectUniqID, Year: year, WeekNumber: weekNumber,
                ResourceType: resourceType, NbMonteurs: 0, PM: pm,
                IsHorsMarche: isHorsMarche, IsDemandePM: isDemandePM || false,
            }),
            Commentaire: comment || null,
        } as IPlanningAffectation;
        if (affectation?.ID) record.ID = affectation.ID;
        onSave(record);
        setShowCommentEditor(false);
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAdmin) {
            setShowCommentEditor(true);
            setShowInfoCard(false);
        }
    };

    const cellClasses = [
        "pm-week-cell",
        hasMonteurs ? "pm-week-cell--filled" : "pm-week-cell--empty",
        isCurrentWeek ? "pm-week-cell--current" : "",
        canEdit ? "pm-week-cell--admin" : "",
        isDemandePM ? "pm-week-cell--demande" : "",
    ].filter(Boolean).join(" ");

    const demandeColor = "#9C27B0";
    const resColor = getResourceColor(resourceType);

    return (
        <div className={cellClasses} onClick={handleClick} ref={cellRef} style={{ width: weekCellWidth, minWidth: weekCellWidth }}>
            {isCurrentWeek && <div className="pm-week-cell-current-indicator" />}

            {/* Movement arrow indicator */}
            {movementDirection && hasMonteurs && (
                <div className={`pm-movement-arrow pm-movement-arrow--${movementDirection}`}>
                    {movementDirection === "right" ? "\u2192" : "\u2190"}
                </div>
            )}

            {isEditing ? (
                <input
                    ref={inputRef}
                    className="pm-week-cell-input"
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveValue}
                    min={0}
                    onClick={e => e.stopPropagation()}
                />
            ) : hasMonteurs ? (
                <div
                    className="pm-week-cell-value"
                    style={isDemandePM ? {
                        backgroundColor: "rgba(156, 39, 176, 0.12)",
                        borderLeft: `3px solid ${demandeColor}`,
                        color: demandeColor,
                    } : {
                        backgroundColor: getResourceBgColor(resourceType),
                        borderLeft: `3px solid ${resColor}`,
                        color: getResourceTextColor(resourceType),
                    }}
                >
                    {affectation!.NbMonteurs}
                </div>
            ) : canEdit ? (
                <div className="pm-week-cell-empty-indicator">+</div>
            ) : null}

            {/* Delete button — only admin on real affectation, or PM on demande */}
            {canEdit && hasMonteurs && !isEditing && (
                <button
                    className="pm-week-cell-delete"
                    onClick={handleDelete}
                    title="Supprimer"
                    type="button"
                >×</button>
            )}

            {/* Comment mini-card — visible to EVERYONE */}
            {hasComment && (
                <div
                    className="pm-comment-card"
                    onClick={handleCommentClick}
                    onMouseEnter={() => setShowInfoCard(true)}
                    onMouseLeave={() => setShowInfoCard(false)}
                >
                    <span className="pm-comment-card-icon">💬</span>

                    {/* RICH INFO CARD on hover */}
                    {showInfoCard && !showCommentEditor && project && (
                        <div className="pm-info-card" onClick={e => e.stopPropagation()}>
                            <button
                                className="pm-info-card-close"
                                onClick={(e) => { e.stopPropagation(); setShowInfoCard(false); }}
                                type="button"
                            >✕</button>

                            {/* Header: resource type + kV badge */}
                            <div className="pm-info-card-header">
                                <span className="pm-info-card-type">
                                    {isDemandePM ? "DEMANDE PM" : resourceType}
                                </span>
                                {project.Tension_kV && (
                                    <span
                                        className="pm-info-card-badge"
                                        style={{
                                            backgroundColor: isDemandePM ? demandeColor : resColor,
                                        }}
                                    >
                                        {project.Tension_kV}kV
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <div className="pm-info-card-title">{project.Title}</div>
                            <div className="pm-info-card-id">{project.NumProjet}</div>

                            {/* Separator */}
                            <div className="pm-info-card-sep" />

                            {/* Info lines */}
                            <div className="pm-info-card-details">
                                <div className="pm-info-card-row">
                                    <span className="pm-info-card-label">PM:</span>
                                    <span className="pm-info-card-value">{pm || "N/A"}</span>
                                </div>
                                <div className="pm-info-card-row">
                                    <span className="pm-info-card-label">Semaine:</span>
                                    <span className="pm-info-card-value">S{weekNumber}</span>
                                </div>
                                {hasMonteurs && (
                                    <div className="pm-info-card-row">
                                        <span className="pm-info-card-label">Monteurs:</span>
                                        <span className="pm-info-card-value pm-info-card-value--bold">
                                            {affectation!.NbMonteurs}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="pm-info-card-sep" />

                            {/* Comment */}
                            <div className="pm-info-card-comment">
                                <span className="pm-info-card-comment-icon">💬</span>
                                <span className="pm-info-card-comment-text">
                                    {affectation!.Commentaire}
                                </span>
                            </div>

                            {/* Ouvrage en cours */}
                            <div className="pm-info-card-footer">
                                <div className="pm-info-card-ouvrage">
                                    <span
                                        className="pm-info-card-ouvrage-dot"
                                        style={{ backgroundColor: isDemandePM ? demandeColor : resColor }}
                                    />
                                    <span className="pm-info-card-ouvrage-text">
                                        {isDemandePM ? "Demande en cours" : "Ouvrage en cours"}
                                    </span>
                                </div>
                                {project.Section_mm2 && (
                                    <span className="pm-info-card-spec">
                                        {project.Section_mm2}mm² · {project.Ame}
                                        {project.Longueur_m ? ` · ${project.Longueur_m}m` : ""}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Comment add for authorized users (no comment yet, filled cell) */}
            {!hasComment && canEdit && hasMonteurs && (
                <div
                    className="pm-comment-card pm-comment-card--add"
                    onClick={handleCommentClick}
                    title="Ajouter un commentaire"
                >
                    <span className="pm-comment-card-icon">+</span>
                </div>
            )}

            {/* Comment editor */}
            {showCommentEditor && (
                <div className="pm-comment-editor-container" onClick={e => e.stopPropagation()}>
                    <CommentEditor
                        value={affectation?.Commentaire || ""}
                        onSave={handleCommentSave}
                        onCancel={() => setShowCommentEditor(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default WeekCell;
