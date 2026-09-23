import * as React from "react";
import {
    IFicheChantier,
    IPlanningAffectation,
    ITabletteChantier,
} from "../types";

/** Projet du planning dont le ProjectUniqID n'existe pas dans la fiche chantier */
export interface IOrphanPlanningProject {
    projectUniqID: string;
    /** Libellé affichable (PM + plage de semaines) */
    pm: string | null;
    weekStart: number | null;
    weekEnd: number | null;
    totalMonteurs: number;
}

export type DataQualityIssueType =
    | "dates-manquantes"      // PM : dates de réalisation absentes de la fiche chantier
    | "demande-manquante"     // PM : aucune demande/affectation saisie dans le planning
    | "pm-non-attribue"       // Admin : projet sans PM
    | "monteurs-non-attribues"; // Admin : projet planifié sans MonteurMail dans TabletteChantier

export interface IDataQualityIssue {
    type: DataQualityIssueType;
    projectUniqID: string;
    title: string;
    pm: string | null;
    detail: string;
}

interface UseDataQualityResult {
    /** Projets du planning sans fiche chantier (bannière "chantier non créé") */
    orphanProjects: IOrphanPlanningProject[];
    /** Fiches chantier sans aucune ligne planning (cibles de rattachement) */
    fichesSansPlanning: IFicheChantier[];
    /** Alertes PM (données manquantes sur ses projets) */
    pmIssues: IDataQualityIssue[];
    /** Alertes admin (attributions manquantes) */
    adminIssues: IDataQualityIssue[];
}

/**
 * Contrôle de cohérence "human in the loop" pendant le backfill :
 * détecte les projets planning orphelins, les fiches sans planning,
 * et les informations importantes non complétées (PM et admin).
 */
export function useDataQuality(
    ficheChantierData: IFicheChantier[],
    filteredProjects: IFicheChantier[],
    planningData: IPlanningAffectation[],
    tabletteChantierData: ITabletteChantier[]
): UseDataQualityResult {
    return React.useMemo(() => {
        const ficheIDs = new Set(ficheChantierData.map((f) => f.ProjectUniqID));
        const planningByProject = new Map<string, IPlanningAffectation[]>();
        planningData.forEach((a) => {
            const list = planningByProject.get(a.ProjectUniqID) ?? [];
            list.push(a);
            planningByProject.set(a.ProjectUniqID, list);
        });

        // --- Projets planning orphelins (pas de fiche chantier) ---
        const orphanProjects: IOrphanPlanningProject[] = [];
        planningByProject.forEach((affectations, projectUniqID) => {
            if (ficheIDs.has(projectUniqID)) return;
            const weeks = affectations.map((a) => a.WeekNumber);
            orphanProjects.push({
                projectUniqID,
                pm: affectations.find((a) => a.PM)?.PM ?? null,
                weekStart: weeks.length ? Math.min(...weeks) : null,
                weekEnd: weeks.length ? Math.max(...weeks) : null,
                totalMonteurs: affectations.reduce((s, a) => s + (a.NbMonteurs || 0), 0),
            });
        });

        // --- Fiches chantier sans planning (cibles de rattachement) ---
        const fichesSansPlanning = ficheChantierData.filter(
            (f) => !planningByProject.has(f.ProjectUniqID)
        );

        // --- Index TabletteChantier ---
        const tabletteByProject = new Map<string, ITabletteChantier>();
        tabletteChantierData.forEach((t) => {
            if (t.ProjectUniqID) tabletteByProject.set(t.ProjectUniqID, t);
        });

        // --- Alertes PM : données importantes non complétées sur ses projets ---
        const pmIssues: IDataQualityIssue[] = [];
        filteredProjects.forEach((p) => {
            const missingDates = p.DateDebutSemaine == null || p.DateFinSemaine == null;
            if (missingDates) {
                pmIssues.push({
                    type: "dates-manquantes",
                    projectUniqID: p.ProjectUniqID,
                    title: p.Title,
                    pm: p.PM,
                    detail: "Dates de réalisation non renseignées dans la fiche chantier",
                });
            }
            const hasInput = (planningByProject.get(p.ProjectUniqID) ?? []).some(
                (a) => a.NbMonteurs > 0
            );
            if (!hasInput) {
                pmIssues.push({
                    type: "demande-manquante",
                    projectUniqID: p.ProjectUniqID,
                    title: p.Title,
                    pm: p.PM,
                    detail: "Aucune demande ni affectation saisie dans le planning",
                });
            }
        });

        // --- Alertes admin : attributions manquantes ---
        const adminIssues: IDataQualityIssue[] = [];
        ficheChantierData.forEach((p) => {
            if (!p.PM && !p.IsHorsMarche) {
                adminIssues.push({
                    type: "pm-non-attribue",
                    projectUniqID: p.ProjectUniqID,
                    title: p.Title,
                    pm: null,
                    detail: "Aucun PM attribué à ce projet",
                });
            }
            const hasRealAffectations = (planningByProject.get(p.ProjectUniqID) ?? []).some(
                (a) => !a.IsDemandePM && a.NbMonteurs > 0
            );
            if (hasRealAffectations) {
                const tablette = tabletteByProject.get(p.ProjectUniqID);
                const hasMonteurs = !!tablette && tablette.MonteurMail.trim().length > 0;
                if (!hasMonteurs) {
                    adminIssues.push({
                        type: "monteurs-non-attribues",
                        projectUniqID: p.ProjectUniqID,
                        title: p.Title,
                        pm: p.PM,
                        detail: tablette
                            ? "Aucun monteur attribué (MonteurMail vide dans TabletteChantier)"
                            : "Chantier absent de TabletteChantier — non visible sur tablette",
                    });
                }
            }
        });

        return { orphanProjects, fichesSansPlanning, pmIssues, adminIssues };
    }, [ficheChantierData, filteredProjects, planningData, tabletteChantierData]);
}
