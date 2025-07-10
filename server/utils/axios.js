import axios from "axios";
import HttpsProxyAgent from "https-proxy-agent";

// Find the proxy URL from the standard environment variables.
const proxy =
  process.env.https_proxy ||
  process.env.HTTPS_PROXY ||
  process.env.http_proxy ||
  process.env.HTTP_PROXY;

// Create a configuration object for axios.
const config = {};

// If a proxy URL was found, create a new proxy agent and add it to the config.
if (proxy) {
  console.log(`✅ Using network proxy: ${proxy}`);
  config.httpsAgent = new HttpsProxyAgent(proxy);
  config.proxy = false; // Prevent axios from trying its own proxy logic
} else {
  console.log("✅ No network proxy detected. Using direct connection.");
}

// Create the final axios instance with our custom config.
export const axiosWithProxy = axios.create(config);
