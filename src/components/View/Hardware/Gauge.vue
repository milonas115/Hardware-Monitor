<template>
	<div>
		<div class="gauge-currentontainer">
			<div class="gauge-full-circle"></div>
			<div class="gauge-inner-circle" :class="'bg-'+background"></div>
			<div class="gauge-current" :style="{transform: 'rotate('+rotation+')',backgroundColor:color}"></div>
			<div class="gauge-min-max gauge-indicator" :style="{transform: 'rotate('+maxRotation+')'}"></div>
			<div class="gauge-data">
				<div class="gauge-percent">{{ text || percentString }}</div>
			</div>
		</div>
		<div class="gauge-chart">
			<div class="gauge-chart-bar" v-for="(c,i) in chart" :key="i" :style="{height: c.height + '%',width: c.width + '%', left: c.left + '%',backgroundColor:c.color}"  :class="['border-'+background]">
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>

	.gauge-chart {
		margin-top: 5px;
		height: 35px;
		position: relative;
		width: 100%;
	}

	.gauge-chart-bar {
		position: absolute;
		bottom: 0;
		background: red;
		min-height: 3%;
		max-height: 100%;
		border-right: 1px solid;
	}

	.gauge-currentontainer {
		width: 100%;
		height: 0;
		padding-top: 50%;
		position: relative;
		overflow: hidden;
		text-align: center;
	}

	.gauge-full-circle {
		z-index: 1;
		position: absolute;
		background-color: rgba(255,255,255,.2);
		width: 100%;
		height: 100%;
		top: 0%;
		border-radius: 1000px 1000px 0px 0px;
	}

	.gauge-inner-circle {
		z-index: 3;
		position: absolute;
		background-color: #222;
		width: 62.5%;
		height: 62.5%;
		top: 37.5%;
		margin-left: 18.75%;
		margin-right: auto;
		border-radius: 1000px 1000px 0px 0px;
	}

	.gauge-current {
		z-index: 2;
		position: absolute;
		width: 100%;
		height: 100%;
		top: 100%;
		margin-left: auto;
		margin-right: auto;
		border-radius: 0px 0px 1000px 1000px;
		transform-origin: center top;
		transition: all 250ms ease-in-out;
	}

	.gauge-currentontainer:hover .gauge-current {  
		transform:rotate(.5turn);
	}

	.gauge-currentontainer:hover .gauge-data { 
		color: rgba(255,255,255,1); 
	}

	.gauge-data {
		z-index: 4;
		color: rgba(255,255,255,.8);
		position: absolute;
		width: 100%;
		bottom: 0;
		vertical-align: bottom;
		margin-left: auto;
		margin-right: auto;
		transition: all 1s ease-out;
	}

	.gauge-percent {
		font-size: 1.3rem;
	}
	
	.gauge-min-max {
		z-index: 2;
		position: absolute;
		width: 100%;
		height: 3px;
		bottom: 0;
		margin-left: auto;
		margin-right: auto;
		transform-origin: center bottom;
		transition: all 250ms ease-in-out;
		background: rgba(255,255,255,0.75);
	}
	.gauge-indicator {
		background: rgba(0,0,0,1);
	}

</style>

<script>
export default {
	props: {
		widget: {},
		system: {}
	},
	data(){
		return {
			history: []
		};
	},
	computed: {
		value(){
			return this.widget.data.cur;
		},
		min(){
			return this.widget.min;
		},
		max(){
			return this.widget.max;
		},
		color(){
			return this.system.hardwareLevels[this.widget.data.level].color;
		},
		text(){
			return this.numberFormat(this.widget.data.cur)+this.widget.data.unit;
		},
		background(){
			return 'dark';
		},
		chart(){
			let lookback = 60;
			let history = this.widget.history.map((h)=>h ? Object.assign({},h) : null);
			let chart = [];
			while(history.length < lookback)
				history.unshift(null);
			while(history.length > lookback)
				history.shift();
			
			history.forEach((h,i)=>{
				if(!h)
				{
					h = {
						ratio: 0,
						level: 0,
						color: '#222222'
					};
				}
				chart.push({
					width: 100 / lookback,
					height: h.ratio * 100,
					left: (100 / lookback) * i,
					color: h.color || this.system.hardwareLevels[h.level].color
				});
				return;
			});

			let maxHeight = 0;
			chart.forEach((h)=>(maxHeight=Math.max(maxHeight,h.height)));
			let ratio = 100 / maxHeight;
			chart.forEach((h)=>(h.height = h.height * ratio));

			return chart;
		},
		percentString(){
			return parseInt(this.widget.data.ratio*100) + '%';
		},
		maxValue(){
			let value = this.min;
			value = Math.max(value,this.widget.data.cur);
			this.getHistory(3).forEach(h=>(value=Math.max(value,h ? h.cur : value)));
			return value;
		},
		maxRotation(){
			let deg = ((1-this.getRatio(this.maxValue))*180);
			return '-' + deg + 'deg';
		},
		rotation(){
			return (this.widget.data.ratio*180) + 'deg';
		}
	},
	methods: {
		getHistory(steps) {
			return ([]).concat(this.widget.history).reverse().filter((h,i)=>{
				if(i > steps) return false;
				return true;
			});
		},
		getRatio(value){
			let before = value - this.min;
			let after = this.max - value;
			let ratio = before / (before + after);
			return ratio;
		},
		numberFormat (number,decimals=0,minDecimals=0) {
			if(number.toString().indexOf('.') !== -1)
				decimals = minDecimals = 1;
			number = number.toString();
			number = number.split('.');
			number[0] = number[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			if(!number[1]) number[1] = '';
			number[1] = number[1].substr(0,decimals);
			if(minDecimals > 0 && minDecimals < decimals) number[1] = (number[1] + '0000000000000000000' ).replace(new RegExp('^(\\\d{'+minDecimals+'})0*'),'$1');
			number = decimals ? number.join('.') : number[0];
			return number;
		}
	}
}
</script>