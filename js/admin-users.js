      // =========================
      // 관리자 - 계정 관리
      // =========================
      let adminUsersCache = [];

      function setAdminUserPermissionInputs(role, permissions) {
        const normalized = normalizeMenuPermissions(role, permissions);
        document.querySelectorAll("[data-menu-permission]").forEach((select) => {
          const key = select.dataset.menuPermission;
          const writeOption = select.querySelector('option[value="write"]');
          if (writeOption) {
            const adminOnlyWrite = key === "managementGoals" && role !== "ADMIN";
            writeOption.disabled = adminOnlyWrite;
            writeOption.hidden = adminOnlyWrite;
          }
          select.value = normalized[key];
          select.disabled = role === "ADMIN";
        });
      }

      function readAdminUserPermissionInputs(role) {
        if (role === "ADMIN") return getDefaultMenuPermissions("ADMIN");
        const permissions = {};
        document.querySelectorAll("[data-menu-permission]").forEach((select) => {
          permissions[select.dataset.menuPermission] = select.value;
        });
        return normalizeMenuPermissions(role, permissions);
      }

      function resetAdminUserForm() {
        document.getElementById("adminUserId").value = "";
        document.getElementById("adminUserName").value = "";
        document.getElementById("adminUserPw").value = "";
        document.getElementById("adminUserRole").value = "USER";
        setAdminUserPermissionInputs("USER");
      }

      async function loadAdminUsers() {
        try {
          const data = await apiAuthGet("/users");
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
                <td style="padding:10px;">${escapeHtml(getRoleLabel(user.role))}<div style="margin-top:4px; font-size:11px; color:#777;">${escapeHtml(MENU_PERMISSION_KEYS.map((key) => `${MENU_PERMISSION_LABELS[key]}:${normalizeMenuPermissions(user.role, user.menuPermissions)[key]}`).join(" · "))}</div></td>
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
        setAdminUserPermissionInputs(user.role || "USER", user.menuPermissions);
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

        const payload = {
          id,
          name,
          role,
          menuPermissions: readAdminUserPermissionInputs(role),
        };
        if (pw) payload.pw = pw;

        try {
          await apiAuthPost("/users/item", payload);
          alert("계정이 저장되었습니다.");

          resetAdminUserForm();

          await renderAdminUsers();
        } catch (e) {
          console.error("계정 저장 실패:", e);

          alert(
            `계정 저장에 실패했습니다.\n\n${e.message}`
          );
        }
      }

      async function deleteAdminUser(id) {
        if (!confirm(`${id} 계정을 삭제하시겠습니까?`)) return;

        try {
          await apiAuthDelete(`/users/${encodeURIComponent(id)}`);
          alert("계정이 삭제되었습니다.");
          await renderAdminUsers();
        } catch (e) {
          console.error(e);
          alert("계정 삭제에 실패했습니다. API에 /users/:id 삭제 경로가 필요합니다.");
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        const roleSelect = document.getElementById("adminUserRole");
        roleSelect?.addEventListener("change", () => {
          const currentId = document.getElementById("adminUserId")?.value || "";
          const existing = adminUsersCache.find((user) => String(user.id) === String(currentId));
          setAdminUserPermissionInputs(roleSelect.value, existing?.menuPermissions);
        });
        setAdminUserPermissionInputs(roleSelect?.value || "USER");
      });
