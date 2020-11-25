const { app, BrowserWindow, Menu, Tray } = require('electron');
const electron = require('electron');
const path = require('path');

var win = null;

app.disableHardwareAcceleration();



function createWindow () {
	var winObject = {
		width: 800,
		height: 480,
		frame: false,
		resizable: true,
		isFullScreenable: true,
		enableRemoteModule: true,
		skipTaskbar: true,
		webPreferences: {
			nodeIntegration: true,
			backgroundThrottling: false
		}
	};
	var displays = electron.screen.getAllDisplays();
	var secondaryDisplay = null;
	displays.forEach((display)=>{
		if(!secondaryDisplay)
			secondaryDisplay = display;
		if(secondaryDisplay.size.width*secondaryDisplay.size.height > display.size.width*display.size.height)
			secondaryDisplay = display;
		return;
	});

	if(secondaryDisplay && displays.length > 1)
	{
		winObject.width = secondaryDisplay.workArea.width;
		winObject.height = secondaryDisplay.workArea.height;
		winObject.x = secondaryDisplay.bounds.x;
		winObject.y = secondaryDisplay.bounds.y;
		winObject.fullscreen = true;
	}

	win = new BrowserWindow(winObject);
	win.setIcon(path.join(__dirname,'icon.png'));
	win.loadFile(path.join(__dirname,'index.html'));
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
	return;
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0)
		createWindow();
	return;
});