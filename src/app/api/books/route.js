import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const thumbnailsDir = path.join(process.cwd(), 'public/thumbnails');

  try {
    const files = fs.readdirSync(uploadsDir);

    const books = files.filter(file => file.endsWith('.pdf')).map(file => {
      const pdfPath = `/uploads/${file}`;
      const thumbnailPath = `/thumbnails/${file.replace('.pdf', '-001.png')}`; // Asegurarse de que el nombre sea correcto

      return {
        pdf: pdfPath,
        thumbnail: fs.existsSync(path.join(thumbnailsDir, `${file.replace('.pdf', '-001.png')}`)) ? thumbnailPath : null
      };
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error al leer los archivos de PDF:', error);
    return NextResponse.json({ error: 'No se pudo cargar los libros.' }, { status: 500 });
  }
}
