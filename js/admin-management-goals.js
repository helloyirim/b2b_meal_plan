let adminManagementGoalsInitialized = false;
let adminManagementGoalsIndex = [];
let adminManagementGoalsActiveYear = null;
let adminManagementGoalDraft = null;
let adminManagementGoalsDirty = false;
let adminManagementGoalsIdSequence = 0;

function setAdminManagementGoalsStatus(message = "", type = "") {
  const status = document.getElementById("adminManagementGoalsStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", type === "error");
  status.classList.toggle("is-success", type === "success");
}

function setAdminManagementGoalsDirty(isDirty) {
  adminManagementGoalsDirty = Boolean(isDirty);
  const status = document.getElementById("managementGoalsDirtyStatus");
  if (status) status.textContent = adminManagementGoalsDirty ? "저장되지 않은 변경사항이 있습니다." : "";
}

function hasUnsavedManagementGoalsChanges() {
  return adminManagementGoalsDirty;
}

function canLeaveAdminManagementGoals() {
  if (!adminManagementGoalsDirty) return true;
  const leave = confirm("저장되지 않은 경영목표 변경사항이 있습니다. 변경사항을 버리고 이동하시겠습니까?");
  if (leave) setAdminManagementGoalsDirty(false);
  return leave;
}

function createAdminManagementGoalsId(prefix) {
  adminManagementGoalsIdSequence += 1;
  return `${prefix}-${Date.now()}-${adminManagementGoalsIdSequence}`;
}

function createAdminManagementGoalsElement(tagName, className = "", text = null) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== null && text !== undefined) element.textContent = String(text);
  return element;
}

function createAdminManagementGoalsButton(label, onClick, className = "btn") {
  const button = createAdminManagementGoalsElement("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function createAdminManagementGoalsField(labelText, control, className = "field") {
  const field = createAdminManagementGoalsElement("div", className);
  const label = createAdminManagementGoalsElement("label", "", labelText);
  field.append(label, control);
  return field;
}

function createAdminManagementGoalsInput(value, onInput, options = {}) {
  const input = document.createElement(options.multiline ? "textarea" : "input");
  if (options.multiline) input.rows = options.rows || 3;
  if (options.type) input.type = options.type;
  if (options.min !== undefined) input.min = options.min;
  if (options.step !== undefined) input.step = options.step;
  if (options.maxLength) input.maxLength = options.maxLength;
  input.value = value ?? "";
  input.addEventListener("input", () => {
    onInput(input.value);
    setAdminManagementGoalsDirty(true);
  });
  return input;
}

function normalizeAdminManagementGoalsSortOrder(items) {
  items.forEach((item, index) => {
    item.sortOrder = index + 1;
  });
}

function moveAdminManagementGoalsItem(items, index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  normalizeAdminManagementGoalsSortOrder(items);
  setAdminManagementGoalsDirty(true);
  renderAdminManagementGoalsStrategies();
}

function confirmAdminManagementGoalsDelete(message) {
  return confirm(message);
}

function createEmptyAdminManagementGoal(year) {
  return {
    year,
    targetAreas: [],
    coreMessage: "",
    strategies: [],
    version: 0,
  };
}

function populateAdminManagementGoalsYearSelect(preferredYear = null) {
  const select = document.getElementById("managementGoalsYearSelect");
  if (!select) return;
  const currentValue = preferredYear ?? adminManagementGoalDraft?.year ?? adminManagementGoalsActiveYear;
  select.replaceChildren();

  if (!adminManagementGoalsIndex.length) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "저장된 연도 없음";
    select.appendChild(emptyOption);
    return;
  }

  adminManagementGoalsIndex.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.year);
    option.textContent = `${item.year}년${item.year === adminManagementGoalsActiveYear ? " (메인 표시)" : ""}`;
    select.appendChild(option);
  });

  if (currentValue && adminManagementGoalsIndex.some((item) => item.year === Number(currentValue))) {
    select.value = String(currentValue);
  }
}

function setAdminManagementGoalsEditorVisible(visible) {
  const editor = document.getElementById("adminManagementGoalsEditor");
  if (editor) editor.hidden = !visible;
}

function clearAdminManagementGoalsSensitiveView() {
  adminManagementGoalsIndex = [];
  adminManagementGoalsActiveYear = null;
  adminManagementGoalDraft = null;
  setAdminManagementGoalsDirty(false);
  setAdminManagementGoalsEditorVisible(false);
  populateAdminManagementGoalsYearSelect();
  const strategiesEditor = document.getElementById("managementGoalsStrategiesEditor");
  if (strategiesEditor) strategiesEditor.replaceChildren();
  const targetAreasEditor = document.getElementById("managementGoalsTargetAreasEditor");
  if (targetAreasEditor) targetAreasEditor.replaceChildren();
}

function handleAdminManagementGoalsError(error) {
  if (error instanceof ManagementGoalsApiError && (error.status === 401 || error.status === 403)) {
    clearAdminManagementGoalsSensitiveView();
  }
  setAdminManagementGoalsStatus(getManagementGoalsErrorMessage(error), "error");
}

async function loadAdminManagementGoalsIndex(preferredYear = null, loadSelected = true) {
  setAdminManagementGoalsStatus("경영목표 연도 목록을 불러오는 중입니다.");
  try {
    const result = await managementGoalsApiRequest("/management-goals");
    adminManagementGoalsIndex = Array.isArray(result.years) ? result.years : [];
    adminManagementGoalsActiveYear = Number.isInteger(result.activeYear) ? result.activeYear : null;
    populateAdminManagementGoalsYearSelect(preferredYear);

    if (!adminManagementGoalsIndex.length) {
      clearAdminManagementGoalsSensitiveView();
      setAdminManagementGoalsStatus("저장된 경영목표가 없습니다. 신규 연도를 입력해 작성해 주세요.");
      return;
    }

    setAdminManagementGoalsStatus("");
    if (loadSelected) {
      const selectedYear = Number(document.getElementById("managementGoalsYearSelect")?.value);
      if (selectedYear) await loadAdminManagementGoalYear(selectedYear, false);
    }
  } catch (error) {
    handleAdminManagementGoalsError(error);
  }
}

function fillAdminManagementGoalsBasicFields() {
  if (!adminManagementGoalDraft) return;
  document.getElementById("managementGoalsEditYear").value = adminManagementGoalDraft.year;
  document.getElementById("managementGoalsCoreMessage").value = adminManagementGoalDraft.coreMessage ?? "";
}

function renderAdminManagementGoalsTargetAreas() {
  const container = document.getElementById("managementGoalsTargetAreasEditor");
  if (!container) return;
  container.replaceChildren();
  if (!adminManagementGoalDraft) return;

  adminManagementGoalDraft.targetAreas.forEach((area, areaIndex) => {
    const editor = createAdminManagementGoalsElement("article", "management-goals-target-area-editor");
    const grid = createAdminManagementGoalsElement("div", "management-goals-target-area-editor-grid");
    grid.appendChild(createAdminManagementGoalsField(
      "영역명",
      createAdminManagementGoalsInput(area.name, (value) => { area.name = value; }, { maxLength: 200 }),
    ));
    grid.appendChild(createAdminManagementGoalsField(
      "목표 금액",
      createAdminManagementGoalsInput(area.value, (value) => { area.value = value; }, { type: "number", min: 0, step: "any" }),
    ));
    grid.appendChild(createAdminManagementGoalsField(
      "단위",
      createAdminManagementGoalsInput(area.unit, (value) => { area.unit = value; }, { maxLength: 30 }),
    ));
    editor.appendChild(grid);

    const actions = createAdminManagementGoalsElement("div", "management-goals-editor-row-actions");
    const orderActions = createAdminManagementGoalsElement("div", "management-goals-editor-row-actions");
    const upButton = createAdminManagementGoalsButton("영역 위로", () => {
      if (areaIndex === 0) return;
      [adminManagementGoalDraft.targetAreas[areaIndex - 1], adminManagementGoalDraft.targetAreas[areaIndex]] = [
        adminManagementGoalDraft.targetAreas[areaIndex],
        adminManagementGoalDraft.targetAreas[areaIndex - 1],
      ];
      normalizeAdminManagementGoalsSortOrder(adminManagementGoalDraft.targetAreas);
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsTargetAreas();
      renderAdminManagementGoalsStrategies();
    });
    const downButton = createAdminManagementGoalsButton("영역 아래로", () => {
      if (areaIndex === adminManagementGoalDraft.targetAreas.length - 1) return;
      [adminManagementGoalDraft.targetAreas[areaIndex], adminManagementGoalDraft.targetAreas[areaIndex + 1]] = [
        adminManagementGoalDraft.targetAreas[areaIndex + 1],
        adminManagementGoalDraft.targetAreas[areaIndex],
      ];
      normalizeAdminManagementGoalsSortOrder(adminManagementGoalDraft.targetAreas);
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsTargetAreas();
      renderAdminManagementGoalsStrategies();
    });
    upButton.disabled = areaIndex === 0;
    downButton.disabled = areaIndex === adminManagementGoalDraft.targetAreas.length - 1;
    orderActions.append(upButton, downButton);

    const deleteButton = createAdminManagementGoalsButton("목표 영역 삭제", () => {
      const hasConnectedStrategy = adminManagementGoalDraft.strategies.some(
        (strategy) => strategy.targetAreaId === area.id,
      );
      if (hasConnectedStrategy) {
        setAdminManagementGoalsStatus("연결된 전략을 다른 목표 영역으로 재배정한 후 삭제해 주세요.", "error");
        return;
      }
      if (!confirmAdminManagementGoalsDelete("이 목표 영역을 삭제하시겠습니까?")) return;
      adminManagementGoalDraft.targetAreas.splice(areaIndex, 1);
      normalizeAdminManagementGoalsSortOrder(adminManagementGoalDraft.targetAreas);
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsTargetAreas();
      renderAdminManagementGoalsStrategies();
    }, "btn management-goals-danger-button");
    actions.append(orderActions, deleteButton);
    editor.appendChild(actions);
    container.appendChild(editor);
  });
}

function renderAdminManagementGoalsDetails(task, detailsContainer) {
  task.details.forEach((detail, detailIndex) => {
    const detailEditor = createAdminManagementGoalsElement("div", "management-goals-detail-editor");
    const detailGrid = createAdminManagementGoalsElement("div", "management-goals-detail-editor-grid");

    detailGrid.appendChild(createAdminManagementGoalsField(
      "세부 제목 (선택)",
      createAdminManagementGoalsInput(detail.title, (value) => { detail.title = value; }, { maxLength: 2000 }),
    ));
    detailGrid.appendChild(createAdminManagementGoalsField(
      "KPI 지표·목표 수치 (선택)",
      createAdminManagementGoalsInput(detail.kpi, (value) => { detail.kpi = value; }, { multiline: true, rows: 2, maxLength: 5000 }),
    ));
    detailGrid.appendChild(createAdminManagementGoalsField(
      "완료 예정시기 (선택)",
      createAdminManagementGoalsInput(detail.dueDateLabel, (value) => { detail.dueDateLabel = value; }, { maxLength: 500 }),
    ));
    detailGrid.appendChild(createAdminManagementGoalsField(
      "세부 실행계획",
      createAdminManagementGoalsInput(detail.content, (value) => { detail.content = value; }, { multiline: true, rows: 5, maxLength: 20000 }),
      "field management-goals-detail-content-field",
    ));
    detailEditor.appendChild(detailGrid);

    const actions = createAdminManagementGoalsElement("div", "management-goals-editor-row-actions");
    const orderActions = createAdminManagementGoalsElement("div", "management-goals-editor-row-actions");
    const upButton = createAdminManagementGoalsButton("위로", () => moveAdminManagementGoalsItem(task.details, detailIndex, -1));
    const downButton = createAdminManagementGoalsButton("아래로", () => moveAdminManagementGoalsItem(task.details, detailIndex, 1));
    upButton.disabled = detailIndex === 0;
    downButton.disabled = detailIndex === task.details.length - 1;
    orderActions.append(upButton, downButton);
    const deleteButton = createAdminManagementGoalsButton("세부 내용 삭제", () => {
      if (!confirmAdminManagementGoalsDelete("이 세부 실행계획을 삭제하시겠습니까?")) return;
      task.details.splice(detailIndex, 1);
      normalizeAdminManagementGoalsSortOrder(task.details);
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsStrategies();
    }, "btn management-goals-danger-button");
    actions.append(orderActions, deleteButton);
    detailEditor.appendChild(actions);
    detailsContainer.appendChild(detailEditor);
  });
}

function renderAdminManagementGoalsTasks(strategy, strategyBody) {
  strategy.tasks.forEach((task, taskIndex) => {
    const taskEditor = createAdminManagementGoalsElement("section", "management-goals-task-editor");
    const taskGrid = createAdminManagementGoalsElement("div", "management-goals-task-editor-grid");
    taskGrid.appendChild(createAdminManagementGoalsField(
      "실행과제 제목",
      createAdminManagementGoalsInput(task.title, (value) => { task.title = value; }, { multiline: true, rows: 2, maxLength: 2000 }),
    ));
    taskGrid.appendChild(createAdminManagementGoalsField(
      "KPI 지표·목표 수치 (선택)",
      createAdminManagementGoalsInput(task.kpi, (value) => { task.kpi = value; }, { multiline: true, rows: 2, maxLength: 5000 }),
    ));
    taskGrid.appendChild(createAdminManagementGoalsField(
      "완료 예정시기 (선택)",
      createAdminManagementGoalsInput(task.dueDateLabel, (value) => { task.dueDateLabel = value; }, { maxLength: 500 }),
    ));
    taskEditor.appendChild(taskGrid);

    const taskActions = createAdminManagementGoalsElement("div", "management-goals-editor-row-actions");
    const taskOrderActions = createAdminManagementGoalsElement("div", "management-goals-editor-row-actions");
    const upButton = createAdminManagementGoalsButton("과제 위로", () => moveAdminManagementGoalsItem(strategy.tasks, taskIndex, -1));
    const downButton = createAdminManagementGoalsButton("과제 아래로", () => moveAdminManagementGoalsItem(strategy.tasks, taskIndex, 1));
    upButton.disabled = taskIndex === 0;
    downButton.disabled = taskIndex === strategy.tasks.length - 1;
    taskOrderActions.append(upButton, downButton);
    const deleteButton = createAdminManagementGoalsButton("실행과제 삭제", () => {
      if (!confirmAdminManagementGoalsDelete("이 실행과제와 모든 세부 내용을 삭제하시겠습니까?")) return;
      strategy.tasks.splice(taskIndex, 1);
      normalizeAdminManagementGoalsSortOrder(strategy.tasks);
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsStrategies();
    }, "btn management-goals-danger-button");
    taskActions.append(taskOrderActions, deleteButton);
    taskEditor.appendChild(taskActions);

    const detailsContainer = createAdminManagementGoalsElement("div", "management-goals-details-editor");
    renderAdminManagementGoalsDetails(task, detailsContainer);
    taskEditor.appendChild(detailsContainer);
    const addDetailRow = createAdminManagementGoalsElement("div", "management-goals-add-row");
    addDetailRow.appendChild(createAdminManagementGoalsButton("세부 실행계획 추가", () => {
      task.details.push({
        id: createAdminManagementGoalsId("detail"),
        title: "",
        content: "",
        kpi: "",
        dueDateLabel: "",
        sortOrder: task.details.length + 1,
      });
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsStrategies();
    }));
    taskEditor.appendChild(addDetailRow);
    strategyBody.appendChild(taskEditor);
  });
}

function renderAdminManagementGoalsStrategies() {
  const container = document.getElementById("managementGoalsStrategiesEditor");
  if (!container) return;
  container.replaceChildren();
  if (!adminManagementGoalDraft) return;

  adminManagementGoalDraft.strategies.forEach((strategy, strategyIndex) => {
    const strategyEditor = createAdminManagementGoalsElement("article", "management-goals-strategy-editor");
    const header = createAdminManagementGoalsElement("div", "management-goals-editor-card-header");
    const areaSelect = document.createElement("select");
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "목표 영역 선택 필요";
    areaSelect.appendChild(emptyOption);
    adminManagementGoalDraft.targetAreas.forEach((area) => {
      const option = document.createElement("option");
      option.value = area.id;
      option.textContent = area.name || "이름 없는 목표 영역";
      areaSelect.appendChild(option);
    });
    areaSelect.value = strategy.targetAreaId || "";
    areaSelect.addEventListener("change", () => {
      strategy.targetAreaId = areaSelect.value;
      setAdminManagementGoalsDirty(true);
    });
    header.appendChild(createAdminManagementGoalsField(
      "소속 목표 영역",
      areaSelect,
      "field management-goals-strategy-area-field",
    ));
    header.appendChild(createAdminManagementGoalsField(
      `전략 ${strategyIndex + 1} 제목`,
      createAdminManagementGoalsInput(strategy.title, (value) => { strategy.title = value; }, { multiline: true, rows: 2, maxLength: 1000 }),
    ));
    const actions = createAdminManagementGoalsElement("div", "management-goals-editor-row-actions");
    const upButton = createAdminManagementGoalsButton("전략 위로", () => moveAdminManagementGoalsItem(adminManagementGoalDraft.strategies, strategyIndex, -1));
    const downButton = createAdminManagementGoalsButton("전략 아래로", () => moveAdminManagementGoalsItem(adminManagementGoalDraft.strategies, strategyIndex, 1));
    upButton.disabled = strategyIndex === 0;
    downButton.disabled = strategyIndex === adminManagementGoalDraft.strategies.length - 1;
    const deleteButton = createAdminManagementGoalsButton("전략 삭제", () => {
      if (!confirmAdminManagementGoalsDelete("이 전략과 모든 실행과제를 삭제하시겠습니까?")) return;
      adminManagementGoalDraft.strategies.splice(strategyIndex, 1);
      normalizeAdminManagementGoalsSortOrder(adminManagementGoalDraft.strategies);
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsStrategies();
    }, "btn management-goals-danger-button");
    actions.append(upButton, downButton, deleteButton);
    header.appendChild(actions);
    strategyEditor.appendChild(header);

    const body = createAdminManagementGoalsElement("div", "management-goals-strategy-editor-body");
    renderAdminManagementGoalsTasks(strategy, body);
    const addTaskRow = createAdminManagementGoalsElement("div", "management-goals-add-row");
    addTaskRow.appendChild(createAdminManagementGoalsButton("실행과제 추가", () => {
      strategy.tasks.push({
        id: createAdminManagementGoalsId("task"),
        title: "",
        kpi: "",
        dueDateLabel: "",
        sortOrder: strategy.tasks.length + 1,
        details: [],
      });
      setAdminManagementGoalsDirty(true);
      renderAdminManagementGoalsStrategies();
    }));
    body.appendChild(addTaskRow);
    strategyEditor.appendChild(body);
    container.appendChild(strategyEditor);
  });
}

function renderAdminManagementGoalDraft() {
  if (!adminManagementGoalDraft) {
    setAdminManagementGoalsEditorVisible(false);
    return;
  }
  if (!Array.isArray(adminManagementGoalDraft.targetAreas)) {
    adminManagementGoalDraft = normalizeManagementGoalForClient(adminManagementGoalDraft);
  }
  setAdminManagementGoalsEditorVisible(true);
  fillAdminManagementGoalsBasicFields();
  renderAdminManagementGoalsTargetAreas();
  renderAdminManagementGoalsStrategies();
}

async function loadAdminManagementGoalYear(year, confirmDiscard = true) {
  if (!Number.isInteger(year)) return;
  if (confirmDiscard && adminManagementGoalsDirty && !canLeaveAdminManagementGoals()) {
    populateAdminManagementGoalsYearSelect(adminManagementGoalDraft?.year);
    return;
  }

  setAdminManagementGoalsStatus(`${year}년 경영목표를 불러오는 중입니다.`);
  try {
    const result = await managementGoalsApiRequest(`/management-goals/${year}`);
    const isLegacyDocument = !Array.isArray(result.goal?.targetAreas);
    adminManagementGoalDraft = normalizeManagementGoalForClient(result.goal);
    setAdminManagementGoalsDirty(false);
    populateAdminManagementGoalsYearSelect(year);
    renderAdminManagementGoalDraft();
    setAdminManagementGoalsStatus(
      isLegacyDocument
        ? "기존 형식의 경영목표입니다. 전략 소속을 자동 추정하지 않았습니다. 각 전략의 목표 영역을 선택한 뒤 저장해 주세요."
        : "",
    );
  } catch (error) {
    handleAdminManagementGoalsError(error);
  }
}

function startNewAdminManagementGoal() {
  const year = Number(document.getElementById("newManagementGoalsYear")?.value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    setAdminManagementGoalsStatus("2000년부터 2100년 사이의 신규 연도를 입력해 주세요.", "error");
    return;
  }
  if (adminManagementGoalsIndex.some((item) => item.year === year)) {
    setAdminManagementGoalsStatus("이미 저장된 연도입니다. 연도 목록에서 불러와 주세요.", "error");
    return;
  }
  if (adminManagementGoalsDirty && !canLeaveAdminManagementGoals()) return;

  adminManagementGoalDraft = createEmptyAdminManagementGoal(year);
  setAdminManagementGoalsDirty(true);
  renderAdminManagementGoalDraft();
  setAdminManagementGoalsStatus(`${year}년 신규 경영목표를 작성 중입니다.`);
}

function addAdminManagementGoalsStrategy() {
  if (!adminManagementGoalDraft) return;
  adminManagementGoalDraft.strategies.push({
    id: createAdminManagementGoalsId("strategy"),
    title: "",
    targetAreaId: "",
    sortOrder: adminManagementGoalDraft.strategies.length + 1,
    tasks: [],
  });
  setAdminManagementGoalsDirty(true);
  renderAdminManagementGoalsStrategies();
}

function addAdminManagementGoalsTargetArea() {
  if (!adminManagementGoalDraft) return;
  adminManagementGoalDraft.targetAreas.push({
    id: createAdminManagementGoalsId("target-area"),
    name: "",
    value: "",
    unit: "",
    sortOrder: adminManagementGoalDraft.targetAreas.length + 1,
  });
  setAdminManagementGoalsDirty(true);
  renderAdminManagementGoalsTargetAreas();
  renderAdminManagementGoalsStrategies();
}

function updateAdminManagementGoalsBasicDraft() {
  if (!adminManagementGoalDraft) return;
  adminManagementGoalDraft.coreMessage = document.getElementById("managementGoalsCoreMessage").value;
  setAdminManagementGoalsDirty(true);
}

function buildAdminManagementGoalsSavePayload() {
  if (!adminManagementGoalDraft) throw new Error("NO_DRAFT");
  if (!Array.isArray(adminManagementGoalDraft.targetAreas)
    || !adminManagementGoalDraft.targetAreas.length
    || !String(adminManagementGoalDraft.coreMessage).trim()) {
    throw new Error("INVALID_BASIC_INPUT");
  }

  const payload = JSON.parse(JSON.stringify(adminManagementGoalDraft));
  delete payload.groupSalesTarget;
  delete payload.partnershipSalesTarget;
  payload.schemaVersion = 2;
  normalizeAdminManagementGoalsSortOrder(payload.targetAreas);
  const targetAreaIds = new Set();
  payload.targetAreas.forEach((area) => {
    const rawValue = String(area.value);
    const numericValue = Number(rawValue);
    if (!String(area.id).trim()
      || targetAreaIds.has(area.id)
      || !String(area.name).trim()
      || !rawValue.trim()
      || !Number.isFinite(numericValue)
      || numericValue < 0
      || !String(area.unit).trim()) {
      throw new Error("INVALID_TARGET_AREA");
    }
    targetAreaIds.add(area.id);
    area.value = numericValue;
  });
  normalizeAdminManagementGoalsSortOrder(payload.strategies);
  payload.strategies.forEach((strategy) => {
    if (!String(strategy.title).trim() || !targetAreaIds.has(strategy.targetAreaId)) {
      throw new Error("INVALID_STRATEGY");
    }
    normalizeAdminManagementGoalsSortOrder(strategy.tasks);
    strategy.tasks.forEach((task) => {
      if (!String(task.title).trim()) throw new Error("INVALID_TASK");
      normalizeAdminManagementGoalsSortOrder(task.details);
      task.details.forEach((detail) => {
        if (!String(detail.content).trim()) throw new Error("INVALID_DETAIL");
      });
    });
  });
  return payload;
}

async function saveAdminManagementGoal() {
  let payload;
  try {
    payload = buildAdminManagementGoalsSavePayload();
  } catch {
    setAdminManagementGoalsStatus("목표 영역의 이름·수치·단위, 전략별 소속 영역, 핵심 문구와 각 필수 내용을 확인해 주세요.", "error");
    return;
  }

  setAdminManagementGoalsStatus("경영목표를 저장하는 중입니다.");
  try {
    const result = await managementGoalsApiRequest("/management-goals/item", {
      method: "POST",
      body: payload,
    });
    adminManagementGoalDraft = result.goal;
    setAdminManagementGoalsDirty(false);
    renderAdminManagementGoalDraft();
    await loadAdminManagementGoalsIndex(result.goal.year, false);
    setAdminManagementGoalsStatus(`${result.goal.year}년 경영목표를 저장했습니다.`, "success");
    if (adminManagementGoalsActiveYear === result.goal.year) loadActiveManagementGoal();
  } catch (error) {
    handleAdminManagementGoalsError(error);
  }
}

async function activateAdminManagementGoalYear() {
  if (!adminManagementGoalDraft) return;
  if (adminManagementGoalsDirty) {
    setAdminManagementGoalsStatus("메인 표시 연도로 지정하기 전에 현재 변경사항을 저장해 주세요.", "error");
    return;
  }

  try {
    const result = await managementGoalsApiRequest("/management-goals/active", {
      method: "POST",
      body: { year: adminManagementGoalDraft.year },
    });
    adminManagementGoalsActiveYear = result.activeYear;
    populateAdminManagementGoalsYearSelect(result.activeYear);
    setAdminManagementGoalsStatus(`${result.activeYear}년을 메인 표시 연도로 지정했습니다.`, "success");
    loadActiveManagementGoal();
  } catch (error) {
    handleAdminManagementGoalsError(error);
  }
}

function bindAdminManagementGoalsControls() {
  document.getElementById("loadManagementGoalsYearBtn")?.addEventListener("click", () => {
    const year = Number(document.getElementById("managementGoalsYearSelect")?.value);
    if (year) loadAdminManagementGoalYear(year);
  });
  document.getElementById("managementGoalsYearSelect")?.addEventListener("change", (event) => {
    const year = Number(event.target.value);
    if (year) loadAdminManagementGoalYear(year);
  });
  document.getElementById("newManagementGoalsYearBtn")?.addEventListener("click", startNewAdminManagementGoal);
  document.getElementById("activateManagementGoalsYearBtn")?.addEventListener("click", activateAdminManagementGoalYear);
  document.getElementById("addManagementGoalsTargetAreaBtn")?.addEventListener("click", addAdminManagementGoalsTargetArea);
  document.getElementById("addManagementGoalsStrategyBtn")?.addEventListener("click", addAdminManagementGoalsStrategy);
  document.getElementById("saveManagementGoalsBtn")?.addEventListener("click", saveAdminManagementGoal);

  [
    "managementGoalsCoreMessage",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateAdminManagementGoalsBasicDraft);
  });
}

async function initAdminManagementGoalsPage() {
  if (!adminManagementGoalsInitialized) {
    bindAdminManagementGoalsControls();
    adminManagementGoalsInitialized = true;
  }
  if (adminManagementGoalsDirty) return;
  await loadAdminManagementGoalsIndex(adminManagementGoalDraft?.year);
}
