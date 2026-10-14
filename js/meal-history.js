      let historyPlansCache = [];

      async function loadPlansFromServer() {
        try {
          const plans = await apiGet("/plans");

          historyPlansCache = Array.isArray(plans)
            ? plans.filter(
                (item) =>
                  item &&
                  typeof item === "object" &&
                  item.data &&
                  typeof item.name === "string",
              )
            : [];

          //localStorage.setItem('b2b_plans_cache', JSON.stringify(historyPlansCache)); --삭제
          return historyPlansCache;
        } catch (e) {
          console.error("식단 로딩 실패:", e);
          //const cached = localStorage.getItem('b2b_plans_cache'); --삭제
          historyPlansCache = [];
          return [];
        }
      }

      async function savePlanToServer(plan) {
        const result = await apiPost("/plans", plan);
        await loadPlansFromServer();
        return result;
      }

      async function deletePlan(id) {
        if (!confirm("삭제하시겠습니까?")) return;

        try {
          await apiDelete(`/plans/${id}`);
          await renderHistoryList();
          document.getElementById("history-detail").innerHTML =
            '<p style="color:#ccc; text-align:center; margin-top:100px;">이력을 선택하면 상세 내용을 볼 수 있습니다.</p>';
        } catch (e) {
          console.error("삭제 실패:", e);
          alert("삭제에 실패했습니다.");
        }
      }

      async function renderHistoryList() {
        const sidebar = document.getElementById("history-sidebar");
        if (!sidebar) return;

        const plans = await loadPlansFromServer();

        if (!plans || plans.length === 0) {
          sidebar.innerHTML =
            "<p style='color:#999; font-size:12px; text-align:center;'>저장된 이력이 없습니다.</p>";
          return;
        }

        const sortedPlans = [...plans].sort(
          (a, b) => (b.id || 0) - (a.id || 0),
        );

        sidebar.innerHTML = sortedPlans
          .map(
            (p) => `
                <div class="history-card" onclick="viewHistoryDetail(${p.id}, this)">
                    <b>${escapeHtml(p.name || "")}</b>
                    <span>${escapeHtml(p.date || "")}</span><br>
                    <span>저장자: ${escapeHtml(p.savedBy?.name || "알 수 없음")}</span>
                    <button class="btn-red delete-btn" onclick="event.stopPropagation(); deletePlan(${p.id})">삭제</button>
                </div>
            `,
          )
          .join("");
      }

      async function viewHistoryDetail(id, el) {
        document
          .querySelectorAll(".history-card")
          .forEach((c) => c.classList.remove("active"));
        if (el) el.classList.add("active");

        const plans = historyPlansCache.length
          ? historyPlansCache
          : await loadPlansFromServer();
        const plan = plans.find((p) => String(p.id) === String(id));
        const detail = document.getElementById("history-detail");

        if (!plan) {
          detail.innerHTML = `<p>해당 식단을 찾을 수 없습니다.</p>`;
          return;
        }

        detail.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h3>${escapeHtml(plan.name || "")}</h3>
                        <div style="font-size:12px; color:#777; margin-top:6px;">
                            저장자: ${escapeHtml(plan.savedBy?.name || "알 수 없음")} / 저장일시: ${escapeHtml(plan.date || "")}
                        </div>
                    </div>
                    <button class="btn btn-save" onclick="loadPlan(${plan.id})">이 식단 불러오기</button>
                </div>
                <div class="show-brand show-price">${renderStaticGrid(plan)}</div>
            `;
      }

      function renderStaticGrid(plan) {
        const selectedDays =
          Array.isArray(plan.selectedDays) && plan.selectedDays.length
            ? plan.selectedDays
            : [1, 2, 3, 4, 5];

        let html = `
                <table class="meal-table">
                    <thead>
                        <tr>
                            <th></th>
                            ${selectedDays.map((day) => `<th>${DAY_LABELS[day]}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
            `;

        const weeks = parseInt(plan.weeks || 1, 10);

        for (let w = 0; w < weeks; w++) {
          html += `<tr><td class="week-label">${w + 1}주</td>`;

          selectedDays.forEach((day) => {
            const cid = `cell-${w}-${day}`;
            const m = plan.data?.[cid];
            html += `<td>${m ? renderCell(m) : ""}</td>`;
          });

          html += `</tr>`;
        }

        html += `</tbody></table>`;
        return html;
      }
