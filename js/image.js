function processImg(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");

      const MAX_WIDTH = 300; // 180 -> 120 -> 300
      const scaleSize = Math.min(1, MAX_WIDTH / img.width);

      canvas.width = Math.round(img.width * scaleSize);
      canvas.height = Math.round(img.height * scaleSize);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressedData = canvas.toDataURL("image/png");

      document.getElementById("edit-img-base64").value = compressedData;
      document.getElementById("edit-preview").src = compressedData;
      document.getElementById("edit-preview").style.display = "block";
      document.getElementById("preview-text").style.display = "none";
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}
