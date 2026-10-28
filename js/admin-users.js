      // =========================
      // 관리자 - 계정 관리
      // =========================
      let adminUsersCache = [];

      async function loadAdminUsers() {
        try {
          const data = await apiGet("/users");
          adminUsersCache = Array.isArray(data) ? data : [];
          return adminUsersCache;
        } catch (e) {
          console.error("계정 목록 로딩 실패:", e);
          alert("계정 목록을 불러오지 못했습니다. API에 /users 경로가 필요합니다.");
          return [];
        }
      }

      async function renderAdminUsers() {
        const list = document.getElementById("adminUserList");
        if (!list) return;

        const users = await loadAdminUsers();

        if (!users.length) {
          list.innerHTML = `
            <tr>
              <td colspan="4" style="padding:20px; text-align:center; color:#999;">
                등록된 계정이 없습니다.
              </td>
            </tr>
          `;
          return;
        }

        list.innerHTML = users
          .map(
            (user) => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px; font-weight:700;">${escapeHtml(user.id || "")}</td>
                <td style="padding:10px;">${escapeHtml(user.name || "")}</td>
                <td style="padding:10px;">${escapeHtml(getRoleLabel(user.role))}</td>
                <td style="padding:10px; text-align:center;">
                  <button class="btn btn-grey" onclick="editAdminUser('${escapeHtml(user.id)}')">수정</button>
                  <button class="btn-red" onclick="deleteAdminUser('${escapeHtml(user.id)}')">삭제</button>
                </td>
              </tr>
            `
          )
          .join("");
      }

      function getRoleLabel(role) {
        if (role === "ADMIN") return "관리자";
        if (role === "USER") return "일반사용";
        if (role === "VIEWER") return "조회전용";
        return role || "";
      }

      function editAdminUser(id) {
        const user = adminUsersCache.find((u) => String(u.id) === String(id));
        if (!user) return alert("계정을 찾을 수 없습니다.");

        document.getElementById("adminUserId").value = user.id || "";
        document.getElementById("adminUserName").value = user.name || "";
        document.getElementById("adminUserPw").value = "";
        document.getElementById("adminUserRole").value = user.role || "USER";
      }

      async function saveAdminUser() {
        const id = document.getElementById("adminUserId").value.trim();
        const name = document.getElementById("adminUserName").value.trim();
        const pw = document.getElementById("adminUserPw").value.trim();
        const role = document.getElementById("adminUserRole").value;

        if (!id || !name) {
          alert("아이디와 이름은 필수입니다.");
          return;
        }

        const payload = { id, name, role };
        if (pw) payload.pw = pw;

        try {
          await apiPost("/users/item", payload);
          alert("계정이 저장되었습니다.");

          document.getElementById("adminUserId").value = "";
          document.getElementById("adminUserName").value = "";
          document.getElementById("adminUserPw").value = "";
          document.getElementById("adminUserRole").value = "USER";

          await renderAdminUsers();
        } catch (e) {
          console.error("계정 저장 실패:", e);

          alert(
            `계정 저장에 실패했습니다.\n\n${e.message}`
          );
        }
      }

      async function deleteAdminUser(id) {
        if (id === "yirim.yu") {
          alert("기본 관리자 계정은 삭제할 수 없습니다.");
          return;
        }

        if (!confirm(`${id} 계정을 삭제하시겠습니까?`)) return;

        try {
          await apiDelete(`/users/${encodeURIComponent(id)}`);
          alert("계정이 삭제되었습니다.");
          await renderAdminUsers();
        } catch (e) {
          console.error(e);
          alert("계정 삭제에 실패했습니다. API에 /users/:id 삭제 경로가 필요합니다.");
        }
      }
