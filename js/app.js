      // =========================
      // 사용자 데이터 및 권한 정의
      // =========================




      // =========================
      // 초기 메뉴 데이터
      // =========================

      // =========================
      // 공통 유틸
      // =========================





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
