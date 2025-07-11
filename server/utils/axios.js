import axios from "axios";
import HttpsProxyAgent from "https-proxy-agent";

const proxy =
  process.env.https_proxy ||
  process.env.HTTPS_PROXY ||
  process.env.http_proxy ||
  process.env.HTTP_PROXY;

const config = {};

if (proxy) {
  console.log(`✅ Using network proxy: ${proxy}`);
  config.httpsAgent = new HttpsProxyAgent(proxy);
  config.proxy = false;
} else {
  console.log("✅ No network proxy detected. Using direct connection.");
}

export const axiosWithProxy = axios.create(config);
