import { API_ROOT, NODE_ENV } from "./constants"

class DataServiceClass {
    constructor(){
        this.apiRoot = API_ROOT;
    }

    async post(endpoint, body) {
        let options = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body:JSON.stringify(body)
        };
        return this.request(endpoint, options);
    }

    async get(endpoint) {
        let options = {
            method: "GET"
        };
        return this.request(endpoint, options);
    }
    
    async request(endpoint, options) {
        let url = this.apiRoot + endpoint;
        let response;
        try{
            if(NODE_ENV === "development"){
                console.log("Fetch - Options: ", options);
            }
            response = await fetch(url, options);
            
            // Parse JSON response (even if HTTP status is not ok, backend may return JSON with error details)
            let response_raw, response_json;
            try{
                response_raw = await response.text();
                response_json = JSON.parse(response_raw);
            }catch(error){
                console.error("Could not parse api response as JSON", `Response: ${response_raw}`);
                // If we can't parse JSON and response is not ok, throw HTTP error
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${response_raw}`);
                }
                throw error;
            }
            
            // Check if response is ok - but still return JSON if it has error details
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}, body:`, response_json);
                // If JSON has error status, return it so caller can handle it
                if (response_json.status === "error") {
                    return response_json;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            if(NODE_ENV === "development"){
                console.log("Response: ", response_json);
            }
            return response_json;
        }catch(error){
            console.error("The api request could not complete successfully", `URL: ${url}`, error);
            throw error;
        }
    }
}

const DataService = new DataServiceClass();

export default DataService;