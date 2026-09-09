// =========================
// 상품별 일매출 현황
// =========================

function showProductDailySalesPage() {
  showPage("page-product-daily-sales");

  document
    .querySelectorAll(".sales-channel-nav")
    .forEach((el) => el.classList.remove("active"));

  document
    .getElementById("nav-sales-product-daily")
    ?.classList.add("active");

  document
    .getElementById("nav-sales-main")
    ?.classList.add("active");

  const dateInput = document.getElementById(
    "productDailySalesDate"
  );

  if (dateInput && !dateInput.value) {
    dateInput.value =
      getLatestProductDailySalesDate() ||
      getTodayDateKey();
  }

  renderProductDailySalesPage();
}

/**
 * 상품 1개의 특정 날짜 판매 데이터를 채널 합산
 *
 * 판매금액과 판매수량은 환불 차감 전
 * 환불은 별도 반환
 */
function getProductDailySalesData(
  productId,
  dateKey
) {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const monthKey =
    getMonthKeyFromDateKey(dateKey);

  const product =
    salesReportCache.products?.[productId];

  const result = {
    qty: 0,
    sales: 0,
    refundAmount: 0,
    refundQty: 0,
    orderCount: 0,
  };

  if (!product || !monthKey) {
    return result;
  }

  ["naver", "coupang"].forEach((channel) => {
    const report =
      product.channels?.[channel]?.months?.[
        monthKey
      ];

    const row =
      getSalesDailyRowFromReport(
        report,
        dateKey
      );

    if (!row) return;

    result.qty += Number(row.qty || 0);
    result.sales += Number(row.sales || 0);

    result.refundAmount += Number(
      row.refundAmount || 0
    );

    result.refundQty += Number(
      row.refundQty || 0
    );

    result.orderCount += Number(
      row.orderCount ??
      row.customers ??
      0
    );
  });

  return result;
}


/**
 * 매출 데이터가 저장된 가장 최근 날짜 조회
 *
 * 사용 중인 상품 기준
 */
function getLatestProductDailySalesDate() {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const activeProductIds =
    getActiveSalesProducts().map(
      (product) => product.id
    );

  const dates = [];

  activeProductIds.forEach((productId) => {
    const product =
      salesReportCache.products?.[productId];

    if (!product) return;

    ["naver", "coupang"].forEach((channel) => {
      const months =
        product.channels?.[channel]?.months ||
        {};

      Object.values(months).forEach(
        (report) => {
          (report?.dailyRows || []).forEach(
            (row) => {
              if (
                !row.date ||
                row.isOutOfRange
              ) {
                return;
              }

              const hasData =
                Number(row.sales || 0) !== 0 ||
                Number(row.qty || 0) !== 0 ||
                Number(row.refundAmount || 0) !== 0 ||
                Number(row.refundQty || 0) !== 0;

              if (hasData) {
                dates.push(row.date);
              }
            }
          );
        }
      );
    });
  });

  return dates.sort().at(-1) || "";
}

/**
 * 상품별 일매출 페이지 렌더링
 */
function renderProductDailySalesPage() {
  const dateInput = document.getElementById(
    "productDailySalesDate"
  );

  const wrap = document.getElementById(
    "productDailySalesTableWrap"
  );

  if (!dateInput || !wrap) return;

  const selectedDate =
    dateInput.value ||
    getLatestProductDailySalesDate() ||
    getTodayDateKey();

  dateInput.value = selectedDate;

  const title =
    document.getElementById(
      "productDailySalesTitle"
    );

  if (title) {
    title.innerText =
      `${formatDailySalesTitleDate(
        selectedDate
      )} 상품별 일매출 현황`;
  }

  const previousDate =
    addDaysToDateKey(selectedDate, -1);

  const previousWeekDate =
    addDaysToDateKey(selectedDate, -7);

  // 사용 중인 상품만 자동 표시
  const products = getActiveSalesProducts();

  const rows = products.map((product) => {
    const today =
      getProductDailySalesData(
        product.id,
        selectedDate
      );

    const yesterday =
      getProductDailySalesData(
        product.id,
        previousDate
      );

    const previousWeek =
      getProductDailySalesData(
        product.id,
        previousWeekDate
      );

    return {
      productId: product.id,
      productName: product.name,
      sortOrder: Number(
        product.sortOrder || 999
      ),

      orderCount: today.orderCount,
      qty: today.qty,
      sales: today.sales,
      refundAmount: today.refundAmount,
      refundQty: today.refundQty,

      dayChange: getProductSalesChange(
        today.sales,
        yesterday.sales
      ),

      weekChange: getProductSalesChange(
        today.sales,
        previousWeek.sales
      ),
    };
  });

  rows.sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  renderProductDailySummary(rows);
  renderProductDailySalesTable(
    rows,
    selectedDate,
    previousDate,
    previousWeekDate
  );
}


/**
 * 상단 KPI 렌더링
 */
function renderProductDailySummary(rows) {

  const totalOrderCount = rows.reduce(
    (sum, row) =>
      sum + Number(row.orderCount || 0),
    0
  );

  const totalQty = rows.reduce(
    (sum, row) => sum + row.qty,
    0
  );

  const totalSales = rows.reduce(
    (sum, row) => sum + row.sales,
    0
  );

  const refundAmount = rows.reduce(
    (sum, row) => sum + row.refundAmount,
    0
  );

  document.getElementById(
    "productDailyOrderCount"
  ).innerText =
      `${totalOrderCount.toLocaleString()}건`;

  document.getElementById(
    "productDailyTotalQty"
  ).innerText =
    `${totalQty.toLocaleString()}개`;

  document.getElementById(
    "productDailyTotalSales"
  ).innerText =
    `${totalSales.toLocaleString()}원`;

  document.getElementById(
    "productDailyRefundAmount"
  ).innerText =
    `${refundAmount.toLocaleString()}원`;
}


/**
 * 상품별 표 렌더링
 */
function renderProductDailySalesTable(
  rows,
  selectedDate,
  previousDate,
  previousWeekDate
) {
  const wrap = document.getElementById(
    "productDailySalesTableWrap"
  );

  if (!wrap) return;

  if (!rows.length) {
    wrap.innerHTML = `
      <div class="product-daily-empty">
        사용 중인 상품이 없습니다.
      </div>
    `;
    return;
  }

  const totalOrderCount = rows.reduce(
    (sum, row) =>
      sum + Number(row.orderCount || 0),
    0
  );

  const totalQty = rows.reduce(
    (sum, row) => sum + row.qty,
    0
  );

  const totalSales = rows.reduce(
    (sum, row) => sum + row.sales,
    0
  );

  const totalRefund = rows.reduce(
    (sum, row) => sum + row.refundAmount,
    0
  );

  const totalPreviousSales = rows.reduce(
    (sum, row) => {
      const productData =
        getProductDailySalesData(
          row.productId,
          previousDate
        );

      return sum + productData.sales;
    },
    0
  );

  const totalPreviousWeekSales = rows.reduce(
    (sum, row) => {
      const productData =
        getProductDailySalesData(
          row.productId,
          previousWeekDate
        );

      return sum + productData.sales;
    },
    0
  );

  const totalDayChange =
    getProductSalesChange(
      totalSales,
      totalPreviousSales
    );

  const totalWeekChange =
    getProductSalesChange(
      totalSales,
      totalPreviousWeekSales
    );

  const html = `
    <table class="product-daily-table">
      <colgroup>
          <col style="width:22%;">
          <col style="width:10%;">
          <col style="width:10%;">
          <col style="width:15%;">
          <col style="width:13%;">
          <col style="width:15%;">
          <col style="width:15%;">
      </colgroup>


      <thead>
        <tr>
          <th>상품명</th>
          <th>주문건수</th>
          <th>판매수량</th>
          <th>판매금액</th>
          <th>환불금액</th>
          <th>
            전일 대비<br>
            <small>${previousDate}</small>
          </th>
          <th>
            전주 대비<br>
            <small>${previousWeekDate}</small>
          </th>
        </tr>
      </thead>

      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td class="product-name">
                  ${escapeHtml(row.productName)}
                </td>

                <td class="number">
                  ${Number(row.orderCount || 0).toLocaleString()}건
                </td>

                <td class="number">
                  ${row.qty.toLocaleString()}개
                </td>

                <td class="sales-amount">
                  ${row.sales.toLocaleString()}원
                </td>

                <td class="refund-amount">
                  ${
                    row.refundAmount
                      ? `${row.refundAmount.toLocaleString()}원`
                      : "-"
                  }
                </td>

                <td>
                  ${renderProductSalesChange(
                    row.dayChange
                  )}
                </td>

                <td>
                  ${renderProductSalesChange(
                    row.weekChange
                  )}
                </td>
              </tr>
            `
          )
          .join("")}

        <tr class="total-row">
          <td class="product-name">
            합계
          </td>

          <td class="number">
            ${totalOrderCount.toLocaleString()}건
          </td>

          <td class="number">
            ${totalQty.toLocaleString()}개
          </td>

          <td class="sales-amount">
            ${totalSales.toLocaleString()}원
          </td>

          <td class="refund-amount">
            ${
              totalRefund
                ? `${totalRefund.toLocaleString()}원`
                : "-"
            }
          </td>

          <td>
            ${renderProductSalesChange(
              totalDayChange
            )}
          </td>

          <td>
            ${renderProductSalesChange(
              totalWeekChange
            )}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="muted">
      조회일 ${selectedDate} 기준 · 판매금액과 판매수량은 환불 차감 전이며,
      환불은 환불 발생일 기준으로 별도 표시됩니다.
    </div>
  `;

  wrap.innerHTML = html;
}
