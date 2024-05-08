
export function validateAll(input, validations)
{
    for (let i = 0; i < validations.length; ++i) {
        if (!validations[i].run(input)) {
            return validations[i].message;
        }
    }
    return null;
}

export function validateRequired(string) {
    return string.length > 0;
}

export function validateIsUrl(string) {
    return string.includes('https://') || string.includes('http://');
}

export function validateLength(string, min, max) {
    return string.length >= min && string.length < max;
}

