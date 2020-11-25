import net from 'net';
import iconv from 'iconv-lite';

class HWInfoClient
{
	constructor(){
		this.running = false;
		this.connected = false;
		this.ttl = null;
		this.next = null;
		this.client = new net.Socket();
		this.sections = null;
		this.onChangeCallback = null;
		this.ip = '127.0.0.1';
		this.port = 27007;
	}
	onChange(next) {
		this.onChangeCallback = next;
		return;
	}
	find(sectionName,sensorName) {
		if(!this.sections) return null;
		let ret = null,
			found = false;
		this.sections.forEach((section)=>{
			if(found) return;
			if(!sectionName || sectionName === section.name)
			{
				if(!sensorName)
				{
					found = true;
					ret = section;
				}
				else 
				{
					section.sensors.forEach((sensor)=>{
						if(found) return;
						if(sensorName === sensor.name || sensorName === sensor.rename)
						{
							found = true;
							ret = sensor;
						}		
						return;	
					});
				}
			}
			return;
		});
		return ret;
	}
	connectAndFetch(ttl,next){
		this.ttl = ttl;
		this.next = next;
		return this.connect((error)=>{
			if(error) return this.reload();
			let fetch = ()=>{
				return this.fetch((sections)=>{
					this.sections = sections;
					return next(sections);
				});
			};
			fetch();
			return (this.intervalId = setInterval(fetch,ttl));
		});
	}
	stop(){
		log.info('HWInfoClient: Stopped');
		this.running = false;
		clearInterval(this.intervalId);
		this.client.destroy();
		this.client = new net.Socket();
		this.connected = false;
		this.onChangeCallback?this.onChangeCallback():null;
		return;
	}
	reload(){
		this.stop();
		setTimeout(()=>{
			return this.connectAndFetch(this.ttl,this.next);
		},1000);
		return;
	}
	connect(next) {
		this.running = true;
		let connected = false;
		this.connected = false;
		this.client.connect(this.port,this.ip,()=>{
			log.info('HWInfoClient: Connected');
			connected = this.connected = true;
			this.onChangeCallback?this.onChangeCallback():null;
			return next();
		});
		this.client.on('error',(e)=>{
			log.info('HWInfoClient: Error: ' + e.message);
			this.connected = false;
			this.onChangeCallback?this.onChangeCallback():null;
			if(connected) return this.reload();
			return next(e);
		});
		this.client.on('close',()=>{
			log.info('HWInfoClient: Disconnected');
			this.connected = false;
			this.onChangeCallback?this.onChangeCallback():null;
			return this.running ? this.reload() : null;
		});
		return;
	}
	fetch(next) {
		let buffer = Buffer.allocUnsafe(0);
		let dataHandler = (data)=>{
			buffer = Buffer.concat([buffer,data]);
			let length = buffer.slice(12,16).readUIntLE(0,4);
			let messageLength = length + 132;
			if(buffer.length !== messageLength) return;
			
			data = buffer.slice(192);
			let sections = [],
				reachedValues = false;

			while(data.length)
			{
				if(!reachedValues)
				{
					let hdr1 = data.slice(0,4).readUIntLE(0,4);
					let section = iconv.decode(data.slice(8,136),'ISO-8859-1').replace(/\x00/g,'');
					if(hdr1 < 100)
					{
						reachedValues = true;
					}
					else 
					{
						sections.push({ name: section,sensors: []});
						data = data.slice(264);
					}
				}
				else 
				{  
					let i2 = data.slice(4,8).readUIntLE(0,4);
					let name = iconv.decode(data.slice(12,140),'ISO-8859-1').replace(/\x00/g,'');
					let rename = iconv.decode(data.slice(140,268),'ISO-8859-1').replace(/\x00/g,'');
					let unit = iconv.decode(data.slice(268,284),'ISO-8859-1').replace(/\x00/g,'');
					let cur = data.slice(284,292).readDoubleLE(0);
					let min = data.slice(292,300).readDoubleLE(0);
					let max = data.slice(300,308).readDoubleLE(0);
					let avg = data.slice(308,316).readDoubleLE(0);
					sections[i2].sensors.push({
						name,
						rename,
						unit,
						cur,
						min,
						max,
						avg
					});
					data = data.slice(316);
				}
			}
			this.client.off('data',dataHandler);
			return next(sections);
		};
		this.client.write('\x43\x52\x57\x48\x02'.padEnd(128,'\0'));
		this.client.on('data',dataHandler);
	}
}

export default HWInfoClient;