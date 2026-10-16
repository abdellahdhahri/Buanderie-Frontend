
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



export function ProtectedLayout() {

  const location = useLocation();

  const matches = useMatches();




  const authString =
    localStorage.getItem("auth");




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


  

  const privileges =
    Array.isArray(auth.privileges)
      ? auth.privileges
      : [];


 

  const protectedMatch =
    [...matches]
      .reverse()
      .find(
        match =>
          match.handle?.privileges
      );


 

  if (!protectedMatch) {

    return <Outlet />;
  }



  const requiredPrivileges =
    protectedMatch.handle.privileges;



  const authorized =
    hasPrivilege(
      privileges,
      requiredPrivileges
    );






 

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
