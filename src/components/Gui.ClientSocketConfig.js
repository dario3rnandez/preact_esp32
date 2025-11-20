import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import DataService from "../DataService";
import FetchButton from "./Util.FetchButton";
import HtmlBuilder from "../HtmlBuilder";

import ICheck from "./icons/ICheck.svg";
import ICopy from "./icons/ICopy.svg";
import IForbidden from "./icons/IForbidden.svg";
import ITrash from "./icons/ITrash.svg";
import IUpload from "./icons/IUpload.svg";
import DateFormatter from "../DateFormatter";
import { useRebootCountdown } from "./Util.reboot";





export default function ClientSocketConfigControlPanel(props) {
    // Estados principales
    const [fetching, setFetching] = useState(false);
    const [posting, setPosting] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [fetchSuccess, setFetchSuccess] = useState("");
    const [showData, setShowData] = useState(false);
    const [postError, setPostError] = useState("");
    const [postSuccess, setPostSuccess] = useState("");
    const [initialLoad, setInitialLoad] = useState(true);

    //Estados de datos
    const [ip_logger, setIpLogger] = useState("");
    const [port_logger, setPortLogger] = useState("");

    //Estados de edición
    const [editing, setEditing] = useState({
        ip_logger: false,
        port_logger: false
    });

    //Estados temporales para edición
    const [temp_ip_logger, setTempIpLogger] = useState("");
    const [temp_port_logger, setTempPortLogger] = useState("");

    const { countdown, isRebooting, startReboot } = useRebootCountdown();

    useEffect(() => {
        fetchValues();
    }, []);

    const fetchValues = () => {
        if (fetching) return;
        setFetching(true);
        DataService.get("/get_logger_data")
            .then(resp => {
                console.log(resp);
                setIpLogger(resp.ip_logger);
                setTempIpLogger(resp.ip_logger);

                setPortLogger(resp.port_logger);
                setTempPortLogger(resp.port_logger);

                setShowData(true);
                if (!initialLoad) {
                    setFetchSuccess(`Datos actualizados - ${DateFormatter.fullDate(new Date())}`);
                }
                setFetchError("");
                setInitialLoad(false);
            })
            .catch(() => setFetchError("Error al cargar datos"))
            .finally(() => setFetching(false));
    };

    const handleUpdate = () => {
        if (posting) return;
        setPosting(true);
        DataService.post("/post_logger_data", {
            ip_logger: temp_ip_logger,
            port_logger: temp_port_logger
        })
            .then(() => {
                fetchValues();
                setPostSuccess(`Datos actualizados - ${DateFormatter.fullDate(new Date())}`);
                startReboot();
            })
            .catch(() => setPostError("Error al guardar datos"))
            .finally(() => setPosting(false));
    }

    const handleDoubleClick = (field) => {
        // Solo copiar el valor del campo que se está editando a su estado temporal
        // No sobrescribir otros campos que puedan estar siendo editados
        if (field === "ip_logger") {
            setTempIpLogger(ip_logger);
        } else if (field === "port_logger") {
            setTempPortLogger(port_logger);
        }
        setEditing(prev => ({ ...prev, [field]: true }));
    }


    const renderEditableField = (field, value, setter) => {
        return editing[field] ? (
            <input
                type="text"
                value={value}
                onChange={e => setter(e.target.value)}
                onBlur={() => setEditing(prev => ({ ...prev, [field]: false }))}
                autoFocus
                class="editable-input"
            />
        ) : (
            <span
                onDblClick={() => handleDoubleClick(field)}
                class="editable-field"
            >
                {value}
            </span>
        );
    };

    return (
        <fieldset class="is-col">
            <legend>Configuración logs</legend>

            {/* Sección de datos */}
            {showData && (
                <div class="data-section">
                    <div class="data-row">
                        <label>IP Logger</label>
                        {renderEditableField("ip_logger", temp_ip_logger, setTempIpLogger)}
                    </div>

                    <div class="data-row">
                        <label>Puerto Logger</label>
                        {renderEditableField("port_logger", temp_port_logger, setTempPortLogger)}
                    </div>




                    {/* Botones de acción */}
                    <div class="action-buttons">
                        <button
                            class={`button primary ${posting ? "is-loading" : ""}`}
                            onClick={handleUpdate}
                            disabled={posting}
                        >
                            <IUpload /> Guardar Cambios
                        </button>

                    </div>
                    {isRebooting && (
                        <div class="reboot-message">
                            <p>El dispositivo se reiniciará en {countdown} segundos...</p>
                        </div>
                    )}
                </div>
            )}

            {
                fetchError != ""
                &&
                <div class="alert is-error">
                    <IForbidden />
                    {fetchError}
                </div>
            }
            {
                fetchSuccess != ""
                &&
                <div class="alert is-success">
                    <ICheck />
                    {fetchSuccess}
                </div>
            }
            {
                postError != ""
                &&
                <div class="alert is-error">
                    <IForbidden />
                    {postError}
                </div>
            }
            {
                postSuccess != ""
                &&
                <div class="alert is-success">
                    <ICheck />
                    {postSuccess}
                </div>

            }
            {/* Botón inicial de carga */}
            {!showData && (
                <div class="initial-load">
                    <FetchButton
                        fetching={fetching}
                        onClick={fetchValues}
                        class="primary"
                    >
                        Cargar Datos
                    </FetchButton>
                </div>
            )}
        </fieldset>
    );

}
