const API_URL = "https://b2b-meal-api-dev.wispy-river-05a7.workers.dev";

async function apiGet(path = "") {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`GET 실패: ${response.status}`);
  return response.json();
}

async function apiPost(path = "", body = {}) {
  const url = `${API_URL}${path}`;

  console.log("[API POST 요청]", {
    url,
    path,
    body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  console.log("[API POST 응답]", {
    url,
    status: response.status,
    ok: response.ok,
    responseText,
  });

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
