import * as React from "react";
import { IProjectBlock, IWeekInfo, IPlanningAffectation, IPlanningFiabilite } from "../../types";
import { ProjectMovement } from "../../hooks/useProjectMovement";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import ProjectRow from "./ProjectRow";
import WeekHeader from "./WeekHeader";

interface PlanningGridProps {
    projectBlocks: IProjectBlock[];
    weeks: IWeekInfo[];
    currentWeek: number;
    isAdmin: boolean;
    year: number;
    isEditMode: boolean;
    highlightNonAffectes?: boolean;
    projectMovements: Record<string, ProjectMovement>;
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
    onDeleteAffectation: (id: number) => void;
    onToggleExpand: (projectUniqID: string) => void;
    onAddProject: () => void;
    onMoveProject: (projectId: string, currentStartWeek: number, deltaWeeks: number) => void;
    onResetProject: (projectId: string) => void;
    scrollRef: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    bodyScrollRef: React.RefObject<HTMLDivElement>;
    onBodyScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    weekCellWidth: number;
}

const PlanningGrid: React.FC<PlanningGridProps> = ({
    projectBlocks,
    weeks,
    currentWeek,
    isAdmin,
    year,
    isEditMode,
    highlightNonAffectes,
    projectMovements,
    onSaveAffectation,
    onSaveFiabilite,
    onDeleteAffectation,
    onToggleExpand,
    onAddProject,
    onMoveProject,
    onResetProject,
    scrollRef,
    onScroll,
    bodyScrollRef,
    onBodyScroll,
    weekCellWidth,
}) => {
    const totalWidth = weeks.length * weekCellWidth;

    // DnD sensors — require 8px movement before activating drag
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const deltaWeeks = Math.round(delta.x / weekCellWidth);
        if (deltaWeeks !== 0) {
            const startWeek = (active.data.current as { startWeek: number })?.startWeek ?? currentWeek;
            onMoveProject(active.id as string, startWeek, deltaWeeks);
        }
    };

    return (
        <div className={`pm-planning-grid ${isEditMode ? "pm-planning-grid--edit-mode" : ""}`}>
            {/* Week header (scrolls with) */}
            <div className="pm-grid-header-area">
                <div className="pm-grid-header-left">
                    <span className="pm-grid-header-left-label">
                        PROJETS
                        {isEditMode && <span className="pm-edit-mode-indicator"> Mode édition</span>}
                    </span>
                </div>
                <div
                    className="pm-grid-header-right"
                    ref={scrollRef as React.RefObject<HTMLDivElement>}
                    onScroll={onScroll}
                >
                    <div style={{ width: totalWidth, minWidth: totalWidth }}>
                        <WeekHeader weeks={weeks} currentWeek={currentWeek} weekCellWidth={weekCellWidth} />
                    </div>
                </div>
            </div>

            {/* Project rows area */}
            <div className="pm-grid-body" ref={bodyScrollRef as React.RefObject<HTMLDivElement>} onScroll={onBodyScroll}>
                <DndContext sensors={sensors} modifiers={[restrictToHorizontalAxis]} onDragEnd={handleDragEnd}>
                    <div className="pm-grid-body-inner">
                        {projectBlocks.length === 0 ? (
                            <div className="pm-grid-empty">
                                <div className="pm-grid-empty-icon">📋</div>
                                <div className="pm-grid-empty-text">Aucun projet à afficher</div>
                                <div className="pm-grid-empty-hint">
                                    Changez le filtre PM ou ajoutez un nouveau projet
                                </div>
                            </div>
                        ) : (
                            projectBlocks.map((pb) => (
                                <ProjectRow
                                    key={pb.project.ProjectUniqID}
                                    projectBlock={pb}
                                    weeks={weeks}
                                    currentWeek={currentWeek}
                                    isAdmin={isAdmin}
                                    year={year}
                                    isEditMode={isEditMode}
                                    deltaWeeks={projectMovements[pb.project.ProjectUniqID]?.deltaWeeks ?? 0}
                                    highlighted={highlightNonAffectes && pb.status === "non-affecte"}
                                    onSaveAffectation={onSaveAffectation}
                                    onSaveFiabilite={onSaveFiabilite}
                                    onDeleteAffectation={onDeleteAffectation}
                                    onToggleExpand={onToggleExpand}
                                    onResetMovement={() => onResetProject(pb.project.ProjectUniqID)}
                                    weekCellWidth={weekCellWidth}
                                    onShift={(delta) => onMoveProject(
                                        pb.project.ProjectUniqID,
                                        pb.project.DateDebutSemaine ?? currentWeek,
                                        delta
                                    )}
                                />
                            ))
                        )}

                        {/* Add project button */}
                        {isAdmin && !isEditMode && (
                            <div className="pm-add-project-row" onClick={onAddProject}>
                                <span className="pm-add-project-icon">+</span>
                                <span className="pm-add-project-label">Ajouter un projet</span>
                            </div>
                        )}
                    </div>
                </DndContext>
            </div>
        </div>
    );
};

export default PlanningGrid;
