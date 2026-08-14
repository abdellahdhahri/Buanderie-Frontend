import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';
const API_BASE_URL = `${API_URL}/api/programmes`;

export const ProgrammeContext = createContext();

export const ProgrammeProvider = ({ children }) => {
  const [programmesLavage, setProgrammesLavage] = useState([]);
  const [programmesSechage, setProgrammesSechage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProgrammesLavage = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/lavage`);
      setProgrammesLavage(response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur loadProgrammesLavage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgrammesSechage = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/sechage`);
      setProgrammesSechage(response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur loadProgrammesSechage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createProgrammeLavage = async (data) => {
    try {
      setIsLoading(true);
      console.log('📤 Envoi données lavage:', data);
      const response = await axios.post(`${API_BASE_URL}/lavage`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur createProgrammeLavage:', error);
      console.error('📝 Détails:', error.response?.data);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgrammeLavage = async (id, data) => {
    try {
      setIsLoading(true);
      console.log('📤 Mise à jour lavage:', data);
      const response = await axios.put(`${API_BASE_URL}/lavage/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur updateProgrammeLavage:', error);
      console.error('📝 Détails:', error.response?.data);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProgrammeLavage = async (id) => {
    try {
      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/lavage/${id}`);
    } catch (error) {
      console.error('❌ Erreur deleteProgrammeLavage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createProgrammeSechage = async (data) => {
    try {
      setIsLoading(true);
      console.log('📤 Envoi données séchage:', data);
      const response = await axios.post(`${API_BASE_URL}/sechage`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur createProgrammeSechage:', error);
      console.error('📝 Détails:', error.response?.data);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgrammeSechage = async (id, data) => {
    try {
      setIsLoading(true);
      console.log('📤 Mise à jour séchage:', data);
      const response = await axios.put(`${API_BASE_URL}/sechage/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur updateProgrammeSechage:', error);
      console.error('📝 Détails:', error.response?.data);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProgrammeSechage = async (id) => {
    try {
      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/sechage/${id}`);
    } catch (error) {
      console.error('❌ Erreur deleteProgrammeSechage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProgrammeContext.Provider value={{
      programmesLavage,
      programmesSechage,
      isLoading,
      setLoading: setIsLoading,
      loadProgrammesLavage,
      loadProgrammesSechage,
      createProgrammeLavage,
      updateProgrammeLavage,
      deleteProgrammeLavage,
      createProgrammeSechage,
      updateProgrammeSechage,
      deleteProgrammeSechage
    }}>
      {children}
    </ProgrammeContext.Provider>
  );
};