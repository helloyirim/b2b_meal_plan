      //관리자 상품 목록 렌더링 함수 추가
      function renderAdminSalesProducts() {
        const list = document.getElementById(
          "adminSalesProductList"
        );

        if (!list) return;

        const products = getAllSalesProducts();

        if (!products.length) {
          list.innerHTML = `
            <tr>
              <td
                colspan="6"
                style="padding:20px; text-align:center; color:#999;"
              >
                등록된 상품이 없습니다.
              </td>
            </tr>
          `;
          return;
        }

        list.innerHTML = products
          .map(
            (product) => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px; font-weight:700;">
                  ${escapeHtml(product.id)}
                  ${
                    product.isLegacy
                      ? `<span style="font-size:11px; color:#64748b;">기존</span>`
                      : ""
                  }
                </td>

                <td style="padding:10px;">
                  ${escapeHtml(product.name)}
                </td>

                <td style="padding:10px;">
                  ${escapeHtml(product.group || "")}
                </td>

                <td style="padding:10px; text-align:center;">
                  ${Number(product.sortOrder || 0)}
                </td>

                <td style="padding:10px; text-align:center;">
                  ${product.active === false ? "사용중지" : "사용"}
                </td>

                <td style="padding:10px; text-align:center;">
                  <button
                    class="btn btn-grey"
                    onclick="editAdminSalesProduct('${escapeHtml(product.id)}')"
                  >
                    수정
                  </button>
                </td>
              </tr>
            `
          )
          .join("");
      }

      // 14. 상품 수정 함수 추가
      function editAdminSalesProduct(productId) {
        const product = getSalesProductById(productId);

        if (!product) {
          alert("상품을 찾을 수 없습니다.");
          return;
        }

        document.getElementById(
          "adminSalesProductOriginalId"
        ).value = product.id;

        const idInput = document.getElementById(
          "adminSalesProductId"
        );

        idInput.value = product.id;
        idInput.disabled = true;

        document.getElementById(
          "adminSalesProductName"
        ).value = product.name || "";

        document.getElementById(
          "adminSalesProductGroup"
        ).value = product.group || "";

        document.getElementById(
          "adminSalesProductSortOrder"
        ).value = product.sortOrder || 1;

        document.getElementById(
          "adminSalesProductActive"
        ).value =
          product.active === false ? "false" : "true";
      }

      //15. 상품 저장 함수 추가
      async function saveAdminSalesProduct() {
        const originalId = document
          .getElementById("adminSalesProductOriginalId")
          .value.trim();

        const id = document
          .getElementById("adminSalesProductId")
          .value.trim();

        const name = document
          .getElementById("adminSalesProductName")
          .value.trim();

        const group = document
          .getElementById("adminSalesProductGroup")
          .value.trim();

        const sortOrder = Number(
          document.getElementById(
            "adminSalesProductSortOrder"
          ).value || 999
        );

        const active =
          document.getElementById(
            "adminSalesProductActive"
          ).value === "true";

        if (!id || !name) {
          alert("상품 ID와 상품명은 필수입니다.");
          return;
        }

        if (!/^[a-z0-9_]+$/.test(id)) {
          alert(
            "상품 ID는 영문 소문자, 숫자, 밑줄만 사용할 수 있습니다."
          );
          return;
        }

        if (!originalId) {
          const duplicated = salesProductsCache.some(
            (product) => product.id === id
          );

          if (duplicated) {
            alert("이미 사용 중인 상품 ID입니다.");
            return;
          }
        }

        const existing = getSalesProductById(originalId || id);

        const payload = {
          id: originalId || id,
          name,
          group,
          sortOrder,
          active,
          isLegacy: existing?.isLegacy === true,
          updatedAt: new Date().toISOString(),
        };

        try {
          await apiPost("/sales-products/item", payload);

          await loadSalesProductsFromServer();

          salesReportCache =
            normalizeSalesStorage(salesReportCache);

          resetAdminSalesProductForm();
          renderAdminSalesProducts();
          renderSalesReport(getVisibleSalesReport());

          alert("상품이 저장되었습니다.");
        } catch (e) {
          console.error("상품 저장 실패:", e);

          alert(
            `상품 저장에 실패했습니다.\n\n${e.message}`
          );
        }
      }

      //16. 상품 입력폼 초기화 함수 추가
      function resetAdminSalesProductForm() {
        document.getElementById(
          "adminSalesProductOriginalId"
        ).value = "";

        const idInput = document.getElementById(
          "adminSalesProductId"
        );

        idInput.value = "";
        idInput.disabled = false;

        document.getElementById(
          "adminSalesProductName"
        ).value = "";

        document.getElementById(
          "adminSalesProductGroup"
        ).value = "";

        document.getElementById(
          "adminSalesProductSortOrder"
        ).value = "1";

        document.getElementById(
          "adminSalesProductActive"
        ).value = "true";
      }

      // =========================
      // 관리자 - 매출 채널 관리
      // =========================

      /**
       * 관리자 채널 목록 렌더링
       */
      function renderAdminSalesChannels() {
        const list = document.getElementById(
          "adminSalesChannelList"
        );

        if (!list) return;

        const channels = getAllSalesChannels();

        if (!channels.length) {
          list.innerHTML = `
            <tr>
              <td
                colspan="6"
                style="
                  padding:20px;
                  text-align:center;
                  color:#999;
                "
              >
                등록된 채널이 없습니다.
              </td>
            </tr>
          `;

          return;
        }

        list.innerHTML = channels
          .map(
            (channel) => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px; font-weight:700;">
                  ${escapeHtml(channel.id)}

                  ${
                    channel.isLegacy
                      ? `
                        <span
                          style="
                            margin-left:4px;
                            font-size:11px;
                            color:#64748b;
                          "
                        >
                          기존
                        </span>
                      `
                      : ""
                  }
                </td>

                <td style="padding:10px;">
                  ${escapeHtml(channel.name || "")}
                </td>

                <td style="padding:10px;">
                  ${escapeHtml(
                    channel.shortName ||
                    channel.name ||
                    ""
                  )}
                </td>

                <td style="padding:10px; text-align:center;">
                  ${Number(channel.sortOrder || 0)}
                </td>

                <td style="padding:10px; text-align:center;">
                  ${
                    channel.active === false
                      ? `
                        <span style="color:#dc2626; font-weight:700;">
                          사용중지
                        </span>
                      `
                      : `
                        <span style="color:#047857; font-weight:700;">
                          사용
                        </span>
                      `
                  }
                </td>

                <td style="padding:10px; text-align:center;">
                  <button
                    type="button"
                    class="btn btn-grey"
                    onclick="editAdminSalesChannel('${escapeHtml(
                      channel.id
                    )}')"
                  >
                    수정
                  </button>
                </td>
              </tr>
            `
          )
          .join("");
      }


      /**
       * 채널 수정 모드
       */
      function editAdminSalesChannel(channelId) {
        const channel =
          getSalesChannelById(channelId);

        if (!channel) {
          alert("채널을 찾을 수 없습니다.");
          return;
        }

        document.getElementById(
          "adminSalesChannelOriginalId"
        ).value = channel.id;

        const idInput = document.getElementById(
          "adminSalesChannelId"
        );

        idInput.value = channel.id;

        // 저장 데이터와 매출 데이터 연결을 보호하기 위해
        // 기존 채널 ID는 수정 불가
        idInput.disabled = true;

        document.getElementById(
          "adminSalesChannelName"
        ).value = channel.name || "";

        document.getElementById(
          "adminSalesChannelShortName"
        ).value =
          channel.shortName ||
          channel.name ||
          "";

        document.getElementById(
          "adminSalesChannelSortOrder"
        ).value =
          Number(channel.sortOrder || 1);

        document.getElementById(
          "adminSalesChannelActive"
        ).value =
          channel.active === false
            ? "false"
            : "true";
      }


      /**
       * 채널 입력폼 초기화
       */
      function resetAdminSalesChannelForm() {
        document.getElementById(
          "adminSalesChannelOriginalId"
        ).value = "";

        const idInput = document.getElementById(
          "adminSalesChannelId"
        );

        idInput.value = "";
        idInput.disabled = false;

        document.getElementById(
          "adminSalesChannelName"
        ).value = "";

        document.getElementById(
          "adminSalesChannelShortName"
        ).value = "";

        document.getElementById(
          "adminSalesChannelSortOrder"
        ).value =
          getNextSalesChannelSortOrder();

        document.getElementById(
          "adminSalesChannelActive"
        ).value = "true";
      }


      /**
       * 다음 정렬순서 자동 계산
       */
      function getNextSalesChannelSortOrder() {
        const channels = getAllSalesChannels();

        if (!channels.length) return 1;

        const maxSortOrder = Math.max(
          ...channels.map((channel) =>
            Number(channel.sortOrder || 0)
          )
        );

        return maxSortOrder + 1;
      }


      /**
       * 채널 ID 형식 검사
       *
       * 영문 소문자, 숫자, 밑줄만 허용
       */
      function isValidSalesChannelId(channelId) {
        return /^[a-z0-9_]+$/.test(channelId);
      }


      /**
       * 채널 등록 및 수정
       */
      async function saveAdminSalesChannel() {
        const originalId = document
          .getElementById(
            "adminSalesChannelOriginalId"
          )
          .value
          .trim();

        const id = document
          .getElementById(
            "adminSalesChannelId"
          )
          .value
          .trim()
          .toLowerCase();

        const name = document
          .getElementById(
            "adminSalesChannelName"
          )
          .value
          .trim();

        const shortName = document
          .getElementById(
            "adminSalesChannelShortName"
          )
          .value
          .trim();

        const sortOrder = Number(
          document.getElementById(
            "adminSalesChannelSortOrder"
          ).value || 1
        );

        const active =
          document.getElementById(
            "adminSalesChannelActive"
          ).value === "true";

        if (!id) {
          alert("채널 ID를 입력해주세요.");
          return;
        }

        if (!isValidSalesChannelId(id)) {
          alert(
            "채널 ID는 영문 소문자, 숫자, 밑줄(_)만 사용할 수 있습니다."
          );
          return;
        }

        if (!name) {
          alert("채널명을 입력해주세요.");
          return;
        }

        if (!shortName) {
          alert("표시명을 입력해주세요.");
          return;
        }

        if (
          !Number.isInteger(sortOrder) ||
          sortOrder < 1
        ) {
          alert("순서는 1 이상의 정수로 입력해주세요.");
          return;
        }

        const duplicateChannel =
          getAllSalesChannels().find(
            (channel) =>
              String(channel.id) === id &&
              String(channel.id) !== originalId
          );

        if (duplicateChannel) {
          alert("이미 등록된 채널 ID입니다.");
          return;
        }

        const originalChannel =
          originalId
            ? getSalesChannelById(originalId)
            : null;

        const channelData = {
          id,
          name,
          shortName,
          sortOrder,
          active,

          // 기존 기본 채널 여부 유지
          isLegacy:
            originalChannel?.isLegacy === true,

          updatedAt: new Date().toISOString(),
        };

        try {
          await apiPost(
            "/sales-channels/item",
            channelData
          );

          await loadSalesChannelsFromServer();

          resetAdminSalesChannelForm();
          renderAdminSalesChannels();

          // 관리자 채널 변경 내용을 일반 화면에 즉시 반영
          renderSalesProductFilter();
          renderSalesChannelNavigation();
          renderSalesRawChannelSelect();
          renderChannelDailySalesTabs();

          alert(
            originalId
              ? "채널 정보가 수정되었습니다."
              : "채널이 등록되었습니다."
          );
        } catch (e) {
          console.error("채널 저장 실패:", e);

          alert(
            `채널 저장에 실패했습니다.\n\n${e.message}`
          );
        }
      }
