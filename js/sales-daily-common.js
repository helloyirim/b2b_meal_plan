/**
 * 2026-08-01 → 08.01
 */
 function formatDailySalesTitleDate(dateKey) {
  if (!dateKey) return "";

  const parts = String(dateKey).split("-");

  if (parts.length !== 3) {
    return dateKey;
  }

  const month = parts[1];
  const day = parts[2];

  return `${month}.${day}`;
}

/**
 * 로컬 시간 기준 오늘 날짜를 YYYY-MM-DD로 반환
 */
function getTodayDateKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}


/**
 * YYYY-MM-DD 날짜에 일수를 더하거나 뺌
 * 예: addDaysToDateKey("2026-07-31", -1)
 */
function addDaysToDateKey(dateKey, amount) {
  if (!dateKey) return "";

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() + amount);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}


/**
 * YYYY-MM-DD에서 YYYY-MM 반환
 */
function getMonthKeyFromDateKey(dateKey) {
  return String(dateKey || "").slice(0, 7);
}


/**
 * 특정 보고서에서 특정 날짜 행 조회
 */
function getSalesDailyRowFromReport(report, dateKey) {
  if (!report) return null;

  return (report.dailyRows || []).find(
    (row) =>
      row.date === dateKey &&
      !row.isOutOfRange
  ) || null;
}


/**
 * 전일·전주 대비 표시값 계산
 *
 * 비교일 0원, 당일 매출 발생 → 신규
 * 비교일 매출 있음, 당일 0원 → ▼100%
 * 둘 다 0원 → -
 */
function getProductSalesChange(
  currentSales,
  previousSales
) {
  const current =
    Number(currentSales || 0);

  const previous =
    Number(previousSales || 0);

  const amount = current - previous;

  if (previous === 0 && current === 0) {
    return {
      type: "none",
      label: "-",
      amount: 0,
    };
  }

  if (previous === 0 && current > 0) {
    return {
      type: "up",
      label: "신규",
      amount,
    };
  }

  const rate =
    ((current - previous) / previous) * 100;

  if (rate > 0) {
    return {
      type: "up",
      label: `▲ ${formatSalesChangeRate(rate)}`,
      amount,
    };
  }

  if (rate < 0) {
    return {
      type: "down",
      label: `▼ ${formatSalesChangeRate(
        Math.abs(rate)
      )}`,
      amount,
    };
  }

  return {
    type: "same",
    label: "0.0%",
    amount: 0,
  };
}


function formatSalesChangeRate(rate) {
  return `${Math.round(rate * 10) / 10}%`;
}


function formatSignedSalesAmount(amount) {
  const value = Number(amount || 0);

  if (value > 0) {
    return `+${value.toLocaleString()}원`;
  }

  if (value < 0) {
    return `${value.toLocaleString()}원`;
  }

  return "0원";
}


function renderProductSalesChange(change) {
  return `
    <div class="sales-change ${change.type}">
      <span class="sales-change-rate">
        ${change.label}
      </span>

      ${
        change.type === "none"
          ? ""
          : `
            <span class="sales-change-amount">
              ${formatSignedSalesAmount(
                change.amount
              )}
            </span>
          `
      }
    </div>
  `;
}
