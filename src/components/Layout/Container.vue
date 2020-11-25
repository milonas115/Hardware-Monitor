<template>
	<div class="layout-container d-flex flex-fill overflow-hidden" :class="containerClass">
		<slot></slot>
	</div>
</template>

<style lang="scss" scoped>
	.layout-container {
		position: relative;
	}
</style>

<script>
	export default {
		props: {
			bg: {
				type: String,
				default: ''
			},
			fill: {
				type: Boolean,
				default: false
			},
			horitontal: {
				type: Boolean,
				default: false
			},
			vertical: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			containerClass(){
				let classList = [];
				if(this.vertical)
					classList.push('flex-column');
				else 
					classList.push('flex-row');
				if(this.fill)
					classList.push('h-100');
				if(this.bg)
					classList.push('bg-'+this.bg);
				return classList;
			}
		}
	};
</script>