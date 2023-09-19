export function hasSpecialCharacters(str: string) {
    // eslint-disable-next-line no-useless-escape
    return /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str)
}

export function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email)
}

export function isValidPhoneNumber(phoneNumber: string) {
    return /^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]{8,14}$/g.test(phoneNumber)
}

export function isValidWebsite(website: string) {
    return /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9-_#]+\/?)*$/g.test(website)
}
