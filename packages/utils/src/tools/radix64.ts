const ENCODE_TYPE = {
    BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    BASE_URL: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
}

class Radix64 {
    // atob - /A too B/ A utility that does ASCII to binary conversion.
    // ASCII TO Binary (ASCII) Atmospheric engine.
    atob(str: string, type: keyof typeof ENCODE_TYPE = 'BASE_URL'): number {
        if (str.length === 1) {
            return this.decode(str, type)
        }

        const len = str.length
        const digit = ENCODE_TYPE[type].length
        let sum = 0
        let carry = 0
        for (let i = len - 1; i >= 0; i--) {
            const s = str[i]
            sum += this.decode(s, type) * Math.pow(digit, carry++)
        }

        return sum
    }

    // The reverse process is btoa. Acronyms.
    btoa(num: number, type: keyof typeof ENCODE_TYPE = 'BASE_URL'): string {
        const len = ENCODE_TYPE[type].length
        if (num < len) {
            return this.encode(num, type)
        }
        return '' + this.btoa(Math.floor(num / len), type) + this.encode(num & (len - 1), type)
    }

    private decode(str: string, type: keyof typeof ENCODE_TYPE): number {
        const data = ENCODE_TYPE[type].indexOf(str)
        return data
    }

    private encode(num: number, type: keyof typeof ENCODE_TYPE) {
        const n = num & (ENCODE_TYPE.BASE.length - 1)
        return ENCODE_TYPE[type][n]
    }
}

export const radix64 = new Radix64()
