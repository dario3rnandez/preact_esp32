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

export default function WebsocketControlPanel(props) {
    // Estados principales
    const [fetching, setFetching] = useState(false);
    const [posting, setPosting] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [fetchSuccess, setFetchSuccess] = useState("");
    const [postError, setPostError] = useState("");
    const [postSuccess, setPostSuccess] = useState("");
    const [showData, setShowData] = useState(false);

    // Estados de datos
    const [server_ocpp_url, setBackendUrl] = useState("");
    const [ocpp_charger_id, setChargeBoxId] = useState("");
    const [ocpp_auth_key, setAuthorizationKey] = useState("");

    // Estados de edición
    const [editing, setEditing] = useState({
        server_ocpp_url: false,
        ocpp_charger_id: false,
        ocpp_auth_key: false
    });

    // Estados temporales para edición
    const [temp_server_ocpp_url, setTempBackendUrl] = useState("");
    const [temp_ocpp_charger_id, setTempChargeBoxId] = useState("");
    const [temp_ocpp_auth_key, setTempAuthKey] = useState("");

    useEffect(() => {
        if (props.autofetch) fetchValues();
    }, [props.autofetch]);

    const fetchValues = () => {
        if (fetching) return;
        setFetching(true);
        DataService.get("/get_general_data")
            .then(resp => {
                setBackendUrl(resp.server_ocpp_url);
                setChargeBoxId(resp.ocpp_charger_id);
                setAuthorizationKey(resp.ocpp_auth_key);
                setShowData(true);
                setFetchSuccess(`Datos actualizados - ${DateFormatter.fullDate(new Date())}`);
                setFetchError("");
            })
            .catch(() => setFetchError("Error al cargar datos"))
            .finally(() => setFetching(false));
    };

    const handleUpdate = () => {
        setPosting(true);
        DataService.post("/post_general_data", {
            server_ocpp_url: temp_server_ocpp_url,
            ocpp_charger_id: temp_ocpp_charger_id,
            ocpp_auth_key: temp_ocpp_auth_key
        })
            .then(resp => {
                if (resp.status === "success") {
                    setPostSuccess("Cambios guardados exitosamente");
                    fetchValues(); // Recargar datos
                }
            })
            .catch(() => setPostError("Error al guardar cambios"))
            .finally(() => setPosting(false));
    };

    const handleDoubleClick = (field) => {
        // Copiar valores actuales a temporales
        setTempBackendUrl(server_ocpp_url);
        setTempChargeBoxId(ocpp_charger_id);
        setTempAuthKey(ocpp_auth_key);
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
                {value || <em>Doble clic para editar</em>}
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
                        <label>Backend URL:</label>
                        {renderEditableField("backendUrl", temp_server_ocpp_url, setTempBackendUrl)}
                    </div>
                    
                    <div class="data-row">
                        <label>Chargebox ID:</label>
                        {renderEditableField("chargeBoxId", temp_ocpp_charger_id, setTempChargeBoxId)}
                    </div>
                    
                    <div class="data-row">
                        <label>Authorization Key:</label>
                        {renderEditableField("authorizationKey", temp_ocpp_auth_key, setTempAuthKey)}
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
                        
                        {/* <FetchButton 
                            fetching={fetching} 
                            onClick={fetchValues}
                            class="secondary"
                        >
                            <ICopy /> Recargar Datos
                        </FetchButton> */}
                    </div>
                </div>
            )}

            {/* Mensajes de estado */}
            {fetchError && (
                <div class="alert is-error">
                    <IForbidden /> {fetchError}
                </div>
            )}
            
            {postSuccess && (
                <div class="alert is-success">
                    <ICheck /> {postSuccess}
                </div>
            )}

            {/* Botón inicial de carga */}
            {!showData && (
                <div class="initial-load">
                    <FetchButton 
                        fetching={fetching}
                        onClick={fetchValues}
                        class="primary"
                    >
                        <IUpload /> Cargar Datos
                    </FetchButton>
                </div>
            )}
        </fieldset>
    );
}