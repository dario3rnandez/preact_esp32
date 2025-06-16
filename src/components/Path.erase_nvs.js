import { h, Component } from "preact";
import FullPage from "./Layout.FullPage";
import EraseNVS from "./Gui.erase_nvs.js";

export default function EraseNvsPath(props)
{
    return <FullPage>
        <h2 class="is-stack-40">Erase NVS</h2>
        <div class="is-col">
            <EraseNVS />
        </div>
    </FullPage>
}