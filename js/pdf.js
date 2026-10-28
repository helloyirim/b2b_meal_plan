async function saveAsPDF(id) {
  const target = document.getElementById(id);
  if (!target) return;

  const selectedEls = document.querySelectorAll(".drop-zone.selected");
  selectedEls.forEach((el) => {
    el.dataset.wasSelected = "true";
    el.classList.remove("selected");
  });

  let tempWrap = null;

  try {
    const rect = target.getBoundingClientRect();
    const realWidth = Math.round(rect.width);
    const realHeight = Math.round(rect.height);

    tempWrap = document.createElement("div");
    tempWrap.style.position = "fixed";
    tempWrap.style.left = "-100000px";
    tempWrap.style.top = "0";
    tempWrap.style.width = realWidth + "px";
    tempWrap.style.background = "#ffffff";
    tempWrap.style.padding = "0";
    tempWrap.style.margin = "0";
    tempWrap.style.zIndex = "-1";
    tempWrap.style.overflow = "hidden";

    const clone = target.cloneNode(true);
    clone.style.width = realWidth + "px";
    clone.style.minWidth = realWidth + "px";
    clone.style.maxWidth = realWidth + "px";
    clone.style.margin = "0";
    clone.style.padding = "0";
    clone.style.background = "#ffffff";
    clone.style.boxSizing = "border-box";

    tempWrap.appendChild(clone);
    document.body.appendChild(tempWrap);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: realWidth,
      height: realHeight,
      windowWidth: realWidth,
      windowHeight: realHeight,
    });

    const imgData = canvas.toDataURL("image/png");

    const pxToMm = (px) => px * 0.264583;
    const pdfWidth = pxToMm(realWidth);
    const pdfHeight = pxToMm(realHeight);

    const pdf = new jspdf.jsPDF({
      orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`식단_${new Date().getTime()}.pdf`);
  } catch (e) {
    console.error(e);
    alert("PDF 저장 중 오류가 발생했습니다.");
  } finally {
    if (tempWrap && tempWrap.parentNode) {
      tempWrap.parentNode.removeChild(tempWrap);
    }

    document.querySelectorAll(".drop-zone").forEach((el) => {
      if (el.dataset.wasSelected === "true") {
        el.classList.add("selected");
        delete el.dataset.wasSelected;
      }
    });
  }
}
