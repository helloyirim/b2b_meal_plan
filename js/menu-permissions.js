const MENU_PERMISSION_KEYS = [
  "managementGoals",
  "calendar",
  "sales",
  "mealCreate",
  "mealManagement",
  "menuManagement",
];

const MENU_PERMISSION_LABELS = {
  managementGoals: "경영목표",
  calendar: "단체캘린더",
  sales: "상품 매출보고",
  mealCreate: "식단 생성",
  mealManagement: "식단 관리",
  menuManagement: "메뉴 관리",
};

const PAGE_MENU_PERMISSIONS = {
  "page-management-goals": "managementGoals",
  "page-calendar": "calendar",
  "page-sales": "sales",
  "page-product-daily-sales": "sales",
  "page-channel-daily-sales": "sales",
  "page-generate": "mealCreate",
  "page-history": "mealManagement",
  "page-settings": "menuManagement",
};

const NAV_MENU_PERMISSIONS = {
  "nav-management-goals": "managementGoals",
  "nav-calendar": "calendar",
  "nav-sales-all": "sales",
  "nav-sales-product-daily": "sales",
  "nav-sales-channel-daily": "sales",
  "nav-gen": "mealCreate",
  "nav-his": "mealManagement",
  "nav-set": "menuManagement",
};

function getDefaultMenuPermissions(role) {
  if (role === "ADMIN") {
    return Object.fromEntries(MENU_PERMISSION_KEYS.map((key) => [key, "write"]));
  }
  if (role === "USER") {
    return {
      managementGoals: "read",
      calendar: "write",
      sales: "write",
      mealCreate: "write",
      mealManagement: "write",
      menuManagement: "write",
    };
  }
  return {
    managementGoals: "none",
    calendar: "none",
    sales: "read",
    mealCreate: "none",
    mealManagement: "none",
    menuManagement: "none",
  };
}

function normalizeMenuPermissions(role, permissions) {
  const defaults = getDefaultMenuPermissions(role);
  if (role === "ADMIN" || !permissions || typeof permissions !== "object") return defaults;
  return Object.fromEntries(MENU_PERMISSION_KEYS.map((key) => {
    const value = permissions[key];
    const normalized = ["none", "read", "write"].includes(value) ? value : defaults[key];
    return [key, key === "managementGoals" && normalized === "write" ? "read" : normalized];
  }));
}

function getCurrentMenuPermissions() {
  const user = getCurrentUser();
  if (!user) {
    return Object.fromEntries(MENU_PERMISSION_KEYS.map((key) => [key, "none"]));
  }
  return normalizeMenuPermissions(user.role, user.menuPermissions);
}

function getMenuPermission(menuKey) {
  return getCurrentMenuPermissions()[menuKey] || "none";
}

function canReadMenu(menuKey) {
  const value = getMenuPermission(menuKey);
  return value === "read" || value === "write";
}

function canWriteMenu(menuKey) {
  return getMenuPermission(menuKey) === "write";
}

function requireMenuPermission(menuKey, required = "read", showMessage = true) {
  const allowed = required === "write" ? canWriteMenu(menuKey) : canReadMenu(menuKey);
  if (!allowed && showMessage) {
    alert(required === "write" ? "조회 전용 메뉴에서는 변경할 수 없습니다." : "접근 권한이 없습니다.");
  }
  return allowed;
}

function getMenuKeyForPage(pageId) {
  return PAGE_MENU_PERMISSIONS[pageId] || "";
}

function getFirstAccessiblePage() {
  return [
    ["managementGoals", "page-management-goals"],
    ["calendar", "page-calendar"],
    ["sales", "page-sales"],
    ["mealCreate", "page-generate"],
    ["mealManagement", "page-history"],
    ["menuManagement", "page-settings"],
  ].find(([key]) => canReadMenu(key))?.[1] || "";
}

function applyMenuPermissionNavigation() {
  Object.entries(NAV_MENU_PERMISSIONS).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (!element) return;
    const disabled = !canReadMenu(key);
    element.classList.toggle("menu-access-disabled", disabled);
    element.setAttribute("aria-disabled", disabled ? "true" : "false");
    element.title = disabled ? "접근 권한이 없습니다" : "";
    element.tabIndex = disabled ? -1 : 0;
    element.dataset.menuPermissionKey = key;
  });

  document.querySelectorAll(".sales-channel-nav").forEach((element) => {
    const disabled = !canReadMenu("sales");
    element.classList.toggle("menu-access-disabled", disabled);
    element.setAttribute("aria-disabled", disabled ? "true" : "false");
    element.title = disabled ? "접근 권한이 없습니다" : "";
    element.dataset.menuPermissionKey = "sales";
  });
}

function applyPagePermissionState(pageId) {
  const menuKey = getMenuKeyForPage(pageId);
  const page = document.getElementById(pageId);
  if (!menuKey || !page) return;
  page.dataset.menuPermission = getMenuPermission(menuKey);
  page.classList.toggle("menu-read-only", canReadMenu(menuKey) && !canWriteMenu(menuKey));
}

function applyReadOnlyMenuControls() {
  const calendarWritable = canWriteMenu("calendar");
  ["openModalBtn", "deleteBtn", "resetBtn"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.disabled = !calendarWritable;
  });
  document.querySelectorAll("#eventForm input, #eventForm select, #eventForm textarea, #eventForm button")
    .forEach((element) => { element.disabled = !calendarWritable; });

  const planSaveButton = document.querySelector('#page-generate button[onclick="savePlan()"]');
  if (planSaveButton) planSaveButton.disabled = !canWriteMenu("mealCreate");

  const menuWritable = canWriteMenu("menuManagement");
  document.querySelectorAll("#page-settings input, #page-settings select, #page-settings textarea, #page-settings button")
    .forEach((element) => {
      if (element.id === "mgmt-search") return;
      element.disabled = !menuWritable;
    });
}

document.addEventListener("click", (event) => {
  const disabled = event.target.closest(".menu-access-disabled");
  if (!disabled) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  alert("접근 권한이 없습니다.");
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const disabled = event.target.closest(".menu-access-disabled");
  if (!disabled) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  alert("접근 권한이 없습니다.");
}, true);
