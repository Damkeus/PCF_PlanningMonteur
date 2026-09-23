import * as React from "react";
import { IMouvementEquipe, IPlanningAffectation, IWeekInfo, PMCode } from "../../types";
import { getMonthSpans } from "../../utils/weekUtils";

interface MouvementViewProps {
    mouvementData: IMouvementEquipe[];
    planningData: IPlanningAffectation[];
    currentYear: number;
    currentWeek: number;
    weeks: IWeekInfo[];
    weekCellWidth: number;
}

interface MouvementRow {
    key: string;
    libelle: string;
    weekData: Map<number, number>;
    total: number;
    color: string;
    bgColor: string;
}

const PM_FRANCE: PMCode[] = ["JC", "GP", "DW", "VB"];

const ABSENCE_STYLES: Record<string, { color: string; bg: string }> = {
    Absence: { color: "#B71C1C", bg: "#FDECEA" },
    Formation: { color: "#7B5800", bg: "#FFF6DB" },
    CP_Estimation: { color: "#1A5276", bg: "#E8F1F8" },
    CP_Reel: { color: "#0B3C5D", bg: "#D6E6F2" },
};

const DETACHEMENT_STYLE = { color: "#4A148C", bg: "#F3E5F5" };
const PM_STYLE = { color: "#1B5E20", bg: "#E8F5E9" };

function buildRows(
    records: IMouvementEquipe[],
    keyOf: (m: IMouvementEquipe) => string,
    styleOf: (m: IMouvementEquipe) => { color: string; bg: string }
): MouvementRow[] {
    const byKey = new Map<string, MouvementRow>();
    records.forEach((m) => {
        const key = keyOf(m);
        let row = byKey.get(key);
        if (!row) {
            const style = styleOf(m);
            row = {
                key,
                libelle: m.Libelle || m.Categorie,
                weekData: new Map(),
                total: 0,
                color: style.color,
                bgColor: style.bg,
            };
            byKey.set(key, row);
        }
        row.weekData.set(m.WeekNumber, (row.weekData.get(m.WeekNumber) || 0) + m.NbMonteurs);
        row.total += m.NbMonteurs;
    });
    return Array.from(byKey.values());
}

/**
 * Vue « Mouvement équipes » — remplace la grille projets (toggle header).
 * Affiche par semaine : absences/CP/formation, détachements NxFR
 * vers les projets hors marché cadre, et demandes PM agrégées.
 */
const MouvementView: React.FC<MouvementViewProps> = ({
    mouvementData,
    planningData,
    currentYear,
    currentWeek,
    weeks,
    weekCellWidth,
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const headerScrollRef = React.useRef<HTMLDivElement>(null);
    const isSyncing = React.useRef(false);

    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement | null) => {
        if (isSyncing.current || !target) return;
        isSyncing.current = true;
        target.scrollLeft = source.scrollLeft;
        requestAnimationFrame(() => { isSyncing.current = false; });
    };

    const yearData = React.useMemo(
        () => mouvementData.filter((m) => m.Year === currentYear),
        [mouvementData, currentYear]
    );

    const absenceRows = React.useMemo(() => {
        const order = ["Absence", "Formation", "CP_Estimation", "CP_Reel"];
        const rows = buildRows(
            yearData.filter((m) => m.Categorie !== "Detachement"),
            (m) => m.Categorie,
            (m) => ABSENCE_STYLES[m.Categorie] ?? { color: "#333", bg: "#EEE" }
        );
        return rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    }, [yearData]);

    const detachementRows = React.useMemo(
        () => buildRows(
            yearData.filter((m) => m.Categorie === "Detachement"),
            (m) => m.Libelle,
            () => ({ color: DETACHEMENT_STYLE.color, bg: DETACHEMENT_STYLE.bg })
        ).sort((a, b) => b.total - a.total),
        [yearData]
    );

    // Demandes PM agrégées par PM (calculées en direct depuis les affectations)
    const demandePMRows = React.useMemo(() => {
        const rows: MouvementRow[] = PM_FRANCE.map((pm) => ({
            key: pm,
            libelle: `Demandes ${pm}`,
            weekData: new Map<number, number>(),
            total: 0,
            color: PM_STYLE.color,
            bgColor: PM_STYLE.bg,
        }));
        const byPM = new Map(rows.map((r) => [r.key, r]));
        planningData.forEach((a) => {
            if (!a.IsDemandePM || a.Year !== currentYear || !a.PM) return;
            const row = byPM.get(a.PM);
            if (!row) return;
            row.weekData.set(a.WeekNumber, (row.weekData.get(a.WeekNumber) || 0) + a.NbMonteurs);
            row.total += a.NbMonteurs;
        });
        return rows.filter((r) => r.total > 0);
    }, [planningData, currentYear]);

    // Total indispo = absences + formation + CP (réel prioritaire) + détachements
    const totalRow = React.useMemo(() => {
        const weekData = new Map<number, number>();
        let total = 0;
        const cpReel = absenceRows.find((r) => r.key === "CP_Reel");
        absenceRows
            .filter((r) => r.key !== "CP_Estimation" || !cpReel || cpReel.total === 0)
            .concat(detachementRows)
            .forEach((r) => {
                r.weekData.forEach((v, wk) => weekData.set(wk, (weekData.get(wk) || 0) + v));
                r.weekData.forEach((v) => { total += v; });
            });
        return { weekData, total };
    }, [absenceRows, detachementRows]);

    const totalWidth = weeks.length * weekCellWidth;
    const monthSpans = React.useMemo(() => getMonthSpans(weeks), [weeks]);

    const renderCells = (row: { weekData: Map<number, number>; color?: string; bgColor?: string }, bold = false) => (
        <div style={{ width: totalWidth, minWidth: totalWidth, display: "flex" }}>
            {weeks.map((w) => {
                const val = row.weekData.get(w.weekNumber);
                return (
                    <div
                        key={w.weekNumber}
                        className={`pm-annexe-cell ${w.weekNumber === currentWeek ? "pm-annexe-cell--current" : ""}`}
                        style={{
                            width: weekCellWidth,
                            backgroundColor: val ? row.bgColor : undefined,
                        }}
                    >
                        {val ? (
                            <span style={{ color: row.color ?? "#333", fontWeight: bold ? 800 : 600 }}>
                                {val % 1 === 0 ? val : val.toFixed(1)}
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );

    const renderSection = (label: string, rows: MouvementRow[]) => (
        <>
            <div className="pm-mouvement-section-row">
                <div className="pm-mouvement-section-label">{label}</div>
                <div className="pm-mouvement-section-fill" />
            </div>
            {rows.length === 0 ? (
                <div className="pm-mouvement-empty">Aucune donnée {currentYear}</div>
            ) : (
                rows.map((row) => (
                    <div key={row.key} className="pm-annexe-row">
                        <div className="pm-annexe-row-left pm-mouvement-row-left">
                            <div className="pm-mouvement-col-libelle" title={row.libelle}>
                                <span className="pm-mouvement-dot" style={{ backgroundColor: row.color }} />
                                {row.libelle}
                            </div>
                            <div className="pm-mouvement-col-total">{Math.round(row.total * 10) / 10}</div>
                        </div>
                        <div className="pm-annexe-row-right">{renderCells(row)}</div>
                    </div>
                ))
            )}
        </>
    );

    return (
        <div className="pm-annexe pm-mouvement">
            <div className="pm-annexe-toolbar">
                <span className="pm-annexe-title">Mouvement équipes — {currentYear}</span>
                <span className="pm-annexe-subtitle">
                    Absences, CP, formations et détachements des monteurs NxFR
                </span>
            </div>

            {/* Header with months + week numbers */}
            <div className="pm-annexe-header-area">
                <div className="pm-annexe-header-left pm-mouvement-header-left">
                    <div className="pm-mouvement-col-libelle">Mouvement</div>
                    <div className="pm-mouvement-col-total">Total</div>
                </div>
                <div
                    className="pm-annexe-header-right"
                    ref={headerScrollRef}
                    onScroll={(e) => syncScroll(e.target as HTMLDivElement, scrollRef.current)}
                >
                    <div style={{ width: totalWidth, minWidth: totalWidth }}>
                        <div className="pm-annexe-month-row">
                            {monthSpans.map((ms, i) => (
                                <div key={i} className="pm-annexe-month-cell" style={{ width: ms.span * weekCellWidth }}>
                                    {ms.monthName}
                                </div>
                            ))}
                        </div>
                        <div className="pm-annexe-week-row">
                            {weeks.map((w) => (
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

            {/* Body */}
            <div
                className="pm-annexe-body"
                ref={scrollRef}
                onScroll={(e) => syncScroll(e.target as HTMLDivElement, headerScrollRef.current)}
            >
                {renderSection("Absences & indisponibilités", absenceRows)}
                {renderSection("Détachements (hors marché cadre)", detachementRows)}
                {renderSection("Demandes PM (marché cadre)", demandePMRows)}

                {/* Total row */}
                <div className="pm-annexe-row pm-annexe-row--summary">
                    <div className="pm-annexe-row-left pm-mouvement-row-left">
                        <div className="pm-mouvement-col-libelle" style={{ fontWeight: 800 }}>
                            Total monteurs indisponibles / détachés
                        </div>
                        <div className="pm-mouvement-col-total" style={{ fontWeight: 800 }}>
                            {Math.round(totalRow.total * 10) / 10}
                        </div>
                    </div>
                    <div className="pm-annexe-row-right">
                        {renderCells({ weekData: totalRow.weekData, color: "#B71C1C", bgColor: "#FDECEA" }, true)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MouvementView;
