// ── Token + session persistence (localStorage survives page refresh) ─────────
//
// authToken is the JWT string returned by /api/auth/login or /api/auth/register.
// It is stored in localStorage so that refreshing the page does not log the user out.
// Every API call attaches it as "Authorization: Bearer <token>".
//
// The session object (role, userId, clientId, etc.) is also stored in localStorage
// so the React state can be restored on page load without an extra server round-trip.

const TOKEN_KEY   = "dkont_token";
const SESSION_KEY = "dkont_session";

// Initialise from localStorage on module load — null if the user has never logged in
let authToken = localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  authToken = token;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  authToken = null;
  localStorage.removeItem(TOKEN_KEY);
};

/** Persists the full session object so it survives page refresh. */
export const persistSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

/** Reads the persisted session from localStorage. Returns null if none exists. */
export const loadPersistedSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Removes the persisted session (called on logout). */
export const clearPersistedSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// ── API endpoint definitions ──────────────────────────────────────────────────

export const API_ENDPOINTS = {
  auth: {
    login:    "/api/auth/login",
    register: "/api/auth/register",
  },

  resources: {
    companies: "/api/company",
    clients:   "/api/client",
    employees: "/api/employee",
    offices:   "/api/office",
    shipments: "/api/shipment",
    users:     "/api/user",
  },
};

const endpointFor = (resource) => {
  const endpoint = API_ENDPOINTS.resources[resource];
  if (!endpoint) throw new Error(`Unknown API resource: ${resource}`);
  return endpoint;
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────

/**
 * Central HTTP client used by every API call in this module.
 *
 * Automatically attaches the JWT token to the Authorization header when one is
 * present. Throws a typed error on non-2xx responses or network failure so callers
 * can distinguish between "server offline" and "bad request" without inspecting
 * the raw Response object.
 */
export const api = async (url, options = {}) => {
  let response;

  // Build headers — always JSON, plus JWT token if one is stored
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  try {
    response = await fetch(url, { headers, ...options });
  } catch (error) {
    // Network-level failure (server not running, no internet, etc.)
    const offlineError = new Error("Server offline or unreachable");
    offlineError.code  = "SERVER_UNREACHABLE";
    offlineError.cause = error;
    throw offlineError;
  }

  if (!response.ok) {
    // Parse the error message from the response body if possible
    const text = await response.text();
    let message = text;
    try { const j = JSON.parse(text); message = j.message || j.error || text; } catch {}
    const err    = new Error(message);
    err.status   = response.status;
    throw err;
  }

  if (response.status === 204) return null;  // No content — nothing to parse
  return response.json();
};

// ── Snapshot (bulk load) ──────────────────────────────────────────────────────

/**
 * Loads all data needed to render the authenticated app in a single parallel fetch.
 * Called after login and whenever the user clicks "Refresh".
 * Uses Promise.all so all requests are sent simultaneously rather than sequentially.
 */
export const getSnapshot = async () => {
  const [companies, clients, employees, offices, shipments, users] = await Promise.all([
    listResource("companies"),
    listResource("clients"),
    listResource("employees"),
    listResource("offices"),
    listResource("shipments"),
    listResource("users"),
  ]);
  return { companies, clients, employees, offices, shipments, users };
};

/**
 * Fetches a single resource collection, returning an empty array on error.
 * This keeps the app functional even when one endpoint is temporarily unavailable
 * (e.g. a non-admin user requesting /api/user returns 403, but everything else loads).
 */
export const listResource = async (resource) => {
  try {
    return await api(endpointFor(resource));
  } catch (error) {
    console.warn(`Could not load ${resource}`, error);
    return [];
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Logs in with username and password.
 * The server returns a LoginResponse containing a JWT token plus session data.
 * The token is stored immediately so all subsequent requests are authenticated.
 */
export const login = async (payload) => {
  const response = await api(withParams(API_ENDPOINTS.auth.login, payload), { method: "POST" });
  setToken(response.token);
  return response;
};

/**
 * Registers a new client account and logs in immediately.
 * The response format is identical to login — the frontend handles both the same way.
 */
export const registerClient = async (payload) => {
  const response = await api(withParams(API_ENDPOINTS.auth.register, payload), { method: "POST" });
  setToken(response.token);
  return response;
};

// ── Resource helpers ──────────────────────────────────────────────────────────

export const updateClient   = (id, payload) => api(`${API_ENDPOINTS.resources.clients}/${id}`,  { method: "PUT",    body: JSON.stringify(payload) });
export const updateUser     = (id, payload) => api(`${API_ENDPOINTS.resources.users}/${id}`,    { method: "PUT",    body: JSON.stringify(payload) });
export const createShipment = (shipment)    => api(API_ENDPOINTS.resources.shipments,           { method: "POST",   body: JSON.stringify(shipment) });
export const deliverShipment  = (id)        => api(`${API_ENDPOINTS.resources.shipments}/${id}/deliver`, { method: "PUT" });
export const transitShipment  = (id)        => api(`${API_ENDPOINTS.resources.shipments}/${id}/transit`, { method: "PUT" });
export const cancelShipment   = (id)        => api(`${API_ENDPOINTS.resources.shipments}/${id}/cancel`,  { method: "PUT" });
export const updateShipment   = (id, payload) => api(`${API_ENDPOINTS.resources.shipments}/${id}`, { method: "PUT",  body: JSON.stringify(payload) });
export const deleteShipment   = (id)        => deleteResource("shipments", id);
export const createUser       = (user)      => createResource("users",     user);
export const createEmployee   = (employee)  => createResource("employees", employee);
export const updateEmployee   = (id, payload) => api(`${API_ENDPOINTS.resources.employees}/${id}`, { method: "PUT",  body: JSON.stringify(payload) });
export const deleteEmployee   = (id)        => deleteResource("employees", id);

/** Changes a user's role (ADMIN / EMPLOYEE / CLIENT). Admin only. */
export const changeUserRole = (userId, role) =>
  api(`${API_ENDPOINTS.resources.users}/${userId}/role?role=${role}`, { method: "PUT" });

// ── GPS ───────────────────────────────────────────────────────────────────────

export const getGpsPositions  = ()                      => api("/api/gps");
export const postGpsPosition  = (employeeId, lat, lng)  => api(`/api/gps/${employeeId}`, { method: "POST", body: JSON.stringify({ employeeId, lat, lng }) });

// ── Generic CRUD ──────────────────────────────────────────────────────────────

export const createResource = (resource, payload) => api(endpointFor(resource), { method: "POST",   body: JSON.stringify(payload) });
export const deleteResource = (resource, id)      => api(`${endpointFor(resource)}/${id}`, { method: "DELETE" });

// ── Utility ───────────────────────────────────────────────────────────────────

/** Appends a plain object as URL query parameters to a base URL. */
const withParams = (url, params) => {
  const query = new URLSearchParams(params).toString();
  return query ? `${url}?${query}` : url;
};
