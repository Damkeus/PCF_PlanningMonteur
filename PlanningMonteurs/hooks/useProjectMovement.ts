import * as React from "react";

export interface ProjectMovement {
    deltaWeeks: number;
    originalStartWeek: number;
    movementType: "all" | "demandePM";
}

interface UseProjectMovementResult {
    movements: Record<string, ProjectMovement>;
    hasMovements: boolean;
    moveProject: (projectId: string, currentStartWeek: number, deltaWeeks: number, type: "all" | "demandePM") => void;
    resetProject: (projectId: string) => void;
    resetAllMovements: () => void;
    getDeltaWeeks: (projectId: string) => number;
}

/**
 * Tracks project movements (delta from original start position).
 * Original start week is captured on first move and never overwritten.
 */
export function useProjectMovement(): UseProjectMovementResult {
    const [movements, setMovements] = React.useState<Record<string, ProjectMovement>>({});

    const moveProject = React.useCallback(
        (projectId: string, currentStartWeek: number, deltaWeeks: number, type: "all" | "demandePM") => {
            setMovements((prev) => {
                const existing = prev[projectId];
                const originalStartWeek = existing?.originalStartWeek ?? currentStartWeek;
                const movementType = existing?.movementType ?? type;
                const totalDelta = (existing?.deltaWeeks ?? 0) + deltaWeeks;
                if (totalDelta === 0) {
                    const next = { ...prev };
                    delete next[projectId];
                    return next;
                }
                return {
                    ...prev,
                    [projectId]: { deltaWeeks: totalDelta, originalStartWeek, movementType },
                };
            });
        },
        []
    );

    const resetProject = React.useCallback((projectId: string) => {
        setMovements((prev) => {
            const next = { ...prev };
            delete next[projectId];
            return next;
        });
    }, []);

    const resetAllMovements = React.useCallback(() => {
        setMovements({});
    }, []);

    const hasMovements = Object.keys(movements).length > 0;

    const getDeltaWeeks = React.useCallback(
        (projectId: string) => movements[projectId]?.deltaWeeks ?? 0,
        [movements]
    );

    return { movements, hasMovements, moveProject, resetProject, resetAllMovements, getDeltaWeeks };
}
