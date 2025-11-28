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
import { DASHBOARD_VARIANT } from '../menuConfig';
import { AUTH_MODE, MIN_NUM_CONNECTORS, MAX_NUM_CONNECTORS, DEFAULT_NUM_CONNECTORS } from '../constants';

export default function GeneralConfigControlPanel(props) {
    if (DASHBOARD_VARIANT === 'OCPP') {
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

        const { countdown, isRebooting, startReboot } = useRebootCountdown();

        useEffect(() => {
            fetchValues();
        }, []);
        

        const fetchValues = () => {
            if (fetching) return;
            setFetching(true);
            DataService.get("/get_general_data")
                .then((generalResp) => {
                    console.log(generalResp);
                    setBackendUrl(generalResp.server_ocpp_url);
                    setTempBackendUrl(generalResp.server_ocpp_url);

                    setChargeBoxId(generalResp.ocpp_charger_id);
                    setTempChargeBoxId(generalResp.ocpp_charger_id);
                    
                    setAuthorizationKey(generalResp.ocpp_auth_key);
                    setTempAuthKey(generalResp.ocpp_auth_key);
                    
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
            DataService.post("/post_general_data", {
                server_ocpp_url: temp_server_ocpp_url,
                ocpp_charger_id: temp_ocpp_charger_id,
                ocpp_auth_key: temp_ocpp_auth_key
            })
                .then((generalResp) => {
                    console.log(generalResp?.status);
                    if (generalResp?.status === "ok") {
                        fetchValues(); // Recargar datos
                        setPostSuccess("Cambios guardados exitosamente");  
                    }
                })
                .catch(() => setPostError("Error al guardar cambios"))
                .finally(() => setPosting(false));
        };

        const handleDoubleClick = (field) => {
            // Solo copiar el valor del campo que se está editando a su estado temporal
            // No sobrescribir otros campos que puedan estar siendo editados
            if (field === "server_ocpp_url") {
            setTempBackendUrl(server_ocpp_url);
            } else if (field === "ocpp_charger_id") {
            setTempChargeBoxId(ocpp_charger_id);
            } else if (field === "ocpp_auth_key") {
            setTempAuthKey(ocpp_auth_key);
            }
            setEditing(prev => ({ ...prev, [field]: true }));
        };

        const renderEditableField = (field, value, setter) => {
            return editing[field] ? (
                <input
                    type="text"
                    value={value}
                    onChange={e => {
                        setter(e.target.value);
                    }}
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
                            <label>Backend URL:</label>
                            {renderEditableField("server_ocpp_url", temp_server_ocpp_url, setTempBackendUrl)}
                        </div>

                        <div class="data-row">
                            <label>Chargebox ID:</label>
                            {renderEditableField("ocpp_charger_id", temp_ocpp_charger_id, setTempChargeBoxId)}
                        </div>

                        <div class="data-row">
                            <label>Authorization Key:</label>
                            {renderEditableField("ocpp_auth_key", temp_ocpp_auth_key, setTempAuthKey)}
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
    // Para GBT, CCS y AC:
    // Estados
    const [authMode, setAuthMode] = useState(AUTH_MODE.AUTH_OCPP);
    const [potencia, setPotencia] = useState("");
    const [tensionMaxima, setTensionMaxima] = useState("");
    const [corriente, setCorriente] = useState("");
    const [numModules, setNumModules] = useState("");
    const [status, setStatus] = useState("");
    const [posting, setPosting] = useState(false);

    // Lógica de exclusión de modos
    const handleModeChange = (mode) => {
        setAuthMode(mode);
    };

    const handleSubmit = () => {
        setPosting(true);
        const general_data = {
            auth_mode: authMode,
            potencia,
            tension_maxima: tensionMaxima,
            corriente,
            num_modules: numModules
        };
        fetch('/post_general_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(general_data)
        })
            .then(response => response.json())
            .then(data => {
                setStatus('General data saved successfully');
            })
            .catch((error) => {
                setStatus('Error al guardar datos');
            })
            .finally(() => setPosting(false));
    };

    return (
        <div class="container">
            <div class="form-section">
                <h2>Modos</h2>
                <form id="connectors-form" onSubmit={e => e.preventDefault()}>
                    <ul class="column">
                        <li style="display: flex; gap: 16px;">
                            <label class="switch">
                                <input type="checkbox" checked={authMode === AUTH_MODE.AUTH_LOCAL} onChange={() => handleModeChange(AUTH_MODE.AUTH_LOCAL)} />
                                <span class="slider"></span>
                                <span class="label-text">Local</span>
                            </label>
                            <label class="switch">
                                <input type="checkbox" checked={authMode === AUTH_MODE.AUTH_OCPP} onChange={() => handleModeChange(AUTH_MODE.AUTH_OCPP)} />
                                <span class="slider"></span>
                                <span class="label-text">OCPP</span>
                            </label>
                            <label class="switch">
                                <input type="checkbox" checked={authMode === AUTH_MODE.AUTH_RFID} onChange={() => handleModeChange(AUTH_MODE.AUTH_RFID)} />
                                <span class="slider"></span>
                                <span class="label-text">RFID</span>
                            </label>
                        </li>
                    </ul>
                </form>
                <h2>Datos Generales</h2>
                <form id="general-form" onSubmit={e => e.preventDefault()}>
                    <input type="text" class="text_input" id="potencia" name="potencia" placeholder="Potencia" required value={potencia} onInput={e => setPotencia(e.target.value)} />
                    <input type="text" class="text_input" id="tension_maxima" name="tension_maxima" placeholder="Tensión Máxima" required value={tensionMaxima} onInput={e => setTensionMaxima(e.target.value)} />
                    <input type="text" class="text_input" id="corriente" name="corriente" placeholder="Corriente" required value={corriente} onInput={e => setCorriente(e.target.value)} />
                    <input type="text" class="text_input" id="num_modules" name="num_modules" placeholder="Número de módulos" required value={numModules} onInput={e => setNumModules(e.target.value)} />
                </form>
                <div class="row" style="text-align: center;">
                    <input style="font-size: 15px;" type="button" class="buttons" value={posting ? "Guardando..." : "Modificar Datos Generales"} onClick={handleSubmit} disabled={posting} />
                </div>
                <div id="post_status" style="text-align:center; color:green; margin-top:10px;">{status}</div>
            </div>
        </div>
    );
}