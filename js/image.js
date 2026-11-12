function processImg(e) {
  const file = e.target.files[0];
  if (!file) return;

  const MAX_LONG_SIDE = 300;
  const JPEG_QUALITY = 0.78;
  const MAX_COMPRESSED_DATA_URL_BYTES = 100 * 1024;

  if (!file.type || !file.type.startsWith("image/")) {
    alert("이미지 파일만 선택할 수 있습니다.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");

      const sourceWidth = img.naturalWidth || img.width;
      const sourceHeight = img.naturalHeight || img.height;
      const longestSide = Math.max(sourceWidth, sourceHeight);

      if (!Number.isFinite(longestSide) || longestSide <= 0) {
        alert("이미지 크기를 확인할 수 없습니다.");
        e.target.value = "";
        return;
      }

      const scaleSize = Math.min(1, MAX_LONG_SIDE / longestSide);

      canvas.width = Math.max(1, Math.round(sourceWidth * scaleSize));
      canvas.height = Math.max(1, Math.round(sourceHeight * scaleSize));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("이미지를 처리할 수 없습니다.");
        e.target.value = "";
        return;
      }

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressedData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const compressedSize = new TextEncoder().encode(compressedData).byteLength;

      if (
        !compressedData.startsWith("data:image/jpeg;base64,") ||
        compressedSize > MAX_COMPRESSED_DATA_URL_BYTES
      ) {
        alert("압축 후 이미지 크기는 100KB 이하여야 합니다.");
        e.target.value = "";
        return;
      }

      document.getElementById("edit-img-base64").value = compressedData;
      document.getElementById("edit-preview").src = compressedData;
      document.getElementById("edit-preview").style.display = "block";
      document.getElementById("preview-text").style.display = "none";
    };
    img.onerror = () => {
      alert("이미지를 불러올 수 없습니다.");
      e.target.value = "";
    };
    img.src = ev.target.result;
  };
  reader.onerror = () => {
    alert("이미지 파일을 읽을 수 없습니다.");
    e.target.value = "";
  };
  reader.readAsDataURL(file);
}
