<template>
	<div>
		<div class="navbar navbar-dark bg-primary py-1">
			<div class="btn btn-sm btn-secondary" @click="addArea"><i class="fa fa-plus"></i> Add Area</div>
			<div class="d-flex">
				<div class="btn btn-sm" :class="{'btn-gray':!globalRainbow,'btn-light':globalRainbow}" @click="globalRainbow=!globalRainbow"><i class="fa fa-circle-o-notch"></i></div>
				<color-picker class="form-control form-control-sm mr-1 bg-gray ml-2" :value="getRgb(null)" @input="setRgb(null,$event) && setGlobalColor()" :palette="colors" />
			</div>
		</div>
		<div v-if="globalRainbow" class="navbar navbar-dark bg-primary py-1">
			<div class="d-flex">
				<div class="btn btn-sm btn-primary">Length</div>
				<b-form-input style="max-width:60px" class="mr-2" size="sm" v-model.number="globalRainbowLength" />
				<div class="btn btn-sm btn-primary">Rotate</div>
				<b-form-input style="max-width:60px" class="mr-2" size="sm" v-model.number="globalRainbowRotate" />
			</div>
		</div>
		
			<table class="table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Color</th>
						<th>Actions</th>
					</tr>
				</thead>
				<draggable ref="draggable" v-model="system.rgbWidgets" handle=".handle" tag="tbody" >
					<tr v-for="(widget,index) in system.rgbWidgets" :key="index">
						<td>
							<div class="btn btn-sm btn-secondary handle mr-2"><i class="fa fa-bars"></i></div>
							{{ widget.name }}
						</td>
						<td>
							<div class="btn btn-sm mr-2" :class="{'btn-gray':!widget.rainbow.enabled,'btn-light':widget.rainbow.enabled}" @click="widget.rainbow.enabled=!widget.rainbow.enabled"><i class="fa fa-circle-o-notch"></i></div>
							<color-picker class="form-control form-control-sm" :value="getRgb(widget)" @input="setRgb(widget,$event)" :palette="colors" />
						</td>
						<td>
							<div class="btn btn-sm btn-secondary" @click="$emit('edit',widget)"><i class="fa fa-pencil"></i></div>
							<div class="btn btn-sm btn-danger ml-2" @click="system.rgbWidgets.splice(system.rgbWidgets.indexOf(widget),1)"><i class="fa fa-remove"></i></div>
						</td>
					</tr>
				</draggable>
			</table>
		

	</div>
</template>

<style lang="scss">
	table .vc-compact.form-control {
		background-color: #333;
	}
	.vc-compact.form-control {
		display: inline-block;
		width: auto;
	}
	.vc-compact-colors {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		height: 100%;
		.vc-compact-color-item {
			margin-bottom: 2px !important;
			margin-top: 2px !important;
			float: none !important;
		}
	}
</style>

<script>
import VueColor from 'vue-color';
import Draggable from 'vuedraggable';
import { debounce } from '@/utils.js';
export default {
	props: ['system'],
	data(){
		return {
			globalRainbow: false,
			globalRainbowLength: 360,
			globalRainbowRotate: 0,
			globalColor: {
				red: null,
				green: null,
				blue: null
			}
		};
	},
	computed: {
		colors(){
			return this.system.colorsParsed;
		},
		tableItems(){
			let items = [];
			this.system.rgbWidgets.forEach((widget)=>{
				items.push({
					name: widget.name,
					color: widget.state,
					actions: null,
					widget: widget
				});
			});
			return items;
		}
	},
	watch: {
		globalRainbow(){
			return this.setGlobalRainbow();
		},
		globalRainbowLength: debounce(function(){
			return this.setGlobalRainbow();
		},250),
		globalRainbowRotate: debounce(function(){
			return this.setGlobalRainbow();
		},250),
		tableItems: {
			immediate: true,
			deep: true,
			handler(){
				if(this.system.rgbWidgets.length === 0) return;
				let rgb = {
					red:this.system.rgbWidgets[0].state.red,
					green:this.system.rgbWidgets[0].state.green,
					blue:this.system.rgbWidgets[0].state.blue
				};
				let rainbow = this.system.rgbWidgets[0].rainbow.enabled;
				let rainbowLength = this.system.rgbWidgets[0].rainbow.length;
				let rainbowRotate = this.system.rgbWidgets[0].rainbow.rotate;

				let rgbChanged = false;
				let rainbowChanged = false;
				let rainbowLengthChanged = false;
				let rainbowRotateChanged = false;

				this.system.rgbWidgets.forEach((widget)=>{
					if(widget.state.red != rgb.red)
						rgbChanged = true;
					if(widget.state.green != rgb.green)
						rgbChanged = true;
					if(widget.state.blue != rgb.blue)
						rgbChanged = true;
					if(widget.rainbow.enabled != rainbow)
						rainbowChanged = true;
					if(widget.rainbow.length != rainbowLength)
						rainbowLengthChanged = true;
					if(widget.rainbow.rotate != rainbowRotate)
						rainbowRotateChanged = true;
					return;
				});

				if(!rgbChanged)
					this.globalColor = rgb;
				if(!rainbowChanged)
					this.globalRainbow = rainbow;
				if(!rainbowLengthChanged)
					this.globalRainbowLength = rainbowLength;
				if(!rainbowRotateChanged)
					this.globalRainbowRotate = rainbowRotate;

				return;
			}
		}
	},
	methods: {
		getRgb(widget){
			if(!widget) widget = {state:this.globalColor};
			return {
				r: widget.state.red,
				g: widget.state.green,
				b: widget.state.blue
			};
		},
		setRgb(widget,color) {
			if(!widget) widget = {state:this.globalColor};
			widget.state.red = color.rgba.r;
			widget.state.green = color.rgba.g;
			widget.state.blue = color.rgba.b;
			return this;
		},
		addArea(){
			let widget = this.system.createRgbWidget();
			this.$emit('edit',widget);
		},
		setGlobalColor(){
			this.system.rgbWidgets.forEach((widget)=>{
				widget.state.red = this.globalColor.red || 0;
				widget.state.green = this.globalColor.green || 0;
				widget.state.blue = this.globalColor.blue || 0;
			});
		},
		setGlobalRainbow(){
			this.system.rgbWidgets.forEach((widget)=>{
				widget.rainbow.enabled = this.globalRainbow;
				if(widget.rainbow.enabled)
				{
					widget.rainbow.length = parseInt(this.globalRainbowLength);
					widget.rainbow.rotate = parseInt(this.globalRainbowRotate);
				}
				return;
			});
		}
	},
	components: {
		ColorPicker: VueColor.Compact,
		Draggable: Draggable
	}
}
</script>