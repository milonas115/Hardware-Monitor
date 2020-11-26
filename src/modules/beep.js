import { runInContext } from 'vm';

const cp = require('child_process');

let context = new AudioContext();

function beep(freq = 520, duration = 200, vol = 100,next=null) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    oscillator.frequency.value = freq;
    oscillator.type = "square";
    gain.connect(context.destination);
    gain.gain.value = vol * 0.01;
    oscillator.start(context.currentTime);
	oscillator.stop(context.currentTime + duration * 0.001);
	oscillator.onended  = next;
}


beep.repeat = function(freq = 750, duration = 350, vol = 100) {
	let stopped = true;
	var run = function(){
		if(stopped) return;
		return beep(freq,duration,vol,()=>{
			if(stopped) return;
			return setTimeout(()=>{
				if(stopped) return;
				return run();
			},duration);
		});
	};
	var stop = function(){
		stopped = true;
		return;
	};
	return {
		beeping(){
			return !stopped;
		},
		start(){
			if(this.beeping()) return;
			stopped = false;
			run();
			return;
		},
		stop(){
			stop();
			return;
		}
	};
};

export default beep;