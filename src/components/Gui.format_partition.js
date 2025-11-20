import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import DataService from "../DataService";
import { useRebootCountdown } from "./Util.reboot";
import IUpload from "./icons/IUpload.svg";
import IServer from "./icons/IServer.svg";
import ICheck from "./icons/ICheck.svg";
import IForbidden from "./icons/IForbidden.svg";

export default function FormatPartition(props) {
    const [posting, setPosting] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [files, setFiles] = useState(null);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [originalFileContent, setOriginalFileContent] = useState(""); // Contenido original sin formatear
    const [isEditing, setIsEditing] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);
    const [savingContent, setSavingContent] = useState(false);
    const [contentError, setContentError] = useState(null);
    const { countdown, isRebooting, startReboot } = useRebootCountdown();

    const formatPartition = () => {
        setPosting(true);
        DataService.post("/format_micro_ocpp", {})
            .then(resp => {
                console.log(resp.status);
                if (resp.status === "ok") {
                    setPosting(false);
                    startReboot();
                }
            })
            .catch(error => {
                console.error("Error al formatear partición:", error);
                setPosting(false);
            })
            .finally(() => {
                console.log("Formateo de partición completado.");
            });
    };

    const listFiles = () => {
        setLoadingFiles(true);
        setError(null);
        setFiles(null);
        DataService.get("/list_partition_files")
            .then(resp => {
                console.log("Files response:", resp);
                if (resp.status === "ok" && resp.files) {
                    setFiles(resp.files);
                } else {
                    setError(resp.message || "Error al obtener archivos");
                }
            })
            .catch(error => {
                console.error("Error al listar archivos:", error);
                setError("Error al obtener la lista de archivos");
            })
            .finally(() => {
                setLoadingFiles(false);
            });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0 || bytes === "-") return "-";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const openFileViewer = (file) => {
        if (file.type === "directory") {
            setError("No se puede ver el contenido de un directorio");
            return;
        }
        setModalFile(file);
        setIsEditing(false);
        setFileContent("");
        setContentError(null);
        setShowModal(true);
        loadFileContent(file.name);
    };

    const openFileEditor = (file) => {
        if (file.type === "directory") {
            setError("No se puede editar un directorio");
            return;
        }
        setModalFile(file);
        setIsEditing(true);
        setFileContent("");
        setContentError(null);
        setShowModal(true);
        loadFileContent(file.name);
    };

    const loadFileContent = (filename) => {
        setLoadingContent(true);
        setContentError(null);
        const url = `/read_partition_file?filename=${encodeURIComponent(filename)}`;
        console.log("Loading file content from:", url);
        DataService.get(url)
            .then(resp => {
                console.log("File content response:", resp);
                if (resp && resp.status === "ok" && resp.content !== undefined) {
                    const originalContent = resp.content; // Guardar contenido original
                    let displayContent = originalContent; // Contenido para mostrar
                    
                    // Si es un archivo .jsn o .json, formatearlo con pretty print SOLO para visualización
                    if (filename.endsWith('.jsn') || filename.endsWith('.json')) {
                        try {
                            const jsonObj = JSON.parse(originalContent);
                            displayContent = JSON.stringify(jsonObj, null, 2); // 2 espacios de indentación para visualización
                        } catch (e) {
                            // Si no es JSON válido, mostrar el contenido original
                            console.warn("No se pudo formatear como JSON:", e);
                        }
                    }
                    
                    // Guardar ambos: original (sin formato) y display (formateado)
                    setOriginalFileContent(originalContent);
                    setFileContent(displayContent);
                } else {
                    const errorMsg = resp?.message || resp?.status || "Error al cargar el archivo";
                    console.error("Error in response:", errorMsg, resp);
                    setContentError(errorMsg);
                }
            })
            .catch(error => {
                console.error("Error al cargar archivo:", error);
                const errorMsg = error?.message || "Error al cargar el contenido del archivo";
                setContentError(`${errorMsg} (Ver consola para más detalles)`);
            })
            .finally(() => {
                setLoadingContent(false);
            });
    };

    const saveFileContent = () => {
        if (!modalFile) return;
        
        setSavingContent(true);
        setContentError(null);
        
        // Para archivos JSON, parsear y guardar sin indentación (formato compacto)
        let contentToSave = fileContent;
        if (modalFile.name.endsWith('.jsn') || modalFile.name.endsWith('.json')) {
            try {
                const jsonObj = JSON.parse(fileContent);
                // Guardar sin indentación (formato compacto) para mantener compatibilidad
                contentToSave = JSON.stringify(jsonObj);
            } catch (e) {
                setContentError("Error: El contenido del archivo no es JSON válido");
                setSavingContent(false);
                return;
            }
        }
        
        // Si el archivo es ws-conn.jsn, primero guardar el archivo y luego actualizar Configuración General
        if (modalFile.name === "ws-conn.jsn") {
            // Parsear el contenido del archivo editado para extraer los valores
            let fileJson;
            try {
                fileJson = JSON.parse(fileContent);
            } catch (e) {
                setContentError("Error: El contenido del archivo no es JSON válido");
                setSavingContent(false);
                return;
            }
            
            // Extraer los valores del archivo editado
            let server_ocpp_url = "";
            let ocpp_charger_id = "";
            let ocpp_auth_key = "";
            
            if (fileJson.configurations && Array.isArray(fileJson.configurations)) {
                fileJson.configurations.forEach(config => {
                    if (config.key === "Cst_BackendUrl") {
                        server_ocpp_url = config.value || "";
                    } else if (config.key === "Cst_ChargeBoxId") {
                        ocpp_charger_id = config.value || "";
                    } else if (config.key === "AuthorizationKey") {
                        ocpp_auth_key = config.value || "";
                    }
                });
            }
            
            console.log("Extracted values from ws-conn.jsn:", {
                server_ocpp_url,
                ocpp_charger_id,
                ocpp_auth_key
            });
            
            // Validar que tenemos valores antes de continuar
            if (!server_ocpp_url && !ocpp_charger_id && !ocpp_auth_key) {
                setContentError("Error: No se encontraron valores válidos en el archivo ws-conn.jsn");
                setSavingContent(false);
                return;
            }
            
            // PRIMERO: Guardar el archivo en la partición (sin formato pretty)
            DataService.post("/write_partition_file", {
                filename: modalFile.name,
                content: contentToSave  // Contenido sin indentación
            })
                .then(resp => {
                    if (resp.status === "ok") {
                        console.log("File saved successfully, now updating general config");
                        // DESPUÉS: Actualizar la configuración general con los valores extraídos
                        const generalData = {
                            server_ocpp_url: server_ocpp_url || "",
                            ocpp_charger_id: ocpp_charger_id || "",
                            ocpp_auth_key: ocpp_auth_key || ""
                        };
                        console.log("Sending to /post_general_data:", generalData);
                        return DataService.post("/post_general_data", generalData);
                    } else {
                        throw new Error(resp.message || "Error al guardar el archivo");
                    }
                })
                .then(resp => {
                    if (resp.status === "ok") {
                        setIsEditing(false);
                        // Refresh file list
                        listFiles();
                    } else {
                        setContentError(resp.message || "Error al actualizar configuración general");
                    }
                })
                .catch(error => {
                    console.error("Error al guardar archivo ws-conn.jsn:", error);
                    setContentError(error?.message || "Error al guardar el archivo");
                })
                .finally(() => {
                    setSavingContent(false);
                });
        } else {
            // Para otros archivos, usar el flujo normal (guardar sin formato pretty si es JSON)
            DataService.post("/write_partition_file", {
                filename: modalFile.name,
                content: contentToSave
            })
                .then(resp => {
                    if (resp.status === "ok") {
                        setIsEditing(false);
                        // Refresh file list
                        listFiles();
                    } else {
                        setContentError(resp.message || "Error al guardar el archivo");
                    }
                })
                .catch(error => {
                    console.error("Error al guardar archivo:", error);
                    setContentError("Error al guardar el archivo");
                })
                .finally(() => {
                    setSavingContent(false);
                });
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalFile(null);
        setFileContent("");
        setOriginalFileContent(""); // Limpiar también el contenido original
        setIsEditing(false);
        setContentError(null);
    };

    return (
        <fieldset class="is-col">
            <legend>Gestión de partición</legend>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button
                    class={`button primary ${posting ? "is-loading" : ""}`}
                    onClick={formatPartition}
                    disabled={posting || loadingFiles}>
                    <IUpload /> Formatear partición
                </button>
                
                <button
                    class={`button ${loadingFiles ? "is-loading" : ""}`}
                    onClick={listFiles}
                    disabled={posting || loadingFiles}>
                    <IServer /> Ver archivos en partición
                </button>
            </div>

            {posting ? (
                <div class="fetch-message">
                    <p>Formateando partición...</p>
                </div>
            ) : null}

            {isRebooting ? (
                <div class="reboot-message">
                    <p>El dispositivo se reiniciará en {countdown} segundos...</p>
                </div>
            ) : null}

            {loadingFiles ? (
                <div class="fetch-message">
                    <p>Cargando archivos...</p>
                </div>
            ) : null}

            {error ? (
                <div class="fetch-message" style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                    <p><strong>Error:</strong> {error}</p>
                </div>
            ) : null}

            {files && files.length > 0 ? (
                <div style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px; color: #333;">Archivos en la partición ({files.length})</h3>
                    <div style="background: #f9f9f9; border-radius: 4px; padding: 15px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #ddd;">
                                    <th style="text-align: left; padding: 10px;">Tipo</th>
                                    <th style="text-align: left; padding: 10px;">Nombre</th>
                                    <th style="text-align: right; padding: 10px;">Tamaño</th>
                                    <th style="text-align: left; padding: 10px;">Modificado</th>
                                    <th style="text-align: center; padding: 10px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map(file => (
                                    <tr key={file.name} style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 8px;">
                                            <span style={`
                                                display: inline-block;
                                                padding: 4px 8px;
                                                border-radius: 4px;
                                                font-size: 12px;
                                                font-weight: 600;
                                                background: ${file.type === "directory" ? "#E3F2FD" : "#E8F5E9"};
                                                color: ${file.type === "directory" ? "#1976D2" : "#388E3C"};
                                            `}>
                                                {file.type === "directory" ? "DIR" : "FILE"}
                                            </span>
                                        </td>
                                        <td style="padding: 8px; font-weight: 500; color: #2196F3;">
                                            {file.name}
                                        </td>
                                        <td style="text-align: right; padding: 8px; color: #666;">
                                            {formatFileSize(file.size)}
                                        </td>
                                        <td style="padding: 8px; color: #666; font-size: 14px;">
                                            {file.modified || "-"}
                                        </td>
                                        <td style="padding: 8px; text-align: center;">
                                            {file.type === "file" ? (
                                                <div style="display: flex; gap: 5px; justify-content: center;">
                                                    <button
                                                        class="button"
                                                        style="padding: 4px 8px; font-size: 12px;"
                                                        onClick={() => openFileViewer(file)}
                                                        disabled={loadingContent || savingContent}>
                                                        Ver
                                                    </button>
                                                    <button
                                                        class="button primary"
                                                        style="padding: 4px 8px; font-size: 12px;"
                                                        onClick={() => openFileEditor(file)}
                                                        disabled={loadingContent || savingContent}>
                                                        Editar
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style="color: #999; font-size: 12px;">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : files && files.length === 0 ? (
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px; color: #856404;">
                    <p><strong>La partición está vacía.</strong> No hay archivos en la partición.</p>
                </div>
            ) : null}

            {/* Modal para ver/editar archivo */}
            {showModal && modalFile ? (
                <div class="modal-box" onClick={(e) => e.target.classList.contains('modal-box') && closeModal()}>
                    <div class="modal" style="max-width: 800px; width: 90%;">
                        <div class="modal-header">
                            <span style="font-size: 18px; font-weight: bold;">
                                {isEditing ? "Editar archivo" : "Ver archivo"}: {modalFile.name}
                            </span>
                            <button class="close" onClick={closeModal} style="cursor: pointer;">×</button>
                        </div>
                        <div class="modal-body">
                            {loadingContent ? (
                                <div style="text-align: center; padding: 20px;">
                                    <p>Cargando contenido...</p>
                                </div>
                            ) : contentError ? (
                                <div style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                                    <p><strong>Error:</strong> {contentError}</p>
                                </div>
                            ) : (
                                <div>
                                    <div style="margin-bottom: 10px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                                            Contenido:
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={fileContent}
                                                onInput={(e) => setFileContent(e.target.value)}
                                                style="width: 100%; min-height: 300px; font-family: monospace; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;"
                                                disabled={savingContent}
                                            />
                                        ) : (
                                            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; max-height: 400px; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace;">
                                                {fileContent}
                                            </pre>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div style="margin-top: 10px; color: #666; font-size: 12px;">
                                            <p>Tamaño: {formatFileSize(fileContent.length)}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div class="modal-footer">
                            {isEditing ? (
                                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                    <button
                                        class="button"
                                        onClick={closeModal}
                                        disabled={savingContent}>
                                        Cancelar
                                    </button>
                                    <button
                                        class="button primary"
                                        onClick={saveFileContent}
                                        disabled={savingContent || loadingContent}>
                                        {savingContent ? "Guardando..." : <Fragment><ICheck /> Guardar</Fragment>}
                                    </button>
                                </div>
                            ) : (
                                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                    <button
                                        class="button"
                                        onClick={closeModal}>
                                        Cerrar
                                    </button>
                                    <button
                                        class="button primary"
                                        onClick={() => {
                                            if (!fileContent && modalFile) {
                                                // If content not loaded yet, load it first
                                                loadFileContent(modalFile.name);
                                            }
                                            setIsEditing(true);
                                        }}
                                        disabled={loadingContent}>
                                        {loadingContent ? "Cargando..." : "Editar"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </fieldset>
    );
}
