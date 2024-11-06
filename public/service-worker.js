self.importScripts(
  "https://cdn.jsdelivr.net/npm/libheif-js@1.17.1/libheif-wasm/libheif-bundle.js"
);

function copyData(dataContainer, image) {
  return new Promise((resolve) => {
    image.display(dataContainer, function () {
      resolve();
    });
  });
}

self.addEventListener("message", async (event) => {
  console.log("message received:", typeof event.data);

  // console.log({libheif})

  if (typeof event.data === "object") {
    const files = event.data.files;
    const canvas = event.data.canvas;
    const convertedFiles = [];

    self.postMessage({ type: "CONVERTING" });

    try {
      const libheif = self.libheif();
      const decoder = new libheif.HeifDecoder();

      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const heifData = new Uint8Array(arrayBuffer);

      const result = decoder.decode(heifData);
      const image = result[0];
      const width = image.get_width();
      const height = image.get_height();

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No Canvas context");
      }

      const imageData = ctx.createImageData(width, height);

      await copyData(imageData, image);

      ctx.putImageData(imageData, 0, 0);
      image.free();

      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.8,
      });

      // canvas.toBlob((blob => {
      //   const url = URL.createObjectURL(blob);
      //   console.log(url)
      // }), 'image/jpeg', 0.8)

      // const jpegDataUrl = canvas.toDataURL("image/jpeg");
      console.log(blob);

      convertedFiles.push({ imageBlob: blob, width, height });

      self.postMessage({ type: "SUCCESS", convertedFiles });
    } catch (error) {
      console.error("Conversion error:", error);
      self.postMessage({ type: "ERROR", error: error.message });
    }
  }

  // if (event.data && event.data.type === "CONVERT_HEIC") {
  //   const { files } = event.data;
  //   const convertedFiles = [];

  //   try {
  //     // Initialize libheif
  //     const decoder = new libheif.HeifDecoder();

  //     // Process each HEIC file
  //     for (const file of files) {

  //       const buffer = await file.arrayBuffer();
  //       const heifImage = decoder.decode(buffer);

  //       // Convert each decoded HEIF image to a JPEG Blob
  //       const jpegBlob = await heifImage.toBlob("image/jpeg");

  //       convertedFiles.push({
  //         name: file.name.replace(/\.\w+$/, ".jpg"), // Rename with .jpg extension
  //         blob: jpegBlob,
  //       });
  //     }

  //     // Send back converted JPEG blobs
  //     self.postMessage({ type: "CONVERTED", files: convertedFiles });
  //   } catch (error) {
  //     console.error("Conversion error:", error);
  //     self.postMessage({ type: "ERROR", error: error.message });
  //   }
  // }
});
