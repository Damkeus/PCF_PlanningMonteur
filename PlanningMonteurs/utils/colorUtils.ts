import { ResourceType, FiabiliteLevel } from "../types";
import { RESOURCE_COLORS, RESOURCE_BG_COLORS, RESOURCE_TEXT_COLORS, FIABILITE_COLORS, FIABILITE_TEXT_COLORS } from "../components/Shared/constants";

/**
 * Returns the solid color for a ResourceType.
 */
export function getResourceColor(type: ResourceType): string {
    return RESOURCE_COLORS[type] || "#9E9E9E";
}

/**
 * Returns the semi-opaque background color for cells.
 */
export function getResourceBgColor(type: ResourceType): string {
    return RESOURCE_BG_COLORS[type] || "rgba(158, 158, 158, 0.18)";
}

/**
 * Returns the dark text color for cells.
 */
export function getResourceTextColor(type: ResourceType): string {
    return RESOURCE_TEXT_COLORS[type] || "#424242";
}

/**
 * Returns the badge background color for a fiabilité level.
 */
export function getFiabiliteColor(level: FiabiliteLevel): string {
    return FIABILITE_COLORS[level] || "#9E9E9E";
}

/**
 * Returns the badge text color for a fiabilité level.
 */
export function getFiabiliteTextColor(level: FiabiliteLevel): string {
    return FIABILITE_TEXT_COLORS[level] || "#FFFFFF";
}

/**
 * Returns background color for solde values (green for positive, red for negative).
 */
export function getSoldeColor(value: number): { bg: string; text: string } {
    if (value < 0) {
        return { bg: "rgba(211, 47, 47, 0.12)", text: "#D32F2F" };
    } else if (value > 0) {
        return { bg: "rgba(46, 125, 50, 0.08)", text: "#2E7D32" };
    }
    return { bg: "transparent", text: "#424242" };
}

/**
 * Returns orange color for absence rows (CP, Formation, Absence) when value > 0.
 */
export function getAbsenceColor(value: number): { bg: string; text: string } {
    if (value > 0) {
        return { bg: "rgba(245, 166, 35, 0.15)", text: "#B45309" };
    }
    return { bg: "transparent", text: "#9E9E9E" };
}
