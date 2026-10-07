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
