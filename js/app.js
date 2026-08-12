      // =========================
      // 사용자 데이터 및 권한 정의
      // =========================


      let deliveryEventsCache = [];

      async function loadDeliveryEventsFromServer() {
        try {
          const data = await apiGet("/delivery-events");

          deliveryEventsCache = Array.isArray(data)
            ? data.filter((item) => item && item.id && item.startDate)
            : [];

          return deliveryEventsCache;
        } catch (e) {
          console.error("단체 캘린더 데이터 로딩 실패:", e);
          deliveryEventsCache = [];
          return [];
        }
      }

      async function saveDeliveryEventToServer(eventData) {
        await apiPost("/delivery-events/item", eventData);
        await loadDeliveryEventsFromServer();
      }

      async function deleteDeliveryEventFromServer(id) {
        await apiDelete(`/delivery-events/${id}`);
        await loadDeliveryEventsFromServer();
      }

      function getEvents() {
        return deliveryEventsCache;
      }

      const DAY_LABELS = {  
        1: "월",
        2: "화",
        3: "수",
        4: "목",
        5: "금",
        6: "토",
        0: "일",
      };

      let menus = [];
      let mealPlan = {};
      let currentCellId = "cell-0-0";
      let historyPlansCache = [];

      // =========================
      // 초기 메뉴 데이터
      // =========================
      const initialMenus = [
        // 본도시락 - 봄 시즌 및 상시 메뉴
        {
          id: 1001,
          name: "봄냉이무침 양념돼지구이 쌈밥 한상",
          brand: "본도시락",
          price: 16900,
          allergy: "",
          memo: "",
          img: "",
        },
        {
          id: 1002,
          name: "봄냉이무침 양념돼지구이 국반상",
          brand: "본도시락",
          price: 10900,
          allergy: "",
          memo: "",
          img: "",
        },
        {
          id: 1003,
          name: "봄냉이무침 양념돼지구이 반상",
          brand: "본도시락",
          price: 10900,
          allergy: "",
          memo: "",
          img: "",
        },
        {
          id: 1004,
          name: "봄냉이무침 제육덮밥",
          brand: "본도시락",
          price: 8200,
          allergy: "",
          memo: "",
          img: "",
        },
        {
          id: 1005,
          name: "본격도시락(스팸두부조림)",
          brand: "본도시락",
          price: 8300,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 돼지고기, 우유, 토마토, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1006,
          name: "본격도시락(카츠&전)",
          brand: "본도시락",
          price: 8300,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 게, 토마토, 오징어",
          memo: "",
          img: "",
        },
        {
          id: 1007,
          name: "바싹불고기 깻잎제육 한상",
          brand: "본도시락",
          price: 12900,
          allergy: "대두, 밀, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 1008,
          name: "버섯소불고기 깻잎제육 한상",
          brand: "본도시락",
          price: 13600,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 토마토",
          memo: "",
          img: "",
        },
        {
          id: 1009,
          name: "바싹불고기 숯불닭구이 한상",
          brand: "본도시락",
          price: 12900,
          allergy: "대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1010,
          name: "우삼겹된장찌개 제육 백반 한상",
          brand: "본도시락",
          price: 13900,
          allergy:
            "대두, 밀, 쇠고기, 돼지고기, 땅콩, 우유, 새우, 아황산류, 호두, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1011,
          name: "바싹불고기 여수꼬막무침 한상",
          brand: "본도시락",
          price: 13900,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 우유, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1012,
          name: "바싹불고기 오징어두루치기 한상",
          brand: "본도시락",
          price: 14900,
          allergy:
            "대두, 밀, 쇠고기, 돼지고기, 우유, 게, 새우, 오징어, 홍합, 굴, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 1013,
          name: "우렁강된장 제육 쌈밥 한상",
          brand: "본도시락",
          price: 15400,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 게, 새우, 아황산류",
          memo: "",
          img: "",
        },
        {
          id: 1014,
          name: "바싹불고기 국반상",
          brand: "본도시락",
          price: 8600,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1015,
          name: "깻잎제육 국반상",
          brand: "본도시락",
          price: 9200,
          allergy: "대두, 밀, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 1016,
          name: "버섯소불고기 국반상",
          brand: "본도시락",
          price: 10100,
          allergy: "대두, 밀, 쇠고기, 토마토",
          memo: "",
          img: "",
        },
        {
          id: 1017,
          name: "숯불닭구이 국반상",
          brand: "본도시락",
          price: 9100,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1018,
          name: "꽈리닭구이 국반상",
          brand: "본도시락",
          price: 9900,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1019,
          name: "오징어두루치기 국반상",
          brand: "본도시락",
          price: 10600,
          allergy: "대두, 밀, 쇠고기, 우유, 게, 새우, 오징어, 홍합, 굴, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 1020,
          name: "수작돈까스 국반상",
          brand: "본도시락",
          price: 10900,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 땅콩, 토마토, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1021,
          name: "궁중떡갈비 국반상",
          brand: "본도시락",
          price: 7900,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 땅콩",
          memo: "",
          img: "",
        },
        {
          id: 1022,
          name: "바싹불고기 반상",
          brand: "본도시락",
          price: 8900,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1023,
          name: "깻잎제육 반상",
          brand: "본도시락",
          price: 9500,
          allergy: "대두, 밀, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 1024,
          name: "버섯소불고기 반상",
          brand: "본도시락",
          price: 10400,
          allergy: "대두, 밀, 쇠고기, 토마토",
          memo: "",
          img: "",
        },
        {
          id: 1025,
          name: "숯불닭구이 반상",
          brand: "본도시락",
          price: 9400,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1026,
          name: "꽈리닭구이 반상",
          brand: "본도시락",
          price: 10200,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1027,
          name: "오징어두루치기 반상",
          brand: "본도시락",
          price: 10900,
          allergy: "대두, 밀, 쇠고기, 우유, 게, 새우, 오징어, 홍합, 굴, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 1028,
          name: "수작돈까스 반상",
          brand: "본도시락",
          price: 11200,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 땅콩, 토마토, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1029,
          name: "궁중떡갈비 반상",
          brand: "본도시락",
          price: 8200,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 땅콩",
          memo: "",
          img: "",
        },
        {
          id: 1030,
          name: "고추장애호박찌개",
          brand: "본도시락",
          price: 10200,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 굴, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 1031,
          name: "스팸김치찌개",
          brand: "본도시락",
          price: 9400,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 돼지고기, 우유, 새우",
          memo: "",
          img: "",
        },
        {
          id: 1032,
          name: "우삼겹된장찌개",
          brand: "본도시락",
          price: 8900,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 돼지고기, 우유, 새우, 아황산류, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1033,
          name: "숯불주꾸미 꽈리닭구이 한상",
          brand: "본도시락",
          price: 16400,
          allergy:
            "대두, 밀, 쇠고기, 닭고기, 우유, 게, 새우, 오징어, 홍합, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1034,
          name: "울릉도 오징어 양념돼지구이 한상",
          brand: "본도시락",
          price: 19400,
          allergy:
            "대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 게, 새우, 아황산류, 오징어, 홍합, 굴, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 1035,
          name: "더덕장어구이 바싹불고기 한상",
          brand: "본도시락",
          price: 18900,
          allergy: "대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유",
          memo: "기력충전",
          img: "",
        },
        {
          id: 1036,
          name: "특선 LA갈비구이 한정식",
          brand: "본도시락",
          price: 27900,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유, 토마토, 조개류",
          memo: "기력충전",
          img: "",
        },
        {
          id: 1037,
          name: "궁중 전복소갈비찜 한정식",
          brand: "본도시락",
          price: 29900,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유, 토마토, 전복, 조개류",
          memo: "기력충전",
          img: "",
        },
        {
          id: 1038,
          name: "보양 고추장 더덕 장어구이 한정식",
          brand: "본도시락",
          price: 34900,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유, 토마토, 조개류",
          memo: "기력충전",
          img: "",
        },
        {
          id: 1039,
          name: "스크램블드에그 치킨마요",
          brand: "본도시락",
          price: 6800,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 땅콩, 우유, 호두, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1040,
          name: "저염 스팸김치볶음밥",
          brand: "본도시락",
          price: 7900,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 1041,
          name: "울릉도 나물 버섯영양밥",
          brand: "본도시락",
          price: 8200,
          allergy: "대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 1042,
          name: "닭가슴살 샐러드",
          brand: "본도시락",
          price: 7900,
          allergy: "대두, 밀, 닭고기, 우유, 아황산류",
          memo: "",
          img: "",
        },
        {
          id: 1043,
          name: "단호박식혜",
          brand: "본도시락",
          price: 1500,
          allergy: "",
          memo: "",
          img: "",
        },
        {
          id: 1044,
          name: "생수",
          brand: "본도시락",
          price: 1000,
          allergy: "",
          memo: "",
          img: "",
        },
        {
          id: 1045,
          name: "컵국",
          brand: "본도시락",
          price: 1000,
          allergy: "",
          memo: "",
          img: "",
        },
        {
          id: 1046,
          name: "별도 국",
          brand: "본도시락",
          price: 1000,
          allergy: "",
          memo: "",
          img: "",
        },

        // 본죽&비빔밥
        {
          id: 2001,
          name: "본죽장조림버터비빔밥",
          brand: "본죽&비빔밥",
          price: 11000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 2002,
          name: "낙지김치비빔밥",
          brand: "본죽&비빔밥",
          price: 11500,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 새우, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 2003,
          name: "불고기낙지비빔밥",
          brand: "본죽&비빔밥",
          price: 12000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유, 아황산류",
          memo: "기력충전",
          img: "",
        },
        {
          id: 2004,
          name: "신짬뽕비빔밥",
          brand: "본죽&비빔밥",
          price: 11500,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 우유, 게, 새우, 오징어, 홍합, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 2005,
          name: "전복내장해물비빔밥",
          brand: "본죽&비빔밥",
          price: 14500,
          allergy: "대두, 밀, 쇠고기, 우유, 새우, 오징어, 전복, 조개류",
          memo: "기력충전",
          img: "",
        },
        {
          id: 2006,
          name: "참치야채비빔밥",
          brand: "본죽&비빔밥",
          price: 10500,
          allergy: "난류(계란), 대두, 밀, 우유",
          memo: "",
          img: "",
        },
        {
          id: 2007,
          name: "6가지나물비빔밥",
          brand: "본죽&비빔밥",
          price: 9500,
          allergy: "난류(계란), 대두, 밀, 쇠고기",
          memo: "",
          img: "",
        },
        {
          id: 2008,
          name: "제육볶음나물비빔밥",
          brand: "본죽&비빔밥",
          price: 10500,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 우유, 아황산류",
          memo: "",
          img: "",
        },
        {
          id: 2009,
          name: "소불고기나물비빔밥",
          brand: "본죽&비빔밥",
          price: 11500,
          allergy: "대두, 밀, 쇠고기, 우유, 아황산류",
          memo: "",
          img: "",
        },
        {
          id: 2010,
          name: "해물된장뚝배기",
          brand: "본죽&비빔밥",
          price: 10500,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 우유, 새우, 아황산류, 오징어, 홍합, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 2011,
          name: "뚝배기 제육볶음",
          brand: "본죽&비빔밥",
          price: 10500,
          allergy: "난류(계란), 대두, 밀, 돼지고기, 우유, 아황산류",
          memo: "",
          img: "",
        },
        {
          id: 2012,
          name: "소불고기버섯뚝배기",
          brand: "본죽&비빔밥",
          price: 10500,
          allergy: "대두, 밀, 쇠고기, 우유, 아황산류",
          memo: "",
          img: "",
        },
        {
          id: 2013,
          name: "콩비지뚝배기",
          brand: "본죽&비빔밥",
          price: 10500,
          allergy: "대두, 밀, 쇠고기, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 2014,
          name: "전복죽",
          brand: "본죽&비빔밥",
          price: 12000,
          allergy: "대두, 밀, 쇠고기, 우유, 전복, 조개류, 잣",
          memo: "기력충전",
          img: "",
        },
        {
          id: 2015,
          name: "쇠고기야채죽",
          brand: "본죽&비빔밥",
          price: 11000,
          allergy: "대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 2016,
          name: "쇠고기버섯죽",
          brand: "본죽&비빔밥",
          price: 10000,
          allergy: "대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 2017,
          name: "참치야채죽",
          brand: "본죽&비빔밥",
          price: 10000,
          allergy: "대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 2018,
          name: "7가지야채죽",
          brand: "본죽&비빔밥",
          price: 9000,
          allergy: "대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 2019,
          name: "해물죽",
          brand: "본죽&비빔밥",
          price: 11000,
          allergy: "대두, 밀, 쇠고기, 우유, 새우, 오징어, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 2020,
          name: "새우죽",
          brand: "본죽&비빔밥",
          price: 9500,
          allergy: "대두, 밀, 쇠고기, 우유, 새우",
          memo: "",
          img: "",
        },
        {
          id: 2021,
          name: "통영굴버섯죽",
          brand: "본죽&비빔밥",
          price: 9500,
          allergy: "대두, 밀, 쇠고기, 우유, 굴",
          memo: "",
          img: "",
        },
        {
          id: 2022,
          name: "낙지김치죽",
          brand: "본죽&비빔밥",
          price: 11500,
          allergy: "대두, 밀, 쇠고기, 우유, 새우, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 2023,
          name: "신짬뽕죽",
          brand: "본죽&비빔밥",
          price: 11500,
          allergy: "대두, 밀, 쇠고기, 우유, 게, 새우, 오징어, 홍합, 굴, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 2024,
          name: "삼계죽",
          brand: "본죽&비빔밥",
          price: 12500,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유",
          memo: "기력충전",
          img: "",
        },
        {
          id: 2025,
          name: "불고기낙지죽",
          brand: "본죽&비빔밥",
          price: 12000,
          allergy: "대두, 밀, 쇠고기, 우유",
          memo: "기력충전",
          img: "",
        },
        {
          id: 2026,
          name: "단호박죽",
          brand: "본죽&비빔밥",
          price: 9500,
          allergy: "",
          memo: "전통죽",
          img: "",
        },
        {
          id: 2027,
          name: "단팥죽",
          brand: "본죽&비빔밥",
          price: 9500,
          allergy: "",
          memo: "전통죽",
          img: "",
        },
        {
          id: 2028,
          name: "동지팥죽",
          brand: "본죽&비빔밥",
          price: 9000,
          allergy: "",
          memo: "전통죽",
          img: "",
        },

        // 본설렁탕
        {
          id: 3001,
          name: "바지락 순두부찌개",
          brand: "본설렁탕",
          price: 10000,
          allergy: "",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 3002,
          name: "통영굴국밥",
          brand: "본설렁탕",
          price: 11000,
          allergy: "대두, 밀, 쇠고기, 우유, 새우, 오징어, 난류(계란), 굴",
          memo: "기력충전",
          img: "",
        },
        {
          id: 3003,
          name: "본해장국밥",
          brand: "본설렁탕",
          price: 11000,
          allergy: "대두, 밀, 쇠고기, 우유, 새우, 오징어",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 3004,
          name: "전주콩나물국밥",
          brand: "본설렁탕",
          price: 9000,
          allergy:
            "오징어, 새우, 대두, 밀, 조개류, 바지락, 굴, 쇠고기, 우유, 난류(계란)",
          memo: "숙취 해결사",
          img: "",
        },
        {
          id: 3005,
          name: "한우사골 토종순대국밥",
          brand: "본설렁탕",
          price: 10000,
          allergy:
            "대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 새우, 아황산류, 오징어, 조개류",
          memo: "숙취 해결사",
          img: "",
        },
        {
          id: 3006,
          name: "한우사골 얼큰순대국밥",
          brand: "본설렁탕",
          price: 10000,
          allergy:
            "대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 새우, 아황산류, 오징어, 조개류, 홍합",
          memo: "숙취 해결사",
          img: "",
        },
        {
          id: 3007,
          name: "한우사골 돼지수육국밥",
          brand: "본설렁탕",
          price: 11000,
          allergy:
            "대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 새우, 오징어, 굴, 조개류",
          memo: "숙취 해결사",
          img: "",
        },
        {
          id: 3008,
          name: "한우사골 나주식곰탕",
          brand: "본설렁탕",
          price: 12000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 새우, 오징어, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 3009,
          name: "한우사골 설렁탕",
          brand: "본설렁탕",
          price: 12000,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유, 새우, 오징어, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 3010,
          name: "한우사골 얼큰설렁탕",
          brand: "본설렁탕",
          price: 12000,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유, 새우, 오징어, 굴, 조개류",
          memo: "맵파민 중독",
          img: "",
        },
        {
          id: 3011,
          name: "한우사골 떡만두설렁탕",
          brand: "본설렁탕",
          price: 11000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 새우, 오징어, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 3012,
          name: "한우사골 얼큰떡만두설렁탕",
          brand: "본설렁탕",
          price: 11000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 새우, 오징어, 굴, 조개류, 홍합",
          memo: "맵파민 중독",
          img: "",
        },

        // 단체전용 메뉴
        {
          id: 4001,
          name: "가츠동 덮밥",
          brand: "본도시락_단체전용",
          price: 9000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 4002,
          name: "간장양념꾸이 도시락",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "대두, 밀, 쇠고기, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 4003,
          name: "마늘쫑돼지고기볶음 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "난류(계란), 대두, 밀, 닭고기, 돼지고기, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4004,
          name: "바싹불고기 도시락",
          brand: "본도시락_단체전용",
          price: 7000,
          allergy: "대두, 밀, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 4005,
          name: "소금닭구이 도시락",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "대두, 밀, 쇠고기, 닭고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 4006,
          name: "소불고기 도시락",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "대두, 밀, 쇠고기, 토마토",
          memo: "",
          img: "",
        },
        {
          id: 4007,
          name: "스팸두부조림 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "대두, 밀, 쇠고기, 돼지고기, 우유, 토마토, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4008,
          name: "우삼겹강된장 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "대두, 밀, 쇠고기, 게, 새우, 아황산류",
          memo: "",
          img: "",
        },
        {
          id: 4009,
          name: "우삼겹규동 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 4010,
          name: "우삼겹칠리마파두부 덮밥",
          brand: "본도시락_단체전용",
          price: 9000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4011,
          name: "콩나물불고기 덮밥",
          brand: "본도시락_단체전용",
          price: 7000,
          allergy: "난류(계란), 대두, 밀, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 4012,
          name: "콩나물불고기 도시락",
          brand: "본도시락_단체전용",
          price: 7000,
          allergy: "대두, 밀, 돼지고기",
          memo: "",
          img: "",
        },
        {
          id: 4013,
          name: "간장양념꾸이 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 돼지고기, 땅콩, 우유, 호두, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4014,
          name: "스크램블드에그함박 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 돼지고기, 땅콩, 우유, 토마토, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4015,
          name: "스팸마요 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 돼지고기, 우유, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4016,
          name: "오야꼬동 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 닭고기, 우유",
          memo: "",
          img: "",
        },
        {
          id: 4017,
          name: "짜장계란 덮밥",
          brand: "본도시락_단체전용",
          price: 7000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 닭고기, 돼지고기, 우유, 아황산류, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4018,
          name: "참치김치 덮밥",
          brand: "본도시락_단체전용",
          price: 7000,
          allergy:
            "난류(계란), 대두, 밀, 쇠고기, 땅콩, 우유, 호두, 홍합, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4019,
          name: "참치마요 덮밥",
          brand: "본도시락_단체전용",
          price: 7000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유, 홍합, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4020,
          name: "치킨카레 덮밥",
          brand: "본도시락_단체전용",
          price: 8000,
          allergy:
            "대두, 밀, 쇠고기, 닭고기, 우유, 토마토, 아황산류, 굴, 조개류",
          memo: "",
          img: "",
        },
        {
          id: 4021,
          name: "콩나물잡채 덮밥",
          brand: "본도시락_단체전용",
          price: 7000,
          allergy: "난류(계란), 대두, 밀, 쇠고기, 우유",
          memo: "",
          img: "",
        },
      ];

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

      function getDefaultImage(src) {
        return src && src.trim() ? src : "https://via.placeholder.com/150";
      }

      function getSelectedDays() {
        const checked = Array.from(
          document.querySelectorAll(".day-check:checked"),
        ).map((el) => parseInt(el.value, 10));

        // 아무것도 선택 안 하면 월~금 기본
        return checked.length > 0 ? checked : [1, 2, 3, 4, 5];
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
      async function loadMenusFromServer() {
        try {
          const data = await apiGet("/menus");

          const validMenus = Array.isArray(data)
            ? data.filter(
                (item) =>
                  item &&
                  typeof item === "object" &&
                  !item.data &&
                  typeof item.name === "string" &&
                  typeof item.brand === "string" &&
                  typeof item.price !== "undefined",
              )
            : [];

          const mergedMap = new Map();

          [...initialMenus, ...validMenus].forEach((menu) => {
            const key = String(menu.id || `${menu.name}_${menu.brand}`);
            mergedMap.set(key, menu);
          });

          menus = Array.from(mergedMap.values());
        } catch (e) {
          console.error("메뉴 로딩 실패:", e);
          menus = [...initialMenus];
        }

        populateLibBrandFilter();
        renderLib();
        renderMgmt();
      }

      async function saveMenuItemToServer(menuItem) {
        try {
          await apiPost("/menus/item", menuItem);
          console.log("클라우드 메뉴 단건 저장 완료");
        } catch (e) {
          console.error("서버 저장 실패:", e);
          throw e;
        }
      }

      // =========================
      // 식단 API
      // =========================
      async function loadPlansFromServer() {
        try {
          const plans = await apiGet("/plans");

          historyPlansCache = Array.isArray(plans)
            ? plans.filter(
                (item) =>
                  item &&
                  typeof item === "object" &&
                  item.data &&
                  typeof item.name === "string",
              )
            : [];

          //localStorage.setItem('b2b_plans_cache', JSON.stringify(historyPlansCache)); --삭제
          return historyPlansCache;
        } catch (e) {
          console.error("식단 로딩 실패:", e);
          //const cached = localStorage.getItem('b2b_plans_cache'); --삭제
          historyPlansCache = [];
          return [];
        }
      }

      async function savePlanToServer(plan) {
        const result = await apiPost("/plans", plan);
        await loadPlansFromServer();
        return result;
      }

      async function deletePlan(id) {
        if (!confirm("삭제하시겠습니까?")) return;

        try {
          await apiDelete(`/plans/${id}`);
          await renderHistoryList();
          document.getElementById("history-detail").innerHTML =
            '<p style="color:#ccc; text-align:center; margin-top:100px;">이력을 선택하면 상세 내용을 볼 수 있습니다.</p>';
        } catch (e) {
          console.error("삭제 실패:", e);
          alert("삭제에 실패했습니다.");
        }
      }

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

      function validateMonday(input) {
        const date = new Date(input.value);
        if (date.getDay() !== 1) {
          alert("시작일은 월요일만 선택 가능합니다.");
          input.value = "";
          return;
        }
        initGrid();
      }

      // =========================
      // 식단 그리드
      // =========================
      function initGrid() {
        const startStr = document.getElementById("start-date").value;
        const weeks = parseInt(document.getElementById("week-count").value, 10);
        const selectedDays = getSelectedDays();
        const container = document.getElementById("grid-container");

        // 선택된 요일이 없으면 안내
        if (!selectedDays.length) {
          container.innerHTML = `<p style="color:#999; text-align:center; padding:40px;">요일을 1개 이상 선택해주세요.</p>`;
          updateStats();
          return;
        }

        let html = `
                <table class="meal-table">
                    <colgroup>
                        <col class="week-col">
                        ${selectedDays.map(() => `<col>`).join("")}
                    </colgroup>
                    <thead>
                        <tr>
                            <th class="week-label"></th>
                            ${selectedDays.map((day) => `<th>${DAY_LABELS[day]}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
            `;

        for (let w = 0; w < weeks; w++) {
          html += `<tr><td class="week-label">${w + 1}주</td>`;

          selectedDays.forEach((day) => {
            const cid = `cell-${w}-${day}`;
            let dateLabel = "";

            if (startStr) {
              const startDate = new Date(startStr);
              const monday = new Date(startDate);
              monday.setDate(startDate.getDate() + w * 7);

              const cellDate = new Date(monday);
              const offset = day === 0 ? 6 : day - 1; // 월=0, 화=1 ... 일=6
              cellDate.setDate(monday.getDate() + offset);

              dateLabel = `${cellDate.getMonth() + 1}/${cellDate.getDate()}`;
            }

            html += `
                        <td onclick="selectCell('${cid}')">
                            <div id="${cid}" class="drop-zone ${currentCellId === cid ? "selected" : ""}">
                                <span class="cell-date">${dateLabel}</span>
                                <div class="cell-content">${mealPlan[cid] ? renderCell(mealPlan[cid]) : ""}</div>
                            </div>
                        </td>
                    `;
          });

          html += `</tr>`;
        }

        html += `</tbody></table>`;
        container.innerHTML = html;

        // 현재 선택 셀이 안 보이는 요일이면 첫 번째 셀 선택
        if (!document.getElementById(currentCellId)) {
          currentCellId = `cell-0-${selectedDays[0]}`;
          if (document.getElementById(currentCellId)) {
            document.getElementById(currentCellId).classList.add("selected");
          }
        }

        updateStats();
      }

      function selectCell(id) {
        if (document.getElementById(currentCellId)) {
          document.getElementById(currentCellId).classList.remove("selected");
        }
        currentCellId = id;
        if (document.getElementById(id)) {
          document.getElementById(id).classList.add("selected");
        }
      }

      function addToGrid(mid) {
        const menu = menus.find((m) => String(m.id) === String(mid));
        if (!menu) return;

        mealPlan[currentCellId] = {
          menuId: String(menu.id)
        };

        const targetCell = document.getElementById(currentCellId);
        if (targetCell) {
          const content = targetCell.querySelector(".cell-content");
          if (content) content.innerHTML = renderCell(menu);
        }

        updateStats();

        const selectedDays = getSelectedDays();
        const parts = currentCellId.split("-");
        let w = parseInt(parts[1], 10);
        let day = parseInt(parts[2], 10);

        const currentIndex = selectedDays.indexOf(day);

        if (currentIndex === -1) {
          // 현재 day가 선택 목록에 없으면 첫 번째로
          selectCell(`cell-${w}-${selectedDays[0]}`);
          return;
        }

        let nextIndex = currentIndex + 1;

        if (nextIndex >= selectedDays.length) {
          nextIndex = 0;
          w += 1;
        }

        if (w < parseInt(document.getElementById("week-count").value, 10)) {
          selectCell(`cell-${w}-${selectedDays[nextIndex]}`);
        }
      }


      function resolveMenuData(item) {
        if (!item) return null;

        const menuId = item.menuId || item.id;
        const found = menus.find((m) => String(m.id) === String(menuId));

        return found || item;
      } 

      function renderCell(m) {
        m = resolveMenuData(m);
        if (!m) return "";

        return `
                <div class="meal-content">
                    <div class="meal-thumb">
                        <img src="${escapeHtml(getDefaultImage(m.img || m.image || ""))}">
                    </div>
                    <span class="meal-title">${escapeHtml(m.name || "")}</span>
                    <div class="extra-info info-brand">${escapeHtml(m.brand || "")}</div>
                    <div class="extra-info info-price">${(m.price || 0).toLocaleString()}원</div>
                    <div class="extra-info info-allergy">${escapeHtml(m.allergy || "")}</div>
                    <div class="extra-info info-memo">${escapeHtml(m.memo || "")}</div>
                </div>
            `;
      }

      function updateStats() {
        const meals = Object.values(mealPlan)
          .map(resolveMenuData)
          .filter(Boolean);

        const uniqueCount = new Set(meals.map(m => m.name)).size;

        const avg =
          meals.length > 0
            ? Math.round(
                meals.reduce((sum, m) => sum + Number(m.price || 0), 0) /
                  meals.length
              )
            : 0;

        document.getElementById("stat-avg").innerText = avg.toLocaleString();
        document.getElementById("stat-total").innerText = meals.length + "개";
        document.getElementById("stat-unique").innerText =
          meals.length ? `(중복 제외 ${uniqueCount}종)` : "";
      }

      function toggleInfo(cls, cb) {
        const container = document.getElementById("grid-container");
        if (!container) return;
        cb.checked
          ? container.classList.add(cls)
          : container.classList.remove(cls);
      }

      // =========================
      // 식단 이력
      // =========================
      async function renderHistoryList() {
        const sidebar = document.getElementById("history-sidebar");
        if (!sidebar) return;

        const plans = await loadPlansFromServer();

        if (!plans || plans.length === 0) {
          sidebar.innerHTML =
            "<p style='color:#999; font-size:12px; text-align:center;'>저장된 이력이 없습니다.</p>";
          return;
        }

        const sortedPlans = [...plans].sort(
          (a, b) => (b.id || 0) - (a.id || 0),
        );

        sidebar.innerHTML = sortedPlans
          .map(
            (p) => `
                <div class="history-card" onclick="viewHistoryDetail(${p.id}, this)">
                    <b>${escapeHtml(p.name || "")}</b>
                    <span>${escapeHtml(p.date || "")}</span><br>
                    <span>저장자: ${escapeHtml(p.savedBy?.name || "알 수 없음")}</span>
                    <button class="btn-red delete-btn" onclick="event.stopPropagation(); deletePlan(${p.id})">삭제</button>
                </div>
            `,
          )
          .join("");
      }

      async function viewHistoryDetail(id, el) {
        document
          .querySelectorAll(".history-card")
          .forEach((c) => c.classList.remove("active"));
        if (el) el.classList.add("active");

        const plans = historyPlansCache.length
          ? historyPlansCache
          : await loadPlansFromServer();
        const plan = plans.find((p) => String(p.id) === String(id));
        const detail = document.getElementById("history-detail");

        if (!plan) {
          detail.innerHTML = `<p>해당 식단을 찾을 수 없습니다.</p>`;
          return;
        }

        detail.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h3>${escapeHtml(plan.name || "")}</h3>
                        <div style="font-size:12px; color:#777; margin-top:6px;">
                            저장자: ${escapeHtml(plan.savedBy?.name || "알 수 없음")} / 저장일시: ${escapeHtml(plan.date || "")}
                        </div>
                    </div>
                    <button class="btn btn-save" onclick="loadPlan(${plan.id})">이 식단 불러오기</button>
                </div>
                <div class="show-brand show-price">${renderStaticGrid(plan)}</div>
            `;
      }

      function renderStaticGrid(plan) {
        const selectedDays =
          Array.isArray(plan.selectedDays) && plan.selectedDays.length
            ? plan.selectedDays
            : [1, 2, 3, 4, 5];

        let html = `
                <table class="meal-table">
                    <thead>
                        <tr>
                            <th></th>
                            ${selectedDays.map((day) => `<th>${DAY_LABELS[day]}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
            `;

        const weeks = parseInt(plan.weeks || 1, 10);

        for (let w = 0; w < weeks; w++) {
          html += `<tr><td class="week-label">${w + 1}주</td>`;

          selectedDays.forEach((day) => {
            const cid = `cell-${w}-${day}`;
            const m = plan.data?.[cid];
            html += `<td>${m ? renderCell(m) : ""}</td>`;
          });

          html += `</tr>`;
        }

        html += `</tbody></table>`;
        return html;
      }

      async function savePlan() {
        if (Object.keys(mealPlan).length === 0) {
          return alert("저장할 식단이 없습니다.");
        }

        const planName = prompt("식단 이름을 입력해주세요:");
        if (!planName) return;

        const currentUser = getCurrentUser();
        const now = new Date();

        const plan = {
          id: Date.now(),
          name: planName,
          date: now.toLocaleString("ko-KR"),
          savedAt: now.toISOString(),
          savedBy: {
            id: currentUser.id || "",
            name: currentUser.name || "알 수 없음",
            role: currentUser.role || "",
          },
          data: Object.fromEntries(
            Object.entries(mealPlan).map(([cellId, item]) => {
              const menuId = item.menuId || item.id;
              return [cellId, { menuId: String(menuId) }];
            })
          ),
          weeks: document.getElementById("week-count").value,
          startDate: document.getElementById("start-date").value,
          selectedDays: getSelectedDays(),
        };

        try {
          await savePlanToServer(plan);
          alert("식단이 저장되었습니다.");
          await renderHistoryList();
        } catch (e) {
          console.error(e);
          alert("식단 저장에 실패했습니다.");
        }
      }

      async function loadPlan(id) {
        try {
          const plans = historyPlansCache.length
            ? historyPlansCache
            : await loadPlansFromServer();
          const plan = plans.find((p) => String(p.id) === String(id));

          if (!plan) return alert("식단을 찾을 수 없습니다.");

          mealPlan = plan.data || {};
          document.getElementById("week-count").value = plan.weeks || 1;
          document.getElementById("start-date").value = plan.startDate || "";

          const selectedDays =
            Array.isArray(plan.selectedDays) && plan.selectedDays.length
              ? plan.selectedDays
              : [1, 2, 3, 4, 5];

          document.querySelectorAll(".day-check").forEach((el) => {
            el.checked = selectedDays.includes(parseInt(el.value, 10));
          });

          currentCellId = `cell-0-${selectedDays[0]}`;
          showPage("page-generate");
        } catch (e) {
          console.error(e);
          alert("식단 불러오기에 실패했습니다.");
        }
      }

      // =========================
      // 메뉴 라이브러리/관리
      // =========================
      // 🔽 이거 추가
      function populateLibBrandFilter() {
        const brandSelect = document.getElementById("lib-brand-filter");
        if (!brandSelect) return;

        const currentValue = brandSelect.value || "";

        const brands = [...new Set(
          menus
            .map((m) => (m.brand || "").trim())
            .filter(Boolean)
        )].sort();

        brandSelect.innerHTML = `
          <option value="">전체 브랜드</option>
          ${brands
            .map(
              (brand) =>
                `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`
            )
            .join("")}
        `;

        brandSelect.value = currentValue;
      }
      // 🔼 여기까지 추가

      function isMatchedPriceRange(price, selectedRange) {
        const p = Number(price || 0);

        if (!selectedRange) return true;

        if (selectedRange === "under_6000") {
          return p < 6000;
        }

        if (selectedRange === "over_15000") {
          return p >= 15000;
        }

        const base = Number(selectedRange);
        return p >= base && p <= base + 900;
      }
      function renderLib() {
        const list = document.getElementById("lib-list");
        if (!list) return;

        const keyword =
          document.getElementById("lib-search-input")?.value.trim().toLowerCase() || "";
        const selectedBrand =
          document.getElementById("lib-brand-filter")?.value || "";
        const selectedPrice =
          document.getElementById("lib-price-filter")?.value || "";

        const filtered = menus.filter((m) => {
          const name = (m.name || "").toLowerCase();
          const brand = m.brand || "";
          const price = Number(m.price || 0);

          const matchKeyword = !keyword || name.includes(keyword);
          const matchBrand = !selectedBrand || brand === selectedBrand;
          const matchPrice = isMatchedPriceRange(price, selectedPrice);

          return matchKeyword && matchBrand && matchPrice;
        });

        if (filtered.length === 0) {
          list.innerHTML = `
            <div style="padding:20px; text-align:center; color:#999; font-size:13px;">
              조건에 맞는 메뉴가 없습니다.
            </div>
          `;
          return;
        }

        list.innerHTML = filtered
          .map(
            (m) => `
              <div class="lib-card" onclick="addToGrid('${String(m.id)}')">
                <img
                  src="${escapeHtml(getDefaultImage(m.img || m.image || ""))}"
                  style="width:40px; height:40px; border-radius:4px; object-fit:cover;"
                >
                <div>
                  <div style="font-weight:800; font-size:12px;">
                    ${escapeHtml(m.name || "")}
                  </div>
                  <div style="font-size:10px; color:#999;">
                    ${escapeHtml(m.brand || "")} | ${(m.price || 0).toLocaleString()}원
                  </div>
                </div>
              </div>
            `,
          )
          .join("");
      }

      function renderMgmt() {
        const list = document.getElementById("mgmt-list");
        const searchEl = document.getElementById("mgmt-search");
        if (!list) return;

        const val = (searchEl?.value || "").toLowerCase();
        const filtered = menus.filter((m) =>
          (m.name || "").toLowerCase().includes(val),
        );

        list.innerHTML = filtered
          .map(
            (m) => `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px 10px;">
                        <img src="${escapeHtml(getDefaultImage(m.img || m.image || ""))}" style="width:45px; height:45px; border-radius:4px; object-fit:cover; background:#f0f0f0; border:1px solid #eee;">
                    </td>
                    <td style="font-weight:600;">${escapeHtml(m.name || "")}</td>
                    <td style="color:var(--text-sub);">${escapeHtml(m.brand || "")}</td>
                    <td>${(m.price || 0).toLocaleString()}원</td>
                    <td style="text-align:center;">
                        <button class="btn btn-grey" style="padding:6px 12px; font-size:12px;" onclick="editMenu('${String(m.id)}')">수정</button>
                    </td>
                </tr>
            `,
          )
          .join("");
      }

      async function saveMenu() {
        const id = document.getElementById("edit-id").value;

        const obj = {
          id: id ? id : String(Date.now()),
          name: document.getElementById("edit-name").value.trim(),
          brand: document.getElementById("edit-brand").value.trim(),
          price: parseInt(document.getElementById("edit-price").value || 0, 10),
          allergy: document.getElementById("edit-allergy").value.trim(),
          memo: document.getElementById("edit-memo").value.trim(),
          img: document.getElementById("edit-img-base64").value,
        };

        if (!obj.name) return alert("메뉴명을 입력해주세요.");

        try {
          // 서버에 단건 저장
          await saveMenuItemToServer(obj);

          // 화면용 로컬 메모리 menus도 갱신
          const idx = menus.findIndex((m) => String(m.id) === String(obj.id));
          if (idx > -1) {
            menus[idx] = obj;
          } else {
            menus.push(obj);
          }

          alert("저장되었습니다.");
          resetMenuForm();
          populateLibBrandFilter();
          renderMgmt();
          renderLib();
        } catch (e) {
          console.error(e);
          alert("클라우드 저장에 실패했습니다.");
        }
      }

      function editMenu(id) {
        const m = menus.find((x) => String(x.id) === String(id));
        if (!m) return;

        document.getElementById("edit-id").value = m.id;
        document.getElementById("edit-name").value = m.name || "";
        document.getElementById("edit-brand").value = m.brand || "";
        document.getElementById("edit-price").value = m.price || "";
        document.getElementById("edit-allergy").value = m.allergy || "";
        document.getElementById("edit-memo").value = m.memo || "";
        document.getElementById("edit-img-base64").value = m.img || "";

        if (m.img) {
          document.getElementById("edit-preview").src = m.img;
          document.getElementById("edit-preview").style.display = "block";
          document.getElementById("preview-text").style.display = "none";
        } else {
          document.getElementById("edit-preview").style.display = "none";
          document.getElementById("preview-text").style.display = "block";
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      function resetMenuForm() {
        document.getElementById("edit-id").value = "";
        document.getElementById("edit-name").value = "";
        document.getElementById("edit-brand").value = "";
        document.getElementById("edit-price").value = "";
        document.getElementById("edit-allergy").value = "";
        document.getElementById("edit-memo").value = "";
        document.getElementById("edit-img-base64").value = "";
        document.getElementById("edit-preview").style.display = "none";
        document.getElementById("edit-preview").src = "";
        document.getElementById("preview-text").style.display = "block";
      }

      // =========================
// 단체캘린더
// =========================
let currentMonth = new Date();
currentMonth.setDate(1);

let deliveryCalendarInitialized = false;
let editingId = null;

function generateDeliveryId() {
  return "evt_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

async function initDeliveryCalendarPage() {
  if (!deliveryCalendarInitialized) {
    bindDeliveryCalendarEvents();
    deliveryCalendarInitialized = true;
  }

  await loadDeliveryEventsFromServer();
  renderDeliveryAll();
}

function bindDeliveryCalendarEvents() {
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    currentMonth.setDate(1);
    renderDeliveryAll();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    currentMonth.setDate(1);
    renderDeliveryAll();
  });

  document.getElementById("openModalBtn").addEventListener("click", openNewDeliveryModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);

  document.getElementById("modalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
  });


  document.getElementById("eventForm").addEventListener("submit", handleDeliverySubmit);
  document.getElementById("resetBtn").addEventListener("click", resetDeliveryForm);
  document.getElementById("deleteBtn").addEventListener("click", handleDeliveryDelete);
}

function openNewDeliveryModal() {
  resetDeliveryForm();
  openModal();
}

function openModal() {
  document.getElementById("modalBackdrop").classList.add("show");
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("show");
}

function calculateSales(quantity, unitPrice) {
  return Number(quantity || 0) * Number(unitPrice || 0);
}

function formatNumber(num) {
  return Number(num || 0).toLocaleString("ko-KR");
}

function formatCurrency(num) {
  return formatNumber(num) + "원";
}

function getEventSales(event) {
  if (
    typeof event.sales !== "undefined" &&
    event.sales !== null &&
    event.sales !== ""
  ) {
    return Number(event.sales || 0);
  }

  return calculateSales(event.quantity, event.unitPrice);
}

function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function updateEstimatedSalesPreview() {
  const qty = document.getElementById("quantity")?.value || 0;
  const unitPrice = document.getElementById("unitPrice")?.value || 0;
  const box = document.getElementById("estimatedSalesBox");
  if (box) box.textContent = formatCurrency(calculateSales(qty, unitPrice));
}

function getMonthlyEvents() {
  const events = getEvents();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthStart = new Date(year, month, 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(year, month + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  return events
    .filter((event) => {
      const start = normalizeDate(event.startDate);
      const end = normalizeDate(event.endDate || event.startDate);
      return start <= monthEnd && end >= monthStart;
    })
    .sort((a, b) => normalizeDate(a.startDate) - normalizeDate(b.startDate));
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getPastelColor(seed) {
  const hash = hashString(seed);

  // 색상이 한쪽으로 몰리지 않도록 황금각 기준으로 분산
  const hue = (hash * 137.508) % 360;

  // 파스텔톤 유지
  const saturation = 58;
  const lightness = 84;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function renderDeliveryAll() {
  renderDeliveryHeader();
  renderDeliverySummaryTable();
  renderDeliveryCalendar();
}

function renderDeliveryHeader() {
  const monthText = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;
  document.getElementById("monthLabel").textContent = monthText;
  document.getElementById("calendarTitle").textContent = `${currentMonth.getMonth() + 1}월 단체 납품 일정`;

  const monthlyEvents = getMonthlyEvents();
  const totalQty = monthlyEvents
  .filter((item) => item.status !== "취소")
  .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalSales = monthlyEvents
  .filter((item) => item.status !== "취소")
  .reduce((sum, item) => sum + getEventSales(item), 0);

  document.getElementById("summaryQty").textContent = `${formatNumber(totalQty)} ea`;
  document.getElementById("summarySales").textContent = formatCurrency(totalSales);
}

function renderDeliveryCalendar() {
  const weeksContainer = document.getElementById("calendarWeeks");
  weeksContainer.innerHTML = "";

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();

  const gridStart = new Date(year, month, 1 - startOffset);
  gridStart.setHours(0, 0, 0, 0);

  const weeks = [];

  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      days.push(date);
    }
    weeks.push(days);
  }

  weeks.forEach((weekDays, weekIndex) => {
    const weekRow = document.createElement("div");
    weekRow.className = "week-row";
    weekRow.dataset.weekIndex = weekIndex;

    weekDays.forEach((date) => {
      const cell = document.createElement("div");
      cell.className = "day-cell";
      if (date.getMonth() !== month) cell.classList.add("other-month");

      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = date.getDate();

      cell.appendChild(num);
      weekRow.appendChild(cell);
    });

    const eventsLayer = document.createElement("div");
    eventsLayer.className = "week-events-layer";
    eventsLayer.dataset.weekIndex = weekIndex;
    weekRow.appendChild(eventsLayer);

    weeksContainer.appendChild(weekRow);
  });

  const monthlyEvents = getMonthlyEvents();
  const weekSegments = buildWeeklySegments(monthlyEvents, weeks);

  weekSegments.forEach((segments, weekIndex) => {
    const lanes = assignLanes(segments);
    const layer = weeksContainer.querySelector(
      `.week-events-layer[data-week-index="${weekIndex}"]`
    );
    if (!layer) return;

    lanes.forEach((laneSegments, laneIndex) => {
      laneSegments.forEach((seg) => {
        const bar = document.createElement("div");
        bar.className = "event-bar";
        if (seg.event.status === "취소") bar.classList.add("cancelled");

        const leftPercent = (seg.startCol / 7) * 100;
        const widthPercent = ((seg.endCol - seg.startCol + 1) / 7) * 100;

        bar.style.left = `calc(${leftPercent}% + 2px)`;
        bar.style.width = `calc(${widthPercent}% - 4px)`;
        bar.style.top = `${laneIndex * 28}px`;
        bar.style.background = getPastelColor(seg.event.id);
        bar.textContent = seg.event.eventName;
        bar.title = seg.event.eventName;

        bar.addEventListener("click", () => {
          loadDeliveryEventToForm(seg.event.id);
        });

        layer.appendChild(bar);
      });
    });
  });
}

function buildWeeklySegments(events, weeks) {
  const result = Array.from({ length: 6 }, () => []);

  events.forEach((event) => {
    const eventStart = normalizeDate(event.startDate);
    const eventEnd = normalizeDate(event.endDate || event.startDate);

    weeks.forEach((weekDays, weekIndex) => {
      const weekStart = normalizeDate(weekDays[0]);
      const weekEnd = normalizeDate(weekDays[6]);

      if (eventEnd < weekStart || eventStart > weekEnd) return;

      const segmentStart = eventStart > weekStart ? eventStart : weekStart;
      const segmentEnd = eventEnd < weekEnd ? eventEnd : weekEnd;

      const startCol = diffDays(weekStart, segmentStart);
      const endCol = diffDays(weekStart, segmentEnd);

      result[weekIndex].push({
        event,
        startCol,
        endCol,
      });
    });
  });

  return result;
}

function diffDays(baseDate, targetDate) {
  const ms = normalizeDate(targetDate) - normalizeDate(baseDate);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function assignLanes(segments) {
  const sorted = [...segments].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return b.endCol - b.startCol - (a.endCol - a.startCol);
  });

  const lanes = [];

  sorted.forEach((seg) => {
    let placed = false;

    for (const lane of lanes) {
      const overlaps = lane.some((existing) => {
        return !(seg.endCol < existing.startCol || seg.startCol > existing.endCol);
      });

      if (!overlaps) {
        lane.push(seg);
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes.push([seg]);
    }
  });

  return lanes;
}

function renderDeliverySummaryTable() {
  const wrap = document.getElementById("summaryTableWrap");
  const monthlyEvents = getMonthlyEvents();

  if (!monthlyEvents.length) {
    wrap.innerHTML = `<div class="empty-box">선택한 월 데이터가 없습니다.</div>`;
    return;
  }

  let html = `
  <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
    <thead>
      <tr>
        <th style="width:50%; padding:10px; border-bottom:1px solid #eee;">행사명</th>
        <th style="width:20%; padding:10px; border-bottom:1px solid #eee;">수량</th>
        <th style="width:30%; padding:10px; border-bottom:1px solid #eee;">매출</th>
      </tr>
    </thead>
    <tbody>
`;

  monthlyEvents.forEach((event) => {
    html += `
      <tr data-id="${event.id}" style="cursor:pointer;">
          <td style="padding:10px; border-bottom:1px solid #eee; font-weight:700;">
          ${escapeHtml(event.eventName)}
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          ${formatNumber(event.quantity)} ea
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          ${formatCurrency(getEventSales(event))}
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  wrap.innerHTML = html;

  wrap.querySelectorAll("tbody tr").forEach((row) => {
    row.addEventListener("click", () => {
      loadDeliveryEventToForm(row.dataset.id);
    });
  });
}

async function handleDeliverySubmit(e) {
  e.preventDefault();

  const id = document.getElementById("eventId").value || generateDeliveryId();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const eventName = document.getElementById("eventName").value.trim();
  const companyName = document.getElementById("companyName").value.trim();
  const quantity = Number(document.getElementById("quantity").value || 0);
  const unitPrice = Number(document.getElementById("unitPrice").value || 0);
  const sales = Number(document.getElementById("sales").value || 0);
  const menuName = document.getElementById("menuName").value.trim();
  const status = document.getElementById("status").value;

  if (!startDate) {
    alert("행사일자를 입력해주세요.");
    return;
  }

  if (endDate && endDate < startDate) {
    alert("종료일자는 행사일자보다 빠를 수 없습니다.");
    return;
  }

  const currentUser = getCurrentUser();

  const eventData = {
    id,
    startDate,
    endDate,
    eventName,
    companyName,
    quantity,
    unitPrice,
    sales,
    menuName,
    status,
    savedBy: {
      id: currentUser.id || "",
      name: currentUser.name || "알 수 없음",
      role: currentUser.role || "",
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveDeliveryEventToServer(eventData);

    currentMonth = normalizeDate(startDate);
    currentMonth.setDate(1);

    resetDeliveryForm();
    closeModal();
    renderDeliveryAll();
  } catch (e) {
    console.error(e);
    alert("단체 일정 저장에 실패했습니다. API에 /delivery-events 저장 경로가 있는지 확인해주세요.");
  }
}

function loadDeliveryEventToForm(id) {
  const events = getEvents();
  const event = events.find((item) => item.id === id);
  if (!event) return;

  editingId = id;

  document.getElementById("eventId").value = event.id;
  document.getElementById("startDate").value = event.startDate || "";
  document.getElementById("endDate").value = event.endDate || "";
  document.getElementById("eventName").value = event.eventName || "";
  document.getElementById("companyName").value = event.companyName || "";
  document.getElementById("quantity").value = event.quantity || 0;
  document.getElementById("unitPrice").value = event.unitPrice || 0;
  document.getElementById("sales").value = getEventSales(event);
  document.getElementById("menuName").value = event.menuName || "";
  document.getElementById("status").value = event.status || "확정";

  openModal();
}

function resetDeliveryForm() {
  editingId = null;
  document.getElementById("eventForm").reset();
  document.getElementById("eventId").value = "";
  document.getElementById("status").value = "확정";
}

async function handleDeliveryDelete() {
  const id = document.getElementById("eventId").value;

  if (!id) {
    alert("삭제할 항목을 먼저 선택해주세요.");
    return;
  }

  if (!confirm("선택한 데이터를 삭제하시겠습니까?")) return;

  try {
    await deleteDeliveryEventFromServer(id);
    resetDeliveryForm();
    closeModal();
    renderDeliveryAll();
  } catch (e) {
    console.error(e);
    alert("삭제에 실패했습니다.");
  }
}


// =========================
// 상품 매출보고
// =========================

function showSalesPage(channel = "all") {
  currentSalesChannel = channel;

  showPage("page-sales");
  renderSalesProductFilter();

  document.querySelectorAll(".sales-channel-nav").forEach((el) => {
    el.classList.remove("active");
  });

  const activeNav = document.getElementById(`nav-sales-${channel}`);
  if (activeNav) activeNav.classList.add("active");

  const title = document.querySelector("#page-sales .calendar-page-title");
  if (title) {
    title.innerText =
  `${getSalesProductTitle()} ${getSalesChannelLabel(channel)} 매출보고`;
  }

  if (salesReportCache) {
    renderSalesReport(getVisibleSalesReport());
}
}

function moveSalesMonth(offset) {
  currentSalesMonth.setMonth(currentSalesMonth.getMonth() + offset);
  currentSalesMonth.setDate(1);

  if (salesReportCache) {
    renderSalesReport(getVisibleSalesReport());
  }
}

function updateSalesMonthLabel() {
  const label = document.getElementById("salesMonthLabel");
  if (!label) return;

  label.innerText = `${currentSalesMonth.getFullYear()}년 ${
    currentSalesMonth.getMonth() + 1
  }월`;
}

function getSalesMonthKey(date = currentSalesMonth) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function renderSalesProductFilter() {
  const container = document.getElementById("salesProductFilter");
  if (!container) return;

  const products = getActiveSalesProducts();

  // 최초 로딩 시 전체 상품 선택
  if (!Array.isArray(currentSalesProducts) || currentSalesProducts.length === 0) {
    currentSalesProducts = products.map((product) => product.id);
  }

  const isAllChecked =
    products.length > 0 &&
    products.every((product) =>
      currentSalesProducts.includes(product.id)
    );

  container.innerHTML = `
    <label class="sales-product-filter-item sales-product-filter-all">
      <input
        type="checkbox"
        id="salesProductFilterAll"
        ${isAllChecked ? "checked" : ""}
      >
      <span>전체 상품</span>
    </label>

    ${products
      .map(
        (product) => `
          <label class="sales-product-filter-item">
            <input
              type="checkbox"
              class="sales-product-filter-checkbox"
              value="${product.id}"
              ${
                currentSalesProducts.includes(product.id)
                  ? "checked"
                  : ""
              }
            >
            <span>${product.name}</span>
          </label>
        `
      )
      .join("")}
  `;

  const allCheckbox = document.getElementById(
    "salesProductFilterAll"
  );

  const productCheckboxes = Array.from(
    container.querySelectorAll(
      ".sales-product-filter-checkbox"
    )
  );

  allCheckbox?.addEventListener("change", () => {
    productCheckboxes.forEach((checkbox) => {
      checkbox.checked = allCheckbox.checked;
    });

    currentSalesProducts = allCheckbox.checked
      ? products.map((product) => product.id)
      : [];

    refreshSalesReportByProductFilter();
  });

  productCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      currentSalesProducts = productCheckboxes
        .filter((item) => item.checked)
        .map((item) => item.value);

      allCheckbox.checked =
        currentSalesProducts.length === products.length;

      refreshSalesReportByProductFilter();
    });
  });
}



function refreshSalesReportByProductFilter() {
  updateSalesReportTitle();

  if (salesReportCache) {
    renderSalesReport(getVisibleSalesReport());
  }
}

function renderSalesRawProductSelect() {
  const rawSelect = document.getElementById("salesRawProduct");
  if (!rawSelect) return;

  const products = getActiveSalesProducts();

  rawSelect.innerHTML = products
    .map(
      (product) =>
        `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}</option>`
    )
    .join("");
}

function renderSalesChannelNavigation() {
  const container =
    document.getElementById("salesChannelNavList");

  if (!container) return;

  const channels = getActiveSalesChannels();

  container.innerHTML = channels
    .map(
      (channel) => `
        <div
          class="nav-item sales-channel-nav"
          id="nav-sales-${escapeHtml(channel.id)}"
          onclick="showSalesPage('${escapeHtml(channel.id)}')"
        >
          └ ${escapeHtml(channel.name)}
        </div>
      `
    )
    .join("");
}

function renderSalesRawChannelSelect() {
  const select =
    document.getElementById("salesRawChannel");

  if (!select) return;

  const currentValue = select.value;
  const channels = getActiveSalesChannels();

  select.innerHTML = channels
    .map(
      (channel) => `
        <option value="${escapeHtml(channel.id)}">
          ${escapeHtml(channel.name)}
        </option>
      `
    )
    .join("");

  if (
    currentValue &&
    channels.some(
      (channel) =>
        String(channel.id) === String(currentValue)
    )
  ) {
    select.value = currentValue;
  }
}

function renderChannelDailySalesChannelSelect() {
  const select =
    document.getElementById(
      "channelDailySalesChannel"
    );

  if (!select) return;

  const channels =
    getActiveSalesChannels();

  const currentValue =
    select.value;

  select.innerHTML = channels
    .map(
      (channel) => `
        <option value="${escapeHtml(channel.id)}">
          ${escapeHtml(
            channel.shortName ||
            channel.name
          )}
        </option>
      `
    )
    .join("");

  if (
    currentValue &&
    channels.some(
      (channel) =>
        String(channel.id) ===
        String(currentValue)
    )
  ) {
    select.value = currentValue;
  }
}

// 채널별 일매출에서 현재 선택한 채널
let currentChannelDailySalesChannel = "";


/**
 * 관리자에서 등록한 활성 채널을 탭으로 생성
 */
function renderChannelDailySalesTabs() {
  const container =
    document.getElementById(
      "channelDailySalesTabs"
    );

  if (!container) return;

  const channels =
    getActiveSalesChannels();

  if (!channels.length) {
    currentChannelDailySalesChannel = "";

    container.innerHTML = `
      <div class="product-daily-empty">
        사용 중인 판매 채널이 없습니다.
      </div>
    `;

    return;
  }

  const selectedChannelExists =
    channels.some(
      (channel) =>
        String(channel.id) ===
        String(currentChannelDailySalesChannel)
    );

  // 최초 진입 또는 기존 선택 채널이 사용중지된 경우
  if (!selectedChannelExists) {
    currentChannelDailySalesChannel =
      String(channels[0].id);
  }

  container.innerHTML = channels
    .map(
      (channel) => `
        <button
          type="button"
          class="channel-daily-tab ${
            String(channel.id) ===
            String(currentChannelDailySalesChannel)
              ? "active"
              : ""
          }"
          onclick="selectChannelDailySalesTab('${escapeHtml(
            channel.id
          )}')"
        >
          ${escapeHtml(
            channel.shortName ||
            channel.name
          )}
        </button>
      `
    )
    .join("");
}


/**
 * 채널 탭 선택
 */
function selectChannelDailySalesTab(
  channelId
) {
  currentChannelDailySalesChannel =
    String(channelId || "");

  renderChannelDailySalesTabs();
  renderChannelDailySalesPage();
}


function toggleAllSalesProducts(el) {
  document.querySelectorAll(".sales-product-check").forEach((check) => {
    check.checked = el.checked;
  });

  updateSelectedSalesProducts();
}

function updateSelectedSalesProducts() {
  const checked = Array.from(
    document.querySelectorAll(".sales-product-check:checked")
  ).map((el) => el.value);

  const activeProductIds = getActiveSalesProducts().map(
    (product) => product.id
  );

  currentSalesProducts = checked.length
    ? checked
    : activeProductIds;

  const allCheck = document.getElementById("salesProductAll");

  if (allCheck) {
    allCheck.checked =
      currentSalesProducts.length === activeProductIds.length;
  }

  updateSalesReportTitle();
  renderSalesReport(getVisibleSalesReport());
}

//6. getSalesProductTitle() 수정
function getSalesProductTitle() {
  const activeProducts = getActiveSalesProducts();
  const activeIds = activeProducts.map((product) => product.id);

  if (currentSalesProducts.length === activeIds.length) {
    return "전체 상품";
  }

  if (currentSalesProducts.length === 1) {
    return getSalesProductName(currentSalesProducts[0]);
  }

  const selectedProducts = currentSalesProducts
    .map(getSalesProductById)
    .filter(Boolean);

  const selectedGroups = [
    ...new Set(selectedProducts.map((product) => product.group).filter(Boolean)),
  ];

  if (selectedGroups.length === 1) {
    return `${selectedGroups[0]} ${selectedProducts.length}개 상품`;
  }

  return `${selectedProducts.length}개 상품`;
}



function updateSalesReportTitle() {
  const title = document.querySelector("#page-sales .calendar-page-title");
  if (!title) return;

  title.innerText =
  `${getSalesProductTitle()} ${getSalesChannelLabel(currentSalesChannel)} 매출보고`;
}

let currentSalesChannel = "all";
//1. 기존 SALES_PRODUCTS를 기본 상품 목록으로 변경
const DEFAULT_SALES_PRODUCTS = [
  {
    id: "blackgoat_30",
    name: "흑염소진액",
    group: "흑염소",
    active: true,
    sortOrder: 1,
    isLegacy: true,
  },
  {
    id: "maesil_500",
    name: "매실 500ml",
    group: "매실",
    active: true,
    sortOrder: 2,
    isLegacy: true,
  },
  {
    id: "maesil_1500",
    name: "매실 1.5L",
    group: "매실",
    active: true,
    sortOrder: 3,
    isLegacy: true,
  },
  {
    id: "cheongmaesil_10",
    name: "우리땅청매실 10개입",
    group: "매실",
    active: true,
    sortOrder: 4,
    isLegacy: true,
  },
];

let salesProductsCache = [];
let currentSalesProducts = [];

//2. 상품 조회용 공통 함수를 추가
function getActiveSalesProducts() {
  return salesProductsCache
    .filter((product) => product.active !== false)
    .sort(
      (a, b) =>
        Number(a.sortOrder || 999) - Number(b.sortOrder || 999)
    );
}

function getAllSalesProducts() {
  return [...salesProductsCache].sort(
    (a, b) =>
      Number(a.sortOrder || 999) - Number(b.sortOrder || 999)
  );
}

function getSalesProductById(productId) {
  return salesProductsCache.find(
    (product) => String(product.id) === String(productId)
  );
}

function getSalesProductName(productId) {
  return getSalesProductById(productId)?.name || productId;
}

function getSalesProductMap() {
  return Object.fromEntries(
    salesProductsCache.map((product) => [product.id, product.name])
  );
}

//3.서버에서 상품 목록을 불러오는 함수 추가

async function loadSalesProductsFromServer() {
  try {
    const serverProducts = await apiGet("/sales-products");

    const serverProductList = Array.isArray(serverProducts)
      ? serverProducts
      : [];

    const mergedMap = new Map();

    DEFAULT_SALES_PRODUCTS.forEach((product) => {
      mergedMap.set(String(product.id), { ...product });
    });

    serverProductList.forEach((product) => {
      if (!product || !product.id) return;

      const productId = String(product.id);
      const defaultProduct = mergedMap.get(productId) || {};

      mergedMap.set(productId, {
        ...defaultProduct,
        ...product,
        id: productId,
      });
    });

    salesProductsCache = Array.from(mergedMap.values()).sort(
      (a, b) =>
        Number(a.sortOrder || 999) - Number(b.sortOrder || 999)
    );
  } catch (e) {
    console.error("상품 목록 로딩 실패:", e);

    salesProductsCache = DEFAULT_SALES_PRODUCTS.map((product) => ({
      ...product,
    }));
  }

  currentSalesProducts = getActiveSalesProducts().map(
    (product) => product.id
  );

  return salesProductsCache;
}

// =========================
// 매출 채널 기준정보
// =========================

const DEFAULT_SALES_CHANNELS = [
  {
    id: "naver",
    name: "네이버 스마트스토어",
    shortName: "네이버",
    active: true,
    sortOrder: 1,
    isLegacy: true,
  },
  {
    id: "coupang",
    name: "쿠팡",
    shortName: "쿠팡",
    active: true,
    sortOrder: 2,
    isLegacy: true,
  },
];

let salesChannelsCache = [];


/**
 * 사용 중인 채널만 정렬하여 반환
 */
function getActiveSalesChannels() {
  return salesChannelsCache
    .filter((channel) => channel.active !== false)
    .sort(
      (a, b) =>
        Number(a.sortOrder || 999) -
        Number(b.sortOrder || 999)
    );
}


/**
 * 사용중지 채널을 포함한 전체 채널 반환
 */
function getAllSalesChannels() {
  return [...salesChannelsCache].sort(
    (a, b) =>
      Number(a.sortOrder || 999) -
      Number(b.sortOrder || 999)
  );
}


/**
 * 채널 ID로 채널 정보 조회
 */
function getSalesChannelById(channelId) {
  return salesChannelsCache.find(
    (channel) =>
      String(channel.id) === String(channelId)
  );
}


/**
 * 채널 ID로 전체 채널명 조회
 */
function getSalesChannelName(channelId) {
  return (
    getSalesChannelById(channelId)?.name ||
    channelId
  );
}


/**
 * 채널 ID로 화면용 짧은 이름 조회
 */
function getSalesChannelShortName(channelId) {
  const channel =
    getSalesChannelById(channelId);

  return (
    channel?.shortName ||
    channel?.name ||
    channelId
  );
}


/**
 * 활성 채널 ID 목록 반환
 */
function getActiveSalesChannelIds() {
  return getActiveSalesChannels().map(
    (channel) => channel.id
  );
}


/**
 * 채널 저장용 빈 데이터 구조 생성
 *
 * 예:
 * {
 *   naver: { months: {} },
 *   coupang: { months: {} }
 * }
 */
function createEmptySalesChannelsStorage() {
  return Object.fromEntries(
    getAllSalesChannels().map((channel) => [
      channel.id,
      { months: {} },
    ])
  );
}


/**
 * 서버에서 채널 기준정보 조회
 */
async function loadSalesChannelsFromServer() {
  try {
    const serverChannels =
      await apiGet("/sales-channels");

    const serverChannelList =
      Array.isArray(serverChannels)
        ? serverChannels
        : [];

    const mergedMap = new Map();

    DEFAULT_SALES_CHANNELS.forEach(
      (channel) => {
        mergedMap.set(
          String(channel.id),
          { ...channel }
        );
      }
    );

    serverChannelList.forEach((channel) => {
      if (!channel || !channel.id) return;

      const channelId =
        String(channel.id);

      const defaultChannel =
        mergedMap.get(channelId) || {};

      mergedMap.set(channelId, {
        ...defaultChannel,
        ...channel,
        id: channelId,
      });
    });

    salesChannelsCache =
      Array.from(mergedMap.values()).sort(
        (a, b) =>
          Number(a.sortOrder || 999) -
          Number(b.sortOrder || 999)
      );
  } catch (e) {
    console.error(
      "매출 채널 목록 로딩 실패:",
      e
    );

    salesChannelsCache =
      DEFAULT_SALES_CHANNELS.map(
        (channel) => ({ ...channel })
      );
  }

  return salesChannelsCache;
}



let currentSalesMonth = new Date();
currentSalesMonth.setDate(1);

function getSalesChannelLabel(channelId) {
  if (channelId === "all") {
    return "통합";
  }

  return getSalesChannelName(channelId);
}

let salesReportCache = null;

//11. loadSalesReportFromServer() 내 중복 렌더링 정리
async function loadSalesReportFromServer() {
  try {
    const data = await apiGet("/blackgoat-sales");

    salesReportCache = normalizeSalesStorage(data);

    if (salesReportCache) {
      renderSalesReport(getVisibleSalesReport());
    }
  } catch (e) {
    console.error("상품 매출보고 로딩 실패:", e);

    salesReportCache = normalizeSalesStorage(null);
    renderSalesReport(getVisibleSalesReport());
  }
}


//8. saveSalesReportToServer() 수정
async function saveSalesReportToServer(reportData) {
  const productId = reportData.productId || "blackgoat_30";
  const channel = reportData.channel || "naver";
  const monthKey = `${reportData.year}-${String(reportData.month).padStart(2, "0")}`;

  salesReportCache = normalizeSalesStorage(salesReportCache);

  if (!salesReportCache.products[productId]) {
    salesReportCache.products[productId] = {
      productId,
      productName: getSalesProductName(productId),
      channels: {
        naver: { months: {} },
        coupang: { months: {} },
      },
    };
  }

  salesReportCache.products[productId].channels[channel].months[monthKey] =
    reportData;

  salesReportCache.updatedAt = new Date().toISOString();

  await apiPost("/blackgoat-sales", salesReportCache);
}


//7. normalizeSalesStorage() 수정
function normalizeSalesStorage(data) {
  const emptyProduct = () => ({
    channels: {
      naver: { months: {} },
      coupang: { months: {} },
    },
  });

  const storage = {
    products: {},
    notes:
      data?.notes && typeof data.notes === "object"
        ? { ...data.notes }
        : {},
    updatedAt: data?.updatedAt || null,
  };

  // 관리자 상품 목록 기준으로 빈 데이터 구조 생성
  getAllSalesProducts().forEach((product) => {
    storage.products[product.id] = {
      productId: product.id,
      productName: product.name,
      ...emptyProduct(),
    };
  });

  if (!data) return storage;

  // 현재 다상품 구조
  if (data.products) {
    Object.entries(data.products).forEach(
      ([productId, productData]) => {
        if (!storage.products[productId]) {
          storage.products[productId] = {
            productId,
            productName:
              productData.productName ||
              getSalesProductName(productId) ||
              productId,
            ...emptyProduct(),
          };
        }

        storage.products[productId].productName =
          getSalesProductName(productId) ||
          productData.productName ||
          productId;

        storage.products[productId].channels.naver =
          productData.channels?.naver || { months: {} };

        storage.products[productId].channels.coupang =
          productData.channels?.coupang || { months: {} };
      }
    );

    return storage;
  }

  // 과거 흑염소 단일 구조 자동 호환
  if (data.channels) {
    storage.products.blackgoat_30 = {
      productId: "blackgoat_30",
      productName: getSalesProductName("blackgoat_30"),
      channels: {
        naver: data.channels.naver || { months: {} },
        coupang: data.channels.coupang || { months: {} },
      },
    };
  }

  return storage;
}



function getVisibleSalesReport() {
  salesReportCache = normalizeSalesStorage(salesReportCache);
  return buildSelectedProductsSalesReport();
}

function buildSelectedProductsSalesReport() {
  const monthKey = getSalesMonthKey();
  const reports = [];

  currentSalesProducts.forEach((productId) => {
    const product = salesReportCache.products?.[productId];
    if (!product) return;

    if (currentSalesChannel === "naver" || currentSalesChannel === "all") {
      const naverReport = product.channels.naver?.months?.[monthKey];
      if (naverReport) reports.push(naverReport);
    }

    if (currentSalesChannel === "coupang" || currentSalesChannel === "all") {
      const coupangReport = product.channels.coupang?.months?.[monthKey];
      if (coupangReport) reports.push(coupangReport);
    }
  });

  if (!reports.length) {
    const empty = createEmptySalesReport(currentSalesChannel);
    empty.monthlyRows = buildSalesMonthlyRows();
    return empty;
  }

  return mergeSalesReports(reports);
}

function createEmptySalesReport(channel = "all") {
  return {
    channel,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    start: "",
    end: "",
    dailyRows: [],
    monthlyRows: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      sales: 0,
      isCurrent: false,
    })),
    totalCustomer: 0,
    totalQty: 0,
    totalSales: 0,
    netSales: 0,
    refundCount: 0,
    refundAmount: 0,
    avgCustomer: 0,
    avgSet: 0,
    savedAt: null,
  };
}

function mergeSalesReports(reports = []) {
  const rowMap = new Map();

  reports.forEach((report) => {
    (report.dailyRows || []).forEach((row) => {
      if (!rowMap.has(row.date)) {
        rowMap.set(row.date, {
          date: row.date,
          day: row.day,
          customers: 0,
          orderCount: 0,
          qty: 0,
          sales: 0,
          refundCount: 0,
          refundAmount: 0,
          refundQty: 0,
          naverSales: 0,
          coupangSales: 0,
          isOutOfRange: row.isOutOfRange,
        });
      }

      const target = rowMap.get(row.date);

      target.customers += Number(row.customers || 0);
      target.orderCount += Number(row.orderCount || 0);
      target.qty += Number(row.qty || 0);
      target.sales += Number(row.sales || 0);

      if (report.channel === "naver") {
        target.naverSales += Number(row.sales || 0);
      }

      if (report.channel === "coupang") {
        target.coupangSales += Number(row.sales || 0);
      }

      target.refundCount += Number(row.refundCount || 0);
      target.refundAmount += Number(row.refundAmount || 0);
      target.refundQty += Number(row.refundQty || 0);
      target.isOutOfRange = target.isOutOfRange && row.isOutOfRange;
    });
  });

  const dailyRows = Array.from(rowMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const validRows = dailyRows.filter((row) => !row.isOutOfRange);

  const grossSales = validRows.reduce((sum, row) => sum + row.sales, 0);
  const grossQty = validRows.reduce((sum, row) => sum + row.qty, 0);
  const grossCustomer = validRows.reduce((sum, row) => sum + row.customers, 0);

  const refundCount = validRows.reduce((sum, row) => sum + row.refundCount, 0);
  const refundAmount = validRows.reduce((sum, row) => sum + row.refundAmount, 0);
  const refundQty = validRows.reduce((sum, row) => sum + row.refundQty, 0);

  const totalCustomer = grossCustomer;
  const totalQty = grossQty;
  const totalSales = grossSales;
  const netSales = Math.max(grossSales - refundAmount, 0);

  return {
    channel: currentSalesChannel,
    year: currentSalesMonth.getFullYear(),
    month: currentSalesMonth.getMonth() + 1,
    start: reports[0]?.start || "",
    end: reports[0]?.end || "",
    dailyRows,
    monthlyRows: buildSalesMonthlyRows(),
    totalCustomer,
    totalQty,
    totalSales,
    netSales,
    refundCount,
    refundAmount,
    refundQty,
    avgCustomer: totalCustomer ? Math.round(totalSales / totalCustomer) : 0,
    avgSet: totalQty ? Math.round(totalSales / totalQty) : 0,
    savedAt: new Date().toISOString(),
  };
}



function buildSalesMonthlyRows() {
  const year = currentSalesMonth.getFullYear();

  return Array.from({ length: 12 }, (_, i) => {
    const monthNo = i + 1;
    const monthKey = `${year}-${String(monthNo).padStart(2, "0")}`;

    let sales = 0;

    currentSalesProducts.forEach((productId) => {
      const product = salesReportCache.products?.[productId];
      if (!product) return;

      if (currentSalesChannel === "naver" || currentSalesChannel === "all") {
        const report = product.channels.naver?.months?.[monthKey];
        sales += Number(report?.netSales ?? report?.totalSales ?? 0);
      }

      if (currentSalesChannel === "coupang" || currentSalesChannel === "all") {
        const report = product.channels.coupang?.months?.[monthKey];
        sales += Number(report?.netSales ?? report?.totalSales ?? 0);
      }
    });

    return {
      month: monthNo,
      sales,
      isCurrent: monthNo === currentSalesMonth.getMonth() + 1,
    };
  });
}

function openSalesModal() {
  // RAW 입력창을 열 때 현재 관리자 채널 목록으로 다시 생성
  renderSalesRawChannelSelect();

  document.getElementById("salesRawInput").value = "";
  document.getElementById("salesReportStart").value = "";
  document.getElementById("salesReportEnd").value = "";

  document
    .getElementById("salesModalBackdrop")
    .classList.add("show");
}

function closeSalesModal() {
  document.getElementById("salesModalBackdrop").classList.remove("show");
}

function toNumber(value) {
  return Number(String(value || "0").replace(/,/g, "").trim()) || 0;
}

function formatDateKey(dateStr) {
  return String(dateStr || "").slice(0, 10);
}

function formatDateKey(dateStr) {
  return String(dateStr || "").slice(0, 10);
}

/**
 * 2026-08-01 → 08.01
 */
 function formatDailySalesTitleDate(dateKey) {
  if (!dateKey) return "";

  const parts = String(dateKey).split("-");

  if (parts.length !== 3) {
    return dateKey;
  }

  const month = parts[1];
  const day = parts[2];

  return `${month}.${day}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function parseSalesRawRows(rawRows, channel) {
  if (channel === "coupang") {
    return parseCoupangSalesRawRows(rawRows);
  }

  return parseNaverSalesRawRows(rawRows);
}

function parseNaverSalesRawRows(rawRows) {
  return rawRows
    .map((row) => row.split("\t"))
    .filter((cols) => cols[0] && (cols[0].includes("월") || cols[0].startsWith("202")))
    .map((cols) => {
      const dateText = String(cols[0] || "").trim();

      let date = "";

      // 07월 01일 형식 대응
      if (dateText.includes("월")) {
        const monthMatch = dateText.match(/(\d{1,2})월\s*(\d{1,2})일/);
        const year = currentSalesMonth.getFullYear();

        if (monthMatch) {
          const month = String(monthMatch[1]).padStart(2, "0");
          const day = String(monthMatch[2]).padStart(2, "0");
          date = `${year}-${month}-${day}`;
        }
      } else {
        // 2026-07-01 형식 대응
        date = formatDateKey(dateText);
      }

      return {
        channel: "naver",
        date,

        customers: toNumber(cols[1]),
        orderCount: toNumber(cols[1]),

        sales: toNumber(cols[2]),       // 판매금액
        qty: toNumber(cols[4]),         // 결제상품수량

        refundCount: 0,                 // 더 이상 입력 안받음
        refundAmount: toNumber(cols[3]),// 환불금액
        refundQty: toNumber(cols[5]),   // 환불상품수량
      };
    })
    .filter((row) => row.date);
}

function parseCoupangSalesRawRows(rawRows) {
  return rawRows
    .map((row) => row.split("\t"))
    .filter(
      (cols) =>
        cols[0] &&
        (cols[0].includes("월") || /^\d{4}-\d{1,2}-\d{1,2}/.test(cols[0].trim()))
    )
    .map((cols) => {
      const dateText = String(cols[0] || "").trim();

      let date = "";

      // 07월 01일 형식
      if (dateText.includes("월")) {
        const monthMatch = dateText.match(/(\d{1,2})월\s*(\d{1,2})일/);
        const year = currentSalesMonth.getFullYear();

        if (monthMatch) {
          const month = String(monthMatch[1]).padStart(2, "0");
          const day = String(monthMatch[2]).padStart(2, "0");
          date = `${year}-${month}-${day}`;
        }
      } else {
        // 2026-07-01 형식
        date = formatDateKey(dateText);
      }

      return {
        channel: "coupang",
        date,

        customers: toNumber(cols[1]),
        orderCount: toNumber(cols[1]),

        sales: toNumber(cols[2]),
        refundAmount: toNumber(cols[3]),

        qty: toNumber(cols[4]),
        refundQty: toNumber(cols[5]),

        refundCount: 0,
      };
    })
    .filter((row) => row.date);
}

function buildSalesReportData(rawRows, start, end, channel = "naver", productId = "blackgoat_30") {
  const parsedRows = parseSalesRawRows(rawRows, channel);

  const baseDate = start || parsedRows[0]?.date;
  if (!baseDate) return null;

  const year = Number(baseDate.slice(0, 4));
  const month = Number(baseDate.slice(5, 7));
  const lastDay = getDaysInMonth(year, month);

  const byDate = new Map();
  parsedRows.forEach((row) => {
    byDate.set(row.date, row);
  });

  const dailyRows = [];

  for (let day = 1; day <= lastDay; day++) {
    const dayText = String(day).padStart(2, "0");
    const date = `${year}-${String(month).padStart(2, "0")}-${dayText}`;
    const source = byDate.get(date);

    const isOutOfRange =
      (start && date < start) ||
      (end && date > end);

    dailyRows.push({
      date,
      day,
      customers: source?.customers || 0,
      orderCount: source?.orderCount || 0,
      qty: source?.qty || 0,
      sales: source?.sales || 0,
      refundCount: source?.refundCount || 0,
      refundAmount: source?.refundAmount || 0,
      refundQty: source?.refundQty || 0,
      isOutOfRange,
    });
  }

  const validRows = dailyRows.filter((row) => !row.isOutOfRange);

  const grossSales = validRows.reduce((sum, row) => sum + row.sales, 0);
  const grossQty = validRows.reduce((sum, row) => sum + row.qty, 0);
  const grossCustomer = validRows.reduce((sum, row) => sum + row.customers, 0);

  const refundCount = validRows.reduce((sum, row) => sum + row.refundCount, 0);
  const refundAmount = validRows.reduce((sum, row) => sum + row.refundAmount, 0);
  const refundQty = validRows.reduce((sum, row) => sum + (row.refundQty || 0), 0);

  const totalCustomer = grossCustomer;
  const totalQty = grossQty;
  const totalSales = grossSales;
  const netSales = Math.max(grossSales - refundAmount, 0);

  const monthlyRows = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    sales: i + 1 === month ? totalSales : 0,
    isCurrent: i + 1 === month,
  }));

  return {
    productId,
    productName: getSalesProductName(productId),
    channel,
    year,
    month,
    start,
    end,
    dailyRows,
    monthlyRows,
    totalCustomer,
    totalQty,
    totalSales,
    netSales,
    refundCount,
    refundAmount,
    refundQty,
    avgCustomer: totalCustomer ? Math.round(totalSales / totalCustomer) : 0,
    avgSet: totalQty ? Math.round(totalSales / totalQty) : 0,
    savedAt: new Date().toISOString(),
  };
}

function applySalesRaw() {
  const raw = document.getElementById("salesRawInput").value;
  const channel = document.getElementById("salesRawChannel").value;
  const productId = document.getElementById("salesRawProduct").value;
  const start = document.getElementById("salesReportStart").value;
  const end = document.getElementById("salesReportEnd").value;

  if (!raw.trim()) {
    alert("Raw 데이터를 입력해주세요.");
    return;
  }

  if (!start || !end) {
    alert("기준 시작일과 종료일을 입력해주세요.");
    return;
  }

  const rows = raw.split("\n").filter(Boolean);
  const reportData = buildSalesReportData(rows, start, end, channel, productId);

  if (!reportData) {
    alert("분석할 수 있는 매출 데이터가 없습니다.");
    return;
  }

  saveSalesReportToServer(reportData)
      .then(() => {
      renderSalesReport(getVisibleSalesReport());
      closeSalesModal();
      alert("상품 매출보고가 클라우드에 저장되었습니다.");
    })
    .catch((e) => {
      console.error(e);
      renderSalesReport(reportData);
      closeSalesModal();
      alert("클라우드 저장은 실패했지만 화면에는 반영했습니다.");
    });
}
function renderSalesReport(data) {
  updateSalesMonthLabel();

  document.getElementById("salesTotalCustomers").innerText =
    data.totalCustomer.toLocaleString() + "건";
  document.getElementById("salesTotalQty").innerText =
    data.totalQty.toLocaleString() + "개";
  document.getElementById("salesTotalAmount").innerText =
    data.totalSales.toLocaleString() + "원";
  document.getElementById("salesAvgCustomer").innerText =
    data.avgCustomer.toLocaleString() + "원";
    document.getElementById("salesRefundCount").innerText =
      Number(data.refundQty || 0).toLocaleString() + "개";

    document.getElementById("salesRefundAmount").innerText =
      data.refundAmount.toLocaleString() + "원";

    document.getElementById("salesNetAmount").innerText =
      Number(data.netSales || 0).toLocaleString() + "원";

    renderSalesDailyTable(data.dailyRows);
    renderSalesMonthlyTable(data.monthlyRows);
    renderSalesDailyChart(data.dailyRows);
    renderSalesTopDays(data.dailyRows);
    renderSalesChannelSummary();
    loadSalesSpecialNote();
}

function renderSalesDailyTable(rows) {
  let html = `
    <table class="sales-report-table">
      <tr>
        <th>날짜</th>
        <th>주문건수</th>
        <th>판매수량(개)</th>
        <th>매출(원)</th>
      </tr>
  `;

  rows.forEach((row) => {
    html += `
      <tr class="${row.isOutOfRange ? "out-range" : ""}">
        <td>${row.date.slice(5).replace("-", ".")}</td>
        <td>${row.customers || "-"}</td>
        <td>${row.qty || "-"}</td>
        <td class="amount">${row.sales ? row.sales.toLocaleString() : "0"}</td>
      </tr>
    `;
  });

  html += "</table>";
  document.getElementById("salesDailyTableWrap").innerHTML = html;
}



function renderSalesMonthlyTable(rows) {
  const maxSales = Math.max(...rows.map((row) => Number(row.sales || 0)), 1);

  let html = `<div class="monthly-sales-list vertical">`;

  rows.forEach((row) => {
    const sales = Number(row.sales || 0);
    const height = sales ? Math.max((sales / maxSales) * 100, 8) : 0;

    html += `
      <div class="monthly-sales-col ${row.isCurrent ? "current" : ""}">
        <div class="monthly-amount-vertical">
          ${sales ? sales.toLocaleString() : ""}
        </div>
        <div class="monthly-bar-vertical-wrap">
          <div class="monthly-bar-vertical" style="height:${height}%"></div>
        </div>
        <div>${row.month}월</div>
      </div>
    `;
  });

  html += `</div>`;
  document.getElementById("salesMonthlyTableWrap").innerHTML = html;
}

function renderSalesDailyChart(rows) {
  const canvas = document.getElementById("salesDailyChart");
  if (!canvas) return;

  const parent = canvas.parentElement;
  const width = parent.clientWidth - 36;
  const height = 300;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.height = height + "px";

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const chartRows = (rows || []).filter((row) => !row.isOutOfRange);
  const maxSales = Math.max(...chartRows.map((row) => Number(row.sales || 0)), 1);

  const paddingLeft = 56;
  const paddingRight = 24;
  const paddingTop = 34;
  const paddingBottom = 42;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const NAVER_COLOR = "#2DB400";
  const COUPANG_COLOR = "#E94B22";
  const SINGLE_COLOR = "#1d5fd1";

  const legend = document.getElementById("salesChartLegend");
  if (legend) {
    if (currentSalesChannel === "all") {
      legend.innerHTML = `
        <span style="color:${NAVER_COLOR}; font-weight:800;">■ 네이버</span>
        &nbsp;&nbsp;
        <span style="color:${COUPANG_COLOR}; font-weight:800;">■ 쿠팡</span>
      `;
    } else {
      legend.innerHTML = "";
    }
  }

  ctx.strokeStyle = "#e5eaf2";
  ctx.lineWidth = 1;
  ctx.font = "11px Pretendard";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "right";

  for (let i = 0; i <= 5; i++) {
    const y = paddingTop + (chartHeight / 5) * i;
    const value = Math.round(maxSales - (maxSales / 5) * i);

    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillText(value.toLocaleString(), paddingLeft - 8, y + 4);
  }

  const count = chartRows.length || 1;
  const slotWidth = chartWidth / count;
  const barWidth = Math.min(26, Math.max(10, slotWidth * 0.48));

  chartRows.forEach((row, index) => {
    const totalSales = Number(row.sales || 0);
    const naverSales =
      currentSalesChannel === "all"
        ? Number(row.naverSales || 0)
        : totalSales;
    const coupangSales =
      currentSalesChannel === "all"
        ? Number(row.coupangSales || 0)
        : 0;

    const x = paddingLeft + slotWidth * index + slotWidth / 2 - barWidth / 2;
    const baseY = paddingTop + chartHeight;

    const totalHeight = totalSales ? (totalSales / maxSales) * chartHeight : 0;
    const naverHeight = totalSales
      ? (naverSales / maxSales) * chartHeight
      : 0;
    const coupangHeight = totalSales
      ? (coupangSales / maxSales) * chartHeight
      : 0;

    if (currentSalesChannel === "all") {
      ctx.fillStyle = NAVER_COLOR;
      ctx.fillRect(x, baseY - naverHeight, barWidth, naverHeight);

      ctx.fillStyle = COUPANG_COLOR;
      ctx.fillRect(
        x,
        baseY - naverHeight - coupangHeight,
        barWidth,
        coupangHeight
      );
    } else {
      ctx.fillStyle = SINGLE_COLOR;
      ctx.fillRect(x, baseY - totalHeight, barWidth, totalHeight);
    }

    if (totalSales > 0) {
      ctx.font = "10px Pretendard";
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.fillText(
        totalSales.toLocaleString(),
        x + barWidth / 2,
        baseY - totalHeight - 8
      );
    }

    ctx.font = "11px Pretendard";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText(
      row.date.slice(5).replace("-", "/"),
      x + barWidth / 2,
      height - 12
    );
  });
}


function renderSalesTopDays(rows) {
  const wrap = document.getElementById("salesTopDaysWrap");
  if (!wrap) return;

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const icons = ["🏆", "🥈", "🥉"];

  const topRows = (rows || [])
    .filter((row) => !row.isOutOfRange && Number(row.sales || 0) > 0)
    .sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0))
    .slice(0, 3);

  const fixedRows = [0, 1, 2].map((index) => topRows[index] || null);

  wrap.innerHTML = fixedRows
    .map((row, index) => {
      if (!row) {
        return `
          <div class="top-sales-row">
            <div class="top-rank-icon">${icons[index]}</div>
            <div class="top-sales-date">-</div>
            <div class="top-sales-amount">-</div>
          </div>
        `;
      }

      const dateObj = new Date(row.date);
      const dayName = dayNames[dateObj.getDay()];
      const dateText = row.date.slice(5).replace("-", "/");

      return `
        <div class="top-sales-row">
          <div class="top-rank-icon">${icons[index]}</div>
          <div class="top-sales-date">
            ${dateText}
            <span>(${dayName})</span>
          </div>
          <div class="top-sales-amount">
            ${Number(row.sales || 0).toLocaleString()}원
          </div>
        </div>
      `;
    })
    .join("");
}

function getSalesNoteKey() {
  return `product_sales_note_${currentSalesChannel}_${getSalesMonthKey()}`;
}

let salesNoteSaveTimer = null;

function loadSalesSpecialNote() {
  const noteEl =
    document.getElementById("salesSpecialNote");

  if (!noteEl) return;

  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const noteKey = getSalesNoteKey();

  noteEl.value =
    salesReportCache.notes?.[noteKey]?.text || "";

  setSalesNoteSaveStatus(
    noteEl.value ? "저장됨" : "자동 저장"
  );
}

function setSalesNoteSaveStatus(text, type = "") {
  const statusEl =
    document.getElementById("salesNoteSaveStatus");

  if (!statusEl) return;

  statusEl.innerText = text;

  if (type === "success") {
    statusEl.style.color = "#16a34a";
  } else if (type === "error") {
    statusEl.style.color = "#dc2626";
  } else {
    statusEl.style.color = "#64748b";
  }
}

function saveSalesSpecialNote() {
  const noteEl =
    document.getElementById("salesSpecialNote");

  if (!noteEl) return;

  clearTimeout(salesNoteSaveTimer);

  setSalesNoteSaveStatus("입력 중");

  salesNoteSaveTimer = setTimeout(async () => {
    try {
      setSalesNoteSaveStatus("저장 중");

      salesReportCache =
        normalizeSalesStorage(salesReportCache);

      const noteKey = getSalesNoteKey();
      const text = noteEl.value.trim();
      const currentUser = getCurrentUser();

      if (text) {
        salesReportCache.notes[noteKey] = {
          text,
          productIds: currentSalesProducts
            .map(String)
            .sort(),
          channel: currentSalesChannel,
          monthKey: getSalesMonthKey(),
          savedBy: {
            id: currentUser?.id || "",
            name: currentUser?.name || "",
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        delete salesReportCache.notes[noteKey];
      }

      salesReportCache.updatedAt =
        new Date().toISOString();

      await apiPost(
        "/blackgoat-sales",
        salesReportCache
      );

      setSalesNoteSaveStatus("저장됨", "success");
    } catch (e) {
      console.error(
        "특이사항 클라우드 저장 실패:",
        e
      );

      setSalesNoteSaveStatus("저장 실패", "error");
    }
  }, 200);
}

function saveSalesSpecialNote() {
  const noteEl =
    document.getElementById("salesSpecialNote");

  if (!noteEl) return;

  clearTimeout(salesNoteSaveTimer);

  setSalesNoteSaveStatus("입력 중", "saving");

  salesNoteSaveTimer = setTimeout(async () => {
    try {
      setSalesNoteSaveStatus("저장 중", "saving");

      salesReportCache =
        normalizeSalesStorage(salesReportCache);

      const noteKey = getSalesNoteKey();
      const currentUser = getCurrentUser();
      const text = noteEl.value.trim();

      if (text) {
        salesReportCache.notes[noteKey] = {
          text,
          productIds: currentSalesProducts
            .map(String)
            .sort(),
          channel: currentSalesChannel,
          monthKey: getSalesMonthKey(),
          savedBy: {
            id: currentUser?.id || "",
            name: currentUser?.name || "",
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        delete salesReportCache.notes[noteKey];
      }

      salesReportCache.updatedAt =
        new Date().toISOString();

      await apiPost(
        "/blackgoat-sales",
        salesReportCache
      );

      setSalesNoteSaveStatus("저장됨", "success");

      console.log(
        "특이사항 클라우드 저장 완료:",
        noteKey
      );
    } catch (e) {
      console.error(
        "특이사항 클라우드 저장 실패:",
        e
      );

      setSalesNoteSaveStatus(
        "저장 실패",
        "error"
      );
    }
  }, 700);
}


function renderSalesChannelSummary() {
  const wrap = document.getElementById("salesChannelSummaryWrap");
  if (!wrap) return;

  if (currentSalesChannel !== "all") {
    const report = getVisibleSalesReport();

    const grossSales = (report.dailyRows || [])
      .filter((row) => !row.isOutOfRange)
      .reduce((sum, row) => sum + Number(row.sales || 0), 0);

    const refundAmount = Number(report.refundAmount || 0);
    const netSales = Math.max(grossSales - refundAmount, 0);

    const refundRatio = grossSales
      ? Math.round((refundAmount / grossSales) * 1000) / 10
      : 0;

    const netRatio = Math.max(100 - refundRatio, 0);

    wrap.innerHTML = `
      <div class="channel-summary-row">
        <div class="channel-badge naver">S</div>
        <div>정상매출</div>
        <div class="channel-summary-amount">
          ${netSales.toLocaleString()}원
          <span class="channel-summary-ratio naver">${netRatio}%</span>
        </div>
      </div>

      <div class="channel-summary-row">
        <div class="channel-badge coupang">R</div>
        <div>환불</div>
        <div class="channel-summary-amount">
          ${refundAmount.toLocaleString()}원
          <span class="channel-summary-ratio coupang">${refundRatio}%</span>
        </div>
      </div>
    `;
    return;
  }

  const storage = normalizeSalesStorage(salesReportCache);
  const monthKey = getSalesMonthKey();

  let naverSales = 0;
  let coupangSales = 0;

  currentSalesProducts.forEach((productId) => {
    const product = storage.products?.[productId];
    if (!product) return;

    naverSales += Number(product.channels.naver?.months?.[monthKey]?.totalSales || 0);
    coupangSales += Number(product.channels.coupang?.months?.[monthKey]?.totalSales || 0);
  });

  const total = naverSales + coupangSales;

  const naverRatio = total
    ? Math.round((naverSales / total) * 1000) / 10
    : 0;

  const coupangRatio = total
    ? Math.round((coupangSales / total) * 1000) / 10
    : 0;

  wrap.innerHTML = `
    <div class="channel-summary-row">
      <div class="channel-badge naver">N</div>
      <div>네이버</div>
      <div class="channel-summary-amount">
        ${naverSales.toLocaleString()}원
        <span class="channel-summary-ratio naver">${naverRatio}%</span>
      </div>
    </div>

    <div class="channel-summary-row">
      <div class="channel-badge coupang">C</div>
      <div>쿠팡</div>
      <div class="channel-summary-amount">
        ${coupangSales.toLocaleString()}원
        <span class="channel-summary-ratio coupang">${coupangRatio}%</span>
      </div>
    </div>
  `;
}


// =========================
// 상품별 일매출 현황
// =========================

function showProductDailySalesPage() {
  showPage("page-product-daily-sales");

  document
    .querySelectorAll(".sales-channel-nav")
    .forEach((el) => el.classList.remove("active"));

  document
    .getElementById("nav-sales-product-daily")
    ?.classList.add("active");

  document
    .getElementById("nav-sales-main")
    ?.classList.add("active");

  const dateInput = document.getElementById(
    "productDailySalesDate"
  );

  if (dateInput && !dateInput.value) {
    dateInput.value =
      getLatestProductDailySalesDate() ||
      getTodayDateKey();
  }

  renderProductDailySalesPage();
}


// =========================
// 채널별 일매출 현황
// =========================

function showChannelDailySalesPage() {
  showPage(
    "page-channel-daily-sales"
  );

  document
    .querySelectorAll(
      ".sales-channel-nav"
    )
    .forEach((el) => {
      el.classList.remove("active");
    });

  document
    .getElementById(
      "nav-sales-channel-daily"
    )
    ?.classList.add("active");

  document
    .getElementById(
      "nav-sales-main"
    )
    ?.classList.add("active");

  const dateInput =
    document.getElementById(
      "channelDailySalesDate"
    );

  if (
    dateInput &&
    !dateInput.value
  ) {
    dateInput.value =
      getLatestChannelDailySalesDate() ||
      getTodayDateKey();
  }

  renderChannelDailySalesTabs();
  renderChannelDailySalesPage();
}


function getChannelDailySalesData(
  channelId,
  dateKey
) {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const monthKey =
    getMonthKeyFromDateKey(dateKey);

  const result = {
    qty: 0,
    sales: 0,
    refundAmount: 0,
    refundQty: 0,
    orderCount: 0,
  };

  if (!channelId || !monthKey) {
    return result;
  }

  getActiveSalesProducts().forEach(
    (product) => {
      const report =
        salesReportCache
          .products?.[product.id]
          ?.channels?.[channelId]
          ?.months?.[monthKey];

      const row =
        getSalesDailyRowFromReport(
          report,
          dateKey
        );

      if (!row) return;

      result.qty += Number(
        row.qty || 0
      );

      result.sales += Number(
        row.sales || 0
      );

      result.refundAmount += Number(
        row.refundAmount || 0
      );

      result.refundQty += Number(
        row.refundQty || 0
      );

      result.orderCount += Number(
        row.orderCount ??
        row.customers ??
        0
      );
    }
  );

  return result;
}

/**
 * 특정 채널·특정 상품·특정 날짜의 매출 조회
 */
 function getChannelProductDailySalesData(
  channelId,
  productId,
  dateKey
) {
  salesReportCache =
    normalizeSalesStorage(
      salesReportCache
    );

  const monthKey =
    getMonthKeyFromDateKey(
      dateKey
    );

  const report =
    salesReportCache
      .products?.[productId]
      ?.channels?.[channelId]
      ?.months?.[monthKey];

  const row =
    getSalesDailyRowFromReport(
      report,
      dateKey
    );

  if (!row) {
    return {
      orderCount: 0,
      qty: 0,
      sales: 0,
      refundAmount: 0,
      refundQty: 0,
    };
  }

  return {
    orderCount: Number(
      row.orderCount ??
      row.customers ??
      0
    ),

    qty: Number(
      row.qty || 0
    ),

    sales: Number(
      row.sales || 0
    ),

    refundAmount: Number(
      row.refundAmount || 0
    ),

    refundQty: Number(
      row.refundQty || 0
    ),
  };
}


function getLatestChannelDailySalesDate() {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const dates = [];

  const products =
    getActiveSalesProducts();

  const channels =
    getActiveSalesChannels();

  products.forEach((product) => {
    channels.forEach((channel) => {
      const months =
        salesReportCache
          .products?.[product.id]
          ?.channels?.[channel.id]
          ?.months || {};

      Object.values(months).forEach(
        (report) => {
          (report?.dailyRows || [])
            .filter(
              (row) =>
                row?.date &&
                !row.isOutOfRange &&
                (
                  Number(row.sales || 0) > 0 ||
                  Number(row.qty || 0) > 0 ||
                  Number(
                    row.refundAmount || 0
                  ) > 0
                )
            )
            .forEach((row) => {
              dates.push(row.date);
            });
        }
      );
    });
  });

  if (!dates.length) {
    return "";
  }

  return dates.sort().at(-1);
}


function renderChannelDailySalesPage() {
  const dateInput =
    document.getElementById(
      "channelDailySalesDate"
    );

  const wrap =
    document.getElementById(
      "channelDailySalesTableWrap"
    );

  if (!dateInput || !wrap) {
    return;
  }

  const selectedDate =
    dateInput.value ||
    getLatestChannelDailySalesDate() ||
    getTodayDateKey();

  dateInput.value =
    selectedDate;
    
    const footnote =
      document.getElementById(
        "channelDailySalesFootnote"
      );

    if (footnote) {
      footnote.innerText =
        `조회일 ${selectedDate} 기준 · 판매금액과 판매수량은 환불 차감 전이며, 환불금액은 환불 발생일 기준으로 별도 표시됩니다.`;
    }

    const title =
      document.getElementById(
        "channelDailySalesTitle"
      );

    if (title) {
      const channelLabel =
        getSalesChannelLabel(
          currentChannelDailySalesChannel
        );

      title.innerText =
        `${formatDailySalesTitleDate(
          selectedDate
        )} ${channelLabel} 일매출 현황`;
    }

  const selectedChannelId =
    currentChannelDailySalesChannel;

  if (!selectedChannelId) {
    renderChannelDailySummary([]);

    wrap.innerHTML = `
      <div class="product-daily-empty">
        사용 중인 판매 채널이 없습니다.
      </div>
    `;

    return;
  }

  const previousDate =
    addDaysToDateKey(
      selectedDate,
      -1
    );

  const previousWeekDate =
    addDaysToDateKey(
      selectedDate,
      -7
    );

  const products =
    getActiveSalesProducts();

  const rows = products
    .map((product) => {
      const today =
        getChannelProductDailySalesData(
          selectedChannelId,
          product.id,
          selectedDate
        );

      const yesterday =
        getChannelProductDailySalesData(
          selectedChannelId,
          product.id,
          previousDate
        );

      const previousWeek =
        getChannelProductDailySalesData(
          selectedChannelId,
          product.id,
          previousWeekDate
        );

      return {
        productId:
          product.id,

        productName:
          product.name,

        sortOrder: Number(
          product.sortOrder || 999
        ),

        orderCount:
          today.orderCount,

        qty:
          today.qty,

        sales:
          today.sales,

        refundAmount:
          today.refundAmount,

        refundQty:
          today.refundQty,

        previousSales:
          yesterday.sales,

        previousWeekSales:
          previousWeek.sales,

        dayChange:
          getProductSalesChange(
            today.sales,
            yesterday.sales
          ),

        weekChange:
          getProductSalesChange(
            today.sales,
            previousWeek.sales
          ),
      };
    })
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder
    );

  renderChannelDailySummary(rows);

  renderChannelDailySalesTable(
    rows,
    selectedDate,
    previousDate,
    previousWeekDate
  );
}

function renderChannelDailySummary(
  rows
) {
  const totalOrderCount =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.orderCount || 0
        ),
      0
    );

  const totalQty =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.qty || 0),
      0
    );

  const totalSales =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.sales || 0),
      0
    );

  const refundAmount =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.refundAmount || 0
        ),
      0
    );

  document.getElementById(
    "channelDailyOrderCount"
  ).innerText =
    `${totalOrderCount.toLocaleString()}건`;

  document.getElementById(
    "channelDailyTotalQty"
  ).innerText =
    `${totalQty.toLocaleString()}개`;

  document.getElementById(
    "channelDailyTotalSales"
  ).innerText =
    `${totalSales.toLocaleString()}원`;

  document.getElementById(
    "channelDailyRefundAmount"
  ).innerText =
    `${refundAmount.toLocaleString()}원`;
}


function renderChannelDailySalesTable(
  rows,
  selectedDate,
  previousDate,
  previousWeekDate
) {
  const wrap =
    document.getElementById(
      "channelDailySalesTableWrap"
    );

  if (!wrap) return;

  // 실제 판매 또는 환불 데이터가 있는 상품만 표시
  const visibleRows = rows;

  if (!visibleRows.length) {
    wrap.innerHTML = `
      <div class="product-daily-empty">
        ${escapeHtml(selectedDate)}에 판매된 상품이 없습니다.
      </div>
    `;

    return;
  }

  const totalOrderCount =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.orderCount || 0
        ),
      0
    );

  const totalQty =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(row.qty || 0),
      0
    );

  const totalSales =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(row.sales || 0),
      0
    );

  const totalRefund =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.refundAmount || 0
        ),
      0
    );

  const totalPreviousSales =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.previousSales || 0
        ),
      0
    );

  const totalPreviousWeekSales =
    visibleRows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.previousWeekSales || 0
        ),
      0
    );

  const totalDayChange =
    getProductSalesChange(
      totalSales,
      totalPreviousSales
    );

  const totalWeekChange =
    getProductSalesChange(
      totalSales,
      totalPreviousWeekSales
    );

  wrap.innerHTML = `
    <table class="product-daily-table">
      <colgroup>
        <col style="width:22%;">
        <col style="width:10%;">
        <col style="width:10%;">
        <col style="width:15%;">
        <col style="width:13%;">
        <col style="width:15%;">
        <col style="width:15%;">
      </colgroup>

      <thead>
        <tr>
          <th>상품명</th>
          <th>주문건수</th>
          <th>판매수량</th>
          <th>판매금액</th>
          <th>환불금액</th>

          <th>
            전일 대비<br>
            <small>
              ${previousDate}
            </small>
          </th>

          <th>
            전주 대비<br>
            <small>
              ${previousWeekDate}
            </small>
          </th>
        </tr>
      </thead>

      <tbody>
        ${visibleRows
          .map(
            (row) => `
              <tr>
                <td class="product-name">
                  ${escapeHtml(
                    row.productName
                  )}
                </td>

                <td class="number">
                  ${row.orderCount.toLocaleString()}건
                </td>

                <td class="number">
                  ${row.qty.toLocaleString()}개
                </td>

                <td class="sales-amount">
                  ${row.sales.toLocaleString()}원
                </td>

                <td class="refund-amount">
                  ${
                    row.refundAmount
                      ? `${row.refundAmount.toLocaleString()}원`
                      : "-"
                  }
                </td>

                <td>
                  ${renderProductSalesChange(
                    row.dayChange
                  )}
                </td>

                <td>
                  ${renderProductSalesChange(
                    row.weekChange
                  )}
                </td>
              </tr>
            `
          )
          .join("")}

        <tr class="total-row">
          <td>합계</td>

          <td class="number">
            ${totalOrderCount.toLocaleString()}건
          </td>

          <td class="number">
            ${totalQty.toLocaleString()}개
          </td>

          <td class="sales-amount">
            ${totalSales.toLocaleString()}원
          </td>

          <td class="refund-amount">
            ${
              totalRefund
                ? `${totalRefund.toLocaleString()}원`
                : "-"
            }
          </td>

          <td>
            ${renderProductSalesChange(
              totalDayChange
            )}
          </td>

          <td>
            ${renderProductSalesChange(
              totalWeekChange
            )}
          </td>
        </tr>
      </tbody>
    </table>
  `;
}


/**
 * 로컬 시간 기준 오늘 날짜를 YYYY-MM-DD로 반환
 */
function getTodayDateKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}


/**
 * YYYY-MM-DD 날짜에 일수를 더하거나 뺌
 * 예: addDaysToDateKey("2026-07-31", -1)
 */
function addDaysToDateKey(dateKey, amount) {
  if (!dateKey) return "";

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() + amount);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}


/**
 * YYYY-MM-DD에서 YYYY-MM 반환
 */
function getMonthKeyFromDateKey(dateKey) {
  return String(dateKey || "").slice(0, 7);
}


/**
 * 특정 보고서에서 특정 날짜 행 조회
 */
function getSalesDailyRowFromReport(report, dateKey) {
  if (!report) return null;

  return (report.dailyRows || []).find(
    (row) =>
      row.date === dateKey &&
      !row.isOutOfRange
  ) || null;
}


/**
 * 상품 1개의 특정 날짜 판매 데이터를 채널 합산
 *
 * 판매금액과 판매수량은 환불 차감 전
 * 환불은 별도 반환
 */
function getProductDailySalesData(
  productId,
  dateKey
) {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const monthKey =
    getMonthKeyFromDateKey(dateKey);

  const product =
    salesReportCache.products?.[productId];

  const result = {
    qty: 0,
    sales: 0,
    refundAmount: 0,
    refundQty: 0,
    orderCount: 0,
  };

  if (!product || !monthKey) {
    return result;
  }

  ["naver", "coupang"].forEach((channel) => {
    const report =
      product.channels?.[channel]?.months?.[
        monthKey
      ];

    const row =
      getSalesDailyRowFromReport(
        report,
        dateKey
      );

    if (!row) return;

    result.qty += Number(row.qty || 0);
    result.sales += Number(row.sales || 0);

    result.refundAmount += Number(
      row.refundAmount || 0
    );

    result.refundQty += Number(
      row.refundQty || 0
    );

    result.orderCount += Number(
      row.orderCount ??
      row.customers ??
      0
    );
  });

  return result;
}


/**
 * 매출 데이터가 저장된 가장 최근 날짜 조회
 *
 * 사용 중인 상품 기준
 */
function getLatestProductDailySalesDate() {
  salesReportCache =
    normalizeSalesStorage(salesReportCache);

  const activeProductIds =
    getActiveSalesProducts().map(
      (product) => product.id
    );

  const dates = [];

  activeProductIds.forEach((productId) => {
    const product =
      salesReportCache.products?.[productId];

    if (!product) return;

    ["naver", "coupang"].forEach((channel) => {
      const months =
        product.channels?.[channel]?.months ||
        {};

      Object.values(months).forEach(
        (report) => {
          (report?.dailyRows || []).forEach(
            (row) => {
              if (
                !row.date ||
                row.isOutOfRange
              ) {
                return;
              }

              const hasData =
                Number(row.sales || 0) !== 0 ||
                Number(row.qty || 0) !== 0 ||
                Number(row.refundAmount || 0) !== 0 ||
                Number(row.refundQty || 0) !== 0;

              if (hasData) {
                dates.push(row.date);
              }
            }
          );
        }
      );
    });
  });

  return dates.sort().at(-1) || "";
}


/**
 * 전일·전주 대비 표시값 계산
 *
 * 비교일 0원, 당일 매출 발생 → 신규
 * 비교일 매출 있음, 당일 0원 → ▼100%
 * 둘 다 0원 → -
 */
function getProductSalesChange(
  currentSales,
  previousSales
) {
  const current =
    Number(currentSales || 0);

  const previous =
    Number(previousSales || 0);

  const amount = current - previous;

  if (previous === 0 && current === 0) {
    return {
      type: "none",
      label: "-",
      amount: 0,
    };
  }

  if (previous === 0 && current > 0) {
    return {
      type: "up",
      label: "신규",
      amount,
    };
  }

  const rate =
    ((current - previous) / previous) * 100;

  if (rate > 0) {
    return {
      type: "up",
      label: `▲ ${formatSalesChangeRate(rate)}`,
      amount,
    };
  }

  if (rate < 0) {
    return {
      type: "down",
      label: `▼ ${formatSalesChangeRate(
        Math.abs(rate)
      )}`,
      amount,
    };
  }

  return {
    type: "same",
    label: "0.0%",
    amount: 0,
  };
}


function formatSalesChangeRate(rate) {
  return `${Math.round(rate * 10) / 10}%`;
}


function formatSignedSalesAmount(amount) {
  const value = Number(amount || 0);

  if (value > 0) {
    return `+${value.toLocaleString()}원`;
  }

  if (value < 0) {
    return `${value.toLocaleString()}원`;
  }

  return "0원";
}


function renderProductSalesChange(change) {
  return `
    <div class="sales-change ${change.type}">
      <span class="sales-change-rate">
        ${change.label}
      </span>

      ${
        change.type === "none"
          ? ""
          : `
            <span class="sales-change-amount">
              ${formatSignedSalesAmount(
                change.amount
              )}
            </span>
          `
      }
    </div>
  `;
}


/**
 * 상품별 일매출 페이지 렌더링
 */
function renderProductDailySalesPage() {
  const dateInput = document.getElementById(
    "productDailySalesDate"
  );

  const wrap = document.getElementById(
    "productDailySalesTableWrap"
  );

  if (!dateInput || !wrap) return;

  const selectedDate =
    dateInput.value ||
    getLatestProductDailySalesDate() ||
    getTodayDateKey();

  dateInput.value = selectedDate;

  const title =
    document.getElementById(
      "productDailySalesTitle"
    );

  if (title) {
    title.innerText =
      `${formatDailySalesTitleDate(
        selectedDate
      )} 상품별 일매출 현황`;
  }

  const previousDate =
    addDaysToDateKey(selectedDate, -1);

  const previousWeekDate =
    addDaysToDateKey(selectedDate, -7);

  // 사용 중인 상품만 자동 표시
  const products = getActiveSalesProducts();

  const rows = products.map((product) => {
    const today =
      getProductDailySalesData(
        product.id,
        selectedDate
      );

    const yesterday =
      getProductDailySalesData(
        product.id,
        previousDate
      );

    const previousWeek =
      getProductDailySalesData(
        product.id,
        previousWeekDate
      );

    return {
      productId: product.id,
      productName: product.name,
      sortOrder: Number(
        product.sortOrder || 999
      ),

      orderCount: today.orderCount,
      qty: today.qty,
      sales: today.sales,
      refundAmount: today.refundAmount,
      refundQty: today.refundQty,

      dayChange: getProductSalesChange(
        today.sales,
        yesterday.sales
      ),

      weekChange: getProductSalesChange(
        today.sales,
        previousWeek.sales
      ),
    };
  });

  rows.sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  renderProductDailySummary(rows);
  renderProductDailySalesTable(
    rows,
    selectedDate,
    previousDate,
    previousWeekDate
  );
}


/**
 * 상단 KPI 렌더링
 */
function renderProductDailySummary(rows) {

  const totalOrderCount = rows.reduce(
    (sum, row) =>
      sum + Number(row.orderCount || 0),
    0
  );

  const totalQty = rows.reduce(
    (sum, row) => sum + row.qty,
    0
  );

  const totalSales = rows.reduce(
    (sum, row) => sum + row.sales,
    0
  );

  const refundAmount = rows.reduce(
    (sum, row) => sum + row.refundAmount,
    0
  );

  document.getElementById(
    "productDailyOrderCount"
  ).innerText =
      `${totalOrderCount.toLocaleString()}건`;

  document.getElementById(
    "productDailyTotalQty"
  ).innerText =
    `${totalQty.toLocaleString()}개`;

  document.getElementById(
    "productDailyTotalSales"
  ).innerText =
    `${totalSales.toLocaleString()}원`;

  document.getElementById(
    "productDailyRefundAmount"
  ).innerText =
    `${refundAmount.toLocaleString()}원`;
}


/**
 * 상품별 표 렌더링
 */
function renderProductDailySalesTable(
  rows,
  selectedDate,
  previousDate,
  previousWeekDate
) {
  const wrap = document.getElementById(
    "productDailySalesTableWrap"
  );

  if (!wrap) return;

  if (!rows.length) {
    wrap.innerHTML = `
      <div class="product-daily-empty">
        사용 중인 상품이 없습니다.
      </div>
    `;
    return;
  }

  const totalOrderCount = rows.reduce(
    (sum, row) =>
      sum + Number(row.orderCount || 0),
    0
  );

  const totalQty = rows.reduce(
    (sum, row) => sum + row.qty,
    0
  );

  const totalSales = rows.reduce(
    (sum, row) => sum + row.sales,
    0
  );

  const totalRefund = rows.reduce(
    (sum, row) => sum + row.refundAmount,
    0
  );

  const totalPreviousSales = rows.reduce(
    (sum, row) => {
      const productData =
        getProductDailySalesData(
          row.productId,
          previousDate
        );

      return sum + productData.sales;
    },
    0
  );

  const totalPreviousWeekSales = rows.reduce(
    (sum, row) => {
      const productData =
        getProductDailySalesData(
          row.productId,
          previousWeekDate
        );

      return sum + productData.sales;
    },
    0
  );

  const totalDayChange =
    getProductSalesChange(
      totalSales,
      totalPreviousSales
    );

  const totalWeekChange =
    getProductSalesChange(
      totalSales,
      totalPreviousWeekSales
    );

  const html = `
    <table class="product-daily-table">
      <colgroup>
          <col style="width:22%;">
          <col style="width:10%;">
          <col style="width:10%;">
          <col style="width:15%;">
          <col style="width:13%;">
          <col style="width:15%;">
          <col style="width:15%;">
      </colgroup>


      <thead>
        <tr>
          <th>상품명</th>
          <th>주문건수</th>
          <th>판매수량</th>
          <th>판매금액</th>
          <th>환불금액</th>
          <th>
            전일 대비<br>
            <small>${previousDate}</small>
          </th>
          <th>
            전주 대비<br>
            <small>${previousWeekDate}</small>
          </th>
        </tr>
      </thead>

      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td class="product-name">
                  ${escapeHtml(row.productName)}
                </td>

                <td class="number">
                  ${Number(row.orderCount || 0).toLocaleString()}건
                </td>

                <td class="number">
                  ${row.qty.toLocaleString()}개
                </td>

                <td class="sales-amount">
                  ${row.sales.toLocaleString()}원
                </td>

                <td class="refund-amount">
                  ${
                    row.refundAmount
                      ? `${row.refundAmount.toLocaleString()}원`
                      : "-"
                  }
                </td>

                <td>
                  ${renderProductSalesChange(
                    row.dayChange
                  )}
                </td>

                <td>
                  ${renderProductSalesChange(
                    row.weekChange
                  )}
                </td>
              </tr>
            `
          )
          .join("")}

        <tr class="total-row">
          <td class="product-name">
            합계
          </td>

          <td class="number">
            ${totalOrderCount.toLocaleString()}건
          </td>

          <td class="number">
            ${totalQty.toLocaleString()}개
          </td>

          <td class="sales-amount">
            ${totalSales.toLocaleString()}원
          </td>

          <td class="refund-amount">
            ${
              totalRefund
                ? `${totalRefund.toLocaleString()}원`
                : "-"
            }
          </td>

          <td>
            ${renderProductSalesChange(
              totalDayChange
            )}
          </td>

          <td>
            ${renderProductSalesChange(
              totalWeekChange
            )}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="muted">
      조회일 ${selectedDate} 기준 · 판매금액과 판매수량은 환불 차감 전이며,
      환불은 환불 발생일 기준으로 별도 표시됩니다.
    </div>
  `;

  wrap.innerHTML = html;
}

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
