import { Navigate, Outlet, useLocation } from "react-router-dom";

export function ProtectedLayout() {
    const location = useLocation();

    const agentString = localStorage.getItem("agent");

    if (!agentString) {
        return (
            <Navigate
                to="/auth"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    try {
        JSON.parse(agentString);
    } catch (error) {
        console.error("Agent invalide dans localStorage");

        localStorage.removeItem("agent");

        return (
            <Navigate
                to="/auth"
                replace
            />
        );
    }

    return <Outlet />;
}