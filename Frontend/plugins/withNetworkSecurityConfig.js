const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withNetworkSecurityConfig = (config) => {
  // 1. Create network_security_config.xml in res/xml/
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "xml"
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>`;
      fs.writeFileSync(
        path.join(xmlDir, "network_security_config.xml"),
        xmlContent
      );
      return config;
    },
  ]);

  // 2. Add attributes to <application> tag in AndroidManifest.xml
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    if (androidManifest.application?.[0]) {
      androidManifest.application[0].$["android:usesCleartextTraffic"] = "true";
      androidManifest.application[0].$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }
    return config;
  });
};

module.exports = withNetworkSecurityConfig;
