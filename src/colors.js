/*
	The APP will deal w/ ALL colors as {red:0,green:0,blue:0}
*/

export function toHex(rgb) {
    rgb = normalizeRgb(rgb);
    return '#' + (parseInt(rgb.red).toString(16).padStart(2,'0')) + (parseInt(rgb.green).toString(16).padStart(2,'0')) + (parseInt(rgb.blue).toString(16).padStart(2,'0'));
};

export function changeHue(rgb, degree) {
	rgb = normalizeRgb(rgb);
	var hsl = rgbToHSL(rgb);
    hsl.h += degree;
    if (hsl.h > 360)
        hsl.h -= 360;
    else if (hsl.h < 0)
		hsl.h += 360;
    return hslToRGB(hsl);
}

export function rgbToHSL(rgb) {
	rgb = normalizeRgb(rgb);

    var r = rgb.red/255,
        g = rgb.green/255,
        b = rgb.blue/255,
        cMax = Math.max(r, g, b),
        cMin = Math.min(r, g, b),
        delta = cMax - cMin,
        l = (cMax + cMin) / 2,
        h = 0,
        s = 0;

    if (delta == 0) {
        h = 0;
    }
    else if (cMax == r) {
        h = 60 * (((g - b) / delta) % 6);
    }
    else if (cMax == g) {
        h = 60 * (((b - r) / delta) + 2);
    }
    else {
        h = 60 * (((r - g) / delta) + 4);
    }

    if (delta == 0) {
        s = 0;
    }
    else {
        s = (delta/(1-Math.abs(2*l - 1)))
    }

    return {
        h: h,
        s: s,
        l: l
    }
}

export function hslToRGB(hsl) {
    var h = hsl.h,
        s = hsl.s,
        l = hsl.l,
        c = (1 - Math.abs(2*l - 1)) * s,
        x = c * ( 1 - Math.abs((h / 60 ) % 2 - 1 )),
        m = l - c/ 2,
        r, g, b;

    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else {
        r = c;
        g = 0;
        b = x;
    }

    r = normalize_rgb_value(r, m);
    g = normalize_rgb_value(g, m);
    b = normalize_rgb_value(b, m);

    return {red:r,green:g,blue:b};
}

export function normalize_rgb_value(color, m) {
    color = Math.floor((color + m) * 255);
    if (color < 0) {
        color = 0;
    }
    return color;
}


export function normalizeRgb(rgb) {
	if(typeof rgb === 'object')
	{
		if(rgb instanceof Array)
		{
			return {
				red: rgb[0],
				green: rgb[1],
				blue: rgb[2]
			};
		}
		else if(typeof rgb.red === 'undefined')
		{
			return {
				red: rgb.r,
				green: rgb.g,
				blue: rgb.b
			};
		}
		else 
		{
			return rgb;
		}
	}

	rgb = rgb.toLowerCase().trim().replace(/\s/g,'');

	if(rgb.indexOf('#') === 0)
	{
		rgb = rgb.replace(/^\s*#|\s*$/g, '');
		if(rgb.length == 3)
			rgb = rgb.replace(/(.)/g, '$1$1');
		return {
			red: parseInt(rgb.substr(0, 2), 16),
			green: parseInt(rgb.substr(2, 2), 16),
			blue: parseInt(rgb.substr(4, 2), 16)
		};
	}
	else if(rgb.indexOf('rgb') === 0)
	{
		let match = rgb.match(/(\d+),(\d+),(\d+)/);
		return {
			red: parseInt(match[1]),
			green: parseInt(match[2]),
			blue: parseInt(match[3])
		};
	}

	throw Error('Unable To Parse Color: ' + JSON.stringify(rgb));
};