import * as React from "react";
import { IProjectBlock, IWeekInfo, IPlanningAffectation, IPlanningFiabilite, IFicheChantier, PMCode } from "../../types";
import { PROJECT_STATUS_COLORS, PM_LABELS } from "../Shared/constants";
import { getResourceColor } from "../../utils/colorUtils";
import { useDraggable } from "@dnd-kit/core";
import ResourceRow from "./ResourceRow";
import WeekCell from "./WeekCell";

interface ProjectRowProps {
    projectBlock: IProjectBlock;
    weeks: IWeekInfo[];
    currentWeek: number;
    isAdmin: boolean;
    year: number;
    isEditMode: boolean;
    deltaWeeks: number;
    highlighted?: boolean;
    weekCellWidth: number;
    availablePMs: string[];
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
    onSaveFicheChantier?: (record: IFicheChantier) => void;
    onDeleteAffectation: (id: number) => void;
    onToggleExpand: (projectUniqID: string) => void;
    onResetMovement: () => void;
    onShift: (delta: number) => void;
    onMoveAffectation?: (affectation: IPlanningAffectation, direction: -1 | 1) => void;
}

/**
 * Project row with +1/-1 shift buttons, horizontal drag, movement badge, and right-click reset.
 */
const ProjectRow: React.FC<ProjectRowProps> = ({
    projectBlock,
    weeks,
    currentWeek,
    isAdmin,
    year,
    isEditMode,
    deltaWeeks,
    highlighted,
    availablePMs,
    onSaveAffectation,
    onSaveFiabilite,
    onSaveFicheChantier,
    onDeleteAffectation,
    onToggleExpand,
    onResetMovement,
    onShift,
    weekCellWidth,
    onMoveAffectation,
}) => {
    const { project, resourceLines, demandePMLine, isExpanded, status } = projectBlock;
    const pm = project.PM || null;
    const isHorsMarche = !project.CDC;
    const statusConfig = PROJECT_STATUS_COLORS[status];
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);
    const [hiddenResources, setHiddenResources] = React.useState<Set<string>>(new Set());

    const toggleResourceVisibility = (rt: string) => {
        setHiddenResources(prev => {
            const next = new Set(prev);
            if (next.has(rt)) next.delete(rt);
            else next.add(rt);
            return next;
        });
    };

    // DnD — horizontal drag for project shifting
    const canDrag = isEditMode || !isAdmin;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: project.ProjectUniqID,
        data: { startWeek: project.DateDebutSemaine ?? currentWeek },
        disabled: !canDrag,
    });

    // Snap transform to weekCellWidth grid for visual feedback during drag
    const snappedX = transform ? Math.round(transform.x / weekCellWidth) * weekCellWidth : 0;
    const dragStyle: React.CSSProperties | undefined = transform
        ? { transform: `translateX(${snappedX}px)`, transition: "none" }
        : undefined;

    const handleToggle = () => {
        if (!isDragging && !isEditMode) {
            onToggleExpand(project.ProjectUniqID);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (deltaWeeks !== 0) {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
        }
    };

    const handleReset = () => {
        onResetMovement();
        setContextMenu(null);
    };

    // Close context menu on outside click
    React.useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [contextMenu]);

    // Cable specs line
    const specsLine = [
        project.Tension_kV ? `${project.Tension_kV}kV` : null,
        project.Section_mm2 ? `${project.Section_mm2}mm²` : null,
        project.Ame || null,
        project.Longueur_m ? `${project.Longueur_m}m` : null,
    ].filter(Boolean).join(" · ");

    const rowHighlightStyle = highlighted
        ? { outline: "2px solid #E30613", outlineOffset: "-2px", animation: "pm-highlight-pulse 1.5s ease 3" }
        : undefined;

    // Movement direction for arrow indicators
    const movementDirection: "left" | "right" | null =
        deltaWeeks > 0 ? "right" : deltaWeeks < 0 ? "left" : null;

    return (
        <div
            className={`pm-project-row ${isExpanded ? "pm-project-row--expanded" : "pm-project-row--collapsed"} ${isDragging ? "pm-project-row--dragging" : ""}`}
            style={rowHighlightStyle}
            data-project-id={project.ProjectUniqID}
        >
            {/* Project header */}
            <div
                className={`pm-project-header ${canDrag ? "pm-project-header--draggable" : ""}`}
                style={{
                    ...(isEditMode ? { borderLeft: `2px solid ${statusConfig.border}`, backgroundColor: statusConfig.bg } : {}),
                }}
                onClick={handleToggle}
                onContextMenu={handleContextMenu}
                ref={setNodeRef}
                {...listeners}
                {...attributes}
            >
                <div className="pm-project-header-left">
                    {/* Shift buttons: admin in edit mode, viewer always */}
                    {(isEditMode || !isAdmin) && (
                        <div className="pm-shift-buttons">
                            <button
                                className="pm-shift-btn pm-shift-btn--left"
                                onClick={(e) => { e.stopPropagation(); onShift(-1); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                type="button"
                                title="Avancer d'1 semaine"
                            >
                                -1
                            </button>
                            <button
                                className="pm-shift-btn pm-shift-btn--right"
                                onClick={(e) => { e.stopPropagation(); onShift(1); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                type="button"
                                title="Décaler d'1 semaine"
                            >
                                +1
                            </button>
                        </div>
                    )}
                    <span className="pm-project-expand-icon">
                        {isExpanded ? "▾" : "▸"}
                    </span>
                    <div className="pm-project-info">
                        <div className="pm-project-title-row">
                            {/* Status dot (remplace l'ancien badge FRH — le titre passe devant) */}
                            <span
                                className="pm-project-status-dot-standalone"
                                style={{
                                    backgroundColor: statusConfig.border,
                                    borderStyle: statusConfig.borderStyle || "solid",
                                }}
                                title={statusConfig.label}
                            />
                            <span className="pm-project-title">{project.Title}</span>

                            {/* Liaison badge — regroupe FRH + indicateur de liaison quand le projet
                                partage un N° de commande avec d'autres projets */}
                            {project.LiaisonGroup ? (
                                <span className="pm-project-liaison-chip" title={`Liaison — N° commande ${project.NumProjet}`}>
                                    ⛓ Liaison · {project.NumProjet}
                                </span>
                            ) : project.NumProjet ? (
                                <span className="pm-project-frh-chip" title="N° de commande">
                                    {project.NumProjet}
                                </span>
                            ) : null}

                            {/* Attribution PM en ligne — visible pour tous (PM et admin) tant qu'aucun PM n'est attribué */}
                            {!project.PM && onSaveFicheChantier && (
                                <select
                                    className="pm-project-pm-select"
                                    value=""
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                        const newPM = e.target.value as PMCode;
                                        if (newPM) onSaveFicheChantier({ ...project, PM: newPM });
                                    }}
                                    title="Attribuer un PM à ce projet"
                                >
                                    <option value="">⚠ Attribuer PM ▾</option>
                                    {availablePMs.map((code) => (
                                        <option key={code} value={code}>
                                            {PM_LABELS[code as PMCode] ?? code} ({code})
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Movement badge */}
                            {deltaWeeks !== 0 && (
                                <span
                                    className={`pm-movement-badge ${deltaWeeks > 0 ? "pm-movement-badge--delayed" : "pm-movement-badge--advanced"}`}
                                    title={`Décalé de ${Math.abs(deltaWeeks)} semaine${Math.abs(deltaWeeks) > 1 ? "s" : ""} depuis la planification initiale`}
                                >
                                    {deltaWeeks > 0 ? `+${deltaWeeks} sem` : `${deltaWeeks} sem`}
                                </span>
                            )}
                        </div>
                        {isExpanded && specsLine && (
                            <div className="pm-project-specs">{specsLine}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Context menu for reset */}
            {contextMenu && (
                <div
                    className="pm-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        className="pm-context-menu-item"
                        onClick={handleReset}
                        type="button"
                    >
                        Réinitialiser position
                    </button>
                </div>
            )}

            {/* Demande PM row (visible when expanded) */}
            {isExpanded && demandePMLine && (
                <div className="pm-resource-row pm-resource-row--demande">
                    <div className="pm-resource-row-left">
                        <div className="pm-resource-type-indicator" style={{ backgroundColor: "#9C27B0" }} />
                        <span className="pm-resource-type-label pm-resource-type-label--demande">Demande PM</span>
                    </div>
                    <div className="pm-resource-row-right" style={dragStyle}>
                        {weeks.map((w) => {
                            const aff = demandePMLine.weekData.get(w.weekNumber);
                            return (
                                <WeekCell
                                    key={w.weekNumber}
                                    affectation={aff}
                                    resourceType="NxFR"
                                    weekNumber={w.weekNumber}
                                    year={year}
                                    projectUniqID={project.ProjectUniqID}
                                    isCurrentWeek={w.weekNumber === currentWeek}
                                    isAdmin={isAdmin}
                                    isDemandePM={true}
                                    onSave={onSaveAffectation}
                                    onDelete={onDeleteAffectation}
                                    pm={pm}
                                    isHorsMarche={isHorsMarche}
                                    project={project}
                                    weekCellWidth={weekCellWidth}
                                    movementDirection={movementDirection}
                                    isEditMode={isEditMode}
                                    onMoveCell={aff && onMoveAffectation
                                        ? (dir) => onMoveAffectation(aff, dir)
                                        : undefined}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Resource rows (visible when expanded) */}
            {isExpanded && resourceLines.map((rl) => {
                const isHidden = hiddenResources.has(rl.resourceType);
                return (
                    <div key={rl.resourceType} className="pm-resource-row-wrapper">
                        {/* Split toggle bar — separates individual resource */}
                        <div className="pm-resource-split-bar">
                            <button
                                className={`pm-resource-split-btn ${isHidden ? "pm-resource-split-btn--hidden" : ""}`}
                                onClick={() => toggleResourceVisibility(rl.resourceType)}
                                type="button"
                                title={isHidden ? `Afficher ${rl.resourceType}` : `Masquer ${rl.resourceType}`}
                            >
                                {isHidden ? "▸" : "▾"}
                            </button>
                        </div>
                        {!isHidden && (
                            <ResourceRow
                                resourceLine={rl}
                                weeks={weeks}
                                currentWeek={currentWeek}
                                isAdmin={isAdmin}
                                projectUniqID={project.ProjectUniqID}
                                year={year}
                                pm={pm}
                                isHorsMarche={isHorsMarche}
                                onSaveAffectation={onSaveAffectation}
                                onSaveFiabilite={onSaveFiabilite}
                                onDeleteAffectation={onDeleteAffectation}
                                project={project}
                                weekCellWidth={weekCellWidth}
                                movementDirection={movementDirection}
                                dragStyle={dragStyle}
                                isEditMode={isEditMode}
                                onMoveAffectation={onMoveAffectation}
                            />
                        )}
                        {isHidden && (
                            <div className="pm-resource-row-collapsed">
                                <div
                                    className="pm-resource-type-indicator"
                                    style={{ backgroundColor: getResourceColor(rl.resourceType), opacity: 0.5 }}
                                />
                                <span className="pm-resource-type-label pm-resource-type-label--collapsed">{rl.resourceType} — masqué</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectRow;
