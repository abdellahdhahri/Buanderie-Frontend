const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8082";

export const login = async (loginValue, password) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login: loginValue,
      password: password,
    }),
  });

  if (!response.ok) {
    let message = "Erreur d'authentification";

    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {
      // réponse non JSON
    }

    throw new Error(message);
  }

  return await response.json();
};
export const loginWithBadge = async (codeBarre) => {
  const response = await fetch(
    `${API_URL}/api/auth/login/badge?codeBarre=${encodeURIComponent(codeBarre)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    let message = "Badge invalide";
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {
      // réponse non JSON
    }
    throw new Error(message);
  }

  return await response.json();
};

// Vérifier le token
export const verifyToken = async (token) => {
  const response = await fetch(`${API_URL}/api/auth/verify`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Token invalide");
  }

  return await response.json();
};