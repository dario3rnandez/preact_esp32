const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const path = require('path');

const Dotenv = require('dotenv-webpack');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require('webpack');

const variant = process.env.EVSE_VARIANT || (process.env.npm_config_variant && process.env.npm_config_variant.toUpperCase()) || "OCPP";
const envFile = variant ? `./.env.${variant.toLowerCase()}` : './.env.production';

const prodConfig = {
    mode: "production",
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "../dist"),
        filename: "main.js",
    },
    optimization: {
        minimizer: [
            '...',
            new CssMinimizerPlugin()
        ],
    },
    module:{
        rules:[
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader,"css-loader"],
            },
        ]
    },
    plugins:[
        new Dotenv({
			path: envFile,
            safe: false, // No fallar si el archivo no existe
            defaults: false
		}),
        new MiniCssExtractPlugin({
            filename: "main.css"
        }),
        new webpack.DefinePlugin({
            'process.env.EVSE_VARIANT': JSON.stringify(variant),
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ]
};
module.exports = merge(commonConfig, prodConfig);