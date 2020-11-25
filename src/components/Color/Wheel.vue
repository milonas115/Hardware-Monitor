<template>
	<div style="max-width:300px;">
		<color-wheel-picker v-model="hex" />
		<div class="row mt-2">
			<div class="col">
				<b-form-input size="sm" v-model="value.red" />
			</div>
			<div class="col">
				<b-form-input size="sm" v-model="value.green" />
			</div>
			<div class="col">
				<b-form-input size="sm" v-model="value.blue" />
			</div>
		</div>
		<div class="mt-2" v-if="showHex">
			<b-form-input size="sm" :value="hex" @input="hex=$event" />
		</div>
	</div>
</template>

<script>
import colorWheelPicker from 'vue-color-picker-wheel';
import { normalizeRgb, toHex } from '@/colors.js';
export default {
	props: {
		value: {
			type: Object,
			required: true
		},
		showHex: {
			type: Boolean,
			default: false
		}
	},
	data(){
		return {
			hex: toHex(this.value)
		};
	},
	watch: {
		hex(){
			let rgb = normalizeRgb(this.hex);
			if(!rgb) return;
			this.$emit('input',rgb);
		},
		value: {
			deep: true,
			handler(){
				this.hex = toHex(this.value);
			}
		}
	},
	components: {
		colorWheelPicker
	}
}
</script>