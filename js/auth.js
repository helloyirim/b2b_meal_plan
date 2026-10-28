      function getCurrentUser() {
        return JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      }

      function isAdmin() {
        const user = getCurrentUser();
        return user && user.id === "yirim.yu" && user.role === "ADMIN";
      }

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
