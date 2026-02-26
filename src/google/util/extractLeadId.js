export default (texto, google) => {
    if (!texto) return null;

    // Tenta todos os formatos conhecidos em ordem de especificidade:
    // 1. HTML com <b> (eventos criados via Calendly/automação)
    // 2. Texto puro com dois-pontos: "Id do Lead: 123"
    // 3. Texto puro sem dois-pontos: "Id do Lead 123"
    // 4. ID na linha seguinte: "Id do Lead\n123"
    const patterns = [
        /<b>Id do Lead<\/b>\s*(\d+)/,
        /Id do Lead:\s*(\d+)/i,
        /Id do Lead\s+(\d+)/i,
        /Id do Lead\s*\n\s*(\d+)/i,
    ]

    for (const pattern of patterns) {
        const match = texto.match(pattern)
        if (match) return match[1]
    }

    return null
}