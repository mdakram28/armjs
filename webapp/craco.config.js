const { addBeforeLoader, loaderByName } = require('@craco/craco');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            const wasmExtensionRegExp = /\.wasm$/;
            webpackConfig.resolve.extensions.push('.wasm');

            console.log(webpackConfig.module.rules[1])


            const wasmLoader = {
                test: /\.wasm$/,
                // exclude: /node_modules/,
                // loader: 'wasm-loader'
                // use: ['wasm-loader'],
                type: `javascript/auto`,
                loader: `file-loader`,
            };

            webpackConfig.module.rules.forEach((rule) => {
                if (rule.oneOf) {
                    rule.oneOf.forEach((oneOf) => {
                        if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
                            console.log("Found file-loader", oneOf)
                            oneOf.exclude.push(wasmExtensionRegExp);
                        }
                    });
                    rule.oneOf.push(wasmLoader)
                }
            });

            // addBeforeLoader(webpackConfig, loaderByName('file-loader'), wasmLoader);

            return webpackConfig;
        },
    },
};