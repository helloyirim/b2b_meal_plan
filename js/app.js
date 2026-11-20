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
      document.addEventListener("DOMContentLoaded", async () => {
        const authed = await initAuth();
        if (!authed) return;

        localStorage.removeItem("b2b_plans_cache");
        localStorage.removeItem("b2b_menus_cache");

        applyMenuPermissionNavigation();
        const initialPage = getFirstAccessiblePage();
        if (initialPage) {
          showPage(initialPage);
        } else {
          document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
          alert("접근 가능한 메뉴가 없습니다.");
        }
        setTimeout(applyViewerMode, 300);

        //10. loadSalesReportFromServer() 실행 순서 수정
        if (canReadMenu("mealCreate") || canReadMenu("mealManagement") || canReadMenu("menuManagement")) {
          loadMenusFromServer();
        }
        if (canReadMenu("mealCreate") || canReadMenu("mealManagement")) {
          loadPlansFromServer();
        }

        if (canReadMenu("sales")) {
          await loadSalesProductsFromServer();
          await loadSalesChannelsFromServer();

          renderSalesProductFilter();
          renderSalesRawProductSelect();
          renderSalesChannelNavigation();
          renderSalesRawChannelSelect();
          renderChannelDailySalesTabs();
          applyMenuPermissionNavigation();

          await loadSalesReportFromServer();
        }

        const resetSalesRawBtn = document.getElementById("resetSalesRawBtn");

        if (resetSalesRawBtn) {
          resetSalesRawBtn.addEventListener("click", () => {
            document.getElementById("salesRawInput").value = "";
            document.getElementById("salesReportStart").value = "";
            document.getElementById("salesReportEnd").value = "";
          });
        }
      });
