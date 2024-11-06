"use client";
import * as React from "react";
import Image from "next/image";

export default function Home() {
  const [worker, setWorker] = React.useState<Worker | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [image, setImage] = React.useState<
    | {
        data: string;
        name: string;
        width: number;
        height: number;
        originalName: string;
      }
    | undefined
  >(undefined);

  React.useEffect(() => {
    let myWorker: Worker | undefined;
    if (window.Worker && !myWorker) {
      myWorker = new Worker("./service-worker.js");
      setWorker(myWorker);
    }

    return () => {
      if (myWorker) {
        myWorker.terminate();
      }
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    if (worker) {
      const canvas = document.createElement("canvas");
      const offscreenCanvas = canvas.transferControlToOffscreen();

      worker.postMessage({ files, canvas: offscreenCanvas }, [offscreenCanvas]);

      worker.onmessage = async (event) => {
        if (event.data.type === "CONVERTING") {
          setImage(undefined);
          setLoading(true);
          return;
        } else {
          setLoading(false);
        }

        console.log(event.data);
        const imageData = event.data.convertedFiles[0];

        const reader = new FileReader();
        reader.onload = () =>
          setImage({
            data: reader.result as string,
            name: imageData.name,
            width: imageData.width,
            height: imageData.height,
            originalName: imageData.originalName,
          });
        reader.readAsDataURL(imageData.blob);
      };
    }

    console.log(files);
  };

  return (
    <div className="grid p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8">
        <h1 className="font-bold text-2xl">HEIC {"->"} JPG Converter</h1>
        <input type="file" onChange={handleChange} accept=".heic" />
        {loading ? <span>Converting...</span> : null}
        {image ? (
          <a href={image.data} download={image.name}>
            <Image
              src={image.data}
              width={image.width}
              height={image.height}
              alt={`Converted copy of '${image.originalName}'`}
            />
          </a>
        ) : null}
      </main>
    </div>
  );
}
