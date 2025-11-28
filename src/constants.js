// En desarrollo, usar ruta relativa para que webpack-dev-server haga proxy
// En producción, usar la URL completa del servidor
const API_ROOT = process.env.NODE_ENV === "development" ? "" : (process.env.API_ROOT || "");
const NODE_ENV = process.env.NODE_ENV || "development";

const API_ENDPOINT_BACKEND_URL = "/ocpp_backend";
const API_ENDPOINT_EV_STATUS   = "/status_ev";
const API_ENDPOINT_EVSE_STATUS   = "/status_evse";
const API_ENDPOINT_USER_AUTHORIZATION   = "/user_authorization";
const API_ENDPOINT_CERTIFICATE   = "/ca_cert";
const API_ENDPOINT_GET_CONNECTOR_CONFIG = "/get_connector_config";
const API_ENDPOINT_POST_CONNECTOR_CONFIG = "/post_connector_config";
const API_ENDPOINT_CONNECTORS = "/connectors";

export {
	API_ROOT,
	NODE_ENV,
	API_ENDPOINT_BACKEND_URL,
	API_ENDPOINT_EV_STATUS,
	API_ENDPOINT_EVSE_STATUS,
	API_ENDPOINT_USER_AUTHORIZATION,
	API_ENDPOINT_CERTIFICATE,
	API_ENDPOINT_GET_CONNECTOR_CONFIG,
	API_ENDPOINT_POST_CONNECTOR_CONFIG,
	API_ENDPOINT_CONNECTORS
};

export const AUTH_MODE = {
	AUTH_LOCAL: 'LOCAL',
	AUTH_OCPP: 'OCPP',
	AUTH_RFID: 'RFID'
};

// Constantes para número de conectores (deben coincidir con general_config.h)
export const MIN_NUM_CONNECTORS = 1;
export const MAX_NUM_CONNECTORS = 4;
export const DEFAULT_NUM_CONNECTORS = 2;