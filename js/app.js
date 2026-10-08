      // =========================
      // 사용자 데이터 및 권한 정의
      // =========================


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
