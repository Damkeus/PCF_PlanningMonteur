import { IWeekInfo, IMonthSpan } from "../types";

/**
 * Returns the ISO week number for a given date.
 * ISO 8601: weeks start on Monday, week 1 contains Jan 4.
 */
export function getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns the Monday of ISO week `weekNum` in `year`.
 */
export function getMondayOfWeek(year: number, weekNum: number): Date {
    // Jan 4 is always in ISO week 1
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7; // Mon=1..Sun=7
    // Monday of week 1
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setDate(jan4.getDate() - (dayOfWeek - 1));
    // Add (weekNum - 1) * 7 days
    const monday = new Date(mondayWeek1);
    monday.setDate(mondayWeek1.getDate() + (weekNum - 1) * 7);
    return monday;
}

const MONTH_NAMES_FR = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
];

/**
 * Returns all ISO weeks for a given year, with Monday dates and month info.
 */
export function getWeeksForYear(year: number): IWeekInfo[] {
    const weeks: IWeekInfo[] = [];
    // ISO weeks: 52 or 53 weeks
    const maxWeek = getMaxWeeksInYear(year);

    for (let w = 1; w <= maxWeek; w++) {
        const monday = getMondayOfWeek(year, w);
        weeks.push({
            weekNumber: w,
            mondayDate: monday,
            month: monday.getMonth(),
            monthName: MONTH_NAMES_FR[monday.getMonth()],
            year: monday.getFullYear(),
        });
    }
    return weeks;
}

/**
 * Returns the number of ISO weeks in a given year (52 or 53).
 */
export function getMaxWeeksInYear(year: number): number {
    // A year has 53 weeks if Jan 1 is a Thursday,
    // or Dec 31 is a Thursday (leap year adjustment).
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    const p = (d: Date) => d.getDay() === 4; // Thursday
    return p(jan1) || p(dec31) ? 53 : 52;
}

/**
 * Returns month spans for the week header (month name + number of weeks it spans).
 */
export function getMonthSpans(weeks: IWeekInfo[]): IMonthSpan[] {
    if (weeks.length === 0) return [];

    const spans: IMonthSpan[] = [];
    let currentMonth = weeks[0].month;
    let currentName = weeks[0].monthName;
    let startIndex = 0;
    let count = 1;

    for (let i = 1; i < weeks.length; i++) {
        if (weeks[i].month === currentMonth) {
            count++;
        } else {
            spans.push({
                monthName: currentName,
                startIndex,
                span: count,
            });
            currentMonth = weeks[i].month;
            currentName = weeks[i].monthName;
            startIndex = i;
            count = 1;
        }
    }
    spans.push({ monthName: currentName, startIndex, span: count });
    return spans;
}

/**
 * Format a date as "DD" (day of month).
 */
export function formatDayOfMonth(date: Date): string {
    return date.getDate().toString();
}
