export const guid = function(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
  });
};

export const writeKeypath = function(obj,keypath,value,handler=null){
	let parts = keypath.split('.'),
		currentKeypath = [];
	while(parts.length > 1)
	{
		let part = parts.shift();
		currentKeypath.push(part);
		if(typeof obj[part] !== 'object' && handler) handler(obj,part,{},currentKeypath.join('.'));
		obj[part] = obj[part] || {};
		obj = obj[part];
	}
	let part = parts.shift();
	currentKeypath.push(part);
	if(handler)
		handler(obj,part,value,currentKeypath.join('.'));
	else
		obj[part] = value;
};

export const readKeypath = function(obj,keypath,def=null,loose=false){
	let parts = keypath.split('.');
	while(parts.length)
	{
		let part = parts.shift();
		if(typeof obj[part] === 'undefined' || obj[part] === null)
			return def;
		obj = obj[part];
	}

	if(loose && obj === '') return def;

	return obj;
};

export const isNumeric = function(n){
	return !isNaN(parseFloat(n)) && isFinite(n);
};

export const clone = function(data){
	if(typeof data === 'object' && data !== null)
	{
		let ret = data instanceof Array ? [] : {};
		each(data,(value,key)=>{
			if(key.substr(0,1) === '$' || key.substr(0,1) === '_') return;
			ret[key] = clone(value);
			return;
		});
		return ret;
	}
	else
	{
		return data;
	}
};

export const snakeToCamel = function(s) {
	return s.replace(/(_\w)/g, function(m){
		return m[1].toUpperCase();
	});
};

export const camelToSnake = function(s,sep='_'){
	return s.replace(/[\w]([A-Z])/g, function(m) {
		return m[0] + sep + m[1];
	}).toLowerCase();
};

export const isArray = function(array){
	if(typeof array === 'object' && array instanceof Array && array !== null)
		return true;
	return false;
};

export const isObject = function(object) {
	if(typeof array === 'object' && !isArray(object))
		return true;
	return false;
};

export const exists = function(value){
	if(typeof value === 'undefined' || value === null)
		return false;
	else 
		return true;
};

export const equal = function (...compares) {

	if(compares.length < 2)
		throw new Error('Equal Expects At Least Two Arguments');

	let type = null;
	for(let i=0;i<compares.length;i++)
	{
		if(type !== null && typeof compares[i] !== type)
			return false;
		type = typeof compares[i];
	}

	if(type === 'object')
	{
		let isArr = null;
		for(let i=0;i<compares.length;i++)
		{
			if(i > 0 && isArray(compares[i]) !== isArr)
				return false;
			isArr = isArray(compares[i]);
		}

		if(isArr)
		{
			let len = null;
			for(let i=0;i<compares.length;i++)
			{
				if(i > 0 && compares[i].length !== len)
					return false;
				len = compares[i].length;
			}
			for(let x=0;x<len;x++)
			{
				let valueCompares = [];
				for(let i=0;i<compares.length;i++)
					valueCompares.push(compares[i][x]);
				if(!equal(...valueCompares))
					return false;
			}
		}
		else 
		{
			let len = null;
			for(let i=0;i<compares.length;i++)
			{
				if(i > 0 && Object.keys(compares[i]).length !== len)
					return false;
				len = Object.keys(compares[i]).length;
			}
			let compareKeys = [];
			for(let i=0;i<compares.length;i++)
				compareKeys.push(Object.keys(compares[i]).sort());
			if(!equal(...compareKeys))
				return false;

			let keys = compareKeys[0];
			for(let a=0;a<keys.length;a++)
			{
				let x = keys[a];
				let valueCompares = [];
				for(let i=0;i<compares.length;i++)
					valueCompares.push(compares[i][x]);
				if(!equal(...valueCompares))
					return false;
			}

		}
	}
	else if(type === 'function')
	{
		let val = null;
		for(let i=0;i<compares.length;i++)
		{
			if(i > 0 && compares[i].toString() !== val)
				return false;
			val = compares[i].toString();
		}
	}
	else 
	{
		let val = null;
		for(let i=0;i<compares.length;i++)
		{
			if(i > 0 && compares[i] !== val)
				return false;
			val = compares[i];
		}
	}

	return true;
};

export const escapeRegExp = function(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const flatten = function(...args) {
	let flat = [];
	args.forEach((arg)=>{
		if(typeof arg === 'object' && arg instanceof Array)
			flat.push(...flatten(...arg));
		else
			flat.push(arg);
	});
	return flat;
};

export const chunk = function(array,chunk){
	var i,j,temparray,chunks = [];
	for (i=0,j=array.length; i<j; i+=chunk) 
	{
		temparray = array.slice(i,i+chunk);
		if(temparray.length)
			chunks.push(temparray);
	}
	return chunks;
};

export const debounce = function(next,delay=0,bindTo=null) {
	let timeout = null;
	let func = function(...args){
		var that = this;
		clearTimeout(timeout);
		timeout = setTimeout(function(){
			return next.apply(that,args);
		},delay);
		return;
	};
	if(bindTo) func = func.bind(bindTo);
	func.bind = function(that){
		return debounce(next,delay,that);
	};
	return func;
};

export const debounceFrame = function(next,bindTo=null) {
	let timeout = null;
	let func = function(...args){
		var that = this;
		cancelAnimationFrame(timeout);
		timeout = requestAnimationFrame(function(){
			return next.apply(that,args);
		});
		return;
	};
	if(bindTo) func = func.bind(bindTo);
	func.bind = function(that){
		return debounceFrame(next,that);
	};
	return func;
};

export const pluck = function(arr,key) {
	if(!arr || typeof arr !== 'object' || !(arr instanceof Array)) return [];
	let p = [];
	arr.forEach((a)=>{
		return p.push(a[key]);
	});
	return p;
};

export const uppercaseWords = (phrase) => {
	return phrase
		.toLowerCase()
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export const isMediaBreakpointDown = (name) => {
	let width = typeof name === 'number' ? name : getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-' + name) || '0px';
	return window.matchMedia('(max-width: '+width+')').matches ? true : false;
};

export const isMediaBreakpointUp = (name) => {
	let width = typeof name === 'number' ? name : getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-' + name) || '0px';
	return window.matchMedia('(min-width: '+width+')').matches ? true : false;
};

export const objectToOptionsArray = (obj)=>{
	if(isArray(obj)) return obj;
	let arr = [];
	for(let x in obj)
	{
		let text = obj[x];
		let value = isNumeric(x) ? parseInt(x) : x;
		arr.push({text,value});
	}
	return arr;
};

export const escapeRegex = function(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const numberFormat = function(number,decimals,minDecimals){
	if(!isNumeric(number)) return '-';
	number = number.toString();
	decimals = isNumeric(decimals) ? parseInt(decimals) : 0;
	minDecimals = isNumeric(minDecimals) ? parseInt(minDecimals) : 0;

	number = number.split('.');
	number[0] = number[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	if(!number[1]) number[1] = '';
	number[1] = number[1].substr(0,decimals);
	if(minDecimals > 0 && minDecimals < decimals) number[1] = (number[1] + '0000000000000000000' ).replace(new RegExp('^(\\\d{'+minDecimals+'})0*'),'$1');

	number = decimals ? number.join('.') : number[0];

	return number;
};

export const each = function(obj,callback,stopOnFalse=true){
	if(typeof obj !== 'object')
		return obj;
	for(let index in obj)
	{
		let value = obj[index];
		let ret = callback(value,index,obj);
		if(ret === false && stopOnFalse)
			break;
	}
	return obj;
};

export const eachReverse = function(obj,callback,stopOnFalse=true){
	if(typeof obj !== 'object')
		return obj;
	if(obj instanceof Array)
	{
		for(let index = obj.length-1;index>=0;index--)
		{
			let value = obj[index];
			let ret = callback(value,index,obj);
			if(ret === false && stopOnFalse)
				break;
		}
	}
	else
	{
		return each(obj,callback,stopOnFalse);
	}
	return obj;
};

export const between = function(start,end,next){
	if(start <= end)
	{
		for(let i=start;i<=end;i++)
		{
			if(next(i,false) === false) break;
		}
	}
	else 
	{
		for(let i=start;i>=end;i--)
		{
			if(next(i,true) === false) break;
		}
	}
};