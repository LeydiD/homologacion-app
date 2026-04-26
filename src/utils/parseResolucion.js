import mammoth from "mammoth";

export async function parseResolucion(file) {
    const buffer = await file.arrayBuffer();

    // 1. Convertimos a HTML para preservar la estructura de filas (tr) y celdas (td)
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });

    // 2. Usamos DOMParser para navegar el HTML generado
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const fullText = doc.body.innerText;

    const extraerEntre = (texto, inicio, fin) => {
        // Busca el inicio, ignora posibles comas o espacios, captura todo hasta el 'fin'
        const regex = new RegExp(`${inicio}[\\s,]*([^\n\t,]+?)(?=\\s*${fin}|\\s*$)`, 'i');
        const match = texto.match(regex);
        return match ? match[1].trim() : "No encontrado";
    };

    // 3. Extraer datos del solicitante con Regex más específico (evita el "greedy matching")
    const nombre = extraerEntre(fullText, "Nombre y Apellidos", "Código asignado");
    const codigo = extraerEntre(fullText, "Código asignado", "Documento de Identidad");
    const cedula = extraerEntre(fullText, "Documento de Identidad", "Expedido en");

    const asignaturas = [];

    // 4. Procesar las tablas para las asignaturas
    const tablas = doc.querySelectorAll("table");
    tablas.forEach((tabla) => {
        const filas = tabla.querySelectorAll("tr");

        filas.forEach((fila) => {
            const celdas = Array.from(fila.querySelectorAll("td")).map(td => td.innerText.trim());

            // Filtro: La tabla de homologación en el FO-GE-04 tiene al menos 10 columnas 
            // Verificamos que la primera celda sea un número (el índice de la fila)
            if (celdas.length >= 10 && /^\d+$/.test(celdas[0])) {
                const asignaturaNombre = celdas[6]; // Columna: "Asignatura que se reconoce" 
                const notaNum = celdas[9];         // Columna: "Calificación" 

                // Solo agregar si la fila tiene datos reales (nombre y nota no vacíos)
                if (asignaturaNombre && notaNum && asignaturaNombre !== "") {
                    asignaturas.push({
                        asignatura: asignaturaNombre,
                        codigo_asignatura: celdas[5], // Código de la asignatura reconocida 
                        creditos: celdas[8],          // Créditos 
                        nota: notaNum.replace('.', ',') // Normalizar nota a coma
                    });
                }
            }
        });
    });

    console.log("Extracción finalizada:", { nombre, cedula, codigo, asignaturas });
    return { nombre, cedula, codigo, asignaturas };
}