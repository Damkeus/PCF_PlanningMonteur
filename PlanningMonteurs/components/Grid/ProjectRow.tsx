import * as React from "react";
import { IProjectBlock, IWeekInfo, IPlanningAffectation, IPlanningFiabilite } from "../../types";
import { PROJECT_STATUS_COLORS } from "../Shared/constants";
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
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
    onDeleteAffectation: (id: number) => void;
    onToggleExpand: (projectUniqID: string) => void;
    onResetMovement: () => void;
    onShift: (delta: number) => void;
}

/**
 * Project row with +1/-1 shift buttons, movement badge, and right-click reset.
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
    onSaveAffectation,
    onSaveFiabilite,
    onDeleteAffectation,
    onToggleExpand,
    onResetMovement,
    onShift,
    weekCellWidth,
}) => {
    const { project, resourceLines, demandePMLine, isExpanded, status } = projectBlock;
    const pm = project.PM || null;
    const isHorsMarche = !project.CDC;
    const statusConfig = PROJECT_STATUS_COLORS[status];
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);

    const handleToggle = () => {
        if (!isEditMode) {
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

    return (
        <div
            className={`pm-project-row ${isExpanded ? "pm-project-row--expanded" : "pm-project-row--collapsed"}`}
            style={rowHighlightStyle}
        >
            {/* Project header */}
            <div
                className="pm-project-header"
                style={{
                    ...(isEditMode ? { borderLeft: `2px solid ${statusConfig.border}`, backgroundColor: statusConfig.bg } : {}),
                }}
                onClick={handleToggle}
                onContextMenu={handleContextMenu}
            >
                <div className="pm-project-header-left">
                    {/* Shift buttons in edit mode */}
                    {isEditMode && (
                        <div className="pm-shift-buttons">
                            <button
                                className="pm-shift-btn pm-shift-btn--left"
                                onClick={(e) => { e.stopPropagation(); onShift(-1); }}
                                type="button"
                                title="Avancer d'1 semaine"
                            >
                                -1
                            </button>
                            <button
                                className="pm-shift-btn pm-shift-btn--right"
                                onClick={(e) => { e.stopPropagation(); onShift(1); }}
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
                            {/* Status card on project ID */}
                            <span
                                className="pm-project-status-card"
                                style={{
                                    backgroundColor: statusConfig.bg,
                                    borderColor: statusConfig.border,
                                    borderStyle: statusConfig.borderStyle || "solid",
                                    color: statusConfig.text,
                                }}
                                title={statusConfig.label}
                            >
                                <span className="pm-project-status-dot" style={{ backgroundColor: statusConfig.border }} />
                                {project.NumProjet}
                            </span>
                            <span className="pm-project-title">{project.Title}</span>

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
                    <div className="pm-resource-row-right">
                        {weeks.map((w) => (
                            <WeekCell
                                key={w.weekNumber}
                                affectation={demandePMLine.weekData.get(w.weekNumber)}
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
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Resource rows (visible when expanded) */}
            {isExpanded && resourceLines.map((rl) => (
                <ResourceRow
                    key={rl.resourceType}
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
                />
            ))}
        </div>
    );
};

export default ProjectRow;
