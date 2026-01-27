export default class Register {
    constructor(repository) {
        this.repository = repository
    }

    make(lead, origin) {
        this.repository.create("Registros", {
            origin,
            date: new Date(),
            lead,
        })
    }
}