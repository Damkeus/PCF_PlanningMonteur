import * as React from "react";
import { IResourceLine, IWeekInfo, IPlanningAffectation, IFicheChantier, IPlanningFiabilite, FiabiliteLevel } from "../../types";
import { getResourceColor } from "../../utils/colorUtils";
import FiabiliteBadge from "../Shared/FiabiliteBadge";
import WeekCell from "./WeekCell";

interface ResourceRowProps {
    resourceLine: IResourceLine;
    weeks: IWeekInfo[];
    currentWeek: number;
    isAdmin: boolean;
    projectUniqID: string;
    year: number;
    pm: string | null;
    isHorsMarche: boolean;
    project: IFicheChantier;
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
    onDeleteAffectation: (id: number) => void;
    weekCellWidth: number;
    movementDirection?: "left" | "right" | null;
    dragStyle?: React.CSSProperties;
}

const ResourceRow: React.FC<ResourceRowProps> = ({
    resourceLine,
    weeks,
    currentWeek,
    isAdmin,
    projectUniqID,
    year,
    pm,
    isHorsMarche,
    project,
    onSaveAffectation,
    onSaveFiabilite,
    onDeleteAffectation,
    weekCellWidth,
    movementDirection,
    dragStyle,
}) => {
    const { resourceType, fiabilite, weekData } = resourceLine;

    // Cycle: Refusé -> A- -> A -> A+ -> Refusé
    // If no record, start at A-
    const handleFiabiliteClick = () => {
        // PM only (not admin) can evaluate Fiabilite
        if (isAdmin) return;

        const currentLevel: FiabiliteLevel | undefined = fiabilite?.Fiabilite;
        let nextLevel: FiabiliteLevel = "A-";

        if (currentLevel === "Refusé") nextLevel = "A-";
        else if (currentLevel === "A-") nextLevel = "A";
        else if (currentLevel === "A") nextLevel = "A+";
        else if (currentLevel === "A+") nextLevel = "Refusé";

        const record: IPlanningFiabilite = {
            ...(fiabilite || {}),
            ProjectUniqID: projectUniqID,
            ResourceType: resourceType,
            Fiabilite: nextLevel,
            Commentaire: fiabilite?.Commentaire || null,
        };
        if (fiabilite?.ID) record.ID = fiabilite.ID;

        onSaveFiabilite(record);
    };

    return (
        <div className="pm-resource-row">
            <div className="pm-resource-row-left">
                <div
                    className="pm-resource-type-indicator"
                    style={{ backgroundColor: getResourceColor(resourceType) }}
                />
                <span className="pm-resource-type-label">{resourceType}</span>
                {fiabilite ? (
                    <FiabiliteBadge
                        level={fiabilite.Fiabilite}
                        onClick={!isAdmin ? handleFiabiliteClick : undefined}
                    />
                ) : !isAdmin ? (
                    // Allow PM to create if missing
                    <div
                        className="pm-fiabilite-add"
                        onClick={handleFiabiliteClick}
                        title="Définir la fiabilité"
                    >
                        + Fiab.
                    </div>
                ) : null}
            </div>
            <div className="pm-resource-row-right" style={dragStyle}>
                {weeks.map((w) => (
                    <WeekCell
                        key={w.weekNumber}
                        affectation={weekData.get(w.weekNumber)}
                        resourceType={resourceType}
                        weekNumber={w.weekNumber}
                        year={year}
                        projectUniqID={projectUniqID}
                        isCurrentWeek={w.weekNumber === currentWeek}
                        isAdmin={isAdmin}
                        onSave={onSaveAffectation}
                        onDelete={onDeleteAffectation}
                        pm={pm}
                        isHorsMarche={isHorsMarche}
                        project={project}
                        weekCellWidth={weekCellWidth}
                        movementDirection={movementDirection}
                    />
                ))}
            </div>
        </div>
    );
};

export default ResourceRow;

