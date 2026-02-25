// List of predefined hex colors
const predefinedColorsHex = [
    "#fffeb2", "#fffd7f", "#fff000", "#ffeab2", "#ffdc7f", "#ffce5a",
    "#ffdbdb", "#ffc8c8", "#ff8f92", "#d6eaff", "#c1e0ff", "#98cbff",
    "#ebffb1", "#deff81", "#87f2c0", "#f9deff", "#f3beff", "#ccc8f9",
    "#eb93ff", "#f2f3f4", "#e6e8ea"
];

/**
 * Finds the closest color from a predefined list to a given hex color.
 * @param {string} inputHexColor - The hex color string to compare (e.g., "#99ccff").
 * @param {string[]} colorListHex - An array of hex color strings to search through.
 * @returns {string|null} The closest hex color from the list, or null if input is invalid.
 */
export default (inputHexColor, colorListHex = predefinedColorsHex) => {
    const inputRgb = hexToRgb(inputHexColor);

    if (!inputRgb) {
        console.error("Invalid input hex color.");
        return null; // Return null if the input hex is invalid
    }

    let minDistance = Infinity;
    let closestColor = null;

    for (const targetHex of colorListHex) {
        const targetRgb = hexToRgb(targetHex);
        if (targetRgb) { // Only process valid hex colors from the list
            const distance = getColorDistance(inputRgb, targetRgb);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = targetHex;
            }
        }
    }
    return closestColor;
}

/**
 * Calculates the Euclidean distance between two RGB colors.
 * The distance in 3D color space (R, G, B) indicates how "close" two colors are.
 * @param {object} color1 - The first RGB color {r, g, b}.
 * @param {object} color2 - The second RGB color {r, g, b}.
 * @returns {number} The Euclidean distance.
 */
function getColorDistance(color1, color2) {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}



/**
 * Converts a hex color string to an RGB object.
 * @param {string} hex - The hex color string (e.g., "#RRGGBB" or "RRGGBB").
 * @returns {object|null} An object {r, g, b} or null if invalid hex.
 */
function hexToRgb(hex) {
    // Remove the '#' if present
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

    // Check if the hex string has 6 characters
    if (cleanHex.length !== 6) {
        console.error("Invalid hex color format. Expected 6 characters after #.");
        return null;
    }

    // Parse R, G, B values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Check for valid parsing (NaN if not a valid hex digit)
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        console.error("Invalid hex color digits.");
        return null;
    }

    return { r, g, b };
}