import "./component_styles/sidebar.css";
import menuConfig from '../menuConfig';
import { DASHBOARD_TITLE } from '../menuConfig';

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
        const icons = { IWifi, ILock, IMatthLogo, IServer, IControls, IPower, IEvse };
        return (
            <aside class="sidebar">
                <div class="sb-header">
                    <IMatthLogo></IMatthLogo>
                    <div>{DASHBOARD_TITLE}</div>
                </div>
                <div class="divider" />
                {menuConfig.map(item => {
                    const Icon = icons[item.icon] || IControls;
                    return (
                        <SidebarItem key={item.route} route={item.route} nav={props.nav}>
                            <Icon />
                            <span>{item.label}</span>
                        </SidebarItem>
                    );
                })}
                <div class="divider" />
            </aside>
        )
    }
}