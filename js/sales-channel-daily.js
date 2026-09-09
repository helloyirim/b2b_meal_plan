function renderChannelDailySalesChannelSelect() {
  const select =
    document.getElementById(
      "channelDailySalesChannel"
    );

  if (!select) return;

  const channels =
    getActiveSalesChannels();

  const currentValue =
    select.value;

  select.innerHTML = channels
    .map(
      (channel) => `
        <option value="${escapeHtml(channel.id)}">
          ${escapeHtml(
            channel.shortName ||
            channel.name
          )}
        </option>
      `
    )
    .join("");

  if (
    currentValue &&
    channels.some(
      (channel) =>
        String(channel.id) ===
        String(currentValue)
    )
  ) {
    select.value = currentValue;
  }
}

// 채널별 일매출에서 현재 선택한 채널
let currentChannelDailySalesChannel = "";


/**
 * 관리자에서 등록한 활성 채널을 탭으로 생성
 */
function renderChannelDailySalesTabs() {
  const container =
    document.getElementById(
      "channelDailySalesTabs"
    );

  if (!container) return;

  const channels =
    getActiveSalesChannels();

  if (!channels.length) {
    currentChannelDailySalesChannel = "";

    container.innerHTML = `
      <div class="product-daily-empty">
        사용 중인 판매 채널이 없습니다.
      </div>
    `;

    return;
  }

  const selectedChannelExists =
    channels.some(
      (channel) =>
        String(channel.id) ===
        String(currentChannelDailySalesChannel)
    );

  // 최초 진입 또는 기존 선택 채널이 사용중지된 경우
  if (!selectedChannelExists) {
    currentChannelDailySalesChannel =
      String(channels[0].id);
  }

  container.innerHTML = channels
    .map(
      (channel) => `
        <button
          type="button"
          class="channel-daily-tab ${
            String(channel.id) ===
            String(currentChannelDailySalesChannel)
              ? "active"
              : ""
          }"
          onclick="selectChannelDailySalesTab('${escapeHtml(
            channel.id
          )}')"
        >
          ${escapeHtml(
            channel.shortName ||
            channel.name
          )}
        </button>
      `
    )
    .join("");
}


/**
 * 채널 탭 선택
 */
function selectChannelDailySalesTab(
  channelId
) {
  currentChannelDailySalesChannel =
    String(channelId || "");

  renderChannelDailySalesTabs();
  renderChannelDailySalesPage();
}

// =========================
// 채널별 일매출 현황
// =========================

function showChannelDailySalesPage() {
  showPage(
    "page-channel-daily-sales"
  );

  document
    .querySelectorAll(
      ".sales-channel-nav"
    )
    .forEach((el) => {
      el.classList.remove("active");
    });

  document
    .getElementById(
      "nav-sales-channel-daily"
    )
    ?.classList.add("active");

  document
    .getElementById(
      "nav-sales-main"
    )
    ?.classList.add("active");

  const dateInput =
    document.getElementById(
      "channelDailySalesDate"
    );

  if (
    dateInput &&
    !dateInput.value
  ) {
    dateInput.value =
      getLatestChannelDailySalesDate() ||
      getTodayDateKey();
  }

  renderChannelDailySalesTabs();
  renderChannelDailySalesPage();
}


function getChannelDailySalesData(
  channelId,
  dateKey
) {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const monthKey =
    getMonthKeyFromDateKey(dateKey);

  const result = {
    qty: 0,
    sales: 0,
    refundAmount: 0,
    refundQty: 0,
    orderCount: 0,
  };

  if (!channelId || !monthKey) {
    return result;
  }

  getActiveSalesProducts().forEach(
    (product) => {
      const report =
        salesReportCache
          .products?.[product.id]
          ?.channels?.[channelId]
          ?.months?.[monthKey];

      const row =
        getSalesDailyRowFromReport(
          report,
          dateKey
        );

      if (!row) return;

      result.qty += Number(
        row.qty || 0
      );

      result.sales += Number(
        row.sales || 0
      );

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
    }
  );

  return result;
}

/**
 * 특정 채널·특정 상품·특정 날짜의 매출 조회
 */
 function getChannelProductDailySalesData(
  channelId,
  productId,
  dateKey
) {
  salesReportCache =
    normalizeSalesStorage(
      salesReportCache
    );

  const monthKey =
    getMonthKeyFromDateKey(
      dateKey
    );

  const report =
    salesReportCache
      .products?.[productId]
      ?.channels?.[channelId]
      ?.months?.[monthKey];

  const row =
    getSalesDailyRowFromReport(
      report,
      dateKey
    );

  if (!row) {
    return {
      orderCount: 0,
      qty: 0,
      sales: 0,
      refundAmount: 0,
      refundQty: 0,
    };
  }

  return {
    orderCount: Number(
      row.orderCount ??
      row.customers ??
      0
    ),

    qty: Number(
      row.qty || 0
    ),

    sales: Number(
      row.sales || 0
    ),

    refundAmount: Number(
      row.refundAmount || 0
    ),

    refundQty: Number(
      row.refundQty || 0
    ),
  };
}


function getLatestChannelDailySalesDate() {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const dates = [];

  const products =
    getActiveSalesProducts();

  const channels =
    getActiveSalesChannels();

  products.forEach((product) => {
    channels.forEach((channel) => {
      const months =
        salesReportCache
          .products?.[product.id]
          ?.channels?.[channel.id]
          ?.months || {};

      Object.values(months).forEach(
        (report) => {
          (report?.dailyRows || [])
            .filter(
              (row) =>
                row?.date &&
                !row.isOutOfRange &&
                (
                  Number(row.sales || 0) > 0 ||
                  Number(row.qty || 0) > 0 ||
                  Number(
                    row.refundAmount || 0
                  ) > 0
                )
            )
            .forEach((row) => {
              dates.push(row.date);
            });
        }
      );
    });
  });

  if (!dates.length) {
    return "";
  }

  return dates.sort().at(-1);
}


function renderChannelDailySalesPage() {
  const dateInput =
    document.getElementById(
      "channelDailySalesDate"
    );

  const wrap =
    document.getElementById(
      "channelDailySalesTableWrap"
    );

  if (!dateInput || !wrap) {
    return;
  }

  const selectedDate =
    dateInput.value ||
    getLatestChannelDailySalesDate() ||
    getTodayDateKey();

  dateInput.value =
    selectedDate;
    
    const footnote =
      document.getElementById(
        "channelDailySalesFootnote"
      );

    if (footnote) {
      footnote.innerText =
        `조회일 ${selectedDate} 기준 · 판매금액과 판매수량은 환불 차감 전이며, 환불금액은 환불 발생일 기준으로 별도 표시됩니다.`;
    }

    const title =
      document.getElementById(
        "channelDailySalesTitle"
      );

    if (title) {
      const channelLabel =
        getSalesChannelLabel(
          currentChannelDailySalesChannel
        );

      title.innerText =
        `${formatDailySalesTitleDate(
          selectedDate
        )} ${channelLabel} 일매출 현황`;
    }

  const selectedChannelId =
    currentChannelDailySalesChannel;

  if (!selectedChannelId) {
    renderChannelDailySummary([]);

    wrap.innerHTML = `
      <div class="product-daily-empty">
        사용 중인 판매 채널이 없습니다.
      </div>
    `;

    return;
  }

  const previousDate =
    addDaysToDateKey(
      selectedDate,
      -1
    );

  const previousWeekDate =
    addDaysToDateKey(
      selectedDate,
      -7
    );

  const products =
    getActiveSalesProducts();

  const rows = products
    .map((product) => {
      const today =
        getChannelProductDailySalesData(
          selectedChannelId,
          product.id,
          selectedDate
        );

      const yesterday =
        getChannelProductDailySalesData(
          selectedChannelId,
          product.id,
          previousDate
        );

      const previousWeek =
        getChannelProductDailySalesData(
          selectedChannelId,
          product.id,
          previousWeekDate
        );

      return {
        productId:
          product.id,

        productName:
          product.name,

        sortOrder: Number(
          product.sortOrder || 999
        ),

        orderCount:
          today.orderCount,

        qty:
          today.qty,

        sales:
          today.sales,

        refundAmount:
          today.refundAmount,

        refundQty:
          today.refundQty,

        previousSales:
          yesterday.sales,

        previousWeekSales:
          previousWeek.sales,

        dayChange:
          getProductSalesChange(
            today.sales,
            yesterday.sales
          ),

        weekChange:
          getProductSalesChange(
            today.sales,
            previousWeek.sales
          ),
      };
    })
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder
    );

  renderChannelDailySummary(rows);

  renderChannelDailySalesTable(
    rows,
    selectedDate,
    previousDate,
    previousWeekDate
  );
}

function renderChannelDailySummary(
  rows
) {
  const totalOrderCount =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.orderCount || 0
        ),
      0
    );

  const totalQty =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.qty || 0),
      0
    );

  const totalSales =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.sales || 0),
      0
    );

  const refundAmount =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.refundAmount || 0
        ),
      0
    );

  document.getElementById(
    "channelDailyOrderCount"
  ).innerText =
    `${totalOrderCount.toLocaleString()}건`;

  document.getElementById(
    "channelDailyTotalQty"
  ).innerText =
    `${totalQty.toLocaleString()}개`;

  document.getElementById(
    "channelDailyTotalSales"
  ).innerText =
    `${totalSales.toLocaleString()}원`;

  document.getElementById(
    "channelDailyRefundAmount"
  ).innerText =
    `${refundAmount.toLocaleString()}원`;
}


function renderChannelDailySalesTable(
  rows,
  selectedDate,
  previousDate,
  previousWeekDate
) {
  const wrap =
    document.getElementById(
      "channelDailySalesTableWrap"
    );

  if (!wrap) return;

  // 실제 판매 또는 환불 데이터가 있는 상품만 표시
  const visibleRows = rows;

  if (!visibleRows.length) {
    wrap.innerHTML = `
      <div class="product-daily-empty">
        ${escapeHtml(selectedDate)}에 판매된 상품이 없습니다.
      </div>
    `;

    return;
  }

  const totalOrderCount =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.orderCount || 0
        ),
      0
    );

  const totalQty =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(row.qty || 0),
      0
    );

  const totalSales =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(row.sales || 0),
      0
    );

  const totalRefund =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.refundAmount || 0
        ),
      0
    );

  const totalPreviousSales =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.previousSales || 0
        ),
      0
    );

  const totalPreviousWeekSales =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.previousWeekSales || 0
        ),
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

  wrap.innerHTML = `
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
            <small>
              ${previousDate}
            </small>
          </th>

          <th>
            전주 대비<br>
            <small>
              ${previousWeekDate}
            </small>
          </th>
        </tr>
      </thead>

      <tbody>
        ${visibleRows
          .map(
            (row) => `
              <tr>
                <td class="product-name">
                  ${escapeHtml(
                    row.productName
                  )}
                </td>

                <td class="number">
                  ${row.orderCount.toLocaleString()}건
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
          <td>합계</td>

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
  `;
}
