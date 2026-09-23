import * as React from "react";
import { IProjectBlock } from "../types";

/** Projet en attente d'affectation réelle par l'admin */
export interface UnaffectedProject {
    projectUniqID: string;
    title: string;
    pm: string | null;
    /** Plage de semaines demandée par le PM (min/max des demandes) */
    weekStart: number | null;
    weekEnd: number | null;
    /** Total monteurs demandés */
    totalDemande: number;
}

interface UseNotificationResult {
    unaffectedCount: number;
    unaffectedProjects: UnaffectedProject[];
    isDismissed: boolean;
    dismiss: () => void;
}

/**
 * Liste les projets avec statut "non-affecte" : le PM a saisi des demandes
 * (dates + monteurs souhaités) mais l'admin n'a créé aucune affectation réelle.
 * Uses useRef for session-state (no localStorage — PCF constraint).
 */
export function useNotification(
    projectBlocks: IProjectBlock[],
    currentWeek: number,
    lookaheadWeeks = 8
): UseNotificationResult {
    const dismissedRef = React.useRef(false);
    const [isDismissed, setIsDismissed] = React.useState(false);

    const unaffectedProjects = React.useMemo(() => {
        return projectBlocks
            .filter((pb) => pb.status === "non-affecte")
            .map((pb): UnaffectedProject => {
                const weeks: number[] = [];
                let totalDemande = 0;
                pb.demandePMLine?.weekData.forEach((aff, wk) => {
                    if (aff.NbMonteurs > 0) {
                        weeks.push(wk);
                        totalDemande += aff.NbMonteurs;
                    }
                });
                weeks.sort((a, b) => a - b);
                return {
                    projectUniqID: pb.project.ProjectUniqID,
                    title: pb.project.Title,
                    pm: pb.project.PM,
                    weekStart: weeks.length > 0 ? weeks[0] : pb.project.DateDebutSemaine ?? null,
                    weekEnd: weeks.length > 0 ? weeks[weeks.length - 1] : pb.project.DateFinSemaine ?? null,
                    totalDemande,
                };
            })
            .sort((a, b) => (a.weekStart ?? 99) - (b.weekStart ?? 99));
    }, [projectBlocks, currentWeek, lookaheadWeeks]);

    const dismiss = React.useCallback(() => {
        dismissedRef.current = true;
        setIsDismissed(true);
    }, []);

    return {
        unaffectedCount: unaffectedProjects.length,
        unaffectedProjects,
        isDismissed,
        dismiss,
    };
}
