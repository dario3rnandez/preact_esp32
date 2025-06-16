import { h } from "preact";

import GeneralConfig from "./Gui.GeneralConfig.js";
import ClientSocketConfig from "./Gui.ClientSocketConfig.js";
import FullPage from "./Layout.FullPage.js";

export default function GeneralConfigPath(props){
    return <FullPage>
            <h2 class="is-stack-40">Configuración General</h2>
            <div class="is-col">
                <GeneralConfig />
            </div>
            <div class="is-col">
                <ClientSocketConfig />
            </div>
    </FullPage>
}