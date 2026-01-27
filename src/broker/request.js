import Waiter from "./waiter.js";
import * as crypto from "crypto"

export default class Request extends Waiter{
    /**
     * @typedef { import("mqtt").IClientOptions } IClientOptions
     * @param {string} from 
     * @param {IClientOptions} options 
     */
    constructor(from, options) {
        super(from, options)
    }
    
    /**
     * @typedef { import("./_lib").RequestServices } RequestServices
     */
    
    /**
     * @template {keyof RequestServices} T
     * @param {any} msg 
     * @param {string} to 
     * @param {T} service 
     * @param  {RequestServices[T]} instructions 
     * @returns {string}
     */
    request(msg, to, service, ...instructions) {
        const msgid = crypto.randomUUID()
        const topic = [to, "REQ", this.from, service, ...instructions, msgid].join("/")
        this.client.publish(topic, JSON.stringify(msg))
        return msgid
    }
}