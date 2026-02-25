import Request from "./request.js";

export default class Response extends Request{
    /**
     * @typedef { import("mqtt").IClientOptions } IClientOptions
     * @param {string} from 
     * @param {IClientOptions} options 
     */
    constructor(from, options) {
        super(from, options)
    }

    /**
     * @typedef { import("./_lib").ResponseServices } ResponseServices
     */
     
    /**
     * @template {keyof ResponseServices} T
     * @param {any} msg 
     * @param {string} to 
     * @param {T} service 
     * @param  {ResponseServices[T]} instructions 
     */
    response(msg, to, service, ...instructions) {
        const topic = [to, "RES", this.from, service, ...instructions].join("/")
        this.client.publish(topic, JSON.stringify(msg))
    }
}