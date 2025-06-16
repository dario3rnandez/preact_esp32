import { h, Component, createContext  } from "preact";


import Sidebar from "./Layout.Sidebar.js";
import OtaUpdateConfig from "./Path.OtaUpdateConfig.js";
import Security from "./Path.Security.js";
import Header from "./Layout.Header.js";
import Status from "./Path.Status.js";
import GeneralConfig from "./Path.GeneralConfig.js";
import Station from "./Path.Station.js";
import Connectors from "./Path.Connectors.js";
import EraseNvs from "./Path.erase_nvs.js";
import FormatPartition from "./Path.format_partition.js";
import Restart from "./Path.restart.js";
import Login from "./Path.Login.js";

const Path = createContext()

export default class App extends Component {

    constructor() {
        super();
        this.state = {
            path : "general_config",
            isLoggedIn: false
        }
    }
    navigation(){
        return {
            setPath:(newPath)=>{
                this.setState({path:newPath});
            },
            setLoggedIn: (value) => {
                this.setState({isLoggedIn: value});
            },
            path:this.state.path,
            closeSidebarMobile:()=>{
                this.closeSidebarMobile()
            }
        }
    }

    currentView(){
        return this.view(this.state.path)
    }

    toggleSidebar(){
        document.querySelector(".sidebar").classList.toggle("show-mobile");
    }

    closeSidebarMobile(){
        document.querySelector(".sidebar").classList.remove("show-mobile");
    }

    view(path){
        switch(path){
            case "general_config":
                return (
                    <GeneralConfig nav={this.navigation()} />
                )
            case "certificates_config":
                return (
                    <Security nav={this.navigation()} />
                )
            case "network_config":
                return (
                    <Station nav={this.navigation()} />
                )
            case "connectors":
                return (
                    <Connectors nav={this.navigation()} />
                )
            case "ota_update":
                return (
                    <OtaUpdateConfig nav={this.navigation()} />
                )
            case "erase_nvs":
                return (
                    <EraseNvs nav={this.navigation()} />
                )
            case "format_partition":
                return (
                    <FormatPartition nav={this.navigation()} />
                )
            case "restart":
                return (
                    <Restart nav={this.navigation()} />
                )
            
        }  
    }

    render(){
        if (!this.state.isLoggedIn) {
            return (
                <div class="app">
                    <div class="header">
                        {/* <h1>Inicio de Sesión</h1> */}
                    </div>
                    <main class="login-container">
                        <Login nav={this.navigation()} />
                    </main>
                </div>
            )
        }

        return (
            <div class="app">
                <Header toggleSidebar={this.toggleSidebar}></Header>
                <Sidebar nav={this.navigation()}></Sidebar>
                <main>
                    {this.currentView()}
                </main>
            </div>
        )
    }
}