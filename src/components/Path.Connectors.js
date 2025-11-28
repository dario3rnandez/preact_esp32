import { h } from "preact";

import FullPage from "./Layout.FullPage";
import { useEffect, useState, useRef } from "preact/hooks";
import ConnectorControlPanel from "./Gui.ConnectorControlPanel";
import FetchButton from "./Util.FetchButton";

import IDownload from "./icons/IDownload.svg";
import IForbidden from "./icons/IForbidden.svg";
import ICheck from "./icons/ICheck.svg";
import IUpload from "./icons/IUpload.svg";

import DataService from "../DataService";
import DateFormatter from "../DateFormatter";
import {
    DEFAULT_NUM_CONNECTORS,
    MIN_NUM_CONNECTORS,
    MAX_NUM_CONNECTORS,
    API_ENDPOINT_GET_CONNECTOR_CONFIG,
    API_ENDPOINT_POST_CONNECTOR_CONFIG,
    API_ENDPOINT_CONNECTORS,
    API_ROOT
} from "../constants";
import { useRebootCountdown } from "./Util.reboot";
import { useWebSocket } from "./Util.useWebSocket";


export default function Connectors(props) {

    // Removed fetchAll state - using direct function calls instead

    const [fetchStart, setFetchStart] = useState(undefined);
    const [fetchStop, setFetchStop] = useState(undefined);
    const [fetching, setFetching] = useState(false);

    const [fetchError, setFetchError] = useState("");
    const [fetchSuccess, setFetchSuccess] = useState("");

    const [showTabs, setShowTabs] = useState(false);
    const [connectorIds, setConnectorIds] = useState([]);
    const [selectedTab, setSelectedTab] = useState(0);

    // Estados para configuración Modbus TCP
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState("");
    const [postSuccess, setPostSuccess] = useState("");
    const [num_connectors, setNumConnectors] = useState(DEFAULT_NUM_CONNECTORS);
    const [temp_num_connectors, setTempNumConnectors] = useState(DEFAULT_NUM_CONNECTORS);
    const [numConnectorsChanged, setNumConnectorsChanged] = useState(false);
    const [ocpp_without_plc_enabled, setOcppWithoutPlcEnabled] = useState(true);
    const [connector_ips, setConnectorIps] = useState([]);
    const [temp_ocpp_without_plc_enabled, setTempOcppWithoutPlcEnabled] = useState(true);
    const [temp_connector_ips, setTempConnectorIps] = useState([]);
    const [ocppWithoutPlcChanged, setOcppWithoutPlcChanged] = useState(false);
    const [connectorIpsChanged, setConnectorIpsChanged] = useState(false);

    // Estados para tipos de conectores (AC/DC)
    const [connector_types, setConnectorTypes] = useState([]); // 0: AC, 1: DC
    const [temp_connector_types, setTempConnectorTypes] = useState([]);
    const [connectorTypesChanged, setConnectorTypesChanged] = useState(false);

    // Estados para monitoreo de conexión
    const [connector_modbus_status, setConnectorModbusStatus] = useState([]);
    const [ocpp_connection_status, setOcppConnectionStatus] = useState([]);

    // Estados para edición de campos (similar a GeneralConfig)
    const [editing, setEditing] = useState({});

    // Estado para controlar si hay cambios locales pendientes (para evitar sobrescribir mientras el usuario edita)
    const [hasLocalChanges, setHasLocalChanges] = useState(false);

    // Ref para controlar si ya se cargó la configuración inicial
    const configLoadedRef = useRef(false);
    // Ref para el WebSocket para poder enviar mensajes
    const wsRef = useRef(null);

    const { countdown, isRebooting, startReboot } = useRebootCountdown();

    // Función para procesar la configuración recibida (usada tanto por WebSocket como por fetch inicial)
    const processConnectorConfig = (resp, skipIfLocalChanges = true) => {
        // Si hay cambios locales y skipIfLocalChanges es true, no actualizar
        if (skipIfLocalChanges && hasLocalChanges) {
            console.log("processConnectorConfig: Skipping update due to local changes");
            return;
        }

        console.log("=== /get_connector_config Response ===");
        console.log("Full response:", JSON.stringify(resp, null, 2));
        console.log("resp.num_connectors:", resp.num_connectors);
        console.log("resp.ocpp_without_plc_enabled:", resp.ocpp_without_plc_enabled);
        console.log("resp.connector_ips:", resp.connector_ips);

        // El backend devuelve num_connectors que incluye el conector 0
        // El frontend muestra solo el número de conectores físicos (sin contar el 0)
        const backendNumConn = resp.num_connectors !== undefined ? resp.num_connectors : (DEFAULT_NUM_CONNECTORS + 1);
        console.log("backendNumConn (from response):", backendNumConn);

        // Si backendNumConn = 3, significa conectores 0, 1, 2 (3 total, 2 físicos)
        const physicalConnectors = backendNumConn > 0 ? backendNumConn : DEFAULT_NUM_CONNECTORS;
        console.log("physicalConnectors (calculated, backendNumConn):", physicalConnectors);

        setNumConnectors(physicalConnectors);
        setTempNumConnectors(physicalConnectors);
        setNumConnectorsChanged(false);

        const withoutPlc = resp.ocpp_without_plc_enabled !== undefined ? resp.ocpp_without_plc_enabled : true;
        console.log("withoutPlc (from response):", withoutPlc);
        setOcppWithoutPlcEnabled(withoutPlc);
        setTempOcppWithoutPlcEnabled(withoutPlc);
        setOcppWithoutPlcChanged(false);

        if (withoutPlc) {
            // El backend devuelve num_connectors - 1 IPs (una por cada conector físico)
            // physicalConnectors es el número de conectores físicos (sin contar el 0)
            const backendIps = resp.connector_ips && Array.isArray(resp.connector_ips) ? resp.connector_ips : [];
            console.log("backendIps (processed):", backendIps);
            console.log("backendIps length:", backendIps.length);

            const allIps = [];

            // Generar IPs solo para conectores físicos (1, 2, 3, ...)
            for (let i = 0; i < physicalConnectors; i++) {
                if (i < backendIps.length && backendIps[i]) {
                    allIps.push(backendIps[i]);
                } else {
                    // Generar IP por defecto
                    allIps.push(`192.168.0.${4 + i}`);
                }
            }
            console.log("allIps (final):", allIps);
            console.log("allIps length:", allIps.length);

            setConnectorIps(allIps);
            setTempConnectorIps(allIps);
        } else {
            setConnectorIps([]);
            setTempConnectorIps([]);
        }
        setConnectorIpsChanged(false);

        // Procesar tipos de conectores
        const backendTypes = resp.connector_types && Array.isArray(resp.connector_types) ? resp.connector_types : [];
        const allTypes = [];
        for (let i = 0; i < physicalConnectors; i++) {
            if (i < backendTypes.length) {
                allTypes.push(backendTypes[i]);
            } else {
                allTypes.push(1); // Default to DC
            }
        }
        setConnectorTypes(allTypes);
        setTempConnectorTypes(allTypes);
        setConnectorTypesChanged(false);

        // Procesar estado Modbus
        const modbusStatus = resp.connector_modbus_status && Array.isArray(resp.connector_modbus_status) ? resp.connector_modbus_status : [];
        setConnectorModbusStatus(modbusStatus);

        // Procesar estado OCPP
        const ocppStatus = resp.ocpp_connection_status && Array.isArray(resp.ocpp_connection_status) ? resp.ocpp_connection_status : [];
        setOcppConnectionStatus(ocppStatus);

        console.log("=== End /get_connector_config Processing ===");
    };

    // WebSocket para actualizaciones en tiempo real
    const wsUrl = API_ROOT || (typeof window !== "undefined" ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}` : "");
    const { connected: wsConnected, send: wsSend } = useWebSocket(wsUrl, {
        onMessage: (data) => {
            console.log("WebSocket: Received message", data);
            if (data.type === "status_update") {
                console.log("WebSocket: Processing status update", data);
                setConnectorModbusStatus(prevStatus => {
                    // Create a new array based on previous status or empty if not initialized
                    // We assume the size is enough, or we expand it
                    const newStatus = [...prevStatus];

                    if (data.connectors && Array.isArray(data.connectors)) {
                        data.connectors.forEach(conn => {
                            // conn.id is 1-based index
                            const index = conn.id - 1;
                            if (index >= 0) {
                                // Ensure array is large enough
                                while (newStatus.length <= index) {
                                    newStatus.push(false);
                                }
                                newStatus[index] = conn.online;
                            }
                        });
                    }
                    return newStatus;
                });
            } else {
                console.log("WebSocket: Processing full config update");
                processConnectorConfig(data, true); // Skip if local changes exist
            }
            configLoadedRef.current = true; // Marcar como cargado cuando recibimos datos por WS
        },
        onOpen: () => {
            console.log("WebSocket: Connected to connector config updates");
            // Solo solicitar configuración si realmente no la tenemos
            // No hacer GET si ya la tenemos cargada (evita GETs en reconexiones)
            if (!configLoadedRef.current) {
                console.log("WebSocket: Requesting initial connector config");
                // Enviar mensaje para solicitar configuración inicial
                if (wsSend) {
                    wsSend(JSON.stringify({ type: "get_config" }));
                } else {
                    // Si el WebSocket no tiene send, hacer GET inicial como fallback
                    console.log("WebSocket: send not available, using GET fallback");
                    fetchModbusConfig();
                    configLoadedRef.current = true;
                }
            } else {
                console.log("WebSocket: Config already loaded, skipping initial request");
            }
        },
        onClose: () => {
            console.log("WebSocket: Disconnected from connector config updates");
            // NO resetear configLoadedRef aquí - solo se resetea si realmente necesitamos recargar
            // Esto evita que se recargue la configuración en cada reconexión automática

        },
        onError: (error) => {
            console.error("WebSocket: Error", error);
            // Si hay error de WebSocket, hacer GET inicial como fallback
            if (!configLoadedRef.current) {
                console.log("WebSocket: Error occurred, using GET fallback");
                fetchModbusConfig();
                configLoadedRef.current = true;
            }
        },
        enabled: true
    });

    // Fallback: Si después de 3 segundos no se ha cargado la configuración, hacer GET
    // Esto asegura que siempre tengamos la configuración, incluso si el WebSocket falla
    useEffect(() => {
        let mounted = true;
        const timeout = setTimeout(() => {
            if (mounted && !configLoadedRef.current) {
                console.log("WebSocket: Timeout waiting for config, using GET fallback");
                fetchModbusConfig();
                configLoadedRef.current = true;
            }
        }, 3000);

        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, []); // Solo ejecutar una vez al montar

    // Luego cargar los conectores después de que se actualice num_connectors
    // Solo ejecutar cuando num_connectors cambia y es mayor que 0, y no se está reiniciando
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (num_connectors > 0 && !isRebooting) {
            fetchValues();
        }
    }, [num_connectors]); // Solo cuando num_connectors cambia (isRebooting se verifica pero no es dependencia)

    function fetchModbusConfig() {
        DataService.get(API_ENDPOINT_GET_CONNECTOR_CONFIG)
            .then((resp) => {
                processConnectorConfig(resp, false); // Always update on manual fetch
            })
            .catch(error => {
                console.error("Error fetching connector config:", error);
            });
    }


    function fetchValues() {
        if (fetching) return;
        setFetchStart(new Date());
        setFetchStop(undefined);
        setFetching(true);
        console.log("=== GET " + API_ENDPOINT_CONNECTORS + " ===");
        console.log("Current num_connectors state:", num_connectors);
        console.log("Expected connectors (0 + physical):", num_connectors + 1);
        DataService.get(API_ENDPOINT_CONNECTORS).then(
            resp => {
                console.log("=== " + API_ENDPOINT_CONNECTORS + " Response ===");
                console.log("Full response:", JSON.stringify(resp, null, 2));
                console.log("Response type:", Array.isArray(resp) ? "Array" : typeof resp);
                console.log("Response length:", Array.isArray(resp) ? resp.length : "N/A");
                if (Array.isArray(resp)) {
                    console.log("Connector IDs:", resp);
                    console.log("Connector IDs count:", resp.length);
                    console.log("Expected count (num_connectors + 1):", num_connectors + 1);
                    if (resp.length !== num_connectors + 1) {
                        console.warn("Mismatch: Response has", resp.length, "connectors but expected", num_connectors + 1);
                    }
                }
                console.log("=== End " + API_ENDPOINT_CONNECTORS + " Processing ===");

                setConnectorIds(resp);

                setFetchError("");
                setFetchSuccess(`Successfully fetched connector list - ${DateFormatter.fullDate(new Date())}`);
                setShowTabs(true);
            }
        ).catch(
            e => {
                console.error("Error fetching connectors:", e);
                setFetchSuccess("");
                setFetchError("Unable to fetch connectors");
            }
        ).finally(
            () => {
                setFetchStop(new Date());
                setFetching(false);
            }
        )
    }

    // Funciones para manejar edición de campos (similar a GeneralConfig)
    const handleDoubleClick = (field) => {
        setEditing(prev => ({ ...prev, [field]: true }));
    };

    const renderEditableField = (field, value, setter) => {
        return editing[field] ? (
            <input
                type="text"
                value={value || ""}
                onChange={e => {
                    setter(e.target.value);
                }}
                onBlur={() => {
                    setEditing(prev => ({ ...prev, [field]: false }));
                    setConnectorIpsChanged(true);
                    setHasLocalChanges(true); // Marcar que hay cambios locales
                }}
                autoFocus
                class="editable-input"
                placeholder="192.168.0.x"
            />
        ) : (
            <span
                onDblClick={() => handleDoubleClick(field)}
                class="editable-field"
            >
                {value || "Haz doble clic para editar"}
            </span>
        );
    };

    const renderEditableIpField = (index, connectorId) => {
        const field = `connector_ip_${index}`;
        const value = temp_connector_ips[index] || "";
        const setter = (newValue) => {
            const newIps = [...temp_connector_ips];
            newIps[index] = newValue;
            setTempConnectorIps(newIps);
        };

        return (
            <div class="data-row">
                <label>Conector {connectorId}:</label>
                {renderEditableField(field, value, setter)}
            </div>
        );
    };

    function _buildConnectorTabs() {
        let connectorTabs = [];
        for (let i = 0; i < connectorIds.length; i++) {
            connectorTabs.push(
                <a href="#" onClick={() => { setSelectedTab(i) }} class={`${(i === selectedTab) ? "is-active" : ""}`}>Connector {connectorIds[i]}</a>
            )
        }
        return <nav class="tabs" data-kube="tabs" data-equal="true">
            {connectorTabs}
        </nav>
    }

    function _buildConnectorPanels() {
        let connectorPanels = [];
        for (let i = 0; i < connectorIds.length; i++) {
            connectorPanels.push(
                <ConnectorControlPanel connectorId={connectorIds[i]} display={(i === selectedTab)} autofetch={0} />
            )
        }
        return connectorPanels
    }

    return <FullPage>
        <h2>Connectors</h2>
        <div class="is-col">
            <div class="is-row is-stack-40">
                <div class="is-col">
                    <button class="button is-tertiary pad-icon space-right" onClick={() => {
                        fetchModbusConfig();
                        if (num_connectors > 0) {
                            fetchValues();
                        }
                    }}>
                        <IDownload />
                        Fetch All
                    </button>
                </div>
            </div>

            {/* Sección de Configuración de Conectores */}
            <fieldset class="is-col config-section-spacing">
                <legend>Configuración de Conectores</legend>
                <div class="data-section">
                    <div class="data-row">
                        <label>Número de Conectores:</label>
                        <input
                            type="number"
                            min={MIN_NUM_CONNECTORS}
                            max={MAX_NUM_CONNECTORS}
                            value={temp_num_connectors}
                            onInput={e => {
                                // Permitir escribir valores temporales mientras el usuario escribe
                                const inputValue = e.target.value;
                                if (inputValue === "") {
                                    setTempNumConnectors("");
                                    return;
                                }
                                const newValue = parseInt(inputValue, 10);
                                if (!isNaN(newValue)) {
                                    // Actualizar el valor temporal incluso si está fuera de rango
                                    // para permitir que el usuario escriba
                                    setTempNumConnectors(newValue);
                                }
                            }}
                            onChange={e => {
                                // Validar y aplicar cambios cuando el usuario termina de escribir
                                const inputValue = e.target.value;
                                if (inputValue === "") {
                                    // Si está vacío, restaurar el valor anterior
                                    setTempNumConnectors(num_connectors);
                                    return;
                                }
                                const newValue = parseInt(inputValue, 10);
                                if (!isNaN(newValue) && newValue >= MIN_NUM_CONNECTORS && newValue <= MAX_NUM_CONNECTORS) {
                                    setTempNumConnectors(newValue);
                                    setNumConnectorsChanged(newValue !== num_connectors);
                                    setHasLocalChanges(true); // Marcar que hay cambios locales
                                    // Ajustar IPs cuando cambia el número de conectores
                                    // newValue es el número de conectores físicos (sin contar el 0)
                                    // Pero el backend espera num_connectors que incluye el 0
                                    // Entonces si newValue = 2, el backend necesita num_connectors = 3 (0, 1, 2)
                                    if (temp_ocpp_without_plc_enabled) {
                                        const newIps = [];
                                        // Generar IPs solo para los conectores físicos
                                        for (let i = 0; i < newValue; i++) {
                                            if (i < temp_connector_ips.length && temp_connector_ips[i] !== "") {
                                                newIps.push(temp_connector_ips[i]);
                                            } else {
                                                newIps.push(`192.168.0.${4 + i}`);
                                            }
                                        }
                                        setTempConnectorIps(newIps);
                                        setConnectorIpsChanged(true);
                                    }

                                    // Ajustar Tipos cuando cambia el número de conectores
                                    const newTypes = [];
                                    for (let i = 0; i < newValue; i++) {
                                        if (i < temp_connector_types.length) {
                                            newTypes.push(temp_connector_types[i]);
                                        } else {
                                            newTypes.push(1); // Default to DC
                                        }
                                    }
                                    setTempConnectorTypes(newTypes);
                                    setConnectorTypesChanged(true);
                                } else {
                                    // Si el valor no es válido, restaurar el valor anterior
                                    setTempNumConnectors(num_connectors);
                                }
                            }}
                            onBlur={e => {
                                // Cuando el usuario sale del campo, asegurar que el valor sea válido
                                const inputValue = e.target.value;
                                if (inputValue === "") {
                                    setTempNumConnectors(num_connectors);
                                    return;
                                }
                                const newValue = parseInt(inputValue, 10);
                                if (isNaN(newValue) || newValue < MIN_NUM_CONNECTORS || newValue > MAX_NUM_CONNECTORS) {
                                    // Restaurar el valor válido anterior
                                    setTempNumConnectors(num_connectors);
                                } else {
                                    // Asegurar que el valor esté actualizado
                                    setTempNumConnectors(newValue);
                                    setNumConnectorsChanged(newValue !== num_connectors);
                                    setHasLocalChanges(true);
                                    // Ajustar IPs y tipos si es necesario
                                    if (temp_ocpp_without_plc_enabled && newValue !== temp_connector_ips.length) {
                                        const newIps = [];
                                        for (let i = 0; i < newValue; i++) {
                                            if (i < temp_connector_ips.length && temp_connector_ips[i] !== "") {
                                                newIps.push(temp_connector_ips[i]);
                                            } else {
                                                newIps.push(`192.168.0.${4 + i}`);
                                            }
                                        }
                                        setTempConnectorIps(newIps);
                                        setConnectorIpsChanged(true);
                                    }
                                    const newTypes = [];
                                    for (let i = 0; i < newValue; i++) {
                                        if (i < temp_connector_types.length) {
                                            newTypes.push(temp_connector_types[i]);
                                        } else {
                                            newTypes.push(1);
                                        }
                                    }
                                    setTempConnectorTypes(newTypes);
                                    setConnectorTypesChanged(true);
                                }
                            }}
                            class="input-number"
                        />
                        {numConnectorsChanged && (
                            <span class="warning-message">
                                ⚠ Se requiere reinicio para aplicar cambios
                            </span>
                        )}
                    </div>

                    <div class="data-row config-row-spacing">
                        <label>Modo sin PLC (Modbus TCP Client):</label>
                        <label class="switch">
                            <input
                                type="checkbox"
                                checked={temp_ocpp_without_plc_enabled}
                                onChange={e => {
                                    const newValue = e.target.checked;
                                    setTempOcppWithoutPlcEnabled(newValue);
                                    setOcppWithoutPlcChanged(newValue !== ocpp_without_plc_enabled);
                                    setHasLocalChanges(true); // Marcar que hay cambios locales
                                    if (!newValue) {
                                        setTempConnectorIps([]);
                                        setConnectorIpsChanged(false);
                                    } else {
                                        // Cuando se habilita, siempre generar IPs por defecto si no hay
                                        // temp_num_connectors es el número de conectores físicos (sin contar el 0)
                                        if (connector_ips.length > 0) {
                                            setTempConnectorIps([...connector_ips]);
                                        } else {
                                            const defaultIps = [];
                                            // Generar IPs solo para conectores físicos
                                            for (let i = 0; i < temp_num_connectors; i++) {
                                                defaultIps.push(`192.168.0.${4 + i}`);
                                            }
                                            setTempConnectorIps(defaultIps);
                                            setConnectorIpsChanged(true);
                                        }
                                    }
                                }}
                            />
                            <span class="slider"></span>
                            <span class="label-text">{temp_ocpp_without_plc_enabled ? "Habilitado" : "Deshabilitado"}</span>
                        </label>
                        {ocppWithoutPlcChanged && (
                            <span class="warning-message">
                                ⚠ Se requiere reinicio para aplicar cambios
                            </span>
                        )}
                    </div>

                    {/* Configuración de Conectores: IPs y Tipos */}
                    {temp_ocpp_without_plc_enabled && (
                        <div class="config-row-spacing-large">
                            <div class="data-row">
                                <label class="section-label">
                                    Configuración de Conectores:
                                </label>
                            </div>
                            {temp_connector_ips.length > 0 ? (
                                temp_connector_ips.map((ip, index) => {
                                    const connectorId = index + 1;
                                    const type = temp_connector_types[index] !== undefined ? temp_connector_types[index] : 1;
                                    return (
                                        <div key={index} class="data-row" style="display: flex; gap: 20px; align-items: center;">
                                            {/* IP del conector */}
                                            <div style="flex: 1;">
                                                {renderEditableIpField(index, connectorId)}
                                            </div>

                                            {/* Tipo del conector */}
                                            <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                                                <label>Tipo:</label>
                                                <div class="select-wrapper">
                                                    <select
                                                        value={type}
                                                        onChange={e => {
                                                            const newTypes = [...temp_connector_types];
                                                            newTypes[index] = parseInt(e.target.value, 10);
                                                            setTempConnectorTypes(newTypes);
                                                            setConnectorTypesChanged(true);
                                                            setHasLocalChanges(true); // Marcar que hay cambios locales
                                                        }}
                                                    >
                                                        <option value={1}>DC (Carga Rápida)</option>
                                                        <option value={0}>AC (Carga Lenta)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Estado de conexión Modbus */}
                                            <div style="display: flex; align-items: center; gap: 5px;" title={connector_modbus_status[index] ? "Conectado" : "Desconectado"}>
                                                <div style={{
                                                    width: "12px",
                                                    height: "12px",
                                                    borderRadius: "50%",
                                                    backgroundColor: connector_modbus_status[index] ? "#28a745" : "#dc3545",
                                                    border: "1px solid #ccc"
                                                }}></div>
                                                <span style={{ fontSize: "0.8em", color: "#666" }}>
                                                    {connector_modbus_status[index] ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div class="info-message">
                                    No hay conectores configurados.
                                </div>
                            )}
                            {(connectorIpsChanged || connectorTypesChanged) && (
                                <div class="data-row">
                                    <span class="warning-message-block">
                                        ⚠ Se requiere reinicio para aplicar cambios
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tipos de Conectores cuando NO está habilitado el modo sin PLC */}
                    {!temp_ocpp_without_plc_enabled && (
                        <div class="config-row-spacing-large">
                            <div class="data-row">
                                <label class="section-label">
                                    Tipos de Conectores:
                                </label>
                            </div>
                            {temp_connector_types.length > 0 ? (
                                temp_connector_types.map((type, index) => {
                                    const connectorId = index + 1;
                                    return (
                                        <div key={index} class="data-row">
                                            <label>Conector {connectorId}:</label>
                                            <div class="select-wrapper">
                                                <select
                                                    value={type}
                                                    onChange={e => {
                                                        const newTypes = [...temp_connector_types];
                                                        newTypes[index] = parseInt(e.target.value, 10);
                                                        setTempConnectorTypes(newTypes);
                                                        setConnectorTypesChanged(true);
                                                        setHasLocalChanges(true); // Marcar que hay cambios locales
                                                    }}
                                                >
                                                    <option value={1}>DC (Carga Rápida)</option>
                                                    <option value={0}>AC (Carga Lenta)</option>
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div class="info-message">
                                    Cargando tipos...
                                </div>
                            )}
                            {connectorTypesChanged && (
                                <div class="data-row">
                                    <span class="warning-message-block">
                                        ⚠ Se requiere reinicio para aplicar cambios en los tipos
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div class="action-buttons">
                        <button
                            class={`button primary ${posting ? "is-loading" : ""}`}
                            onClick={() => {
                                // Validar num_connectors antes de enviar
                                const numConn = parseInt(temp_num_connectors, 10);
                                if (isNaN(numConn) || numConn < MIN_NUM_CONNECTORS || numConn > MAX_NUM_CONNECTORS) {
                                    setPostError(`El número de conectores debe estar entre ${MIN_NUM_CONNECTORS} y ${MAX_NUM_CONNECTORS}`);
                                    return;
                                }

                                const backendNumConnectors = numConn;

                                const payload = {
                                    num_connectors: backendNumConnectors,
                                    ocpp_without_plc_enabled: temp_ocpp_without_plc_enabled
                                };

                                // Incluir IPs si están habilitadas
                                // numConn es el número de conectores físicos (sin contar el 0)
                                // El backend espera num_connectors - 1 IPs (una por cada conector físico)
                                if (temp_ocpp_without_plc_enabled) {
                                    let ipsToSend = [];

                                    // temp_connector_ips contiene las IPs de los conectores físicos (1, 2, 3, ...)
                                    // Asegurarse de que solo se envíen las IPs correspondientes al número de conectores
                                    for (let i = 0; i < numConn; i++) {
                                        if (i < temp_connector_ips.length && temp_connector_ips[i] && temp_connector_ips[i] !== "") {
                                            ipsToSend.push(temp_connector_ips[i]);
                                        } else {
                                            // Si está vacío, usar valor por defecto
                                            ipsToSend.push(`192.168.0.${4 + i}`);
                                        }
                                    }
                                    payload.connector_ips = ipsToSend;
                                } else {
                                    payload.connector_ips = [];
                                }

                                // Incluir Tipos de Conectores
                                // Asegurarse de que solo se envíen los tipos correspondientes al número de conectores
                                let typesToSend = [];
                                for (let i = 0; i < numConn; i++) {
                                    if (i < temp_connector_types.length) {
                                        typesToSend.push(temp_connector_types[i]);
                                    } else {
                                        // Si no hay tipo definido, usar valor por defecto (DC = 1)
                                        typesToSend.push(1);
                                    }
                                }
                                payload.connector_types = typesToSend;

                                setPosting(true);
                                setPostError("");
                                setPostSuccess("");

                                console.log("=== POST " + API_ENDPOINT_POST_CONNECTOR_CONFIG + " ===");
                                console.log("Payload:", JSON.stringify(payload, null, 2));
                                console.log("payload.num_connectors:", payload.num_connectors);
                                console.log("payload.ocpp_without_plc_enabled:", payload.ocpp_without_plc_enabled);
                                console.log("payload.connector_ips:", payload.connector_ips);
                                console.log("payload.connector_ips length:", payload.connector_ips ? payload.connector_ips.length : "null/undefined");
                                console.log("payload.connector_types:", payload.connector_types);

                                DataService.post(API_ENDPOINT_POST_CONNECTOR_CONFIG, payload)
                                    .then((resp) => {
                                        console.log("=== " + API_ENDPOINT_POST_CONNECTOR_CONFIG + " Response ===");
                                        console.log("Full response:", JSON.stringify(resp, null, 2));
                                        console.log("resp.status:", resp?.status);
                                        console.log("resp.message:", resp?.message);
                                        console.log("=== End " + API_ENDPOINT_POST_CONNECTOR_CONFIG + " Processing ===");

                                        if (resp?.status === "ok") {
                                            // Limpiar cambios locales después de guardar exitosamente
                                            setHasLocalChanges(false);
                                            let successMsg = "Configuración de conectores guardada exitosamente";
                                            // Siempre requiere reinicio para cambios en conectores
                                            if (numConnectorsChanged || ocppWithoutPlcChanged || connectorIpsChanged || connectorTypesChanged) {
                                                successMsg += ". Se requiere reinicio para aplicar los cambios.";
                                                startReboot();
                                                // No recargar configuración si se va a reiniciar, ya que se perderá
                                            } else {
                                                // No hacer GET - esperar actualización por WebSocket
                                                // El backend debería enviar la actualización automáticamente por WebSocket
                                                console.log("Waiting for WebSocket update after save");
                                            }
                                            setPostSuccess(successMsg);
                                        } else {
                                            setPostError(resp?.message || "Error al guardar la configuración de conectores.");
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error posting connector config:", error);
                                        setPostError(error?.message || "Error de red al guardar la configuración.");
                                    })
                                    .finally(() => {
                                        setPosting(false);
                                    });
                            }}
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

                    {postError !== "" && (
                        <div class="alert is-error">
                            <IForbidden />
                            {postError}
                        </div>
                    )}

                    {postSuccess !== "" && (
                        <div class="alert is-success">
                            <ICheck />
                            {postSuccess}
                        </div>
                    )}
                </div>
            </fieldset>

            <fieldset class="is-col">
                <legend>Connectors</legend>
                <div class={`is-row ${(showTabs || fetchError !== "") ? "is-stack-20" : ""}`}>
                    <div class="is-col">
                        <FetchButton fetching={fetching} fetchSuccess={fetchSuccess} fetchStart={fetchStart} fetchStop={fetchStop} onClick={() => { fetchValues() }} >
                            Connectors
                        </FetchButton>
                    </div>
                </div>
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
                    showTabs &&
                    <div class="is-row is-stack-4">
                        <div class="is-col">
                            {_buildConnectorTabs()}
                        </div>
                    </div>
                }
                {
                    showTabs &&
                    _buildConnectorPanels()
                }
            </fieldset>
        </div>
    </FullPage>
}