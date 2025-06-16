import { h } from "preact";
import FullPage from "./Layout.FullPage";
import RebootCountdown from "./Gui.RebootCountdown.js";

export default function RestartPath(props)
{
    return <FullPage>
        <h2 class="is-stack-40">Reiniciar dispositivo</h2>
        <div class="is-col">
            <RebootCountdown />
        </div>
    </FullPage>
}