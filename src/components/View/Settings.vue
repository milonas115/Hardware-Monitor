<template>
	<div class="container-fluid p-3">

		<div class="row">
			<div class="col">
				<b-form-group label="Hardware Monitor Enabled">
					<b-form-select v-model="system.enabled.hardware" :options="[{text:'Yes',value:true},{text:'No',value:false}]" />
				</b-form-group>
			</div>
			<div class="col">
				<b-form-group label="RGB Sync Enabled">
					<b-form-select v-model="system.enabled.rgb" :options="[{text:'Yes',value:true},{text:'No',value:false}]" />
				</b-form-group>
			</div>
			<div class="col">
				<b-form-group>
					<template #label>&nbsp;</template>
					<div class="btn btn-secondary" @click="system.saveConfiguration()">Save</div>
					<div class="btn btn-secondary" @click="system.loadConfiguration()">Load</div>
				</b-form-group>
			</div>
		</div>

		<div class="card mb-3" v-if="system.enabled.hardware">
			<div class="card-body">
				<h4>HWiNFO64 Config</h4>
				<div class="row">
					<div class="col">
						<b-form-group label="IP">
							<b-form-input v-model="system.config.hardware.ip" />
						</b-form-group>
					</div>
					<div class="col">
						<b-form-group label="IP">
							<b-form-input v-model.number="system.config.hardware.port" />
						</b-form-group>
					</div> 
				</div>
			</div>
		</div>

		<div class="card mb-3" v-if="system.enabled.rgb">
			<div class="card-body">
				<h4>openRGB Config</h4>
				<div class="row">
					<div class="col">
						<b-form-group label="IP">
							<b-form-input v-model="system.config.rgb.ip" />
						</b-form-group>
					</div>
					<div class="col">
						<b-form-group label="IP">
							<b-form-input v-model.number="system.config.rgb.port" />
						</b-form-group>
					</div> 
				</div>
			</div>
		</div>
			
		<div  v-if="system.enabled.hardware">
			<div v-for="level in ([0,1,2,3])" :key="level" >
				<div class="card mb-3">
					<div class="card-body">
						<h4>Level {{ level }} Settings</h4>
						<div class="row">
							<div class="col">
								<b-form-group label="Peak Ratio">
									<b-form-input v-model="system.hardwareLevels[level].peak" />
								</b-form-group>
							</div>
							<div class="col">
								<b-form-group label="RGB Chart Color">
									<b-form-input v-model="system.hardwareLevels[level].color" />
								</b-form-group>
							</div>
							<div class="col">
								<b-form-group label="RGB Sync Red" v-if="system.enabled.rgb">
									<b-form-input v-model.number="system.hardwareLevels[level].rgb.red" />
								</b-form-group>
							</div>
							<div class="col">
								<b-form-group label="RGB Sync Green" v-if="system.enabled.rgb">
									<b-form-input v-model.number="system.hardwareLevels[level].rgb.green" />
								</b-form-group>
							</div>
							<div class="col">
								<b-form-group label="RGB Sync Blue" v-if="system.enabled.rgb">
									<b-form-input v-model.number="system.hardwareLevels[level].rgb.blue" />
								</b-form-group>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div v-if="system.enabled.rgb">
			<div class="card">
				<div class="card-body">
					<h4>RGB Sync Quick Colors</h4>
					<div class="row">
						<div class="col">
							<draggable v-model="system.colors" handle=".item">
								<div class="mb-1" v-for="(color,i) in system.colors" :key="i">
									<div class="row"> 
										<div class="col">
											<b-form-input class="item" size="sm" v-model="system.colors[i]" />
										</div> 
										<div class="col">
											<div class="btn btn-sm mr-1" :style="{backgroundColor:system.colors[i]}" @click="$refs.wheel.hex=color"><i class="fa fa-upload"></i></div>
											<div class="btn btn-sm btn-light" @click="system.colors[i]=$refs.wheel.hex"><i class="fa fa-download"></i></div>
											<div class="btn btn-sm btn-danger" @click="system.colors.splice(i,1)"><i class="fa fa-remove"></i></div>
										</div>
									</div>
								</div>
							</draggable>
							<span class="text-primary" @click="system.colors.push('#000000')">Add Color</span>
						</div>
						<div class="col">
							<color-wheel ref="wheel" v-model="colorWheel" show-hex />
							<div class="btn btn-primary mt-2" @click="previewColor">Preview Color</div>
						</div>
					</div>
				</div>
			</div>
		</div>

	</div>
</template>

<script>
	import draggable from 'vuedraggable';
	export default {
		props: ['system'],
		data(){
			return {
				colorWheel: {
					red: 255,
					green: 0,
					blue: 0
				}
			};
		},
		methods: {
			previewColor(){
				return this.system.previewRGBColor(this.colorWheel,5000);
			}
		},
		components: {
			draggable
		}
	}
</script>