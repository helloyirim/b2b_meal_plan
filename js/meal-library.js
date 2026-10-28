      let menus = [];

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
      function getDefaultImage(src) {
        return src && src.trim() ? src : "https://via.placeholder.com/150";
      }
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
