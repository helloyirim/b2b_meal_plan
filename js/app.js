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





      // =========================
      // 인증/세션
      // =========================




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
