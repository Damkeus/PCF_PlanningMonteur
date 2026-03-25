import * as React from "react";
import { IPlanningCapacite, IPlanningAffectation, IFicheChantier, IWeekInfo } from "../../types";
import { CAPACITE_SECTIONS, CapaciteSection, CapaciteRowDef } from "../Shared/constants";
import { getSoldeColor } from "../../utils/colorUtils";
import CommentEditor from "../Shared/CommentEditor";

interface CapaciteGridProps {
    capaciteData: IPlanningCapacite[];
    planningData: IPlanningAffectation[];
    ficheChantierData: IFicheChantier[];
    weeks: IWeekInfo[];
    currentWeek: number;
    isAdmin: boolean;
    onSaveCapacite: (record: IPlanningCapacite) => void;
    scrollRef: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    weekCellWidth: number;
}

/** Keys from IPlanningCapacite that can be edited directly */
const EDITABLE_KEYS = new Set([
    "MonteursNxFR", "SoldeNxFR",
    "NbMonteursSCLS_Dispo", "SoldeMonteurSCLS",
    "NbMonteursHTB_Dispo", "SoldeMonteurHTB",
    "EffectifManquant",
    "CP", "Formation", "Absence",
    "BesoinSoustraitantSCLS", "BesoinSoustraitantHTB",
    "BesoinTotalMonteurs", "NbMonteursSCLS_Dispo", "NbMonteursHTB_Dispo",
]);

const CapaciteGrid: React.FC<CapaciteGridProps> = ({
    capaciteData,
    planningData,
    ficheChantierData,
    weeks,
    currentWeek,
    isAdmin,
    onSaveCapacite,
    scrollRef,
    onScroll,
    weekCellWidth,
}) => {
    const [editingCell, setEditingCell] = React.useState<{ row: string; week: number } | null>(null);
    const [editValue, setEditValue] = React.useState("");
    const [commentCell, setCommentCell] = React.useState<number | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Build lookup: weekNumber → capacité record
    const capaciteMap = React.useMemo(() => {
        const map = new Map<number, IPlanningCapacite>();
        capaciteData.forEach((c) => map.set(c.WeekNumber, c));
        return map;
    }, [capaciteData]);

    // Pre-compute weekly aggregates from planningData
    const weeklyAggregates = React.useMemo(() => {
        const agg = new Map<number, { nxfrTotal: number; frameTotal: number; horsFrameTotal: number }>();
        const cdcSet = new Set(ficheChantierData.filter(p => p.CDC).map(p => p.ProjectUniqID));
        planningData
            .filter(a => !a.IsDemandePM)
            .forEach(a => {
                const entry = agg.get(a.WeekNumber) || { nxfrTotal: 0, frameTotal: 0, horsFrameTotal: 0 };
                if (a.ResourceType === "NxFR") entry.nxfrTotal += a.NbMonteurs;
                if (cdcSet.has(a.ProjectUniqID)) entry.frameTotal += a.NbMonteurs;
                else entry.horsFrameTotal += a.NbMonteurs;
                agg.set(a.WeekNumber, entry);
            });
        return agg;
    }, [planningData, ficheChantierData]);

    React.useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);

    const handleCellClick = (rowKey: string, weekNumber: number, isComputed: boolean) => {
        if (!isAdmin || isComputed) return;
        if (!EDITABLE_KEYS.has(rowKey)) return;
        const cap = capaciteMap.get(weekNumber);
        const currentValue = cap ? (cap as unknown as Record<string, unknown>)[rowKey] : 0;
        setEditingCell({ row: rowKey, week: weekNumber });
        setEditValue(String(currentValue ?? 0));
    };

    const saveEdit = () => {
        if (!editingCell) return;
        const { row, week } = editingCell;
        const num = parseFloat(editValue) || 0;
        const existing = capaciteMap.get(week);
        const record: IPlanningCapacite = {
            ...(existing || {
                Year: weeks[0]?.year || new Date().getFullYear(),
                WeekNumber: week,
                MonteursNxFR: 0, SoldeNxFR: 0,
                BesoinSoustraitantSCLS: 0, NbMonteursSCLS_Dispo: 0, SoldeMonteurSCLS: 0,
                BesoinSoustraitantHTB: 0, NbMonteursHTB_Dispo: 0, SoldeMonteurHTB: 0,
                EffectifManquant: 0, BesoinTotalMonteurs: 0,
                CP: 0, Formation: 0, Absence: 0,
            }),
            [row]: num,
        };
        if (existing?.ID) record.ID = existing.ID;
        onSaveCapacite(record);
        setEditingCell(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") saveEdit();
        else if (e.key === "Escape") setEditingCell(null);
    };

    /** Get cell value — handles both stored and computed keys */
    const getCellValue = (rowKey: string, weekNumber: number): number => {
        const cap = capaciteMap.get(weekNumber);
        const agg = weeklyAggregates.get(weekNumber);

        switch (rowKey) {
            case "MonteursNxFR_Dispo": {
                if (!cap) return 0;
                return (cap.MonteursNxFR || 0) - (cap.CP || 0) - (cap.Formation || 0) - (cap.Absence || 0);
            }
            case "BesoinsFrameHF":
                return agg?.nxfrTotal ?? 0;
            case "EffectifDispoFrameHF": {
                const dispo = getCellValue("MonteursNxFR_Dispo", weekNumber);
                const besoins = getCellValue("BesoinsFrameHF", weekNumber);
                return dispo - besoins;
            }
            case "TotalBesoinFrame":
                return agg?.frameTotal ?? 0;
            case "TotalHorsFrame":
                return agg?.horsFrameTotal ?? 0;
            default: {
                if (!cap) return 0;
                return (cap as unknown as Record<string, unknown>)[rowKey] as number ?? 0;
            }
        }
    };

    const totalWidth = weeks.length * weekCellWidth;

    const handleCommentSave = (weekNumber: number, comment: string) => {
        const existing = capaciteMap.get(weekNumber);
        const record: IPlanningCapacite = {
            ...(existing || {
                Year: weeks[0]?.year || new Date().getFullYear(),
                WeekNumber: weekNumber,
                MonteursNxFR: 0, SoldeNxFR: 0,
                BesoinSoustraitantSCLS: 0, NbMonteursSCLS_Dispo: 0, SoldeMonteurSCLS: 0,
                BesoinSoustraitantHTB: 0, NbMonteursHTB_Dispo: 0, SoldeMonteurHTB: 0,
                EffectifManquant: 0, BesoinTotalMonteurs: 0,
                CP: 0, Formation: 0, Absence: 0,
            }),
            Commentaire: comment || null,
        };
        if (existing?.ID) record.ID = existing.ID;
        onSaveCapacite(record);
        setCommentCell(null);
    };

    // Track if we've attached the scrollRef to the first row
    let scrollRefAttached = false;

    const renderRow = (rowDef: CapaciteRowDef, section: CapaciteSection, isFirstRowInGrid: boolean) => {
        const { key, label, computed, highlight, bold } = rowDef;
        const isYellowSection = section.id === "improductif";

        // Attach scrollRef to first scrollable row only
        const attachScroll = !scrollRefAttached;
        if (attachScroll) scrollRefAttached = true;

        return (
            <div
                key={key}
                className={`pm-capacite-row ${isYellowSection ? "pm-capacite-row--yellow" : ""}`}
            >
                <div className="pm-capacite-row-left">
                    <span className={`pm-capacite-label ${computed ? "pm-capacite-label--computed" : ""}`}>
                        {label}
                    </span>
                </div>
                <div
                    className="pm-capacite-row-right"
                    ref={attachScroll ? scrollRef : undefined}
                    onScroll={attachScroll ? onScroll : undefined}
                >
                    <div style={{ width: totalWidth, minWidth: totalWidth, display: "flex" }}>
                        {weeks.map((w) => {
                            const value = getCellValue(key, w.weekNumber);
                            const isEditing = editingCell?.row === key && editingCell?.week === w.weekNumber;
                            const soldeStyle = highlight
                                ? getSoldeColor(value)
                                : { bg: "transparent", text: "#1A1A1A" };

                            return (
                                <div
                                    key={w.weekNumber}
                                    className={[
                                        "pm-capacite-cell",
                                        w.weekNumber === currentWeek ? "pm-capacite-cell--current" : "",
                                        computed ? "pm-capacite-cell--computed" : "",
                                    ].filter(Boolean).join(" ")}
                                    style={{
                                        width: weekCellWidth,
                                        backgroundColor: isYellowSection ? "#FFF8E1" : soldeStyle.bg,
                                    }}
                                    onClick={() => handleCellClick(key, w.weekNumber, !!computed)}
                                >
                                    {isEditing ? (
                                        <input
                                            ref={inputRef}
                                            className="pm-capacite-input"
                                            type="number"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            onBlur={saveEdit}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span
                                            className={[
                                                "pm-capacite-value",
                                                bold ? "pm-capacite-value--bold" : "",
                                                key === "TotalBesoinFrame" ? "pm-capacite-value--red" : "",
                                            ].filter(Boolean).join(" ")}
                                            style={{ color: highlight ? soldeStyle.text : undefined }}
                                        >
                                            {value !== 0 ? value : ""}
                                        </span>
                                    )}

                                    {/* Comment dot on first row */}
                                    {isFirstRowInGrid && key === CAPACITE_SECTIONS[0].rows[0].key && capaciteMap.get(w.weekNumber)?.Commentaire && (
                                        <div
                                            className="pm-comment-dot pm-comment-dot--capacite"
                                            title={capaciteMap.get(w.weekNumber)?.Commentaire || ""}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isAdmin) setCommentCell(w.weekNumber);
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="pm-capacite-grid">
            <div className="pm-capacite-title-label">TABLEAU DE CHARGE</div>

            {CAPACITE_SECTIONS.map((section) => (
                <div key={section.id} className="pm-capacite-section">
                    {/* Section label on the left */}
                    {section.label && (
                        <div
                            className="pm-capacite-section-header"
                            style={{ backgroundColor: section.bgColor, color: section.color }}
                        >
                            {section.label}
                        </div>
                    )}
                    <div className={`pm-capacite-section-rows ${!section.label ? "pm-capacite-section-rows--no-header" : ""}`}>
                        {section.rows.map((rowDef, idx) =>
                            renderRow(rowDef, section, section === CAPACITE_SECTIONS[0] && idx === 0)
                        )}
                    </div>
                </div>
            ))}

            {/* Comment editor popup */}
            {commentCell !== null && (
                <div className="pm-comment-editor-overlay" onClick={() => setCommentCell(null)}>
                    <div onClick={e => e.stopPropagation()}>
                        <CommentEditor
                            value={capaciteMap.get(commentCell)?.Commentaire || ""}
                            onSave={(comment) => handleCommentSave(commentCell, comment)}
                            onCancel={() => setCommentCell(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapaciteGrid;
