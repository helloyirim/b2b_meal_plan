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


function getSalesChannelLabel(channelId) {
  if (channelId === "all") {
    return "통합";
  }

  return getSalesChannelName(channelId);
}
