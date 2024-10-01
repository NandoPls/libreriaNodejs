"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import * as pdfjsLib from "pdfjs-dist";

export default function Reader({ params }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(1);
  const canvasRef = useRef(null);
  const bookId = params.id;

  useEffect(() => {
    const loadPdf = async () => {
      const books = JSON.parse(localStorage.getItem("books")) || [];
      const book = books.find((b) => b.id === parseInt(bookId));
      if (!book) return;

      const loadingTask = pdfjsLib.getDocument(book.src);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setPage(book.currentPage);
    };

    loadPdf();
  }, [bookId]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(page);
    }
  }, [pdfDoc, page]);

  const renderPage = async (num) => {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: context,
      viewport,
    };
    await page.render(renderContext);
  };

  const nextPage = () => {
    if (page < pdfDoc.numPages) {
      setPage(page + 1);
      updateBookProgress(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      updateBookProgress(page - 1);
    }
  };

  const updateBookProgress = (currentPage) => {
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const updatedBooks = books.map((book) =>
      book.id === parseInt(bookId) ? { ...book, currentPage } : book
    );
    localStorage.setItem("books", JSON.stringify(updatedBooks));
  };

  return (
    <div className="pdf-viewer">
      <canvas ref={canvasRef}></canvas>
      <div className="controls">
        <button onClick={prevPage}>Anterior</button>
        <button onClick={nextPage}>Siguiente</button>
      </div>
      <style jsx>{`
        .pdf-viewer {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .controls {
          margin-top: 10px;
        }
        canvas {
          border: 1px solid #ccc;
        }
      `}</style>
    </div>
  );
}
