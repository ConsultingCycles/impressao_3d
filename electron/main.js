const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Custo3D",
    // Tenta pegar o ícone
    icon: path.join(__dirname, '../public/assets/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Permite carregar recursos locais sem bloqueio
    },
  });

  win.setMenuBarVisibility(false);

  // --- MUDANÇA: FORÇANDO O ENDEREÇO DE DESENVOLVIMENTO ---
  // Como estamos rodando 'npm run electron:dev', o Vite SEMPRE estará nessa porta.
  const devUrl = 'http://localhost:5173';

  console.log(`Tentando carregar: ${devUrl}`);
  
  win.loadURL(devUrl).catch((err) => {
    console.error("Erro ao carregar URL do Vite:", err);
    // Só tenta carregar o arquivo se a URL falhar muito
    win.loadFile(path.resolve(__dirname, '../dist/index.html'));
  });

  // Abre o console de erros (F12) automaticamente para debug
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});