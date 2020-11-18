const ws = require('windows-shortcuts');
var Positioner = require('electron-positioner')
const { Tray, app, BrowserWindow, ipcMain, Menu, Notification } = require('electron');
var os = require('os')
let win;
let tray;
const gotTheLock = app.requestSingleInstanceLock()
const electron = require('electron');
const squirrelUrl = "https://testebecare.s3.amazonaws.com";
var version = require('./package.json').version
var icon = `${os.homedir()}/AppData/Local/BeCare/app-${version}/resources/app/img/icon.png`
var AWS = require('aws-sdk')
var credentials = require('./credentials.json');
var CryptoJS = require("crypto-js");
var dateformat = require('dateformat')
var date = new Date()
var fs = require('fs')
let accessKey = credentials.accessKeyId
let secretAccessKey = credentials.secretAccessKey
let region = credentials.region
let tableName = credentials.secondTableName
var accessCript = CryptoJS.AES.decrypt(accessKey, 'secret key 123');
var secretCript = CryptoJS.AES.decrypt(secretAccessKey, 'secret key 123');
var regCrip = CryptoJS.AES.decrypt(region, 'secret key 123');
var tableCript = CryptoJS.AES.decrypt(tableName, 'secret key 123');
var access = accessCript.toString(CryptoJS.enc.Utf8);
var secret = secretCript.toString(CryptoJS.enc.Utf8);
var reg = regCrip.toString(CryptoJS.enc.Utf8);
var table = tableCript.toString(CryptoJS.enc.Utf8);
process.env.AWS_ACCESS_KEY_ID = access;
process.env.AWS_SECRET_ACCESS_KEY = secret;
process.env.AWS_REGION = reg;
var eid = ['diogo.araujo', 'geraldo.c.filho', 'marcio.montanheiro', 'fernando.a.oliveira']
var verif = eid.filter(e => (e == os.userInfo().username))
const frases = ['Já bebeu água hoje?', 'Ninguém caminha 10km sem dar o primeiro passo!'
  , 'Não se compare, você é único!', 'Coma uma fruta!', 'Tire 3 minutos para se alongar!',
  'Se não puder fazer tudo, faça tudo o que puder. Acredite em você!', 'Hora do cafézinho. Já tomou o seu hoje?']
let primeiraMensagem;
let segundaMensagem;

function gerarAleatorio() {
  return Math.floor(Math.random() * frases.length)
}

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
    electron.dialog.showMessageBox({ "message": "Auto updater error: " + error });
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
  // startAutoUpdater(squirrelUrl);
  checkBirth()
  primeiraMensagem = gerarAleatorio()
  segundaMensagem = gerarAleatorio()
  if (segundaMensagem == primeiraMensagem) {
    segundaMensagem = gerarAleatorio()
    if (segundaMensagem == primeiraMensagem) {
      segundaMensagem = gerarAleatorio()
    }
  }
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
      // devTools: false
    }
  })

  if (tray == null) {
    tray = new Tray(icon);
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
      if (verif.length) {
        var notificacao = new Notification({
          title: 'Be Care !',
          body: 'Tem cuidado do seu time? Veja como eles estão se sentindo.',
          icon: icon
        });
        notificacao.show()
        notificacao.on('click', () => {         // ao clicar na notificação, a janela abre
          console.log('Notificação clicada');
        });
      } else {
        var notificacao = new Notification({
          title: 'Be Care !',
          body: 'Como você está se sentindo hoje?',
          icon: icon
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
          body: frases[primeiraMensagem],
          icon: icon
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      } else if (str_hora == '15:0') {
        notificacao = new Notification({
          title: 'Be Care !',
          body: frases[segundaMensagem],
          icon: icon
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
          body: frases[primeiraMensagem],
          icon: icon
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      } else if (str_hora == '15:0') {
        notificacao = new Notification({
          title: 'Be Care !',
          body: frases[segundaMensagem],
          icon: icon
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
          body: frases[primeiraMensagem],
          icon: icon
        });
        notificacao.show()
        notificacao.on('click', () => {
          console.log('Notificação clicada');
          notificacao.close()
        });
      } else if (str_hora == '15:0') { // exibindo a notificação
        notificacao = new Notification({
          title: 'Be Care !',
          body: frases[segundaMensagem],
          icon: icon
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

async function checkBirth() {
  await timeOut(5000);
  while (true) {
    var data = new Date();
    var hora = data.getHours();
    var min = data.getMinutes();
    var str_hora = hora + ':' + min;
    const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: reg });

    if (str_hora == '16:10') { 

    async function loadAllResults() {
      var results = []
      var currentResults = await loadAdditionalResults()
      results = results.concat(currentResults.Items)
      while (currentResults.LastEvaluatedKey) {
        currentResults = await loadAdditionalResults(currentResults.LastEvaluatedKey)
        results = results.concat(currentResults.Items)
      }
      fs.writeFile(`${__dirname}/output.json`, JSON.stringify(results, null, 2), () => {
        console.log(results.length)
      })
      return results
    }

    async function loadAdditionalResults(start) {
      console.log("Loading more results...")
      var params = {
        TableName: table,
      }

      if (start) {
        params.ExclusiveStartKey = start
      }

      return new Promise((resolve, reject) => {
        dynamoDb.scan(params, (error, result) => {
          if (error) {
            console.log(error);
            reject(error)
          } else if (result) {
            resolve(result)
          } else {
            reject("Unknown error")
          }
        })
      })
    }
    async function main() {
      let results = await loadAllResults()
    }
    main()

    setTimeout(() => {
      var funcionarios = require(`${__dirname}/output.json`)
      var dataHoje = dateformat(date, 'd/mm')
      for (let i in funcionarios) {
        if (funcionarios[i].aniversario == dataHoje) {
          if (funcionarios[i].eid == os.userInfo().username) {
            var notification = new Notification({
              title: "Parabéns!",
              body: `Hoje é o seu aniversário ${funcionarios[i].eid}! O be.care te deseja parabéns!`,
              icon: icon
            });
            notification.show()
          } else if (funcionarios[i].eid != os.userInfo().username) {
            notification = new Notification({
              title: "Parabéns!",
              body: `Hoje é o aniversário de ${funcionarios[i].eid} dê a ele os parabéns!`,
              icon: icon
            })
            notification.show()
          }
        }
      }
    }, 15000)
  }
    await timeOut(60000);
  }
}
ipcMain.on('hide', () => {  // quando a resposta é submetida, a janela é "limpada" e escondida
  win.hide()
  // win.reload()
  var notificacao = new Notification({  // implementação futura: dinamizar essa notificação
    title: 'Pronto !',
    body: 'Estou sempre aqui pra te ouvir. Conte comigo.',
    icon: icon
  });
  notificacao.show()
})

ipcMain.on('done', () => {  // quando a resposta é submetida, a janela é "limpada" e escondida
  // win.reload()
  var notificacao = new Notification({  // implementação futura: dinamizar essa notificação
    title: 'Pronto !',
    body: 'Suas informações foram armazenadas!',
    icon: icon
  });
  notificacao.show()
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
