import { h, Component } from "preact";
import Logo from "./icons/me-corp.svg";

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: ""
        };
    }

    handleSubmit = (e) => {
        e.preventDefault();
        // Credenciales hardcodeadas para ejemplo
        if (this.state.username === "admin" && this.state.password === "ME_Smart_2025") {
            this.props.nav.setLoggedIn(true);
            this.props.nav.setPath("general_config");
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    }

    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    render() {
        return (
            <div class="content-box">
                <div class="all-center">
                    <Logo />
                </div>
                <h2>Inicio de Sesión</h2>
                <form onSubmit={this.handleSubmit}>
                    <div class="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            name="username"
                            class="form-control"
                            value={this.state.username}
                            onChange={this.handleChange}
                            placeholder="Usuario"
                        />
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            class="form-control"
                            value={this.state.password}
                            onChange={this.handleChange}
                            placeholder="Contraseña"
                        />
                    </div>
                    <div class="button-group">
                        <button type="submit" class="btn btn-primary">
                            Iniciar Sesión
                        </button>
                    </div>
                </form>
            </div>
        );
    }
} 