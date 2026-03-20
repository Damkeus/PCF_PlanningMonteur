// ============================================================
// Types & Interfaces for Planning Monteurs PCF
// ============================================================

/** Données provenant de FicheChantier (lecture seule) */
export interface IFicheChantier {
    ProjectUniqID: string;
    Title: string;
    NumProjet: string;
    Tension_kV: number;
    Section_mm2: number;
    Ame: "Al" | "Cu";
    Longueur_m: number | null;
    PM: PMCode | null;
    Year: number;
    CDC: boolean;
    DateDebutSemaine?: number;  // Semaine ISO de début (pour DnD)
    DateFinSemaine?: number;    // Semaine ISO de fin (pour DnD)
}

/** Affectation (lecture/écriture) */
export interface IPlanningAffectation {
    ID?: number;
    ProjectUniqID: string;
    Year: number;
    WeekNumber: number;
    ResourceType: ResourceType;
    NbMonteurs: number;
    Commentaire: string | null;
    PM: string | null;
    IsHorsMarche: boolean;
    IsDemandePM?: boolean;  // true = demande du PM, false/undefined = affectation réelle
}

/** Capacité hebdomadaire (lecture/écriture) */
export interface IPlanningCapacite {
    ID?: number;
    Year: number;
    WeekNumber: number;
    MonteursNxFR: number;
    SoldeNxFR: number;
    BesoinSoustraitantSCLS: number;
    NbMonteursSCLS_Dispo: number;
    SoldeMonteurSCLS: number;
    BesoinSoustraitantHTB: number;
    NbMonteursHTB_Dispo: number;
    SoldeMonteurHTB: number;
    EffectifManquant: number;
    BesoinTotalMonteurs: number;
    // Nouvelles lignes absences
    CP: number;           // Monteurs en congés payés
    Formation: number;    // Monteurs en formation
    Absence: number;      // Monteurs absents (maladie, autre)
    Commentaire?: string | null;
}

/** Fiabilité par projet/ressource */
export interface IPlanningFiabilite {
    ID?: number;
    ProjectUniqID: string;
    ResourceType: ResourceType;
    Fiabilite: FiabiliteLevel;
    Commentaire: string | null;
}

/** Monteur Nexans (lecture seule) */
export interface IMonteur {
    ID: number;
    Nom: string;
    Prenom: string;
    Equipe: string;
    Statut: "Actif" | "Inactif";
}

// ============================================================
// Type aliases
// ============================================================

export type PMCode = "JC" | "GP" | "DW" | "VB";
export type ResourceType = "NxFR" | "HTB" | "SCLS";
export type FiabiliteLevel = "A+" | "A" | "A-" | "Refusé";
export type PMFilter = "ALL" | PMCode | "HMC" | "ALL_HMC";

/** Status du projet basé sur les affectations vs demandes PM */
export type ProjectStatus = "non-affecte" | "provisoire" | "valide" | "refuse";

// ============================================================
// Structures agrégées pour le rendering
// ============================================================

/** Ligne de ressource d'un projet, avec ses affectations par semaine */
export interface IResourceLine {
    resourceType: ResourceType;
    fiabilite?: IPlanningFiabilite;
    /** Map WeekNumber → IPlanningAffectation */
    weekData: Map<number, IPlanningAffectation>;
}

/** Ligne de demande PM par semaine */
export interface IDemandePMLine {
    weekData: Map<number, IPlanningAffectation>;
}

/** Projet avec ses lignes de ressources prêtes au rendering */
export interface IProjectBlock {
    project: IFicheChantier;
    resourceLines: IResourceLine[];
    demandePMLine?: IDemandePMLine;
    isExpanded: boolean;
    status: ProjectStatus;
}

/** Info sur une semaine pour le header */
export interface IWeekInfo {
    weekNumber: number;
    mondayDate: Date;
    month: number;        // 0-11
    monthName: string;
    year: number;
}

/** Span d'un mois pour le header multi-ligne */
export interface IMonthSpan {
    monthName: string;
    startIndex: number;
    span: number;
}

/** Props du composant racine */
export interface IPlanningAppProps {
    planningData: IPlanningAffectation[];
    capaciteData: IPlanningCapacite[];
    ficheChantierData: IFicheChantier[];
    fiabiliteData: IPlanningFiabilite[];
    monteursData: IMonteur[];
    currentYear: number;
    currentWeek: number;
    userRole: "admin" | "viewer";
    selectedPMFilter: PMFilter;
    availableYears: number[];
    availablePMs: string[];
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveCapacite: (record: IPlanningCapacite) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
    onDeleteAffectation: (id: number) => void;
    onFilterChange: (filter: PMFilter) => void;
    onYearChange: (year: number) => void;
}
