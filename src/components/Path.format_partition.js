import { h } from "preact";
import FullPage from "./Layout.FullPage";
import FormatPartition from "./Gui.format_partition.js";

export default function FormatPartitionPath(props)
{
    return <FullPage>
        <h2 class="is-stack-40">Formatear partición</h2>
        <div class="is-col">
            <FormatPartition />
        </div>
    </FullPage>
}