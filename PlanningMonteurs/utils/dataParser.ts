import {
    IFicheChantier,
    IPlanningAffectation,
    IPlanningCapacite,
    IPlanningFiabilite,
    IMonteur,
    IMouvementEquipe,
    ITabletteChantier,
    PMFilter,
    PMCode,
} from "../types";
import {
    normalizeRows,
    PLANNING_FIELD_MAP,
    CAPACITE_FIELD_MAP,
    FICHE_CHANTIER_FIELD_MAP,
    FIABILITE_FIELD_MAP,
    MOUVEMENT_FIELD_MAP,
    MONTEUR_FIELD_MAP,
} from "./fieldNameMap";

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
    return normalizeRows<IPlanningAffectation>(
        safeParseArray<unknown>(json),
        PLANNING_FIELD_MAP,
        "planningData",
    );
}

/**
 * Parse capacité data from JSON string.
 */
export function parseCapaciteData(json: string | undefined | null): IPlanningCapacite[] {
    return normalizeRows<IPlanningCapacite>(
        safeParseArray<unknown>(json),
        CAPACITE_FIELD_MAP,
        "capaciteData",
    );
}

/**
 * Parse fiche chantier data from JSON string.
 */
export function parseFicheChantierData(json: string | undefined | null): IFicheChantier[] {
    return normalizeRows<IFicheChantier>(
        safeParseArray<unknown>(json),
        FICHE_CHANTIER_FIELD_MAP,
        "ficheChantierData",
    );
}

/**
 * Parse fiabilité data from JSON string.
 */
export function parseFiabiliteData(json: string | undefined | null): IPlanningFiabilite[] {
    return normalizeRows<IPlanningFiabilite>(
        safeParseArray<unknown>(json),
        FIABILITE_FIELD_MAP,
        "fiabiliteData",
    );
}

/**
 * Parse monteurs data from JSON string.
 */
export function parseMonteursData(json: string | undefined | null): IMonteur[] {
    return normalizeRows<IMonteur>(
        safeParseArray<unknown>(json),
        MONTEUR_FIELD_MAP,
        "monteursData",
    );
}

/**
 * Parse TabletteChantier data from JSON string.
 *
 * Pas de normalisation : les colonnes de cette liste ont un nom interne
 * correct (MonteurMail, PM, Progress…) — vérifié dans le volet Properties.
 */
export function parseTabletteChantierData(json: string | undefined | null): ITabletteChantier[] {
    return safeParseArray<ITabletteChantier>(json);
}

/**
 * Parse mouvement équipe data from JSON string.
 */
export function parseMouvementData(json: string | undefined | null): IMouvementEquipe[] {
    return normalizeRows<IMouvementEquipe>(
        safeParseArray<unknown>(json),
        MOUVEMENT_FIELD_MAP,
        "mouvementData",
    );
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
 *
 * Le statut "Hors Marché Cadre" est porté par IsHorsMarche, indépendamment
 * du PM : un projet marché cadre sans PM attribué doit rester visible dans
 * "ALL" (pour pouvoir lui attribuer un PM), alors qu'un projet Hors Marché
 * Cadre reste dans son propre filtre même s'il a un PM.
 */
export function filterProjects(
    projects: IFicheChantier[],
    filter: PMFilter
): IFicheChantier[] {
    switch (filter) {
        case "ALL":
            return projects.filter(p => !p.IsHorsMarche);
        case "JC":
        case "GP":
        case "DW":
        case "VB":
            return projects.filter(p => p.PM === filter && !p.IsHorsMarche);
        case "HMC":
            return projects.filter(p => p.IsHorsMarche);
        case "ALL_HMC":
            return projects;
        default:
            return projects;
    }
}
