import { h } from "preact";

import WebsocketControlPanel from "./Gui.WebsocketControlPanel";
import FullPage from "./Layout.FullPage";

export default function Websocket16(props){
    return <FullPage>
            <h2 class="is-stack-40">Configuración General</h2>
            <div class="is-col">
                <WebsocketControlPanel />
            </div>
    </FullPage>
}