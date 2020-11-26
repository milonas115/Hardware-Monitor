<template>
	<div class="container-fluid p-3">

		<div class="row">
			<div class="col">
				<b-form-group label="Name">
					<b-form-input type="text" v-model="widget.name" />
				</b-form-group>
			</div>
			<div class="col">
				<b-form-group label="Circular?">
					<b-form-select v-model="widget.circular" :options="[{text:'Yes',value:true},{text:'No',value:false}]" />
				</b-form-group>
			</div>
		</div>

		<div class="card mb-3">
			<div class="card-body">
				<h4>Device Targeting</h4>
				<div v-for="(target,ti) in widget.target" :key="ti">
					<div class="row">
						<div class="col-6">
							<b-form-group label="Device">
								<b-form-select v-model="target.device" :options="targetDevices" />
							</b-form-group>
						</div>
						<div class="col-6">
							<b-form-group label="Zone">
								<b-form-select v-model="target.zone" :options="getTargetZones(target.device)" />
							</b-form-group>
						</div>
					</div>
					<div class="card">
						<div class="card-body">
							<b-form-group label="LEDs">
								<div v-for="(range,ri) in target.leds" :key="ri">
									<div class="row">
										<div class="col">
											<b-form-input type="number" placeholder="Start Index" v-model.number="range[0]" />
										</div>
										<div class="col-1">
											<div class="btn btn-secondary w-100"><i class="fa fa-arrow-right"></i></div>
										</div>
										<div class="col">
											<b-form-input type="number" placeholder="End Index" v-model.number="range[1]" />
										</div>
										<div class="col-1">
											<div class="btn btn-secondary w-100"><i class="fa fa-random"></i></div>
										</div>
										<div class="col">
											<b-form-input type="number" placeholder="Shift" v-model.number="range[2]" />
										</div>
										<div class="col-1">
											<div class="btn btn-danger" @click="target.leds.splice(ri,1)"><i class="fa fa-remove"></i></div>
										</div>
									</div>
								</div>
								<span class="text-primary cursor-pointer" @click="target.leds.push([null,null,null])">Add LEDs</span>
							</b-form-group>
						</div>
					</div>
					<hr>
					<div class="text-right">
						<span class="text-danger cursor-pointer" @click="widget.target.splice(ti,1)">Remove Target</span>
					</div>
				</div>
				<span class="text-primary cursor-pointer" @click="widget.target.push({device:'',zone:'',leds:[[null,null,null]]})">Add Target</span>
			</div>
		</div>

		<div class="card mb-3">
			<div class="card-body">
				<h4>Rainbow Effect</h4>
				<div class="row">
					<div class="col">
						<b-form-group label="Rainbow Enabled">
							<b-form-select v-model="widget.rainbow.enabled" :options="[{text:'Yes',value:true},{text:'No',value:false}]" />
						</b-form-group>
					</div>
					<div class="col" v-if="widget.rainbow.enabled">
						<b-form-group label="Rainbow Rotate">
							<b-form-input v-model.number="widget.rainbow.rotate"/>
						</b-form-group>
					</div>
					<div class="col" v-if="widget.rainbow.enabled">
						<b-form-group label="Rainbow Length">
							<b-form-input v-model.number="widget.rainbow.length" />
						</b-form-group>
					</div>
				</div>
			</div>
		</div>

		<div class="card mb-3" v-if="!widget.rainbow.enabled">
			<div class="card-body">
				<h4>Custom Color</h4>
				<div class="row">
					<div class="col-6">
						<b-form-group label="Color">
							<color-picker class="form-control" :value="getRgb()" @input="setRgb($event)" :palette="colors" />
						</b-form-group>
					</div>
					<div class="col-6">
						<div class="row">
							<div class="col-4">
								<b-form-group label="Red">
									<b-form-input type="text" v-model.number="widget.state.red" />
								</b-form-group>
							</div>
							<div class="col-4">
								<b-form-group label="Green">
									<b-form-input type="text" v-model.number="widget.state.green" />
								</b-form-group>
							</div> 
							<div class="col-4">
								<b-form-group label="Blue">
									<b-form-input type="text" v-model.number="widget.state.blue" />
								</b-form-group>
							</div>
						</div>
					</div>
				</div>
			</div> 
		</div>

		<div class="card" v-if="system.enabled.hardware">
			<div class="card-body">
				<h4>Hardware Mirroring</h4>
				<div class="row">
					<div class="col">
						<b-form-group label="Hardware To Reflect">
							<b-form-select v-model="widget.monitor.widgetIndex" :options="hardwareWidgets" />
						</b-form-group>
					</div>
					<div class="col" v-if="widget.monitor.widgetIndex>=0">
						<b-form-group label="Reflect When">
							<b-form-select v-model="widget.monitor.level" :options="[{
								text: 'Off',
								value: -1
							},{
								text: 'Always',
								value: 0
							},{
								text: 'Low +',
								value: 1
							},{
								text: 'Medium +',
								value: 2
							},{
								text: 'High',
								value: 3
							}]" />
						</b-form-group>
					</div>
					<div class="col" v-if="widget.monitor.widgetIndex>=0">
						<b-form-group label="Show as Chart?">
							<b-form-select v-model="widget.monitor.analyze" :options="[{text:'No',value:0},{text:'Yes',value:1}]" />
						</b-form-group>
					</div>
				</div>
			</div>
		</div>
		
		<hr>

		<div class="btn btn-secondary" @click="$emit('close')">Close</div>
	</div>
</template>

<script> 
	import VueColor from 'vue-color';
	export default {
		props: ['widget','system'],
		computed: {
			colors(){
				return this.system.colorsParsed;
			},
			targetDevices(){
				let list = [];
				this.system.rgbDevices.forEach((device)=>{
					return list.push({
						text: device.name,
						value: device.id
					});
				});
				return list;
			},
			hardwareWidgets(){
				let list = [{
					text: '-- Disabled --',
					value: -1
				}];
				this.system.hardwareWidgets.forEach((widget,index)=>{
					return list.push({
						text: widget.text,
						value: index
					});
				});
				return list;
			}
		},
		methods: {
			getTargetZones(device) {
				let list = [];
				this.system.rgbDevices.forEach((d)=>{
					if(d.id != device) return;
					return d.zones.forEach((zone)=>{
						return list.push({
							text: zone.name + ' (' + zone.ledsCount + ')',
							value: zone.id
						});
					});
				});
				return list;
			},
			getRgb(){
				return {
					argb: {
						r: this.widget.state.red,
						g: this.widget.state.green,
						b: this.widget.state.blue
					}
				};
			},
			setRgb(color) {
				this.widget.state.red = color.rgba.r;
				this.widget.state.green = color.rgba.g;
				this.widget.state.blue = color.rgba.b;
			}
		},
		components: {
			ColorPicker: VueColor.Compact
		}
	}
</script>