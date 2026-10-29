const MANAGEMENT_GOALS_TOKEN_KEY = "managementGoalsToken";
const MANAGEMENT_GOALS_EXPIRES_AT_KEY = "managementGoalsTokenExpiresAt";

let activeManagementGoalCache = null;

class ManagementGoalsApiError extends Error {
  constructor(status, message, payload = null) {
    super(message);
    this.name = "ManagementGoalsApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getManagementGoalsToken() {
  const token = sessionStorage.getItem(MANAGEMENT_GOALS_TOKEN_KEY) || "";
  const expiresAt = sessionStorage.getItem(MANAGEMENT_GOALS_EXPIRES_AT_KEY) || "";
  if (!token || !expiresAt) return "";

  const expiresTime = Date.parse(expiresAt);
  if (!Number.isFinite(expiresTime) || expiresTime <= Date.now()) return "";
  return token;
}

async function managementGoalsApiRequest(path, options = {}) {
  const token = getManagementGoalsToken();
  if (!token) {
    throw new ManagementGoalsApiError(401, "AUTH_REQUIRED");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ManagementGoalsApiError(0, "NETWORK_ERROR", { cause: error });
  }

  const responseText = await response.text();
  let payload = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new ManagementGoalsApiError(
      response.status,
      payload?.message || `HTTP_${response.status}`,
      payload,
    );
  }

  return payload || {};
}

function getManagementGoalsErrorMessage(error) {
  if (error instanceof ManagementGoalsApiError) {
    if (error.status === 401) return "로그인 세션이 없거나 만료되었습니다. 다시 로그인해 주세요.";
    if (error.status === 403) return "경영목표를 변경할 권한이 없습니다.";
    if (error.status === 404) return "해당 연도의 경영목표가 저장되어 있지 않습니다.";
    if (error.status === 409) return "다른 사용자가 먼저 변경했습니다. 최신 데이터를 다시 불러온 후 작업해 주세요.";
    if (error.status === 0) return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "경영목표를 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

function setManagementGoalsStatus(message = "", type = "") {
  const status = document.getElementById("managementGoalsStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", type === "error");
  status.classList.toggle("is-success", type === "success");
}

function createManagementGoalsElement(tagName, className = "", text = null) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== null && text !== undefined) element.textContent = String(text);
  return element;
}

function appendManagementGoalsMeta(container, label, value) {
  if (typeof value !== "string" || !value) return;
  const row = createManagementGoalsElement("div", "management-goals-meta-row");
  row.appendChild(createManagementGoalsElement("span", "management-goals-meta-label", label));
  row.appendChild(createManagementGoalsElement("span", "management-goals-meta-value", value));
  container.appendChild(row);
}

function getSortedManagementGoalsItems(items) {
  return Array.isArray(items)
    ? [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    : [];
}

function createManagementGoalsTargetCard(label, target) {
  const card = createManagementGoalsElement("div", "management-goals-target-card");
  card.appendChild(createManagementGoalsElement("div", "management-goals-target-label", label));
  const value = createManagementGoalsElement("div", "management-goals-target-value");
  value.appendChild(document.createTextNode(String(target?.value ?? "-")));
  if (target?.unit) {
    value.appendChild(createManagementGoalsElement("span", "management-goals-target-unit", target.unit));
  }
  card.appendChild(value);
  return card;
}

function renderManagementGoals(goal) {
  const content = document.getElementById("managementGoalsContent");
  if (!content) return;
  content.replaceChildren();
  content.hidden = false;

  const hero = createManagementGoalsElement("section", "management-goals-hero");
  const accentLine = createManagementGoalsElement("div", "management-goals-accent-line");
  accentLine.setAttribute("aria-hidden", "true");
  accentLine.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
  hero.appendChild(accentLine);

  const heroBody = createManagementGoalsElement("div", "management-goals-hero-body");
  const title = createManagementGoalsElement("h1", "management-goals-title", `${goal.year}년 경영목표`);
  title.id = "managementGoalsTitle";
  heroBody.appendChild(title);

  const targets = createManagementGoalsElement("div", "management-goals-targets");
  targets.appendChild(createManagementGoalsTargetCard("단체매출 목표", goal.groupSalesTarget));
  targets.appendChild(createManagementGoalsTargetCard("제휴매출 목표", goal.partnershipSalesTarget));
  heroBody.appendChild(targets);
  heroBody.appendChild(createManagementGoalsElement("div", "management-goals-core-message", goal.coreMessage || ""));

  const strategies = getSortedManagementGoalsItems(goal.strategies);
  const summary = createManagementGoalsElement("section", "management-goals-summary");
  summary.appendChild(createManagementGoalsElement("h2", "management-goals-summary-title", "전략별 실행과제"));
  const summaryGrid = createManagementGoalsElement("div", "management-goals-summary-grid");
  strategies.forEach((strategy, strategyIndex) => {
    const summaryCard = createManagementGoalsElement("article", "management-goals-summary-card");
    summaryCard.appendChild(createManagementGoalsElement("h3", "", `전략 ${strategyIndex + 1}. ${strategy.title}`));
    const list = createManagementGoalsElement("ol", "management-goals-summary-list");
    getSortedManagementGoalsItems(strategy.tasks).forEach((task) => {
      list.appendChild(createManagementGoalsElement("li", "", task.title));
    });
    summaryCard.appendChild(list);
    summaryGrid.appendChild(summaryCard);
  });
  summary.appendChild(summaryGrid);
  heroBody.appendChild(summary);
  hero.appendChild(heroBody);
  content.appendChild(hero);

  const fullList = createManagementGoalsElement("section", "management-goals-full-list");
  strategies.forEach((strategy, strategyIndex) => {
    const strategyElement = createManagementGoalsElement("article", "management-goals-strategy");
    const strategyHeader = createManagementGoalsElement("header", "management-goals-strategy-header");
    strategyHeader.appendChild(createManagementGoalsElement("h2", "", `전략 ${strategyIndex + 1}. ${strategy.title}`));
    strategyElement.appendChild(strategyHeader);

    getSortedManagementGoalsItems(strategy.tasks).forEach((task, taskIndex) => {
      const taskElement = createManagementGoalsElement("section", "management-goals-task");
      const taskHeading = createManagementGoalsElement("div", "management-goals-task-heading");
      taskHeading.appendChild(createManagementGoalsElement("h3", "", `${taskIndex + 1}. ${task.title}`));
      const taskMeta = createManagementGoalsElement("div", "management-goals-task-meta");
      appendManagementGoalsMeta(taskMeta, "KPI", task.kpi);
      appendManagementGoalsMeta(taskMeta, "완료 예정", task.dueDateLabel);
      taskHeading.appendChild(taskMeta);
      taskElement.appendChild(taskHeading);

      const detailsElement = createManagementGoalsElement("div", "management-goals-details");
      const details = getSortedManagementGoalsItems(task.details);
      if (!details.length) {
        detailsElement.appendChild(createManagementGoalsElement("div", "management-goals-empty-detail", "등록된 세부 실행계획이 없습니다."));
      }
      details.forEach((detail, detailIndex) => {
        const detailElement = createManagementGoalsElement("article", "management-goals-detail");
        const detailTitle = detail.title || `세부 실행계획 ${detailIndex + 1}`;
        detailElement.appendChild(createManagementGoalsElement("h4", "management-goals-detail-title", detailTitle));
        detailElement.appendChild(createManagementGoalsElement("p", "management-goals-detail-content", detail.content));
        const detailMeta = createManagementGoalsElement("div", "management-goals-detail-meta");
        appendManagementGoalsMeta(detailMeta, "KPI", detail.kpi);
        appendManagementGoalsMeta(detailMeta, "완료 예정", detail.dueDateLabel);
        detailElement.appendChild(detailMeta);
        detailsElement.appendChild(detailElement);
      });
      taskElement.appendChild(detailsElement);
      strategyElement.appendChild(taskElement);
    });
    fullList.appendChild(strategyElement);
  });
  content.appendChild(fullList);
}

async function loadActiveManagementGoal() {
  const content = document.getElementById("managementGoalsContent");
  if (content) {
    content.hidden = true;
    content.replaceChildren();
  }
  activeManagementGoalCache = null;
  setManagementGoalsStatus("경영목표를 불러오는 중입니다.");

  try {
    const result = await managementGoalsApiRequest("/management-goals/active");
    if (!result.goal) {
      setManagementGoalsStatus("현재 메인 화면에 표시할 경영목표가 지정되어 있지 않습니다.");
      return null;
    }
    activeManagementGoalCache = result.goal;
    setManagementGoalsStatus("");
    renderManagementGoals(result.goal);
    return result.goal;
  } catch (error) {
    setManagementGoalsStatus(getManagementGoalsErrorMessage(error), "error");
    return null;
  }
}
