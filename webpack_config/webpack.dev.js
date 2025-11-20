const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common");
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

const variant = process.env.EVSE_VARIANT || (process.env.npm_config_variant && process.env.npm_config_variant.toUpperCase()) || "OCPP";
const envFile = variant ? `./.env.${variant.toLowerCase()}` : './.env.development';

const devConfig = {
    mode: "development",
    devtool: "inline-source-map",
    entry: "./src/index.js",
    output: {
        path: require("path").resolve(__dirname, "../dist"),
        filename: "main.js",
    },
    devServer: {
        port: 3000,
        historyApiFallback: true,
        proxy: {
            // Proxy todas las peticiones API al servidor mock
            '/get_general_data': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/post_general_data': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/get_logger_data': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/post_logger_data': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/get_network_data': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/post_network_data': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/reboot': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/erase_nvs': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/OTAstatus': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/connectors': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/connector': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/ocpp_backend': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/status_ev': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/status_evse': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/user_authorization': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/ca_cert': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/secondary_url': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
                   '/format_micro_ocpp': {
                       target: 'http://localhost:8000',
                       changeOrigin: true
                   },
                   '/list_partition_files': {
                       target: 'http://localhost:8000',
                       changeOrigin: true
                   },
        },
    },
    plugins:[
        new Dotenv({
			path: envFile,
            safe: false, // No fallar si el archivo no existe
            defaults: false
		}),
        new webpack.DefinePlugin({
            'process.env.EVSE_VARIANT': JSON.stringify(variant),
            'process.env.NODE_ENV': JSON.stringify('development')
        })
    ]
};
module.exports = merge(commonConfig, devConfig);