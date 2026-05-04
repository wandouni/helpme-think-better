'use strict'

module.exports = {
  packagerConfig: {
    name: 'AILearner',
    executableName: 'ai-learner',
    appBundleId: 'com.ailearner.app',
    appCategoryType: 'public.app-category.education',
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
        name: 'AILearner',
        setupExe: 'AILearner-Setup.exe',
      },
    },
  ],
}
