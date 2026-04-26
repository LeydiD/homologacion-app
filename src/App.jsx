// src/App.jsx
import { useState } from "react";
import { parseResolucion } from "./utils/parseResolucion.js";
import { generarDocs } from "./utils/generateDoc.js";
import "./App.css";

export default function App() {
  const [files, setFiles] = useState([]);
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!fecha || files.length === 0) {
      alert("Por favor selecciona archivos y una fecha.");
      return;
    }

    setLoading(true);

    const fechaFinal = fecha || new Date().toISOString().split("T")[0];

    try {
      const listaPersonas = [];

      for (let file of files) {
        const data = await parseResolucion(file);
        listaPersonas.push(data);
      }

      await generarDocs(listaPersonas, fechaFinal);
    } catch (error) {
      console.error(error);
      alert("Error procesando");
    }

    setLoading(false);
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Generador de Reconocimientos</h1>
        <p className="subtitle">
          Sube los archivos .docx y genera automáticamente los documentos
        </p>

        <label className="file-input">
          📂 Seleccionar archivos
          <input
            type="file"
            multiple
            accept=".docx"
            onChange={(e) => setFiles([...e.target.files])}
            hidden
          />
        </label>

        <div className="file-list">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span>{file.name}</span>
              <button
                className="delete-btn"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="date-input"
        />

        <button onClick={handleProcess} disabled={loading} className="main-btn">
          {loading ? "Procesando..." : "Generar documentos"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "auto",
    textAlign: "center",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
};
