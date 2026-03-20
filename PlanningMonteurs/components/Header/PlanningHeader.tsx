import * as React from "react";
import { PMFilter } from "../../types";
import { FILTER_OPTIONS, MIN_VISIBLE_WEEKS, MAX_VISIBLE_WEEKS } from "../Shared/constants";

interface PlanningHeaderProps {
    currentYear: number;
    currentWeek: number;
    selectedPMFilter: PMFilter;
    availableYears: number[];
    isAdmin: boolean;
    onYearChange: (year: number) => void;
    onFilterChange: (filter: PMFilter) => void;
    editModeToggle?: React.ReactNode;
    hasMovements?: boolean;
    onConfirmMoves?: () => void;
    visibleWeeks: number;
    onZoomChange: (weeks: number) => void;
}

const PlanningHeader: React.FC<PlanningHeaderProps> = ({
    currentYear,
    currentWeek,
    selectedPMFilter,
    availableYears,
    isAdmin,
    onYearChange,
    onFilterChange,
    editModeToggle,
    hasMovements,
    onConfirmMoves,
    visibleWeeks,
    onZoomChange,
}) => {
    const yearOptions = availableYears.length > 0
        ? availableYears
        : [currentYear - 1, currentYear, currentYear + 1];

    const zoomLabel = visibleWeeks >= MAX_VISIBLE_WEEKS
        ? "Annuel"
        : `${visibleWeeks} sem.`;

    return (
        <div className="pm-header">
            <div className="pm-header-left">
                <div className="pm-header-brand">
                    <div className="pm-header-logo">
                        <span className="pm-header-logo-block" />
                        <span className="pm-header-logo-text">NEXANS</span>
                    </div>
                    <div className="pm-header-title">
                        Planning Monteurs
                    </div>
                </div>
            </div>

            <div className="pm-header-right">
                {/* Edit mode toggle (admin only) */}
                {editModeToggle}

                {/* Save button (visible when projects have been shifted) */}
                {hasMovements && onConfirmMoves && (
                    <button
                        className="pm-save-btn"
                        onClick={onConfirmMoves}
                        type="button"
                        title="Enregistrer les déplacements"
                    >
                        <span className="pm-save-btn-icon">💾</span>
                    </button>
                )}

                {/* Zoom slider: 10 semaines → 52 semaines */}
                <div className="pm-zoom-control">
                    <input
                        type="range"
                        className="pm-zoom-slider"
                        min={MIN_VISIBLE_WEEKS}
                        max={MAX_VISIBLE_WEEKS}
                        step={1}
                        value={visibleWeeks}
                        onChange={e => onZoomChange(parseInt(e.target.value, 10))}
                        title={`Zoom : ${zoomLabel}`}
                    />
                    <span className="pm-zoom-label">{zoomLabel}</span>
                </div>

                {/* Year selector */}
                <div className="pm-header-control">
                    <select
                        className="pm-header-select"
                        value={currentYear}
                        onChange={e => onYearChange(parseInt(e.target.value, 10))}
                    >
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* PM Filter */}
                <div className="pm-header-control">
                    <select
                        className="pm-header-select"
                        value={selectedPMFilter}
                        onChange={e => onFilterChange(e.target.value as PMFilter)}
                    >
                        {FILTER_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Current week badge */}
                <div className="pm-header-week-badge">
                    <span className="pm-header-week-badge-label">Semaine</span>
                    <span className="pm-header-week-badge-number">{currentWeek}</span>
                </div>

                {/* Admin indicator */}
                {isAdmin && (
                    <div className="pm-header-role-badge">Admin</div>
                )}
            </div>
        </div>
    );
};

export default PlanningHeader;
