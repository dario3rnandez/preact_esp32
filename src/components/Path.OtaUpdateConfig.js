import { h, Component } from "preact";
import FullPage from "./Layout.FullPage";
import OTAUpdateConfig from "./Gui.OTAUpdateConfig.js";

export default function OtaUpdateConfig(props) {
    return <FullPage>
        <h2 class="is-stack-40">Configuración de Actualización OTA</h2>
        <div class="is-col">
            <OTAUpdateConfig />
        </div>
    </FullPage>
}
