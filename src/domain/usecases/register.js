export default class Register {
    constructor(repository) {
        this.repository = repository
    }

    make(lead, origin) {
        try {
            this.repository.create("Registros", {
                origin,
                date: new Date(),
                lead,
            })
        } catch (error) {
            console.error("ERRO ao registrar auditoria:", origin, error.message)
        }
    }
}
