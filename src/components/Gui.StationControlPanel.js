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


export default function NetworkConfigControlPanel(props) {
    // Estados principales
    const [fetching, setFetching] = useState(false);
    const [posting, setPosting] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [fetchSuccess, setFetchSuccess] = useState("");
    const [showData, setShowData] = useState(false);
    const [postError, setPostError] = useState("");
    const [postSuccess, setPostSuccess] = useState("");
    const [initialLoad, setInitialLoad] = useState(true); 

    // Estados de datos
    const [ip, setIp] = useState("");
    const [netmask, setNetmask] = useState("");
    const [gateway, setGateway] = useState("");

    // Estados de edición
    const [editing, setEditing] = useState({
        ip: false,
        netmask: false,
        gateway: false
    });

    // Estados temporales para edición   
    const [temp_ip, setTempIp] = useState("");
    const [temp_netmask, setTempNetmask] = useState("");
    const [temp_gateway, setTempGateway] = useState("");

    const { countdown, isRebooting, startReboot } = useRebootCountdown();

    useEffect(() => {
        fetchValues();
    }, []);

    const fetchValues = () => {
        if (fetching) return;
        setFetching(true);
        DataService.get("/get_network_data")
            .then(resp => {
                console.log(resp);
               
                setTempIp(resp.ip);
                setIp(resp.ip);

                setTempNetmask(resp.netmask);
                setNetmask(resp.netmask);

                setTempGateway(resp.gateway);
                setGateway(resp.gateway);
                
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
        setPosting(true);
        DataService.post("/post_network_data", {
            ip: temp_ip,
            netmask: temp_netmask,
            gateway: temp_gateway
        })
            .then(resp => {
                console.log(resp.status);
                if (resp.status === "ok") {
                    
                    fetchValues(); // Recargar datos
                    setPostSuccess("Cambios guardados exitosamente");  
                    startReboot();
                }
            })
            .catch(() => setPostError("Error al guardar cambios"))
            .finally(() => setPosting(false));
    };

    const handleDoubleClick = (field) => {
        // Solo copiar el valor del campo que se está editando a su estado temporal
        // No sobrescribir otros campos que puedan estar siendo editados
        if (field === "ip") {
            setTempIp(ip);
        } else if (field === "netmask") {
            setTempNetmask(netmask);
        } else if (field === "gateway") {
            setTempGateway(gateway);
        }
        setEditing(prev => ({ ...prev, [field]: true }));
    };

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
                {value }
            </span>
        );
    };

    return (
        <fieldset class="is-col">
            <legend>Configuración General</legend>

            {/* Sección de datos */}
            {showData && (
                <div class="data-section">
                    <div class="data-row">
                        <label>Ip:</label>
                        {renderEditableField("ip", temp_ip, setTempIp)}
                    </div>

                    <div class="data-row">
                        <label>NetMask</label>
                        {renderEditableField("netmask", temp_netmask, setTempNetmask)}
                    </div>

                    <div class="data-row">
                        <label>gateway</label>
                        {renderEditableField("gateway", temp_gateway, setTempGateway)}
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