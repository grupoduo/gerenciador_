import { connect } from "mqtt"

export default class Waiter {
    /**
     * @typedef { import("mqtt").MqttClient } MqttClient
     * @type {MqttClient}
     */
    client

    /**
     * @type {{[key: string]: (result: any)=> void}}
     */
    waitList = {}

    /**
     * @typedef { import("mqtt").IClientOptions } IClientOptions
     * @param {string} from 
     * @param {IClientOptions} options 
     */
    constructor(from, options) {
        this.from = from
        this.client = connect(options)
        this.client.on("connect", () => {
           console.log(`Connected`)
        })
    }

    /**
     * 
     * @param {any} msgid 
     * @param {?any} time 
     * @returns {Promise<[any, boolean]>}
     */
    wait(msgid, time) {
        return new Promise(res => {
            this.waitList[msgid] = (result) => {
                delete this.waitList[msgid]
                res([result, false])
            }
            if (time) setTimeout(() => {
                delete this.waitList[msgid]
                res([{}, true])
            }, time)
        })
    }
}