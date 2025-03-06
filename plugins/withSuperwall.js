const { withInfoPlist } = require('@expo/config-plugins');

const withSuperwall = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.SKPaymentQueue = true;
    config.modResults.NSSuperwallAPIKey = process.env.EXPO_PUBLIC_SUPERWALL_IOS_KEY;
    
    return config;
  });
};

module.exports = withSuperwall; 