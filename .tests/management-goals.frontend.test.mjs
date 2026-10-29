import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath) => readFile(path.join(projectRoot, relativePath), "utf8");

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.values = new Set();
  }

  setFromString(value) {
    this.values = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
  toString() { return [...this.values].join(" "); }
}

class FakeNode {
  constructor(tagName = "div", text = "") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this._text = String(text);
    this._className = "";
    this.classList = new FakeClassList(this);
    this.listeners = new Map();
    this.attributes = new Map();
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this.value = "";
    this.id = "";
  }

  get className() { return this.classList.toString(); }
  set className(value) {
    this._className = String(value);
    this.classList.setFromString(value);
  }

  get textContent() {
    return this._text + this.children.map((child) => child.textContent).join("");
  }
  set textContent(value) {
    this._text = String(value ?? "");
    this.children = [];
  }
  get innerText() { return this.textContent; }
  set innerText(value) { this.textContent = value; }

  appendChild(child) {
    const node = typeof child === "string" ? new FakeNode("#text", child) : child;
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  append(...children) { children.forEach((child) => this.appendChild(child)); }

  replaceChildren(...children) {
    this.children = [];
    this._text = "";
    this.append(...children);
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  dispatchEvent(event) {
    event.target ||= this;
    for (const listener of this.listeners.get(event.type) || []) listener.call(this, event);
  }
  click() {
    if (typeof this.onclick === "function") this.onclick({ type: "click", target: this });
    this.dispatchEvent({ type: "click", target: this });
  }
  closest() { return null; }
}

class FakeDocument {
  constructor() {
    this.elements = new Map();
  }

  createElement(tagName) { return new FakeNode(tagName); }
  createTextNode(text) { return new FakeNode("#text", text); }
  getElementById(id) { return this.elements.get(id) || null; }
  register(id, className = "", tagName = "div") {
    const element = new FakeNode(tagName);
    element.id = id;
    element.className = className;
    this.elements.set(id, element);
    return element;
  }
  querySelectorAll(selector) {
    if (selector === ".page") return [...this.elements.values()].filter((element) => element.classList.contains("page"));
    if (selector === ".nav-item") return [...this.elements.values()].filter((element) => element.classList.contains("nav-item"));
    return [];
  }
}

class FakeStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

function createContext({ fetchImpl, confirmValue = true } = {}) {
  const document = new FakeDocument();
  const sessionStorage = new FakeStorage();
  const localStorage = new FakeStorage();
  const alerts = [];
  const context = vm.createContext({
    console,
    document,
    sessionStorage,
    localStorage,
    Headers,
    Request,
    Response,
    URL,
    TextEncoder,
    setTimeout: (callback) => { callback(); return 1; },
    clearTimeout: () => {},
    alert: (message) => alerts.push(String(message)),
    confirm: () => confirmValue,
    location: { reloadCount: 0, reload() { this.reloadCount += 1; } },
    fetch: fetchImpl || (() => { throw new Error("Unexpected network request"); }),
    API_URL: "https://mock.invalid",
  });
  context.window = context;
  context.window.addEventListener = () => {};
  return { context, document, sessionStorage, localStorage, alerts };
}

function findNodes(root, predicate, result = []) {
  if (predicate(root)) result.push(root);
  root.children.forEach((child) => findNodes(child, predicate, result));
  return result;
}

function createGoalFixture(year = 2030) {
  return {
    schemaVersion: 2,
    year,
    targetAreas: [
      { id: "area-a", name: "Area A", value: 123, unit: "unit", sortOrder: 1 },
      { id: "area-b", name: "Area B", value: 456, unit: "unit", sortOrder: 2 },
    ],
    coreMessage: "Generic message <script>\nSecond & line",
    strategies: [
      {
        id: "strategy-a",
        title: "Strategy A",
        targetAreaId: "area-a",
        sortOrder: 1,
        tasks: [
          {
            id: "task-a",
            title: "Task A",
            sortOrder: 1,
            kpi: "KPI <value>",
            dueDateLabel: "Q4",
            details: [
              { id: "detail-a", title: "Detail A", content: "Long detail\nwith line break & symbols", sortOrder: 1 },
              { id: "detail-b", content: "Second detail", sortOrder: 2, kpi: "Detail KPI", dueDateLabel: "Year end" },
            ],
          },
        ],
      },
    ],
    version: 1,
    updatedAt: "2030-01-01T00:00:00.000Z",
    updatedBy: "test-admin",
  };
}

async function loadScripts(context, ...paths) {
  for (const scriptPath of paths) {
    vm.runInContext(await readProjectFile(scriptPath), context, { filename: scriptPath });
  }
}

function registerManagementGoalsMain(document) {
  document.register("managementGoalsStatus");
  document.register("managementGoalsContent");
}

function registerAdminEditor(document) {
  const ids = [
    "adminManagementGoalsStatus", "adminManagementGoalsEditor", "managementGoalsStrategiesEditor",
    "managementGoalsTargetAreasEditor", "managementGoalsDirtyStatus", "managementGoalsEditYear",
    "managementGoalsCoreMessage", "managementGoalsYearSelect",
    "newManagementGoalsYear", "loadManagementGoalsYearBtn", "newManagementGoalsYearBtn",
    "activateManagementGoalsYearBtn", "addManagementGoalsTargetAreaBtn",
    "addManagementGoalsStrategyBtn", "saveManagementGoalsBtn",
  ];
  ids.forEach((id) => document.register(id, "", id.includes("Button") || id.endsWith("Btn") ? "button" : "input"));
}

test("경영목표 API 요청에만 저장된 Bearer 토큰을 첨부한다", async () => {
  let capturedRequest = null;
  const { context, sessionStorage } = createContext({
    fetchImpl: async (url, options) => {
      capturedRequest = { url, options };
      return new Response(JSON.stringify({ success: true, activeYear: null, goal: null }), { status: 200 });
    },
  });
  sessionStorage.setItem("managementGoalsToken", "mock-token");
  sessionStorage.setItem("managementGoalsTokenExpiresAt", new Date(Date.now() + 60000).toISOString());
  await loadScripts(context, "js/management-goals.js");
  await vm.runInContext("managementGoalsApiRequest('/management-goals/active')", context);
  assert.equal(capturedRequest.url, "https://mock.invalid/management-goals/active");
  assert.equal(capturedRequest.options.headers.get("Authorization"), "Bearer mock-token");

  const apiSource = await readProjectFile("js/api.js");
  assert.doesNotMatch(apiSource, /Authorization/);
});

test("토큰이 없거나 만료되면 네트워크 요청 전 401로 차단한다", async () => {
  let fetchCount = 0;
  const { context, sessionStorage } = createContext({ fetchImpl: async () => { fetchCount += 1; } });
  await loadScripts(context, "js/management-goals.js");
  await assert.rejects(
    vm.runInContext("managementGoalsApiRequest('/management-goals/active')", context),
    (error) => error.status === 401,
  );
  sessionStorage.setItem("managementGoalsToken", "expired");
  sessionStorage.setItem("managementGoalsTokenExpiresAt", new Date(Date.now() - 1000).toISOString());
  await assert.rejects(
    vm.runInContext("managementGoalsApiRequest('/management-goals/active')", context),
    (error) => error.status === 401,
  );
  assert.equal(fetchCount, 0);
});

test("경영목표 원문은 HTML 해석 없이 모든 계층과 줄바꿈 데이터로 렌더링한다", async () => {
  const { context, document } = createContext();
  registerManagementGoalsMain(document);
  await loadScripts(context, "js/management-goals.js");
  context.fixture = createGoalFixture();
  vm.runInContext("renderManagementGoals(fixture)", context);
  const content = document.getElementById("managementGoalsContent");
  assert.match(content.textContent, /2030년 경영목표/);
  assert.match(content.textContent, /Generic message <script>/);
  assert.match(content.textContent, /Long detail\nwith line break & symbols/);
  assert.equal(findNodes(content, (node) => node.classList.contains("management-goals-detail")).length, 2);
  assert.equal(findNodes(content, (node) => node.tagName === "SCRIPT").length, 0);
  assert.doesNotMatch(await readProjectFile("js/management-goals.js"), /innerHTML/);
});

test("메인 화면은 활성 연도를 기본 표시하고 저장된 연도만 최신순으로 조회한다", async () => {
  const { context, document } = createContext();
  registerManagementGoalsMain(document);
  const requests = [];
  context.activeGoal = createGoalFixture(2030);
  context.olderGoal = createGoalFixture(2028);
  await loadScripts(context, "js/management-goals.js");
  context.managementGoalsApiRequest = async (path, options = {}) => {
    requests.push({ path, method: options.method || "GET" });
    if (path === "/management-goals/active") {
      return { success: true, activeYear: 2030, goal: context.activeGoal };
    }
    if (path === "/management-goals/years") {
      return { success: true, activeYear: 2030, years: [2028, 2031, 2030, 2028] };
    }
    if (path === "/management-goals/2028") {
      return { success: true, goal: context.olderGoal };
    }
    throw new Error(`Unexpected request: ${path}`);
  };
  await vm.runInContext("loadActiveManagementGoal()", context);

  const content = document.getElementById("managementGoalsContent");
  let yearSelect = findNodes(content, (node) => node.id === "managementGoalsMainYearSelect")[0];
  assert.match(content.textContent, /2030년 경영목표/);
  assert.deepEqual(yearSelect.children.map((option) => option.value), ["2031", "2030", "2028"]);
  assert.match(yearSelect.children[1].textContent, /기본/);
  assert.equal(yearSelect.value, "2030");

  await vm.runInContext("loadManagementGoalYearForMain(2028)", context);
  yearSelect = findNodes(content, (node) => node.id === "managementGoalsMainYearSelect")[0];
  assert.match(content.textContent, /2028년 경영목표/);
  assert.equal(yearSelect.value, "2028");
  assert.equal(vm.runInContext("managementGoalsActiveYear", context), 2030);
  assert.equal(requests.some((request) => request.method !== "GET"), false);

  await vm.runInContext("loadActiveManagementGoal()", context);
  assert.match(content.textContent, /2030년 경영목표/);
  assert.equal(vm.runInContext("managementGoalsActiveYear", context), 2030);
});

test("빠른 연도 전환에서는 마지막 요청만 화면을 갱신하고 실패 시 기존 내용을 유지한다", async () => {
  const { context, document } = createContext();
  registerManagementGoalsMain(document);
  const resolvers = new Map();
  context.initialGoal = createGoalFixture(2030);
  context.requestSelectedYear = (path) => new Promise((resolve, reject) => {
    resolvers.set(path, { resolve, reject });
  });
  await loadScripts(context, "js/management-goals.js");
  vm.runInContext(`
    managementGoalsYearsCache = [2030, 2029, 2028];
    managementGoalsActiveYear = 2030;
    renderManagementGoals(initialGoal, managementGoalsYearsCache);
    managementGoalsApiRequest = (path) => requestSelectedYear(path);
  `, context);

  const olderRequest = vm.runInContext("loadManagementGoalYearForMain(2029)", context);
  const latestRequest = vm.runInContext("loadManagementGoalYearForMain(2028)", context);
  resolvers.get("/management-goals/2028").resolve({ success: true, goal: createGoalFixture(2028) });
  await latestRequest;
  resolvers.get("/management-goals/2029").resolve({ success: true, goal: createGoalFixture(2029) });
  await olderRequest;

  const content = document.getElementById("managementGoalsContent");
  assert.match(content.textContent, /2028년 경영목표/);
  assert.doesNotMatch(content.textContent, /2029년 경영목표/);

  const failedRequest = vm.runInContext("loadManagementGoalYearForMain(2029)", context);
  resolvers.get("/management-goals/2029").reject(
    vm.runInContext("new ManagementGoalsApiError(404, 'NOT_FOUND')", context),
  );
  await failedRequest;
  assert.match(content.textContent, /2028년 경영목표/);
  assert.match(document.getElementById("managementGoalsStatus").textContent, /저장되어 있지/);
});

test("401·403·404·409 및 네트워크 오류 안내 문구를 구분한다", async () => {
  const { context } = createContext();
  await loadScripts(context, "js/management-goals.js");
  const messages = vm.runInContext(`[
    getManagementGoalsErrorMessage(new ManagementGoalsApiError(401, 'x')),
    getManagementGoalsErrorMessage(new ManagementGoalsApiError(403, 'x')),
    getManagementGoalsErrorMessage(new ManagementGoalsApiError(404, 'x')),
    getManagementGoalsErrorMessage(new ManagementGoalsApiError(409, 'x')),
    getManagementGoalsErrorMessage(new ManagementGoalsApiError(0, 'x'))
  ]`, context);
  assert.match(messages[0], /다시 로그인/);
  assert.match(messages[1], /권한/);
  assert.match(messages[2], /저장되어 있지/);
  assert.match(messages[3], /최신 데이터를 다시/);
  assert.match(messages[4], /다시 시도/);
});

test("로그인 성공 시 기존 사용자와 신규 토큰을 저장하고 로그아웃 시 모두 삭제한다", async () => {
  const loginResult = {
    success: true,
    user: { id: "test-user", name: "Test User", role: "USER" },
    token: "mock-session-token",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
  const { context, document, sessionStorage } = createContext({
    fetchImpl: async () => new Response(JSON.stringify(loginResult), { status: 200 }),
  });
  document.register("login-id").value = "test-user";
  document.register("login-pw").value = "test-password";
  await loadScripts(context, "js/auth.js");
  await vm.runInContext("checkLogin()", context);
  assert.deepEqual(JSON.parse(sessionStorage.getItem("currentUser")), loginResult.user);
  assert.equal(sessionStorage.getItem("managementGoalsToken"), loginResult.token);
  assert.equal(sessionStorage.getItem("managementGoalsTokenExpiresAt"), loginResult.expiresAt);
  vm.runInContext("logout()", context);
  assert.equal(sessionStorage.getItem("currentUser"), null);
  assert.equal(sessionStorage.getItem("managementGoalsToken"), null);
  assert.equal(sessionStorage.getItem("managementGoalsTokenExpiresAt"), null);
});

test("VIEWER에게 신규 경영목표 메뉴도 기존 조회전용 제한을 적용한다", async () => {
  const { context, document, sessionStorage, alerts } = createContext();
  sessionStorage.setItem("currentUser", JSON.stringify({ id: "viewer", name: "Viewer", role: "VIEWER" }));
  document.register("nav-management-goals", "nav-item");
  for (const id of ["nav-calendar", "nav-gen", "nav-his", "nav-set"]) document.register(id, "nav-item");
  context.showSalesPage = () => {};
  await loadScripts(context, "js/auth.js");
  vm.runInContext("applyViewerMode()", context);
  const goalsNav = document.getElementById("nav-management-goals");
  assert.equal(goalsNav.style.cursor, "not-allowed");
  goalsNav.click();
  assert.match(alerts.at(-1), /매출보고만/);
});

test("경영목표 페이지와 기존 배송 캘린더 이동 훅을 모두 유지한다", async () => {
  const { context, document } = createContext();
  ["page-management-goals", "page-calendar"].forEach((id) => document.register(id, "page"));
  ["nav-management-goals", "nav-calendar"].forEach((id) => document.register(id, "nav-item"));
  context.managementLoads = 0;
  context.calendarLoads = 0;
  context.loadActiveManagementGoal = () => { context.managementLoads += 1; };
  context.initDeliveryCalendarPage = () => { context.calendarLoads += 1; };
  await loadScripts(context, "js/navigation.js");
  vm.runInContext("showPage('page-management-goals')", context);
  assert.equal(document.getElementById("page-management-goals").classList.contains("active"), true);
  assert.equal(context.managementLoads, 1);
  vm.runInContext("showPage('page-calendar')", context);
  assert.equal(document.getElementById("page-calendar").classList.contains("active"), true);
  assert.equal(context.calendarLoads, 1);
});

test("ADMIN·USER는 경영목표, VIEWER는 기존 캘린더 후 조회전용 정책을 유지한다", async () => {
  for (const role of ["ADMIN", "USER", "VIEWER"]) {
    const { context, document } = createContext();
    const calls = [];
    let loadHandler = null;
    context.window.addEventListener = (type, handler) => { if (type === "load") loadHandler = handler; };
    context.initAuth = () => true;
    context.getCurrentUser = () => ({ id: "test", role });
    context.showPage = (id) => calls.push(id);
    context.applyViewerMode = () => calls.push("viewer-mode");
    context.loadMenusFromServer = () => {};
    context.loadPlansFromServer = () => {};
    context.loadSalesProductsFromServer = async () => {};
    context.loadSalesChannelsFromServer = async () => {};
    context.renderSalesProductFilter = () => {};
    context.renderSalesRawProductSelect = () => {};
    context.renderSalesChannelNavigation = () => {};
    context.renderSalesRawChannelSelect = () => {};
    context.renderChannelDailySalesTabs = () => {};
    context.loadSalesReportFromServer = async () => {};
    document.register("resetSalesRawBtn", "", "button");
    await loadScripts(context, "js/app.js");
    await loadHandler();
    assert.equal(calls[0], role === "VIEWER" ? "page-calendar" : "page-management-goals");
    assert.ok(calls.includes("viewer-mode"));
  }
});

test("관리자 편집기에서 전략·과제·세부 내용 추가와 순서 변경, payload 생성을 수행한다", async () => {
  const { context, document } = createContext();
  registerManagementGoalsMain(document);
  registerAdminEditor(document);
  await loadScripts(context, "js/management-goals.js", "js/admin-management-goals.js");
  vm.runInContext("adminManagementGoalDraft = createEmptyAdminManagementGoal(2030)", context);
  vm.runInContext("addAdminManagementGoalsTargetArea(); addAdminManagementGoalsTargetArea()", context);
  vm.runInContext("addAdminManagementGoalsStrategy(); addAdminManagementGoalsStrategy()", context);
  vm.runInContext(`
    adminManagementGoalDraft.targetAreas[0] = { ...adminManagementGoalDraft.targetAreas[0], name: 'Area A', value: '100', unit: 'unit' };
    adminManagementGoalDraft.targetAreas[1] = { ...adminManagementGoalDraft.targetAreas[1], name: 'Area B', value: '200', unit: 'unit' };
    adminManagementGoalDraft.strategies[0].title = 'First';
    adminManagementGoalDraft.strategies[0].targetAreaId = adminManagementGoalDraft.targetAreas[0].id;
    adminManagementGoalDraft.strategies[1].title = 'Second';
    adminManagementGoalDraft.strategies[1].targetAreaId = adminManagementGoalDraft.targetAreas[1].id;
    moveAdminManagementGoalsItem(adminManagementGoalDraft.strategies, 1, -1);
  `, context);
  let draft = JSON.parse(vm.runInContext("JSON.stringify(adminManagementGoalDraft)", context));
  assert.deepEqual(draft.strategies.map((item) => item.title), ["Second", "First"]);
  assert.deepEqual(draft.strategies.map((item) => item.sortOrder), [1, 2]);

  const container = document.getElementById("managementGoalsStrategiesEditor");
  let addTask = findNodes(container, (node) => node.tagName === "BUTTON" && node.textContent === "실행과제 추가")[0];
  addTask.click();
  let addDetail = findNodes(container, (node) => node.tagName === "BUTTON" && node.textContent === "세부 실행계획 추가")[0];
  addDetail.click();
  vm.runInContext(`
    adminManagementGoalDraft.coreMessage = 'Core <text>\\nline';
    adminManagementGoalDraft.strategies[0].tasks[0].title = 'Task';
    adminManagementGoalDraft.strategies[0].tasks[0].kpi = 'KPI';
    adminManagementGoalDraft.strategies[0].tasks[0].dueDateLabel = 'Q4';
    adminManagementGoalDraft.strategies[0].tasks[0].details[0].content = 'Detail\\ncontent';
    adminManagementGoalDraft.strategies[1].tasks = [];
  `, context);
  const payload = JSON.parse(vm.runInContext("JSON.stringify(buildAdminManagementGoalsSavePayload())", context));
  assert.equal(payload.schemaVersion, 2);
  assert.equal(payload.targetAreas[0].value, 100);
  assert.equal(payload.targetAreas.length, 2);
  assert.equal(payload.strategies[0].targetAreaId, payload.targetAreas[1].id);
  assert.equal(payload.strategies[0].tasks[0].kpi, "KPI");
  assert.equal(payload.strategies[0].tasks[0].details[0].content, "Detail\ncontent");
});

test("삭제 확인과 저장 실패 시 편집 중인 draft를 유지한다", async () => {
  const { context, document } = createContext({ confirmValue: true });
  registerManagementGoalsMain(document);
  registerAdminEditor(document);
  await loadScripts(context, "js/management-goals.js", "js/admin-management-goals.js");
  context.fixture = createGoalFixture();
  vm.runInContext("adminManagementGoalDraft = JSON.parse(JSON.stringify(fixture)); setAdminManagementGoalsDirty(true); renderAdminManagementGoalDraft()", context);
  const before = vm.runInContext("adminManagementGoalDraft.coreMessage", context);
  vm.runInContext(`managementGoalsApiRequest = async () => {
    throw new ManagementGoalsApiError(0, 'NETWORK_ERROR');
  }`, context);
  await vm.runInContext("saveAdminManagementGoal()", context);
  assert.equal(vm.runInContext("adminManagementGoalDraft.coreMessage", context), before);
  assert.equal(vm.runInContext("adminManagementGoalsDirty", context), true);
  assert.match(document.getElementById("adminManagementGoalsStatus").textContent, /다시 시도/);

  const deleteButton = findNodes(
    document.getElementById("managementGoalsStrategiesEditor"),
    (node) => node.tagName === "BUTTON" && node.textContent === "세부 내용 삭제",
  )[0];
  deleteButton.click();
  assert.equal(vm.runInContext("adminManagementGoalDraft.strategies[0].tasks[0].details.length", context), 1);
});

test("관리자 저장과 활성 연도 지정 요청은 입력 draft와 version을 유지한다", async () => {
  const { context, document } = createContext();
  registerManagementGoalsMain(document);
  registerAdminEditor(document);
  await loadScripts(context, "js/management-goals.js", "js/admin-management-goals.js");
  context.fixture = createGoalFixture();
  vm.runInContext("adminManagementGoalDraft = JSON.parse(JSON.stringify(fixture)); adminManagementGoalDraft.version = 3; setAdminManagementGoalsDirty(true); renderAdminManagementGoalDraft()", context);
  context.requests = [];
  vm.runInContext(`managementGoalsApiRequest = async (path, options = {}) => {
    requests.push({ path, options });
    if (path === '/management-goals/item') {
      return { success: true, goal: { ...options.body, version: 4, updatedAt: '2030-01-02T00:00:00.000Z', updatedBy: 'admin' } };
    }
    if (path === '/management-goals') {
      return { success: true, years: [{ year: 2030, version: 4 }], activeYear: null };
    }
    if (path === '/management-goals/active' && options.method === 'POST') {
      return { success: true, activeYear: options.body.year };
    }
    if (path === '/management-goals/active') {
      return { success: true, activeYear: 2030, goal: options.body || null };
    }
    throw new Error('Unexpected path: ' + path);
  }`, context);
  await vm.runInContext("saveAdminManagementGoal()", context);
  assert.equal(context.requests[0].path, "/management-goals/item");
  assert.equal(context.requests[0].options.body.version, 3);
  assert.equal(vm.runInContext("adminManagementGoalDraft.version", context), 4);
  assert.equal(vm.runInContext("adminManagementGoalsDirty", context), false);
  await vm.runInContext("activateAdminManagementGoalYear()", context);
  const activeRequest = context.requests.find((request) => request.path === "/management-goals/active" && request.options.method === "POST");
  assert.equal(activeRequest.options.body.year, 2030);
});

test("기존 v1 문서는 목표 수치를 보존하고 전략 소속을 자동 추정하지 않는다", async () => {
  const { context, document } = createContext();
  registerManagementGoalsMain(document);
  await loadScripts(context, "js/management-goals.js");
  context.legacyFixture = {
    schemaVersion: 1,
    year: 2026,
    groupSalesTarget: { value: 500, unit: "unit" },
    partnershipSalesTarget: { value: 510, unit: "unit" },
    coreMessage: "Legacy message",
    strategies: [{ id: "legacy-strategy", title: "Legacy strategy", sortOrder: 1, tasks: [] }],
    version: 1,
  };
  const normalized = JSON.parse(vm.runInContext("JSON.stringify(normalizeManagementGoalForClient(legacyFixture))", context));
  assert.deepEqual(normalized.targetAreas.map((area) => area.value), [500, 510]);
  assert.equal(normalized.strategies[0].targetAreaId, "");
  vm.runInContext("renderManagementGoals(legacyFixture)", context);
  const renderedTexts = findNodes(document.getElementById("managementGoalsContent"), (node) => Boolean(node.textContent))
    .map((node) => node.textContent);
  assert.ok(renderedTexts.includes("소속 미지정"));
  assert.ok(renderedTexts.some((text) => text.includes("Legacy strategy")));
});

test("연결된 전략이 있는 목표 영역 삭제를 차단한다", async () => {
  const { context, document } = createContext({ confirmValue: true });
  registerManagementGoalsMain(document);
  registerAdminEditor(document);
  await loadScripts(context, "js/management-goals.js", "js/admin-management-goals.js");
  context.fixture = createGoalFixture();
  vm.runInContext("adminManagementGoalDraft = JSON.parse(JSON.stringify(fixture)); renderAdminManagementGoalDraft()", context);
  const deleteButton = findNodes(
    document.getElementById("managementGoalsTargetAreasEditor"),
    (node) => node.tagName === "BUTTON" && node.textContent === "목표 영역 삭제",
  )[0];
  deleteButton.click();
  assert.equal(vm.runInContext("adminManagementGoalDraft.targetAreas.length", context), 2);
  assert.match(document.getElementById("adminManagementGoalsStatus").textContent, /재배정/);

  const unlinkedDeleteButton = findNodes(
    document.getElementById("managementGoalsTargetAreasEditor"),
    (node) => node.tagName === "BUTTON" && node.textContent === "목표 영역 삭제",
  )[1];
  unlinkedDeleteButton.click();
  assert.equal(vm.runInContext("adminManagementGoalDraft.targetAreas.length", context), 1);
});

test("기존 관리자 탭과 신규 세 번째 탭 전환 및 미저장 경고 훅을 유지한다", async () => {
  const { context, document } = createContext();
  [
    "adminTabAccountButton", "adminTabSalesButton", "adminTabManagementGoalsButton",
  ].forEach((id) => document.register(id, "admin-tab-button"));
  document.getElementById("adminTabAccountButton").classList.add("active");
  ["adminTabAccount", "adminTabSales", "adminTabManagementGoals"].forEach((id) => document.register(id, "admin-tab-content"));
  document.getElementById("adminTabAccount").classList.add("active");
  context.renderAdminUsers = () => {};
  context.renderAdminSalesProducts = () => {};
  context.renderAdminSalesChannels = () => {};
  context.getNextSalesChannelSortOrder = () => 1;
  context.initAdminManagementGoalsPage = () => { context.managementTabInitialized = true; };
  context.canLeaveAdminManagementGoals = () => true;
  await loadScripts(context, "js/navigation.js");
  vm.runInContext("showAdminTab('management-goals')", context);
  assert.equal(document.getElementById("adminTabManagementGoals").classList.contains("active"), true);
  assert.equal(context.managementTabInitialized, true);
  context.canLeaveAdminManagementGoals = () => false;
  vm.runInContext("showAdminTab('account')", context);
  assert.equal(document.getElementById("adminTabManagementGoals").classList.contains("active"), true);
});

test("전용 CSS에 지정 색상과 PC·좁은 화면 반응형 규칙이 존재한다", async () => {
  const css = await readProjectFile("css/management-goals.css");
  for (const color of ["#f58a1f", "#780000", "#579c32", "#506480"]) assert.match(css, new RegExp(color));
  assert.match(css, /@media \(max-width: 1000px\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /white-space: pre-wrap/);
  assert.doesNotMatch(css, /height:\s*\d+px[^\n]*management-goals-detail-content/);
});

test("index.html의 신규 CSS·JS 경로가 실제 파일과 일치하고 모의 데이터는 배포 HTML·JS에 없다", async () => {
  const html = await readProjectFile("index.html");
  for (const file of ["css/management-goals.css", "js/management-goals.js", "js/admin-management-goals.js"]) {
    assert.match(html, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await access(path.join(projectRoot, file));
  }
  assert.ok(html.indexOf("js/management-goals.js") < html.indexOf("js/admin-management-goals.js"));
  const productionSources = `${html}\n${await readProjectFile("js/management-goals.js")}\n${await readProjectFile("js/admin-management-goals.js")}`;
  assert.doesNotMatch(productionSources, /Generic message|Strategy A|mock-session-token/);
  const firebase = JSON.parse(await readProjectFile("firebase.json"));
  assert.ok(firebase.hosting.ignore.includes("**/.*"));
});

test("전체 classic script 결합 문법과 HTML inline 전역 함수 연결이 유지된다", async () => {
  const html = await readProjectFile("index.html");
  const scriptPaths = [...html.matchAll(/<script\s+src="(js\/[^"]+)"/g)].map((match) => match[1]);
  const scriptSources = [];
  for (const scriptPath of scriptPaths) {
    await access(path.join(projectRoot, scriptPath));
    scriptSources.push(await readProjectFile(scriptPath));
  }
  const combined = scriptSources.join("\n");
  assert.doesNotThrow(() => new vm.Script(combined, { filename: "classic-scripts-combined.js" }));

  const declaredFunctions = new Set(
    [...combined.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]),
  );
  const inlineFunctions = new Set(
    [...html.matchAll(/\son\w+="\s*([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]),
  );
  const missing = [...inlineFunctions].filter((name) => !declaredFunctions.has(name));
  assert.deepEqual(missing, []);
});
