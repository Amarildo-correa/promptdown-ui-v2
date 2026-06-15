/**
 * Trunca `text` para no máximo `maxLength` caracteres,
 * respeitando fronteiras de palavra e adicionando '…' se necessário.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength) {
    if (typeof text !== "string") return "";
    if (text.length <= maxLength) return text;

    const slice = text.slice(0, maxLength);
    const lastSpace = slice.search(/\s\S*$/);
    const cut = lastSpace > 0 ? lastSpace : maxLength;

    return slice.slice(0, cut).trimEnd() + "…";
}
