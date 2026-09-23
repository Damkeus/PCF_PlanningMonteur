import * as React from "react";
import { IProjectBlock, IWeekInfo, IPlanningAffectation, IPlanningFiabilite, IFicheChantier } from "../../types";
import { ProjectMovement } from "../../hooks/useProjectMovement";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { PM_SECTION_ORDER, PM_SECTION_STYLES, UNASSIGNED_PM_KEY } from "../Shared/constants";
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
    availablePMs: string[];
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
    onSaveFicheChantier?: (record: IFicheChantier) => void;
    onDeleteAffectation: (id: number) => void;
    onToggleExpand: (projectUniqID: string) => void;
    onAddProject: () => void;
    onMoveProject: (projectId: string, currentStartWeek: number, deltaWeeks: number) => void;
    onResetProject: (projectId: string) => void;
    onMoveAffectation: (affectation: IPlanningAffectation, direction: -1 | 1) => void;
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
    availablePMs,
    onSaveAffectation,
    onSaveFiabilite,
    onSaveFicheChantier,
    onDeleteAffectation,
    onToggleExpand,
    onAddProject,
    onMoveProject,
    onResetProject,
    onMoveAffectation,
    scrollRef,
    onScroll,
    bodyScrollRef,
    onBodyScroll,
    weekCellWidth,
}) => {
    const totalWidth = weeks.length * weekCellWidth;

    // Groupes de liaisons repliés (clé = LiaisonGroup)
    const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());

    const toggleGroup = (group: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
    };

    /**
     * Ordonne les blocs pour que les liaisons d'un même groupe (même N° de
     * commande, ex. H42093 Flandres) soient adjacentes, précédées d'un
     * en-tête de groupe repliable avec totaux hebdo agrégés.
     */
    type RenderItem =
        | { kind: "project"; block: IProjectBlock }
        | { kind: "group"; group: string; members: IProjectBlock[]; weekTotals: Map<number, number> };

    const buildLiaisonItems = React.useCallback((blocks: IProjectBlock[]): RenderItem[] => {
        const byGroup = new Map<string, IProjectBlock[]>();
        blocks.forEach((pb) => {
            const g = pb.project.LiaisonGroup;
            if (g) {
                const list = byGroup.get(g) ?? [];
                list.push(pb);
                byGroup.set(g, list);
            }
        });

        const emitted = new Set<string>();
        const items: RenderItem[] = [];
        blocks.forEach((pb) => {
            const g = pb.project.LiaisonGroup;
            if (!g || (byGroup.get(g) ?? []).length < 2) {
                items.push({ kind: "project", block: pb });
                return;
            }
            if (emitted.has(g)) return;
            emitted.add(g);
            const members = byGroup.get(g) ?? [];
            const weekTotals = new Map<number, number>();
            members.forEach((m) => {
                m.resourceLines.forEach((rl) => {
                    rl.weekData.forEach((aff, wk) => {
                        weekTotals.set(wk, (weekTotals.get(wk) ?? 0) + aff.NbMonteurs);
                    });
                });
            });
            items.push({ kind: "group", group: g, members, weekTotals });
        });
        return items;
    }, []);

    /**
     * Regroupe les projets par PM avec un bandeau de section distinct par
     * PM (type Excel), et une section "Non attribué" toujours en tête pour
     * forcer l'attribution rapide d'un PM manquant.
     */
    const pmBuckets = React.useMemo(() => {
        const byPM = new Map<string, IProjectBlock[]>();
        projectBlocks.forEach((pb) => {
            const key = pb.project.PM || UNASSIGNED_PM_KEY;
            const list = byPM.get(key) ?? [];
            list.push(pb);
            byPM.set(key, list);
        });

        const orderedKeys = [
            ...PM_SECTION_ORDER.filter((k) => byPM.has(k)),
            ...Array.from(byPM.keys()).filter((k) => !(PM_SECTION_ORDER as readonly string[]).includes(k)),
        ];

        return orderedKeys.map((key) => ({
            key,
            style: PM_SECTION_STYLES[key] ?? { label: key, bg: "#37474F", text: "#FFFFFF", accent: "#90A4AE" },
            items: buildLiaisonItems(byPM.get(key) ?? []),
            count: (byPM.get(key) ?? []).length,
        }));
    }, [projectBlocks, buildLiaisonItems]);

    // N'afficher les bandeaux de section que si plusieurs PM coexistent
    // dans la vue actuelle (sinon le bandeau serait redondant avec le filtre).
    const showPMSections = pmBuckets.length > 1;

    const renderProjectRow = (pb: IProjectBlock) => (
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
            availablePMs={availablePMs}
            onSaveAffectation={onSaveAffectation}
            onSaveFiabilite={onSaveFiabilite}
            onSaveFicheChantier={onSaveFicheChantier}
            onDeleteAffectation={onDeleteAffectation}
            onToggleExpand={onToggleExpand}
            onResetMovement={() => onResetProject(pb.project.ProjectUniqID)}
            onMoveAffectation={onMoveAffectation}
            weekCellWidth={weekCellWidth}
            onShift={(delta) => onMoveProject(
                pb.project.ProjectUniqID,
                pb.project.DateDebutSemaine ?? currentWeek,
                delta
            )}
        />
    );

    const renderLiaisonItems = (items: RenderItem[]) => items.map((item) => {
        if (item.kind === "project") {
            return renderProjectRow(item.block);
        }
        const isCollapsed = collapsedGroups.has(item.group);
        return (
            <React.Fragment key={`group-${item.group}`}>
                <div
                    className={`pm-liaison-group-header ${isCollapsed ? "pm-liaison-group-header--collapsed" : ""}`}
                    onClick={() => toggleGroup(item.group)}
                    role="button"
                    title={isCollapsed ? "Déplier les liaisons" : "Replier les liaisons"}
                >
                    <div className="pm-liaison-group-left">
                        <span className="pm-liaison-group-chevron">
                            {isCollapsed ? "▸" : "▾"}
                        </span>
                        <span className="pm-liaison-group-badge">⛓</span>
                        <span className="pm-liaison-group-label">
                            Liaisons {item.group}
                        </span>
                        <span className="pm-liaison-group-count">
                            {item.members.length} projets liés
                        </span>
                    </div>
                    <div className="pm-liaison-group-right">
                        <div style={{ width: totalWidth, minWidth: totalWidth, display: "flex" }}>
                            {weeks.map((w) => {
                                const val = item.weekTotals.get(w.weekNumber);
                                return (
                                    <div
                                        key={w.weekNumber}
                                        className="pm-liaison-group-cell"
                                        style={{ width: weekCellWidth }}
                                    >
                                        {val ? Math.round(val * 10) / 10 : ""}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {!isCollapsed && item.members.map(renderProjectRow)}
            </React.Fragment>
        );
    });

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
                            pmBuckets.map((bucket) => (
                                <React.Fragment key={`pm-${bucket.key}`}>
                                    {showPMSections && (
                                        <div
                                            className={`pm-section-header ${bucket.key === UNASSIGNED_PM_KEY ? "pm-section-header--unassigned" : ""}`}
                                            style={{ backgroundColor: bucket.style.bg }}
                                        >
                                            <div className="pm-section-header-left" style={{ backgroundColor: bucket.style.bg }}>
                                                <span
                                                    className="pm-section-header-stripe"
                                                    style={{ backgroundColor: bucket.style.accent }}
                                                />
                                                <span className="pm-section-header-label" style={{ color: bucket.style.text }}>
                                                    {bucket.key === UNASSIGNED_PM_KEY ? "⚠ " : ""}{bucket.style.label}
                                                </span>
                                                <span className="pm-section-header-count">
                                                    {bucket.count} projet{bucket.count > 1 ? "s" : ""}
                                                </span>
                                            </div>
                                            <div className="pm-section-header-right" style={{ backgroundColor: bucket.style.bg }}>
                                                <div style={{ width: totalWidth, minWidth: totalWidth }} />
                                            </div>
                                        </div>
                                    )}
                                    {renderLiaisonItems(bucket.items)}
                                </React.Fragment>
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
