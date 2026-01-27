export default class App{
    /**
     * @typedef { import("../kommo/index").default} KommoAPI
     * @typedef { import("../calendly/index").default} CalendlyAPI
     * @typedef { import("../repository/mongodb").default} Repository
     * @typedef { import("../domain/usecases/register").default} Register
     * @typedef { import("socket.io").Server} Server
     * @typedef { import("../broker/config").default} Broker
     * @param {KommoAPI} kommo 
     * @param {Repository} repository 
     * @param {Register} register 
     * @param {Server} io
     * @param {CalendlyAPI} calendly
     * @param {Broker} broker
     */
    constructor(kommo, repository, register, io, calendly, broker) {
        this.kommo = kommo
        this.repository = repository
        this.register = register
        this.io = io
        this.calendly = calendly
        this.broker = broker
    }
    
    sdrDoClassificador = {}
}