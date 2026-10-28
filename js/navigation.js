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
