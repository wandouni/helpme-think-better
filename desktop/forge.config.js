'use strict'

module.exports = {
  packagerConfig: {
    name: 'Lumio',
    executableName: 'lumio',
    appBundleId: 'com.lumio.app',
    appCategoryType: 'public.app-category.education',
    extraResource: ['../backend/dist/server'],
    darwinDarkModeSupport: false,
    icon: './assets/icon',   // .icns on macOS, .ico on Windows (no extension needed)
  },
  rebuildConfig: {},
  makers: [
    // macOS: portable zip (appdmg avoided — needs native node-gyp)
    // The build script wraps this into a proper .dmg via hdiutil.
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    // Windows: Squirrel installer
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'Lumio',
        setupExe: 'Lumio-Setup.exe',
        authors: 'Lumio',
        description: '文档快速学习与思维导图工具',
      },
    },
  ],
}
