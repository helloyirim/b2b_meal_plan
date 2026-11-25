import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerSource = await readFile(
  new URL("./worker.management-goals.dev.js", import.meta.url),
  "utf8",
);
const workerModule = await import(
  `data:text/javascript;base64,${Buffer.from(workerSource).toString("base64")}`
);
const worker = workerModule.default;

class MemoryKV {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
    this.putOptions = new Map();
    this.getCounts = new Map();
    this.failPutKeys = new Set();
  }

  async get(key) {
    this.getCounts.set(key, (this.getCounts.get(key) || 0) + 1);
    return this.values.has(key) ? this.values.get(key) : null;
  }

  async put(key, value, options) {
    if (this.failPutKeys.has(key)) {
      throw new Error(`Mock put failure: ${key}`);
    }
    this.values.set(key, String(value));
    this.putOptions.set(key, options);
  }

  async delete(key) {
    this.values.delete(key);
    this.putOptions.delete(key);
  }
}

const ADMIN_ID = "yirim.yu";
const USER_ID = "test.user";

function createEnv() {
  const users = [
    { id: ADMIN_ID, pw: "test-admin-password", name: "Test Admin", role: "ADMIN", active: true },
    { id: USER_ID, pw: "test-user-password", name: "Test User", role: "USER", active: true },
    { id: "inactive.user", pw: "test-inactive-password", name: "Inactive", role: "USER", active: false },
  ];
  return {
    B2B_MEAL_DATA: new MemoryKV({ users: JSON.stringify(users) }),
  };
}

async function callWorker(env, path, { method = "GET", body, token, headers = {}, anonymous = false } = {}) {
  if (!token && !anonymous && /^\/(menus|delivery-events|blackgoat-sales|plans|sales-products|sales-channels)(\/|\?|$)/.test(path)) {
    const authenticated = await login(env, ADMIN_ID, "test-admin-password");
    token = authenticated.data.token;
  }
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  const request = new Request(`https://worker.test${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return worker.fetch(request, env);
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

async function login(env, id = USER_ID, pw = "test-user-password") {
  const response = await callWorker(env, "/auth/login", {
    method: "POST",
    body: { id, pw },
  });
  return { response, data: await readJson(response) };
}

function createGoal(year, overrides = {}) {
  return {
    year,
    groupSalesTarget: { value: 100, unit: "unit" },
    partnershipSalesTarget: { value: 200, unit: "unit" },
    coreMessage: "Generic test message\nSecond line & <tag>",
    strategies: [
      {
        id: "strategy-1",
        title: "Strategy test",
        sortOrder: 1,
        tasks: [
          {
            id: "task-1",
            title: "Task test",
            sortOrder: 1,
            kpi: "KPI test\nline two",
            dueDateLabel: "Q4",
            details: [
              {
                id: "detail-1",
                title: "Optional title",
                content: "Detail test\nPreserve <>& symbols",
                sortOrder: 1,
                kpi: "Detail KPI",
                dueDateLabel: "Year end",
              },
            ],
          },
        ],
      },
    ],
    version: 0,
    ...overrides,
  };
}

function createDynamicGoal(year, overrides = {}) {
  return {
    schemaVersion: 2,
    year,
    targetAreas: [
      { id: "area-1", name: "Area one", value: 100, unit: "unit", sortOrder: 1 },
      { id: "area-2", name: "Area two", value: 200, unit: "unit", sortOrder: 2 },
      { id: "area-3", name: "Area three", value: 300, unit: "unit", sortOrder: 3 },
    ],
    coreMessage: "Dynamic goal message\nSecond line",
    strategies: [
      {
        id: "strategy-dynamic",
        title: "Dynamic strategy",
        targetAreaId: "area-2",
        sortOrder: 1,
        tasks: [
          {
            id: "task-dynamic",
            title: "Dynamic task",
            sortOrder: 1,
            details: [
              { id: "detail-dynamic", content: "Dynamic detail", sortOrder: 1 },
            ],
          },
        ],
      },
    ],
    version: 0,
    ...overrides,
  };
}

async function adminToken(env) {
  const { response, data } = await login(env, ADMIN_ID, "test-admin-password");
  assert.equal(response.status, 200);
  return data.token;
}

test("기존 로그인 성공 응답을 유지하고 세션 필드를 추가한다", async () => {
  const env = createEnv();
  const { response, data } = await login(env);
  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.deepEqual(data.user, {
    id: USER_ID,
    name: "Test User",
    role: "USER",
    menuPermissions: {
      managementGoals: "read", calendar: "write", sales: "write",
      mealCreate: "write", mealManagement: "write", menuManagement: "write",
    },
  });
  assert.equal(typeof data.token, "string");
  assert.ok(data.token.length >= 64);
  assert.ok(Number.isFinite(Date.parse(data.expiresAt)));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("로그인 실패 시 세션을 발급하지 않는다", async () => {
  const env = createEnv();
  const { response, data } = await login(env, USER_ID, "wrong-password");
  assert.equal(response.status, 401);
  assert.equal(data.success, false);
  assert.equal(data.token, undefined);
  assert.equal([...env.B2B_MEAL_DATA.values.keys()].some((key) => key.startsWith("auth:sessions:")), false);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("세션 토큰 원문 대신 SHA-256 키와 TTL을 저장한다", async () => {
  const env = createEnv();
  const { data } = await login(env);
  const sessionKey = [...env.B2B_MEAL_DATA.values.keys()].find((key) => key.startsWith("auth:sessions:"));
  assert.ok(sessionKey);
  assert.equal(sessionKey.includes(data.token), false);
  assert.match(sessionKey, /^auth:sessions:[0-9a-f]{64}$/);
  assert.equal(env.B2B_MEAL_DATA.values.has(`auth:sessions:${data.token}`), false);
  assert.equal(env.B2B_MEAL_DATA.putOptions.get(sessionKey).expirationTtl, 28800);
  const stored = JSON.parse(env.B2B_MEAL_DATA.values.get(sessionKey));
  assert.deepEqual(Object.keys(stored).sort(), ["createdAt", "expiresAt", "userId"]);
  assert.equal(stored.userId, USER_ID);
});

test("토큰 누락·위조·만료를 401로 거부한다", async () => {
  const env = createEnv();
  let response = await callWorker(env, "/management-goals/active");
  assert.equal(response.status, 401);

  response = await callWorker(env, "/management-goals/active", { token: "forged-token" });
  assert.equal(response.status, 401);

  const { data } = await login(env);
  const sessionKey = [...env.B2B_MEAL_DATA.values.keys()].find((key) => key.startsWith("auth:sessions:"));
  const stored = JSON.parse(env.B2B_MEAL_DATA.values.get(sessionKey));
  stored.expiresAt = new Date(Date.now() - 1000).toISOString();
  env.B2B_MEAL_DATA.values.set(sessionKey, JSON.stringify(stored));
  response = await callWorker(env, "/management-goals/active", { token: data.token });
  assert.equal(response.status, 401);
  assert.equal(env.B2B_MEAL_DATA.values.has(sessionKey), false);
});

test("삭제되거나 비활성화된 사용자의 기존 토큰을 거부한다", async () => {
  const deletedEnv = createEnv();
  const deletedLogin = await login(deletedEnv);
  const deletedUsers = JSON.parse(await deletedEnv.B2B_MEAL_DATA.get("users"))
    .filter((user) => user.id !== USER_ID);
  await deletedEnv.B2B_MEAL_DATA.put("users", JSON.stringify(deletedUsers));
  let response = await callWorker(deletedEnv, "/management-goals/active", { token: deletedLogin.data.token });
  assert.equal(response.status, 401);

  const inactiveEnv = createEnv();
  const inactiveLogin = await login(inactiveEnv);
  const inactiveUsers = JSON.parse(await inactiveEnv.B2B_MEAL_DATA.get("users"));
  inactiveUsers.find((user) => user.id === USER_ID).active = false;
  await inactiveEnv.B2B_MEAL_DATA.put("users", JSON.stringify(inactiveUsers));
  response = await callWorker(inactiveEnv, "/management-goals/active", { token: inactiveLogin.data.token });
  assert.equal(response.status, 401);
});

test("일반 사용자는 조회할 수 있지만 저장은 403이다", async () => {
  const env = createEnv();
  const { data } = await login(env);
  let response = await callWorker(env, "/management-goals/active", { token: data.token });
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), { success: true, activeYear: null, goal: null });

  response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token: data.token,
    body: createGoal(2030),
  });
  assert.equal(response.status, 403);
});

test("로그인 사용자는 실제 저장된 연도 목록을 최신순으로 조회하고 관리자 설정은 변경하지 않는다", async () => {
  const env = createEnv();
  await env.B2B_MEAL_DATA.put("management-goals:2030", JSON.stringify(createGoal(2030)));
  await env.B2B_MEAL_DATA.put("management-goals:2031", JSON.stringify(createDynamicGoal(2031)));
  await env.B2B_MEAL_DATA.put("management-goals:index", JSON.stringify([
    { year: 2030 }, { year: 2099 }, { year: 2031 }, { year: 2030 },
  ]));
  await env.B2B_MEAL_DATA.put("management-goals:settings", JSON.stringify({ activeYear: 2030 }));
  const settingsBefore = await env.B2B_MEAL_DATA.get("management-goals:settings");
  const { data } = await login(env);

  let response = await callWorker(env, "/management-goals/years", { token: data.token });
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    success: true,
    years: [2031, 2030],
    activeYear: 2030,
  });
  assert.equal(await env.B2B_MEAL_DATA.get("management-goals:settings"), settingsBefore);

  response = await callWorker(env, "/management-goals", { token: data.token });
  assert.equal(response.status, 403);
});

test("관리자가 연도 문서를 저장하고 특수문자·줄바꿈을 그대로 재조회한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  const input = createGoal(2030);
  let response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: input,
  });
  assert.equal(response.status, 200);
  const saved = (await readJson(response)).goal;
  assert.equal(saved.version, 1);
  assert.equal(saved.updatedBy, ADMIN_ID);
  assert.equal(saved.coreMessage, input.coreMessage);
  assert.equal(saved.strategies[0].tasks[0].details[0].content, input.strategies[0].tasks[0].details[0].content);

  response = await callWorker(env, "/management-goals/2030", { token });
  assert.equal(response.status, 200);
  const loaded = (await readJson(response)).goal;
  assert.equal(loaded.coreMessage, input.coreMessage);
  assert.equal(loaded.strategies[0].tasks[0].kpi, input.strategies[0].tasks[0].kpi);
  assert.equal(loaded.strategies[0].tasks[0].details[0].dueDateLabel, "Year end");
});

test("동적 목표 영역 3개와 전략 소속 관계를 저장하고 재조회한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  const input = createDynamicGoal(2032);
  let response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: input,
  });
  assert.equal(response.status, 200);
  const saved = (await readJson(response)).goal;
  assert.equal(saved.schemaVersion, 2);
  assert.deepEqual(saved.targetAreas.map((area) => area.id), ["area-1", "area-2", "area-3"]);
  assert.equal(saved.strategies[0].targetAreaId, "area-2");

  response = await callWorker(env, "/management-goals/2032", { token });
  assert.equal(response.status, 200);
  const loaded = (await readJson(response)).goal;
  assert.equal(loaded.targetAreas[2].name, "Area three");
  assert.equal(loaded.strategies[0].tasks[0].details[0].content, "Dynamic detail");
});

test("존재하지 않는 목표 영역에 연결된 전략 저장을 거부한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  const input = createDynamicGoal(2033);
  input.strategies[0].targetAreaId = "missing-area";
  const response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: input,
  });
  assert.equal(response.status, 400);
  assert.equal(await env.B2B_MEAL_DATA.get("management-goals:2033"), null);
});

test("기존 v1 문서를 조회할 때 자동 변환하거나 덮어쓰지 않는다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  const legacy = { ...createGoal(2026), schemaVersion: 1, version: 7 };
  await env.B2B_MEAL_DATA.put("management-goals:2026", JSON.stringify(legacy));
  const before = await env.B2B_MEAL_DATA.get("management-goals:2026");
  const response = await callWorker(env, "/management-goals/2026", { token });
  assert.equal(response.status, 200);
  assert.deepEqual((await readJson(response)).goal, legacy);
  assert.equal(await env.B2B_MEAL_DATA.get("management-goals:2026"), before);
});

test("연도별 문서를 구분하고 저장된 연도만 활성화한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);

  let response = await callWorker(env, "/management-goals/active", {
    method: "POST",
    token,
    body: { year: 2040 },
  });
  assert.equal(response.status, 400);

  for (const year of [2030, 2031]) {
    response = await callWorker(env, "/management-goals/item", {
      method: "POST",
      token,
      body: createGoal(year, { coreMessage: `Message ${year}` }),
    });
    assert.equal(response.status, 200);
  }

  response = await callWorker(env, "/management-goals/active", {
    method: "POST",
    token,
    body: { year: 2031 },
  });
  assert.equal(response.status, 200);

  response = await callWorker(env, "/management-goals/active", { token });
  const active = await readJson(response);
  assert.equal(active.activeYear, 2031);
  assert.equal(active.goal.coreMessage, "Message 2031");

  response = await callWorker(env, "/management-goals", { token });
  const index = await readJson(response);
  assert.deepEqual(index.years.map((item) => item.year), [2031, 2030]);
  assert.equal(index.activeYear, 2031);
});

test("잘못된 입력과 과도한 요청 크기를 거부한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  let response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2030, { groupSalesTarget: { value: -1, unit: "unit" } }),
  });
  assert.equal(response.status, 400);

  response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2030, { strategies: [null] }),
  });
  assert.equal(response.status, 400);

  response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2030, { coreMessage: "x".repeat(520 * 1024) }),
  });
  assert.equal(response.status, 413);
});

test("version 불일치 저장을 409로 거부하고 기존 문서를 유지한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  let response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2030),
  });
  assert.equal(response.status, 200);

  response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2030, { version: 1, coreMessage: "Version two" }),
  });
  assert.equal(response.status, 200);
  assert.equal((await readJson(response)).goal.version, 2);

  response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2030, { version: 1, coreMessage: "Stale write" }),
  });
  assert.equal(response.status, 409);
  const stored = JSON.parse(await env.B2B_MEAL_DATA.get("management-goals:2030"));
  assert.equal(stored.version, 2);
  assert.equal(stored.coreMessage, "Version two");
});

test("세션의 저장 role이 아니라 최신 users의 관리자 권한을 사용한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  const users = JSON.parse(await env.B2B_MEAL_DATA.get("users"));
  users.find((user) => user.id === ADMIN_ID).role = "USER";
  await env.B2B_MEAL_DATA.put("users", JSON.stringify(users));
  const response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2030),
  });
  assert.equal(response.status, 403);
});

test("업무 API는 최신 계정의 메뉴별 none·read·write 권한을 서버에서 검증한다", async () => {
  const env = createEnv();
  const loggedIn = await login(env);
  const token = loggedIn.data.token;

  let response = await callWorker(env, "/delivery-events", { anonymous: true });
  assert.equal(response.status, 401);

  const setPermissions = async (menuPermissions) => {
    const users = JSON.parse(await env.B2B_MEAL_DATA.get("users"));
    users.find((user) => user.id === USER_ID).menuPermissions = menuPermissions;
    await env.B2B_MEAL_DATA.put("users", JSON.stringify(users));
  };

  await setPermissions({ calendar: "none" });
  response = await callWorker(env, "/delivery-events", { token });
  assert.equal(response.status, 403);

  await setPermissions({ calendar: "read" });
  response = await callWorker(env, "/delivery-events", { token });
  assert.equal(response.status, 200);
  response = await callWorker(env, "/delivery-events/item", {
    method: "POST",
    token,
    body: { id: "permission-event", title: "Permission event" },
  });
  assert.equal(response.status, 403);

  await setPermissions({ calendar: "write" });
  response = await callWorker(env, "/delivery-events/item", {
    method: "POST",
    token,
    body: { id: "permission-event", title: "Permission event" },
  });
  assert.equal(response.status, 200);

  await setPermissions({ mealCreate: "none", mealManagement: "read" });
  response = await callWorker(env, "/plans", { token });
  assert.equal(response.status, 200);
  response = await callWorker(env, "/plans", {
    method: "POST",
    token,
    body: { id: "permission-plan", name: "Permission plan", data: {} },
  });
  assert.equal(response.status, 403);

  await setPermissions({ managementGoals: "write" });
  response = await callWorker(env, "/management-goals/item", {
    method: "POST",
    token,
    body: createGoal(2031),
  });
  assert.equal(response.status, 403);
  response = await callWorker(env, "/users", { token });
  assert.equal(response.status, 403);
});

test("VIEWER의 기존 write 저장값을 read로 처리하고 변경 API를 403으로 차단한다", async () => {
  const env = createEnv();
  const users = JSON.parse(await env.B2B_MEAL_DATA.get("users"));
  users.push({
    id: "write.viewer",
    pw: "viewer-password",
    name: "Write Viewer",
    role: "VIEWER",
    active: true,
    menuPermissions: {
      managementGoals: "write", calendar: "write", sales: "write",
      mealCreate: "write", mealManagement: "write", menuManagement: "write",
    },
  });
  await env.B2B_MEAL_DATA.put("users", JSON.stringify(users));

  const { response: loginResponse, data } = await login(env, "write.viewer", "viewer-password");
  assert.equal(loginResponse.status, 200);
  assert.deepEqual(data.user.menuPermissions, {
    managementGoals: "read", calendar: "read", sales: "read",
    mealCreate: "read", mealManagement: "read", menuManagement: "read",
  });

  const requests = [
    ["/management-goals/item", "POST", createGoal(2032)],
    ["/delivery-events/item", "POST", { id: "viewer-event", title: "Blocked" }],
    ["/blackgoat-sales", "POST", {}],
    ["/plans", "POST", { id: "viewer-plan", name: "Blocked", data: {} }],
    ["/plans/viewer-plan", "DELETE", undefined],
    ["/menus/item", "POST", { id: "viewer-menu", name: "Blocked" }],
  ];
  for (const [path, method, body] of requests) {
    const response = await callWorker(env, path, { method, body, token: data.token });
    assert.equal(response.status, 403, `${method} ${path}`);
  }
});
test("CORS preflight가 Authorization 헤더를 허용한다", async () => {
  const env = createEnv();
  const response = await callWorker(env, "/management-goals/active", { method: "OPTIONS" });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Access-Control-Allow-Headers"), /Authorization/);
});

test("기존 메뉴·배송 일정 API의 저장·조회·삭제 흐름을 유지한다", async () => {
  const env = createEnv();
  const menu = { id: "menu-test", name: "Menu test" };
  let response = await callWorker(env, "/menus/item", { method: "POST", body: menu });
  assert.equal(response.status, 200);
  response = await callWorker(env, "/menus");
  assert.deepEqual(await readJson(response), [menu]);

  const event = { id: "event-test", title: "Event test" };
  response = await callWorker(env, "/delivery-events/item", { method: "POST", body: event });
  assert.equal(response.status, 200);
  response = await callWorker(env, "/delivery-events");
  assert.deepEqual(await readJson(response), [event]);
  response = await callWorker(env, "/delivery-events/event-test", { method: "DELETE" });
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(await env.B2B_MEAL_DATA.get("delivery-events")), []);
});

test("경량 메뉴 목록은 Base64를 제외하고 기존 전체 목록은 유지한다", async () => {
  const imageData = `data:image/png;base64,${Buffer.from("menu-image").toString("base64")}`;
  const menus = [
    { id: "base64-menu", name: "Base64 menu", img: imageData },
    { id: "external-menu", name: "External menu", img: "https://images.example/menu.png" },
    { id: "empty-menu", name: "Empty menu", img: "" },
  ];
  const env = createEnv();
  await env.B2B_MEAL_DATA.put("menus", JSON.stringify(menus));

  let response = await callWorker(env, "/menus");
  assert.deepEqual(await readJson(response), menus);

  const token = await adminToken(env);
  response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token,
  });
  assert.equal(response.status, 200);

  response = await callWorker(env, "/menus?includeImages=false");
  const lightweightMenus = await readJson(response);
  assert.equal(lightweightMenus.length, 3);
  assert.doesNotMatch(JSON.stringify(lightweightMenus), /data:image\//);
  assert.equal(
    lightweightMenus[0].img,
    "https://worker.test/menus/base64-menu/image?v=legacy-38",
  );
  assert.equal(lightweightMenus[1].img, "https://images.example/menu.png");
  assert.equal(lightweightMenus[2].img, "");
});

test("개별 메뉴 이미지 조회는 원본 바이트와 Content-Type을 반환한다", async () => {
  const originalBytes = Buffer.from([0, 1, 2, 3, 250, 255]);
  const imageData = `data:image/png;base64,${originalBytes.toString("base64")}`;
  const env = createEnv();
  await env.B2B_MEAL_DATA.put(
    "menus",
    JSON.stringify([{ id: "image menu", name: "Image menu", img: imageData }]),
  );

  const token = await adminToken(env);
  let response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token,
  });
  assert.equal(response.status, 200);

  response = await callWorker(env, "/menus/image%20menu/image?v=legacy");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "image/png");
  assert.match(response.headers.get("Cache-Control"), /immutable/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), originalBytes);

  const missingResponse = await callWorker(env, "/menus/missing/image");
  assert.equal(missingResponse.status, 404);
});

test("관리자 재구축은 원본 menus를 보존하고 경량 목록과 메뉴별 이미지 키를 생성한다", async () => {
  const firstBytes = Buffer.from([1, 2, 3, 4]);
  const secondBytes = Buffer.from([5, 6, 7, 8]);
  const menus = [
    {
      id: "derived-1",
      name: "Derived one",
      img: `data:image/png;base64,${firstBytes.toString("base64")}`,
    },
    {
      id: "derived-2",
      name: "Derived two",
      img: `data:image/jpeg;base64,${secondBytes.toString("base64")}`,
    },
  ];
  const env = createEnv();
  const originalText = JSON.stringify(menus);
  await env.B2B_MEAL_DATA.put("menus", originalText);

  const userLogin = await login(env);
  let response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token: userLogin.data.token,
  });
  assert.equal(response.status, 403);

  const token = await adminToken(env);
  response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    success: true,
    menuCount: 2,
    imageCount: 2,
  });

  assert.equal(await env.B2B_MEAL_DATA.get("menus"), originalText);
  assert.equal(
    await env.B2B_MEAL_DATA.get("menu-image:derived-1"),
    menus[0].img,
  );
  assert.equal(
    await env.B2B_MEAL_DATA.get("menu-image:derived-2"),
    menus[1].img,
  );
  assert.doesNotMatch(await env.B2B_MEAL_DATA.get("menus:light"), /data:image\//);
  assert.equal(await env.B2B_MEAL_DATA.get("menus:derived:dirty"), null);
  assert.ok(await env.B2B_MEAL_DATA.get("menus:derived:ready"));

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 200);
  assert.equal((await readJson(response)).length, 2);
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus:light"), 1);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/derived-1/image");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), firstBytes);
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menu-image:derived-1"), 1);
});

test("기존 POST /menus 전체 저장도 원본 응답 호환성과 파생 키 동기화를 유지한다", async () => {
  const imageData = `data:image/png;base64,${Buffer.from("bulk-image").toString("base64")}`;
  const menus = [
    { id: "bulk-1", name: "Bulk one", img: imageData },
    { id: "bulk-2", name: "Bulk two", img: "" },
  ];
  const env = createEnv();

  let response = await callWorker(env, "/menus", {
    method: "POST",
    body: menus,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    success: true,
    count: 2,
    derivedSync: true,
  });

  response = await callWorker(env, "/menus");
  assert.deepEqual(await readJson(response), menus);
  assert.equal(await env.B2B_MEAL_DATA.get("menu-image:bulk-1"), imageData);
  assert.ok(await env.B2B_MEAL_DATA.get("menus:light"));
  assert.ok(await env.B2B_MEAL_DATA.get("menus:derived:ready"));
  assert.equal(await env.B2B_MEAL_DATA.get("menus:derived:dirty"), null);
});

test("파생 데이터 미준비·dirty·이미지 키 누락 상태는 원본 menus를 읽지 않고 명확히 실패한다", async () => {
  const imageData = `data:image/png;base64,${Buffer.from("derived-image").toString("base64")}`;
  const env = createEnv();
  await env.B2B_MEAL_DATA.put(
    "menus",
    JSON.stringify([{ id: "derived-1", name: "Derived", img: imageData }]),
  );

  env.B2B_MEAL_DATA.getCounts.clear();
  let response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_NOT_READY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/derived-1/image");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_NOT_READY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  await env.B2B_MEAL_DATA.put("menus:derived:ready", JSON.stringify({ completedAt: "test" }));
  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_LIGHT_DATA_MISSING");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/derived-1/image");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_LIGHT_DATA_MISSING");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  await env.B2B_MEAL_DATA.put(
    "menus:light",
    JSON.stringify([{ id: "derived-1", name: "Derived", img: "", menuImageStored: true }]),
  );
  await env.B2B_MEAL_DATA.put("menus:derived:dirty", JSON.stringify({ reason: "test" }));

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_DIRTY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/derived-1/image");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_DIRTY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  await env.B2B_MEAL_DATA.delete("menus:derived:dirty");
  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/derived-1/image");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_IMAGE_DATA_MISSING");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/unknown/image");
  assert.equal(response.status, 404);
  assert.equal((await readJson(response)).message, "MENU_IMAGE_NOT_FOUND");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  await env.B2B_MEAL_DATA.put("menus:light", JSON.stringify({ invalid: true }));
  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_LIGHT_DATA_INVALID");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/derived-1/image");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_LIGHT_DATA_INVALID");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);
});

test("메뉴 저장의 파생 동기화가 실패하면 dirty를 유지하고 관리자 재구축으로 복구한다", async () => {
  const oldImage = `data:image/png;base64,${Buffer.from("old").toString("base64")}`;
  const newImage = `data:image/png;base64,${Buffer.from("new").toString("base64")}`;
  const env = createEnv();
  await env.B2B_MEAL_DATA.put(
    "menus",
    JSON.stringify([{ id: "sync-1", name: "Before", img: oldImage }]),
  );
  env.B2B_MEAL_DATA.failPutKeys.add("menus:light");

  let response = await callWorker(env, "/menus/item", {
    method: "POST",
    body: { id: "sync-1", name: "After", img: newImage },
  });
  assert.equal(response.status, 200);
  assert.equal((await readJson(response)).derivedSync, false);
  assert.ok(await env.B2B_MEAL_DATA.get("menus:derived:dirty"));
  assert.equal(JSON.parse(await env.B2B_MEAL_DATA.get("menus"))[0].img, newImage);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_DIRTY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/sync-1/image");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_DIRTY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.failPutKeys.delete("menus:light");
  const token = await adminToken(env);
  response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token,
  });
  assert.equal(response.status, 200);
  assert.equal(await env.B2B_MEAL_DATA.get("menus:derived:dirty"), null);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 200);
  assert.equal((await readJson(response))[0].name, "After");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);
});

test("관리자 재구축 실패는 dirty를 유지하고 이후 조회에서도 원본 menus를 읽지 않는다", async () => {
  const imageData = `data:image/png;base64,${Buffer.from("rebuild-failure").toString("base64")}`;
  const env = createEnv();
  await env.B2B_MEAL_DATA.put(
    "menus",
    JSON.stringify([{ id: "failure-1", name: "Failure", img: imageData }]),
  );
  env.B2B_MEAL_DATA.failPutKeys.add("menu-image:failure-1");
  const token = await adminToken(env);

  env.B2B_MEAL_DATA.getCounts.clear();
  let response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token,
  });
  assert.equal(response.status, 500);
  assert.equal((await readJson(response)).message, "DERIVED_REBUILD_FAILED");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus"), 1);
  assert.ok(await env.B2B_MEAL_DATA.get("menus:derived:dirty"));

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus?includeImages=false");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_DIRTY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);

  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/failure-1/image");
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).message, "MENU_DERIVED_DATA_DIRTY");
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);
});

test("메뉴 수정 시 새 이미지가 없으면 기존 이미지를 보존하고 새 이미지가 있으면 교체한다", async () => {
  const oldImage = `data:image/png;base64,${Buffer.from("old-image").toString("base64")}`;
  const newImage = `data:image/jpeg;base64,${Buffer.from("new-image").toString("base64")}`;
  const env = createEnv();
  await env.B2B_MEAL_DATA.put(
    "menus",
    JSON.stringify([{ id: "menu-1", name: "Before", price: 1000, img: oldImage }]),
  );

  const token = await adminToken(env);
  let response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token,
  });
  assert.equal(response.status, 200);

  response = await callWorker(env, "/menus/item", {
    method: "POST",
    body: { id: "menu-1", name: "Text changed", price: 2000, img: "" },
  });
  assert.equal(response.status, 200);
  let storedMenu = JSON.parse(await env.B2B_MEAL_DATA.get("menus"))[0];
  assert.equal(storedMenu.img, oldImage);
  assert.equal(storedMenu.name, "Text changed");
  assert.equal(storedMenu.imageUpdatedAt, undefined);

  response = await callWorker(env, "/menus/item", {
    method: "POST",
    body: { id: "menu-1", name: "Image changed", price: 2000, img: newImage },
  });
  assert.equal(response.status, 200);
  storedMenu = JSON.parse(await env.B2B_MEAL_DATA.get("menus"))[0];
  assert.equal(storedMenu.img, newImage);
  assert.ok(Number.isFinite(Date.parse(storedMenu.imageUpdatedAt)));

  response = await callWorker(env, "/menus?includeImages=false");
  const lightweightMenu = (await readJson(response))[0];
  assert.match(lightweightMenu.img, /\/menus\/menu-1\/image\?v=/);
  assert.ok(lightweightMenu.img.includes(encodeURIComponent(storedMenu.imageUpdatedAt)));
});

test("메뉴 사용 현황과 하드 삭제는 인증·사용 중 확인·동시 변경 검사를 적용한다", async () => {
  const imageData = `data:image/png;base64,${Buffer.from("delete-image").toString("base64")}`;
  const menus = [
    { id: "delete-1", name: "Delete target", brand: "Test", price: 1000, img: imageData },
    { id: "keep-1", name: "Keep target", brand: "Test", price: 2000, img: "" },
  ];
  const plan = {
    id: "plan-using-menu",
    name: "Plan using menu",
    data: {
      "cell-1": { menuId: "delete-1" },
      "cell-2": { menuId: "delete-1" },
      "cell-3": { menuId: "keep-1" },
    },
  };
  const env = createEnv();
  await env.B2B_MEAL_DATA.put("menus", JSON.stringify(menus));
  await env.B2B_MEAL_DATA.put("plans:index", JSON.stringify([plan.id]));
  await env.B2B_MEAL_DATA.put(`plans:${plan.id}`, JSON.stringify(plan));

  let response = await callWorker(env, "/menus/delete-1/usage", { anonymous: true });
  assert.equal(response.status, 401);

  const token = await adminToken(env);
  response = await callWorker(env, "/menus/derived/rebuild", { method: "POST", token });
  assert.equal(response.status, 200);

  response = await callWorker(env, "/menus/delete-1/usage", { token });
  assert.equal(response.status, 200);
  const usage = await readJson(response);
  assert.equal(usage.inUse, true);
  assert.equal(usage.planCount, 1);
  assert.equal(usage.usageCount, 2);
  assert.match(usage.fingerprint, /^[a-f0-9]{64}$/);
  assert.match(usage.collectionFingerprint, /^[a-f0-9]{64}$/);

  const deletePath =
    `/menus/delete-1?expectedFingerprint=${usage.fingerprint}` +
    `&expectedCollectionFingerprint=${usage.collectionFingerprint}`;
  response = await callWorker(env, deletePath, { method: "DELETE", token });
  assert.equal(response.status, 409);
  assert.equal((await readJson(response)).message, "MENU_IN_USE");
  assert.equal(JSON.parse(await env.B2B_MEAL_DATA.get("menus")).length, 2);

  response = await callWorker(
    env,
    `${deletePath}&confirmInUse=true`,
    { method: "DELETE", token },
  );
  assert.equal(response.status, 200);
  const deleted = await readJson(response);
  assert.equal(deleted.deletedId, "delete-1");
  assert.equal(deleted.count, 1);
  assert.deepEqual(JSON.parse(await env.B2B_MEAL_DATA.get("menus")), [menus[1]]);
  assert.equal(await env.B2B_MEAL_DATA.get("menu-image:delete-1"), null);
  assert.doesNotMatch(await env.B2B_MEAL_DATA.get("menus:light"), /delete-1/);
  assert.equal(await env.B2B_MEAL_DATA.get("menus:derived:dirty"), null);
  assert.equal(
    JSON.parse(await env.B2B_MEAL_DATA.get(`plans:${plan.id}`)).data["cell-1"].menuId,
    "delete-1",
  );
});

test("메뉴 하드 삭제는 잘못된 fingerprint에서 원본과 파생 데이터를 변경하지 않는다", async () => {
  const menu = { id: "conflict-1", name: "Conflict", brand: "Test", price: 1000, img: "" };
  const env = createEnv();
  await env.B2B_MEAL_DATA.put("menus", JSON.stringify([menu]));
  const token = await adminToken(env);
  let response = await callWorker(env, "/menus/derived/rebuild", { method: "POST", token });
  assert.equal(response.status, 200);
  const originalMenus = await env.B2B_MEAL_DATA.get("menus");
  const originalLight = await env.B2B_MEAL_DATA.get("menus:light");

  response = await callWorker(
    env,
    "/menus/conflict-1?expectedFingerprint=invalid&expectedCollectionFingerprint=invalid",
    { method: "DELETE", token },
  );
  assert.equal(response.status, 409);
  assert.equal((await readJson(response)).message, "MENUS_CHANGED");
  assert.equal(await env.B2B_MEAL_DATA.get("menus"), originalMenus);
  assert.equal(await env.B2B_MEAL_DATA.get("menus:light"), originalLight);
});

test("대용량 가상 메뉴에서 경량 응답 크기를 비교한다", async (t) => {
  const imageData = `data:image/png;base64,${"A".repeat(96 * 1024)}`;
  const menus = Array.from({ length: 140 }, (_, index) => ({
    id: `large-${index}`,
    name: `Large menu ${index}`,
    brand: "Test brand",
    price: 10000 + index,
    img: imageData,
  }));
  const env = createEnv();
  await env.B2B_MEAL_DATA.put("menus", JSON.stringify(menus));

  let startedAt = performance.now();
  let response = await callWorker(env, "/menus");
  const fullText = await response.text();
  const fullDurationMs = performance.now() - startedAt;

  const token = await adminToken(env);
  env.B2B_MEAL_DATA.getCounts.clear();
  response = await callWorker(env, "/menus/derived/rebuild", {
    method: "POST",
    token,
  });
  assert.equal(response.status, 200);
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus"), 1);

  env.B2B_MEAL_DATA.getCounts.clear();
  startedAt = performance.now();
  response = await callWorker(env, "/menus?includeImages=false");
  const lightweightText = await response.text();
  const lightweightDurationMs = performance.now() - startedAt;

  assert.equal(JSON.parse(lightweightText).length, menus.length);
  assert.doesNotMatch(lightweightText, /data:image\//);
  assert.ok(lightweightText.length < fullText.length * 0.02);
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus") || 0, 0);
  assert.equal(env.B2B_MEAL_DATA.getCounts.get("menus:light"), 1);
  t.diagnostic(
    JSON.stringify({
      fullBytes: Buffer.byteLength(fullText),
      lightweightBytes: Buffer.byteLength(lightweightText),
      reductionPercent: Number((100 - (lightweightText.length / fullText.length) * 100).toFixed(2)),
      fullDurationMs: Number(fullDurationMs.toFixed(2)),
      lightweightDurationMs: Number(lightweightDurationMs.toFixed(2)),
      derivedMenusReads: env.B2B_MEAL_DATA.getCounts.get("menus") || 0,
    }),
  );
});

test("기존 식단·매출 API의 저장·조회·삭제 흐름을 유지한다", async () => {
  const env = createEnv();
  const plan = { id: "plan-test", title: "Plan test", plan: {} };
  let response = await callWorker(env, "/plans", { method: "POST", body: plan });
  assert.equal(response.status, 200);
  response = await callWorker(env, "/plans");
  assert.deepEqual(await readJson(response), [plan]);
  response = await callWorker(env, "/plans/plan-test", { method: "DELETE" });
  assert.equal(response.status, 200);
  assert.equal(await env.B2B_MEAL_DATA.get("plans:plan-test"), null);

  const sales = { products: { test: { channels: {} } } };
  response = await callWorker(env, "/blackgoat-sales", { method: "POST", body: sales });
  assert.equal(response.status, 200);
  response = await callWorker(env, "/blackgoat-sales");
  assert.deepEqual(await readJson(response), sales);
});

test("기존 사용자·상품·채널 마스터 조회 라우트를 유지한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  let response = await callWorker(env, "/users", { token });
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await readJson(response)));

  response = await callWorker(env, "/sales-products");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await readJson(response)));

  response = await callWorker(env, "/sales-channels");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await readJson(response)));
});

test("기존 평문 비밀번호 계정은 로그인 성공 시 해당 계정만 해시로 전환한다", async () => {
  const env = createEnv();
  let result = await login(env, USER_ID, "test-user-password");
  assert.equal(result.response.status, 200);

  let users = JSON.parse(await env.B2B_MEAL_DATA.get("users"));
  const migrated = users.find((user) => user.id === USER_ID);
  const untouchedAdmin = users.find((user) => user.id === ADMIN_ID);
  assert.equal(migrated.pw, undefined);
  assert.equal(migrated.passwordAlgorithm, "PBKDF2-SHA-256");
  assert.equal(migrated.passwordIterations, 100000);
  assert.match(migrated.passwordSalt, /^[a-f0-9]{32}$/);
  assert.match(migrated.passwordHash, /^[a-f0-9]{64}$/);
  assert.equal(typeof untouchedAdmin.pw, "string");

  result = await login(env, USER_ID, "test-user-password");
  assert.equal(result.response.status, 200);
  result = await login(env, USER_ID, "wrong-password");
  assert.equal(result.response.status, 401);
});

test("런타임 상한을 초과한 기존 해시는 변경하지 않고 내부 오류를 일반화한다", async () => {
  const user = {
    id: "unsupported-hash",
    name: "Unsupported Hash",
    role: "USER",
    active: true,
    passwordAlgorithm: "PBKDF2-SHA-256",
    passwordIterations: 210000,
    passwordSalt: "00".repeat(16),
    passwordHash: "00".repeat(32),
  };
  const originalUsers = JSON.stringify([user]);
  const env = {
    B2B_MEAL_DATA: new MemoryKV({ users: originalUsers }),
  };
  const originalConsoleError = console.error;
  console.error = () => {};
  let result;
  try {
    result = await login(env, user.id, "any-password");
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(result.response.status, 500);
  assert.deepEqual(result.data, { success: false, message: "AUTH_INTERNAL_ERROR" });
  assert.equal(await env.B2B_MEAL_DATA.get("users"), originalUsers);
});

test("기존 ADMIN·USER·VIEWER 역할은 평문 및 해시 로그인에서 그대로 유지된다", async () => {
  const fixtures = [
    { id: "role-admin", pw: "admin-password", name: "Admin", role: "ADMIN", active: true },
    { id: "role-user", pw: "user-password", name: "User", role: "USER", active: true },
    { id: "role-viewer", pw: "viewer-password", name: "Viewer", role: "VIEWER", active: true },
  ];
  const env = {
    B2B_MEAL_DATA: new MemoryKV({ users: JSON.stringify(fixtures) }),
  };

  for (const fixture of fixtures) {
    let result = await login(env, fixture.id, fixture.pw);
    assert.equal(result.response.status, 200);
    assert.equal(result.data.user.role, fixture.role);
    if (fixture.role === "ADMIN") {
      assert.equal(result.data.user.menuPermissions.managementGoals, "write");
    } else if (fixture.role === "USER") {
      assert.equal(result.data.user.menuPermissions.managementGoals, "read");
      assert.equal(result.data.user.menuPermissions.calendar, "write");
    } else {
      assert.equal(result.data.user.menuPermissions.managementGoals, "none");
      assert.equal(result.data.user.menuPermissions.sales, "read");
    }

    result = await login(env, fixture.id, fixture.pw);
    assert.equal(result.response.status, 200);
    assert.equal(result.data.user.role, fixture.role);
  }
});

test("users가 비어 있어도 기본 관리자 계정을 자동 생성하지 않는다", async () => {
  const env = { B2B_MEAL_DATA: new MemoryKV() };
  const result = await login(env, ADMIN_ID, "any-password");
  assert.equal(result.response.status, 401);
  assert.equal(await env.B2B_MEAL_DATA.get("users"), null);
});

test("사용자 API는 ADMIN 세션을 요구하고 응답에서 인증정보를 제거한다", async () => {
  const env = createEnv();
  let response = await callWorker(env, "/users");
  assert.equal(response.status, 401);

  const { data: userLogin } = await login(env, USER_ID, "test-user-password");
  response = await callWorker(env, "/users", { token: userLogin.token });
  assert.equal(response.status, 403);

  const token = await adminToken(env);
  response = await callWorker(env, "/users", { token });
  assert.equal(response.status, 200);
  const users = await readJson(response);
  assert.equal(users.length, 3);
  for (const user of users) {
    assert.equal(user.pw, undefined);
    assert.equal(user.passwordAlgorithm, undefined);
    assert.equal(user.passwordIterations, undefined);
    assert.equal(user.passwordSalt, undefined);
    assert.equal(user.passwordHash, undefined);
  }
});

test("ADMIN은 해시 비밀번호로 사용자를 생성·수정하고 기존 로그인 흐름을 유지한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  let response = await callWorker(env, "/users/item", {
    method: "POST",
    token,
    body: {
      id: "new.viewer",
      name: "New Viewer",
      role: "VIEWER",
      pw: "new-password",
      menuPermissions: { managementGoals: "write", calendar: "write" },
    },
  });
  assert.equal(response.status, 200);
  const publicResult = await readJson(response);
  assert.equal(publicResult.user.passwordHash, undefined);

  let users = JSON.parse(await env.B2B_MEAL_DATA.get("users"));
  assert.equal(users.find((user) => user.id === "new.viewer").passwordIterations, 100000);
  let stored = users.find((user) => user.id === "new.viewer");
  assert.equal(stored.pw, undefined);
  assert.equal(stored.passwordAlgorithm, "PBKDF2-SHA-256");
  assert.match(stored.passwordHash, /^[a-f0-9]{64}$/);
  assert.equal(stored.menuPermissions.managementGoals, "read");
  assert.equal(stored.menuPermissions.calendar, "read");

  let result = await login(env, "new.viewer", "new-password");
  assert.equal(result.response.status, 200);

  response = await callWorker(env, "/users/item", {
    method: "POST",
    token,
    body: { id: "new.viewer", name: "New Viewer", role: "VIEWER", pw: "changed-password" },
  });
  assert.equal(response.status, 200);
  users = JSON.parse(await env.B2B_MEAL_DATA.get("users"));
  stored = users.find((user) => user.id === "new.viewer");
  assert.notEqual(stored.passwordHash, undefined);

  result = await login(env, "new.viewer", "new-password");
  assert.equal(result.response.status, 401);
  result = await login(env, "new.viewer", "changed-password");
  assert.equal(result.response.status, 200);
});

test("마지막 활성 ADMIN의 강등·비활성화·삭제를 차단한다", async () => {
  const env = createEnv();
  const token = await adminToken(env);
  for (const body of [
    { id: ADMIN_ID, name: "Test Admin", role: "USER", active: true },
    { id: ADMIN_ID, name: "Test Admin", role: "ADMIN", active: false },
  ]) {
    const response = await callWorker(env, "/users/item", { method: "POST", token, body });
    assert.equal(response.status, 409);
    assert.equal((await readJson(response)).message, "LAST_ACTIVE_ADMIN_REQUIRED");
  }

  const deleteResponse = await callWorker(env, `/users/${encodeURIComponent(ADMIN_ID)}`, {
    method: "DELETE",
    token,
  });
  assert.equal(deleteResponse.status, 409);
  assert.equal((await readJson(deleteResponse)).message, "LAST_ACTIVE_ADMIN_REQUIRED");
});

test("auth/me는 최신 사용자를 반환하고 auth/logout은 현재 세션을 폐기한다", async () => {
  const env = createEnv();
  const { data } = await login(env, USER_ID, "test-user-password");
  let response = await callWorker(env, "/auth/me", { token: data.token });
  assert.equal(response.status, 200);
  const me = await readJson(response);
  assert.deepEqual(me.user, {
    id: USER_ID,
    name: "Test User",
    role: "USER",
    active: true,
    menuPermissions: {
      managementGoals: "read", calendar: "write", sales: "write",
      mealCreate: "write", mealManagement: "write", menuManagement: "write",
    },
  });

  response = await callWorker(env, "/auth/logout", { method: "POST", token: data.token });
  assert.equal(response.status, 200);
  response = await callWorker(env, "/auth/me", { token: data.token });
  assert.equal(response.status, 401);
});
