let currentSalesChannel = "all";
let currentSalesProducts = [];

/**
 * 채널 저장용 빈 데이터 구조 생성
 *
 * 예:
 * {
 *   naver: { months: {} },
 *   coupang: { months: {} }
 * }
 */
function createEmptySalesChannelsStorage() {
  return Object.fromEntries(
    getAllSalesChannels().map((channel) => [
      channel.id,
      { months: {} },
    ])
  );
}


let currentSalesMonth = new Date();
currentSalesMonth.setDate(1);

let salesReportCache = null;

//11. loadSalesReportFromServer() 내 중복 렌더링 정리
async function loadSalesReportFromServer() {
  try {
    const data = await apiGet("/blackgoat-sales");

    salesReportCache = normalizeSalesStorage(data);

    if (salesReportCache) {
      renderSalesReport(getVisibleSalesReport());
    }
  } catch (e) {
    console.error("상품 매출보고 로딩 실패:", e);

    salesReportCache = normalizeSalesStorage(null);
    renderSalesReport(getVisibleSalesReport());
  }
}


//8. saveSalesReportToServer() 수정
async function saveSalesReportToServer(reportData) {
  const productId = reportData.productId || "blackgoat_30";
  const channel = reportData.channel || "naver";
  const monthKey = `${reportData.year}-${String(reportData.month).padStart(2, "0")}`;

  salesReportCache = normalizeSalesStorage(salesReportCache);

  if (!salesReportCache.products[productId]) {
    salesReportCache.products[productId] = {
      productId,
      productName: getSalesProductName(productId),
      channels: {
        naver: { months: {} },
        coupang: { months: {} },
      },
    };
  }

  if (!salesReportCache.products[productId].channels[channel]) {
    salesReportCache.products[productId].channels[channel] = {
      months: {},
    };
  }

  if (!salesReportCache.products[productId].channels[channel].months) {
    salesReportCache.products[productId].channels[channel].months = {};
  }

  salesReportCache.products[productId].channels[channel].months[monthKey] =
    reportData;

  salesReportCache.updatedAt = new Date().toISOString();

  await apiPost("/blackgoat-sales", salesReportCache);
}


//7. normalizeSalesStorage() 수정
function normalizeSalesStorage(data) {
  const emptyProduct = () => ({
    channels: {
      naver: { months: {} },
      coupang: { months: {} },
      ...createEmptySalesChannelsStorage(),
    },
  });

  const storage = {
    products: {},
    notes:
      data?.notes && typeof data.notes === "object"
        ? { ...data.notes }
        : {},
    updatedAt: data?.updatedAt || null,
  };

  // 관리자 상품 목록 기준으로 빈 데이터 구조 생성
  getAllSalesProducts().forEach((product) => {
    storage.products[product.id] = {
      productId: product.id,
      productName: product.name,
      ...emptyProduct(),
    };
  });

  if (!data) return storage;

  // 현재 다상품 구조
  if (data.products) {
    Object.entries(data.products).forEach(
      ([productId, productData]) => {
        if (!storage.products[productId]) {
          storage.products[productId] = {
            productId,
            productName:
              productData.productName ||
              getSalesProductName(productId) ||
              productId,
            ...emptyProduct(),
          };
        }

        storage.products[productId].productName =
          getSalesProductName(productId) ||
          productData.productName ||
          productId;

        Object.entries(productData.channels || {}).forEach(
          ([channelId, channelData]) => {
            const normalizedChannel =
              channelData && typeof channelData === "object"
                ? channelData
                : {};

            storage.products[productId].channels[channelId] =
              {
                ...normalizedChannel,
                months:
                  normalizedChannel.months &&
                  typeof normalizedChannel.months === "object"
                    ? normalizedChannel.months
                    : {},
              };
          }
        );
      }
    );

    return storage;
  }

  // 과거 흑염소 단일 구조 자동 호환
  if (data.channels) {
    storage.products.blackgoat_30 = {
      productId: "blackgoat_30",
      productName: getSalesProductName("blackgoat_30"),
      channels: {
        ...emptyProduct().channels,
        ...Object.fromEntries(
          Object.entries(data.channels).map(
            ([channelId, channelData]) => {
              const normalizedChannel =
                channelData && typeof channelData === "object"
                  ? channelData
                  : {};

              return [
                channelId,
                {
                  ...normalizedChannel,
                  months:
                    normalizedChannel.months &&
                    typeof normalizedChannel.months === "object"
                      ? normalizedChannel.months
                      : {},
                },
              ];
            }
          )
        ),
      },
    };
  }

  return storage;
}



function getVisibleSalesReport() {
  salesReportCache = normalizeSalesStorage(salesReportCache);
  return buildSelectedProductsSalesReport();
}

function buildSelectedProductsSalesReport() {
  const monthKey = getSalesMonthKey();
  const reports = [];

  currentSalesProducts.forEach((productId) => {
    const product = salesReportCache.products?.[productId];
    if (!product) return;

    if (currentSalesChannel === "all") {
      getActiveSalesChannelIds().forEach((channelId) => {
        const channelReport =
          product.channels[channelId]?.months?.[monthKey];
        if (channelReport) reports.push(channelReport);
      });
    } else {
      const channelReport =
        product.channels[currentSalesChannel]?.months?.[monthKey];
      if (channelReport) reports.push(channelReport);
    }
  });

  if (!reports.length) {
    const empty = createEmptySalesReport(currentSalesChannel);
    empty.monthlyRows = buildSalesMonthlyRows();
    return empty;
  }

  return mergeSalesReports(reports);
}

function createEmptySalesReport(channel = "all") {
  return {
    channel,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    start: "",
    end: "",
    dailyRows: [],
    monthlyRows: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      sales: 0,
      isCurrent: false,
    })),
    totalCustomer: 0,
    totalQty: 0,
    totalSales: 0,
    netSales: 0,
    refundCount: 0,
    refundAmount: 0,
    avgCustomer: 0,
    avgSet: 0,
    savedAt: null,
  };
}

function mergeSalesReports(reports = []) {
  const rowMap = new Map();

  reports.forEach((report) => {
    (report.dailyRows || []).forEach((row) => {
      if (!rowMap.has(row.date)) {
        rowMap.set(row.date, {
          date: row.date,
          day: row.day,
          customers: 0,
          orderCount: 0,
          qty: 0,
          sales: 0,
          refundCount: 0,
          refundAmount: 0,
          refundQty: 0,
          naverSales: 0,
          coupangSales: 0,
          channelSales: {},
          isOutOfRange: row.isOutOfRange,
        });
      }

      const target = rowMap.get(row.date);

      target.customers += Number(row.customers || 0);
      target.orderCount += Number(row.orderCount || 0);
      target.qty += Number(row.qty || 0);
      target.sales += Number(row.sales || 0);

      if (report.channel === "naver") {
        target.naverSales += Number(row.sales || 0);
      }

      if (report.channel === "coupang") {
        target.coupangSales += Number(row.sales || 0);
      }

      if (report.channel) {
        target.channelSales[report.channel] =
          Number(target.channelSales[report.channel] || 0) +
          Number(row.sales || 0);
      }

      target.refundCount += Number(row.refundCount || 0);
      target.refundAmount += Number(row.refundAmount || 0);
      target.refundQty += Number(row.refundQty || 0);
      target.isOutOfRange = target.isOutOfRange && row.isOutOfRange;
    });
  });

  const dailyRows = Array.from(rowMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const validRows = dailyRows.filter((row) => !row.isOutOfRange);

  const grossSales = validRows.reduce((sum, row) => sum + row.sales, 0);
  const grossQty = validRows.reduce((sum, row) => sum + row.qty, 0);
  const grossCustomer = validRows.reduce((sum, row) => sum + row.customers, 0);

  const refundCount = validRows.reduce((sum, row) => sum + row.refundCount, 0);
  const refundAmount = validRows.reduce((sum, row) => sum + row.refundAmount, 0);
  const refundQty = validRows.reduce((sum, row) => sum + row.refundQty, 0);

  const totalCustomer = grossCustomer;
  const totalQty = grossQty;
  const totalSales = grossSales;
  const netSales = Math.max(grossSales - refundAmount, 0);

  return {
    channel: currentSalesChannel,
    year: currentSalesMonth.getFullYear(),
    month: currentSalesMonth.getMonth() + 1,
    start: reports[0]?.start || "",
    end: reports[0]?.end || "",
    dailyRows,
    monthlyRows: buildSalesMonthlyRows(),
    totalCustomer,
    totalQty,
    totalSales,
    netSales,
    refundCount,
    refundAmount,
    refundQty,
    avgCustomer: totalCustomer ? Math.round(totalSales / totalCustomer) : 0,
    avgSet: totalQty ? Math.round(totalSales / totalQty) : 0,
    savedAt: new Date().toISOString(),
  };
}



function buildSalesMonthlyRows() {
  const year = currentSalesMonth.getFullYear();

  return Array.from({ length: 12 }, (_, i) => {
    const monthNo = i + 1;
    const monthKey = `${year}-${String(monthNo).padStart(2, "0")}`;

    let sales = 0;

    currentSalesProducts.forEach((productId) => {
      const product = salesReportCache.products?.[productId];
      if (!product) return;

      if (currentSalesChannel === "all") {
        getActiveSalesChannelIds().forEach((channelId) => {
          const report =
            product.channels[channelId]?.months?.[monthKey];
          sales += Number(report?.netSales ?? report?.totalSales ?? 0);
        });
      } else {
        const report =
          product.channels[currentSalesChannel]?.months?.[monthKey];
        sales += Number(report?.netSales ?? report?.totalSales ?? 0);
      }
    });

    return {
      month: monthNo,
      sales,
      isCurrent: monthNo === currentSalesMonth.getMonth() + 1,
    };
  });
}

function showSalesPage(channel = "all") {
  currentSalesChannel = channel;

  showPage("page-sales");
  renderSalesProductFilter();

  document.querySelectorAll(".sales-channel-nav").forEach((el) => {
    el.classList.remove("active");
  });

  const activeNav = document.getElementById(`nav-sales-${channel}`);
  if (activeNav) activeNav.classList.add("active");

  const title = document.querySelector("#page-sales .calendar-page-title");
  if (title) {
    title.innerText =
  `${getSalesProductTitle()} ${getSalesChannelLabel(channel)} 매출보고`;
  }

  if (salesReportCache) {
    renderSalesReport(getVisibleSalesReport());
}
}

function moveSalesMonth(offset) {
  currentSalesMonth.setMonth(currentSalesMonth.getMonth() + offset);
  currentSalesMonth.setDate(1);

  if (salesReportCache) {
    renderSalesReport(getVisibleSalesReport());
  }
}

function updateSalesMonthLabel() {
  const label = document.getElementById("salesMonthLabel");
  if (!label) return;

  label.innerText = `${currentSalesMonth.getFullYear()}년 ${
    currentSalesMonth.getMonth() + 1
  }월`;
}

function getSalesMonthKey(date = currentSalesMonth) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function renderSalesProductFilter() {
  const container = document.getElementById("salesProductFilter");
  if (!container) return;

  const products = getActiveSalesProducts();

  // 최초 로딩 시 전체 상품 선택
  if (!Array.isArray(currentSalesProducts) || currentSalesProducts.length === 0) {
    currentSalesProducts = products.map((product) => product.id);
  }

  const isAllChecked =
    products.length > 0 &&
    products.every((product) =>
      currentSalesProducts.includes(product.id)
    );

  container.innerHTML = `
    <label class="sales-product-filter-item sales-product-filter-all">
      <input
        type="checkbox"
        id="salesProductFilterAll"
        ${isAllChecked ? "checked" : ""}
      >
      <span>전체 상품</span>
    </label>

    ${products
      .map(
        (product) => `
          <label class="sales-product-filter-item">
            <input
              type="checkbox"
              class="sales-product-filter-checkbox"
              value="${product.id}"
              ${
                currentSalesProducts.includes(product.id)
                  ? "checked"
                  : ""
              }
            >
            <span>${product.name}</span>
          </label>
        `
      )
      .join("")}
  `;

  const allCheckbox = document.getElementById(
    "salesProductFilterAll"
  );

  const productCheckboxes = Array.from(
    container.querySelectorAll(
      ".sales-product-filter-checkbox"
    )
  );

  allCheckbox?.addEventListener("change", () => {
    productCheckboxes.forEach((checkbox) => {
      checkbox.checked = allCheckbox.checked;
    });

    currentSalesProducts = allCheckbox.checked
      ? products.map((product) => product.id)
      : [];

    refreshSalesReportByProductFilter();
  });

  productCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      currentSalesProducts = productCheckboxes
        .filter((item) => item.checked)
        .map((item) => item.value);

      allCheckbox.checked =
        currentSalesProducts.length === products.length;

      refreshSalesReportByProductFilter();
    });
  });
}



function refreshSalesReportByProductFilter() {
  updateSalesReportTitle();

  if (salesReportCache) {
    renderSalesReport(getVisibleSalesReport());
  }
}

function renderSalesRawProductSelect() {
  const rawSelect = document.getElementById("salesRawProduct");
  if (!rawSelect) return;

  const products = getActiveSalesProducts();

  rawSelect.innerHTML = products
    .map(
      (product) =>
        `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}</option>`
    )
    .join("");
}

function renderSalesChannelNavigation() {
  const container =
    document.getElementById("salesChannelNavList");

  if (!container) return;

  const channels = getActiveSalesChannels();

  container.innerHTML = channels
    .map(
      (channel) => `
        <div
          class="nav-item sales-channel-nav"
          id="nav-sales-${escapeHtml(channel.id)}"
          onclick="showSalesPage('${escapeHtml(channel.id)}')"
        >
          └ ${escapeHtml(channel.name)}
        </div>
      `
    )
    .join("");
}

function renderSalesRawChannelSelect() {
  const select =
    document.getElementById("salesRawChannel");

  if (!select) return;

  const currentValue = select.value;
  const channels = getActiveSalesChannels();

  select.innerHTML = channels
    .map(
      (channel) => `
        <option value="${escapeHtml(channel.id)}">
          ${escapeHtml(channel.name)}
        </option>
      `
    )
    .join("");

  if (
    currentValue &&
    channels.some(
      (channel) =>
        String(channel.id) === String(currentValue)
    )
  ) {
    select.value = currentValue;
  }
}

function toggleAllSalesProducts(el) {
  document.querySelectorAll(".sales-product-check").forEach((check) => {
    check.checked = el.checked;
  });

  updateSelectedSalesProducts();
}

function updateSelectedSalesProducts() {
  const checked = Array.from(
    document.querySelectorAll(".sales-product-check:checked")
  ).map((el) => el.value);

  const activeProductIds = getActiveSalesProducts().map(
    (product) => product.id
  );

  currentSalesProducts = checked.length
    ? checked
    : activeProductIds;

  const allCheck = document.getElementById("salesProductAll");

  if (allCheck) {
    allCheck.checked =
      currentSalesProducts.length === activeProductIds.length;
  }

  updateSalesReportTitle();
  renderSalesReport(getVisibleSalesReport());
}

//6. getSalesProductTitle() 수정
function getSalesProductTitle() {
  const activeProducts = getActiveSalesProducts();
  const activeIds = activeProducts.map((product) => product.id);

  if (currentSalesProducts.length === activeIds.length) {
    return "전체 상품";
  }

  if (currentSalesProducts.length === 1) {
    return getSalesProductName(currentSalesProducts[0]);
  }

  const selectedProducts = currentSalesProducts
    .map(getSalesProductById)
    .filter(Boolean);

  const selectedGroups = [
    ...new Set(selectedProducts.map((product) => product.group).filter(Boolean)),
  ];

  if (selectedGroups.length === 1) {
    return `${selectedGroups[0]} ${selectedProducts.length}개 상품`;
  }

  return `${selectedProducts.length}개 상품`;
}



function updateSalesReportTitle() {
  const title = document.querySelector("#page-sales .calendar-page-title");
  if (!title) return;

  title.innerText =
  `${getSalesProductTitle()} ${getSalesChannelLabel(currentSalesChannel)} 매출보고`;
}

function openSalesModal() {
  // RAW 입력창을 열 때 현재 관리자 채널 목록으로 다시 생성
  renderSalesRawChannelSelect();

  const rawChannelSelect =
    document.getElementById("salesRawChannel");

  if (
    rawChannelSelect &&
    currentSalesChannel !== "all" &&
    Array.from(rawChannelSelect.options).some(
      (option) => option.value === currentSalesChannel
    )
  ) {
    rawChannelSelect.value = currentSalesChannel;
  }

  document.getElementById("salesRawInput").value = "";
  document.getElementById("salesReportStart").value = "";
  document.getElementById("salesReportEnd").value = "";

  document
    .getElementById("salesModalBackdrop")
    .classList.add("show");
}

function closeSalesModal() {
  document.getElementById("salesModalBackdrop").classList.remove("show");
}

function toNumber(value) {
  return Number(String(value || "0").replace(/,/g, "").trim()) || 0;
}

function formatDateKey(dateStr) {
  return String(dateStr || "").slice(0, 10);
}

function formatDateKey(dateStr) {
  return String(dateStr || "").slice(0, 10);
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function parseSalesRawRows(rawRows, channel) {
  if (channel === "coupang") {
    return parseCoupangSalesRawRows(rawRows);
  }

  return parseNaverSalesRawRows(rawRows);
}

function parseNaverSalesRawRows(rawRows) {
  return rawRows
    .map((row) => row.split("\t"))
    .filter((cols) => cols[0] && (cols[0].includes("월") || cols[0].startsWith("202")))
    .map((cols) => {
      const dateText = String(cols[0] || "").trim();

      let date = "";

      // 07월 01일 형식 대응
      if (dateText.includes("월")) {
        const monthMatch = dateText.match(/(\d{1,2})월\s*(\d{1,2})일/);
        const year = currentSalesMonth.getFullYear();

        if (monthMatch) {
          const month = String(monthMatch[1]).padStart(2, "0");
          const day = String(monthMatch[2]).padStart(2, "0");
          date = `${year}-${month}-${day}`;
        }
      } else {
        // 2026-07-01 형식 대응
        date = formatDateKey(dateText);
      }

      return {
        channel: "naver",
        date,

        customers: toNumber(cols[1]),
        orderCount: toNumber(cols[1]),

        sales: toNumber(cols[2]),       // 판매금액
        qty: toNumber(cols[4]),         // 결제상품수량

        refundCount: 0,                 // 더 이상 입력 안받음
        refundAmount: toNumber(cols[3]),// 환불금액
        refundQty: toNumber(cols[5]),   // 환불상품수량
      };
    })
    .filter((row) => row.date);
}

function parseCoupangSalesRawRows(rawRows) {
  return rawRows
    .map((row) => row.split("\t"))
    .filter(
      (cols) =>
        cols[0] &&
        (cols[0].includes("월") || /^\d{4}-\d{1,2}-\d{1,2}/.test(cols[0].trim()))
    )
    .map((cols) => {
      const dateText = String(cols[0] || "").trim();

      let date = "";

      // 07월 01일 형식
      if (dateText.includes("월")) {
        const monthMatch = dateText.match(/(\d{1,2})월\s*(\d{1,2})일/);
        const year = currentSalesMonth.getFullYear();

        if (monthMatch) {
          const month = String(monthMatch[1]).padStart(2, "0");
          const day = String(monthMatch[2]).padStart(2, "0");
          date = `${year}-${month}-${day}`;
        }
      } else {
        // 2026-07-01 형식
        date = formatDateKey(dateText);
      }

      return {
        channel: "coupang",
        date,

        customers: toNumber(cols[1]),
        orderCount: toNumber(cols[1]),

        sales: toNumber(cols[2]),
        refundAmount: toNumber(cols[3]),

        qty: toNumber(cols[4]),
        refundQty: toNumber(cols[5]),

        refundCount: 0,
      };
    })
    .filter((row) => row.date);
}

function buildSalesReportData(rawRows, start, end, channel = "naver", productId = "blackgoat_30") {
  const parsedRows = parseSalesRawRows(rawRows, channel);

  const baseDate = start || parsedRows[0]?.date;
  if (!baseDate) return null;

  const year = Number(baseDate.slice(0, 4));
  const month = Number(baseDate.slice(5, 7));
  const lastDay = getDaysInMonth(year, month);

  const byDate = new Map();
  parsedRows.forEach((row) => {
    byDate.set(row.date, row);
  });

  const dailyRows = [];

  for (let day = 1; day <= lastDay; day++) {
    const dayText = String(day).padStart(2, "0");
    const date = `${year}-${String(month).padStart(2, "0")}-${dayText}`;
    const source = byDate.get(date);

    const isOutOfRange =
      (start && date < start) ||
      (end && date > end);

    dailyRows.push({
      date,
      day,
      customers: source?.customers || 0,
      orderCount: source?.orderCount || 0,
      qty: source?.qty || 0,
      sales: source?.sales || 0,
      refundCount: source?.refundCount || 0,
      refundAmount: source?.refundAmount || 0,
      refundQty: source?.refundQty || 0,
      isOutOfRange,
    });
  }

  const validRows = dailyRows.filter((row) => !row.isOutOfRange);

  const grossSales = validRows.reduce((sum, row) => sum + row.sales, 0);
  const grossQty = validRows.reduce((sum, row) => sum + row.qty, 0);
  const grossCustomer = validRows.reduce((sum, row) => sum + row.customers, 0);

  const refundCount = validRows.reduce((sum, row) => sum + row.refundCount, 0);
  const refundAmount = validRows.reduce((sum, row) => sum + row.refundAmount, 0);
  const refundQty = validRows.reduce((sum, row) => sum + (row.refundQty || 0), 0);

  const totalCustomer = grossCustomer;
  const totalQty = grossQty;
  const totalSales = grossSales;
  const netSales = Math.max(grossSales - refundAmount, 0);

  const monthlyRows = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    sales: i + 1 === month ? totalSales : 0,
    isCurrent: i + 1 === month,
  }));

  return {
    productId,
    productName: getSalesProductName(productId),
    channel,
    year,
    month,
    start,
    end,
    dailyRows,
    monthlyRows,
    totalCustomer,
    totalQty,
    totalSales,
    netSales,
    refundCount,
    refundAmount,
    refundQty,
    avgCustomer: totalCustomer ? Math.round(totalSales / totalCustomer) : 0,
    avgSet: totalQty ? Math.round(totalSales / totalQty) : 0,
    savedAt: new Date().toISOString(),
  };
}

function applySalesRaw() {
  const raw = document.getElementById("salesRawInput").value;
  const channel = document.getElementById("salesRawChannel").value;
  const productId = document.getElementById("salesRawProduct").value;
  const start = document.getElementById("salesReportStart").value;
  const end = document.getElementById("salesReportEnd").value;

  if (!raw.trim()) {
    alert("Raw 데이터를 입력해주세요.");
    return;
  }

  if (!start || !end) {
    alert("기준 시작일과 종료일을 입력해주세요.");
    return;
  }

  const rows = raw.split("\n").filter(Boolean);
  const reportData = buildSalesReportData(rows, start, end, channel, productId);

  if (!reportData) {
    alert("분석할 수 있는 매출 데이터가 없습니다.");
    return;
  }

  saveSalesReportToServer(reportData)
      .then(() => {
      renderSalesReport(getVisibleSalesReport());
      closeSalesModal();
      alert("상품 매출보고가 클라우드에 저장되었습니다.");
    })
    .catch((e) => {
      console.error(e);
      renderSalesReport(reportData);
      closeSalesModal();
      alert("클라우드 저장은 실패했지만 화면에는 반영했습니다.");
    });
}
function renderSalesReport(data) {
  updateSalesMonthLabel();

  document.getElementById("salesTotalCustomers").innerText =
    data.totalCustomer.toLocaleString() + "건";
  document.getElementById("salesTotalQty").innerText =
    data.totalQty.toLocaleString() + "개";
  document.getElementById("salesTotalAmount").innerText =
    data.totalSales.toLocaleString() + "원";
  document.getElementById("salesAvgCustomer").innerText =
    data.avgCustomer.toLocaleString() + "원";
    document.getElementById("salesRefundCount").innerText =
      Number(data.refundQty || 0).toLocaleString() + "개";

    document.getElementById("salesRefundAmount").innerText =
      data.refundAmount.toLocaleString() + "원";

    document.getElementById("salesNetAmount").innerText =
      Number(data.netSales || 0).toLocaleString() + "원";

    renderSalesDailyTable(data.dailyRows);
    renderSalesMonthlyTable(data.monthlyRows);
    renderSalesDailyChart(data.dailyRows);
    renderSalesTopDays(data.dailyRows);
    renderSalesChannelSummary();
    loadSalesSpecialNote();
}

function renderSalesDailyTable(rows) {
  let html = `
    <table class="sales-report-table">
      <tr>
        <th>날짜</th>
        <th>주문건수</th>
        <th>판매수량(개)</th>
        <th>매출(원)</th>
      </tr>
  `;

  rows.forEach((row) => {
    html += `
      <tr class="${row.isOutOfRange ? "out-range" : ""}">
        <td>${row.date.slice(5).replace("-", ".")}</td>
        <td>${row.customers || "-"}</td>
        <td>${row.qty || "-"}</td>
        <td class="amount">${row.sales ? row.sales.toLocaleString() : "0"}</td>
      </tr>
    `;
  });

  html += "</table>";
  document.getElementById("salesDailyTableWrap").innerHTML = html;
}



function renderSalesMonthlyTable(rows) {
  const maxSales = Math.max(...rows.map((row) => Number(row.sales || 0)), 1);

  let html = `<div class="monthly-sales-list vertical">`;

  rows.forEach((row) => {
    const sales = Number(row.sales || 0);
    const height = sales ? Math.max((sales / maxSales) * 100, 8) : 0;

    html += `
      <div class="monthly-sales-col ${row.isCurrent ? "current" : ""}">
        <div class="monthly-amount-vertical">
          ${sales ? sales.toLocaleString() : ""}
        </div>
        <div class="monthly-bar-vertical-wrap">
          <div class="monthly-bar-vertical" style="height:${height}%"></div>
        </div>
        <div>${row.month}월</div>
      </div>
    `;
  });

  html += `</div>`;
  document.getElementById("salesMonthlyTableWrap").innerHTML = html;
}

function renderSalesDailyChart(rows) {
  const canvas = document.getElementById("salesDailyChart");
  if (!canvas) return;

  const parent = canvas.parentElement;
  const width = parent.clientWidth - 36;
  const height = 300;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.height = height + "px";

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const chartRows = (rows || []).filter((row) => !row.isOutOfRange);
  const maxSales = Math.max(...chartRows.map((row) => Number(row.sales || 0)), 1);

  const paddingLeft = 56;
  const paddingRight = 24;
  const paddingTop = 34;
  const paddingBottom = 42;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const NAVER_COLOR = "#2DB400";
  const COUPANG_COLOR = "#E94B22";
  const SINGLE_COLOR = "#1d5fd1";
  const CHANNEL_COLORS = [
    "#1d5fd1",
    "#8b5cf6",
    "#f59e0b",
    "#06b6d4",
    "#ec4899",
    "#64748b",
  ];
  const activeSalesChannels =
    currentSalesChannel === "all"
      ? getActiveSalesChannels()
      : [];
  const getChannelChartColor = (channel, index) => {
    if (channel.id === "naver") return NAVER_COLOR;
    if (channel.id === "coupang") return COUPANG_COLOR;
    return CHANNEL_COLORS[index % CHANNEL_COLORS.length];
  };

  const legend = document.getElementById("salesChartLegend");
  if (legend) {
    if (currentSalesChannel === "all") {
      legend.innerHTML = activeSalesChannels
        .map(
          (channel, index) => `
            <span style="color:${getChannelChartColor(channel, index)}; font-weight:800;">
              ■ ${escapeHtml(getSalesChannelShortName(channel.id))}
            </span>
          `
        )
        .join("&nbsp;&nbsp;");
    } else {
      legend.innerHTML = "";
    }
  }

  ctx.strokeStyle = "#e5eaf2";
  ctx.lineWidth = 1;
  ctx.font = "11px Pretendard";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "right";

  for (let i = 0; i <= 5; i++) {
    const y = paddingTop + (chartHeight / 5) * i;
    const value = Math.round(maxSales - (maxSales / 5) * i);

    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillText(value.toLocaleString(), paddingLeft - 8, y + 4);
  }

  const count = chartRows.length || 1;
  const slotWidth = chartWidth / count;
  const barWidth = Math.min(26, Math.max(10, slotWidth * 0.48));

  chartRows.forEach((row, index) => {
    const totalSales = Number(row.sales || 0);

    const x = paddingLeft + slotWidth * index + slotWidth / 2 - barWidth / 2;
    const baseY = paddingTop + chartHeight;

    const totalHeight = totalSales ? (totalSales / maxSales) * chartHeight : 0;

    if (currentSalesChannel === "all") {
      let stackedHeight = 0;

      activeSalesChannels.forEach((channel, channelIndex) => {
        const channelSales = Number(
          row.channelSales?.[channel.id] || 0
        );
        const channelHeight = channelSales
          ? (channelSales / maxSales) * chartHeight
          : 0;

        ctx.fillStyle = getChannelChartColor(channel, channelIndex);
        ctx.fillRect(
          x,
          baseY - stackedHeight - channelHeight,
          barWidth,
          channelHeight
        );

        stackedHeight += channelHeight;
      });
    } else {
      ctx.fillStyle = SINGLE_COLOR;
      ctx.fillRect(x, baseY - totalHeight, barWidth, totalHeight);
    }

    if (totalSales > 0) {
      ctx.font = "10px Pretendard";
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.fillText(
        totalSales.toLocaleString(),
        x + barWidth / 2,
        baseY - totalHeight - 8
      );
    }

    ctx.font = "11px Pretendard";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText(
      row.date.slice(5).replace("-", "/"),
      x + barWidth / 2,
      height - 12
    );
  });
}


function renderSalesTopDays(rows) {
  const wrap = document.getElementById("salesTopDaysWrap");
  if (!wrap) return;

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const icons = ["🏆", "🥈", "🥉"];

  const topRows = (rows || [])
    .filter((row) => !row.isOutOfRange && Number(row.sales || 0) > 0)
    .sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0))
    .slice(0, 3);

  const fixedRows = [0, 1, 2].map((index) => topRows[index] || null);

  wrap.innerHTML = fixedRows
    .map((row, index) => {
      if (!row) {
        return `
          <div class="top-sales-row">
            <div class="top-rank-icon">${icons[index]}</div>
            <div class="top-sales-date">-</div>
            <div class="top-sales-amount">-</div>
          </div>
        `;
      }

      const dateObj = new Date(row.date);
      const dayName = dayNames[dateObj.getDay()];
      const dateText = row.date.slice(5).replace("-", "/");

      return `
        <div class="top-sales-row">
          <div class="top-rank-icon">${icons[index]}</div>
          <div class="top-sales-date">
            ${dateText}
            <span>(${dayName})</span>
          </div>
          <div class="top-sales-amount">
            ${Number(row.sales || 0).toLocaleString()}원
          </div>
        </div>
      `;
    })
    .join("");
}

function getSalesNoteKey() {
  return `product_sales_note_${currentSalesChannel}_${getSalesMonthKey()}`;
}

let salesNoteSaveTimer = null;

function loadSalesSpecialNote() {
  const noteEl =
    document.getElementById("salesSpecialNote");

  if (!noteEl) return;

  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const noteKey = getSalesNoteKey();

  noteEl.value =
    salesReportCache.notes?.[noteKey]?.text || "";

  setSalesNoteSaveStatus(
    noteEl.value ? "저장됨" : "자동 저장"
  );
}

function setSalesNoteSaveStatus(text, type = "") {
  const statusEl =
    document.getElementById("salesNoteSaveStatus");

  if (!statusEl) return;

  statusEl.innerText = text;

  if (type === "success") {
    statusEl.style.color = "#16a34a";
  } else if (type === "error") {
    statusEl.style.color = "#dc2626";
  } else {
    statusEl.style.color = "#64748b";
  }
}

function saveSalesSpecialNote() {
  const noteEl =
    document.getElementById("salesSpecialNote");

  if (!noteEl) return;

  clearTimeout(salesNoteSaveTimer);

  setSalesNoteSaveStatus("입력 중");

  salesNoteSaveTimer = setTimeout(async () => {
    try {
      setSalesNoteSaveStatus("저장 중");

      salesReportCache =
        normalizeSalesStorage(salesReportCache);

      const noteKey = getSalesNoteKey();
      const text = noteEl.value.trim();
      const currentUser = getCurrentUser();

      if (text) {
        salesReportCache.notes[noteKey] = {
          text,
          productIds: currentSalesProducts
            .map(String)
            .sort(),
          channel: currentSalesChannel,
          monthKey: getSalesMonthKey(),
          savedBy: {
            id: currentUser?.id || "",
            name: currentUser?.name || "",
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        delete salesReportCache.notes[noteKey];
      }

      salesReportCache.updatedAt =
        new Date().toISOString();

      await apiPost(
        "/blackgoat-sales",
        salesReportCache
      );

      setSalesNoteSaveStatus("저장됨", "success");
    } catch (e) {
      console.error(
        "특이사항 클라우드 저장 실패:",
        e
      );

      setSalesNoteSaveStatus("저장 실패", "error");
    }
  }, 200);
}

function saveSalesSpecialNote() {
  const noteEl =
    document.getElementById("salesSpecialNote");

  if (!noteEl) return;

  clearTimeout(salesNoteSaveTimer);

  setSalesNoteSaveStatus("입력 중", "saving");

  salesNoteSaveTimer = setTimeout(async () => {
    try {
      setSalesNoteSaveStatus("저장 중", "saving");

      salesReportCache =
        normalizeSalesStorage(salesReportCache);

      const noteKey = getSalesNoteKey();
      const currentUser = getCurrentUser();
      const text = noteEl.value.trim();

      if (text) {
        salesReportCache.notes[noteKey] = {
          text,
          productIds: currentSalesProducts
            .map(String)
            .sort(),
          channel: currentSalesChannel,
          monthKey: getSalesMonthKey(),
          savedBy: {
            id: currentUser?.id || "",
            name: currentUser?.name || "",
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        delete salesReportCache.notes[noteKey];
      }

      salesReportCache.updatedAt =
        new Date().toISOString();

      await apiPost(
        "/blackgoat-sales",
        salesReportCache
      );

      setSalesNoteSaveStatus("저장됨", "success");

      console.log(
        "특이사항 클라우드 저장 완료:",
        noteKey
      );
    } catch (e) {
      console.error(
        "특이사항 클라우드 저장 실패:",
        e
      );

      setSalesNoteSaveStatus(
        "저장 실패",
        "error"
      );
    }
  }, 700);
}


function renderSalesChannelSummary() {
  const wrap = document.getElementById("salesChannelSummaryWrap");
  if (!wrap) return;

  if (currentSalesChannel !== "all") {
    const report = getVisibleSalesReport();

    const grossSales = (report.dailyRows || [])
      .filter((row) => !row.isOutOfRange)
      .reduce((sum, row) => sum + Number(row.sales || 0), 0);

    const refundAmount = Number(report.refundAmount || 0);
    const netSales = Math.max(grossSales - refundAmount, 0);

    const refundRatio = grossSales
      ? Math.round((refundAmount / grossSales) * 1000) / 10
      : 0;

    const netRatio = Math.max(100 - refundRatio, 0);

    wrap.innerHTML = `
      <div class="channel-summary-row">
        <div class="channel-badge naver">S</div>
        <div>정상매출</div>
        <div class="channel-summary-amount">
          ${netSales.toLocaleString()}원
          <span class="channel-summary-ratio naver">${netRatio}%</span>
        </div>
      </div>

      <div class="channel-summary-row">
        <div class="channel-badge coupang">R</div>
        <div>환불</div>
        <div class="channel-summary-amount">
          ${refundAmount.toLocaleString()}원
          <span class="channel-summary-ratio coupang">${refundRatio}%</span>
        </div>
      </div>
    `;
    return;
  }

  const storage = normalizeSalesStorage(salesReportCache);
  const monthKey = getSalesMonthKey();
  const channels = getActiveSalesChannels();

  const channelRows = channels.map((channel) => {
    let sales = 0;

    currentSalesProducts.forEach((productId) => {
      const product = storage.products?.[productId];
      if (!product) return;

      sales += Number(
        product.channels?.[channel.id]?.months?.[monthKey]?.totalSales || 0
      );
    });

    return {
      channel,
      sales,
    };
  });

  const total = channelRows.reduce(
    (sum, row) => sum + row.sales,
    0
  );

  wrap.innerHTML = channelRows
    .map(({ channel, sales }) => {
      const ratio = total
        ? Math.round((sales / total) * 1000) / 10
        : 0;
      const channelClass =
        channel.id === "naver" || channel.id === "coupang"
          ? channel.id
          : "";
      const shortName = getSalesChannelShortName(channel.id);
      const badge =
        channel.id === "naver"
          ? "N"
          : channel.id === "coupang"
            ? "C"
            : String(shortName || channel.name || channel.id)
                .slice(0, 1)
                .toUpperCase();

      return `
        <div class="channel-summary-row">
          <div class="channel-badge ${channelClass}">${escapeHtml(badge)}</div>
          <div>${escapeHtml(shortName)}</div>
          <div class="channel-summary-amount">
            ${sales.toLocaleString()}원
            <span class="channel-summary-ratio ${channelClass}">${ratio}%</span>
          </div>
        </div>
      `;
    })
    .join("");
}
