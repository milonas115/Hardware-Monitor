<template>
	<div class="container-fluid p-3">
		<div class="row">
			<div class="col">
				<b-form-group label="Name">
					<b-form-input type="text" v-model="widget.text" />
				</b-form-group>
			</div>
			<div class="col">
				<b-form-group label="Higher Is Better?">
					<b-form-select type="text" v-model="widget.reverse" :options="[{text:'Yes',value:1},{text:'No',value:0}]" />
				</b-form-group>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<b-form-group label="Section">
					<b-form-select  v-model="widget.section" :options="selectSections" />
				</b-form-group>
			</div>
			<div class="col" v-if="selectSensors.length">
				<b-form-group label="Sensor">
					<b-form-select v-model="widget.sensor" :options="selectSensors" />
				</b-form-group>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<b-form-group label="Min">
					<b-form-input type="text" v-model="widget.min" />
				</b-form-group>
			</div>
			<div class="col">
				<b-form-group label="Max">
					<b-form-input type="text" v-model="widget.max" />
				</b-form-group>
			</div>
			<div class="col">
				<b-form-group label="Alert">
					<b-form-input type="text" v-model="widget.alert" />
				</b-form-group>
			</div>
		</div>

		<hr>

		<div class="btn btn-secondary" @click="$emit('close')">Close</div>
	</div>
</template>

<script> 
	export default {
		props: ['widget','system'],
		computed: {
			selectSections(){
				let list = [];
				this.system.hardwareSections.forEach((section)=>{
					list.push({
						text: section.name,
						value: section.name
					});
					return;
				});
				return list;
			},
			selectSensors(){
				let list = [];
				if(!this.widget.section) return list;
				this.system.hardwareSections.forEach((section)=>{
					if(section.name === this.widget.section)
					{
						section.sensors.forEach((sensor)=>{
							list.push({
								text: sensor.rename + ' ('+this.numberFormat(sensor.cur)+sensor.unit+')',
								value: sensor.name
							});
							return;
						});
					}
					return;
				});
				return list;
			}
		},
		methods: {
			numberFormat (number,decimals=0,minDecimals=0) {
				number = number || 0;
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
			},
		}
	}
</script>