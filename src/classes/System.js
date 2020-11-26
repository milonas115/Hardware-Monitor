import HWInfoClient from './HWInfoClient';
import OpenRGBClient from './OpenRGBClient';
import Vue from 'vue';
import Store from 'electron-store';
import { clone, between } from '@/utils.js';
import beep from '@/modules/beep.js';
import { changeHue, rgbToHSL } from '@/colors.js';
import fs from 'fs';
import { remote } from 'electron';

const store = new Store();

class System extends Vue
{
	constructor(config){
		super(Object.assign(config,{
			extends: {
				data(){
					let data = {
						beep: beep.repeat(),
						views: {
							hardware: 'Hardware Monitor',
							rgb: 'RGB Sync',
							settings: 'Settings'
						},
						currentView: store.get('currentView','hardware'),
						status: {
							hardware: false,
							rgb: false
						},
						enabled: {
							hardware: store.get('settings.hardwareEnabled',true),
							rgb: store.get('settings.rgbEnabled',true),
						},
						config: {
							hardware: {
								ip: store.get('settings.config.hardware.ip','127.0.0.1'),
								port: store.get('settings.config.hardware.port',27007)
							},
							rgb: {
								ip: store.get('settings.config.rgb.ip','127.0.0.1'),
								port: store.get('settings.config.rgb.port',6742)
							}
						},
						colors: store.get('settings.colors',[
							'#ffffff',
							'#ff0000',
							'#ff7f00',
							'#ffff00',
							'#00ff00',
							'#0000ff',
							'#4b0082',
							'#000000'
						]),
						hardwareClient: new HWInfoClient(),
						hardwareSections: null,
						hardwareWidgets: store.get('hardwareWidgets') || [],
						hardwareLevels: {
							0: {
								color: store.get('settings.hardwareLevels.0.color', '#0d6dd3'),
								peak: store.get('settings.hardwareLevels.0.peak', 0.20),
								rgb: store.get('settings.hardwareLevels.0.rgb', {red:0,green:0,blue:255})
							},
							1: {
								color: store.get('settings.hardwareLevels.1.color', '#0fcf6f'),
								peak: store.get('settings.hardwareLevels.1.peak', 0.50),
								rgb: store.get('settings.hardwareLevels.1.rgb', {red:0,green:255,blue:0})
							},
							2: {
								color: store.get('settings.hardwareLevels.2.color', '#ffd000'),
								peak: store.get('settings.hardwareLevels.2.peak', 0.75),
								rgb: store.get('settings.hardwareLevels.2.rgb', {red:255,green:165,blue:0})
							},
							3: {
								color: store.get('settings.hardwareLevels.3.color', '#f03c28'),
								peak: store.get('settings.hardwareLevels.3.peak', 1.00),
								rgb: store.get('settings.hardwareLevels.3.rgb', {red:255,green:0,blue:0})
							}
						},
						rgbClient: new OpenRGBClient(),
						rgbDevices: null,
						rgbWidgets: store.get('rgbWidgets') || [],
						previewRGBColorActive: false,
						previewRGBColorTimeout: false
					};

					if(!data.enabled.hardware)
					{
						data.currentView = 'rgb';
						data.currentViewTitle = 'RGB Sync';
					}

					if(!data.enabled.hardware && !data.enabled.rgb)
					{
						data.currentView = 'settings';
						data.currentViewTitle = 'Settings';
					}

					return data;
				},
				watch: {
					currentView(){
						return store.set('currentView',this.currentView);
					},
					enabled: {
						deep: true,
						handler(){
							store.set('settings.hardwareEnabled',this.enabled.hardware);
							store.set('settings.rgbEnabled',this.enabled.rgb);

							if(!this.enabled.hardware)
								this.disconnectHardwareClient();
							else 
								this.connectHardwareClient();

							if(!this.enabled.rgb)
								this.disconnectRgbClient();
							else 
								this.connectRgbClient();
							
							return;
						}
					},
					hardwareLevels: {
						deep: true,
						handler(){
							for(let i=0;i<=3;i++)
							{
								store.set('settings.hardwareLevels.'+i+'.color',this.hardwareLevels[i].color);
								store.set('settings.hardwareLevels.'+i+'.peak',this.hardwareLevels[i].peak);
								store.set('settings.hardwareLevels.'+i+'.rgb',this.hardwareLevels[i].rgb);
							}
							return;
						}
					},
					config: {
						deep: true,
						handler(){
							store.set('settings.config.hardware.ip',this.config.hardware.ip);
							store.set('settings.config.hardware.port',this.config.hardware.port);
							store.set('settings.config.rgb.ip',this.config.rgb.ip);
							store.set('settings.config.rgb.port',this.config.rgb.port);

							return;
						}
					},
					colors: {
						deep: true,
						handler(){
							store.set('settings.colors',this.colors)
						}
					},
					hardwareWidgets: {
						deep: true,
						handler(){
							let widgets = clone(this.hardwareWidgets).map((widget)=>Object.assign(widget,{history:[],data:null}));
							store.set('hardwareWidgets',widgets);
							return;
						}
					},
					hardwareSections: {
						immediate: true,
						handler(){
							this.updateHardwareWidgets();
							this.updateRgbSync();
							this.updateHardwareWidgetAlerts();
							return;
						}
					},
					rgbWidgets: {
						deep: true,
						immediate: true,
						handler(){
							let widgets = clone(this.rgbWidgets);
							store.set('rgbWidgets',widgets);
							this.updateRgbSync();
							return;
						}
					}
				},
				computed: {
					currentViewTitle(){
						return this.views[this.currentView];
					},
					colorsParsed(){
						let colors = [];
						this.colors.forEach((color)=>{
							color = color.toLowerCase().trim();
							if(color.indexOf('#') === 0)
								return colors.push(color);
							if(color.indexOf('rgb') !== 0) return;
							let match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
							if(!match) return;
							color = '#' + (parseInt(match[1]).toString(16).padStart(2,'0')) + (parseInt(match[2]).toString(16).padStart(2,'0')) + (parseInt(match[3]).toString(16).padStart(2,'0'));
							color = color.toLowerCase();
							return colors.push(color);
						});
						return colors;
					}
				},
				created(){
					this.connectHardwareClient();
					this.connectRgbClient();
					this.createHardwareWidgets();
					this.updateHardwareWidgetsHistory();
					this.createRgbWidgets();
					this.updateRgbSync();
				},
				methods: {
					setCurrentView(name) {
						this.currentView = name;
						return;
					},
					connectHardwareClient(){
						if(!this.enabled.hardware) return;
						if(this.hardwareClient) this.hardwareClient.stop();
						this.hardwareClient.ip = this.config.hardware.ip;
						this.hardwareClient.port = this.config.hardware.port;
						this.hardwareClient.connectAndFetch(1000,(sections)=>{
							this.status.hardware = true;
							this.hardwareSections = sections;
							return;
						});
						this.hardwareClient.onChange(()=>{
							this.status.hardware = this.hardwareClient.connected;
							return;
						});
					},
					disconnectHardwareClient(){
						if(this.hardwareClient) this.hardwareClient.stop();
						this.status.hardware = false;
						return;
					},
					connectRgbClient(){
						if(!this.enabled.rgb) return;
						if(this.rgbClient) this.rgbClient.stop();
						this.rgbClient.ip = this.config.rgb.ip;
						this.rgbClient.port = this.config.rgb.port;
						this.rgbClient.connect(()=>{
							this.status.rgb = true;
							this.rgbDevices = this.rgbClient.devices;
						});
						this.rgbClient.onChange(()=>{
							this.status.rgb = this.rgbClient.connected;
							return;
						});
					},
					disconnectRgbClient(){
						if(this.rgbClient) this.rgbClient.stop();
						this.status.rgb = false;
						return;
					},
					createHardwareWidgets(){
						let defaultWidget = {
							text: '',
							section: '',
							sensor: '',
							min: 0,
							max: 100,
							data: null,
							reverse: 0,
							alert: '',
							history: []
						};
						while(this.hardwareWidgets.length < 8)
							this.hardwareWidgets.push({});
						this.hardwareWidgets.forEach((widget)=>{
							for(let x in defaultWidget)
							{
								if(typeof widget[x] === 'undefined')
									widget[x] = clone(defaultWidget[x]);
							}
						});
						return;
					},
					updateHardwareWidgets(){
						this.hardwareWidgets.forEach((widget)=>{
							if(widget.section && widget.sensor)
								widget.data = this.hardwareClient.find(widget.section,widget.sensor);
							else 
								widget.data = null;

							if(widget.data)
							{
								let before = widget.data.cur - widget.min;
								let after = widget.max - widget.data.cur;
								widget.data.ratio = before / (before + after);
								widget.data.ratio = Math.max(0,widget.data.ratio);
								widget.data.ratio = Math.min(1,widget.data.ratio);
								let ratio = widget.data.ratio;
								if(widget.reverse) ratio = 1-ratio;
								for(let level in this.hardwareLevels)
								{
									let hardwareLevel = this.hardwareLevels[level];
									if(ratio <= hardwareLevel.peak)
									{
										widget.data.level = parseInt(level);
										break;
									}
								}
							}

							return;
						});
						return;
					},
					updateHardwareWidgetsHistory(){
						this.hardwareWidgets.forEach((widget)=>{
							if(this.enabled.hardware && this.status.hardware)
								widget.history.push(widget.data);
							else 
								widget.history.push(null);
							while(widget.history.length > 60)
								widget.history.shift();
							return;
						});
						return setTimeout(this.updateHardwareWidgetsHistory,1000);
					},
					shiftHardwareWidget(widget,direction){
						let index = this.hardwareWidgets.indexOf(widget);
						if(index === -1) return;
						if(direction === -1 && index <= 0) return;
						if(direction === 1 && index === this.hardwareWidgets.length-1) return;
						let w = this.hardwareWidgets.splice(index,1)[0];
						this.hardwareWidgets.splice(index+direction,0,w);
						let newIndex = index+direction;
						this.rgbWidgets.forEach((widget)=>{
							
							if(widget.monitor.widgetIndex == newIndex)
								widget.monitor.widgetIndex = index;
							else if(widget.monitor.widgetIndex == index)
								widget.monitor.widgetIndex = newIndex;
							return;
						});
						return;
					},
					updateHardwareWidgetAlerts(){
						let warning = false;
						this.hardwareWidgets.forEach((widget)=>{
							if(!widget.data) return;
							if(!widget.alert) return;
							if(!widget.reverse && widget.data.cur >= widget.alert)
								warning = true;
							else if(widget.reverse && widget.data.cur <= widget.alert)
								warning = true;
							return;
						});
						if(warning) this.beep.start();
						else this.beep.stop();
						return;
					},
					createRgbWidgets(){
						this.rgbWidgets.forEach((widget)=>this.createRgbWidget(widget));
						return;
					},
					createRgbWidget(widget) {
						widget = widget || {};
						Object.assign(widget,{
							name: '',
							target: [{
								device: "",
								zone: "",
								leds: [[null,null]]
							}],
							circular: false,
							state: {
								red: 0,
								green: 0,
								blue: 0
							},
							monitor: {
								widgetIndex: -1,
								level: -1,
								analyze: 0,
								reverse: 0
							},
							rainbow: {
								enabled: false,
								rotate: 0,
								length: 360
							}
						},clone(widget));

						if(this.rgbWidgets.indexOf(widget) === -1)
						{
							this.rgbWidgets.push(widget);
							this.updateRgbSync();
						}

						return widget;
					},
					updateRgbSync(){
						if(!this.enabled.rgb) return;
						if(this.previewRGBColorActive) return;
						this.rgbWidgets.forEach((widget)=>{
							let c = this.getRgbSyncColor(widget);
							this.correctRgbSyncColor(c);
							this.rgbClient.setColors(c.target,c.state);
						});
						return this.rgbClient.syncColors();
					},
					previewRGBColor(rgb,ttl){
						if(!this.enabled.rgb) return;
						this.previewRGBColorActive = true;
						clearTimeout(this.previewRGBColorTimeout);
						this.previewRGBColorTimeout = setTimeout(()=>{
							this.previewRGBColorActive = false;
							return this.updateRgbSync();
						},ttl);
						this.rgbWidgets.forEach((widget)=>{
							return this.rgbClient.setColors(widget.target,rgb);
						});
						return this.rgbClient.syncColors();
					},
					getRgbSyncColor(widget) {
						let shouldMonitor = () => {
							if(widget.monitor.level < 0) return false;
							if(widget.monitor.widgetIndex < 0) return false;
							let hardwareWidget = this.hardwareWidgets[widget.monitor.widgetIndex];
							if(!hardwareWidget) return false;
							if(!hardwareWidget.data) return false;
							if(hardwareWidget.data.level < widget.monitor.level) return false;
							return true;
						};
						let shouldRainbow = () => {
							if(!widget.rainbow.enabled) return false;
							if(widget.rainbow.length === null || widget.rainbow.length < 0) return false;
							if(widget.rainbow.rotate === null || widget.rainbow.rotate < 0) return false;
							return true;
						};

						if(shouldMonitor())
							return this.getRgbSyncMonitorColor(widget);
						else if(shouldRainbow())
							return this.getRgbSyncRainbowColor(widget);
						else 
							return {target:widget.target,state:widget.state};
					},
					getRgbSyncMonitorColor(widget) {
						let hardwareWidget = this.hardwareWidgets[widget.monitor.widgetIndex],
							color = {target:widget.target,state:clone(this.hardwareLevels[hardwareWidget.data.level].rgb)};
						if(!widget.monitor.analyze) return color;
						
						let find = [];
							
						widget.target.forEach((target)=>{
							let maxLeds = 0,
								minLeds = 0,
								index = 0;
							target.leds.forEach((leds)=>{
								return between(leds[0],leds[1],()=>maxLeds++);
							});
							minLeds = Math.ceil(maxLeds*hardwareWidget.data.ratio);
							return target.leds.forEach((leds)=>{
								return between(leds[0],leds[1],(i,reverse)=>{
									let n=i;
									if(leds[2])
									{
										if(!reverse)
										{
											n = i+leds[2];
											if(n > leds[1])
												n = leds[0] + (n-leds[1]) - 1;
										}
										else 
										{
											n = i-leds[2];
											if(n < leds[1])
												n = leds[0] - (leds[1]-n) + 1;
										}
									}

									let color = index <= minLeds ? clone(this.hardwareLevels[hardwareWidget.data.level].rgb) : {red:10,green:10,blue:10};
									find.push({
										device: target.device,
										zone: target.zone,
										leds: [[n,n]],
										color: color
									});
									index++;
								});
							});
						});
						color.target = find;
						return color;
					},
					getRgbSyncRainbowColor(widget) {
						let find = [];
						widget.target.forEach((target)=>{
							let maxLeds = 0;
							target.leds.forEach((leds)=>{
								return between(leds[0],leds[1],()=>{ maxLeds++; });
							});
							let len = widget.rainbow.length;
							let rotate = widget.rainbow.rotate;

							if(maxLeds <= 0) return;
							if(len <= 0) return;
					
							let rotationStepSize = Math.ceil(len/maxLeds);
							let currentRotation = rotate + (rotationStepSize/2);

							if(widget.circular)
							{
								let distance = Math.abs(rgbToHSL(changeHue({red:255,green:0,blue:0},rotate)).h - rgbToHSL(changeHue({red:255,green:0,blue:0},rotate+len)).h);
								rotationStepSize = Math.ceil(rotationStepSize * (1+(distance/len)) );
							}

							let direction = 1;
				
							while(currentRotation >= (len+rotate))
								currentRotation -= len;
								
							target.leds.forEach((leds)=>{
								return between(leds[0],leds[1],(i,reverse)=>{
									let n=i;
									if(leds[2])
									{
										if(!reverse)
										{
											n = i+leds[2];
											if(n > leds[1])
												n = leds[0] + (n-leds[1]) - 1;
										}
										else 
										{
											n = i-leds[2];
											if(n < leds[1])
												n = leds[0] - (leds[1]-n) + 1;
										}
									}

									let color = changeHue({red:255,green:0,blue:0},currentRotation);
									find.push({
										device: target.device,
										zone: target.zone,
										leds: [[n,n]],
										color: color
									});
									currentRotation = currentRotation + (direction * rotationStepSize);
									if(currentRotation >= (rotate+len) )
									{
										currentRotation -= rotationStepSize;
										direction = -1;
									}
									else if(currentRotation <= 0)
									{
										currentRotation += rotationStepSize;
										direction = 1;
									}
								});
							});
							return;
						});
						return {target:find,state:{red:0,green:0,blue:0}};
					},
					correctRgbSyncColor(color) {
						color.target = clone(color.target);
						color.state = clone(color.state);

						color.state.red = color.state.red || 0;
						color.state.green = color.state.green || 0;
						color.state.blue = color.state.blue || 0;

						color.target.forEach((target)=>{
							for(let i=target.leds.length-1;i>=0;i--)
							{
								let range = target.leds[i];
								let failed = false;
								if(!range[0]) failed = true;
								if(!range[1]) failed = true;
								if(failed) target.leds.splice(i,1);
							}
							return;
						});

						for(let i=color.target.length-1;i>=0;i--)
						{
							let target = color.target[i];
							let details = this.rgbClient.find(target.device,target.zone);
							let failed = !details;
							if(!target.device) failed = true;
							if(!target.zone) failed = true;
							if(!target.leds.length) failed = true;
							if(failed) color.target.splice(i);
						}

						color.target.forEach((target)=>{
							return target.leds.forEach((range)=>{
								range[0]--;
								range[1]--;
								return;
							});
						});

						return;
					},
					saveConfiguration(){
						let dialog = remote.dialog;
						let data = JSON.stringify(store.get(),null,2);
						let file = dialog.showSaveDialog({ 
							title: 'Select the File Path to save', 
							defaultPath: 'hardware-monitor-config.json', 
							buttonLabel: 'Save', 
							filters: [{ 
								name: 'JSON Files', 
								extensions: ['json'] 
							}], 
							properties: [] 
						});
						if(!file) return;
						fs.writeFileSync(file.toString(),data); 
						return;
					},
					loadConfiguration(){
						let dialog = remote.dialog;
						let file = dialog.showOpenDialog({ 
							title: 'Select the File Path to open', 
							defaultPath: 'hardware-monitor-config.json', 
							buttonLabel: 'Open', 
							filters: [{ 
								name: 'JSON Files', 
								extensions: ['json'] 
							}], 
							properties: [] 
						});
						if(!file) return;
						try {
							let data = JSON.parse(fs.readFileSync(file.toString()));
							store.set(data);
							window.location.reload();
						} catch(e) {
							log('Application: Unable To Load Configuration');
						}
					}
				}
			}
		}));
	}
}

export default System;