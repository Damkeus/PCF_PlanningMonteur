import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import PlanningApp from "./components/PlanningApp";
import {
    IPlanningAffectation,
    IPlanningCapacite,
    IPlanningFiabilite,
    PMFilter,
} from "./types";
import {
    parsePlanningData,
    parseCapaciteData,
    parseFicheChantierData,
    parseFiabiliteData,
    parseMonteursData,
    parseAvailableYears,
    parseAvailablePMs,
} from "./utils/dataParser";

export class PlanningMonteurs
    implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _notifyOutputChanged: () => void;

    // Output values
    private _onSaveAffectation = "";
    private _onSaveCapacite = "";
    private _onSaveFiabilite = "";
    private _onDeleteAffectation = "";
    private _eventName = "";

    constructor() {
        // Empty
    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        _state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;

        // Make the container fill available space
        this._container.style.width = "100%";
        this._container.style.height = "100%";
        this._container.style.overflow = "hidden";

        // Track available size
        context.mode.trackContainerResize(true);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // Parse input properties
        const planningData = parsePlanningData(
            context.parameters.planningData?.raw ?? undefined
        );
        const capaciteData = parseCapaciteData(
            context.parameters.capaciteData?.raw ?? undefined
        );
        const ficheChantierData = parseFicheChantierData(
            context.parameters.ficheChantierData?.raw ?? undefined
        );
        const fiabiliteData = parseFiabiliteData(
            context.parameters.fiabiliteData?.raw ?? undefined
        );
        const monteursData = parseMonteursData(
            context.parameters.monteursData?.raw ?? undefined
        );

        const currentYear =
            context.parameters.currentYear?.raw ?? new Date().getFullYear();
        const currentWeek =
            context.parameters.currentWeek?.raw ?? this._getCurrentWeek();
        const userRole =
            (context.parameters.userRole?.raw as "admin" | "viewer") ?? "viewer";
        const selectedPMFilter =
            (context.parameters.selectedPMFilter?.raw as PMFilter) ?? "ALL";
        const availableYears = parseAvailableYears(
            context.parameters.availableYears?.raw ?? undefined
        );
        const availablePMs = parseAvailablePMs(
            context.parameters.availablePMs?.raw ?? undefined
        );

        // Event handlers
        const onSaveAffectation = (record: IPlanningAffectation) => {
            this._onSaveAffectation = JSON.stringify(record);
            this._eventName = "onSaveAffectation";
            this._notifyOutputChanged();
        };

        const onSaveCapacite = (record: IPlanningCapacite) => {
            this._onSaveCapacite = JSON.stringify(record);
            this._eventName = "onSaveCapacite";
            this._notifyOutputChanged();
        };

        const onSaveFiabilite = (record: IPlanningFiabilite) => {
            this._onSaveFiabilite = JSON.stringify(record);
            this._eventName = "onSaveFiabilite";
            this._notifyOutputChanged();
        };

        const onDeleteAffectation = (id: number) => {
            this._onDeleteAffectation = JSON.stringify({ ID: id });
            this._eventName = "onDeleteAffectation";
            this._notifyOutputChanged();
        };

        const onFilterChange = (filter: PMFilter) => {
            // Emit as event so Power Apps can react
            this._eventName = "onFilterChange";
            this._onSaveAffectation = JSON.stringify({ selectedPMFilter: filter });
            this._notifyOutputChanged();
        };

        const onYearChange = (year: number) => {
            this._eventName = "onYearChange";
            this._onSaveAffectation = JSON.stringify({ selectedYear: year });
            this._notifyOutputChanged();
        };

        // Render React
        ReactDOM.render(
            React.createElement(PlanningApp, {
                planningData,
                capaciteData,
                ficheChantierData,
                fiabiliteData,
                monteursData,
                currentYear,
                currentWeek,
                userRole,
                selectedPMFilter,
                availableYears,
                availablePMs,
                onSaveAffectation,
                onSaveCapacite,
                onSaveFiabilite,
                onDeleteAffectation,
                onFilterChange,
                onYearChange,
            }),
            this._container
        );
    }

    public getOutputs(): IOutputs {
        return {
            onSaveAffectation: this._onSaveAffectation,
            onSaveCapacite: this._onSaveCapacite,
            onSaveFiabilite: this._onSaveFiabilite,
            onDeleteAffectation: this._onDeleteAffectation,
            eventName: this._eventName,
        };
    }

    public destroy(): void {
        ReactDOM.unmountComponentAtNode(this._container);
    }

    private _getCurrentWeek(): number {
        const now = new Date();
        const d = new Date(
            Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(
            ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
        );
    }
}
