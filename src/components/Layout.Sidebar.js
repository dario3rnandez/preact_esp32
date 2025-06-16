import "./component_styles/sidebar.css";

import { h, Component } from "preact";

import SidebarItem from "./Layout.SidebarItem.js";
import IWifi from "./icons/IWifi.svg";
import ILock from "./icons/ILock.svg";
import IMatthLogo from "./icons/me-corp.svg";
import IServer from "./icons/IServer.svg";
import IControls from "./icons/IControls.svg";
import IPower from "./icons/IPower.svg";
import IEvse from "./icons/IEvse.svg";

export default class Sidebar extends Component {

    constructor() {
        super();
    }

    render(props) {
        return (
            <aside class="sidebar">
                <div class="sb-header">
                    <IMatthLogo></IMatthLogo>
                    <div>Ocpp DashBoard</div>
                </div>
                <div class="divider" />
                <SidebarItem route="general_config" nav={props.nav}>
                    <IControls />
                    <span>Configuración general</span>
                </SidebarItem>
                <SidebarItem route="certificates_config" nav={props.nav}>
                    <IServer />
                    <span>OCPP certificados</span>
                </SidebarItem>
                <SidebarItem route="network_config" nav={props.nav}>
                    <IWifi />
                    <span>Configuración de red</span>
                </SidebarItem>
                <SidebarItem route="connectors" nav={props.nav}>
                    <IEvse />
                    <span>Conectores</span>
                </SidebarItem>
                <SidebarItem route="ota_update" nav={props.nav}>
                    <IWifi />
                    <span>OTA Update</span>
                </SidebarItem>
                <SidebarItem route="erase_nvs" nav={props.nav}>
                    <IServer />
                    <span>Borrar NVS</span>
                </SidebarItem>
                <SidebarItem route="format_partition" nav={props.nav}>
                    <IServer />
                    <span>Formatear partición</span>
                </SidebarItem>
                <SidebarItem route="restart" nav={props.nav}>
                    <IPower />
                    <span>Reiniciar</span>
                </SidebarItem>
                <div class="divider" />
            </aside>
        )
    }
}