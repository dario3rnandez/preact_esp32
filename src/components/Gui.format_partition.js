import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import DataService from "../DataService";
import { useRebootCountdown } from "./Util.reboot";
import IUpload from "./icons/IUpload.svg";

export default function FormatPartition(props) {
    const [posting, setPosting] = useState(false);
    const { countdown, isRebooting, startReboot } = useRebootCountdown();

    const formatPartition = () => {
        setPosting(true);
        DataService.post("/format_micro_ocpp", {})
            .then(resp => {
                console.log(resp.status);
                if (resp.status === "ok") {
                    setPosting(false);
                    startReboot();
                }
            })
            .catch(error => {
                console.error("Error al formatear partición:", error);
            })
            .finally(() => {
                console.log("Formateo de partición completado.");
            });
    };

    return (
        <fieldset class="is-col">
            <legend>Formatear partición</legend>
            <button
                class={`button primary ${posting ? "is-loading" : ""}`}
                onClick={formatPartition}>
                <IUpload /> Formatear partición
            </button>
            {posting ? (
                <div class="fetch-message">
                    <p>Formateando partición...</p>
                </div>
            ) : null}
            {isRebooting ? (
                <div class="reboot-message">
                    <p>El dispositivo se reiniciará en {countdown} segundos...</p>
                </div>
            ) : null}
        </fieldset>
    );
}
