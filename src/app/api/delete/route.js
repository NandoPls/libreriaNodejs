import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(req) {
  try {
    const { pdfPath } = await req.json();

    // Rutas del PDF y la miniatura
    const pdfFilePath = path.join(process.cwd(), 'public', pdfPath);
    const thumbnailPath = path.join(process.cwd(), 'public', 'thumbnails', path.basename(pdfPath).replace('.pdf', '-001.png'));

    // Borrar el PDF
    if (fs.existsSync(pdfFilePath)) {
      fs.unlinkSync(pdfFilePath);
    }

    // Borrar la miniatura
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al borrar archivo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo borrar el archivo.' }, { status: 500 });
  }
}
