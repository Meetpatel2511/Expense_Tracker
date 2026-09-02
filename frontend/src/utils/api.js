import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

// Update activity timestamp for session security
const updateActivity = () => {
  sessionStorage.setItem("lastActivity", Date.now().toString());
};

// Attach Clerk token securely to every backend API ping
API.interceptors.request.use(async (config) => {
  updateActivity(); // Track activity on every API call
  // Clerk embeds itself directly onto the window object in React
  if (window.Clerk && window.Clerk.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Failed retrieving Clerk session token internally", e);
    }
  }
  return config;
});

// If the API explicitly rejects the token, sign the user out automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.Clerk) {
        window.Clerk.signOut();
      }
    }
    return Promise.reject(error);
  }
);

export default API;