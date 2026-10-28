      const DAY_LABELS = {  
        1: "월",
        2: "화",
        3: "수",
        4: "목",
        5: "금",
        6: "토",
        0: "일",
      };

      let mealPlan = {};

      let currentCellId = "cell-0-0";
      function getSelectedDays() {
        const checked = Array.from(
          document.querySelectorAll(".day-check:checked"),
        ).map((el) => parseInt(el.value, 10));

        // 아무것도 선택 안 하면 월~금 기본
        return checked.length > 0 ? checked : [1, 2, 3, 4, 5];
      }
      function validateMonday(input) {
        const date = new Date(input.value);
        if (date.getDay() !== 1) {
          alert("시작일은 월요일만 선택 가능합니다.");
          input.value = "";
          return;
        }
        initGrid();
      }
      function initGrid() {
        const startStr = document.getElementById("start-date").value;
        const weeks = parseInt(document.getElementById("week-count").value, 10);
        const selectedDays = getSelectedDays();
        const container = document.getElementById("grid-container");

        // 선택된 요일이 없으면 안내
        if (!selectedDays.length) {
          container.innerHTML = `<p style="color:#999; text-align:center; padding:40px;">요일을 1개 이상 선택해주세요.</p>`;
          updateStats();
          return;
        }

        let html = `
                <table class="meal-table">
                    <colgroup>
                        <col class="week-col">
                        ${selectedDays.map(() => `<col>`).join("")}
                    </colgroup>
                    <thead>
                        <tr>
                            <th class="week-label"></th>
                            ${selectedDays.map((day) => `<th>${DAY_LABELS[day]}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
            `;

        for (let w = 0; w < weeks; w++) {
          html += `<tr><td class="week-label">${w + 1}주</td>`;

          selectedDays.forEach((day) => {
            const cid = `cell-${w}-${day}`;
            let dateLabel = "";

            if (startStr) {
              const startDate = new Date(startStr);
              const monday = new Date(startDate);
              monday.setDate(startDate.getDate() + w * 7);

              const cellDate = new Date(monday);
              const offset = day === 0 ? 6 : day - 1; // 월=0, 화=1 ... 일=6
              cellDate.setDate(monday.getDate() + offset);

              dateLabel = `${cellDate.getMonth() + 1}/${cellDate.getDate()}`;
            }

            html += `
                        <td onclick="selectCell('${cid}')">
                            <div id="${cid}" class="drop-zone ${currentCellId === cid ? "selected" : ""}">
                                <span class="cell-date">${dateLabel}</span>
                                <div class="cell-content">${mealPlan[cid] ? renderCell(mealPlan[cid]) : ""}</div>
                            </div>
                        </td>
                    `;
          });

          html += `</tr>`;
        }

        html += `</tbody></table>`;
        container.innerHTML = html;

        // 현재 선택 셀이 안 보이는 요일이면 첫 번째 셀 선택
        if (!document.getElementById(currentCellId)) {
          currentCellId = `cell-0-${selectedDays[0]}`;
          if (document.getElementById(currentCellId)) {
            document.getElementById(currentCellId).classList.add("selected");
          }
        }

        updateStats();
      }
      function selectCell(id) {
        if (document.getElementById(currentCellId)) {
          document.getElementById(currentCellId).classList.remove("selected");
        }
        currentCellId = id;
        if (document.getElementById(id)) {
          document.getElementById(id).classList.add("selected");
        }
      }
      function addToGrid(mid) {
        const menu = menus.find((m) => String(m.id) === String(mid));
        if (!menu) return;

        mealPlan[currentCellId] = {
          menuId: String(menu.id)
        };

        const targetCell = document.getElementById(currentCellId);
        if (targetCell) {
          const content = targetCell.querySelector(".cell-content");
          if (content) content.innerHTML = renderCell(menu);
        }

        updateStats();

        const selectedDays = getSelectedDays();
        const parts = currentCellId.split("-");
        let w = parseInt(parts[1], 10);
        let day = parseInt(parts[2], 10);

        const currentIndex = selectedDays.indexOf(day);

        if (currentIndex === -1) {
          // 현재 day가 선택 목록에 없으면 첫 번째로
          selectCell(`cell-${w}-${selectedDays[0]}`);
          return;
        }

        let nextIndex = currentIndex + 1;

        if (nextIndex >= selectedDays.length) {
          nextIndex = 0;
          w += 1;
        }

        if (w < parseInt(document.getElementById("week-count").value, 10)) {
          selectCell(`cell-${w}-${selectedDays[nextIndex]}`);
        }
      }
      function resolveMenuData(item) {
        if (!item) return null;

        const menuId = item.menuId || item.id;
        const found = menus.find((m) => String(m.id) === String(menuId));

        return found || item;
      }
      function renderCell(m) {
        m = resolveMenuData(m);
        if (!m) return "";

        return `
                <div class="meal-content">
                    <div class="meal-thumb">
                        <img src="${escapeHtml(getDefaultImage(m.img || m.image || ""))}">
                    </div>
                    <span class="meal-title">${escapeHtml(m.name || "")}</span>
                    <div class="extra-info info-brand">${escapeHtml(m.brand || "")}</div>
                    <div class="extra-info info-price">${(m.price || 0).toLocaleString()}원</div>
                    <div class="extra-info info-allergy">${escapeHtml(m.allergy || "")}</div>
                    <div class="extra-info info-memo">${escapeHtml(m.memo || "")}</div>
                </div>
            `;
      }
      function updateStats() {
        const meals = Object.values(mealPlan)
          .map(resolveMenuData)
          .filter(Boolean);

        const uniqueCount = new Set(meals.map(m => m.name)).size;

        const avg =
          meals.length > 0
            ? Math.round(
                meals.reduce((sum, m) => sum + Number(m.price || 0), 0) /
                  meals.length
              )
            : 0;

        document.getElementById("stat-avg").innerText = avg.toLocaleString();
        document.getElementById("stat-total").innerText = meals.length + "개";
        document.getElementById("stat-unique").innerText =
          meals.length ? `(중복 제외 ${uniqueCount}종)` : "";
      }
      function toggleInfo(cls, cb) {
        const container = document.getElementById("grid-container");
        if (!container) return;
        cb.checked
          ? container.classList.add(cls)
          : container.classList.remove(cls);
      }
      async function savePlan() {
        if (Object.keys(mealPlan).length === 0) {
          return alert("저장할 식단이 없습니다.");
        }

        const planName = prompt("식단 이름을 입력해주세요:");
        if (!planName) return;

        const currentUser = getCurrentUser();
        const now = new Date();

        const plan = {
          id: Date.now(),
          name: planName,
          date: now.toLocaleString("ko-KR"),
          savedAt: now.toISOString(),
          savedBy: {
            id: currentUser.id || "",
            name: currentUser.name || "알 수 없음",
            role: currentUser.role || "",
          },
          data: Object.fromEntries(
            Object.entries(mealPlan).map(([cellId, item]) => {
              const menuId = item.menuId || item.id;
              return [cellId, { menuId: String(menuId) }];
            })
          ),
          weeks: document.getElementById("week-count").value,
          startDate: document.getElementById("start-date").value,
          selectedDays: getSelectedDays(),
        };

        try {
          await savePlanToServer(plan);
          alert("식단이 저장되었습니다.");
          await renderHistoryList();
        } catch (e) {
          console.error(e);
          alert("식단 저장에 실패했습니다.");
        }
      }

      async function loadPlan(id) {
        try {
          const plans = historyPlansCache.length
            ? historyPlansCache
            : await loadPlansFromServer();
          const plan = plans.find((p) => String(p.id) === String(id));

          if (!plan) return alert("식단을 찾을 수 없습니다.");

          mealPlan = plan.data || {};
          document.getElementById("week-count").value = plan.weeks || 1;
          document.getElementById("start-date").value = plan.startDate || "";

          const selectedDays =
            Array.isArray(plan.selectedDays) && plan.selectedDays.length
              ? plan.selectedDays
              : [1, 2, 3, 4, 5];

          document.querySelectorAll(".day-check").forEach((el) => {
            el.checked = selectedDays.includes(parseInt(el.value, 10));
          });

          currentCellId = `cell-0-${selectedDays[0]}`;
          showPage("page-generate");
        } catch (e) {
          console.error(e);
          alert("식단 불러오기에 실패했습니다.");
        }
      }




