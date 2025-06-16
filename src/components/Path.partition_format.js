import { h, Component } from "preact";
import FullPage from "./Layout.FullPage";
import FormatPartition from "./Gui.partition_format.js";

export default function PartitionFormatPath(props)
{
    return <FullPage>
        <h2 class="is-stack-40">Format Partition</h2>
        <div class="is-col">
            <FormatPartition />
        </div>
    </FullPage>
}
