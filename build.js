// C:\Users\sdkca\Desktop\electron-workspace\build.js
var electronInstaller = require('electron-winstaller');
// electron-packager . BeCare --overwrite --platform=darwin,win32,linux --arch=x64 --icon=icon/icon --prune=true
// In this case, we can use relative paths
var settings = {
    // Specify the folder where the built app is located
    appDirectory: './BeCare-win32-x64',
    // Specify the existing folder where 
    outputDirectory: './instalador',
    // The name of the Author of the app (the name of your company)
    authors: 'BRAIN',
    // The name of the executable of your built
    exe: './BeCare.exe',
    // the path to the icon
    // setupIcon: './img/smiling_YqW_icon.ico',
    // telling to not generate de msi package
    noMsi: true
};

resultPromise = electronInstaller.createWindowsInstaller(settings);

resultPromise.then(() => {
    console.log("The installers of your application were succesfully created !");
}, (e) => {
    console.log(`Well, sometimes you are not so lucky: ${e.message}`)
});