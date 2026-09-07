      let deliveryEventsCache = [];

      async function loadDeliveryEventsFromServer() {
        try {
          const data = await apiGet("/delivery-events");

          deliveryEventsCache = Array.isArray(data)
            ? data.filter((item) => item && item.id && item.startDate)
            : [];

          return deliveryEventsCache;
        } catch (e) {
          console.error("단체 캘린더 데이터 로딩 실패:", e);
          deliveryEventsCache = [];
          return [];
        }
      }

      async function saveDeliveryEventToServer(eventData) {
        await apiPost("/delivery-events/item", eventData);
        await loadDeliveryEventsFromServer();
      }

      async function deleteDeliveryEventFromServer(id) {
        await apiDelete(`/delivery-events/${id}`);
        await loadDeliveryEventsFromServer();
      }

      function getEvents() {
        return deliveryEventsCache;
      }

      // =========================
// 단체캘린더
// =========================
let currentMonth = new Date();
currentMonth.setDate(1);

let deliveryCalendarInitialized = false;
let editingId = null;

function generateDeliveryId() {
  return "evt_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

async function initDeliveryCalendarPage() {
  if (!deliveryCalendarInitialized) {
    bindDeliveryCalendarEvents();
    deliveryCalendarInitialized = true;
  }

  await loadDeliveryEventsFromServer();
  renderDeliveryAll();
}

function bindDeliveryCalendarEvents() {
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    currentMonth.setDate(1);
    renderDeliveryAll();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    currentMonth.setDate(1);
    renderDeliveryAll();
  });

  document.getElementById("openModalBtn").addEventListener("click", openNewDeliveryModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);

  document.getElementById("modalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
  });


  document.getElementById("eventForm").addEventListener("submit", handleDeliverySubmit);
  document.getElementById("resetBtn").addEventListener("click", resetDeliveryForm);
  document.getElementById("deleteBtn").addEventListener("click", handleDeliveryDelete);
}

function openNewDeliveryModal() {
  resetDeliveryForm();
  openModal();
}

function openModal() {
  document.getElementById("modalBackdrop").classList.add("show");
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("show");
}

function calculateSales(quantity, unitPrice) {
  return Number(quantity || 0) * Number(unitPrice || 0);
}

function formatNumber(num) {
  return Number(num || 0).toLocaleString("ko-KR");
}

function formatCurrency(num) {
  return formatNumber(num) + "원";
}

function getEventSales(event) {
  if (
    typeof event.sales !== "undefined" &&
    event.sales !== null &&
    event.sales !== ""
  ) {
    return Number(event.sales || 0);
  }

  return calculateSales(event.quantity, event.unitPrice);
}

function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function updateEstimatedSalesPreview() {
  const qty = document.getElementById("quantity")?.value || 0;
  const unitPrice = document.getElementById("unitPrice")?.value || 0;
  const box = document.getElementById("estimatedSalesBox");
  if (box) box.textContent = formatCurrency(calculateSales(qty, unitPrice));
}

function getMonthlyEvents() {
  const events = getEvents();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthStart = new Date(year, month, 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(year, month + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  return events
    .filter((event) => {
      const start = normalizeDate(event.startDate);
      const end = normalizeDate(event.endDate || event.startDate);
      return start <= monthEnd && end >= monthStart;
    })
    .sort((a, b) => normalizeDate(a.startDate) - normalizeDate(b.startDate));
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getPastelColor(seed) {
  const hash = hashString(seed);

  // 색상이 한쪽으로 몰리지 않도록 황금각 기준으로 분산
  const hue = (hash * 137.508) % 360;

  // 파스텔톤 유지
  const saturation = 58;
  const lightness = 84;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function renderDeliveryAll() {
  renderDeliveryHeader();
  renderDeliverySummaryTable();
  renderDeliveryCalendar();
}

function renderDeliveryHeader() {
  const monthText = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;
  document.getElementById("monthLabel").textContent = monthText;
  document.getElementById("calendarTitle").textContent = `${currentMonth.getMonth() + 1}월 단체 납품 일정`;

  const monthlyEvents = getMonthlyEvents();
  const totalQty = monthlyEvents
  .filter((item) => item.status !== "취소")
  .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalSales = monthlyEvents
  .filter((item) => item.status !== "취소")
  .reduce((sum, item) => sum + getEventSales(item), 0);

  document.getElementById("summaryQty").textContent = `${formatNumber(totalQty)} ea`;
  document.getElementById("summarySales").textContent = formatCurrency(totalSales);
}

function renderDeliveryCalendar() {
  const weeksContainer = document.getElementById("calendarWeeks");
  weeksContainer.innerHTML = "";

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();

  const gridStart = new Date(year, month, 1 - startOffset);
  gridStart.setHours(0, 0, 0, 0);

  const weeks = [];

  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      days.push(date);
    }
    weeks.push(days);
  }

  weeks.forEach((weekDays, weekIndex) => {
    const weekRow = document.createElement("div");
    weekRow.className = "week-row";
    weekRow.dataset.weekIndex = weekIndex;

    weekDays.forEach((date) => {
      const cell = document.createElement("div");
      cell.className = "day-cell";
      if (date.getMonth() !== month) cell.classList.add("other-month");

      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = date.getDate();

      cell.appendChild(num);
      weekRow.appendChild(cell);
    });

    const eventsLayer = document.createElement("div");
    eventsLayer.className = "week-events-layer";
    eventsLayer.dataset.weekIndex = weekIndex;
    weekRow.appendChild(eventsLayer);

    weeksContainer.appendChild(weekRow);
  });

  const monthlyEvents = getMonthlyEvents();
  const weekSegments = buildWeeklySegments(monthlyEvents, weeks);
  const eventLaneMap = buildEventLaneMap(monthlyEvents);

  weekSegments.forEach((segments, weekIndex) => {
    const lanes = assignLanes(segments, eventLaneMap);
    const layer = weeksContainer.querySelector(
      `.week-events-layer[data-week-index="${weekIndex}"]`
    );
    if (!layer) return;

    lanes.forEach((laneSegments, laneIndex) => {
      laneSegments.forEach((seg) => {
        const bar = document.createElement("div");
        bar.className = "event-bar";
        if (seg.event.status === "취소") bar.classList.add("cancelled");

        const leftPercent = (seg.startCol / 7) * 100;
        const widthPercent = ((seg.endCol - seg.startCol + 1) / 7) * 100;

        bar.style.left = `calc(${leftPercent}% + 2px)`;
        bar.style.width = `calc(${widthPercent}% - 4px)`;
        bar.style.top = `${laneIndex * 28}px`;
        bar.style.background = getPastelColor(seg.event.id);
        bar.textContent = seg.event.eventName;
        bar.title = seg.event.eventName;

        bar.addEventListener("click", () => {
          loadDeliveryEventToForm(seg.event.id);
        });

        layer.appendChild(bar);
      });
    });
  });
}

function buildWeeklySegments(events, weeks) {
  const result = Array.from({ length: 6 }, () => []);

  events.forEach((event) => {
    const eventStart = normalizeDate(event.startDate);
    const eventEnd = normalizeDate(event.endDate || event.startDate);

    weeks.forEach((weekDays, weekIndex) => {
      const weekStart = normalizeDate(weekDays[0]);
      const weekEnd = normalizeDate(weekDays[6]);

      if (eventEnd < weekStart || eventStart > weekEnd) return;

      const segmentStart = eventStart > weekStart ? eventStart : weekStart;
      const segmentEnd = eventEnd < weekEnd ? eventEnd : weekEnd;

      const startCol = diffDays(weekStart, segmentStart);
      const endCol = diffDays(weekStart, segmentEnd);

      result[weekIndex].push({
        event,
        startCol,
        endCol,
      });
    });
  });

  return result;
}

function diffDays(baseDate, targetDate) {
  const ms = normalizeDate(targetDate) - normalizeDate(baseDate);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function buildEventLaneMap(events) {
  const eventLaneMap = new Map();
  const laneEndDates = [];

  events.forEach((event) => {
    const eventStart = normalizeDate(event.startDate);
    const eventEnd = normalizeDate(event.endDate || event.startDate);
    let laneIndex = laneEndDates.findIndex((laneEndDate) => laneEndDate < eventStart);

    if (laneIndex === -1) {
      laneIndex = laneEndDates.length;
    }

    eventLaneMap.set(event.id, laneIndex);
    laneEndDates[laneIndex] = eventEnd;
  });

  return eventLaneMap;
}

function assignLanes(segments, eventLaneMap) {
  const sorted = [...segments].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return b.endCol - b.startCol - (a.endCol - a.startCol);
  });

  const lanes = [];

  sorted.forEach((seg) => {
    const savedLaneIndex = eventLaneMap.get(seg.event.id);
    if (typeof savedLaneIndex === "undefined") return;

    while (lanes.length <= savedLaneIndex) lanes.push([]);
    lanes[savedLaneIndex].push(seg);
  });

  return lanes;
}

function renderDeliverySummaryTable() {
  const wrap = document.getElementById("summaryTableWrap");
  const monthlyEvents = getMonthlyEvents();

  if (!monthlyEvents.length) {
    wrap.innerHTML = `<div class="empty-box">선택한 월 데이터가 없습니다.</div>`;
    return;
  }

  let html = `
  <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
    <thead>
      <tr>
        <th style="width:50%; padding:10px; border-bottom:1px solid #eee;">행사명</th>
        <th style="width:20%; padding:10px; border-bottom:1px solid #eee;">수량</th>
        <th style="width:30%; padding:10px; border-bottom:1px solid #eee;">매출</th>
      </tr>
    </thead>
    <tbody>
`;

  monthlyEvents.forEach((event) => {
    html += `
      <tr data-id="${event.id}" style="cursor:pointer;">
          <td style="padding:10px; border-bottom:1px solid #eee; font-weight:700;">
          ${escapeHtml(event.eventName)}
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          ${formatNumber(event.quantity)} ea
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          ${formatCurrency(getEventSales(event))}
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  wrap.innerHTML = html;

  wrap.querySelectorAll("tbody tr").forEach((row) => {
    row.addEventListener("click", () => {
      loadDeliveryEventToForm(row.dataset.id);
    });
  });
}

async function handleDeliverySubmit(e) {
  e.preventDefault();

  const id = document.getElementById("eventId").value || generateDeliveryId();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const eventName = document.getElementById("eventName").value.trim();
  const companyName = document.getElementById("companyName").value.trim();
  const quantity = Number(document.getElementById("quantity").value || 0);
  const unitPrice = Number(document.getElementById("unitPrice").value || 0);
  const sales = Number(document.getElementById("sales").value || 0);
  const menuName = document.getElementById("menuName").value.trim();
  const status = document.getElementById("status").value;

  if (!startDate) {
    alert("행사일자를 입력해주세요.");
    return;
  }

  if (endDate && endDate < startDate) {
    alert("종료일자는 행사일자보다 빠를 수 없습니다.");
    return;
  }

  const currentUser = getCurrentUser();

  const eventData = {
    id,
    startDate,
    endDate,
    eventName,
    companyName,
    quantity,
    unitPrice,
    sales,
    menuName,
    status,
    savedBy: {
      id: currentUser.id || "",
      name: currentUser.name || "알 수 없음",
      role: currentUser.role || "",
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveDeliveryEventToServer(eventData);

    currentMonth = normalizeDate(startDate);
    currentMonth.setDate(1);

    resetDeliveryForm();
    closeModal();
    renderDeliveryAll();
  } catch (e) {
    console.error(e);
    alert("단체 일정 저장에 실패했습니다. API에 /delivery-events 저장 경로가 있는지 확인해주세요.");
  }
}

function loadDeliveryEventToForm(id) {
  const events = getEvents();
  const event = events.find((item) => item.id === id);
  if (!event) return;

  editingId = id;

  document.getElementById("eventId").value = event.id;
  document.getElementById("startDate").value = event.startDate || "";
  document.getElementById("endDate").value = event.endDate || "";
  document.getElementById("eventName").value = event.eventName || "";
  document.getElementById("companyName").value = event.companyName || "";
  document.getElementById("quantity").value = event.quantity || 0;
  document.getElementById("unitPrice").value = event.unitPrice || 0;
  document.getElementById("sales").value = getEventSales(event);
  document.getElementById("menuName").value = event.menuName || "";
  document.getElementById("status").value = event.status || "확정";

  openModal();
}

function resetDeliveryForm() {
  editingId = null;
  document.getElementById("eventForm").reset();
  document.getElementById("eventId").value = "";
  document.getElementById("status").value = "확정";
}

async function handleDeliveryDelete() {
  const id = document.getElementById("eventId").value;

  if (!id) {
    alert("삭제할 항목을 먼저 선택해주세요.");
    return;
  }

  if (!confirm("선택한 데이터를 삭제하시겠습니까?")) return;

  try {
    await deleteDeliveryEventFromServer(id);
    resetDeliveryForm();
    closeModal();
    renderDeliveryAll();
  } catch (e) {
    console.error(e);
    alert("삭제에 실패했습니다.");
  }
}


// =========================
// 상품 매출보고
