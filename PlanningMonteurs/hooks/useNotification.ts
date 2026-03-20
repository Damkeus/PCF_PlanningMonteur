import * as React from "react";
import { IProjectBlock } from "../types";

interface UseNotificationResult {
    unaffectedCount: number;
    isDismissed: boolean;
    dismiss: () => void;
}

/**
 * Counts projects with "non-affecte" status across the next N weeks.
 * Uses useRef for session-state (no localStorage — PCF constraint).
 */
export function useNotification(
    projectBlocks: IProjectBlock[],
    currentWeek: number,
    lookaheadWeeks = 8
): UseNotificationResult {
    const dismissedRef = React.useRef(false);
    const [isDismissed, setIsDismissed] = React.useState(false);

    const unaffectedCount = React.useMemo(() => {
        return projectBlocks.filter((pb) => pb.status === "non-affecte").length;
    }, [projectBlocks, currentWeek, lookaheadWeeks]);

    const dismiss = React.useCallback(() => {
        dismissedRef.current = true;
        setIsDismissed(true);
    }, []);

    return { unaffectedCount, isDismissed, dismiss };
}
