'use strict';
const path=require('node:path');
const {app,BrowserWindow,Menu,shell,session}=require('electron');
const policy=require('./security.cjs');
app.enableSandbox();
app.setAppUserModelId('io.github.liradion.linkedbylight.m5preview');
const gameUrl=policy.resolveGameUrl(process.env,app.isPackaged);
let mainWindow=null;
function openGame(){
 if(!mainWindow||mainWindow.isDestroyed())return;
 void mainWindow.loadURL(gameUrl).catch(()=>{
  if(!mainWindow?.isDestroyed())void mainWindow.loadFile(path.join(__dirname,'offline.html'));
 });
}
function createWindow(){
 const win=new BrowserWindow({
  title:'Linked by Light · M5 Internal Preview',
  width:1260,height:810,minWidth:860,minHeight:580,
  show:false,backgroundColor:'#080b19',autoHideMenuBar:false,
  webPreferences:{
   nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,
   allowRunningInsecureContent:false,webviewTag:false,
   devTools:!app.isPackaged
  }
 });
 mainWindow=win;
 win.webContents.on('will-attach-webview',event=>event.preventDefault());
 win.webContents.setWindowOpenHandler(({url})=>{
  if(policy.externalPolicyPage(url,gameUrl))void shell.openExternal(url).catch(()=>{});
  return {action:'deny'};
 });
 win.webContents.on('will-navigate',(event,url)=>{
  // The local offline screen may be replaced only by a validated game origin.
  if(!policy.allowedNavigation(url,gameUrl))event.preventDefault();
 });
 win.webContents.session.setPermissionRequestHandler((contents,permission,respond)=>{
  respond(policy.allowedPermission(permission,contents.getURL(),gameUrl));
 });
 win.webContents.session.setPermissionCheckHandler((contents,permission,requestingOrigin)=>{
  return policy.allowedPermission(permission,requestingOrigin,gameUrl);
 });
 win.webContents.on('did-fail-load',(_event,code,_description,validatedUrl,isMainFrame)=>{
  if(code===-3||!isMainFrame||!policy.sameOrigin(validatedUrl,gameUrl))return;
  if(!win.isDestroyed())void win.loadFile(path.join(__dirname,'offline.html')).catch(()=>{});
 });
 win.once('ready-to-show',()=>{if(!win.isDestroyed())win.show();});
 // Keep the native app usable even if free hosting is asleep or offline.
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:'Game',submenu:[
   {label:'Reconnect / Повторить',accelerator:'Ctrl+R',click:openGame},
   {label:'Fullscreen / На весь экран',accelerator:'F11',click:()=>win.setFullScreen(!win.isFullScreen())},
   {type:'separator'},{role:'quit'}
  ]},
  {label:'View',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'}]}
 ]));
 openGame();
}
app.whenReady().then(()=>{
 // No screen capture, camera, microphone, geolocation or other Chromium grants.
 session.defaultSession.setPermissionRequestHandler((contents,permission,respond)=>{
  respond(policy.allowedPermission(permission,contents.getURL(),gameUrl));
 });
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
