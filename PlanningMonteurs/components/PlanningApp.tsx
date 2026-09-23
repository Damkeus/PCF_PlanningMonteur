import * as React from "react";
import {
    IPlanningAppProps,
    IProjectBlock,
    IResourceLine,
    IDemandePMLine,
    IPlanningAffectation,
    IPlanningCapacite,
    IPlanningFiabilite,
    IFicheChantier,
    ITabletteChantier,
    IRelinkPayload,
    ICreateProjectPayload,
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
import AnnexeView from "./Annexe/AnnexeView";
import MouvementView from "./Mouvement/MouvementView";
import Legend from "./Shared/Legend";
import NotificationCard from "./NotificationCard";
import DataQualityCard from "./DataQualityCard";
import OrphanProjectBanner from "./OrphanProjectBanner";
import MonteurAttributionPanel from "./Panels/MonteurAttributionPanel";
import EditModeToggle from "./EditModeToggle";
import { useNotification } from "../hooks/useNotification";
import { useDataQuality } from "../hooks/useDataQuality";
import { useProjectMovement } from "../hooks/useProjectMovement";
import { LEFT_PANEL_WIDTH, DEFAULT_VISIBLE_WEEKS, loadCustomSections, saveCustomSectionsToStorage, loadCustomValues, saveCustomValuesToStorage } from "./Shared/constants";
import ResourceEditorPanel from "./Admin/ResourceEditorPanel";
import { ICustomCapaciteSection } from "../types";

const PlanningApp: React.FC<IPlanningAppProps> = (props) => {
    const {
        planningData,
        capaciteData,
        ficheChantierData,
        fiabiliteData,
        monteursData,
        mouvementData,
        tabletteChantierData,
        currentYear,
        currentWeek,
        userRole,
        selectedPMFilter,
        availableYears,
        availablePMs,
        isLoading,
        onSaveAffectation,
        onSaveCapacite,
        onSaveFiabilite,
        onDeleteAffectation,
        onFilterChange,
        onYearChange,
        onSaveFicheChantier,
        onSaveTabletteChantier,
        onRelinkProject,
        onCreateProject,
    } = props;

    const isAdmin = userRole === "admin";

    // State
    const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set());
    const [showAddPanel, setShowAddPanel] = React.useState(false);
    const [showLegend, setShowLegend] = React.useState(false);
    const [toast, setToast] = React.useState<string | null>(null);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [highlightNonAffectes, setHighlightNonAffectes] = React.useState(false);
    const [pendingShifts, setPendingShifts] = React.useState<Record<string, { delta: number; type: string }>>({});
    const [currentView, setCurrentView] = React.useState<"planning" | "annexe" | "mouvement">("planning");
    const [showResourceEditor, setShowResourceEditor] = React.useState(false);
    const [showMonteurPanel, setShowMonteurPanel] = React.useState(false);
    const [dataQualityDismissed, setDataQualityDismissed] = React.useState(false);
    const [customSections, setCustomSections] = React.useState<ICustomCapaciteSection[]>(() => loadCustomSections());
    const [customValues, setCustomValues] = React.useState<Record<string, number>>(() => loadCustomValues());

    // Zoom state: controls how many weeks are visible (10→52)
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [visibleWeeks, setVisibleWeeks] = React.useState(DEFAULT_VISIBLE_WEEKS);

    // Compute weekCellWidth from visibleWeeks and container width
    const weekCellWidth = React.useMemo(() => {
        const containerWidth = containerRef.current?.clientWidth ?? 1200;
        const availableWidth = containerWidth - LEFT_PANEL_WIDTH;
        return Math.max(12, Math.floor(availableWidth / visibleWeeks));
    }, [visibleWeeks]);

    // Refs for scroll sync (3-way: capacite, grid header, grid body)
    const capaciteScrollRef = React.useRef<HTMLDivElement>(null);
    const gridHeaderScrollRef = React.useRef<HTMLDivElement>(null);
    const gridBodyScrollRef = React.useRef<HTMLDivElement>(null);
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

    // Clear pending shifts when planningData changes (Power Apps responded)
    const planningDataRef = React.useRef(planningData);
    React.useEffect(() => {
        if (planningData !== planningDataRef.current) {
            planningDataRef.current = planningData;
            if (Object.keys(pendingShifts).length > 0) {
                setPendingShifts({});
            }
        }
    }, [planningData]);

    // Build project blocks with resource lines + Demande PM
    const projectBlocks: IProjectBlock[] = React.useMemo(() => {
        return filteredProjectsList.map((project) => {
            const projectAffectations = planningData.filter(
                (a) => a.ProjectUniqID === project.ProjectUniqID
            );

            // Separate demandes PM from real affectations
            const demandes = projectAffectations.filter(a => a.IsDemandePM);
            const realAffectations = projectAffectations.filter(a => !a.IsDemandePM);

            // Apply pending optimistic shifts to weekData
            const shift = pendingShifts[project.ProjectUniqID];

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
                        .forEach((a) => {
                            const wk = (shift && shift.type !== "demandePM") ? a.WeekNumber + shift.delta : a.WeekNumber;
                            weekData.set(wk, { ...a, WeekNumber: wk });
                        });

                    const fiabilite = projectFiabilites.find(
                        (f) => f.ResourceType === rt
                    );

                    return { resourceType: rt, fiabilite, weekData };
                });

            // Build Demande PM line
            let demandePMLine: IDemandePMLine | undefined;
            if (demandes.length > 0) {
                const weekData = new Map<number, IPlanningAffectation>();
                demandes.forEach((d) => {
                    const wk = (shift && shift.type === "demandePM") ? d.WeekNumber + shift.delta : d.WeekNumber;
                    weekData.set(wk, { ...d, WeekNumber: wk });
                });
                demandePMLine = { weekData };
            } else {
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
    }, [filteredProjectsList, planningData, fiabiliteData, expandedProjects, pendingShifts]);

    // Notification hook (admin only)
    const { unaffectedCount, unaffectedProjects, isDismissed, dismiss } = useNotification(
        projectBlocks,
        currentWeek
    );
    const showNotification = isAdmin && unaffectedCount > 0 && !isDismissed;

    // Contrôle qualité des données (backfill human-in-the-loop)
    const { orphanProjects, fichesSansPlanning, pmIssues, adminIssues } = useDataQuality(
        ficheChantierData,
        filteredProjectsList,
        planningData,
        tabletteChantierData
    );
    const dataQualityIssues = isAdmin ? adminIssues : pmIssues;
    const showDataQuality = dataQualityIssues.length > 0 && !dataQualityDismissed;

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

    // 3-way scroll sync helper
    const syncScroll = (source: HTMLDivElement, ...targets: (HTMLDivElement | null)[]) => {
        if (isSyncingScroll.current) return;
        isSyncingScroll.current = true;
        const scrollLeft = source.scrollLeft;
        targets.forEach(t => { if (t) t.scrollLeft = scrollLeft; });
        requestAnimationFrame(() => { isSyncingScroll.current = false; });
    };

    const handleCapaciteScroll = (e: React.UIEvent<HTMLDivElement>) => {
        syncScroll(e.target as HTMLDivElement, gridHeaderScrollRef.current, gridBodyScrollRef.current);
    };

    const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
        syncScroll(e.target as HTMLDivElement, capaciteScrollRef.current, gridBodyScrollRef.current);
    };

    const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
        syncScroll(e.target as HTMLDivElement, capaciteScrollRef.current, gridHeaderScrollRef.current);
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

    const handleSaveFicheChantier = onSaveFicheChantier
        ? (record: IFicheChantier) => {
            onSaveFicheChantier(record);
            showToast(`PM attribué : ${record.PM ?? "—"}`);
        }
        : undefined;

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    };

    const handleSaveTabletteChantier = onSaveTabletteChantier
        ? (record: ITabletteChantier) => {
            onSaveTabletteChantier(record);
            const count = record.MonteurMail
                ? record.MonteurMail.split(";").filter((m) => m.trim()).length
                : 0;
            showToast(`${count} monteur${count > 1 ? "s" : ""} attribué${count > 1 ? "s" : ""} → TabletteChantier`);
        }
        : undefined;

    const handleRelinkProject = onRelinkProject
        ? (payload: IRelinkPayload) => {
            onRelinkProject(payload);
            showToast(`Planning rattaché à « ${payload.newTitle} »`);
        }
        : undefined;

    const handleCreateProject = onCreateProject
        ? (payload: ICreateProjectPayload) => {
            onCreateProject(payload);
            showToast("Redirection vers la création de fiche…");
        }
        : undefined;

    /**
     * Move a single affectation record ±1 week, independently of the rest of the project.
     * Keeps the record ID → Power Apps does an UPDATE not INSERT.
     */
    const handleMoveAffectation = (affectation: IPlanningAffectation, direction: -1 | 1) => {
        const newWeek = affectation.WeekNumber + direction;
        if (newWeek < 1 || newWeek > 53) return;
        const updated: IPlanningAffectation = { ...affectation, WeekNumber: newWeek };
        onSaveAffectation(updated);
        showToast(direction > 0
            ? `S${affectation.WeekNumber} → S${newWeek} (+1)`
            : `S${affectation.WeekNumber} → S${newWeek} (−1)`
        );
    };

    // Handle project move (+1/-1 or DnD)
    const handleMoveProject = (projectId: string, currentStartWeek: number, deltaWeeks: number) => {
        moveProject(projectId, currentStartWeek, deltaWeeks, isAdmin ? "all" : "demandePM");
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

            const mType = movements[projectId]?.movementType ?? "all";
            // Filter affectations based on movement type
            const projectAffectations = planningData.filter((a) => {
                if (a.ProjectUniqID !== projectId) return false;
                return mType === "demandePM" ? !!a.IsDemandePM : !a.IsDemandePM;
            });

            projectAffectations.forEach((aff) => {
                const updatedRecord: IPlanningAffectation = {
                    ...aff,
                    WeekNumber: aff.WeekNumber + delta,
                };
                onSaveAffectation(updatedRecord);
                patchCount++;
            });
        });

        // Optimistic update: store shifts so UI reflects changes immediately
        const shifts: Record<string, { delta: number; type: string }> = {};
        movedProjectIds.forEach(id => {
            const d = getDeltaWeeks(id);
            if (d !== 0) shifts[id] = { delta: d, type: movements[id]?.movementType ?? "all" };
        });
        setPendingShifts(shifts);

        resetAllMovements();
        showToast(`${patchCount} affectation${patchCount > 1 ? "s" : ""} mise${patchCount > 1 ? "s" : ""} à jour`);
    };

    const handleSaveCustomSections = (sections: ICustomCapaciteSection[]) => {
        setCustomSections(sections);
        saveCustomSectionsToStorage(sections);
        showToast("Ressources sauvegardées");
    };

    const handleCustomValueChange = (key: string, value: number) => {
        setCustomValues(prev => {
            const next = { ...prev, [key]: value };
            saveCustomValuesToStorage(next);
            return next;
        });
    };

    // Clic sur un projet de la carte de notification : bascule sur la vue
    // planning, déplie le projet, scrolle jusqu'à lui et le met en évidence.
    const handleOpenProject = (projectUniqID: string) => {
        setCurrentView("planning");
        setExpandedProjects((prev) => {
            const next = new Set(prev);
            next.add(projectUniqID);
            return next;
        });
        setHighlightNonAffectes(true);
        setTimeout(() => {
            const row = document.querySelector(`[data-project-id="${projectUniqID}"]`);
            if (row) {
                row.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 80);
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
                if (gridBodyScrollRef.current) {
                    gridBodyScrollRef.current.scrollLeft = scrollLeft;
                }
            }
        };
        setTimeout(scrollToCurrentWeek, 100);
    }, [currentWeek, weeks]);

    return (
        <div className="pm-app" ref={containerRef}>
            {isLoading && (
                <div className="pm-loading-overlay" role="status" aria-live="polite" aria-busy="true">
                    <div className="pm-loading-card">
                        <div className="pm-loading-spinner" />
                        <span className="pm-loading-text">Chargement du planning…</span>
                    </div>
                </div>
            )}
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
                isAnnexeView={currentView === "annexe"}
                onToggleAnnexe={() => setCurrentView(currentView === "annexe" ? "planning" : "annexe")}
                isMouvementView={currentView === "mouvement"}
                onToggleMouvement={() => setCurrentView(currentView === "mouvement" ? "planning" : "mouvement")}
                onEditResources={isAdmin ? () => setShowResourceEditor(true) : undefined}
            />

            {/* Bannière chantiers du planning non créés dans l'application */}
            <OrphanProjectBanner
                orphanProjects={orphanProjects}
                fichesSansPlanning={fichesSansPlanning}
                onCreateProject={handleCreateProject}
                onRelinkProject={handleRelinkProject}
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

            {/* Attribution monteurs (admin) */}
            {isAdmin && handleSaveTabletteChantier && (
                <button
                    className="pm-legend-toggle pm-monteur-toggle"
                    onClick={() => setShowMonteurPanel(true)}
                    type="button"
                    title="Attribuer des monteurs aux chantiers (TabletteChantier)"
                >
                    👷 Monteurs
                </button>
            )}

            <Legend visible={showLegend} onClose={() => setShowLegend(false)} />

            {currentView === "planning" ? (
                <>
                    <CapaciteGrid
                        capaciteData={capaciteData}
                        planningData={planningData}
                        ficheChantierData={ficheChantierData}
                        weeks={weeks}
                        currentWeek={currentWeek}
                        isAdmin={isAdmin}
                        onSaveCapacite={handleSaveCapacite}
                        scrollRef={capaciteScrollRef}
                        onScroll={handleCapaciteScroll}
                        weekCellWidth={weekCellWidth}
                        customSections={customSections}
                        customValues={customValues}
                        onCustomValueChange={handleCustomValueChange}
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
                        availablePMs={availablePMs}
                        onSaveAffectation={handleSaveAffectation}
                        onDeleteAffectation={handleDeleteAffectation}
                        onSaveFiabilite={handleSaveFiabilite}
                        onSaveFicheChantier={handleSaveFicheChantier}
                        onToggleExpand={handleToggleExpand}
                        onAddProject={() => setShowAddPanel(true)}
                        onMoveProject={handleMoveProject}
                        onResetProject={resetProject}
                        onMoveAffectation={handleMoveAffectation}
                        scrollRef={gridHeaderScrollRef}
                        onScroll={handleGridScroll}
                        bodyScrollRef={gridBodyScrollRef}
                        onBodyScroll={handleBodyScroll}
                        weekCellWidth={weekCellWidth}
                    />

                    <AffectationPanel
                        visible={showAddPanel}
                        ficheChantierData={ficheChantierData}
                        fiabiliteData={fiabiliteData}
                        currentYear={currentYear}
                        onClose={() => setShowAddPanel(false)}
                        onSaveAffectation={handleSaveAffectation}
                        onSaveFiabilite={handleSaveFiabilite}
                    />
                </>
            ) : currentView === "annexe" ? (
                <AnnexeView
                    planningData={planningData}
                    ficheChantierData={ficheChantierData}
                    currentYear={currentYear}
                    currentWeek={currentWeek}
                    weeks={weeks}
                    weekCellWidth={weekCellWidth}
                />
            ) : (
                <MouvementView
                    mouvementData={mouvementData}
                    planningData={planningData}
                    currentYear={currentYear}
                    currentWeek={currentWeek}
                    weeks={weeks}
                    weekCellWidth={weekCellWidth}
                />
            )}

            {/* Admin notification card — demandes PM sans affectation réelle */}
            {showNotification && (
                <NotificationCard
                    projects={unaffectedProjects}
                    onOpenProject={handleOpenProject}
                    onDismiss={dismiss}
                />
            )}

            {/* Notification qualité de données — infos importantes non complétées */}
            {showDataQuality && !showNotification && (
                <DataQualityCard
                    title={isAdmin ? "Attributions à compléter" : "Vos projets à compléter"}
                    issues={dataQualityIssues}
                    onOpenProject={handleOpenProject}
                    onDismiss={() => setDataQualityDismissed(true)}
                />
            )}

            {/* Panneau attribution monteurs (admin) */}
            {isAdmin && handleSaveTabletteChantier && (
                <MonteurAttributionPanel
                    visible={showMonteurPanel}
                    ficheChantierData={ficheChantierData}
                    monteursData={monteursData}
                    tabletteChantierData={tabletteChantierData}
                    currentYear={currentYear}
                    onClose={() => setShowMonteurPanel(false)}
                    onSaveTabletteChantier={handleSaveTabletteChantier}
                />
            )}

            {/* Resource editor panel (admin) */}
            <ResourceEditorPanel
                visible={showResourceEditor}
                sections={customSections}
                onClose={() => setShowResourceEditor(false)}
                onSave={handleSaveCustomSections}
            />

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
