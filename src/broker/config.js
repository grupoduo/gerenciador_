import Response from "./response.js";

export default class Broker extends Response{
    /**
     * 
     * @param {string} from 
     */
    constructor(from) {
        super(from, {
            protocol: "mqtt",
            hostname: process.env.MQTT_HOSTNAME,
            port: process.env.MQTT_PORT,
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD
        })
    }
}