import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import DataService from "../DataService";

export default function RebootCountdown() {
    const [countdown, setCountdown] = useState(30); // Contador de 30 segundos
    const [isRebooting, setIsRebooting] = useState(false); // Estado para controlar el reinicio

    // Función para iniciar el reinicio
    const startReboot = () => {
        setIsRebooting(true); // Activar el estado de reinicio
        setCountdown(30); // Reiniciar el contador

        // Hacer el POST a /reboot
        DataService.post("/reboot", {})
            .then(() => {
                console.log("Dispositivo reiniciándose...");
            })
            .catch((error) => {
                console.error("Error al reiniciar:", error);
            });
    };

    // Efecto para manejar el contador
    useEffect(() => {
        if (isRebooting && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown((prev) => prev - 1); // Reducir el contador
            }, 1000); // Cada segundo

            return () => clearTimeout(timer); // Limpiar el timer
        } else if (isRebooting && countdown === 0) {
            // Cuando el contador llegue a 0, refrescar la página
            window.location.reload();
        }
    }, [isRebooting, countdown]);

    return (
        <div class="reboot-countdown">
            {isRebooting ? (
                <div class="reboot-message">
                    <p>El dispositivo se reiniciará en {countdown} segundos...</p>
                </div>
            ) : (
                <button class="button is-warning" onClick={startReboot}>
                    Reiniciar Dispositivo
                </button>
            )}
        </div>
    );
}