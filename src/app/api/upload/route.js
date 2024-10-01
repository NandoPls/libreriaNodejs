import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import multer from 'multer';

const upload = multer({ dest: 'public/uploads/' });

export async function POST(req) {
  try {
    const form = await req.formData();
    const pdfFile = form.get('pdf');
    const tempFilePath = path.join('public/uploads', pdfFile.name);

    // Guarda el PDF en la carpeta 'uploads'
    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);

    const pdfFileName = path.parse(pdfFile.name).name; // Nombre base del archivo (sin extensión)
    const thumbnailDir = path.join('public/thumbnails');
    const outputThumbnail = path.join(thumbnailDir, `${pdfFileName}-001.png`); // Ajuste para el nombre generado por pdftocairo

    // Asegúrate de que la carpeta 'thumbnails' existe
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir);
    }

    // Ruta absoluta a pdftocairo (asegúrate de que esta ruta es correcta)
    const pdftocairoPath = '/opt/homebrew/bin/pdftocairo';

    // Ejecutar pdftocairo para generar la miniatura
    await new Promise((resolve, reject) => {
      execFile(
        pdftocairoPath,
        ['-png', '-f', '1', '-l', '1', '-scale-to', '1024', tempFilePath, outputThumbnail.replace('-001.png', '')],
        (error, stdout, stderr) => {
          if (error) {
            reject(`Error al generar miniatura: ${error.message}`);
          } else {
            resolve(stdout);
          }
        }
      );
    });

    // Devolver respuesta con éxito y las rutas de los archivos
    return NextResponse.json({
      success: true,
      thumbnail: `/thumbnails/${pdfFileName}-001.png`, // Ajuste en el nombre para reflejar el formato correcto
      pdf: `/uploads/${pdfFile.name}`,
    });
  } catch (error) {
    console.error('Error al generar miniatura:', error);
    return NextResponse.json({ success: false, error: 'Error al subir el archivo.' }, { status: 500 });
  }
}
