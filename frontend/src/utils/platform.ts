const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

export const isElectron = /Electron\//.test(ua)
export const isElectronMac = isElectron && /Mac OS X|Macintosh/.test(ua)
export const isElectronWin = isElectron && /Windows NT/.test(ua)
