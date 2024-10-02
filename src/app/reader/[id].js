"use client";
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PDFViewer({ pdfPath, darkMode }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      console.log("Cargando el PDF desde la ruta:", pdfPath);

      try {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        console.log("PDF cargado correctamente:", pdf);
        setPdfDoc(pdf);
      } catch (error) {
        console.error("Error al cargar el PDF:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pdfPath) {
      loadPdf();
    } else {
      console.error("No hay ruta del PDF proporcionada.");
    }
  }, [pdfPath]);

  useEffect(() => {
    if (pdfDoc) {
      // Recuperar la última página desde localStorage
      const storedPage = localStorage.getItem(`pdf-${pdfPath}`);
      if (storedPage) {
        setPage(parseInt(storedPage, 10));
      } else {
        setPage(1);
      }
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (pdfDoc && page !== null) {
      renderPage(page);
      // Guardar la página actual en localStorage
      localStorage.setItem(`pdf-${pdfPath}`, page);
    }
  }, [pdfDoc, page, darkMode]);

  const renderPage = async (num) => {
    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: 1 });

      // Obtener el ancho del contenedor
      const containerWidth = canvasRef.current.parentElement.offsetWidth;
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Crear un canvas fuera de pantalla
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = Math.floor(scaledViewport.width);
      offscreenCanvas.height = Math.floor(scaledViewport.height);
      const offscreenContext = offscreenCanvas.getContext("2d");

      const renderContext = {
        canvasContext: offscreenContext,
        viewport: scaledViewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;

      // Obtener los datos de imagen del canvas
      const imageData = offscreenContext.getImageData(
        0,
        0,
        offscreenCanvas.width,
        offscreenCanvas.height
      );
      const data = imageData.data;

      // Invertir colores si el modo oscuro está activo
      if (darkMode) {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i]; // Rojo
          data[i + 1] = 255 - data[i + 1]; // Verde
          data[i + 2] = 255 - data[i + 2]; // Azul
          // El canal alfa permanece igual
        }
      }

      // Dibujar el canvas fuera de pantalla en el canvas principal
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = offscreenCanvas.width;
      canvas.height = offscreenCanvas.height;
      context.putImageData(imageData, 0, 0);
    } catch (error) {
      if (error.name === "RenderingCancelledException") {
        console.log("Renderización cancelada.");
      } else {
        console.error("Error al renderizar la página:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []);

  // Manejo de gestos táctiles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleGesture();
    };

    const handleGesture = () => {
      if (touchEndX < touchStartX - 50) {
        nextPage();
      }
      if (touchEndX > touchStartX + 50) {
        prevPage();
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canvasRef.current, page, pdfDoc]);

  const nextPage = () => {
    if (page < pdfDoc.numPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="pdf-viewer">
      {loading ? (
        <p>Cargando el libro...</p>
      ) : (
        <>
          <canvas ref={canvasRef}></canvas>
          <div className="controls">
            <button onClick={prevPage} disabled={page <= 1}>
              Anterior
            </button>
            <span>
              Página {page} de {pdfDoc.numPages}
            </span>
            <button onClick={nextPage} disabled={page >= pdfDoc.numPages}>
              Siguiente
            </button>
          </div>
        </>
      )}
      <style jsx>{`
        .pdf-viewer {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .controls {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        canvas {
          border: 1px solid #ccc;
          max-width: 100%;
        }
        button {
          padding: 10px 20px;
          background-color: ${darkMode ? "#e60000" : "#0070f3"};
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.3s;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        button:hover:not(:disabled) {
          background-color: ${darkMode ? "#cc0000" : "#005bb5"};
        }
        @media (max-width: 600px) {
          .controls {
            flex-direction: column;
            gap: 5px;
          }
          canvas {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
