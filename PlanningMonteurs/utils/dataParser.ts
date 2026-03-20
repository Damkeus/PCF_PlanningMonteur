import {
    IFicheChantier,
    IPlanningAffectation,
    IPlanningCapacite,
    IPlanningFiabilite,
    IMonteur,
    PMFilter,
    PMCode,
} from "../types";

/**
 * Safe JSON parse with fallback to empty array.
 */
function safeParseArray<T>(json: string | undefined | null): T[] {
    if (!json || json.trim() === "") return [];
    try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn("[PlanningMonteurs] JSON parse error:", e);
        return [];
    }
}

/**
 * Parse planning affectation data from JSON string.
 */
export function parsePlanningData(json: string | undefined | null): IPlanningAffectation[] {
    return safeParseArray<IPlanningAffectation>(json);
}

/**
 * Parse capacité data from JSON string.
 */
export function parseCapaciteData(json: string | undefined | null): IPlanningCapacite[] {
    return safeParseArray<IPlanningCapacite>(json);
}

/**
 * Parse fiche chantier data from JSON string.
 */
export function parseFicheChantierData(json: string | undefined | null): IFicheChantier[] {
    return safeParseArray<IFicheChantier>(json);
}

/**
 * Parse fiabilité data from JSON string.
 */
export function parseFiabiliteData(json: string | undefined | null): IPlanningFiabilite[] {
    return safeParseArray<IPlanningFiabilite>(json);
}

/**
 * Parse monteurs data from JSON string.
 */
export function parseMonteursData(json: string | undefined | null): IMonteur[] {
    return safeParseArray<IMonteur>(json);
}

/**
 * Parse available years from JSON or comma-separated string.
 */
export function parseAvailableYears(json: string | undefined | null): number[] {
    if (!json || json.trim() === "") return [];
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) return parsed.map(Number).filter(n => !isNaN(n));
        return [];
    } catch {
        // Try comma-separated
        return json.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }
}

/**
 * Parse available PMs from JSON or comma-separated string.
 */
export function parseAvailablePMs(json: string | undefined | null): string[] {
    if (!json || json.trim() === "") return [];
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) return parsed.map(String);
        return [];
    } catch {
        return json.split(",").map(s => s.trim()).filter(s => s.length > 0);
    }
}

/**
 * Filter projects based on PM filter selection.
 */
export function filterProjects(
    projects: IFicheChantier[],
    filter: PMFilter
): IFicheChantier[] {
    const pmCodes: PMCode[] = ["JC", "GP", "DW", "VB"];

    switch (filter) {
        case "ALL":
            return projects.filter(p => p.PM && pmCodes.includes(p.PM));
        case "JC":
        case "GP":
        case "DW":
        case "VB":
            return projects.filter(p => p.PM === filter);
        case "HMC":
            return projects.filter(p => !p.PM || !pmCodes.includes(p.PM));
        case "ALL_HMC":
            return projects;
        default:
            return projects;
    }
}
