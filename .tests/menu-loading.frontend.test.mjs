import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const mealLibrarySource = await readFile(
  new URL("../js/meal-library.js", import.meta.url),
  "utf8",
);
const mealPlannerSource = await readFile(
  new URL("../js/meal-planner.js", import.meta.url),
  "utf8",
);
const mealHistorySource = await readFile(
  new URL("../js/meal-history.js", import.meta.url),
  "utf8",
);
const pdfSource = await readFile(new URL("../js/pdf.js", import.meta.url), "utf8");

function createElement(value = "") {
  return {
    value,
    innerHTML: "",
    innerText: "",
    src: "",
    style: {},
    classList: { add() {}, remove() {} },
    querySelector() { return null; },
  };
}

function createLibraryContext() {
  const elements = new Map();
  for (const id of [
    "lib-brand-filter",
    "lib-list",
    "lib-search-input",
    "lib-price-filter",
    "mgmt-list",
    "mgmt-search",
    "edit-id",
    "edit-name",
    "edit-brand",
    "edit-price",
    "edit-allergy",
    "edit-memo",
    "edit-img-base64",
    "edit-preview",
    "preview-text",
  ]) {
    elements.set(id, createElement());
  }

  const apiCalls = [];
  const fetchCalls = [];
  const confirmMessages = [];
  let apiMenus = [
    {
      id: "server-menu",
      name: "Server menu",
      brand: "Test",
      price: 12000,
      allergy: "",
      memo: "",
      img: "https://worker.test/menus/server-menu/image?v=legacy",
    },
  ];
  const context = vm.createContext({
    console,
    Headers,
    Response,
    URLSearchParams,
    API_URL: "https://worker.test",
    location: { href: "https://app.test/" },
    document: {
      getElementById(id) {
        return elements.get(id) || null;
      },
    },
    window: { scrollTo() {} },
    alert() {},
    confirm(message) {
      confirmMessages.push(message);
      return true;
    },
    sessionStorage: {
      getItem(key) {
        if (key === "managementGoalsToken") return "test-token";
        if (key === "managementGoalsTokenExpiresAt") {
          return new Date(Date.now() + 60_000).toISOString();
        }
        return null;
      },
    },
    getCurrentUser() {
      return { id: "test-user", name: "Test User", role: "USER" };
    },
    requireMenuPermission() { return true; },
    canWriteMenu() { return true; },
    canReadMenu() { return true; },
    createAuthenticatedApiHeaders(headers = {}) { return new Headers(headers); },
    async fetch(url, options = {}) {
      fetchCalls.push({ url: String(url), method: options.method || "GET" });
      if (String(url).endsWith("/menus/server-menu/usage")) {
        return new Response(JSON.stringify({
          success: true,
          menuId: "server-menu",
          fingerprint: "a".repeat(64),
          collectionFingerprint: "b".repeat(64),
          inUse: false,
          planCount: 0,
          usageCount: 0,
          plans: [],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if ((options.method || "GET") === "DELETE") {
        apiMenus = apiMenus.filter((menu) => String(menu.id) !== "server-menu");
        return new Response(JSON.stringify({
          success: true,
          deletedId: "server-menu",
          count: apiMenus.length,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: false, message: "NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    },
    escapeHtml(value) {
      return String(value ?? "");
    },
    async apiGet(path) {
      apiCalls.push({ method: "GET", path });
      return JSON.parse(JSON.stringify(apiMenus));
    },
    async apiPost(path, body) {
      apiCalls.push({
        method: "POST",
        path,
        body: JSON.parse(JSON.stringify(body)),
      });
      return { success: true };
    },
  });

  vm.runInContext(mealLibrarySource, context, { filename: "meal-library.js" });
  return { context, elements, apiCalls, fetchCalls, confirmMessages };
}

test("메뉴 라이브러리는 경량 목록을 요청하고 이미지에 지연 로딩을 적용한다", async () => {
  const { context, elements, apiCalls } = createLibraryContext();
  await vm.runInContext("loadMenusFromServer()", context);

  assert.equal(apiCalls[0].path, "/menus?includeImages=false");
  assert.match(elements.get("lib-list").innerHTML, /loading="lazy"/);
  assert.match(elements.get("mgmt-list").innerHTML, /loading="lazy"/);
  assert.match(elements.get("lib-list").innerHTML, /\/menus\/server-menu\/image/);
});

test("기존 메뉴 편집은 이미지 URL을 payload로 저장하지 않고 화면 이미지를 유지한다", async () => {
  const { context, elements, apiCalls } = createLibraryContext();
  vm.runInContext(`menus = [{
    id: "menu-1",
    name: "Before",
    brand: "Brand",
    price: 1000,
    allergy: "",
    memo: "",
    img: "https://worker.test/menus/menu-1/image?v=legacy"
  }]; menusLoadState = "loaded"`, context);

  vm.runInContext("editMenu('menu-1')", context);
  assert.equal(elements.get("edit-img-base64").value, "");
  assert.equal(
    elements.get("edit-preview").src,
    "https://worker.test/menus/menu-1/image?v=legacy",
  );

  elements.get("edit-name").value = "After";
  elements.get("edit-price").value = "2000";
  await vm.runInContext("saveMenu()", context);

  const postCall = apiCalls.find((call) => call.method === "POST");
  assert.equal(postCall.path, "/menus/item");
  assert.equal(postCall.body.img, "");
  assert.equal(
    vm.runInContext("menus[0].img", context),
    "https://worker.test/menus/menu-1/image?v=legacy",
  );
});

test("새 이미지 선택 시 Base64만 저장 요청에 포함한다", async () => {
  const { context, elements, apiCalls } = createLibraryContext();
  vm.runInContext(`menus = [{
    id: "menu-1", name: "Before", brand: "Brand", price: 1000,
    img: "https://worker.test/menus/menu-1/image?v=legacy"
  }]; menusLoadState = "loaded"`, context);
  vm.runInContext("editMenu('menu-1')", context);

  const replacement = "data:image/png;base64,bmV3LWltYWdl";
  elements.get("edit-img-base64").value = replacement;
  await vm.runInContext("saveMenu()", context);

  const postCall = apiCalls.find((call) => call.method === "POST");
  assert.equal(postCall.body.img, replacement);
  assert.equal(vm.runInContext("menus[0].img", context), replacement);
});

test("메뉴 하드 삭제는 사용 현황 확인 후 fingerprint를 포함한 DELETE만 실행한다", async () => {
  const { context, elements, fetchCalls, confirmMessages } = createLibraryContext();
  await vm.runInContext("loadMenusFromServer()", context);
  assert.match(elements.get("mgmt-list").innerHTML, /deleteMenu\('server-menu'\)/);

  await vm.runInContext("deleteMenu('server-menu')", context);

  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0].method, "GET");
  assert.match(fetchCalls[0].url, /\/menus\/server-menu\/usage$/);
  assert.equal(fetchCalls[1].method, "DELETE");
  assert.match(fetchCalls[1].url, /expectedFingerprint=a{64}/);
  assert.match(fetchCalls[1].url, /expectedCollectionFingerprint=b{64}/);
  assert.equal(confirmMessages.length, 1);
  assert.equal(vm.runInContext("menus.length", context), 0);
  assert.doesNotMatch(elements.get("mgmt-list").innerHTML, /server-menu/);
});

test("식단 저장은 이미지 URL과 무관하게 menuId만 저장하고 이력에서 이미지를 해석한다", async () => {
  const elements = new Map([
    ["week-count", createElement("1")],
    ["start-date", createElement("2026-11-02")],
    ["stat-avg", createElement()],
    ["stat-total", createElement()],
    ["stat-unique", createElement()],
  ]);
  let savedPlan = null;
  const context = vm.createContext({
    console,
    Date,
    document: {
      getElementById(id) { return elements.get(id) || null; },
      querySelectorAll(selector) {
        if (selector === ".day-check:checked") return [{ value: "1" }];
        return [];
      },
    },
    alert() {},
    prompt() { return "Test plan"; },
    escapeHtml(value) { return String(value ?? ""); },
    getDefaultImage(value) { return value || "placeholder"; },
    getMenuImageAttributes(value) { return `src="${value || "placeholder"}"`; },
    getCurrentUser() { return { id: "user", name: "User", role: "USER" }; },
    requireMenuPermission() { return true; },
    canReadMenu() { return true; },
    canWriteMenu() { return true; },
    async renderHistoryList() {},
    async apiGet() { return []; },
    async apiPost(path, body) {
      if (path === "/plans") savedPlan = JSON.parse(JSON.stringify(body));
      return {};
    },
    async apiDelete() { return {}; },
    confirm() { return true; },
  });
  vm.runInContext(mealPlannerSource, context, { filename: "meal-planner.js" });
  vm.runInContext(mealHistorySource, context, { filename: "meal-history.js" });
  vm.runInContext(`
    menus = [{
      id: "menu-1", name: "Menu", brand: "Brand", price: 1000,
      img: "https://worker.test/menus/menu-1/image?v=legacy"
    }];
    mealPlan = { "cell-0-1": { menuId: "menu-1" } };
  `, context);

  await vm.runInContext("savePlan()", context);
  assert.deepEqual(savedPlan.data, { "cell-0-1": { menuId: "menu-1" } });
  assert.equal(JSON.stringify(savedPlan).includes("/menus/menu-1/image"), false);

  const historyHtml = vm.runInContext(`renderStaticGrid({
    weeks: 1,
    selectedDays: [1],
    data: { "cell-0-1": { menuId: "menu-1" } }
  })`, context);
  assert.match(historyHtml, /https:\/\/worker\.test\/menus\/menu-1\/image/);
});

test("PDF 캡처는 URL 이미지가 있는 복제 영역에서 기존 CORS 옵션을 유지한다", async () => {
  const clone = { style: {}, imageSrc: "https://worker.test/menus/menu-1/image?v=legacy" };
  const target = {
    getBoundingClientRect() { return { width: 800, height: 600 }; },
    cloneNode() { return clone; },
  };
  const tempWrap = {
    style: {},
    parentNode: { removeChild() {} },
    appendChild() {},
  };
  let html2canvasOptions = null;
  let pdfSaved = false;
  const context = vm.createContext({
    console,
    Date,
    setTimeout(callback) { callback(); },
    document: {
      getElementById() { return target; },
      querySelectorAll() { return []; },
      createElement() { return tempWrap; },
      body: { appendChild() {} },
    },
    async html2canvas(receivedClone, options) {
      assert.equal(receivedClone.imageSrc, clone.imageSrc);
      html2canvasOptions = options;
      return { toDataURL() { return "data:image/png;base64,cGRm"; } };
    },
    jspdf: {
      jsPDF: class {
        addImage() {}
        save() { pdfSaved = true; }
      },
    },
    alert() {},
  });
  vm.runInContext(pdfSource, context, { filename: "pdf.js" });
  await vm.runInContext("saveAsPDF('pdf-area')", context);

  assert.equal(html2canvasOptions.useCORS, true);
  assert.equal(pdfSaved, true);
});
