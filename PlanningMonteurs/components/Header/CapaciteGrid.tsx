import * as React from "react";
import { IPlanningCapacite, IWeekInfo } from "../../types";
import { CAPACITE_ROW_LABELS, WEEK_CELL_WIDTH } from "../Shared/constants";
import { getSoldeColor, getAbsenceColor } from "../../utils/colorUtils";
import CommentEditor from "../Shared/CommentEditor";

interface CapaciteGridProps {
    capaciteData: IPlanningCapacite[];
    weeks: IWeekInfo[];
    currentWeek: number;
    isAdmin: boolean;
    onSaveCapacite: (record: IPlanningCapacite) => void;
    scrollRef: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    weekCellWidth: number;
}

const CapaciteGrid: React.FC<CapaciteGridProps> = ({
    capaciteData,
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

    React.useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);

    const handleCellClick = (rowKey: string, weekNumber: number) => {
        if (!isAdmin) return;
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
                MonteursNxFR: 0,
                SoldeNxFR: 0,
                BesoinSoustraitantSCLS: 0,
                NbMonteursSCLS_Dispo: 0,
                SoldeMonteurSCLS: 0,
                BesoinSoustraitantHTB: 0,
                NbMonteursHTB_Dispo: 0,
                SoldeMonteurHTB: 0,
                EffectifManquant: 0,
                BesoinTotalMonteurs: 0,
                CP: 0,
                Formation: 0,
                Absence: 0,
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

    const getCellValue = (rowKey: string, weekNumber: number): number => {
        const cap = capaciteMap.get(weekNumber);
        if (!cap) return 0;
        return (cap as unknown as Record<string, unknown>)[rowKey] as number ?? 0;
    };

    const isHighlightRow = (rowKey: string) =>
        rowKey === "SoldeNxFR" || rowKey === "EffectifManquant" || rowKey === "SoldeMonteurSCLS" || rowKey === "SoldeMonteurHTB";

    const isAbsenceRow = (rowKey: string) =>
        rowKey === "CP" || rowKey === "Formation" || rowKey === "Absence";

    const totalWidth = weeks.length * WEEK_CELL_WIDTH;

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

    return (
        <div className="pm-capacite-grid">
            <div className="pm-capacite-section-label">TABLEAU DE CHARGE</div>

            {CAPACITE_ROW_LABELS.map(({ key, label }) => (
                <div key={key} className="pm-capacite-row">
                    <div className="pm-capacite-row-left">
                        <span className="pm-capacite-label">{label}</span>
                    </div>
                    <div
                        className="pm-capacite-row-right"
                        ref={key === CAPACITE_ROW_LABELS[0].key ? scrollRef : undefined}
                        onScroll={key === CAPACITE_ROW_LABELS[0].key ? onScroll : undefined}
                    >
                        <div style={{ width: totalWidth, minWidth: totalWidth, display: "flex" }}>
                            {weeks.map((w) => {
                                const value = getCellValue(key, w.weekNumber);
                                const isEditing = editingCell?.row === key && editingCell?.week === w.weekNumber;
                                const highlight = isHighlightRow(key);
                                const isAbsence = isAbsenceRow(key);
                                const soldeStyle = highlight
                                    ? getSoldeColor(value)
                                    : isAbsence
                                        ? getAbsenceColor(value)
                                        : { bg: "transparent", text: "#1A1A1A" };
                                const isBoldRow = key === "BesoinTotalMonteurs";

                                return (
                                    <div
                                        key={w.weekNumber}
                                        className={`pm-capacite-cell ${w.weekNumber === currentWeek ? "pm-capacite-cell--current" : ""}`}
                                        style={{
                                            width: WEEK_CELL_WIDTH,
                                            backgroundColor: soldeStyle.bg,
                                        }}
                                        onClick={() => handleCellClick(key, w.weekNumber)}
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
                                                className={`pm-capacite-value ${isBoldRow ? "pm-capacite-value--bold" : ""}`}
                                                style={{ color: soldeStyle.text }}
                                            >
                                                {value !== 0 ? value : ""}
                                            </span>
                                        )}

                                        {/* Comment dot for capacité */}
                                        {key === CAPACITE_ROW_LABELS[0].key && capaciteMap.get(w.weekNumber)?.Commentaire && (
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
