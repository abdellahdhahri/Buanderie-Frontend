
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8082";




export async function apiFetch(
  endpoint,
  options = {}
) {

  
  const authString =
    localStorage.getItem("auth");


  let token = null;


  if (authString) {

    try {

      const auth =
        JSON.parse(authString);

      token =
        auth?.token || null;

    } catch (error) {

      console.error(
        "❌ Impossible de lire auth dans localStorage",
        error
      );

    }
  }



  const headers = {

    "Content-Type":
      "application/json",

    ...(options.headers || {}),

  };


  

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


 

  const url =
    endpoint.startsWith("http")
      ? endpoint
      : `${API_URL}${endpoint}`;




  console.log(
    "🌐 API REQUEST",
    {
      method:
        options.method || "GET",

      url,

      authenticated:
        !!token,
    }
  );



  const response =
    await fetch(
      url,
      {
        ...options,
        headers,
      }
    );




  if (
    response.status === 401 ||
    response.status === 403
  ) {

    console.warn(
      "🔐 Session expirée ou accès refusé",
      response.status
    );



    localStorage.removeItem(
      "auth"
    );

    localStorage.removeItem(
      "agent"
    );



    if (
      window.location.pathname !==
      "/auth"
    ) {

      window.location.href =
        "/auth";

    }

  }



  return response;
}
