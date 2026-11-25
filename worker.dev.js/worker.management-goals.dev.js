const SESSION_TTL_SECONDS = 8 * 60 * 60;
const PASSWORD_HASH_ALGORITHM = "PBKDF2-SHA-256";
const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_MAX_SUPPORTED_ITERATIONS = 100000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 32;
const VALID_USER_ROLES = new Set(["ADMIN", "USER", "VIEWER"]);
const MENU_PERMISSION_LEVELS = new Set(["none", "read", "write"]);
const MENU_PERMISSION_KEYS = [
  "managementGoals",
  "calendar",
  "sales",
  "mealCreate",
  "mealManagement",
  "menuManagement",
];
const MANAGEMENT_GOALS_MAX_BODY_BYTES = 512 * 1024;
const MANAGEMENT_GOALS_SCHEMA_VERSION = 2;
const MENUS_STORAGE_KEY = "menus";
const MENUS_LIGHT_STORAGE_KEY = "menus:light";
const MENUS_DERIVED_DIRTY_KEY = "menus:derived:dirty";
const MENUS_DERIVED_READY_KEY = "menus:derived:ready";
const MENU_IMAGE_KEY_PREFIX = "menu-image:";
const INITIAL_MENU_MIGRATION_ENABLED_VALUE = "true";
const INITIAL_MENU_MIGRATION_SEED_COUNT = 101;
const INITIAL_MENU_MIGRATION_SEED_FINGERPRINT =
  "3bcbcb29637420f82f76c5808e661df90a33d356d8944071e6749f3e306d511b";
const INITIAL_MENU_MIGRATION_EXPECTED_SOURCE_COUNT = 8;
const INITIAL_MENU_MIGRATION_EXPECTED_FINAL_COUNT = 109;
const INITIAL_MENU_MIGRATION_LOCK_KEY = "menus:migration:initial-defaults:lock";
const INITIAL_MENU_MIGRATION_STATE_KEY = "menus:migration:initial-defaults:state";
const INITIAL_MENU_MIGRATION_BACKUP_PREFIX = "menus:migration:initial-defaults:backup:";
const INITIAL_MENU_MIGRATION_LOCK_TTL_SECONDS = 5 * 60;

function createJsonResponse(data, status, corsHeaders, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashSessionToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(digest));
}

function getBearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : "";
}

function hexToBytes(value) {
  if (typeof value !== "string" || value.length % 2 !== 0 || !/^[a-f0-9]+$/i.test(value)) {
    return null;
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqualBytes(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array)) return false;
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] || 0) ^ (right[index] || 0);
  }
  return difference === 0;
}

async function derivePasswordHash(password, salt, iterations = PASSWORD_HASH_ITERATIONS) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    PASSWORD_HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
}

async function createPasswordCredential(password) {
  const salt = new Uint8Array(PASSWORD_SALT_BYTES);
  crypto.getRandomValues(salt);
  const hash = await derivePasswordHash(password, salt);
  return {
    passwordAlgorithm: PASSWORD_HASH_ALGORITHM,
    passwordIterations: PASSWORD_HASH_ITERATIONS,
    passwordSalt: bytesToHex(salt),
    passwordHash: bytesToHex(hash),
  };
}

function hasPasswordCredential(user) {
  return Boolean(
    user
    && user.passwordAlgorithm === PASSWORD_HASH_ALGORITHM
    && Number.isInteger(user.passwordIterations)
    && user.passwordIterations >= 10000
    && user.passwordIterations <= 1000000
    && hexToBytes(user.passwordSalt)
    && hexToBytes(user.passwordHash),
  );
}

async function verifyUserPassword(user, password) {
  if (hasPasswordCredential(user)) {
    if (user.passwordIterations > PASSWORD_HASH_MAX_SUPPORTED_ITERATIONS) {
      const error = new Error("UNSUPPORTED_PASSWORD_HASH_ITERATIONS");
      error.authErrorCode = "UNSUPPORTED_PASSWORD_HASH_ITERATIONS";
      throw error;
    }
    const salt = hexToBytes(user.passwordSalt);
    const expected = hexToBytes(user.passwordHash);
    const actual = await derivePasswordHash(password, salt, user.passwordIterations);
    return { valid: constantTimeEqualBytes(actual, expected), legacy: false };
  }
  return {
    valid: typeof user?.pw === "string" && user.pw === password,
    legacy: typeof user?.pw === "string",
  };
}

function stripSensitiveUserFields(user) {
  if (!user || typeof user !== "object") return null;
  const {
    pw,
    passwordAlgorithm,
    passwordIterations,
    passwordSalt,
    passwordHash,
    ...safeUser
  } = user;
  return {
    ...safeUser,
    menuPermissions: normalizeMenuPermissions(user.role, user.menuPermissions),
  };
}

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
  if (role === "ADMIN" || !permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    return defaults;
  }
  return Object.fromEntries(MENU_PERMISSION_KEYS.map((key) => {
    const value = permissions[key];
    const normalized = MENU_PERMISSION_LEVELS.has(value) ? value : defaults[key];
    const writeRestricted = role === "VIEWER" || key === "managementGoals";
    return [key, writeRestricted && normalized === "write" ? "read" : normalized];
  }));
}

function hasMenuPermission(user, menuKeys, requiredLevel = "read") {
  if (!user || user.active === false) return false;
  if (user.role === "ADMIN") return true;
  const permissions = normalizeMenuPermissions(user.role, user.menuPermissions);
  const keys = Array.isArray(menuKeys) ? menuKeys : [menuKeys];
  return keys.some((key) => {
    const value = permissions[key] || "none";
    return requiredLevel === "write" ? value === "write" : value === "read" || value === "write";
  });
}

async function authorizeMenuRequest(request, env, menuKeys, requiredLevel, corsHeaders) {
  const user = await authenticateSession(request, env);
  if (!user) {
    return {
      user: null,
      response: createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders),
    };
  }
  if (!hasMenuPermission(user, menuKeys, requiredLevel)) {
    return {
      user,
      response: createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders),
    };
  }
  return { user, response: null };
}

function getBusinessPermissionRequirement(path, method) {
  if (path === "/delivery-events" || path === "/delivery-events/item" || path.startsWith("/delivery-events/")) {
    return { menuKeys: "calendar", level: method === "GET" ? "read" : "write" };
  }
  if (path === "/blackgoat-sales") {
    return { menuKeys: "sales", level: method === "GET" ? "read" : "write" };
  }
  if (path === "/sales-products" || path === "/sales-channels") {
    return {
      menuKeys: "sales",
      level: method === "GET" ? "read" : "write",
      adminOnly: method !== "GET",
    };
  }
  if (path === "/sales-products/item" || path === "/sales-channels/item") {
    return { menuKeys: "sales", level: "write", adminOnly: true };
  }
  if (path === "/plans") {
    return {
      menuKeys: method === "GET" ? ["mealCreate", "mealManagement"] : "mealCreate",
      level: method === "GET" ? "read" : "write",
    };
  }
  if (path.startsWith("/plans/")) {
    return { menuKeys: "mealManagement", level: "write" };
  }
  if (path === "/menus/derived/rebuild") {
    return { menuKeys: "menuManagement", level: "write", adminOnly: true };
  }
  if (/^\/menus\/[^/]+\/usage$/.test(path)) {
    return { menuKeys: "menuManagement", level: "read" };
  }
  if (/^\/menus\/[^/]+\/image$/.test(path)) {
    return {
      menuKeys: ["mealCreate", "mealManagement", "menuManagement"],
      level: "read",
    };
  }
  if (path === "/menus" && method === "GET") {
    return {
      menuKeys: ["mealCreate", "mealManagement", "menuManagement"],
      level: "read",
    };
  }
  if (path === "/menus" || path === "/menus/item" || /^\/menus\/[^/]+$/.test(path)) {
    return { menuKeys: "menuManagement", level: "write" };
  }
  return null;
}

function isAdminUser(user) {
  return Boolean(user && user.role === "ADMIN" && user.active !== false);
}

function countActiveAdmins(users) {
  return users.filter(isAdminUser).length;
}

async function readUsers(env) {
  const usersText = await env.B2B_MEAL_DATA.get("users");
  if (!usersText) return [];
  const users = JSON.parse(usersText);
  return Array.isArray(users) ? users : [];
}

async function upgradeLegacyPassword(env, userId, password) {
  const users = await readUsers(env);
  const index = users.findIndex((item) => String(item.id) === String(userId));
  if (index < 0 || users[index].pw !== password) return false;
  const credential = await createPasswordCredential(password);
  const updated = { ...users[index], ...credential, passwordMigratedAt: new Date().toISOString() };
  delete updated.pw;
  users[index] = updated;
  await env.B2B_MEAL_DATA.put("users", JSON.stringify(users));
  return true;
}

function createUserApiError(message, status = 400) {
  const error = new Error(message);
  error.userApiError = true;
  error.status = status;
  return error;
}

async function upsertUser(env, input) {
  const users = await readUsers(env);
  const id = String(input?.id || "").trim();
  const name = String(input?.name || "").trim();
  const role = String(input?.role || "USER").toUpperCase();
  if (!id || !name) throw createUserApiError("ID_AND_NAME_REQUIRED");
  if (!VALID_USER_ROLES.has(role)) throw createUserApiError("INVALID_ROLE");

  const index = users.findIndex((item) => String(item.id) === id);
  const existing = index >= 0 ? users[index] : null;
  const active = input.active === undefined ? existing?.active !== false : input.active !== false;
  if (!existing && !String(input.pw || "")) {
    throw createUserApiError("PASSWORD_REQUIRED");
  }
  if (isAdminUser(existing) && (role !== "ADMIN" || !active) && countActiveAdmins(users) <= 1) {
    throw createUserApiError("LAST_ACTIVE_ADMIN_REQUIRED", 409);
  }

  const now = new Date().toISOString();
  const updated = {
    ...(existing || {}),
    id,
    name,
    role,
    active,
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now,
  };
  if (role === "ADMIN") {
    updated.menuPermissions = getDefaultMenuPermissions("ADMIN");
  } else if (Object.prototype.hasOwnProperty.call(input, "menuPermissions")) {
    updated.menuPermissions = normalizeMenuPermissions(role, input.menuPermissions);
  } else if (!existing || existing.role !== role) {
    updated.menuPermissions = getDefaultMenuPermissions(role);
  } else if (existing.menuPermissions) {
    updated.menuPermissions = normalizeMenuPermissions(role, existing.menuPermissions);
  }
  if (String(input.pw || "")) {
    Object.assign(updated, await createPasswordCredential(String(input.pw)));
    delete updated.pw;
  }
  if (!hasPasswordCredential(updated) && typeof updated.pw !== "string") {
    throw createUserApiError("PASSWORD_REQUIRED");
  }

  if (index >= 0) users[index] = updated;
  else users.push(updated);
  await env.B2B_MEAL_DATA.put("users", JSON.stringify(users));
  return stripSensitiveUserFields(updated);
}

async function createSession(env, userId) {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = bytesToHex(tokenBytes);
  const tokenHash = await hashSessionToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_SECONDS * 1000);

  await env.B2B_MEAL_DATA.put(
    `auth:sessions:${tokenHash}`,
    JSON.stringify({
      userId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }),
    { expirationTtl: SESSION_TTL_SECONDS },
  );

  return { token, expiresAt: expiresAt.toISOString() };
}

function isManagementGoalsAdmin(user) {
  return isAdminUser(user);
}

async function authenticateSession(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const tokenHash = await hashSessionToken(token);
  const sessionKey = `auth:sessions:${tokenHash}`;
  const sessionText = await env.B2B_MEAL_DATA.get(sessionKey);
  if (!sessionText) return null;

  let session;
  try {
    session = JSON.parse(sessionText);
  } catch {
    await env.B2B_MEAL_DATA.delete(sessionKey);
    return null;
  }

  const expiresAt = Date.parse(session.expiresAt);
  if (!session.userId || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await env.B2B_MEAL_DATA.delete(sessionKey);
    return null;
  }

  const usersText = await env.B2B_MEAL_DATA.get("users");
  let users;
  try {
    users = usersText ? JSON.parse(usersText) : [];
  } catch {
    return null;
  }

  if (!Array.isArray(users)) return null;
  const user = users.find((item) => item.id === session.userId && item.active !== false);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    active: user.active !== false,
    menuPermissions: normalizeMenuPermissions(user.role, user.menuPermissions),
  };
}

function canManageMenus(user) {
  return Boolean(user && (user.role === "USER" || user.role === "ADMIN"));
}

async function createMenuFingerprint(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return bytesToHex(new Uint8Array(digest));
}

function isInitialMenuMigrationEnabled(env) {
  return env.INITIAL_MENU_MIGRATION_ENABLED === INITIAL_MENU_MIGRATION_ENABLED_VALUE;
}

function createInitialMenuMigrationError(code, status = 400, details = {}) {
  const error = new Error(code);
  error.initialMenuMigrationError = true;
  error.status = status;
  error.details = details;
  return error;
}

async function getActiveInitialMenuMigrationLock(env) {
  const raw = await env.B2B_MEAL_DATA.get(INITIAL_MENU_MIGRATION_LOCK_KEY);
  if (!raw) return null;
  try {
    const lock = JSON.parse(raw);
    if (lock?.owner && Number.isFinite(Date.parse(lock.expiresAt))
      && Date.parse(lock.expiresAt) > Date.now()) {
      return lock;
    }
  } catch {
    // 손상되거나 만료된 잠금은 아래에서 제거한다.
  }
  await env.B2B_MEAL_DATA.delete(INITIAL_MENU_MIGRATION_LOCK_KEY);
  return null;
}

async function acquireInitialMenuMigrationLock(env, userId) {
  if (await getActiveInitialMenuMigrationLock(env)) {
    throw createInitialMenuMigrationError("MENU_MIGRATION_LOCKED", 423);
  }

  const ownerBytes = new Uint8Array(16);
  crypto.getRandomValues(ownerBytes);
  const owner = bytesToHex(ownerBytes);
  const startedAt = new Date();
  const lock = {
    owner,
    userId,
    startedAt: startedAt.toISOString(),
    expiresAt: new Date(startedAt.getTime()
      + INITIAL_MENU_MIGRATION_LOCK_TTL_SECONDS * 1000).toISOString(),
  };
  await env.B2B_MEAL_DATA.put(
    INITIAL_MENU_MIGRATION_LOCK_KEY,
    JSON.stringify(lock),
    { expirationTtl: INITIAL_MENU_MIGRATION_LOCK_TTL_SECONDS },
  );

  const confirmed = await getActiveInitialMenuMigrationLock(env);
  if (!confirmed || confirmed.owner !== owner) {
    throw createInitialMenuMigrationError("MENU_MIGRATION_LOCK_CONFLICT", 409);
  }
  return lock;
}

async function releaseInitialMenuMigrationLock(env, owner) {
  const current = await getActiveInitialMenuMigrationLock(env);
  if (current?.owner === owner) {
    await env.B2B_MEAL_DATA.delete(INITIAL_MENU_MIGRATION_LOCK_KEY);
  }
}

async function rejectLockedMenuMutation(env, corsHeaders) {
  const lock = await getActiveInitialMenuMigrationLock(env);
  if (!lock) return null;
  return createJsonResponse(
    { success: false, message: "MENU_MIGRATION_IN_PROGRESS" },
    423,
    corsHeaders,
    { "Cache-Control": "no-store" },
  );
}

function countMenuUsageInPlan(plan, menuId) {
  if (!plan || typeof plan !== "object" || !plan.data || typeof plan.data !== "object") return 0;
  return Object.values(plan.data).reduce((count, item) => {
    const referencedId = item && (item.menuId ?? item.id);
    return count + (String(referencedId) === String(menuId) ? 1 : 0);
  }, 0);
}

async function readAllPlansForMenuUsage(env) {
  const plansById = new Map();
  const indexRaw = await env.B2B_MEAL_DATA.get("plans:index");
  let ids = [];
  try {
    ids = indexRaw ? JSON.parse(indexRaw) : [];
    if (!Array.isArray(ids)) ids = [];
  } catch { ids = []; }

  const indexedPlans = await Promise.all(ids.map(async (id) => {
    const text = await env.B2B_MEAL_DATA.get(`plans:${id}`);
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }));
  indexedPlans.filter(Boolean).forEach((plan) => plansById.set(String(plan.id), plan));

  const legacyRaw = await env.B2B_MEAL_DATA.get("plans");
  if (legacyRaw) {
    try {
      const legacyPlans = JSON.parse(legacyRaw);
      if (Array.isArray(legacyPlans)) {
        legacyPlans.forEach((plan) => {
          if (plan && !plansById.has(String(plan.id))) plansById.set(String(plan.id), plan);
        });
      }
    } catch {
      // 기존 /plans 호환 동작과 같이 손상된 레거시 배열은 무시한다.
    }
  }
  return [...plansById.values()];
}

async function getMenuUsageSummary(env, menuId) {
  const plans = await readAllPlansForMenuUsage(env);
  const usedPlans = plans.map((plan) => ({
    id: String(plan.id),
    name: String(plan.name || ""),
    usageCount: countMenuUsageInPlan(plan, menuId),
  })).filter((plan) => plan.usageCount > 0);
  return {
    inUse: usedPlans.length > 0,
    planCount: usedPlans.length,
    usageCount: usedPlans.reduce((sum, plan) => sum + plan.usageCount, 0),
    plans: usedPlans,
  };
}

async function createPlansMigrationSnapshot(env) {
  const plans = await readAllPlansForMenuUsage(env);
  const sortedPlans = [...plans].sort((left, right) =>
    String(left?.id ?? "").localeCompare(String(right?.id ?? ""))
  );
  return {
    count: sortedPlans.length,
    fingerprint: await createMenuFingerprint(sortedPlans),
  };
}

function parseOptionalJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function validateInitialMenuSeedItem(item) {
  if (!isPlainObject(item)) return false;
  const id = String(item.id ?? "");
  if (!id || id.length > 100) return false;
  if (!validateString(item.name, { maxLength: 200 })) return false;
  if (!validateString(item.brand, { maxLength: 100 })) return false;
  if (typeof item.price !== "number" || !Number.isFinite(item.price) || item.price < 0) return false;
  if (!validateOptionalString(item.allergy, 5000)) return false;
  if (!validateOptionalString(item.memo, 5000)) return false;
  if (!validateOptionalString(item.img, 10)) return false;
  if (!validateOptionalString(item.image, 10)) return false;
  return !getMenuImageSource(item);
}

async function validateInitialMenuSeed(seedMenus) {
  if (!Array.isArray(seedMenus) || seedMenus.length !== INITIAL_MENU_MIGRATION_SEED_COUNT) {
    throw createInitialMenuMigrationError("INVALID_INITIAL_MENU_SEED", 400);
  }
  const ids = new Set();
  for (const item of seedMenus) {
    const id = String(item?.id ?? "");
    if (!validateInitialMenuSeedItem(item) || ids.has(id)) {
      throw createInitialMenuMigrationError("INVALID_INITIAL_MENU_SEED", 400);
    }
    ids.add(id);
  }
  const fingerprint = await createMenuFingerprint(seedMenus);
  if (fingerprint !== INITIAL_MENU_MIGRATION_SEED_FINGERPRINT) {
    throw createInitialMenuMigrationError("INITIAL_MENU_SEED_FINGERPRINT_MISMATCH", 400, {
      seedFingerprint: fingerprint,
    });
  }
  return fingerprint;
}

function assertUniqueMenuIds(list) {
  const ids = new Set();
  for (const item of list) {
    const id = String(item?.id ?? "");
    if (!id || ids.has(id)) {
      throw createInitialMenuMigrationError("INVALID_OR_DUPLICATE_EXISTING_MENU_ID", 409);
    }
    ids.add(id);
  }
  return ids;
}

async function verifyExistingMenuImageDerivedKeys(env, list) {
  let imageCount = 0;
  for (const menu of list) {
    const source = getMenuImageSource(menu);
    if (!isMenuImageDataUrl(source)) continue;
    imageCount += 1;
    const derived = await env.B2B_MEAL_DATA.get(getMenuImageStorageKey(menu.id));
    if (derived !== source) {
      throw createInitialMenuMigrationError("MENU_IMAGE_DERIVED_DATA_MISMATCH", 409, {
        menuId: String(menu.id),
      });
    }
  }
  return imageCount;
}

async function writeInitialMenuMigrationDerivedData(env, list, imageCount) {
  await writeMenusLightDerivedKey(env, list);
  await env.B2B_MEAL_DATA.put(
    MENUS_DERIVED_READY_KEY,
    JSON.stringify({ completedAt: new Date().toISOString(), menuCount: list.length, imageCount }),
  );
  await env.B2B_MEAL_DATA.delete(MENUS_DERIVED_DIRTY_KEY);
}

async function readInitialMenuMigrationStatus(env) {
  const menusText = await env.B2B_MEAL_DATA.get(MENUS_STORAGE_KEY) || "[]";
  const list = parseMenusText(menusText);
  const plans = await createPlansMigrationSnapshot(env);
  const [lightText, readyText, dirtyText, stateText] = await Promise.all([
    env.B2B_MEAL_DATA.get(MENUS_LIGHT_STORAGE_KEY),
    env.B2B_MEAL_DATA.get(MENUS_DERIVED_READY_KEY),
    env.B2B_MEAL_DATA.get(MENUS_DERIVED_DIRTY_KEY),
    env.B2B_MEAL_DATA.get(INITIAL_MENU_MIGRATION_STATE_KEY),
  ]);
  return {
    menusText,
    list,
    menuCount: list.length,
    collectionFingerprint: await createMenuFingerprint(list),
    plans,
    lightText,
    readyText,
    dirtyText,
    stateText,
  };
}

async function saveInitialMenuMigrationBackup(env, status, userId) {
  const idBytes = new Uint8Array(8);
  crypto.getRandomValues(idBytes);
  const backupId = `${Date.now()}-${bytesToHex(idBytes)}`;
  const backupKey = `${INITIAL_MENU_MIGRATION_BACKUP_PREFIX}${backupId}`;
  await env.B2B_MEAL_DATA.put(backupKey, JSON.stringify({
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    collectionFingerprint: status.collectionFingerprint,
    plansFingerprint: status.plans.fingerprint,
    plansCount: status.plans.count,
    menusText: status.menusText,
    lightText: status.lightText,
    readyText: status.readyText,
    dirtyText: status.dirtyText,
  }));
  return { backupId, backupKey };
}

async function restoreOptionalMigrationKey(env, key, value) {
  if (typeof value === "string") await env.B2B_MEAL_DATA.put(key, value);
  else await env.B2B_MEAL_DATA.delete(key);
}

async function handleInitialMenuMigration(request, env, path, corsHeaders) {
  if (!isInitialMenuMigrationEnabled(env)) {
    return createJsonResponse({ success: false, message: "NOT_FOUND" }, 404, corsHeaders);
  }

  const user = await authenticateSession(request, env);
  if (!user) return createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders);
  if (!isManagementGoalsAdmin(user)) {
    return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
  }

  if (path.endsWith("/status")) {
    if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    const status = await readInitialMenuMigrationStatus(env);
    return createJsonResponse({
      success: true,
      menuCount: status.menuCount,
      collectionFingerprint: status.collectionFingerprint,
      planCount: status.plans.count,
      plansFingerprint: status.plans.fingerprint,
      derived: {
        lightPresent: typeof status.lightText === "string",
        ready: parseOptionalJson(status.readyText),
        dirty: parseOptionalJson(status.dirtyText),
      },
      migration: parseOptionalJson(status.stateText),
    }, 200, corsHeaders, { "Cache-Control": "no-store" });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const parsedBody = await readLimitedJson(request);
  if (parsedBody.error) {
    return createJsonResponse({ success: false, message: parsedBody.error }, parsedBody.status, corsHeaders);
  }
  const body = parsedBody.value;
  let lock;
  try {
    lock = await acquireInitialMenuMigrationLock(env, user.id);

    if (path.endsWith("/recover")) {
      if (!isPlainObject(body)
        || !validateString(body.backupId, { maxLength: 200 })
        || !validateString(body.expectedCollectionFingerprint, { maxLength: 64 })
        || !validateString(body.expectedPlansFingerprint, { maxLength: 64 })) {
        throw createInitialMenuMigrationError("INVALID_RECOVERY_REQUEST", 400);
      }
      if (!/^[0-9]+-[0-9a-f]{16}$/.test(body.backupId)) {
        throw createInitialMenuMigrationError("INVALID_BACKUP_ID", 400);
      }
      const status = await readInitialMenuMigrationStatus(env);
      if (status.collectionFingerprint !== body.expectedCollectionFingerprint) {
        throw createInitialMenuMigrationError("MENUS_CHANGED", 409, {
          collectionFingerprint: status.collectionFingerprint,
        });
      }
      if (status.plans.fingerprint !== body.expectedPlansFingerprint) {
        throw createInitialMenuMigrationError("PLANS_CHANGED", 409);
      }
      const backupKey = `${INITIAL_MENU_MIGRATION_BACKUP_PREFIX}${body.backupId}`;
      const backupText = await env.B2B_MEAL_DATA.get(backupKey);
      if (!backupText) throw createInitialMenuMigrationError("MIGRATION_BACKUP_NOT_FOUND", 404);
      let backup;
      try { backup = JSON.parse(backupText); }
      catch { throw createInitialMenuMigrationError("MIGRATION_BACKUP_INVALID", 500); }
      if (backup.plansFingerprint !== status.plans.fingerprint) {
        throw createInitialMenuMigrationError("PLANS_CHANGED_SINCE_BACKUP", 409);
      }

      await env.B2B_MEAL_DATA.put(
        MENUS_DERIVED_DIRTY_KEY,
        JSON.stringify({ startedAt: new Date().toISOString(), reason: "initial-menu-migration-recover" }),
      );
      await env.B2B_MEAL_DATA.put(MENUS_STORAGE_KEY, backup.menusText);
      await restoreOptionalMigrationKey(env, MENUS_LIGHT_STORAGE_KEY, backup.lightText);
      await restoreOptionalMigrationKey(env, MENUS_DERIVED_READY_KEY, backup.readyText);
      await restoreOptionalMigrationKey(env, MENUS_DERIVED_DIRTY_KEY, backup.dirtyText);
      await env.B2B_MEAL_DATA.put(INITIAL_MENU_MIGRATION_STATE_KEY, JSON.stringify({
        status: "recovered",
        recoveredAt: new Date().toISOString(),
        recoveredBy: user.id,
        backupId: body.backupId,
        collectionFingerprint: backup.collectionFingerprint,
      }));
      return createJsonResponse({
        success: true,
        recovered: true,
        backupId: body.backupId,
        menuCount: parseMenusText(backup.menusText).length,
        collectionFingerprint: backup.collectionFingerprint,
      }, 200, corsHeaders, { "Cache-Control": "no-store" });
    }

    if (!path.endsWith("/apply")) {
      return createJsonResponse({ success: false, message: "NOT_FOUND" }, 404, corsHeaders);
    }
    if (!isPlainObject(body)
      || !validateString(body.expectedCollectionFingerprint, { maxLength: 64 })
      || !validateString(body.expectedPlansFingerprint, { maxLength: 64 })
      || body.expectedMenuCount !== INITIAL_MENU_MIGRATION_EXPECTED_SOURCE_COUNT
      || body.expectedPlanCount !== 6) {
      throw createInitialMenuMigrationError("INVALID_MIGRATION_REQUEST", 400);
    }
    await validateInitialMenuSeed(body.seedMenus);

    const status = await readInitialMenuMigrationStatus(env);
    const existingIds = assertUniqueMenuIds(status.list);
    const missingMenus = body.seedMenus.filter((item) => !existingIds.has(String(item.id)));

    if (status.plans.count !== body.expectedPlanCount
      || status.plans.fingerprint !== body.expectedPlansFingerprint) {
      throw createInitialMenuMigrationError("PLANS_CHANGED", 409, {
        planCount: status.plans.count,
        plansFingerprint: status.plans.fingerprint,
      });
    }

    if (missingMenus.length === 0) {
      const imageCount = await verifyExistingMenuImageDerivedKeys(env, status.list);
      const requiresDerivedRepair = Boolean(status.dirtyText || !status.lightText || !status.readyText);
      if (requiresDerivedRepair) {
        await writeInitialMenuMigrationDerivedData(env, status.list, imageCount);
      }
      return createJsonResponse({
        success: true,
        addedCount: 0,
        menuCount: status.menuCount,
        collectionFingerprint: status.collectionFingerprint,
        derivedRepaired: requiresDerivedRepair,
        idempotent: true,
      }, 200, corsHeaders, { "Cache-Control": "no-store" });
    }

    if (status.menuCount !== INITIAL_MENU_MIGRATION_EXPECTED_SOURCE_COUNT
      || missingMenus.length !== INITIAL_MENU_MIGRATION_SEED_COUNT
      || status.collectionFingerprint !== body.expectedCollectionFingerprint) {
      throw createInitialMenuMigrationError("MENUS_CHANGED", 409, {
        menuCount: status.menuCount,
        missingCount: missingMenus.length,
        collectionFingerprint: status.collectionFingerprint,
      });
    }
    if (status.dirtyText || !status.lightText || !status.readyText) {
      throw createInitialMenuMigrationError("MENU_DERIVED_DATA_NOT_READY", 409);
    }
    const imageCount = await verifyExistingMenuImageDerivedKeys(env, status.list);
    const latestMenusText = await env.B2B_MEAL_DATA.get(MENUS_STORAGE_KEY) || "[]";
    if (await createMenuFingerprint(parseMenusText(latestMenusText)) !== status.collectionFingerprint) {
      throw createInitialMenuMigrationError("MENUS_CHANGED", 409);
    }

    const { backupId } = await saveInitialMenuMigrationBackup(env, status, user.id);
    const updatedList = [...status.list, ...missingMenus];
    if (updatedList.length !== INITIAL_MENU_MIGRATION_EXPECTED_FINAL_COUNT) {
      throw createInitialMenuMigrationError("UNEXPECTED_FINAL_MENU_COUNT", 409);
    }
    const updatedFingerprint = await createMenuFingerprint(updatedList);
    await env.B2B_MEAL_DATA.put(INITIAL_MENU_MIGRATION_STATE_KEY, JSON.stringify({
      status: "prepared",
      startedAt: new Date().toISOString(),
      startedBy: user.id,
      backupId,
      sourceFingerprint: status.collectionFingerprint,
      targetFingerprint: updatedFingerprint,
    }));
    await env.B2B_MEAL_DATA.put(
      MENUS_DERIVED_DIRTY_KEY,
      JSON.stringify({ startedAt: new Date().toISOString(), reason: "initial-menu-migration", backupId }),
    );
    await env.B2B_MEAL_DATA.put(MENUS_STORAGE_KEY, JSON.stringify(updatedList));

    try {
      await writeInitialMenuMigrationDerivedData(env, updatedList, imageCount);
    } catch (error) {
      await env.B2B_MEAL_DATA.put(INITIAL_MENU_MIGRATION_STATE_KEY, JSON.stringify({
        status: "derived-failed",
        failedAt: new Date().toISOString(),
        backupId,
        collectionFingerprint: updatedFingerprint,
      }));
      throw createInitialMenuMigrationError("MIGRATION_DERIVED_SYNC_FAILED", 500, {
        backupId,
        collectionFingerprint: updatedFingerprint,
      });
    }

    const plansAfter = await createPlansMigrationSnapshot(env);
    const plansUnchanged = plansAfter.count === status.plans.count
      && plansAfter.fingerprint === status.plans.fingerprint;
    await env.B2B_MEAL_DATA.put(INITIAL_MENU_MIGRATION_STATE_KEY, JSON.stringify({
      status: "completed",
      completedAt: new Date().toISOString(),
      completedBy: user.id,
      backupId,
      addedCount: missingMenus.length,
      menuCount: updatedList.length,
      collectionFingerprint: updatedFingerprint,
      plansUnchanged,
    }));
    return createJsonResponse({
      success: true,
      addedCount: missingMenus.length,
      menuCount: updatedList.length,
      collectionFingerprint: updatedFingerprint,
      backupId,
      plansUnchanged,
    }, 200, corsHeaders, { "Cache-Control": "no-store" });
  } catch (error) {
    if (error?.initialMenuMigrationError) {
      return createJsonResponse({
        success: false,
        message: error.message,
        ...error.details,
      }, error.status, corsHeaders, { "Cache-Control": "no-store" });
    }
    return createJsonResponse(
      { success: false, message: "INITIAL_MENU_MIGRATION_FAILED" },
      500,
      corsHeaders,
      { "Cache-Control": "no-store" },
    );
  } finally {
    if (lock) await releaseInitialMenuMigrationLock(env, lock.owner);
  }
}

async function writeMenuDeletionDerivedData(env, list, menuId) {
  await writeMenusLightDerivedKey(env, list);
  await env.B2B_MEAL_DATA.delete(getMenuImageStorageKey(menuId));
  const imageCount = list.filter((menu) =>
    isMenuImageDataUrl(getMenuImageSource(menu))
  ).length;
  await env.B2B_MEAL_DATA.put(
    MENUS_DERIVED_READY_KEY,
    JSON.stringify({ completedAt: new Date().toISOString(), menuCount: list.length, imageCount }),
  );
  await env.B2B_MEAL_DATA.delete(MENUS_DERIVED_DIRTY_KEY);
}

async function readLimitedJson(request) {
  const bodyBuffer = await request.arrayBuffer();
  if (bodyBuffer.byteLength > MANAGEMENT_GOALS_MAX_BODY_BYTES) {
    return { error: "PAYLOAD_TOO_LARGE", status: 413 };
  }

  try {
    return { value: JSON.parse(new TextDecoder().decode(bodyBuffer)) };
  } catch {
    return { error: "INVALID_JSON", status: 400 };
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateString(value, { required = true, maxLength }) {
  if (typeof value !== "string") return false;
  if (required && !value.trim()) return false;
  return value.length <= maxLength;
}

function getMenuImageSource(menu) {
  if (!menu || typeof menu !== "object") return "";
  if (typeof menu.img === "string" && menu.img.trim()) return menu.img;
  if (typeof menu.image === "string" && menu.image.trim()) return menu.image;
  return "";
}

function isMenuImageDataUrl(value) {
  return typeof value === "string" && /^data:image\//i.test(value);
}

function getMenuImageStorageKey(menuId) {
  return `${MENU_IMAGE_KEY_PREFIX}${String(menuId)}`;
}

function createLightweightMenuRecord(menu) {
  if (!menu || typeof menu !== "object") return menu;

  const { img, image, ...metadata } = menu;
  const source = getMenuImageSource(menu);

  if (!source) return { ...metadata, img: "" };
  if (!isMenuImageDataUrl(source)) return { ...metadata, img: source };

  return {
    ...metadata,
    img: "",
    menuImageStored: true,
    menuImageVersion: menu.imageUpdatedAt || `legacy-${source.length}`,
  };
}

function materializeLightweightMenu(record, requestUrl) {
  if (!record || typeof record !== "object") return record;

  const {
    menuImageStored,
    menuImageVersion,
    ...menu
  } = record;

  if (!menuImageStored) return menu;

  const imageUrl = new URL(
    `/menus/${encodeURIComponent(String(menu.id))}/image`,
    requestUrl.origin,
  );
  imageUrl.searchParams.set("v", menuImageVersion || "legacy");

  return { ...menu, img: imageUrl.toString() };
}

function createLightweightMenu(menu, requestUrl) {
  return materializeLightweightMenu(createLightweightMenuRecord(menu), requestUrl);
}

function parseMenusText(text) {
  if (!text) return [];
  const list = JSON.parse(text);
  return Array.isArray(list) ? list : [];
}

function parseMenusDerivedText(text) {
  const list = JSON.parse(text);
  if (!Array.isArray(list)) throw new Error("MENU_LIGHT_DATA_INVALID");
  return list;
}

function createMenuDerivedDataError(code, status = 503) {
  const error = new Error(code);
  error.menuDerivedDataError = true;
  error.status = status;
  return error;
}

async function writeMenuImageDerivedKey(env, menu) {
  const source = getMenuImageSource(menu);
  if (!isMenuImageDataUrl(source)) return false;
  await env.B2B_MEAL_DATA.put(getMenuImageStorageKey(menu.id), source);
  return true;
}

async function writeMenusLightDerivedKey(env, list) {
  const lightweightRecords = list.map(createLightweightMenuRecord);
  await env.B2B_MEAL_DATA.put(
    MENUS_LIGHT_STORAGE_KEY,
    JSON.stringify(lightweightRecords),
  );
}

async function writeAllMenuDerivedKeys(env, list) {
  let imageCount = 0;
  const imageMenus = list.filter((menu) => isMenuImageDataUrl(getMenuImageSource(menu)));
  for (let offset = 0; offset < imageMenus.length; offset += 20) {
    const batch = imageMenus.slice(offset, offset + 20);
    const results = await Promise.all(
      batch.map((menu) => writeMenuImageDerivedKey(env, menu)),
    );
    imageCount += results.filter(Boolean).length;
  }

  await writeMenusLightDerivedKey(env, list);
  return imageCount;
}

async function rebuildMenuDerivedData(env) {
  await env.B2B_MEAL_DATA.put(
    MENUS_DERIVED_DIRTY_KEY,
    JSON.stringify({ startedAt: new Date().toISOString(), reason: "rebuild" }),
  );

  const sourceText = await env.B2B_MEAL_DATA.get(MENUS_STORAGE_KEY);
  const list = parseMenusText(sourceText);

  const imageCount = await writeAllMenuDerivedKeys(env, list);
  await env.B2B_MEAL_DATA.put(
    MENUS_DERIVED_READY_KEY,
    JSON.stringify({ completedAt: new Date().toISOString(), menuCount: list.length, imageCount }),
  );
  await env.B2B_MEAL_DATA.delete(MENUS_DERIVED_DIRTY_KEY);

  return { menuCount: list.length, imageCount };
}

async function readLightweightMenus(env, requestUrl) {
  const dirty = await env.B2B_MEAL_DATA.get(MENUS_DERIVED_DIRTY_KEY);
  if (dirty) {
    throw createMenuDerivedDataError("MENU_DERIVED_DATA_DIRTY");
  }

  const ready = await env.B2B_MEAL_DATA.get(MENUS_DERIVED_READY_KEY);
  if (!ready) {
    throw createMenuDerivedDataError("MENU_DERIVED_DATA_NOT_READY");
  }

  const lightweightText = await env.B2B_MEAL_DATA.get(MENUS_LIGHT_STORAGE_KEY);
  if (!lightweightText) {
    throw createMenuDerivedDataError("MENU_LIGHT_DATA_MISSING");
  }

  try {
    return parseMenusDerivedText(lightweightText).map((record) =>
      materializeLightweightMenu(record, requestUrl)
    );
  } catch {
    throw createMenuDerivedDataError("MENU_LIGHT_DATA_INVALID");
  }
}

async function readMenuImageSource(env, menuId) {
  const dirty = await env.B2B_MEAL_DATA.get(MENUS_DERIVED_DIRTY_KEY);
  if (dirty) {
    throw createMenuDerivedDataError("MENU_DERIVED_DATA_DIRTY");
  }

  const ready = await env.B2B_MEAL_DATA.get(MENUS_DERIVED_READY_KEY);
  if (!ready) {
    throw createMenuDerivedDataError("MENU_DERIVED_DATA_NOT_READY");
  }

  const derivedSource = await env.B2B_MEAL_DATA.get(getMenuImageStorageKey(menuId));
  if (derivedSource) return derivedSource;

  const lightweightText = await env.B2B_MEAL_DATA.get(MENUS_LIGHT_STORAGE_KEY);
  if (!lightweightText) {
    throw createMenuDerivedDataError("MENU_LIGHT_DATA_MISSING");
  }

  let records;
  try {
    records = parseMenusDerivedText(lightweightText);
  } catch {
    throw createMenuDerivedDataError("MENU_LIGHT_DATA_INVALID");
  }

  const record = records.find((item) => String(item?.id) === String(menuId));
  if (!record || !record.menuImageStored) {
    throw createMenuDerivedDataError("MENU_IMAGE_NOT_FOUND", 404);
  }

  throw createMenuDerivedDataError("MENU_IMAGE_DATA_MISSING");
}

function decodeMenuImageDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/i);
  if (!match) return null;

  const contentType = match[1].toLowerCase();
  if (!contentType.startsWith("image/")) return null;

  try {
    if (match[2]) {
      const binary = atob(match[3].replace(/\s/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
      }
      return { contentType, bytes };
    }

    return {
      contentType,
      bytes: new TextEncoder().encode(decodeURIComponent(match[3])),
    };
  } catch {
    return null;
  }
}

function validateOptionalString(value, maxLength) {
  return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

function validateSortOrder(value) {
  return Number.isInteger(value) && Number.isSafeInteger(value);
}

function validateUniqueIds(items) {
  const ids = new Set();
  for (const item of items) {
    if (!isPlainObject(item)
      || !validateString(item.id, { maxLength: 100 })
      || ids.has(item.id)) {
      return false;
    }
    ids.add(item.id);
  }
  return true;
}

function validateTarget(target) {
  return isPlainObject(target)
    && typeof target.value === "number"
    && Number.isFinite(target.value)
    && target.value >= 0
    && validateString(target.unit, { maxLength: 30 });
}

function normalizeManagementGoalStrategies(input, targetAreaIds = null) {
  const strategies = [];
  for (const strategy of input.strategies) {
    if (!isPlainObject(strategy)
      || !validateString(strategy.title, { maxLength: 1000 })
      || !validateSortOrder(strategy.sortOrder)
      || (targetAreaIds !== null
        && (!validateString(strategy.targetAreaId, { maxLength: 100 })
          || !targetAreaIds.has(strategy.targetAreaId)))
      || !Array.isArray(strategy.tasks)
      || strategy.tasks.length > 100
      || !validateUniqueIds(strategy.tasks)) {
      return null;
    }

    const tasks = [];
    for (const task of strategy.tasks) {
      if (!isPlainObject(task)
        || !validateString(task.title, { maxLength: 2000 })
        || !validateSortOrder(task.sortOrder)
        || !validateOptionalString(task.kpi, 5000)
        || !validateOptionalString(task.dueDateLabel, 500)
        || !Array.isArray(task.details)
        || task.details.length > 200
        || !validateUniqueIds(task.details)) {
        return null;
      }

      const details = [];
      for (const detail of task.details) {
        if (!isPlainObject(detail)
          || !validateOptionalString(detail.title, 2000)
          || !validateString(detail.content, { maxLength: 20000 })
          || !validateSortOrder(detail.sortOrder)
          || !validateOptionalString(detail.kpi, 5000)
          || !validateOptionalString(detail.dueDateLabel, 500)) {
          return null;
        }

        const normalizedDetail = {
          id: detail.id,
          content: detail.content,
          sortOrder: detail.sortOrder,
        };
        if (detail.title !== undefined) normalizedDetail.title = detail.title;
        if (detail.kpi !== undefined) normalizedDetail.kpi = detail.kpi;
        if (detail.dueDateLabel !== undefined) normalizedDetail.dueDateLabel = detail.dueDateLabel;
        details.push(normalizedDetail);
      }

      const normalizedTask = {
        id: task.id,
        title: task.title,
        sortOrder: task.sortOrder,
        details,
      };
      if (task.kpi !== undefined) normalizedTask.kpi = task.kpi;
      if (task.dueDateLabel !== undefined) normalizedTask.dueDateLabel = task.dueDateLabel;
      tasks.push(normalizedTask);
    }

    const normalizedStrategy = {
      id: strategy.id,
      title: strategy.title,
      sortOrder: strategy.sortOrder,
      tasks,
    };
    if (targetAreaIds !== null) normalizedStrategy.targetAreaId = strategy.targetAreaId;
    strategies.push(normalizedStrategy);
  }

  return strategies;
}

function normalizeManagementGoalInput(input) {
  if (!isPlainObject(input)) return null;
  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100) return null;
  if (!validateString(input.coreMessage, { maxLength: 5000 })) return null;
  if (!Array.isArray(input.strategies) || input.strategies.length > 50) return null;
  if (!validateUniqueIds(input.strategies)) return null;

  if (Array.isArray(input.targetAreas)) {
    if (!input.targetAreas.length
      || input.targetAreas.length > 20
      || !validateUniqueIds(input.targetAreas)) {
      return null;
    }
    const targetAreas = [];
    for (const area of input.targetAreas) {
      if (!isPlainObject(area)
        || !validateString(area.name, { maxLength: 200 })
        || typeof area.value !== "number"
        || !Number.isFinite(area.value)
        || area.value < 0
        || !validateString(area.unit, { maxLength: 30 })
        || !validateSortOrder(area.sortOrder)) {
        return null;
      }
      targetAreas.push({
        id: area.id,
        name: area.name,
        value: area.value,
        unit: area.unit,
        sortOrder: area.sortOrder,
      });
    }
    const targetAreaIds = new Set(targetAreas.map((area) => area.id));
    const strategies = normalizeManagementGoalStrategies(input, targetAreaIds);
    if (!strategies) return null;

    return {
      schemaVersion: MANAGEMENT_GOALS_SCHEMA_VERSION,
      year: input.year,
      targetAreas,
      coreMessage: input.coreMessage,
      strategies,
    };
  }

  if (!validateTarget(input.groupSalesTarget) || !validateTarget(input.partnershipSalesTarget)) return null;
  const strategies = normalizeManagementGoalStrategies(input);
  if (!strategies) return null;

  return {
    schemaVersion: 1,
    year: input.year,
    groupSalesTarget: {
      value: input.groupSalesTarget.value,
      unit: input.groupSalesTarget.unit,
    },
    partnershipSalesTarget: {
      value: input.partnershipSalesTarget.value,
      unit: input.partnershipSalesTarget.unit,
    },
    coreMessage: input.coreMessage,
    strategies,
  };
}

function parseManagementGoalsIndex(indexText) {
  if (!indexText) return [];
  try {
    const parsed = JSON.parse(indexText);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => isPlainObject(item) && Number.isInteger(item.year));
  } catch {
    return [];
  }
}

function parseManagementGoalsSettings(settingsText) {
  if (!settingsText) return { activeYear: null };
  try {
    const parsed = JSON.parse(settingsText);
    return isPlainObject(parsed) && Number.isInteger(parsed.activeYear)
      ? { activeYear: parsed.activeYear }
      : { activeYear: null };
  } catch {
    return { activeYear: null };
  }
}

async function handleManagementGoals(request, env, path, corsHeaders) {
  const user = await authenticateSession(request, env);
  if (!user) {
    return createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders);
  }

  const isReadRoute = request.method === "GET" && (
    path === "/management-goals/active"
    || path === "/management-goals/years"
    || /^\/management-goals\/\d{4}$/.test(path)
  );
  if (isReadRoute && !hasMenuPermission(user, "managementGoals", "read")) {
    return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
  }

  if (path === "/management-goals/active" && request.method === "GET") {
    const settings = parseManagementGoalsSettings(
      await env.B2B_MEAL_DATA.get("management-goals:settings"),
    );
    if (settings.activeYear === null) {
      return createJsonResponse({ success: true, activeYear: null, goal: null }, 200, corsHeaders);
    }

    const goalText = await env.B2B_MEAL_DATA.get(`management-goals:${settings.activeYear}`);
    return createJsonResponse({
      success: true,
      activeYear: settings.activeYear,
      goal: goalText ? JSON.parse(goalText) : null,
    }, 200, corsHeaders);
  }

  if (path === "/management-goals/years" && request.method === "GET") {
    const indexedYears = parseManagementGoalsIndex(
      await env.B2B_MEAL_DATA.get("management-goals:index"),
    );
    const existingYears = [];
    for (const item of indexedYears) {
      const goalText = await env.B2B_MEAL_DATA.get(`management-goals:${item.year}`);
      if (goalText) existingYears.push(item.year);
    }
    existingYears.sort((a, b) => b - a);
    const settings = parseManagementGoalsSettings(
      await env.B2B_MEAL_DATA.get("management-goals:settings"),
    );
    return createJsonResponse({
      success: true,
      years: [...new Set(existingYears)],
      activeYear: settings.activeYear,
    }, 200, corsHeaders);
  }

  if (path === "/management-goals" && request.method === "GET") {
    if (!isManagementGoalsAdmin(user)) {
      return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
    }
    const years = parseManagementGoalsIndex(
      await env.B2B_MEAL_DATA.get("management-goals:index"),
    );
    const settings = parseManagementGoalsSettings(
      await env.B2B_MEAL_DATA.get("management-goals:settings"),
    );
    return createJsonResponse({ success: true, years, activeYear: settings.activeYear }, 200, corsHeaders);
  }

  if (path === "/management-goals/item" && request.method === "POST") {
    if (!isManagementGoalsAdmin(user)) {
      return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
    }

    const parsedBody = await readLimitedJson(request);
    if (parsedBody.error) {
      return createJsonResponse({ success: false, message: parsedBody.error }, parsedBody.status, corsHeaders);
    }

    const normalized = normalizeManagementGoalInput(parsedBody.value);
    if (!normalized) {
      return createJsonResponse({ success: false, message: "INVALID_INPUT" }, 400, corsHeaders);
    }

    const goalKey = `management-goals:${normalized.year}`;
    const existingText = await env.B2B_MEAL_DATA.get(goalKey);
    const existing = existingText ? JSON.parse(existingText) : null;
    const submittedVersion = parsedBody.value.version;

    if (existing) {
      if (!Number.isInteger(submittedVersion) || submittedVersion !== existing.version) {
        return createJsonResponse({
          success: false,
          message: "VERSION_CONFLICT",
          currentVersion: existing.version,
        }, 409, corsHeaders);
      }
    } else if (submittedVersion !== undefined && submittedVersion !== 0) {
      return createJsonResponse({ success: false, message: "VERSION_CONFLICT" }, 409, corsHeaders);
    }

    const updatedAt = new Date().toISOString();
    const document = {
      schemaVersion: MANAGEMENT_GOALS_SCHEMA_VERSION,
      ...normalized,
      version: existing ? existing.version + 1 : 1,
      updatedAt,
      updatedBy: user.id,
    };

    await env.B2B_MEAL_DATA.put(goalKey, JSON.stringify(document));

    const years = parseManagementGoalsIndex(
      await env.B2B_MEAL_DATA.get("management-goals:index"),
    );
    const nextEntry = {
      year: document.year,
      version: document.version,
      updatedAt: document.updatedAt,
      updatedBy: document.updatedBy,
    };
    const nextYears = years.filter((item) => item.year !== document.year);
    nextYears.push(nextEntry);
    nextYears.sort((a, b) => b.year - a.year);
    await env.B2B_MEAL_DATA.put("management-goals:index", JSON.stringify(nextYears));

    return createJsonResponse({ success: true, goal: document }, 200, corsHeaders);
  }

  if (path === "/management-goals/active" && request.method === "POST") {
    if (!isManagementGoalsAdmin(user)) {
      return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
    }

    const parsedBody = await readLimitedJson(request);
    if (parsedBody.error) {
      return createJsonResponse({ success: false, message: parsedBody.error }, parsedBody.status, corsHeaders);
    }
    const year = parsedBody.value && parsedBody.value.year;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return createJsonResponse({ success: false, message: "INVALID_INPUT" }, 400, corsHeaders);
    }

    const goalText = await env.B2B_MEAL_DATA.get(`management-goals:${year}`);
    if (!goalText) {
      return createJsonResponse({ success: false, message: "GOAL_NOT_FOUND" }, 400, corsHeaders);
    }

    await env.B2B_MEAL_DATA.put("management-goals:settings", JSON.stringify({ activeYear: year }));
    return createJsonResponse({ success: true, activeYear: year }, 200, corsHeaders);
  }

  const yearMatch = path.match(/^\/management-goals\/(\d{4})$/);
  if (yearMatch && request.method === "GET") {
    const year = Number(yearMatch[1]);
    if (year < 2000 || year > 2100) {
      return createJsonResponse({ success: false, message: "INVALID_YEAR" }, 400, corsHeaders);
    }
    const goalText = await env.B2B_MEAL_DATA.get(`management-goals:${year}`);
    if (!goalText) {
      return createJsonResponse({ success: false, message: "NOT_FOUND" }, 404, corsHeaders);
    }
    return createJsonResponse({ success: true, goal: JSON.parse(goalText) }, 200, corsHeaders);
  }

  return createJsonResponse({ success: false, message: "NOT_FOUND" }, 404, corsHeaders);
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";



      // /auth/login
      if (path === "/auth/login") {
        if (request.method === "POST") {
          let loginStage = "PARSE_REQUEST";
          try {
            const { id, pw } = await request.json();
            loginStage = "READ_USERS";
            const users = await readUsers(env);
            const user = users.find((item) => String(item.id) === String(id) && item.active !== false);
            loginStage = "VERIFY_PASSWORD";
            const passwordResult = user ? await verifyUserPassword(user, String(pw || "")) : { valid: false };

            if (!user || !passwordResult.valid) {
              return new Response(JSON.stringify({ success: false, message: "INVALID_LOGIN" }), {
                status: 401,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              });
            }

            if (passwordResult.legacy) {
              loginStage = "MIGRATE_PASSWORD";
              await upgradeLegacyPassword(env, user.id, String(pw || ""));
            }

            loginStage = "CREATE_SESSION";
            const session = await createSession(env, user.id);
            loginStage = "BUILD_RESPONSE";

            return new Response(JSON.stringify({
              success: true,
              user: {
                id: user.id,
                name: user.name,
                role: user.role,
                menuPermissions: normalizeMenuPermissions(user.role, user.menuPermissions),
              },
              token: session.token,
              expiresAt: session.expiresAt,
            }), {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            });
          } catch (error) {
            console.error("AUTH_LOGIN_ERROR", {
              stage: loginStage,
              errorName: error?.name || "Error",
              errorCode: error?.authErrorCode || "UNEXPECTED_ERROR",
            });
            return new Response(JSON.stringify({
              success: false,
              message: "AUTH_INTERNAL_ERROR",
            }), {
              status: 500,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            });
          }
        }

        return new Response("Method Not Allowed", {
          status: 405,
          headers: corsHeaders,
        });
      }

      if (path === "/auth/me") {
        if (request.method !== "GET") {
          return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
        }
        const user = await authenticateSession(request, env);
        if (!user) {
          return createJsonResponse(
            { success: false, message: "UNAUTHORIZED" },
            401,
            corsHeaders,
            { "Cache-Control": "no-store" },
          );
        }
        return createJsonResponse(
          { success: true, user: stripSensitiveUserFields(user) },
          200,
          corsHeaders,
          { "Cache-Control": "no-store" },
        );
      }

      if (path === "/auth/logout") {
        if (request.method !== "POST") {
          return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
        }
        const token = getBearerToken(request);
        if (!token) {
          return createJsonResponse(
            { success: false, message: "UNAUTHORIZED" },
            401,
            corsHeaders,
            { "Cache-Control": "no-store" },
          );
        }
        await env.B2B_MEAL_DATA.delete(`auth:sessions:${await hashSessionToken(token)}`);
        return createJsonResponse(
          { success: true },
          200,
          corsHeaders,
          { "Cache-Control": "no-store" },
        );
      }

      if (/^\/menus\/migrations\/initial-defaults\/(status|apply|recover)$/.test(path)) {
        return await handleInitialMenuMigration(request, env, path, corsHeaders);
      }

      if (path === "/management-goals"
      || path === "/management-goals/years"
      || path === "/management-goals/item"
        || path === "/management-goals/active"
        || /^\/management-goals\/\d{4}$/.test(path)) {
        return await handleManagementGoals(request, env, path, corsHeaders);
      }

      const businessPermission = getBusinessPermissionRequirement(path, request.method);
      if (businessPermission) {
        const authorization = await authorizeMenuRequest(
          request,
          env,
          businessPermission.menuKeys,
          businessPermission.level,
          corsHeaders,
        );
        if (authorization.response) return authorization.response;
        if (businessPermission.adminOnly && !isAdminUser(authorization.user)) {
          return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
        }
      }

      // /users
      if (path === "/users") {
        const storageKey = "users";
        const currentUser = await authenticateSession(request, env);
        if (!currentUser) {
          return createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders);
        }
        if (!isAdminUser(currentUser)) {
          return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
        }

        if (request.method === "GET") {
          const users = await readUsers(env);
          return new Response(JSON.stringify(users.map(stripSensitiveUserFields)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (request.method === "POST") {
          const newUser = await request.json();
          try {
            const user = await upsertUser(env, newUser);
            return new Response(JSON.stringify({ success: true, id: user.id, user }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch (error) {
            if (error?.userApiError) {
              return createJsonResponse({ success: false, message: error.message }, error.status, corsHeaders);
            }
            throw error;
          }
        }

        return new Response("Method Not Allowed", {
          status: 405,
          headers: corsHeaders,
        });
      }
      
        // /users/item
        if (path === "/users/item") {
          const currentUser = await authenticateSession(request, env);
          if (!currentUser) {
            return createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders);
          }
          if (!isAdminUser(currentUser)) {
            return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
          }

          if (request.method === "POST") {
            const newUser = await request.json();
            try {
              const user = await upsertUser(env, newUser);
              return new Response(JSON.stringify({ success: true, id: user.id, user }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            } catch (error) {
              if (error?.userApiError) {
                return createJsonResponse({ success: false, message: error.message }, error.status, corsHeaders);
              }
              throw error;
            }
          }

          return new Response("Method Not Allowed", {
            status: 405,
            headers: corsHeaders,
          });
        }

        // /users/:id
        if (path.startsWith("/users/")) {
          const storageKey = "users";
          const id = decodeURIComponent(path.split("/")[2] || "");
          const currentUser = await authenticateSession(request, env);
          if (!currentUser) {
            return createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders);
          }
          if (!isAdminUser(currentUser)) {
            return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);
          }

          if (request.method === "DELETE") {
            const users = await readUsers(env);
            const target = users.find((user) => String(user.id) === String(id));
            if (isAdminUser(target) && countActiveAdmins(users) <= 1) {
              return createJsonResponse(
                { success: false, message: "LAST_ACTIVE_ADMIN_REQUIRED" },
                409,
                corsHeaders,
              );
            }

            const updatedUsers = users.filter((u) => String(u.id) !== String(id));

            await env.B2B_MEAL_DATA.put(storageKey, JSON.stringify(updatedUsers));

            return new Response(
              JSON.stringify({
                success: true,
                deletedId: id,
                count: updatedUsers.length,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          return new Response("Method Not Allowed", {
            status: 405,
            headers: corsHeaders,
          });
        }


        // /sales-products
        if (path === "/sales-products") {
          const storageKey = "sales-products";

          const defaultProducts = [
            {
              id: "blackgoat_30",
              name: "흑염소진액",
              group: "흑염소",
              active: true,
              sortOrder: 1,
              isLegacy: true,
            },
            {
              id: "maesil_500",
              name: "매실 500ml",
              group: "매실",
              active: true,
              sortOrder: 2,
              isLegacy: true,
            },
            {
              id: "maesil_1500",
              name: "매실 1.5L",
              group: "매실",
              active: true,
              sortOrder: 3,
              isLegacy: true,
            },
            {
              id: "cheongmaesil_10",
              name: "우리땅 청매실",
              group: "매실",
              active: true,
              sortOrder: 4,
              isLegacy: true,
            },
          ];

          if (request.method === "GET") {
            const data = await env.B2B_MEAL_DATA.get(storageKey);

            return new Response(
              data || JSON.stringify(defaultProducts),
              {
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          if (request.method === "POST") {
            const products = await request.json();

            await env.B2B_MEAL_DATA.put(
              storageKey,
              JSON.stringify(products)
            );

            return new Response(
              JSON.stringify({
                success: true,
                count: products.length,
              }),
              {
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          return new Response("Method Not Allowed", {
            status: 405,
            headers: corsHeaders,
          });
        }

// /sales-products/item
if (path === "/sales-products/item") {
  const storageKey = "sales-products";

  if (request.method === "POST") {
    const newProduct = await request.json();

    if (!newProduct || !newProduct.id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "상품 ID가 필요합니다.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let products = [];

    const oldRaw =
      await env.B2B_MEAL_DATA.get(storageKey);

    if (oldRaw) {
      try {
        const parsed = JSON.parse(oldRaw);
        products = Array.isArray(parsed)
          ? parsed
          : [];
      } catch (e) {
        products = [];
      }
    }

    const productId = String(newProduct.id);

    const idx = products.findIndex(
      (product) =>
        String(product.id) === productId
    );

    const oldProduct =
      idx >= 0 ? products[idx] : {};

    const productData = {
      ...oldProduct,
      ...newProduct,
      id: productId,
      name: String(newProduct.name || "").trim(),
      group: String(newProduct.group || "").trim(),
      active: newProduct.active !== false,
      sortOrder: Number(
        newProduct.sortOrder || 999
      ),
      isLegacy:
        oldProduct.isLegacy === true ||
        newProduct.isLegacy === true,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      products[idx] = productData;
    } else {
      products.push({
        ...productData,
        createdAt: new Date().toISOString(),
      });
    }

    await env.B2B_MEAL_DATA.put(
      storageKey,
      JSON.stringify(products)
    );

    return new Response(
      JSON.stringify({
        success: true,
        id: productId,
        count: products.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  return new Response(
    "Method Not Allowed",
    {
      status: 405,
      headers: corsHeaders,
    }
  );
}

// /sales-channels
if (path === "/sales-channels") {
  const storageKey = "sales-channels";

  const defaultChannels = [
    {
      id: "naver",
      name: "네이버 스마트스토어",
      shortName: "네이버",
      active: true,
      sortOrder: 1,
      isLegacy: true,
    },
    {
      id: "coupang",
      name: "쿠팡",
      shortName: "쿠팡",
      active: true,
      sortOrder: 2,
      isLegacy: true,
    },
  ];

  if (request.method === "GET") {
    const data =
      await env.B2B_MEAL_DATA.get(storageKey);

    return new Response(
      data || JSON.stringify(defaultChannels),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (request.method === "POST") {
    const channels = await request.json();

    if (!Array.isArray(channels)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "채널 배열이 필요합니다.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    await env.B2B_MEAL_DATA.put(
      storageKey,
      JSON.stringify(channels)
    );

    return new Response(
      JSON.stringify({
        success: true,
        count: channels.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  return new Response(
    "Method Not Allowed",
    {
      status: 405,
      headers: corsHeaders,
    }
  );
}


// /sales-channels/item
if (path === "/sales-channels/item") {
  const storageKey = "sales-channels";

  if (request.method === "POST") {
    const newChannel = await request.json();

    if (!newChannel || !newChannel.id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "채널 ID가 필요합니다.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const defaultChannels = [
      {
        id: "naver",
        name: "네이버 스마트스토어",
        shortName: "네이버",
        active: true,
        sortOrder: 1,
        isLegacy: true,
      },
      {
        id: "coupang",
        name: "쿠팡",
        shortName: "쿠팡",
        active: true,
        sortOrder: 2,
        isLegacy: true,
      },
    ];

    let channels = [];

    const oldRaw =
      await env.B2B_MEAL_DATA.get(storageKey);

    if (oldRaw) {
      try {
        const parsed = JSON.parse(oldRaw);

        channels = Array.isArray(parsed)
          ? parsed
          : [];
      } catch (e) {
        channels = [];
      }
    } else {
      channels = defaultChannels.map(
        (channel) => ({ ...channel })
      );
    }

    const channelId =
      String(newChannel.id);

    const idx = channels.findIndex(
      (channel) =>
        String(channel.id) === channelId
    );

    const oldChannel =
      idx >= 0 ? channels[idx] : {};

    const channelData = {
      ...oldChannel,
      ...newChannel,
      id: channelId,
      name: String(
        newChannel.name || ""
      ).trim(),
      shortName: String(
        newChannel.shortName ||
        newChannel.name ||
        ""
      ).trim(),
      active:
        newChannel.active !== false,
      sortOrder: Number(
        newChannel.sortOrder || 999
      ),
      isLegacy:
        oldChannel.isLegacy === true ||
        newChannel.isLegacy === true,
      updatedAt:
        new Date().toISOString(),
    };

    if (idx >= 0) {
      channels[idx] = channelData;
    } else {
      channels.push({
        ...channelData,
        createdAt:
          new Date().toISOString(),
      });
    }

    await env.B2B_MEAL_DATA.put(
      storageKey,
      JSON.stringify(channels)
    );

    return new Response(
      JSON.stringify({
        success: true,
        id: channelId,
        count: channels.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  return new Response(
    "Method Not Allowed",
    {
      status: 405,
      headers: corsHeaders,
    }
  );
}

      const menuUsageMatch = path.match(/^\/menus\/([^/]+)\/usage$/);
      if (menuUsageMatch) {
        if (request.method !== "GET") {
          return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
        }
        const user = await authenticateSession(request, env);
        if (!user) return createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders);
        if (!canManageMenus(user)) return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);

        let menuId;
        try { menuId = decodeURIComponent(menuUsageMatch[1]); }
        catch { return createJsonResponse({ success: false, message: "INVALID_MENU_ID" }, 400, corsHeaders); }
        const raw = await env.B2B_MEAL_DATA.get(MENUS_STORAGE_KEY);
        const list = parseMenusText(raw);
        const menu = list.find((item) => String(item?.id) === String(menuId));
        if (!menu) return createJsonResponse({ success: false, message: "MENU_NOT_FOUND" }, 404, corsHeaders);
        const usage = await getMenuUsageSummary(env, menuId);
        return createJsonResponse({
          success: true,
          menuId,
          fingerprint: await createMenuFingerprint(menu),
          collectionFingerprint: await createMenuFingerprint(list),
          ...usage,
        }, 200, corsHeaders, { "Cache-Control": "no-store" });
      }

      const menuDeleteMatch = path.match(/^\/menus\/([^/]+)$/);
      if (menuDeleteMatch && request.method === "DELETE") {
        const lockedResponse = await rejectLockedMenuMutation(env, corsHeaders);
        if (lockedResponse) return lockedResponse;
        const user = await authenticateSession(request, env);
        if (!user) return createJsonResponse({ success: false, message: "UNAUTHORIZED" }, 401, corsHeaders);
        if (!canManageMenus(user)) return createJsonResponse({ success: false, message: "FORBIDDEN" }, 403, corsHeaders);

        let menuId;
        try { menuId = decodeURIComponent(menuDeleteMatch[1]); }
        catch { return createJsonResponse({ success: false, message: "INVALID_MENU_ID" }, 400, corsHeaders); }
        const expectedFingerprint = url.searchParams.get("expectedFingerprint") || "";
        const expectedCollectionFingerprint = url.searchParams.get("expectedCollectionFingerprint") || "";
        if (!expectedFingerprint || !expectedCollectionFingerprint) {
          return createJsonResponse({ success: false, message: "EXPECTED_FINGERPRINT_REQUIRED" }, 400, corsHeaders);
        }

        const raw = await env.B2B_MEAL_DATA.get(MENUS_STORAGE_KEY);
        const list = parseMenusText(raw);
        const index = list.findIndex((item) => String(item?.id) === String(menuId));
        if (index < 0) {
          return createJsonResponse({
            success: true, deletedId: menuId, alreadyDeleted: true, count: list.length,
          }, 200, corsHeaders);
        }

        const collectionFingerprint = await createMenuFingerprint(list);
        if (collectionFingerprint !== expectedCollectionFingerprint) {
          return createJsonResponse({
            success: false, message: "MENUS_CHANGED", collectionFingerprint,
          }, 409, corsHeaders, { "Cache-Control": "no-store" });
        }
        const fingerprint = await createMenuFingerprint(list[index]);
        if (fingerprint !== expectedFingerprint) {
          return createJsonResponse({
            success: false, message: "MENU_CHANGED", fingerprint,
          }, 409, corsHeaders, { "Cache-Control": "no-store" });
        }

        const usage = await getMenuUsageSummary(env, menuId);
        if (usage.inUse && url.searchParams.get("confirmInUse") !== "true") {
          return createJsonResponse({
            success: false,
            message: "MENU_IN_USE",
            menuId,
            fingerprint,
            collectionFingerprint,
            ...usage,
          }, 409, corsHeaders, { "Cache-Control": "no-store" });
        }

        const updatedList = list.filter((item) => String(item?.id) !== String(menuId));
        await env.B2B_MEAL_DATA.put(
          MENUS_DERIVED_DIRTY_KEY,
          JSON.stringify({ startedAt: new Date().toISOString(), reason: "menu-delete", menuId }),
        );
        await env.B2B_MEAL_DATA.put(MENUS_STORAGE_KEY, JSON.stringify(updatedList));
        await writeMenuDeletionDerivedData(env, updatedList, menuId);
        return createJsonResponse({
          success: true,
          deletedId: menuId,
          alreadyDeleted: false,
          count: updatedList.length,
          ...usage,
        }, 200, corsHeaders, { "Cache-Control": "no-store" });
      }

      if (path === "/menus/derived/rebuild") {
        if (request.method !== "POST") {
          return new Response("Method Not Allowed", {
            status: 405,
            headers: corsHeaders,
          });
        }

        const user = await authenticateSession(request, env);
        if (!user) {
          return createJsonResponse(
            { success: false, message: "UNAUTHORIZED" },
            401,
            corsHeaders,
          );
        }
        if (!isManagementGoalsAdmin(user)) {
          return createJsonResponse(
            { success: false, message: "FORBIDDEN" },
            403,
            corsHeaders,
          );
        }
        const lockedResponse = await rejectLockedMenuMutation(env, corsHeaders);
        if (lockedResponse) return lockedResponse;

        try {
          const result = await rebuildMenuDerivedData(env);
          return createJsonResponse(
            { success: true, ...result },
            200,
            corsHeaders,
          );
        } catch (error) {
          return createJsonResponse(
            { success: false, message: "DERIVED_REBUILD_FAILED" },
            500,
            corsHeaders,
          );
        }
      }

      const menuImageMatch = path.match(/^\/menus\/([^/]+)\/image$/);
      if (menuImageMatch) {
        if (request.method !== "GET") {
          return new Response("Method Not Allowed", {
            status: 405,
            headers: corsHeaders,
          });
        }

        let menuId;
        try {
          menuId = decodeURIComponent(menuImageMatch[1]);
        } catch {
          return new Response("Not Found", { status: 404, headers: corsHeaders });
        }

        let source;
        try {
          source = await readMenuImageSource(env, menuId);
        } catch (error) {
          if (error?.menuDerivedDataError) {
            return createJsonResponse(
              { success: false, message: error.message },
              error.status,
              corsHeaders,
              { "Cache-Control": "no-store" },
            );
          }
          throw error;
        }

        if (!isMenuImageDataUrl(source)) {
          try {
            const externalUrl = new URL(source);
            if (externalUrl.protocol === "http:" || externalUrl.protocol === "https:") {
              return Response.redirect(externalUrl.toString(), 302);
            }
          } catch {
            // 올바른 외부 이미지 URL이 아니면 아래에서 404로 처리한다.
          }

          return createJsonResponse(
            { success: false, message: "MENU_IMAGE_DATA_INVALID" },
            503,
            corsHeaders,
            { "Cache-Control": "no-store" },
          );
        }

        const decoded = decodeMenuImageDataUrl(source);
        if (!decoded) {
          return createJsonResponse(
            { success: false, message: "MENU_IMAGE_DATA_INVALID" },
            503,
            corsHeaders,
            { "Cache-Control": "no-store" },
          );
        }

        return new Response(decoded.bytes, {
          headers: {
            ...corsHeaders,
            "Content-Type": decoded.contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      // /menus
      if (path === "/menus") {
        const storageKey = MENUS_STORAGE_KEY;

        if (request.method === "GET") {
          if (url.searchParams.get("includeImages") === "false") {
            let lightweightList;
            try {
              lightweightList = await readLightweightMenus(env, url);
            } catch (error) {
              if (error?.menuDerivedDataError) {
                return createJsonResponse(
                  { success: false, message: error.message },
                  error.status,
                  corsHeaders,
                  { "Cache-Control": "no-store" },
                );
              }
              throw error;
            }

            return new Response(JSON.stringify(lightweightList), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const data = await env.B2B_MEAL_DATA.get(storageKey);

          return new Response(data || "[]", {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (request.method === "POST") {
          const lockedResponse = await rejectLockedMenuMutation(env, corsHeaders);
          if (lockedResponse) return lockedResponse;
          const newData = await request.json();

          let list = [];
          const oldDataRaw = await env.B2B_MEAL_DATA.get(storageKey);
          if (oldDataRaw) {
            list = JSON.parse(oldDataRaw);
          }

          // 프론트에서 메뉴 전체 배열을 통째로 보내는 구조
          if (Array.isArray(newData)) {
            list = newData;
          } else {
            // 단건 저장도 혹시 지원
            const idx = list.findIndex((item) => String(item.id) === String(newData.id));
            if (idx >= 0) {
              list[idx] = newData;
            } else {
              list.push(newData);
            }
          }

          await env.B2B_MEAL_DATA.put(
            MENUS_DERIVED_DIRTY_KEY,
            JSON.stringify({ startedAt: new Date().toISOString(), reason: "menus-save" }),
          );
          await env.B2B_MEAL_DATA.put(storageKey, JSON.stringify(list));

          let derivedSync = true;
          try {
            const imageCount = await writeAllMenuDerivedKeys(env, list);
            await env.B2B_MEAL_DATA.put(
              MENUS_DERIVED_READY_KEY,
              JSON.stringify({
                completedAt: new Date().toISOString(),
                menuCount: list.length,
                imageCount,
              }),
            );
            await env.B2B_MEAL_DATA.delete(MENUS_DERIVED_DIRTY_KEY);
          } catch (error) {
            derivedSync = false;
          }

          return new Response(JSON.stringify({
            success: true,
            count: list.length,
            derivedSync,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response("Method Not Allowed", {
          status: 405,
          headers: corsHeaders,
        });
      }

      //menus/item --260316
      if (path === "/menus/item") {
        const storageKey = MENUS_STORAGE_KEY;

        if (request.method === "POST") {
          const lockedResponse = await rejectLockedMenuMutation(env, corsHeaders);
          if (lockedResponse) return lockedResponse;
          const newItem = await request.json();

          let list = [];
          const derivedReady = await env.B2B_MEAL_DATA.get(MENUS_DERIVED_READY_KEY);
          const oldDataRaw = await env.B2B_MEAL_DATA.get(storageKey);
          if (oldDataRaw) {
            list = JSON.parse(oldDataRaw);
          }

          const idx = list.findIndex(item => String(item.id) === String(newItem.id));
          if (idx >= 0) {
            const existingItem = list[idx];
            const existingImage = getMenuImageSource(existingItem);
            const incomingImage =
              typeof newItem.img === "string" ? newItem.img.trim() : "";

            if (!incomingImage) {
              if (Object.prototype.hasOwnProperty.call(existingItem, "img")) {
                newItem.img = existingItem.img;
              } else {
                delete newItem.img;
              }

              if (Object.prototype.hasOwnProperty.call(existingItem, "image")) {
                newItem.image = existingItem.image;
              }

              if (existingItem.imageUpdatedAt) {
                newItem.imageUpdatedAt = existingItem.imageUpdatedAt;
              }
            } else if (incomingImage !== existingImage) {
              newItem.imageUpdatedAt = new Date().toISOString();
            } else if (existingItem.imageUpdatedAt) {
              newItem.imageUpdatedAt = existingItem.imageUpdatedAt;
            }

            list[idx] = newItem;
          } else {
            if (getMenuImageSource(newItem)) {
              newItem.imageUpdatedAt = new Date().toISOString();
            }
            list.push(newItem);
          }

          await env.B2B_MEAL_DATA.put(
            MENUS_DERIVED_DIRTY_KEY,
            JSON.stringify({ startedAt: new Date().toISOString(), reason: "menu-save" }),
          );
          await env.B2B_MEAL_DATA.put(storageKey, JSON.stringify(list));

          let derivedSync = true;
          try {
            if (!derivedReady) {
              throw new Error("MENU_DERIVED_DATA_NOT_READY");
            }
            await writeMenuImageDerivedKey(env, newItem);
            await writeMenusLightDerivedKey(env, list);
            await env.B2B_MEAL_DATA.delete(MENUS_DERIVED_DIRTY_KEY);
          } catch (error) {
            derivedSync = false;
          }

          return new Response(JSON.stringify({
            success: true,
            id: newItem.id,
            derivedSync,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response("Method Not Allowed", {
          status: 405,
          headers: corsHeaders,
        });
      }

// /delivery-events
if (path === "/delivery-events") {
  const storageKey = "delivery-events";

  if (request.method === "GET") {
    const data = await env.B2B_MEAL_DATA.get(storageKey);
    return new Response(data || "[]", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const newEvent = await request.json();

    let list = [];
    const oldDataRaw = await env.B2B_MEAL_DATA.get(storageKey);
    if (oldDataRaw) {
      list = JSON.parse(oldDataRaw);
    }

    const idx = list.findIndex((item) => String(item.id) === String(newEvent.id));
    if (idx >= 0) {
      list[idx] = newEvent;
    } else {
      list.push(newEvent);
    }

    await env.B2B_MEAL_DATA.put(storageKey, JSON.stringify(list));

    return new Response(JSON.stringify({ success: true, id: newEvent.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}

// /delivery-events/item
if (path === "/delivery-events/item") {
  const storageKey = "delivery-events";

  if (request.method === "POST") {
    const newItem = await request.json();

    let list = [];
    const oldDataRaw = await env.B2B_MEAL_DATA.get(storageKey);
    if (oldDataRaw) {
      list = JSON.parse(oldDataRaw);
    }

    const idx = list.findIndex((item) => String(item.id) === String(newItem.id));
    if (idx >= 0) {
      list[idx] = newItem;
    } else {
      list.push(newItem);
    }

    await env.B2B_MEAL_DATA.put(storageKey, JSON.stringify(list));

    return new Response(JSON.stringify({ success: true, id: newItem.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}

// /delivery-events/:id
if (path.startsWith("/delivery-events/")) {
  const storageKey = "delivery-events";
  const id = decodeURIComponent(path.split("/")[2] || "");

  if (request.method === "DELETE") {
    const oldDataRaw = await env.B2B_MEAL_DATA.get(storageKey);

    if (!oldDataRaw) {
      return new Response(JSON.stringify({ success: true, deletedId: id, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const list = JSON.parse(oldDataRaw);
    const updatedList = list.filter((item) => String(item.id) !== String(id));

    await env.B2B_MEAL_DATA.put(storageKey, JSON.stringify(updatedList));

    return new Response(
      JSON.stringify({
        success: true,
        deletedId: id,
        count: updatedList.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}

// /blackgoat-sales
if (path === "/blackgoat-sales") {
  const storageKey = "blackgoat-sales";

  if (request.method === "GET") {
    const data = await env.B2B_MEAL_DATA.get(storageKey);

    return new Response(
      data ||
        JSON.stringify({
          productId: "blackgoat_30",
          productName: "흑염소진액",
          channels: {
            naver: null,
            coupang: null,
          },
          updatedAt: null,
        }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (request.method === "POST") {
    const newData = await request.json();

    await env.B2B_MEAL_DATA.put(storageKey, JSON.stringify(newData));

    return new Response(
      JSON.stringify({
        success: true,
        key: storageKey,
        updatedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}

// /plans
if (path === "/plans") {
  const indexKey = "plans:index";

  if (request.method === "GET") {
    const plans = [];

    // 1) 새 구조 데이터 읽기
    const indexRaw = await env.B2B_MEAL_DATA.get(indexKey);
    let ids = [];

    try {
      ids = indexRaw ? JSON.parse(indexRaw) : [];
      if (!Array.isArray(ids)) ids = [];
    } catch (e) {
      ids = [];
    }

    for (const id of ids) {
      const planRaw = await env.B2B_MEAL_DATA.get(`plans:${id}`);
      if (planRaw) {
        try {
          plans.push(JSON.parse(planRaw));
        } catch (e) {}
      }
    }

    // 2) 기존 구조 plans 데이터도 같이 읽기
    const oldPlansRaw = await env.B2B_MEAL_DATA.get("plans");

    if (oldPlansRaw) {
      try {
        const oldPlans = JSON.parse(oldPlansRaw);

        if (Array.isArray(oldPlans)) {
          oldPlans.forEach((oldPlan) => {
            const alreadyExists = plans.some(
              (p) => String(p.id) === String(oldPlan.id)
            );

            if (!alreadyExists) {
              plans.push(oldPlan);
            }
          });
        }
      } catch (e) {}
    }

    return new Response(JSON.stringify(plans), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const newPlan = await request.json();
    const id = String(newPlan.id || Date.now());

    newPlan.id = id;

    await env.B2B_MEAL_DATA.put(`plans:${id}`, JSON.stringify(newPlan));

    const indexRaw = await env.B2B_MEAL_DATA.get(indexKey);
    let ids = indexRaw ? JSON.parse(indexRaw) : [];

    if (!Array.isArray(ids)) ids = [];

    if (!ids.includes(id)) {
      ids.push(id);
    }

    await env.B2B_MEAL_DATA.put(indexKey, JSON.stringify(ids));

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}

// /plans/:id
if (path.startsWith("/plans/")) {
  const indexKey = "plans:index";
  const id = decodeURIComponent(path.split("/")[2] || "");

  if (request.method === "DELETE") {
    await env.B2B_MEAL_DATA.delete(`plans:${id}`);

    const indexRaw = await env.B2B_MEAL_DATA.get(indexKey);
    let ids = indexRaw ? JSON.parse(indexRaw) : [];

    if (!Array.isArray(ids)) ids = [];

    const updatedIds = ids.filter((item) => String(item) !== String(id));

    await env.B2B_MEAL_DATA.put(indexKey, JSON.stringify(updatedIds));

    return new Response(
      JSON.stringify({
        success: true,
        deletedId: id,
        count: updatedIds.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}


      // 예전 루트 접근 호환용
      if (path === "/") {
        return new Response(
          JSON.stringify({
            message: "B2B Meal API is running",
            endpoints: [
              "POST /auth/login",

      "GET /management-goals/active",
      "GET /management-goals/years",
              "GET /management-goals/:year",
              "GET /management-goals",
              "POST /management-goals/item",
              "POST /management-goals/active",

              "GET /users",
              "POST /users",
              "POST /users/item",
              "DELETE /users/:id",

              "GET /sales-products",
              "POST /sales-products",
              "POST /sales-products/item",

              "GET /sales-channels",
              "POST /sales-channels",
              "POST /sales-channels/item",

              "GET /blackgoat-sales",
              "POST /blackgoat-sales",

              "GET /menus",
              "GET /menus?includeImages=false",
              "GET /menus/:id/image",
              "POST /menus",
              "POST /menus/item",
              "POST /menus/derived/rebuild",

              "GET /plans",
              "POST /plans",
              "DELETE /plans/:id",

              "GET /delivery-events",
              "POST /delivery-events",
              "POST /delivery-events/item",
              "DELETE /delivery-events/:id",
            ],
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          error: err.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};
