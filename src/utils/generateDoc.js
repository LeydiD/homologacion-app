import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function generarDocs(listaPersonas, fecha) {
    const content = await fetch("/template.docx").then(res => res.arrayBuffer());

    const zipGlobal = new JSZip();

    for (let data of listaPersonas) {

        const carpeta = zipGlobal.folder(data.nombre);

        for (let asig of data.asignaturas) {

            if (!asig.asignatura) continue; // 🔥 evita basura

            const zip = new PizZip(content);

            const doc = new Docxtemplater(zip, {
                delimiters: { start: "[[", end: "]]" },
            });

            const fechaObj = new Date(fecha);

            doc.setData({
                docente: "DOCENTE INVITADO",
                nombre: data.nombre,
                cedula: data.cedula,
                codigo: data.codigo,
                asignatura: asig.asignatura,
                codigo_asignatura: asig.codigo_asignatura,
                creditos: asig.creditos,
                nota_numero: asig.nota,
                nota_letra: numeroALetras(asig.nota),
                dia: fechaObj.getDate(),
                mes: fechaObj.toLocaleString("es-CO", { month: "long" }),
                anio: fechaObj.getFullYear(),
            });

            doc.render();

            const blob = doc.getZip().generate({ type: "blob" });

            carpeta.file(
                `FORMATO_RECONOCIMIENTO_${asig.asignatura}.docx`,
                blob
            );
        }
    }

    const zipFinal = await zipGlobal.generateAsync({ type: "blob" });

    // 🔥 AQUÍ EL USUARIO ELIGE DÓNDE GUARDAR
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `RECONOCIMIENTOS_${Date.now()}.zip`,
                types: [
                    {
                        description: "Archivo ZIP",
                        accept: { "application/zip": [".zip"] },
                    },
                ],
            });

            const writable = await handle.createWritable();
            await writable.write(zipFinal);
            await writable.close();

        } catch (err) {
            console.log("Guardado cancelado");
        }
    } else {
        // fallback si el navegador no soporta
        saveAs(zipFinal, `RECONOCIMIENTOS_${Date.now()}.zip`);
    }
}

function numeroALetras(nota) {
    if (!nota || nota.toString().trim() === "") return "";

    const mapa = {
        "0": "CERO",
        "1": "UNO",
        "2": "DOS",
        "3": "TRES",
        "4": "CUATRO",
        "5": "CINCO",
        "6": "SEIS",
        "7": "SIETE",
        "8": "OCHO",
        "9": "NUEVE"
    };

    // 1. Limpiar la nota de espacios y caracteres invisibles que vienen del Word
    // Esto convierte "3,3  " en "3,3"
    let limpio = nota.toString().replace(/[^0-9,.]/g, '').trim();

    // 2. Normalizar el separador: Convertir puntos a comas para procesar uniformemente
    limpio = limpio.replace(".", ",");

    const [entero, decimal] = limpio.split(",");

    // 3. Obtener la palabra del entero
    let parteEntera = mapa[entero] || "";

    // 4. Procesar el decimal
    if (decimal) {
        let parteDecimal = decimal.split("").map(d => mapa[d] || "").join(" ");
        return `${parteEntera}, ${parteDecimal}`;
    }

    return `${parteEntera}, CERO`;
}