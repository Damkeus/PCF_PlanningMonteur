import * as React from "react";
import { IPlanningAffectation, IFicheChantier, IWeekInfo, ResourceType, PMCode } from "../../types";
import { RESOURCE_COLORS, RESOURCE_BG_COLORS, RESOURCE_TEXT_COLORS } from "../Shared/constants";
import { getMonthSpans } from "../../utils/weekUtils";
import { exportAnnexeToExcel } from "../../utils/excelExport";
import AnnexeChart from "./AnnexeChart";

/** Row data for the annexe table */
export interface AnnexeRow {
    trimestre: string;
    pm: string;
    resource: ResourceType;
    title: string;
    numProjet: string;
    tension: string;
    debut: number | null;
    besoinTotal: number;
    weekData: Map<number, number>;
    projectUniqID: string;
}

interface AnnexeViewProps {
    planningData: IPlanningAffectation[];
    ficheChantierData: IFicheChantier[];
    currentYear: number;
    currentWeek: number;
    weeks: IWeekInfo[];
    weekCellWidth: number;
}

const PM_FRANCE: PMCode[] = ["JC", "GP", "DW", "VB"];

function getTrimestre(weekNumber: number | undefined): string {
    if (!weekNumber) return "—";
    if (weekNumber <= 13) return "T1";
    if (weekNumber <= 26) return "T2";
    if (weekNumber <= 39) return "T3";
    return "T4";
}

const AnnexeView: React.FC<AnnexeViewProps> = ({
    planningData,
    ficheChantierData,
    currentYear,
    currentWeek,
    weeks,
    weekCellWidth,
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const headerScrollRef = React.useRef<HTMLDivElement>(null);
    const isSyncing = React.useRef(false);

    // Sync scroll between header and body
    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement | null) => {
        if (isSyncing.current || !target) return;
        isSyncing.current = true;
        target.scrollLeft = source.scrollLeft;
        requestAnimationFrame(() => { isSyncing.current = false; });
    };

    // Build annexe rows: only PM France, real affectations (not demandePM)
    const rows: AnnexeRow[] = React.useMemo(() => {
        // Filter projects to PM France only
        const pmFranceProjects = ficheChantierData.filter(
            p => p.PM && PM_FRANCE.includes(p.PM as PMCode)
        );

        const result: AnnexeRow[] = [];

        pmFranceProjects.forEach(project => {
            // Get real affectations for this project
            const projectAffectations = planningData.filter(
                a => a.ProjectUniqID === project.ProjectUniqID && !a.IsDemandePM
            );

            if (projectAffectations.length === 0) return;

            // Group by resource type
            const byResource = new Map<ResourceType, IPlanningAffectation[]>();
            projectAffectations.forEach(a => {
                const list = byResource.get(a.ResourceType) || [];
                list.push(a);
                byResource.set(a.ResourceType, list);
            });

            byResource.forEach((affectations, resourceType) => {
                const weekData = new Map<number, number>();
                let besoinTotal = 0;
                affectations.forEach(a => {
                    const existing = weekData.get(a.WeekNumber) || 0;
                    weekData.set(a.WeekNumber, existing + a.NbMonteurs);
                    besoinTotal += a.NbMonteurs;
                });

                result.push({
                    trimestre: getTrimestre(project.DateDebutSemaine),
                    pm: project.PM || "—",
                    resource: resourceType,
                    title: project.Title,
                    numProjet: project.NumProjet,
                    tension: project.Tension_kV ? `${project.Tension_kV} kV` : "—",
                    debut: project.DateDebutSemaine ?? null,
                    besoinTotal,
                    weekData,
                    projectUniqID: project.ProjectUniqID,
                });
            });
        });

        // Sort: Trimestre → PM → ResourceType → DateDebut
        result.sort((a, b) => {
            if (a.trimestre !== b.trimestre) return a.trimestre.localeCompare(b.trimestre);
            if (a.pm !== b.pm) return a.pm.localeCompare(b.pm);
            if (a.resource !== b.resource) return a.resource.localeCompare(b.resource);
            return (a.debut ?? 99) - (b.debut ?? 99);
        });

        return result;
    }, [planningData, ficheChantierData]);

    // Summary rows: total per resource type per week
    const summaryRows = React.useMemo(() => {
        const types: ResourceType[] = ["NxFR", "HTB", "SCLS"];
        return types.map(rt => {
            const weekTotals = new Map<number, number>();
            let total = 0;
            rows.filter(r => r.resource === rt).forEach(r => {
                r.weekData.forEach((val, wk) => {
                    weekTotals.set(wk, (weekTotals.get(wk) || 0) + val);
                });
                total += r.besoinTotal;
            });
            return { resource: rt, weekTotals, total };
        });
    }, [rows]);

    // Chart data: total affectations per week and total demande PM per week
    const { weeklyAffectationTotals, weeklyDemandeTotals } = React.useMemo(() => {
        const affTotals = new Map<number, number>();
        const demTotals = new Map<number, number>();

        // Only PM France projects
        const pmFranceSet = new Set(
            ficheChantierData
                .filter(p => p.PM && PM_FRANCE.includes(p.PM as PMCode))
                .map(p => p.ProjectUniqID)
        );

        planningData.forEach(a => {
            if (!pmFranceSet.has(a.ProjectUniqID)) return;
            if (a.IsDemandePM) {
                demTotals.set(a.WeekNumber, (demTotals.get(a.WeekNumber) || 0) + a.NbMonteurs);
            } else {
                affTotals.set(a.WeekNumber, (affTotals.get(a.WeekNumber) || 0) + a.NbMonteurs);
            }
        });

        return { weeklyAffectationTotals: affTotals, weeklyDemandeTotals: demTotals };
    }, [planningData, ficheChantierData]);

    const totalWidth = weeks.length * weekCellWidth;
    const monthSpans = React.useMemo(() => getMonthSpans(weeks), [weeks]);

    return (
        <div className="pm-annexe">
            <div className="pm-annexe-toolbar">
                <span className="pm-annexe-title">Annexe — Suivi de charge annuel {currentYear}</span>
                <span className="pm-annexe-subtitle">{rows.length} lignes · PM France uniquement</span>
                <button
                    className="pm-annexe-export-btn"
                    onClick={() => exportAnnexeToExcel(rows, summaryRows, weeks, currentYear)}
                    type="button"
                    title="Exporter en Excel"
                >
                    Exporter Excel
                </button>
            </div>

            {/* Header with months + week numbers */}
            <div className="pm-annexe-header-area">
                <div className="pm-annexe-header-left">
                    <div className="pm-annexe-col pm-annexe-col--tri">Trim.</div>
                    <div className="pm-annexe-col pm-annexe-col--pm">PM</div>
                    <div className="pm-annexe-col pm-annexe-col--res">Ress.</div>
                    <div className="pm-annexe-col pm-annexe-col--title">Désignation chantier</div>
                    <div className="pm-annexe-col pm-annexe-col--tension">Tension</div>
                    <div className="pm-annexe-col pm-annexe-col--debut">Début</div>
                    <div className="pm-annexe-col pm-annexe-col--total">Besoin Total</div>
                </div>
                <div
                    className="pm-annexe-header-right"
                    ref={headerScrollRef}
                    onScroll={e => syncScroll(e.target as HTMLDivElement, scrollRef.current)}
                >
                    <div style={{ width: totalWidth, minWidth: totalWidth }}>
                        {/* Month row */}
                        <div className="pm-annexe-month-row">
                            {monthSpans.map((ms, i) => (
                                <div
                                    key={i}
                                    className="pm-annexe-month-cell"
                                    style={{ width: ms.span * weekCellWidth }}
                                >
                                    {ms.monthName}
                                </div>
                            ))}
                        </div>
                        {/* Week number row */}
                        <div className="pm-annexe-week-row">
                            {weeks.map(w => (
                                <div
                                    key={w.weekNumber}
                                    className={`pm-annexe-week-cell ${w.weekNumber === currentWeek ? "pm-annexe-week-cell--current" : ""}`}
                                    style={{ width: weekCellWidth }}
                                >
                                    {w.weekNumber}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Body: scrollable */}
            <div
                className="pm-annexe-body"
                ref={scrollRef}
                onScroll={e => syncScroll(e.target as HTMLDivElement, headerScrollRef.current)}
            >
                {rows.map((row, idx) => (
                    <div key={`${row.projectUniqID}-${row.resource}`} className="pm-annexe-row">
                        <div className="pm-annexe-row-left">
                            <div className="pm-annexe-col pm-annexe-col--tri">{row.trimestre}</div>
                            <div className="pm-annexe-col pm-annexe-col--pm">{row.pm}</div>
                            <div
                                className="pm-annexe-col pm-annexe-col--res"
                                style={{ color: RESOURCE_COLORS[row.resource] }}
                            >
                                {row.resource}
                            </div>
                            <div className="pm-annexe-col pm-annexe-col--title" title={row.title}>
                                {row.title}
                            </div>
                            <div className="pm-annexe-col pm-annexe-col--tension">{row.tension}</div>
                            <div className="pm-annexe-col pm-annexe-col--debut">{row.debut ?? "—"}</div>
                            <div className="pm-annexe-col pm-annexe-col--total pm-annexe-col--total-value">
                                {row.besoinTotal}
                            </div>
                        </div>
                        <div className="pm-annexe-row-right">
                            <div style={{ width: totalWidth, minWidth: totalWidth, display: "flex" }}>
                                {weeks.map(w => {
                                    const val = row.weekData.get(w.weekNumber);
                                    return (
                                        <div
                                            key={w.weekNumber}
                                            className={`pm-annexe-cell ${w.weekNumber === currentWeek ? "pm-annexe-cell--current" : ""}`}
                                            style={{
                                                width: weekCellWidth,
                                                backgroundColor: val ? RESOURCE_BG_COLORS[row.resource] : undefined,
                                            }}
                                        >
                                            {val ? (
                                                <span style={{ color: RESOURCE_TEXT_COLORS[row.resource], fontWeight: 600 }}>
                                                    {val}
                                                </span>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Summary rows */}
                {summaryRows.map(sr => (
                    <div key={sr.resource} className="pm-annexe-row pm-annexe-row--summary">
                        <div className="pm-annexe-row-left">
                            <div className="pm-annexe-col pm-annexe-col--tri" />
                            <div className="pm-annexe-col pm-annexe-col--pm" />
                            <div
                                className="pm-annexe-col pm-annexe-col--res"
                                style={{
                                    color: RESOURCE_COLORS[sr.resource],
                                    fontWeight: 800,
                                }}
                            >
                                {sr.resource}
                            </div>
                            <div className="pm-annexe-col pm-annexe-col--title" style={{ fontWeight: 700 }}>
                                Total {sr.resource}
                            </div>
                            <div className="pm-annexe-col pm-annexe-col--tension" />
                            <div className="pm-annexe-col pm-annexe-col--debut" />
                            <div className="pm-annexe-col pm-annexe-col--total pm-annexe-col--total-value" style={{ fontWeight: 800 }}>
                                {sr.total}
                            </div>
                        </div>
                        <div className="pm-annexe-row-right">
                            <div style={{ width: totalWidth, minWidth: totalWidth, display: "flex" }}>
                                {weeks.map(w => {
                                    const val = sr.weekTotals.get(w.weekNumber);
                                    return (
                                        <div
                                            key={w.weekNumber}
                                            className={`pm-annexe-cell pm-annexe-cell--summary ${w.weekNumber === currentWeek ? "pm-annexe-cell--current" : ""}`}
                                            style={{
                                                width: weekCellWidth,
                                                backgroundColor: val ? RESOURCE_BG_COLORS[sr.resource] : undefined,
                                            }}
                                        >
                                            {val ? (
                                                <span style={{ color: RESOURCE_TEXT_COLORS[sr.resource], fontWeight: 800 }}>
                                                    {val}
                                                </span>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Chart section */}
                <AnnexeChart
                    weeks={weeks}
                    currentWeek={currentWeek}
                    weeklyAffectationTotals={weeklyAffectationTotals}
                    weeklyDemandeTotals={weeklyDemandeTotals}
                />
            </div>
        </div>
    );
};

export default AnnexeView;
