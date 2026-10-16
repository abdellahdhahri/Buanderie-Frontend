import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    Eye,
    Barcode,
    RefreshCw,
    CheckCircle,
    XCircle,
    Printer,
    Briefcase,
    UserCheck,
    X,
    Loader2
} from "lucide-react";

import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { motion } from "framer-motion";

import BadgeModal from "../../components/Modal/BadgeModal";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { DetailModal } from "../../components/ui/modal-kit";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─────────────────────────────────────────────────────────────────────────────
// COULEURS SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const SERVICE_COLORS = {
    ADMINISTRATION: {
        bg: "#f5f3ff",
        color: "#7c3aed"
    },
    PRODUCTION: {
        bg: "#fffbeb",
        color: "#d97706"
    },
    COMMERCIAL: {
        bg: "#fdf2f8",
        color: "#db2777"
    },
    TECHNIQUE: {
        bg: "#eff6ff",
        color: "#2563eb"
    },
    FINANCE: {
        bg: "#f0fdf4",
        color: "#16a34a"
    },
    RH: {
        bg: "#f5f3ff",
        color: "#7c3aed"
    },
    INFORMATIQUE: {
        bg: "#ecfdf5",
        color: "#059669"
    },
    LOGISTIQUE: {
        bg: "#fef2f2",
        color: "#dc2626"
    },
    DEFAULT: {
        bg: "#f1f5f9",
        color: "#64748b"
    }
};

export default function AgentList() {

    // ─────────────────────────────────────────────────────────────────────────
    // STATES
    // ─────────────────────────────────────────────────────────────────────────

    const [agents, setAgents] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    const [selectedId, setSelectedId] = useState(null);

    // Modal détails
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [selectedAgentDetail, setSelectedAgentDetail] = useState(null);

    // Modal Badge
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    const [badgeEmployee, setBadgeEmployee] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);

    const [totalPages, setTotalPages] = useState(0);

    const [totalElements, setTotalElements] = useState(0);

    const PAGE_SIZE = 20;

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ AUTOCOMPLETE SEARCH (NOUVEAU)
    // ─────────────────────────────────────────────────────────────────────────

    const [allAgents, setAllAgents] = useState([]);

    const [suggestions, setSuggestions] = useState([]);

    const [showSuggestions, setShowSuggestions] = useState(false);

    const [isSearching, setIsSearching] = useState(false);

    const searchContainerRef = useRef(null);

    const searchTimeoutRef = useRef(null);

    // ─────────────────────────────────────────────────────────────────────────
    // CHARGER LES AGENTS
    // ─────────────────────────────────────────────────────────────────────────

    const fetchAgents = async (
        page = 0,
        size = PAGE_SIZE
    ) => {

        setIsLoading(true);

        try {

            const response = await fetch(
                `${API_URL}/api/sqlserver/agents?page=${page}&size=${size}`
            );

            if (!response.ok) {

                console.error(
                    "Erreur chargement agents :",
                    response.status
                );

                setAgents([]);

                return;
            }

            const data = await response.json();

            console.log("Agents récupérés :", data);

            if (Array.isArray(data.content)) {

                setAgents(data.content);

            } else {

                setAgents([]);

            }

            setTotalPages(
                data.totalPages ?? 0
            );

            setTotalElements(
                data.totalElements ?? 0
            );

            setCurrentPage(
                data.number ?? page
            );

        } catch (error) {

            console.error(
                "Erreur réseau :",
                error
            );

            setAgents([]);

        } finally {

            setIsLoading(false);

        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ CHARGER TOUS LES AGENTS POUR AUTOCOMPLETE (NOUVEAU)
    // ─────────────────────────────────────────────────────────────────────────

    const fetchAllAgentsForAutocomplete = useCallback(async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/sqlserver/agents?page=0&size=1000`
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (Array.isArray(data.content)) {
                setAllAgents(data.content);
            } else if (Array.isArray(data)) {
                setAllAgents(data);
            }

        } catch (error) {

            console.error(
                "Erreur chargement autocomplete :",
                error
            );

        }

    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // PREMIER CHARGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {

        fetchAgents(0);

        fetchAllAgentsForAutocomplete();

    }, [fetchAllAgentsForAutocomplete]);

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ FERMER SUGGESTIONS AU CLIC EXTERIEUR (NOUVEAU)
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }

        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

        };

    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ RECHERCHE AUTOCOMPLETE (NOUVEAU)
    // ─────────────────────────────────────────────────────────────────────────

    const handleSearchChange = (value) => {

        setSearchTerm(value);

        clearTimeout(searchTimeoutRef.current);

        if (!value || value.trim().length < 2) {

            setSuggestions([]);

            setShowSuggestions(false);

            return;

        }

        setIsSearching(true);

        searchTimeoutRef.current = setTimeout(() => {

            const term = value.toLowerCase().trim();

            const filtered = allAgents
                .filter((agent) => {

                    return (

                        String(agent.matricule || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.nom || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.prenom || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.nomPrenom || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.fonctionCode || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.fonction || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.serviceCode || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.service || "")
                            .toLowerCase()
                            .includes(term)

                        ||

                        String(agent.codeBarre || "")
                            .toLowerCase()
                            .includes(term)

                    );

                })
                .slice(0, 15);

            setSuggestions(filtered);

            setShowSuggestions(true);

            setIsSearching(false);

        }, 250);

    };

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ SELECTIONNER UNE SUGGESTION (NOUVEAU)
    // ─────────────────────────────────────────────────────────────────────────

    const handleSelectSuggestion = (agent) => {

        setSearchTerm(
            agent.nomPrenom ||
            `${agent.prenom || ""} ${agent.nom || ""}`.trim() ||
            agent.matricule ||
            ""
        );

        setSuggestions([]);

        setShowSuggestions(false);

        setSelectedId(agent.id);

    };

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ VIDER LA RECHERCHE (NOUVEAU)
    // ─────────────────────────────────────────────────────────────────────────

    const handleClearSearch = () => {

        setSearchTerm("");

        setSuggestions([]);

        setShowSuggestions(false);

    };

    // ─────────────────────────────────────────────────────────────────────────
    // OUVRIR LE BADGE MODAL
    // ─────────────────────────────────────────────────────────────────────────

    const openBadgeModal = (agent) => {

        if (!agent) {
            return;
        }

        console.log(
            "Ouverture BadgeModal pour :",
            agent
        );

        setBadgeEmployee({

            nom:
                agent.nom || "",

            prenom:
                agent.prenom || "",

            fonction:
                agent.fonctionCode ||
                agent.fonction ||
                "",

            matricule:
                agent.matricule || "",

            service:
                agent.serviceCode ||
                agent.service ||
                "",

            codeBarre:
                agent.codeBarre || "",

            photo:
                agent.photo || null

        });

        setShowBadgeModal(true);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FERMER BADGE MODAL
    // ─────────────────────────────────────────────────────────────────────────

    const closeBadgeModal = () => {

        setShowBadgeModal(false);

    };

    // ─────────────────────────────────────────────────────────────────────────
    // RECHERCHE
    // ─────────────────────────────────────────────────────────────────────────

    const filteredAgents = agents.filter((agent) => {

        if (!searchTerm) {
            return true;
        }

        const term =
            searchTerm
                .toLowerCase()
                .trim();

        return (

            String(agent.matricule || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.nom || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.prenom || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.nomPrenom || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.fonctionCode || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.fonction || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.serviceCode || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.service || "")
                .toLowerCase()
                .includes(term)

            ||

            String(agent.codeBarre || "")
                .toLowerCase()
                .includes(term)

        );
    });

    // Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun)
    const { sortedItems: sortedAgents, requestSort, directionFor } = useSortableData(filteredAgents, {
      nomPrenom: (a) => a.nomPrenom || `${a.prenom || ""} ${a.nom || ""}`.trim(),
      service: (a) => a.serviceCode || a.service,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // COULEUR SERVICE
    // ─────────────────────────────────────────────────────────────────────────

    const getServiceBadge = (serviceCode) => {

        const colors =
            SERVICE_COLORS[serviceCode] ||
            SERVICE_COLORS.DEFAULT;

        return (

            <Badge
                style={{
                    background: colors.bg,
                    color: colors.color,
                    border:
                        `1px solid ${colors.color}30`
                }}
            >
                {serviceCode || "-"}
            </Badge>

        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STATUT
    // ─────────────────────────────────────────────────────────────────────────

    const getStatutBadge = (actif) => {

        const isActive =
            actif === true ||
            actif === 1 ||
            actif === "1" ||
            actif === "true";

        return isActive ? (

            <span
                className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-medium
                    bg-emerald-50
                    text-emerald-700
                    border
                    border-emerald-200
                "
            >

                <CheckCircle
                    className="
                        w-3.5
                        h-3.5
                        text-emerald-500
                    "
                />

                Actif

            </span>

        ) : (

            <span
                className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-medium
                    bg-red-50
                    text-red-700
                    border
                    border-red-200
                "
            >

                <XCircle
                    className="
                        w-3.5
                        h-3.5
                        text-red-500
                    "
                />

                Inactif

            </span>

        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SELECTION AGENT
    // ─────────────────────────────────────────────────────────────────────────

    const handleRowClick = (id) => {

        setSelectedId((previousId) =>
            previousId === id
                ? null
                : id
        );

    };

    // ─────────────────────────────────────────────────────────────────────────
    // RECUPERER AGENT SELECTIONNE
    // ─────────────────────────────────────────────────────────────────────────

    const getSelectedAgent = () => {

        if (selectedId === null) {
            return null;
        }

        return agents.find(
            (agent) =>
                agent.id === selectedId
        ) || null;

    };

    // ─────────────────────────────────────────────────────────────────────────
    // DETAILS
    // ─────────────────────────────────────────────────────────────────────────

    const handleDetail = (agent) => {

        if (!agent) {
            return;
        }

        setSelectedAgentDetail(agent);

        setShowDetailModal(true);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // BOUTON BADGE GLOBAL
    // ─────────────────────────────────────────────────────────────────────────

    const handleSelectedAgentBadge = () => {

        const agent =
            getSelectedAgent();

        if (!agent) {
            return;
        }

        openBadgeModal(agent);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE PRECEDENTE
    // ─────────────────────────────────────────────────────────────────────────

    const handlePreviousPage = () => {

        if (
            isLoading ||
            currentPage <= 0
        ) {
            return;
        }

        setSelectedId(null);

        fetchAgents(
            currentPage - 1
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE SUIVANTE
    // ─────────────────────────────────────────────────────────────────────────

    const handleNextPage = () => {

        if (
            isLoading ||
            currentPage >= totalPages - 1
        ) {
            return;
        }

        setSelectedId(null);

        fetchAgents(
            currentPage + 1
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (

        <>

            <div
                className="
                    relative
                    flex
                    h-full
                    gap-4
                "
            >

                <motion.div
                    className="
                        transition-all
                        duration-500
                        ease-in-out
                        w-full
                    "
                >

                    <div className="space-y-4">

                        {/* ================================================= */}
                        {/* HEADER */}
                        {/* ================================================= */}

                        <div
                            style={{
                                marginBottom: "32px"
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    marginBottom: "8px"
                                }}
                            >

                                <PageHeaderIcon size={52} section="params" icon={<UserCheck />} />

                                <div>

                                    <h1
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: 800,
                                            color: "#0f172a",
                                            margin: 0
                                        }}
                                    >
                                        Gestion des Agents
                                    </h1>

                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#64748b",
                                            margin:
                                                "2px 0 0 0"
                                        }}
                                    >
                                        Consultez et gérez les agents de l'entreprise
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* ================================================= */}
                        {/* BARRE D'ACTIONS */}
                        {/* ================================================= */}

                        <div
                            className="
                                flex
                                flex-wrap
                                items-center
                                gap-3
                                bg-white/65
                                backdrop-blur-md
                                p-4
                                rounded-[20px]
                                border
                                border-slate-200/50
                                shadow-[0_4px_20px_rgba(0,0,0,0.02)]
                                mb-6
                            "
                        >

                            {/* ACTUALISER */}

                            <button
                                onClick={() =>
                                    fetchAgents(
                                        currentPage
                                    )
                                }
                                disabled={isLoading}
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    px-5
                                    py-2.5
                                    bg-white
                                    border
                                    border-slate-300
                                    rounded-[14px]
                                    text-sm
                                    font-bold
                                    text-slate-600
                                    hover:bg-slate-50
                                    transition-all
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                "
                            >

                                <RefreshCw
                                    className={`
                                        w-4
                                        h-4
                                        ${
                                            isLoading
                                                ? "animate-spin"
                                                : ""
                                        }
                                    `}
                                />

                                Actualiser

                            </button>

                            <div
                                style={{
                                    width: "1px",
                                    height: "30px",
                                    background: "#e2e8f0",
                                    margin: "0 8px"
                                }}
                            />

                            {/* DETAILS */}

                            <button
                                disabled={!selectedId}
                                onClick={() => {

                                    const agent =
                                        getSelectedAgent();

                                    if (agent) {
                                        handleDetail(agent);
                                    }

                                }}
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    px-5
                                    py-2.5
                                    bg-white
                                    border
                                    border-[#006f94]/30
                                    rounded-[14px]
                                    text-sm
                                    font-bold
                                    text-[#006f94]
                                    hover:bg-[#006f94]/5
                                    transition-all
                                    shadow-[0_2px_4px_rgba(0,0,0,0.02)]
                                    hover:scale-[1.02]
                                    disabled:opacity-40
                                    disabled:cursor-not-allowed
                                    disabled:scale-100
                                "
                            >

                                <Eye
                                    className="
                                        w-4
                                        h-4
                                        stroke-[2.5]
                                    "
                                />

                                Détails

                            </button>

                            {/* BADGE GLOBAL */}

                            <button
                                disabled={!selectedId}
                                onClick={
                                    handleSelectedAgentBadge
                                }
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    px-5
                                    py-2.5
                                    bg-white
                                    border
                                    border-[#8b5cf6]/30
                                    rounded-[14px]
                                    text-sm
                                    font-bold
                                    text-[#8b5cf6]
                                    hover:bg-[#8b5cf6]/5
                                    transition-all
                                    shadow-[0_2px_4px_rgba(0,0,0,0.02)]
                                    hover:scale-[1.02]
                                    disabled:opacity-40
                                    disabled:cursor-not-allowed
                                    disabled:scale-100
                                "
                            >

                                <Barcode
                                    className="
                                        w-4
                                        h-4
                                        stroke-[2.5]
                                    "
                                />

                                Badge

                            </button>

                        </div>

                        {/* ================================================= */}
                        {/* RECHERCHE AVEC AUTOCOMPLETE */}
                        {/* ================================================= */}

                        <Card className="mb-4">

                            <CardContent className="p-4">

                                <div
                                    ref={searchContainerRef}
                                    className="relative"
                                >

                                    <Search
                                        className="
                                            absolute
                                            left-3
                                            top-1/2
                                            -translate-y-1/2
                                            w-5
                                            h-5
                                            text-muted-foreground
                                            z-10
                                        "
                                    />

                                    <input
                                        type="text"
                                        placeholder="Rechercher par matricule, nom, prénom, fonction ou service..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            handleSearchChange(
                                                e.target.value
                                            )
                                        }
                                        onFocus={() => {

                                            if (
                                                searchTerm &&
                                                searchTerm.trim().length >= 2
                                            ) {
                                                setShowSuggestions(true);
                                            }

                                        }}
                                        className="
                                            w-full
                                            h-10
                                            pl-10
                                            pr-10
                                            rounded-lg
                                            border
                                            border-input
                                            bg-background
                                            focus:outline-none
                                            focus:ring-2
                                            focus:ring-ring
                                        "
                                    />

                                    {/* LOADER / CLEAR */}

                                    {isSearching ? (

                                        <Loader2
                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                w-4
                                                h-4
                                                text-purple-500
                                                animate-spin
                                            "
                                        />

                                    ) : searchTerm ? (

                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                p-1
                                                hover:bg-slate-100
                                                rounded-full
                                                transition-colors
                                            "
                                            title="Effacer"
                                        >

                                            <X
                                                className="
                                                    w-4
                                                    h-4
                                                    text-slate-400
                                                "
                                            />

                                        </button>

                                    ) : null}

                                    {/* SUGGESTIONS */}

                                    {showSuggestions &&
                                        suggestions.length > 0 && (

                                        <div
                                            className="
                                                absolute
                                                top-full
                                                left-0
                                                right-0
                                                mt-2
                                                max-h-72
                                                overflow-y-auto
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                                shadow-lg
                                                z-50
                                            "
                                        >

                                            {suggestions.map((agent) => (

                                                <button
                                                    key={agent.id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelectSuggestion(
                                                            agent
                                                        )
                                                    }
                                                    className="
                                                        w-full
                                                        text-left
                                                        px-4
                                                        py-2.5
                                                        hover:bg-purple-50
                                                        transition-colors
                                                        border-b
                                                        border-slate-100
                                                        last:border-0
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            flex
                                                            items-center
                                                            justify-between
                                                            gap-3
                                                        "
                                                    >

                                                        <div className="min-w-0 flex-1">

                                                            <div
                                                                className="
                                                                    font-medium
                                                                    text-slate-800
                                                                    truncate
                                                                "
                                                            >

                                                                {agent.nomPrenom ||
                                                                    `${agent.prenom || ""} ${agent.nom || ""}`.trim() ||
                                                                    "-"}

                                                            </div>

                                                            <div
                                                                className="
                                                                    text-xs
                                                                    text-slate-500
                                                                    truncate
                                                                "
                                                            >

                                                                {agent.fonctionCode ||
                                                                    agent.fonction ||
                                                                    "-"}

                                                                {" • "}

                                                                {agent.serviceCode ||
                                                                    agent.service ||
                                                                    "-"}

                                                            </div>

                                                        </div>

                                                        <span
                                                            className="
                                                                text-xs
                                                                font-mono
                                                                text-slate-400
                                                                whitespace-nowrap
                                                            "
                                                        >

                                                            {agent.matricule || "-"}

                                                        </span>

                                                    </div>

                                                </button>

                                            ))}

                                        </div>

                                    )}

                                    {/* AUCUN RESULTAT */}

                                    {showSuggestions &&
                                        !isSearching &&
                                        searchTerm.trim().length >= 2 &&
                                        suggestions.length === 0 && (

                                        <div
                                            className="
                                                absolute
                                                top-full
                                                left-0
                                                right-0
                                                mt-2
                                                text-center
                                                py-4
                                                text-sm
                                                text-slate-400
                                                bg-white
                                                rounded-xl
                                                border
                                                border-slate-200
                                                shadow-lg
                                                z-50
                                            "
                                        >

                                            Aucun agent trouvé

                                        </div>

                                    )}

                                </div>

                            </CardContent>

                        </Card>

                        {/* ================================================= */}
                        {/* TABLE */}
                        {/* ================================================= */}

                        <Card>

                            <CardContent className="p-0">

                                <div className="premium-table-wrap">

                                    <table className="premium-table">

                                        <thead>

                                            <tr>

                                                <SortableHeader direction={directionFor("matricule")} onSort={() => requestSort("matricule")} align="center">
Matricule
</SortableHeader>

                                                <SortableHeader direction={directionFor("nomPrenom")} onSort={() => requestSort("nomPrenom")} align="center">
Nom & Prénom
</SortableHeader>

                                                <SortableHeader direction={directionFor("fonctionCode")} onSort={() => requestSort("fonctionCode")} align="center">
Fonction
</SortableHeader>

                                                <SortableHeader direction={directionFor("service")} onSort={() => requestSort("service")} align="center">
Service
</SortableHeader>

                                                <SortableHeader direction={directionFor("codeBarre")} onSort={() => requestSort("codeBarre")} align="center">
Code Barre
</SortableHeader>

                                                <th style={{ textAlign: "center" }}>Actions</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {/* CHARGEMENT */}

                                            {isLoading ? (

                                                <tr>

                                                    <td
                                                        colSpan={6}
                                                        className="
                                                            text-center
                                                            py-8
                                                            text-muted-foreground
                                                        "
                                                    >

                                                        <div
                                                            className="
                                                                flex
                                                                items-center
                                                                justify-center
                                                                gap-2
                                                            "
                                                        >

                                                            <RefreshCw
                                                                className="
                                                                    w-5
                                                                    h-5
                                                                    animate-spin
                                                                "
                                                            />

                                                            Chargement...

                                                        </div>

                                                    </td>

                                                </tr>

                                            ) : sortedAgents.length === 0 ? (

                                                <tr>

                                                    <td
                                                        colSpan={6}
                                                        className="
                                                            text-center
                                                            py-8
                                                            text-muted-foreground
                                                        "
                                                    >

                                                        {searchTerm
                                                            ? "Aucun agent correspondant"
                                                            : "Aucun agent trouvé"}

                                                    </td>

                                                </tr>

                                            ) : (

                                                sortedAgents.map(
                                                    (agent) => (

                                                        <tr
                                                            key={
                                                                agent.id
                                                            }
                                                            onClick={() =>
                                                                handleRowClick(
                                                                    agent.id
                                                                )
                                                            }
                                                            className={`
                                                                border-b
                                                                border-border
                                                                hover:bg-accent/50
                                                                transition-colors
                                                                cursor-pointer
                                                                ${
                                                                    selectedId ===
                                                                    agent.id
                                                                        ? "bg-blue-50"
                                                                        : ""
                                                                }
                                                            `}
                                                        >

                                                            <td
                                                                className="
                                                                    text-center
                                                                    py-3
                                                                    px-4
                                                                "
                                                            >

                                                                <div
                                                                    className="
                                                                        font-mono
                                                                        text-sm
                                                                        font-medium
                                                                        text-blue-600
                                                                    "
                                                                >

                                                                    {agent.matricule ||
                                                                        "-"}

                                                                </div>

                                                            </td>

                                                            <td
                                                                className="
                                                                    text-center
                                                                    py-3
                                                                    px-4
                                                                "
                                                            >

                                                                <div className="font-medium">

                                                                    {agent.nomPrenom ||
                                                                        `${agent.prenom || ""} ${agent.nom || ""}`.trim() ||
                                                                        "-"}

                                                                </div>

                                                            </td>

                                                            <td
                                                                className="
                                                                    text-center
                                                                    py-3
                                                                    px-4
                                                                "
                                                            >

                                                                <div
                                                                    className="
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                        gap-2
                                                                    "
                                                                >

                                                                    <Briefcase
                                                                        className="
                                                                            w-4
                                                                            h-4
                                                                            text-slate-400
                                                                        "
                                                                    />

                                                                    <span className="text-sm">

                                                                        {agent.fonctionCode ||
                                                                            agent.fonction ||
                                                                            "-"}

                                                                    </span>

                                                                </div>

                                                            </td>

                                                            <td
                                                                className="
                                                                    text-center
                                                                    py-3
                                                                    px-4
                                                                "
                                                            >

                                                                {getServiceBadge(
                                                                    agent.serviceCode ||
                                                                    agent.service
                                                                )}

                                                            </td>

                                                            <td
                                                                className="
                                                                    text-center
                                                                    py-3
                                                                    px-4
                                                                "
                                                            >

                                                                <div
                                                                    className="
                                                                        font-mono
                                                                        text-xs
                                                                        text-slate-500
                                                                    "
                                                                >

                                                                    {agent.codeBarre ||
                                                                        "-"}

                                                                </div>

                                                            </td>

                                                            <td
                                                                className="
                                                                    text-center
                                                                    py-3
                                                                    px-4
                                                                "
                                                            >

                                                                <div
                                                                    className="
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                        gap-2
                                                                    "
                                                                >

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {

                                                                            e.stopPropagation();

                                                                            openBadgeModal(
                                                                                agent
                                                                            );

                                                                        }}
                                                                        className="
                                                                            p-2
                                                                            hover:bg-accent
                                                                            rounded-lg
                                                                            transition-colors
                                                                        "
                                                                        title="Imprimer le badge"
                                                                    >

                                                                        <Printer
                                                                            className="
                                                                                w-4
                                                                                h-4
                                                                                text-[#8b5cf6]
                                                                            "
                                                                        />

                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {

                                                                            e.stopPropagation();

                                                                            handleDetail(
                                                                                agent
                                                                            );

                                                                        }}
                                                                        className="
                                                                            p-2
                                                                            hover:bg-accent
                                                                            rounded-lg
                                                                            transition-colors
                                                                        "
                                                                        title="Voir les détails"
                                                                    >

                                                                        <Eye
                                                                            className="
                                                                                w-4
                                                                                h-4
                                                                                text-[#006f94]
                                                                            "
                                                                        />

                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    )
                                                )

                                            )}

                                        </tbody>

                                    </table>

                                </div>

                                {/* PAGINATION */}

                                {totalPages > 1 && (

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            px-4
                                            py-3
                                            border-t
                                            border-border
                                        "
                                    >

                                        <div
                                            className="
                                                text-sm
                                                text-muted-foreground
                                            "
                                        >

                                            {totalElements} agent(s)

                                        </div>

                                        <div
                                            className="
                                                flex
                                                items-center
                                                gap-2
                                            "
                                        >

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentPage === 0 ||
                                                    isLoading
                                                }
                                                onClick={
                                                    handlePreviousPage
                                                }
                                            >

                                                ← Précédent

                                            </Button>

                                            <span
                                                className="
                                                    text-sm
                                                    font-medium
                                                    px-3
                                                "
                                            >

                                                Page{" "}
                                                {currentPage + 1}
                                                {" / "}
                                                {totalPages}

                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentPage >=
                                                        totalPages - 1 ||
                                                    isLoading
                                                }
                                                onClick={
                                                    handleNextPage
                                                }
                                            >

                                                Suivant →

                                            </Button>

                                        </div>

                                    </div>

                                )}

                            </CardContent>

                        </Card>

                    </div>

                </motion.div>

            </div>

            {/* ================================================================= */}
            {/* MODAL DETAILS */}
            {/* ================================================================= */}

            <DetailModal
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
              title="Détails de l'agent"
              subtitle={selectedAgentDetail?.matricule || undefined}
              heading={selectedAgentDetail && (
                selectedAgentDetail.nomPrenom ||
                `${selectedAgentDetail.prenom || ""} ${selectedAgentDetail.nom || ""}`.trim()
              )}
              badges={selectedAgentDetail && getServiceBadge(selectedAgentDetail.serviceCode || selectedAgentDetail.service)}
              sections={selectedAgentDetail ? [
                { title: "Identification", icon: "id", items: [
                  { label: "ID", value: selectedAgentDetail.id, mono: true },
                  { label: "Matricule", value: selectedAgentDetail.matricule, mono: true },
                  { label: "Code Barre", value: selectedAgentDetail.codeBarre, mono: true },
                ] },
                { title: "Personne", icon: "people", items: [
                  { label: "Nom", value: selectedAgentDetail.nom },
                  { label: "Prénom", value: selectedAgentDetail.prenom },
                  { label: "Fonction", value: selectedAgentDetail.fonctionCode || selectedAgentDetail.fonction },
                ] },
                { title: "Accès", icon: "specs", items: [
                  { label: "Pointeuse active", render: getStatutBadge(selectedAgentDetail.pointeuseActif) },
                  { label: "Administrateur", render: getStatutBadge(selectedAgentDetail.administrateur) },
                ] },
              ] : []}
              actions={selectedAgentDetail && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    openBadgeModal(selectedAgentDetail);
                  }}
                >
                  <Printer className="w-4 h-4" />
                  Imprimer le badge
                </Button>
              )}
            />

            {/* ================================================================= */}
            {/* TON BADGE MODAL */}
            {/* ================================================================= */}

            <BadgeModal
                isOpen={showBadgeModal}
                onClose={closeBadgeModal}
                employee={badgeEmployee}
            />

        </>

    );
}