import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import FullPage from "./Layout.FullPage";
import DataService from "../DataService";

export default function History({ nav }) {
    const [connectorId, setConnectorId] = useState(1);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchHistory = (id) => {
        setLoading(true);
        setError("");
        DataService.get(`/get_history?connector_id=${id}`)
            .then(data => {
                // Sort by timestamp descending
                if (Array.isArray(data)) {
                    data.sort((a, b) => b.ts - a.ts);
                    setHistory(data);
                } else {
                    setHistory([]);
                }
            })
            .catch(err => {
                console.error(err);
                setError("Error al cargar el historial");
                setHistory([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHistory(connectorId);
    }, [connectorId]);

    const formatTime = (ts) => {
        if (!ts || ts === 0) return "-";
        
        try {
            const date = new Date(ts * 1000);
            
            // Validate date is valid
            if (isNaN(date.getTime())) {
                console.error("Invalid timestamp:", ts);
                return "-";
            }
            
            // Format date manually for better control
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
            const hoursStr = String(hours).padStart(2, '0');
            
            return `${day}/${month}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
        } catch (error) {
            console.error("Error formatting time:", error, "ts:", ts);
            return "-";
        }
    };

    return (
        <FullPage>
            <div class="is-row is-items-middle is-stack-20">
                <div class="is-col">
                    <h2>Historial de Conectores</h2>
                </div>
                <div class="is-col is-text-right">
                    <button class="button is-secondary is-small" onClick={() => fetchHistory(connectorId)}>
                        Refrescar
                    </button>
                </div>
            </div>

            <div class="is-row is-stack-20">
                <div class="is-col">
                    <div class="buttons has-addons">
                        {[1, 2, 3, 4].map(id => (
                            <button
                                key={id}
                                class={`button ${connectorId === id ? 'is-primary' : 'is-outline'}`}
                                onClick={() => setConnectorId(id)}
                                style={{ marginRight: '5px' }}
                            >
                                Conector {id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && <div class="alert is-error">{error}</div>}

            <div class="is-row">
                <div class="is-col">
                    {loading ? <p>Cargando...</p> : (
                        <div class="is-table-container">
                            <table class="table is-striped is-hoverable is-fullwidth">
                                <thead>
                                    <tr>
                                        <th>Fecha/Hora</th>
                                        <th>Estado OCPP</th>
                                        <th>Máquina de Estados</th>
                                        <th>EV Conectado</th>
                                        <th>Modbus Online</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length > 0 ? history.map((entry, idx) => (
                                        <tr key={idx}>
                                            <td>{formatTime(entry.ts)}</td>
                                            <td>{entry.st}</td>
                                            <td>{entry.sm}</td>
                                            <td>{entry.ev ? 'Sí' : 'No'}</td>
                                            <td>{entry.mb ? 'Sí' : 'No'}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colspan="5">No hay datos</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </FullPage>
    );
}
