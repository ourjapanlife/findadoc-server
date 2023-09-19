export function hasSpecialCharacters(str: string) {
    // eslint-disable-next-line no-useless-escape
    return /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str)
}

export function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email)
}
