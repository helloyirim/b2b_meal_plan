      // =========================
      // 사용자 데이터 및 권한 정의
      // =========================




      // =========================
      // 초기 메뉴 데이터
      // =========================

      // =========================
      // 공통 유틸
      // =========================
      function escapeHtml(str = "") {
        return String(str)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function getCurrentUser() {
        return JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      }

      function isAdmin() {
        const user = getCurrentUser();
        return user && user.id === "yirim.yu" && user.role === "ADMIN";
      }



      // =========================
      // 인증/세션
      // =========================
      async function checkLogin() {
        const id = document.getElementById("login-id").value.trim();
        const pw = document.getElementById("login-pw").value.trim();

        if (!id || !pw) {
          alert("아이디와 비밀번호를 입력해주세요.");
          return;
        }

        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, pw }),
          });

          if (!response.ok) {
            alert("아이디 또는 비밀번호가 틀렸습니다.");
            return;
          }

          const result = await response.json();

          sessionStorage.setItem("currentUser", JSON.stringify(result.user));
          alert(`${result.user.name}님 환영합니다.`);
          location.reload();
        } catch (e) {
          console.error(e);
          alert("로그인 처리 중 오류가 발생했습니다.");
        }
      }

      function initAuth() {
        const session = getCurrentUser();
        const overlay = document.getElementById("login-overlay");

        if (!session || !session.id) {
          overlay.style.display = "flex";
          return false;
        }

        overlay.style.display = "none";

        if (document.getElementById("current-user-name")) {
          document.getElementById("current-user-name").innerText =
            session.name || "로그인 사용자";

            const adminNav = document.getElementById("nav-admin");
            if (adminNav && isAdmin()) {
              adminNav.style.display = "block";
            }
        }

        if (session.role === "USER") {
          const historyNav = document.getElementById("nav-his");
          const settingsNav = document.getElementById("nav-set");
          showPage("page-generate");
        }

        return true;
      }

      function applyViewerMode() {
        const session = getCurrentUser();
        if (session.role !== "VIEWER") return;

        // 상품 매출보고로 강제 이동
        showSalesPage("all");

        // 상품매출보고 외 메뉴는 보이되 클릭 막기
        ["nav-calendar", "nav-gen", "nav-his", "nav-set"].forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;

          el.style.opacity = "0.45";
          el.style.cursor = "not-allowed";
          el.onclick = () => {
            alert("조회전용 계정은 상품 매출보고만 확인 가능합니다.");
          };
        });

        // 입력 버튼 숨김
        const salesBtn = document.getElementById("openSalesModalBtn");
        if (salesBtn) salesBtn.style.display = "none";

        // 상품/월 조회용 컨트롤은 살리고, 나머지 입력은 막기
        document.querySelectorAll("#page-sales input, #page-sales textarea, #page-sales select, #page-sales button")
          .forEach((el) => {
            if (el.closest(".calendar-month-nav")) return;
            if (el.id === "salesProductAll") return;
            if (el.classList.contains("sales-product-check")) return;

            el.disabled = true;
          });
      }

      function logout() {
        if (confirm("로그아웃 하시겠습니까?")) {
          sessionStorage.removeItem("currentUser");
          location.reload();
        }
      }

      // =========================
      // 메뉴 API
      // =========================


      // =========================
      // 식단 API
      // =========================



      // =========================
      // 페이지
      // =========================
      function showPage(id) {
        document
          .querySelectorAll(".page")
          .forEach((p) => p.classList.remove("active"));
        document
          .querySelectorAll(".nav-item")
          .forEach((n) => n.classList.remove("active"));

        document.getElementById(id).classList.add("active");

        if (id === "page-generate") {
          document.getElementById("nav-meal-main").classList.add("active");
          document.getElementById("nav-gen").classList.add("active");
          initGrid();
          populateLibBrandFilter();
          renderLib();
        }
        if (id === "page-calendar") {
          document.getElementById("nav-calendar").classList.add("active");
          initDeliveryCalendarPage();
        }
        if (id === "page-sales") {
          document.getElementById("nav-sales-main").classList.add("active");

          const activeNav = document.getElementById(`nav-sales-${currentSalesChannel}`);
          if (activeNav) activeNav.classList.add("active");
        }
        if (id === "page-product-daily-sales") {
          document
            .getElementById("nav-sales-main")
            ?.classList.add("active");

          document
            .getElementById("nav-sales-product-daily")
            ?.classList.add("active");
        }
        if (id === "page-channel-daily-sales") {
          document
            .getElementById("nav-sales-main")
            ?.classList.add("active");

          document
            .getElementById("nav-sales-channel-daily")
            ?.classList.add("active");
        }
        if (id === "page-history") {
          document.getElementById("nav-meal-main").classList.add("active");
          document.getElementById("nav-his").classList.add("active");
          renderHistoryList();
        }
        if (id === "page-settings") {
          document.getElementById("nav-meal-main").classList.add("active");
          document.getElementById("nav-set").classList.add("active");
          renderMgmt();
        }
        if (id === "page-admin") {
          if (!isAdmin()) {
            alert("관리자만 접근 가능합니다.");
            showPage("page-calendar");
            return;
          }

          document
            .getElementById("nav-admin")
            ?.classList.add("active");

          showAdminTab("account");
        }

      }


      // =========================
      // 식단 그리드
      // =========================








      // =========================
      // 식단 이력
      // =========================





      // =========================
      // 메뉴 라이브러리/관리
      // =========================
      // 🔽 이거 추가
      // 🔼 여기까지 추가






      // =========================
      // 관리자 탭 전환
      // =========================

      function showAdminTab(tabName = "account") {
        const accountButton = document.getElementById(
          "adminTabAccountButton"
        );

        const salesButton = document.getElementById(
          "adminTabSalesButton"
        );

        const accountContent = document.getElementById(
          "adminTabAccount"
        );

        const salesContent = document.getElementById(
          "adminTabSales"
        );

        if (
          !accountButton ||
          !salesButton ||
          !accountContent ||
          !salesContent
        ) {
          return;
        }

        const isSalesTab = tabName === "sales";

        accountButton.classList.toggle(
          "active",
          !isSalesTab
        );

        salesButton.classList.toggle(
          "active",
          isSalesTab
        );

        accountContent.classList.toggle(
          "active",
          !isSalesTab
        );

        salesContent.classList.toggle(
          "active",
          isSalesTab
        );

        if (isSalesTab) {
          renderAdminSalesProducts();
          renderAdminSalesChannels();

          const originalChannelId =
            document.getElementById(
              "adminSalesChannelOriginalId"
            )?.value;

          if (!originalChannelId) {
            const sortOrderInput =
              document.getElementById(
                "adminSalesChannelSortOrder"
              );

            if (sortOrderInput) {
              sortOrderInput.value =
                getNextSalesChannelSortOrder();
            }
          }
        } else {
          renderAdminUsers();
        }
      }

      // =========================
      // 초기 실행
      // =========================
      window.addEventListener("load", async () => {
        const authed = initAuth();
        if (!authed) return;

        localStorage.removeItem("b2b_plans_cache");
        localStorage.removeItem("b2b_menus_cache");

        showPage("page-calendar");
        setTimeout(applyViewerMode, 300);

        //10. loadSalesReportFromServer() 실행 순서 수정
        loadMenusFromServer();
        loadPlansFromServer();

        await loadSalesProductsFromServer();
        await loadSalesChannelsFromServer();

        renderSalesProductFilter();
        renderSalesRawProductSelect();
        renderSalesChannelNavigation();
        renderSalesRawChannelSelect();
        renderChannelDailySalesTabs();

        await loadSalesReportFromServer();

        const resetSalesRawBtn = document.getElementById("resetSalesRawBtn");

        if (resetSalesRawBtn) {
          resetSalesRawBtn.addEventListener("click", () => {
            document.getElementById("salesRawInput").value = "";
            document.getElementById("salesReportStart").value = "";
            document.getElementById("salesReportEnd").value = "";
          });
        }
      });
