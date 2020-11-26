import net from 'net';
import OpenRGBDevice from './OpenRGBDevice.js';
import async from 'async';

class OpenRGBClient
{
	constructor() {
		this.commands = {
			SetClientName: 50,
			RequestDeviceCount: 0,
			RequestDeviceData: 1,
			UpdateLeds: 1050,
			UpdateZoneLeds: 1051,
			SetCustomMode: 1100
		};
		this.devices = [];
		this.buffer = Buffer.alloc(0);
		this.running = false;
		this.connected = false;
		this.onChangeCallback = null;
		this.client = new net.Socket();
		this.ip = '127.0.0.1';
		this.port = 6742;
		this.syncing = false;
		this.syncingPending = false;
	}
	onChange(next) {
		this.onChangeCallback = next;
		return;
	}
	connect(next){
		this.running = true;
		this.connected = false;
		this.client.connect(this.port,this.ip,()=>{
			this.connected = true;
			log.info('OpenRGBClient: Connected');
			return this.getDevices(next);
		});
		this.client.on('data',(data)=>{
			this.buffer = Buffer.concat([this.buffer,data]);
			return;
		});
		this.client.on('error',(e)=>{
			log.info('OpenRGBClient: Error: ' + e.message);
			this.connected = false;
			this.onChangeCallback?this.onChangeCallback():null;
			return this.running ? this.reload() : null;
		});
		this.client.on('close',()=>{
			log.info('OpenRGBClient: Disconnected');
			this.connected = false;
			this.onChangeCallback?this.onChangeCallback():null;
			return this.running ? this.reload() : null;
		});
		return;
	}
	stop(){
		log.info('OpenRGBClient: Stopped');
		this.running = false;
		this.client.destroy();
		this.client = new net.Socket();
		this.connected = false;
		this.onChangeCallback?this.onChangeCallback():null;
		return;
	}
	reload(){
		this.stop();
		setTimeout(()=>{
			return this.connect();
		},1000);
		return;
	}
	getDevices(next) {
		return this.sendMessage('SetClientName','Hardware Monitor',()=>{
			return this.getDeviceCount((count)=>{
				return this.getDeviceDevices(count,(devices)=>{
					this.devices = devices;
					this.onChangeCallback?this.onChangeCallback():null;
					return next ? next() : null;
				});
			});
		});
	}
	getDeviceCount(next) {
		return this.sendMessage('RequestDeviceCount',()=>{
			return this.readMessage((buffer)=>{
				return next(buffer.readUInt32LE());
			});
		});
	}
	getDeviceDevices(count,next,devices=[]){
		if(devices.length === count) return next(devices);
		return this.getDeviceDevice(devices.length,(device)=>{
			devices.push(device);
			return this.getDeviceDevices(count,next,devices);
		});
	}
	getDeviceTree(){
		let tree = [];
		this.devices.forEach((device)=>{
			let c = {
				id: device.id,
				name: device.name,
				zones: []
			};
			device.zones.forEach((zone)=>{
				let z = {
					id: zone.id,
					name: zone.name,
					leds: zone.ledsCount
				};
				c.zones.push(z);
			});
			tree.push(c)
		});
		return tree;
	}
   	getDeviceDevice(deviceId,next) {
       return  this.sendMessage('RequestDeviceData', undefined, deviceId,()=>{
			this.readMessage((buffer)=>{
				let device = new OpenRGBDevice(buffer);
				return next(device);
			});
		});
    }
	sendMessage(command,buffer=Buffer.alloc(0),deviceId=0,next) {
		if(!this.connected) return;

		if(typeof buffer === 'function')
		{
			next = buffer;
			buffer = Buffer.alloc(0);
		}
		else if(typeof deviceId === 'function')
		{
			next = deviceId;
			deviceId = 0;
		}
		if(typeof command === 'string') command = this.commands[command];
		if(typeof buffer === 'string') buffer = new TextEncoder().encode(buffer);

		buffer = Buffer.concat([buffer,Buffer.alloc(1)]);

		let header = this.encodeHeader(command, buffer.byteLength, deviceId);
		let packet = Buffer.concat([header, buffer]);
		this.buffer = Buffer.alloc(0);
		this.client.write(packet,next);
	}
    readMessage(next) {
		return this.readBuffer(16,(buffer)=>{
			let header = this.decodeHeader(buffer);
			return this.readBuffer(header.length,(buffer)=>{
				return next(buffer);
			});
		});
	}
	readBuffer(bytes,next) {
		if(this.buffer.length < bytes)
		{
			return this.client.once('data',()=>{
				return this.readBuffer(bytes,next);
			},100);
		}
		let ret = this.buffer.slice(0,bytes);
		this.buffer = this.buffer.slice(bytes);
		return next(ret);
	}
    encodeHeader(command, length, deviceId) {
        let buffer = Buffer.alloc(16);
		let index = buffer.write('ORGB','ascii');
		index = buffer.writeUInt32LE(parseInt(deviceId), index);
		index = buffer.writeUInt32LE(parseInt(command), index);
		index = buffer.writeUInt32LE(parseInt(length), index);
        return buffer;
	}
	decodeHeader(buffer)
	{
        let deviceId = buffer.readUInt32LE(4);
        let commandId = buffer.readUInt32LE(8);
		let length = buffer.readUInt32LE(12);
		let command = null;
		for(let x in this.commands)
		{
			if(this.commands[x] == commandId)
			{
				command = x;
				break;
			}
		}
        return { deviceId, commandId, command, length };
	}
	setColors(findArray,color) {
		if(!(findArray instanceof Array))
		{
			findArray = [findArray];
		}
		if(typeof color === 'undefined')
		{
			color = {
				red:0,
				green:0,
				blue: 0
			};
		}
		this.devices.forEach((device)=>{
			findArray.forEach((find)=>{
				if(!find.device || find.device === device.id)
				{
					if(find.zone)
					{
						if(find.leds)
							device.setZoneLedsColor(find.zone,find.leds,find.color||color);
						else 
							device.setZoneColor(find.zone,find.color||color);
					}
					else
					{
						if(find.leds)
							device.setLedsColor(find.leds,find.color||color);
						else 
							device.setColor(find.color||color);
					}
				}
				return;
			});
			return;
		});
		return this;
	}
	find(deviceToFind,zoneToFind){
		let found = null;
		
		this.devices.forEach((device)=>{
			if(found) return;
			if(device.id === deviceToFind)
			{
				if(!zoneToFind)
				{
					found = device;
				}
				else 
				{
					device.zones.forEach((zone)=>{
						if(found) return;
						if(zone.id === zoneToFind)
						{
							found = zone;
						}
						return;
					});
				}
			}
			return;
		});
		return found;
	}
	syncColors(){
		if(this.syncing)
		{	
			this.syncingPending = true;
			return;
		}

		this.syncing = true;

		let requests = [];
		this.devices.forEach((device,index)=>{
			if(!device.changed) return;
			let size = 2 + (4 * device.leds.length);
			let colorsBuffer = Buffer.alloc(size);
			colorsBuffer.writeUInt16LE(device.leds.length);
			for (let i = 0; i < device.leds.length; i++) 
			{
				let offset = 2 + (i * 4);
				colorsBuffer.writeUInt8(device.colors[i].red, offset);
				colorsBuffer.writeUInt8(device.colors[i].green, offset + 1);
				colorsBuffer.writeUInt8(device.colors[i].blue, offset + 2);
			}
			let prefixBuffer = Buffer.alloc(4);
			prefixBuffer.writeUInt32LE(size);
			return requests.push((finish)=>{
				device.changed = false;
				return this.sendMessage('UpdateLeds', Buffer.concat([prefixBuffer, colorsBuffer]), index,()=>{
					return finish();
				});
			});
		});
		return async.series(requests,()=>{
			this.syncing = false;

			if(this.syncingPending)
			{
				this.syncingPending = false;
				this.syncColors();
			}
			return;
		});
	}
}

export default OpenRGBClient;