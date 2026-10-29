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
  }

  async get(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  async put(key, value, options) {
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

async function callWorker(env, path, { method = "GET", body, token, headers = {} } = {}) {
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
  assert.deepEqual(data.user, { id: USER_ID, name: "Test User", role: "USER" });
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
  let response = await callWorker(env, "/users");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await readJson(response)));

  response = await callWorker(env, "/sales-products");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await readJson(response)));

  response = await callWorker(env, "/sales-channels");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await readJson(response)));
});
