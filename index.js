const ws = require('windows-shortcuts');
var Positioner = require('electron-positioner')
const { Tray, app, BrowserWindow, ipcMain, Menu, Notification } = require('electron');
var os = require('os')
var path = os.homedir() + `/AppData/Local/BeCare`
var version = require('./package.json').version
let win;
let tray;
const gotTheLock = app.requestSingleInstanceLock()
const electron = require('electron');
const squirrelUrl = "https://instaladorbecare.s3.amazonaws.com";
var eid = ['diogo.araujo' ,'geraldo.c.filho','marcio.montanheiro','fernando.a.oliveira']
var verif = eid.filter(e => (e == os.userInfo().username))

const startAutoUpdater = (squirrelUrl) => {
  electron.autoUpdater.setFeedURL(`${squirrelUrl}/brain/`);
  electron.autoUpdater.addListener("update-downloaded", (event, releaseNotes, releaseName) => {
      const options = {
        type: 'info',
        title: 'Nova versão disponível!',
        message: `A versão ${releaseName} do Be.Care foi instalada!`
      }
    electron.autoUpdater.quitAndInstall()
    electron.dialog.showMessageBox(options);
  });

  electron.autoUpdater.addListener("error", (error) => {
    electron.dialog.showMessageBox({"message": "Auto updater error: " + error});
  });
  electron.autoUpdater.checkForUpdates();
}

const handleSquirrelEvent = () => {
  if (process.argv.length === 1) {
    return false;
  }

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
    case '--squirrel-uninstall':
      setTimeout(app.quit, 1000);
      return true;
      
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
}

if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

if (!gotTheLock) {  // métodos que impedem a existência de múltiplas instâncias
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  });
}

app.setLoginItemSettings({  // configurando para abrir o be care no boot do PC
  openAtLogin: true
})

const contextMenu = Menu.buildFromTemplate([  // configurando menu que aparece ao clicar com o botao direito no tray icon
  {
    label: 'Abrir',
    click: () => {
      console.log(win)
      win.show();
    }
  },
  {
    label: 'Sair',
    click: () => {
      app.quit();
    }
  }
]);

app.on('ready', () => { // primeiro evento do app
  const { screen } = require('electron')
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  createWindow(height);
  winPosition();
  checkShowWindow();
  sendNotify();
  startAutoUpdater(squirrelUrl)
  if (process.env.NODE_ENV !== "production" && process.platform === 'win32') {
    ws.create("%APPDATA%/Microsoft/Windows/Start Menu/Programs/BeCare.lnk", process.execPath);
    app.setAppUserModelId(process.execPath);
  }
  win.on('closed', () => {
    createWindow(height);
    winPosition();
    checkShowWindow();
    sendNotify();
  })
});

function createWindow(height) {

  win = new BrowserWindow({
    width: 420,
    height: height,
    frame: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: false
    }
  })

  if (tray == null) {
    tray = new Tray(`${path}/app-${version}/resources/app/img/icon.png`);
    tray.on('click', () => {
      win.show();
    })
    tray.setContextMenu(contextMenu);
  }

  if (process.platform === 'darwin') {
    tray.setTitle('Como você está se sentindo hoje?');
  } else {
    tray.setToolTip('Como você está se sentindo hoje?');
  }

  win.loadFile('index.html')
}

function winPosition() {
  var positioner = new Positioner(win);

  if (process.platform === 'win32') {
    positioner.move('bottomRight');
  } else {
    positioner.move('topRight');
  }
}

function timeOut(miliseconds) {
  return new Promise((resolve, reject) => { setTimeout(resolve, miliseconds); });
}

async function checkShowWindow() {

  await timeOut(3000);


  while (true) {
    var data = new Date();
    var hora = data.getHours();
    var min = data.getMinutes();
    var str_hora = hora + ':' + min;

    if (str_hora === '11:0' || str_hora === '16:0') { // exibindo a notificação
      if(verif.length) {
        var notificacao = new Notification({
          title: 'Be Care !',
          body: 'Já olhou o PBI hoje?',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {         // ao clicar na notificação, a janela abre
          console.log('Notificação clicada');
          win.show();
        });
      } else {
        var notificacao = new Notification({
          title: 'Be Care !',
          body: 'Como você está se sentindo hoje?',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {         // ao clicar na notificação, a janela abre
          console.log('Notificação clicada');
          win.show();
        });
      }     
    }
    await timeOut(60000);
  }
}

async function sendNotify() {
  await timeOut(5000);
  while (true) {
    var data = new Date();
    var dia = data.getDay();
    var hora = data.getHours();
    var min = data.getMinutes();
    var str_hora = hora + ':' + min;

    if (dia === 1) {
      if (str_hora == '10:0') {  
          var notificacao = new Notification({
          title: 'Be Care !',
          body: 'Já bebeu água hoje?',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      } else if (str_hora == '15:0') {
          notificacao = new Notification({
          title: 'Be Care !',
          body: 'Ninguém caminha 10km sem dar o primeiro passo!',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      }
    } else if (dia === 3) {
      if (str_hora == '10:0') {
          notificacao = new Notification({
          title: 'Be Care !',
          body: 'Não se compare, você é único!',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      } else if (str_hora == '15:0') {
          notificacao = new Notification({
          title: 'Be Care !',
          body: 'Coma uma fruta!',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      }
    } else if (dia === 5) {
      if (str_hora == '10:0') { // exibindo a notificação
          notificacao = new Notification({
          title: 'Be Care !',
          body: 'Tire 3 minutos para se alongar!',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      } else if (str_hora == '15:0') { // exibindo a notificação
          notificacao = new Notification({
          title: 'Be Care !',
          body: 'Se não puder fazer tudo, faça tudo o que puder. Acredite em você!',
          icon: `${path}/app-${version}/resources/app/img/icon.png`
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      }
     } 
    await timeOut(60000);
  }
}

ipcMain.on('hide', () => {  // quando a resposta é submetida, a janela é "limpada" e escondida
  win.hide()
  // win.reload()
  var notificacao = new Notification({  // implementação futura: dinamizar essa notificação
    title: 'Pronto !',
    body: 'Sua resposta foi enviada com sucesso',
    icon: `${path}/app-${version}/resources/app/img/icon.png`
  });
  notificacao.show()
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
