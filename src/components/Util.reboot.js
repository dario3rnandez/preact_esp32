import { useState, useEffect } from "preact/hooks";
import DataService from "../DataService";

export function useRebootCountdown() {
    const [countdown, setCountdown] = useState(0); // Contador inicializado en 0
    const [isRebooting, setIsRebooting] = useState(false); // Estado de reinicio

    // Función para iniciar el reinicio
    const startReboot = () => {
        setIsRebooting(true); // Activar el estado de reinicio
        setCountdown(30); // Iniciar el contador en 30 segundos

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

    return {
        countdown,
        isRebooting,
        startReboot,
    };
}