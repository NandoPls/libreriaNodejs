"use client";
import { useState, useEffect, useRef } from "react";
import PDFViewer from "./reader/[id]";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef(null);
  const [currentBook, setCurrentBook] = useState(null);

  useEffect(() => {
    const loadBooks = async () => {
      console.log("Cargando libros...");
      const response = await fetch("/api/books");
      const result = await response.json();
      console.log("Libros cargados:", result);
      setBooks(result);
    };
    loadBooks();
  }, []);

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const pdfFile = event.target.elements.pdfFile.files[0];

    if (!pdfFile) {
      alert("Por favor selecciona un archivo PDF.");
      return;
    }

    const existingBook = books.find((book) => book.pdf.includes(pdfFile.name));
    if (existingBook) {
      alert(
        "Ya existe un PDF con ese nombre. Por favor, cambia el nombre del archivo."
      );
      return;
    }

    formData.append("pdf", pdfFile);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setBooks([...books, result]);
        fileInputRef.current.value = "";
      } else {
        alert("Error al subir el archivo.");
      }
    } catch (error) {
      console.error("Error al subir el archivo:", error);
    }
  };

  const handleDelete = async (pdfPath) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas borrar este archivo?"
    );
    if (!confirmDelete) {
      return;
    }
    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        body: JSON.stringify({ pdfPath }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setBooks(books.filter((book) => book.pdf !== pdfPath));
      } else {
        alert("Error al borrar el archivo.");
      }
    } catch (error) {
      console.error("Error al borrar el archivo:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleOpenPDF = (pdfPath) => {
    console.log(`Abriendo el PDF: ${pdfPath}`);
    setCurrentBook(pdfPath);
  };

  return (
    <div className={darkMode ? "container dark-mode" : "container"}>
      <button onClick={toggleDarkMode} className="mode-button">
        {darkMode ? "Modo Claro" : "Modo Oscuro"}
      </button>

      {!currentBook ? (
        <>
          <h1 className="title">Tu Biblioteca de PDFs</h1>
          <p className="subtitle">Gestiona tus archivos PDF fácilmente.</p>

          <form onSubmit={handleFileUpload} className="upload-form">
            <input
              type="file"
              name="pdfFile"
              accept="application/pdf"
              className="file-input"
              ref={fileInputRef}
            />
            <button type="submit" className="upload-button">
              Subir PDF
            </button>
          </form>

          <div className="book-list">
            {books.length > 0 ? (
              books.map((book, index) => (
                <div key={index} className="book-item">
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt={`Miniatura de ${book.pdf}`}
                      className="book-thumbnail"
                    />
                  ) : (
                    <p>Cargando miniatura...</p>
                  )}
                  <div className="book-actions">
                    <button onClick={() => handleOpenPDF(book.pdf)}>
                      Leer
                    </button>
                    <button
                      className="delete"
                      onClick={() => handleDelete(book.pdf)}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-books">
                No se encontraron libros. Agrega libros en la carpeta /uploads.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="pdf-viewer-container">
          <button
            onClick={() => setCurrentBook(null)}
            className="back-button"
          >
            Volver
          </button>
          <PDFViewer pdfPath={currentBook} darkMode={darkMode} />
        </div>
      )}
    </div>
  );
}
