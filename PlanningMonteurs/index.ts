import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import PlanningApp from "./components/PlanningApp";
import {
    IPlanningAffectation,
    IPlanningCapacite,
    IPlanningFiabilite,
    IFicheChantier,
    ITabletteChantier,
    IRelinkPayload,
    ICreateProjectPayload,
    PMFilter,
} from "./types";
import {
    parsePlanningData,
    parseCapaciteData,
    parseFicheChantierData,
    parseFiabiliteData,
    parseMonteursData,
    parseMouvementData,
    parseTabletteChantierData,
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
    private _onSaveFicheChantier = "";
    private _onDeleteAffectation = "";
    private _onSaveTabletteChantier = "";
    private _onRelinkProject = "";
    private _onCreateProject = "";
    private _eventName = "";

    // Loading state (spinner interne)
    // _hasReceivedFiche : true dès que ficheChantierData a été reçu au moins une fois
    // _pendingYear      : année choisie dans le PCF en attente de retour Power Apps
    private _hasReceivedFiche = false;
    private _pendingYear: number | null = null;
    private _pendingYearTimer: number | null = null;

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
        this._render(context);
    }

    private _render(context: ComponentFramework.Context<IInputs>): void {
        // Parse input properties
        const planningData = parsePlanningData(
            context.parameters.planningData?.raw ?? undefined
        );
        const capaciteData = parseCapaciteData(
            context.parameters.capaciteData?.raw ?? undefined
        );
        const ficheChantierRaw = context.parameters.ficheChantierData?.raw;
        // Dès qu'on reçoit une valeur (même "[]"), le premier chargement est terminé
        if (ficheChantierRaw != null) {
            this._hasReceivedFiche = true;
        }
        const ficheChantierData = parseFicheChantierData(
            ficheChantierRaw ?? undefined
        );
        const fiabiliteData = parseFiabiliteData(
            context.parameters.fiabiliteData?.raw ?? undefined
        );
        const monteursData = parseMonteursData(
            context.parameters.monteursData?.raw ?? undefined
        );
        const mouvementData = parseMouvementData(
            context.parameters.mouvementData?.raw ?? undefined
        );
        const tabletteChantierData = parseTabletteChantierData(
            context.parameters.tabletteChantierData?.raw ?? undefined
        );

        const currentYear =
            context.parameters.currentYear?.raw ?? new Date().getFullYear();

        // Réconciliation du chargement année : Power Apps a renvoyé la nouvelle
        // année (currentYear === année demandée) → les données filtrées sont arrivées.
        if (this._pendingYear != null && currentYear === this._pendingYear) {
            this._pendingYear = null;
            if (this._pendingYearTimer != null) {
                window.clearTimeout(this._pendingYearTimer);
                this._pendingYearTimer = null;
            }
        }

        // Spinner : premier fetch non terminé OU changement d'année en cours
        const isLoading =
            !this._hasReceivedFiche || this._pendingYear != null;

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

        const onSaveFicheChantier = (record: IFicheChantier) => {
            this._onSaveFicheChantier = JSON.stringify(record);
            this._eventName = "onSaveFicheChantier";
            this._notifyOutputChanged();
        };

        const onSaveTabletteChantier = (record: ITabletteChantier) => {
            this._onSaveTabletteChantier = JSON.stringify(record);
            this._eventName = "onSaveTabletteChantier";
            this._notifyOutputChanged();
        };

        const onRelinkProject = (payload: IRelinkPayload) => {
            this._onRelinkProject = JSON.stringify(payload);
            this._eventName = "onRelinkProject";
            this._notifyOutputChanged();
        };

        const onCreateProject = (payload: ICreateProjectPayload) => {
            this._onCreateProject = JSON.stringify(payload);
            this._eventName = "onCreateProject";
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
            // Démarre l'overlay de chargement jusqu'au retour des données filtrées
            this._pendingYear = year;
            if (this._pendingYearTimer != null) {
                window.clearTimeout(this._pendingYearTimer);
            }
            // Garde-fou : ne jamais laisser le spinner bloqué (ex. OnChange Power Apps absent)
            this._pendingYearTimer = window.setTimeout(() => {
                this._pendingYear = null;
                this._pendingYearTimer = null;
                this._render(context);
            }, 8000);

            this._eventName = "onYearChange";
            this._onSaveAffectation = JSON.stringify({ selectedYear: year });
            this._notifyOutputChanged();
            // Re-render immédiat pour afficher le spinner sans attendre Power Apps
            this._render(context);
        };

        // Render React
        ReactDOM.render(
            React.createElement(PlanningApp, {
                planningData,
                capaciteData,
                ficheChantierData,
                fiabiliteData,
                monteursData,
                mouvementData,
                tabletteChantierData,
                currentYear,
                currentWeek,
                userRole,
                selectedPMFilter,
                availableYears,
                availablePMs,
                isLoading,
                onSaveAffectation,
                onSaveCapacite,
                onSaveFiabilite,
                onSaveFicheChantier,
                onSaveTabletteChantier,
                onRelinkProject,
                onCreateProject,
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
            onSaveFicheChantier: this._onSaveFicheChantier,
            onDeleteAffectation: this._onDeleteAffectation,
            onSaveTabletteChantier: this._onSaveTabletteChantier,
            onRelinkProject: this._onRelinkProject,
            onCreateProject: this._onCreateProject,
            eventName: this._eventName,
        };
    }

    public destroy(): void {
        if (this._pendingYearTimer != null) {
            window.clearTimeout(this._pendingYearTimer);
            this._pendingYearTimer = null;
        }
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
