import * as React from "react";
import {
    IPlanningAppProps,
    IProjectBlock,
    IResourceLine,
    IDemandePMLine,
    IPlanningAffectation,
    IPlanningCapacite,
    IPlanningFiabilite,
    IWeekInfo,
    ResourceType,
    ProjectStatus,
    FiabiliteLevel,
} from "../types";
import { getWeeksForYear } from "../utils/weekUtils";
import { filterProjects } from "../utils/dataParser";
import PlanningHeader from "./Header/PlanningHeader";
import CapaciteGrid from "./Header/CapaciteGrid";
import PlanningGrid from "./Grid/PlanningGrid";
import AffectationPanel from "./Panels/AffectationPanel";
import Legend from "./Shared/Legend";
import NotificationToast from "./NotificationToast";
import EditModeToggle from "./EditModeToggle";
import { useNotification } from "../hooks/useNotification";
import { useProjectMovement } from "../hooks/useProjectMovement";
import { LEFT_PANEL_WIDTH, DEFAULT_VISIBLE_WEEKS } from "./Shared/constants";

const PlanningApp: React.FC<IPlanningAppProps> = (props) => {
    const {
        planningData,
        capaciteData,
        ficheChantierData,
        fiabiliteData,
        currentYear,
        currentWeek,
        userRole,
        selectedPMFilter,
        availableYears,
        onSaveAffectation,
        onSaveCapacite,
        onSaveFiabilite,
        onDeleteAffectation,
        onFilterChange,
        onYearChange,
    } = props;

    const isAdmin = userRole === "admin";

    // State
    const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set());
    const [showAddPanel, setShowAddPanel] = React.useState(false);
    const [showLegend, setShowLegend] = React.useState(false);
    const [toast, setToast] = React.useState<string | null>(null);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [highlightNonAffectes, setHighlightNonAffectes] = React.useState(false);

    // Zoom state: controls how many weeks are visible (10→52)
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [visibleWeeks, setVisibleWeeks] = React.useState(DEFAULT_VISIBLE_WEEKS);

    // Compute weekCellWidth from visibleWeeks and container width
    const weekCellWidth = React.useMemo(() => {
        const containerWidth = containerRef.current?.clientWidth ?? 1200;
        const availableWidth = containerWidth - LEFT_PANEL_WIDTH;
        return Math.max(12, Math.floor(availableWidth / visibleWeeks));
    }, [visibleWeeks]);

    // Refs for scroll sync
    const capaciteScrollRef = React.useRef<HTMLDivElement>(null);
    const gridHeaderScrollRef = React.useRef<HTMLDivElement>(null);
    const isSyncingScroll = React.useRef(false);

    // DnD project movement
    const { movements, hasMovements, moveProject, resetProject, resetAllMovements, getDeltaWeeks } = useProjectMovement();

    // Compute weeks for the year
    const weeks: IWeekInfo[] = React.useMemo(
        () => getWeeksForYear(currentYear),
        [currentYear]
    );

    // Filter projects
    const filteredProjectsList = React.useMemo(
        () => filterProjects(ficheChantierData, selectedPMFilter),
        [ficheChantierData, selectedPMFilter]
    );

    /**
     * Compute project status based on demandes PM vs affectations and fiabilité.
     */
    const computeProjectStatus = (
        projectID: string,
        demandes: IPlanningAffectation[],
        affectations: IPlanningAffectation[],
        projectFiabilites: IPlanningFiabilite[]
    ): ProjectStatus => {
        const hasDemandes = demandes.some(d => d.NbMonteurs > 0);
        const hasAffectations = affectations.some(a => a.NbMonteurs > 0 && !a.IsDemandePM);

        if (!hasDemandes && !hasAffectations) return "valide"; // Nothing requested, nothing needed

        // Check fiabilité levels
        const hasBonFiabilite = projectFiabilites.some(
            f => f.Fiabilite === "A+" || f.Fiabilite === "A"
        );
        const allRefused = hasAffectations &&
            projectFiabilites.length > 0 &&
            projectFiabilites.every(f => f.Fiabilite === "Refusé");

        if (hasDemandes && !hasAffectations) return "non-affecte";
        if (allRefused) return "refuse";
        if (hasAffectations && hasBonFiabilite) return "valide";
        if (hasAffectations) return "provisoire";
        return "non-affecte";
    };

    // Build project blocks with resource lines + Demande PM
    const projectBlocks: IProjectBlock[] = React.useMemo(() => {
        return filteredProjectsList.map((project) => {
            const projectAffectations = planningData.filter(
                (a) => a.ProjectUniqID === project.ProjectUniqID
            );

            // Separate demandes PM from real affectations
            const demandes = projectAffectations.filter(a => a.IsDemandePM);
            const realAffectations = projectAffectations.filter(a => !a.IsDemandePM);

            // Build resource types from real affectations
            const resourceTypesSet = new Set<ResourceType>();
            realAffectations.forEach((a) => resourceTypesSet.add(a.ResourceType));

            const projectFiabilites = fiabiliteData.filter(
                (f) => f.ProjectUniqID === project.ProjectUniqID
            );
            projectFiabilites.forEach((f) => resourceTypesSet.add(f.ResourceType));

            if (resourceTypesSet.size === 0) {
                resourceTypesSet.add("NxFR");
            }

            const resourceLines: IResourceLine[] = Array.from(resourceTypesSet)
                .sort()
                .map((rt) => {
                    const weekData = new Map<number, IPlanningAffectation>();
                    realAffectations
                        .filter((a) => a.ResourceType === rt)
                        .forEach((a) => weekData.set(a.WeekNumber, a));

                    const fiabilite = projectFiabilites.find(
                        (f) => f.ResourceType === rt
                    );

                    return { resourceType: rt, fiabilite, weekData };
                });

            // Build Demande PM line
            let demandePMLine: IDemandePMLine | undefined;
            if (demandes.length > 0) {
                const weekData = new Map<number, IPlanningAffectation>();
                demandes.forEach((d) => weekData.set(d.WeekNumber, d));
                demandePMLine = { weekData };
            } else {
                // Always show demande PM line (empty, editable)
                demandePMLine = { weekData: new Map() };
            }

            // Compute status
            const status = computeProjectStatus(
                project.ProjectUniqID,
                demandes,
                realAffectations,
                projectFiabilites
            );

            return {
                project,
                resourceLines,
                demandePMLine,
                isExpanded: expandedProjects.has(project.ProjectUniqID),
                status,
            };
        });
    }, [filteredProjectsList, planningData, fiabiliteData, expandedProjects]);

    // Notification hook (admin only)
    const { unaffectedCount, isDismissed, dismiss } = useNotification(
        projectBlocks,
        currentWeek
    );
    const showNotification = isAdmin && unaffectedCount > 0 && !isDismissed;

    // Expand all projects by default on first render
    React.useEffect(() => {
        if (expandedProjects.size === 0 && filteredProjectsList.length > 0) {
            setExpandedProjects(
                new Set(filteredProjectsList.map((p) => p.ProjectUniqID))
            );
        }
    }, [filteredProjectsList]);

    // Toggle expand
    const handleToggleExpand = (projectUniqID: string) => {
        setExpandedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(projectUniqID)) {
                next.delete(projectUniqID);
            } else {
                next.add(projectUniqID);
            }
            return next;
        });
    };

    // Scroll sync handlers
    const handleCapaciteScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isSyncingScroll.current) return;
        isSyncingScroll.current = true;
        const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
        if (gridHeaderScrollRef.current) {
            gridHeaderScrollRef.current.scrollLeft = scrollLeft;
        }
        requestAnimationFrame(() => {
            isSyncingScroll.current = false;
        });
    };

    const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isSyncingScroll.current) return;
        isSyncingScroll.current = true;
        const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
        if (capaciteScrollRef.current) {
            capaciteScrollRef.current.scrollLeft = scrollLeft;
        }
        requestAnimationFrame(() => {
            isSyncingScroll.current = false;
        });
    };

    // Save handlers with toast
    const handleSaveAffectation = (record: IPlanningAffectation) => {
        onSaveAffectation(record);
        showToast(record.IsDemandePM ? "Demande PM sauvegardée" : "Affectation sauvegardée");
    };

    const handleDeleteAffectation = (id: number) => {
        onDeleteAffectation(id);
        showToast("Cellule supprimée");
    };

    const handleSaveCapacite = (record: IPlanningCapacite) => {
        onSaveCapacite(record);
        showToast("Capacité sauvegardée");
    };

    const handleSaveFiabilite = (record: IPlanningFiabilite) => {
        onSaveFiabilite(record);
        showToast("Fiabilité sauvegardée");
    };

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    };

    // Handle project move (DnD)
    const handleMoveProject = (projectId: string, currentStartWeek: number, deltaWeeks: number) => {
        moveProject(projectId, currentStartWeek, deltaWeeks);
        showToast(deltaWeeks > 0
            ? `Projet décalé de +${deltaWeeks} sem.`
            : `Projet avancé de ${Math.abs(deltaWeeks)} sem.`
        );
    };

    // Confirm all project movements — recalculate WeekNumber and emit to Power Apps
    const handleConfirmMoves = () => {
        const movedProjectIds = Object.keys(movements);
        if (movedProjectIds.length === 0) return;

        let patchCount = 0;
        movedProjectIds.forEach((projectId) => {
            const delta = getDeltaWeeks(projectId);
            if (delta === 0) return;

            // Find all real affectations for this project
            const projectAffectations = planningData.filter(
                (a) => a.ProjectUniqID === projectId && !a.IsDemandePM
            );

            projectAffectations.forEach((aff) => {
                const updatedRecord: IPlanningAffectation = {
                    ...aff,
                    WeekNumber: aff.WeekNumber + delta,
                };
                onSaveAffectation(updatedRecord);
                patchCount++;
            });
        });

        resetAllMovements();
        showToast(`${patchCount} affectation${patchCount > 1 ? "s" : ""} mise${patchCount > 1 ? "s" : ""} à jour`);
    };

    // Notification "Voir" button — highlight non-affectés
    const handleViewUnaffected = () => {
        setHighlightNonAffectes(true);
        // Scroll to first project row
        setTimeout(() => {
            const firstProjectRow = document.querySelector(".pm-project-row");
            if (firstProjectRow) {
                firstProjectRow.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 50);
        dismiss();
    };

    // Auto-scroll to current week on mount
    React.useEffect(() => {
        const scrollToCurrentWeek = () => {
            const weekIndex = weeks.findIndex((w) => w.weekNumber === currentWeek);
            if (weekIndex >= 0) {
                const scrollLeft = Math.max(0, weekIndex * weekCellWidth - 200);
                if (capaciteScrollRef.current) {
                    capaciteScrollRef.current.scrollLeft = scrollLeft;
                }
                if (gridHeaderScrollRef.current) {
                    gridHeaderScrollRef.current.scrollLeft = scrollLeft;
                }
            }
        };
        setTimeout(scrollToCurrentWeek, 100);
    }, [currentWeek, weeks]);

    return (
        <div className="pm-app" ref={containerRef}>
            <PlanningHeader
                currentYear={currentYear}
                currentWeek={currentWeek}
                selectedPMFilter={selectedPMFilter}
                availableYears={availableYears}
                isAdmin={isAdmin}
                onYearChange={onYearChange}
                onFilterChange={onFilterChange}
                editModeToggle={
                    isAdmin ? (
                        <EditModeToggle
                            isEditMode={isEditMode}
                            onToggle={() => setIsEditMode(!isEditMode)}
                        />
                    ) : undefined
                }
                hasMovements={hasMovements}
                onConfirmMoves={handleConfirmMoves}
                visibleWeeks={visibleWeeks}
                onZoomChange={setVisibleWeeks}
            />

            {/* Legend toggle button */}
            <button
                className="pm-legend-toggle"
                onClick={() => setShowLegend(!showLegend)}
                type="button"
                title="Légende des couleurs"
            >
                {showLegend ? "✕ Légende" : "◉ Légende"}
            </button>

            <Legend visible={showLegend} onClose={() => setShowLegend(false)} />

            <CapaciteGrid
                capaciteData={capaciteData}
                weeks={weeks}
                currentWeek={currentWeek}
                isAdmin={isAdmin}
                onSaveCapacite={handleSaveCapacite}
                scrollRef={capaciteScrollRef}
                onScroll={handleCapaciteScroll}
                weekCellWidth={weekCellWidth}
            />

            <div className="pm-separator" />

            <PlanningGrid
                projectBlocks={projectBlocks}
                weeks={weeks}
                currentWeek={currentWeek}
                isAdmin={isAdmin}
                year={currentYear}
                isEditMode={isEditMode}
                highlightNonAffectes={highlightNonAffectes}
                projectMovements={movements}
                onSaveAffectation={handleSaveAffectation}
                onDeleteAffectation={handleDeleteAffectation}
                onSaveFiabilite={handleSaveFiabilite}
                onToggleExpand={handleToggleExpand}
                onAddProject={() => setShowAddPanel(true)}
                onMoveProject={handleMoveProject}
                onResetProject={resetProject}
                scrollRef={gridHeaderScrollRef}
                onScroll={handleGridScroll}
                weekCellWidth={weekCellWidth}
            />

            <AffectationPanel
                visible={showAddPanel}
                ficheChantierData={ficheChantierData}
                currentYear={currentYear}
                onClose={() => setShowAddPanel(false)}
                onSaveAffectation={handleSaveAffectation}
                onSaveFiabilite={handleSaveFiabilite}
            />

            {/* Admin notification toast */}
            {showNotification && (
                <NotificationToast
                    count={unaffectedCount}
                    onView={handleViewUnaffected}
                    onDismiss={dismiss}
                />
            )}

            {/* Toast notification */}
            {toast && (
                <div className="pm-toast">
                    <span className="pm-toast-icon">✓</span>
                    <span className="pm-toast-text">{toast}</span>
                </div>
            )}
        </div>
    );
};

export default PlanningApp;
