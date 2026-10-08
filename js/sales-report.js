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
