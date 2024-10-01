"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);  // Estado para el modo oscuro
  const fileInputRef = useRef(null);

  // Cargar los libros existentes cuando se carga la página
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await fetch('/api/books');
        const result = await response.json();
        setBooks(result);
      } catch (error) {
        console.error("Error al cargar los libros:", error);
      }
    };

    loadBooks();
  }, []);

  // Manejar la subida de archivos, prevenir duplicados
  const handleFileUpload = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    const pdfFile = event.target.elements.pdfFile.files[0];

    if (!pdfFile) {
      alert("Por favor selecciona un archivo PDF.");
      return;
    }

    // Verificar si ya existe un PDF con el mismo nombre
    const existingBook = books.find(book => book.pdf.includes(pdfFile.name));
    if (existingBook) {
      alert("Ya existe un PDF con ese nombre. Por favor, cambia el nombre del archivo.");
      return;
    }

    formData.append('pdf', pdfFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Actualiza la lista de libros con el nuevo PDF y su miniatura
        setBooks([...books, result]);
        fileInputRef.current.value = '';  // Limpiar el campo de selección de archivo
      } else {
        alert("Error al subir el archivo.");
      }
    } catch (error) {
      console.error("Error al subir el archivo:", error);
    }
  };

  // Manejar la eliminación del PDF y la miniatura
  const handleDelete = async (pdfPath) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas borrar este archivo?");
    if (!confirmDelete) {
      return; // Si el usuario cancela, no hacemos nada
    }

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        body: JSON.stringify({ pdfPath }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        // Filtrar la lista de libros después de borrar
        setBooks(books.filter(book => book.pdf !== pdfPath));
      } else {
        alert("Error al borrar el archivo.");
      }
    } catch (error) {
      console.error("Error al borrar el archivo:", error);
    }
  };

  // Alternar entre modo oscuro y claro
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={darkMode ? "container dark-mode" : "container"}>
      <button onClick={toggleDarkMode} className="mode-button">
        {darkMode ? "Modo Claro" : "Modo Oscuro"}
      </button>

      <h1 className="title">Tu Biblioteca de PDFs</h1>
      <p className="subtitle">Gestiona tus archivos PDF fácilmente.</p>

      <form onSubmit={handleFileUpload} className="upload-form">
        <input type="file" name="pdfFile" accept="application/pdf" className="file-input" ref={fileInputRef} />
        <button type="submit" className="upload-button">Subir PDF</button>
      </form>

      <div className="book-list">
        {books.length > 0 ? (
          books.map((book, index) => (
            <div key={index} className="book-item">
              {book.thumbnail ? (
                <img src={book.thumbnail} alt={`Miniatura de ${book.pdf}`} className="book-thumbnail" />
              ) : (
                <p>Cargando miniatura...</p>
              )}
              <div className="book-actions">
                <a href={book.pdf} target="_blank" rel="noopener noreferrer">
                  <button>Leer</button>
                </a>
                <button className="delete" onClick={() => handleDelete(book.pdf)}>Borrar</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-books">No se encontraron libros. Agrega libros en la carpeta /uploads.</p>
        )}
      </div>
    </div>
  );
}
