const API_URL = "https://b2b-meal-api-dev.wispy-river-05a7.workers.dev";

function getApiSessionToken() {
  const token = sessionStorage.getItem("managementGoalsToken") || "";
  const expiresAt = Date.parse(
    sessionStorage.getItem("managementGoalsTokenExpiresAt") || "",
  );
  return token && Number.isFinite(expiresAt) && expiresAt > Date.now()
    ? token
    : "";
}

function createAuthenticatedApiHeaders(headers = {}) {
  const result = new Headers(headers);
  const token = getApiSessionToken();
  if (token) result.set("Authorization", `Bearer ${token}`);
  return result;
}

async function apiGet(path = "") {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`GET 실패: ${response.status}`);
  return response.json();
}

async function apiPost(path = "", body = {}) {
  const url = `${API_URL}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `POST ${path} 실패 / 상태코드: ${response.status} / 응답: ${responseText}`
    );
  }

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    return {
      message: responseText,
    };
  }
}

async function apiDelete(path = "") {
  const response = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`DELETE 실패: ${response.status}`);
  return response.json().catch(() => ({}));
}

async function apiAuthGet(path = "") {
  const response = await fetch(`${API_URL}${path}`, {
    headers: createAuthenticatedApiHeaders(),
  });
  if (!response.ok) throw new Error(`GET 실패: ${response.status}`);
  return response.json();
}

async function apiAuthPost(path = "", body = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: createAuthenticatedApiHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `POST ${path} 실패 / 상태코드: ${response.status} / 응답: ${responseText}`
    );
  }
  if (!responseText) return {};
  try {
    return JSON.parse(responseText);
  } catch (e) {
    return { message: responseText };
  }
}

async function apiAuthDelete(path = "") {
  const response = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: createAuthenticatedApiHeaders(),
  });
  if (!response.ok) throw new Error(`DELETE 실패: ${response.status}`);
  return response.json().catch(() => ({}));
}
