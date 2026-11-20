      function getCurrentUser() {
        return JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      }

      function isAdmin() {
        const user = getCurrentUser();
        return user && user.role === "ADMIN";
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
          if (result.token && result.expiresAt) {
            sessionStorage.setItem("managementGoalsToken", result.token);
            sessionStorage.setItem("managementGoalsTokenExpiresAt", result.expiresAt);
          } else {
            sessionStorage.removeItem("managementGoalsToken");
            sessionStorage.removeItem("managementGoalsTokenExpiresAt");
          }
          alert(`${result.user.name}님 환영합니다.`);
          location.reload();
        } catch (e) {
          console.error(e);
          alert("로그인 처리 중 오류가 발생했습니다.");
        }
      }

      async function initAuth() {
        let session = getCurrentUser();
        const overlay = document.getElementById("login-overlay");

        const token = getApiSessionToken();
        if (!session || !session.id || !token) {
          overlay.style.display = "flex";
          return false;
        }

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: createAuthenticatedApiHeaders(),
          });
          if (!response.ok) throw new Error(`AUTH_ME_FAILED_${response.status}`);
          const result = await response.json();
          session = result.user || {};
          sessionStorage.setItem("currentUser", JSON.stringify(session));
        } catch (error) {
          console.warn("로그인 세션 확인 실패:", error);
          sessionStorage.removeItem("currentUser");
          sessionStorage.removeItem("managementGoalsToken");
          sessionStorage.removeItem("managementGoalsTokenExpiresAt");
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

        return true;
      }

      function applyViewerMode() {
        applyMenuPermissionNavigation();
        applyReadOnlyMenuControls();

        const salesBtn = document.getElementById("openSalesModalBtn");
        if (salesBtn) salesBtn.style.display = canWriteMenu("sales") ? "" : "none";

        if (!canWriteMenu("sales")) document.querySelectorAll("#page-sales input, #page-sales textarea, #page-sales select, #page-sales button")
          .forEach((el) => {
            if (el.closest(".calendar-month-nav")) return;
            if (el.id === "salesProductAll") return;
            if (el.classList.contains("sales-product-check")) return;

            el.disabled = true;
          });
      }

      async function logout() {
        if (confirm("로그아웃 하시겠습니까?")) {
          const token = sessionStorage.getItem("managementGoalsToken") || "";
          try {
            if (token) {
              await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              });
            }
          } catch (error) {
            console.warn("서버 로그아웃 요청 실패:", error);
          } finally {
            sessionStorage.removeItem("currentUser");
            sessionStorage.removeItem("managementGoalsToken");
            sessionStorage.removeItem("managementGoalsTokenExpiresAt");
            location.reload();
          }
        }
      }
