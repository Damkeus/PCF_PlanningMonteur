import * as React from "react";
import { IWeekInfo } from "../../types";
import { getMonthSpans, formatDayOfMonth } from "../../utils/weekUtils";

interface WeekHeaderProps {
    weeks: IWeekInfo[];
    currentWeek: number;
    weekCellWidth: number;
}

const WeekHeader: React.FC<WeekHeaderProps> = ({ weeks, currentWeek, weekCellWidth }) => {
    const monthSpans = React.useMemo(() => getMonthSpans(weeks), [weeks]);

    return (
        <div className="pm-week-header">
            {/* Row 1: Month names */}
            <div className="pm-week-header-row pm-week-header-months">
                {monthSpans.map((ms, i) => (
                    <div
                        key={i}
                        className="pm-week-header-month"
                        style={{ width: ms.span * weekCellWidth }}
                    >
                        {ms.monthName}
                    </div>
                ))}
            </div>

            {/* Row 2: Week numbers */}
            <div className="pm-week-header-row pm-week-header-weeks">
                {weeks.map((w) => (
                    <div
                        key={w.weekNumber}
                        className={`pm-week-header-week ${w.weekNumber === currentWeek ? "pm-week-header-week--current" : ""}`}
                        style={{ width: weekCellWidth }}
                    >
                        S{w.weekNumber}
                    </div>
                ))}
            </div>

            {/* Row 3: Monday dates */}
            <div className="pm-week-header-row pm-week-header-dates">
                {weeks.map((w) => (
                    <div
                        key={w.weekNumber}
                        className={`pm-week-header-date ${w.weekNumber === currentWeek ? "pm-week-header-date--current" : ""}`}
                        style={{ width: weekCellWidth }}
                    >
                        {formatDayOfMonth(w.mondayDate)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeekHeader;
