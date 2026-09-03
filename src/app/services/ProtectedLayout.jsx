
import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  useMatches,
} from "react-router-dom";



function hasPrivilege(
  userPrivileges,
  requiredPrivileges = []
) {

  /*
   * Pas de privilèges
   */

  if (!Array.isArray(userPrivileges)) {
    return false;
  }


  /*
   * ADMIN
   */

  if (
    userPrivileges.includes("ADMIN") ||
    userPrivileges.includes("ALL")
  ) {

    return true;
  }


  /*
   * Aucun privilège requis
   */

  if (
    !Array.isArray(requiredPrivileges) ||
    requiredPrivileges.length === 0
  ) {

    return true;
  }


  /*
   * Au moins un privilège demandé
   */

  return requiredPrivileges.some(
    privilege =>
      userPrivileges.includes(privilege)
  );
}


/*
 * ============================================================
 * PROTECTED LAYOUT
 * ============================================================
 */

export function ProtectedLayout() {

  const location = useLocation();

  const matches = useMatches();


  /*
   * ==========================================================
   * RECUPERATION AUTH
   * ==========================================================
   */

  const authString =
    localStorage.getItem("auth");


  /*
   * Pas authentifié
   */

  if (!authString) {

    console.warn(
      "❌ Aucun auth dans localStorage"
    );

    return (
      <Navigate
        to="/auth"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }


  /*
   * ==========================================================
   * PARSE AUTH
   * ==========================================================
   */

  let auth;

  try {

    auth = JSON.parse(authString);

  } catch (error) {

    console.error(
      "❌ Auth invalide dans localStorage",
      error
    );

    localStorage.removeItem("auth");
    localStorage.removeItem("agent");

    return (
      <Navigate
        to="/auth"
        replace
      />
    );
  }


  /*
   * ==========================================================
   * VERIFICATION JWT
   * ==========================================================
   */

  if (!auth?.token) {

    console.warn(
      "❌ Aucun JWT trouvé dans auth"
    );

    localStorage.removeItem("auth");

    return (
      <Navigate
        to="/auth"
        replace
      />
    );
  }


  /*
   * ==========================================================
   * PRIVILEGES UTILISATEUR
   * ==========================================================
   */

  const privileges =
    Array.isArray(auth.privileges)
      ? auth.privileges
      : [];


  /*
   * ==========================================================
   * ROUTE ACTUELLE
   * ==========================================================
   *
   * useMatches() contient les routes actuellement matchées.
   *
   * On cherche celle qui contient handle.privileges.
   */

  const protectedMatch =
    [...matches]
      .reverse()
      .find(
        match =>
          match.handle?.privileges
      );


  /*
   * ==========================================================
   * AUCUNE PROTECTION
   * ==========================================================
   */

  if (!protectedMatch) {

    return <Outlet />;
  }


  /*
   * ==========================================================
   * PRIVILEGES REQUIS
   * ==========================================================
   */

  const requiredPrivileges =
    protectedMatch.handle.privileges;


  /*
   * ==========================================================
   * VERIFICATION
   * ==========================================================
   */

  const authorized =
    hasPrivilege(
      privileges,
      requiredPrivileges
    );


  /*
   * ==========================================================
   * DEBUG
   * ==========================================================
   */

  console.log(
    "===================================="
  );

  console.log(
    "🔐 PROTECTION ROUTE"
  );

  console.log(
    "Route :",
    location.pathname
  );

  console.log(
    "Privilèges utilisateur :",
    privileges
  );

  console.log(
    "Privilèges requis :",
    requiredPrivileges
  );

  console.log(
    "Autorisé :",
    authorized
  );

  console.log(
    "===================================="
  );


  /*
   * ==========================================================
   * ACCES REFUSE
   * ==========================================================
   */

  if (!authorized) {

    console.warn(
      "🚫 ACCÈS REFUSÉ",
      {
        route:
          location.pathname,

        required:
          requiredPrivileges,

        userPrivileges:
          privileges,
      }
    );


    return (
      <Navigate
        to="/"
        replace
        state={{
          unauthorized: true,
          attemptedPath:
            location.pathname,
        }}
      />
    );
  }




  return <Outlet />;
}
