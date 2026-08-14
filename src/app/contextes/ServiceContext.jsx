import React, { createContext, useState, useEffect } from "react";

export const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
  const [services, setServices] = useState([]);

/*  useEffect(() => {
    // Lecture des services depuis SQL Server (non PostgreSQL)
   // fetch("http://localhost:8080/api/sqlserver/services?page=0&size=200")
      .then(res => res.json())
      .then(data => {
        // SQL Server renvoie une Page Spring : { content: [...], totalElements, ... }
        // Chaque service SQL Server a : { id, code, description }
        // On normalise vers { id, nom, description } pour compatibilité avec le reste de l'app
        const list = (data.content || data || []).map(s => ({
          id:          s.id,
          nom:         s.code,        // "code" SQL Server → "nom" utilisé dans l'app
          description: s.description,
          code:        s.code,        // on garde aussi "code" brut
        }));
        setServices(list);
      })
      .catch(err => console.error("Erreur fetch services SQL Server :", err));
  }, []);
*/
// useEffect(() => {
  //   const test = async () => {
    //     const result = await getChambresByServiceId(17);
    
    //     console.log("Chambres :", result.content);
    //     console.log("Résultat complet :", result);
//   };

//   test();
// }, []);
    useEffect(() => {
    // Lecture des services depuis SQL Server (non PostgreSQL)
   fetch("http://localhost:8082/api/sqlserver/services?page=0&size=200")
   //fetch("http://localhost:8082/api/services?page=0&size=200")
   .then(res => res.json())
      .then(data => {
        console.log("liste des services brute : ",data.content)
        // SQL Server renvoie une Page Spring : { content: [...], totalElements, ... }
        // Chaque service SQL Server a : { id, code, description }
        // On normalise vers { id, nom, description } pour compatibilité avec le reste de l'app
        const list = (data.content || data || [])
        // .map(s => ({
        //   id:          s.id,
        //   nom:         s.code,        // "code" SQL Server → "nom" utilisé dans l'app
        //   description: s.description,
        //   type:        s.typeService,        // on garde aussi "code" brut
        // }));
        setServices(list);
        console.log("la liste des services ",list)
        console.log("la liste de services brut est :",data.content)


      })
      .catch(err => console.error("Erreur fetch services SQL Server :", err));
  }, []);

const getChambresByServiceId = async (serviceId,page = 0,size = 300) => {
  try {
    const response = await fetch(
      `http://localhost:8082/api/sqlserver/chambres/service/${serviceId}?page=${page}&size=${size}`
    );

    if (!response.ok) {
      throw new Error(
        `Erreur lors du chargement des chambres (${response.status})`
      );
    }

    const data = await response.json();

   // console.log("Réponse API :", data);
    //console.log("Liste des chambres :", data.content);

    return data;
  } catch (error) {
    console.error("Erreur getChambresByServiceId :", error);
    throw error;
  }
};
  return (
    <ServiceContext.Provider value={{ services, setServices ,getChambresByServiceId}}>
      {children}
    </ServiceContext.Provider>
  );
};
