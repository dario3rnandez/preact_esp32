const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
app.use(cors());
const port = 8000;


ocpp_nvs_data_t = {
    ocpp_charger_id: "ME_CHARGER",
    server_ocpp_url: "ws://54.197.192.96:8080/steve/websocket/CentralSystemService",
    ocpp_auth_key: "OpenSesame"
};

logger_nvs_data = {
    ip_logger: "192.168.0.2",
    port_logger: 8080
};


network_nvs_data = {
    ip: "192.168.0.3",
    gateway: "192.168.0.1",
    netmask: "255.255.255.0"
};

const OTA_UPDATE_PENDING = 0
const OTA_UPDATE_SUCCESSFUL =  1
const OTA_UPDATE_FAILED = 1


OTA_status = {
    ota_update_status: OTA_UPDATE_PENDING,
    compile_date: "2021-09-20",
    compile_time: "10:00:00"
};

app.use(bodyParser.json());



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
    // Logic to handle POST request
    console.log('POST /reboot');
    console.log(req.body);
    res.send({ status: "ok" });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});