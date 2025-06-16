import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import DataService from "../DataService";
import { useRebootCountdown } from "./Util.reboot";
import ICheck from "./icons/ICheck.svg";
import IForbidden from "./icons/IForbidden.svg";

export default function OTAUpdateConfigControlPanel(props) {
    // Estados principales
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState("");
    const [postSuccess, setPostSuccess] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressVisible, setProgressVisible] = useState(false);
    const [fileInfo, setFileInfo] = useState("");

    // Estados para el archivo y versión
    const [selectedFile, setSelectedFile] = useState(null);
    const [compileDate, setCompileDate] = useState("");
    const [compileTime, setCompileTime] = useState("");

    const { countdown, isRebooting, startReboot } = useRebootCountdown();

    useEffect(() => {
        getUpdateStatus();
    }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileInfo(`File: ${file.name}<br>Size: ${file.size} bytes`);

            setUploadProgress(0);
            setProgressVisible(true);
        }
    };

    const updateFirmware = () => {
        if (!selectedFile) {
            alert("¡Selecciona un archivo primero!");
            return;
        }

        setPosting(true);
        setPostError("");
        setPostSuccess("");

        const formData = new FormData();
        formData.append("file", selectedFile);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", e => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(percent);

                if (percent === 100) {
                    checkUpdateStatus(); // Comenzar a verificar el estado
                }
            }
        });

        xhr.open("POST", "/OTAupdate");
        xhr.onload = () => {
            if (xhr.status !== 200) {
                setPostError("Error en la transferencia del archivo");
                setPosting(false);
            }
        };

        xhr.onerror = () => {
            setPostError("Error de conexión");
            setPosting(false);
        };

        xhr.send(formData);
    };

    const checkUpdateStatus = () => {
        const checkInterval = setInterval(() => {
            DataService.post("/OTAstatus", {})
                .then(response => {
                    if (response.ota_update_status === 1) {
                        clearInterval(checkInterval);
                        startReboot();
                        setPostSuccess("Actualización completa. Reiniciando...");
                    } else if (response.ota_update_status === -1) {
                        clearInterval(checkInterval);
                        setPostError("Error en la actualización del firmware");
                        setPosting(false);
                    }
                })
                .catch(() => {
                    clearInterval(checkInterval);
                    setPostError("Error al verificar estado");
                    setPosting(false);
                });
        }, 2000); // Verificar cada 2 segundos
    };

    const getUpdateStatus = () => {
        DataService.post("/OTAstatus", {})
            .then(response => {
                setCompileDate(response.compile_date);
                setCompileTime(response.compile_time);
            })
            .catch(() => setPostError("Error al obtener versión"));
    };

    return (
        <fieldset class="ota-update-section" style="text-align: center; margin-top: 30px;">
            <h1 style="color: #1b3161; font-weight: 600; font-size: 2.5em; margin-bottom: 20px;">
                OTA UPDATE
            </h1>

            <div style="margin-bottom: 25px;">
                <label style="font-size: 1.2em; font-weight: 600; display: block; margin-bottom: 10px;">
                    Latest Firmware
                </label>
                <div style="font-size: 1.1em; color: #666;">
                    {compileDate} - {compileTime}
                </div>
            </div>

            <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
                <input
                    type="file"
                    id="otaFileInput"
                    accept=".bin"
                    style="display: none;"
                    onChange={handleFileSelect}
                />
                <button
                    style={{
                        padding: "12px 25px",
                        background: "#1b3161",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "1em"
                    }}
                    onClick={() => document.getElementById('otaFileInput').click()}
                >
                    Select File
                </button>

                <button
                    style={{
                        padding: "12px 25px",
                        background: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "1em",
                        opacity: posting ? 0.7 : 1
                    }}
                    onClick={updateFirmware}
                    disabled={posting || !selectedFile}
                >
                    {posting ? "Procesando..." : "Actualizar firmware"}
                </button>
            </div>

            {progressVisible && (
                <div style="width: 300px; margin: 20px auto; background: #eee; border-radius: 5px;">
                    <div
                        style={{
                            width: `${uploadProgress}%`,
                            height: "20px",
                            background: "#1b3161",
                            borderRadius: "5px",
                            transition: "width 0.3s ease"
                        }}
                    ></div>
                    <div style="margin-top: 5px; color: #666;">
                        Progreso: {uploadProgress}%
                    </div>
                </div>
            )}

            {uploadProgress && (
                <div style="color: #1b3161; margin: 15px 0; font-size: 0.9em;">
                    {uploadProgress}
                </div>
            )}

            {postError && (
                <div style="color: #dc3545; margin: 15px 0; font-weight: 500;">
                    <IForbidden /> {postError}
                </div>
            )}

            {postSuccess && (
                <div style="color: #28a745; margin: 15px 0; font-weight: 500;">
                    <ICheck /> {postSuccess}
                </div>
            )}

            <h4 id="file_info" dangerouslySetInnerHTML={{ __html: fileInfo }}></h4>


            {isRebooting && (
                <div style="
                    background: #fff3cd;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                ">
                    Reinicio en {countdown} segundos...
                </div>
            )}
        </fieldset>
    );
}