// Configuración dinámica de menú según variante de build

const variant = process.env.EVSE_VARIANT || "OCPP";

const TITLES = {
  OCPP: "OCPP EVSE Dashboard",
  GBT: "GBT EVSE Dashboard",
  CCS: "CCS EVSE Dashboard",
  AC: "AC EVSE Dashboard"
};

const COMMON_MODULES = [
  { route: "general_config", label: "Configuración general", icon: "IControls" },
  { route: "network_config", label: "Configuración de red", icon: "IWifi" },
  { route: "ota_update", label: "OTA Update", icon: "IWifi" },
  { route: "restart", label: "Reiniciar", icon: "IPower" }
];

const VARIANT_MODULES = {
  OCPP: [
    ...COMMON_MODULES,
    { route: "certificates_config", label: "OCPP certificados", icon: "IServer" },
    { route: "connectors", label: "Conectores", icon: "IEvse" },
    { route: "history", label: "Historial", icon: "IClock" },
    { route: "erase_nvs", label: "Borrar NVS", icon: "IServer" },
    { route: "format_partition", label: "Formatear partición", icon: "IServer" }
  ],
  GBT: [
    ...COMMON_MODULES
  ],
  CCS: [
    ...COMMON_MODULES
  ],
  AC: [
    ...COMMON_MODULES
  ]
};

export const DASHBOARD_TITLE = TITLES[variant] || TITLES["OCPP"];
export const DASHBOARD_VARIANT = variant;
export default VARIANT_MODULES[variant] || COMMON_MODULES; 