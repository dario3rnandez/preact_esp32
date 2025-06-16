import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import DataService from "../DataService";

import HtmlBuilder from "../HtmlBuilder";

import ICheck from "./icons/ICheck.svg";
import ICopy from "./icons/ICopy.svg";
import IForbidden from "./icons/IForbidden.svg";
import ITrash from "./icons/ITrash.svg";
import IUpload from "./icons/IUpload.svg";
import DateFormatter from "../DateFormatter";
import { useRebootCountdown } from "./Util.reboot";


export default function EraseNvsPath(props) {


    const [posting, setPosting] = useState(false);
    const {countdown, isRebooting, startReboot } = useRebootCountdown();

    const eraseNVS = () => {
        setPosting(true);
        DataService.post("/erase_nvs", {})
            .then(resp => {
                console.log(resp.status);
                if (resp.status === "ok") {
                    setPosting(false);
                    startReboot();
                }
            })
            .catch(error => {
                console.error("Error al borrar NVS:", error);
            })
            .finally(() => {
                console.log("Borrado de NVS completado.");
            }
            );
    };


    return (
        <fieldset class="is-col">
            <legend>Borrar nvs</legend>
            <button
                class={`button primary ${posting ? "is-loading" : ""}`}
                onClick={eraseNVS}>
                <IUpload /> Erase NVS
            </button>
            {
                posting ? (
                    <div class="fetch-message">
                        <p>Borrando NVS...</p>
                    </div>
                ) : null
            }
            {isRebooting ? (
                <div class="reboot-message">
                    <p>El dispositivo se reiniciará en {countdown} segundos...</p>
                </div>
            ) : null}
        </fieldset>
    );

}
