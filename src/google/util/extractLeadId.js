export default (texto, google) => {
    // Procura pelo padrão "Id do Lead:" seguido de números
    const map = {
        google: /<b>Id do Lead<\/b>\s*(\d+)/,
        calendly: /Id do Lead:\s*(\d+)/i
    }
    const match = texto.match(google? map.google : map.calendly);
    
    // Retorna o ID se encontrado, caso contrário retorna null
    return match ? match[1] : null;
}