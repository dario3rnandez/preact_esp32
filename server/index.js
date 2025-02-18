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





app.use(bodyParser.json());

app.get('/get_general_data', (req, res) => {
    // Logic to handle GET request
    console.log('GET /get_general_data');
    res.send(ocpp_nvs_data_t);
});



app.post('/post_general_data', (req, res) => {
    // Logic to handle POST request
    console.log('POST /post_general_data');
    console.log(req.body);
    ocpp_nvs_data_t = req.body;
    res.send({ status: "ok" });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});