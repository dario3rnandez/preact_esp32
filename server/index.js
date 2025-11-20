const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 8000;

// Datos mock para OCPP
let ocpp_nvs_data_t = {
    ocpp_charger_id: "ME_CHARGER",
    server_ocpp_url: "ws://54.197.192.96:8080/steve/websocket/CentralSystemService",
    ocpp_auth_key: "OpenSesame"
};

let logger_nvs_data = {
    ip_logger: "192.168.0.2",
    port_logger: 8080
};

let network_nvs_data = {
    ip: "192.168.0.3",
    gateway: "192.168.0.1",
    netmask: "255.255.255.0"
};

const OTA_UPDATE_PENDING = 0;
const OTA_UPDATE_SUCCESSFUL = 1;
const OTA_UPDATE_FAILED = 2;

let OTA_status = {
    ota_update_status: OTA_UPDATE_PENDING,
    compile_date: "2024-11-19",
    compile_time: "15:00:00"
};

// Datos mock para conectores OCPP
let connectors = [
    {
        id: 0,
        status: "Available",
        errorCode: "NoError"
    },
    {
        id: 1,
        status: "Available",
        errorCode: "NoError"
    },
    {
        id: 2,
        status: "Available",
        errorCode: "NoError"
    }
];

// Datos mock para EVSE por conector
let evseData = {
    0: { status: "Available", errorCode: "NoError" },
    1: { status: "Available", errorCode: "NoError" },
    2: { status: "Available", errorCode: "NoError" }
};

// Datos mock para medidores por conector
let meterData = {
    0: { energy: 0, power: 0, current: 0, voltage: 0 },
    1: { energy: 0, power: 0, current: 0, voltage: 0 },
    2: { energy: 0, power: 0, current: 0, voltage: 0 }
};

// Datos mock para Smart Charging
let smartChargingData = {
    0: { limit: null, profile: null },
    1: { limit: null, profile: null },
    2: { limit: null, profile: null }
};

// Datos mock para transacciones
let transactionData = {
    0: { transactionId: null, idTag: null, startTime: null },
    1: { transactionId: null, idTag: null, startTime: null },
    2: { transactionId: null, idTag: null, startTime: null }
};



// esp_err_t http_server_OTA_status_handler(httpd_req_t *req)
// {
// 	char otaJSON[128];

// 	printDebug("OTA status requested\n");
// 	StaticJsonDocument<128> doc;
// 	doc["ota_update_status"] = g_fw_update_status;
// 	doc["compile_date"] = __DATE__;
// 	doc["compile_time"] = __TIME__;


// 	serializeJson(doc, otaJSON);
// 	httpd_resp_set_type(req, "application/json");
// 	httpd_resp_send(req, otaJSON, strlen(otaJSON));

// 	return ESP_OK;
// }


app.post('/OTAstatus', (req, res) => {

    console.log('POST /OTAstatus');
    console.log(req.body);
    res.send(OTA_status);
});
  




app.get('/get_network_data', (req, res) => {
    // Logic to handle GET request
    console.log('GET /get_network_data');
    res.send(network_nvs_data);
});

app.post('/post_network_data', (req, res) => {
    // Logic to handle POST request
    console.log('POST /post_network_data');
    console.log(req.body);
    network_nvs_data = req.body;
    res.send({ status: "ok" });
});

app.post('/erase_nvs', (req, res) => {
    // Logic to handle POST request
    console.log('POST /erase_nvs');
    // delay 20 seconds
    let start = new Date().getTime();
    let end = start;
    while(end < start + 20000) {
        end = new Date().getTime();
    }

    console.log(req.body);
    res.send({ status: "ok" });
});



app.get('/get_logger_data', (req, res) => {
    // Logic to handle GET request
    console.log('GET /get_logger_data');
    res.send(logger_nvs_data);
});

app.post('/post_logger_data', (req, res) => {
    // Logic to handle POST request
    console.log('POST /post_logger_data');
    console.log(req.body);
    logger_nvs_data = req.body;
    res.send({ status: "ok" });
});

app.get('/get_general_data', (req, res) => {
    // Logic to handle GET request
    console.log('GET /get_general_data');
    console.log(ocpp_nvs_data_t);
    res.send(ocpp_nvs_data_t);
});



app.post('/post_general_data', (req, res) => {
    // Logic to handle POST request
    console.log('POST /post_general_data');
    console.log(req.body);
    ocpp_nvs_data_t = req.body;
    res.send({ status: "ok" });
});

app.post('/reboot', (req, res) => {
    console.log('POST /reboot');
    console.log(req.body);
    res.send({ status: "ok" });
});

// Endpoint para obtener lista de conectores
app.get('/connectors', (req, res) => {
    console.log('GET /connectors');
    res.send(connectors);
});

// Endpoint para EVSE por conector
app.get('/connector/:id/evse', (req, res) => {
    const connectorId = parseInt(req.params.id);
    console.log(`GET /connector/${connectorId}/evse`);
    res.send(evseData[connectorId] || { status: "Unavailable", errorCode: "Unknown" });
});

app.post('/connector/:id/evse', (req, res) => {
    const connectorId = parseInt(req.params.id);
    console.log(`POST /connector/${connectorId}/evse`);
    console.log(req.body);
    evseData[connectorId] = req.body;
    res.send({ status: "ok" });
});

// Endpoint para medidor por conector
app.get('/connector/:id/meter', (req, res) => {
    const connectorId = parseInt(req.params.id);
    console.log(`GET /connector/${connectorId}/meter`);
    res.send(meterData[connectorId] || { energy: 0, power: 0, current: 0, voltage: 0 });
});

// Endpoint para Smart Charging por conector
app.get('/connector/:id/smartcharging', (req, res) => {
    const connectorId = parseInt(req.params.id);
    console.log(`GET /connector/${connectorId}/smartcharging`);
    res.send(smartChargingData[connectorId] || { limit: null, profile: null });
});

// Endpoint para transacción por conector
app.get('/connector/:id/transaction', (req, res) => {
    const connectorId = parseInt(req.params.id);
    console.log(`GET /connector/${connectorId}/transaction`);
    res.send(transactionData[connectorId] || { transactionId: null, idTag: null, startTime: null });
});

app.post('/connector/:id/transaction', (req, res) => {
    const connectorId = parseInt(req.params.id);
    console.log(`POST /connector/${connectorId}/transaction`);
    console.log(req.body);
    transactionData[connectorId] = req.body;
    res.send({ status: "ok" });
});

// Endpoint para OCPP Backend URL
app.get('/ocpp_backend', (req, res) => {
    console.log('GET /ocpp_backend');
    res.send({ url: ocpp_nvs_data_t.server_ocpp_url });
});

app.post('/ocpp_backend', (req, res) => {
    console.log('POST /ocpp_backend');
    console.log(req.body);
    if (req.body.url) {
        ocpp_nvs_data_t.server_ocpp_url = req.body.url;
    }
    res.send({ status: "ok" });
});

// Endpoint para estado EV
app.get('/status_ev', (req, res) => {
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId) : 0;
    console.log(`GET /status_ev?connectorId=${connectorId}`);
    res.send({ 
        connectorId: connectorId,
        status: "Available",
        plugged: false
    });
});

app.post('/status_ev', (req, res) => {
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId) : 0;
    console.log(`POST /status_ev?connectorId=${connectorId}`);
    console.log(req.body);
    res.send({ status: "ok" });
});

// Endpoint para estado EVSE
app.get('/status_evse', (req, res) => {
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId) : 0;
    console.log(`GET /status_evse?connectorId=${connectorId}`);
    res.send(evseData[connectorId] || { status: "Available", errorCode: "NoError" });
});

// Endpoint para autorización de usuario
app.post('/user_authorization', (req, res) => {
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId) : 0;
    console.log(`POST /user_authorization?connectorId=${connectorId}`);
    console.log(req.body);
    res.send({ status: "Accepted", idTag: req.body.idTag || "TEST_TAG" });
});

// Endpoint para certificados CA
app.get('/ca_cert', (req, res) => {
    console.log('GET /ca_cert');
    res.send({ certificate: "" });
});

app.post('/ca_cert', (req, res) => {
    console.log('POST /ca_cert');
    console.log(req.body);
    res.send({ status: "ok" });
});

// Endpoint para URL secundaria
app.post('/secondary_url', (req, res) => {
    console.log('POST /secondary_url');
    console.log(req.body);
    res.send({ status: "ok" });
});

// Endpoint para formatear partición MicroOCPP
app.post('/format_micro_ocpp', (req, res) => {
    console.log('POST /format_micro_ocpp');
    console.log(req.body);
    res.send({ status: "ok" });
});

// Endpoint para listar archivos en la partición
app.get('/list_partition_files', (req, res) => {
    console.log('GET /list_partition_files');
    // Mock de archivos en la partición
    const mockFiles = [
        {
            name: "ws-conn.jsn",
            size: 435,
            type: "file",
            modified: "1970-01-01 00:00:15"
        },
        {
            name: "client-state.jsn",
            size: 296,
            type: "file",
            modified: "1970-01-01 00:00:06"
        },
        {
            name: "reservations.jsn",
            size: 507,
            type: "file",
            modified: "1970-01-01 00:00:07"
        },
        {
            name: "bootstats.jsn",
            size: 55,
            type: "file",
            modified: "1970-01-01 00:11:57"
        }
    ];
    res.send({ 
        status: "ok", 
        files: mockFiles 
    });
});

app.get('/read_partition_file', (req, res) => {
    const filename = req.query.filename;
    console.log('GET /read_partition_file', filename);
    
    if (!filename) {
        return res.status(400).send({ status: "error", message: "Missing filename parameter" });
    }
    
    // Mock file contents based on filename
    const mockContents = {
        "ws-conn.jsn": JSON.stringify({ connection: "active", last_connected: "2024-01-01T10:00:00Z" }, null, 2),
        "client-state.jsn": JSON.stringify({ state: "idle", status: "ok" }, null, 2),
        "reservations.jsn": JSON.stringify({ reservations: [] }, null, 2),
        "bootstats.jsn": JSON.stringify({ boot_count: 42, last_boot: "2024-01-01T00:00:00Z" }, null, 2)
    };
    
    const content = mockContents[filename] || `Mock content for ${filename}\nThis is a test file.`;
    
    res.send({ 
        status: "ok", 
        content: content,
        filename: filename,
        size: content.length
    });
});

app.post('/write_partition_file', (req, res) => {
    const { filename, content } = req.body;
    console.log('POST /write_partition_file', filename, 'Content length:', content ? content.length : 0);
    
    if (!filename || content === undefined) {
        return res.status(400).send({ status: "error", message: "Missing filename or content" });
    }
    
    // In mock server, just return success
    console.log('Mock: File saved successfully');
    res.send({ status: "ok" });
});

app.listen(port, () => {
    console.log(`🚀 Mock server running on http://localhost:${port}`);
    console.log(`📡 Ready to emulate microocpp HTTP endpoints`);
});