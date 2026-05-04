'use strict'

module.exports = {
  packagerConfig: {
    name: 'PolicyMindmap',
    executableName: 'policy-mindmap',
    appBundleId: 'com.policy.mindmap',
    appCategoryType: 'public.app-category.productivity',
    // Backend binary directory (built by PyInstaller --onedir)
    extraResource: ['../backend/dist/server'],
    darwinDarkModeSupport: false,
    // icon: './assets/icon'  // uncomment and add icon.icns / icon.ico
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
        name: 'PolicyMindmap',
        setupExe: 'PolicyMindmap-Setup.exe',
      },
    },
  ],
}
