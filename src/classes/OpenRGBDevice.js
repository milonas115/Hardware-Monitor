import crypto from 'crypto';

class OpenRGBDevice
{
	constructor(buffer) {
		this.id = null;
		this.changed = false;

        let offset = 4;
        this.type = buffer.readUInt32LE(offset);
        offset += 4;
        let { text: name, length: nameLength } = this.readString(buffer, offset);
        this.name = name;
        offset += nameLength;
        let { text: desc, length: descLength } = this.readString(buffer, offset);
        this.desc = desc;
        offset += descLength;
        let { text: version, length: versionLength } = this.readString(buffer, offset);
        this.version = version;
        offset += versionLength;
        let { text: serial, length: serialLength } = this.readString(buffer, offset);
        this.serial = serial;
        offset += serialLength;
        let { text: location, length: localLength } = this.readString(buffer, offset);
        this.location = location;
		offset += localLength;
		
		this.id = 'device-' + crypto.createHash('md5').update(JSON.stringify([this.name,this.location,this.serial])).digest("hex");

        let modeCount = buffer.readUInt16LE(offset);
        offset += 2;

        this.activeMode = buffer.readUInt32LE(offset);
        offset += 4;

        let { modes, offset: readModesOffset } = this.readModes(buffer, modeCount, offset);
        this.modes = modes;
        offset = readModesOffset;

        let zoneCount = buffer.readUInt16LE(offset);
        offset += 2;

        let { zones, offset: readZonesOfsset } = this.readZones(buffer, zoneCount, offset);
        this.zones = zones;
        offset = readZonesOfsset;

        let ledCount = buffer.readUInt16LE(offset);
        offset += 2;

        this.leds = [];

		for (let ledIndex = 0; ledIndex < ledCount; ledIndex++) 
		{
            let { text: ledName, length: ledNameLength } = this.readString(buffer, offset);
            offset += ledNameLength;
            let color = this.readColor(buffer, offset);
            offset += 4;

            this.leds.push({
                name: ledName,
                value: color
            })
        }

        let colorCount = buffer.readUInt16LE(offset);
        offset += 2;

        this.colors = [];

		for (let colorIndex = 0; colorIndex < colorCount; colorIndex++) 
		{
            this.colors.push(this.readColor(buffer, offset));
            offset += 4;
		}

		this.leds.forEach((led,index)=>{
			led.value = this.colors[index];
			return;
		});

		return;
		
	}
	readString(buffer,offset){
		let length = buffer.readUInt16LE(offset);
		let text = new TextDecoder().decode(buffer.slice(offset + 2, offset + length + 1));
		return { text, length: length + 2 }
	}
	readColor(buffer, offset) {
		let red = buffer.readUInt8(offset++);
		let green = buffer.readUInt8(offset++);
		let blue = buffer.readUInt8(offset++);
		return { red, green, blue };
	}
	readZones(buffer, zoneCount, offset) {
		let zones = [];
		for (let zoneIndex = 0; zoneIndex < zoneCount; zoneIndex++) 
		{
			let { text: zoneName, length: zoneNameLength } = this.readString(buffer, offset);
			offset += zoneNameLength;
			let type = buffer.readInt32LE(offset);
			offset += 4;
			let ledsMin = buffer.readUInt32LE(offset);
			offset += 4;
			let ledsMax = buffer.readUInt32LE(offset);
			offset += 4;
			let ledsCount = buffer.readUInt32LE(offset);
			offset += 4;
			let matrixSize = buffer.readUInt16LE(offset);
			offset += 2 + matrixSize;
			zones.push({
				id: 'zone-' + this.id + '-' + crypto.createHash('md5').update(JSON.stringify([zoneName,zones.length])).digest("hex"),
				name: zoneName,
				type,
				ledsMin,
				ledsMax,
				ledsCount,
			});
		}
		return { zones, offset };
	}
	readModes(buffer, modeCount, offset) {
		let modes = [];
	
		for (let modeIndex = 0; modeIndex < modeCount; modeIndex++) {
			let { text: modeName, length: modeNameLength } = this.readString(buffer, offset);
			offset += modeNameLength;
			let value = buffer.readInt32LE(offset);
			offset += 4;
			let flags = buffer.readUInt32LE(offset);
			offset += 4;
			let speedMin = buffer.readUInt32LE(offset);
			offset += 4;
			let speedMax = buffer.readUInt32LE(offset);
			offset += 4;
			let colorMin = buffer.readUInt32LE(offset);
			offset += 4;
			let colorMax = buffer.readUInt32LE(offset);
			offset += 4;
			let speed = buffer.readUInt32LE(offset);
			offset += 4;
			let direction = buffer.readUInt32LE(offset);
			offset += 4;
			let colorMode = buffer.readUInt32LE(offset);
			offset += 4;
	
			let colorLength = buffer.readUInt16LE(offset);
			offset += 2;
	
			let colors = [];
	
			for (let colorIndex = 0; colorIndex < colorLength; colorIndex++) {
				let color = this.readColor(buffer, offset);
				colors.push(color);
				offset += 4;
			}
	
			modes.push({
				name: modeName,
				value,
				flags,
				speedMin,
				speedMax,
				colorMin,
				colorMax,
				speed,
				direction,
				colorMode,
				colors
			});
		}
		return { modes, offset };
	}
	setColor(colorToSet) {
		this.colors.forEach((color,index)=>{
			return this.setLedColorAtIndex(i,color);
		});
		return this;
	}
	setZoneColor(zoneToSet,colorToSet) {
		let index = 0;
		this.zones.forEach((zone,zoneIndex)=>{
			let min = index,
				max = zone.ledsCount+index-1;
			if(zone.id === zoneToSet)
			{
				for(let i=min;i<=max;i++)
				{
					if(!this.colors[i]) break;
					this.setLedColorAtIndex(i,colorToSet);
				}
			}
			index = index + zone.ledsCount;
			return;
		});
		return this;
	}
	setZoneLedsColor(zoneToSet,ledsToSet,colorToSet) {
		let index = 0;
		this.zones.forEach((zone,zoneIndex)=>{
			let min = index,
				max = zone.ledsCount+index-1;
			if(zone.id === zoneToSet)
			{
				ledsToSet.forEach((range)=>{
					for(let i=range[0];i<=range[1];i++)
					{
						if(!this.colors[min+i]) break;
						this.setLedColorAtIndex(min+i,colorToSet);
					}
					return;
				});
			}
			index = index + zone.ledsCount;
			return;
		});
		return this;
	}
	setLedsColor(ledsToSet){
		ledsToSet.forEach((range)=>{
			for(let i=range[0];i<=range[1];i++)
			{
				if(!this.colors[i]) break;
				this.setLedColorAtIndex(i,colorToSet);
			}
			return;
		});
		return this;
	}
	setLedColorAtIndex(index,color) {
		let c = this.colors[index];
		if(c.red == color.red && c.green == color.green && c.blue == color.blue) return;
		this.changed = true;
		Object.assign(this.colors[index],color);
	}
}

export default OpenRGBDevice;