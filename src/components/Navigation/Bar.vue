<template>
	<nav class="main-navbar navbar navbar-dark bg-dark pt-1 pb-0 px-2">
		<b-dropdown :text="system.currentViewTitle" variant="dark" size="sm" toggle-class="text-light">
			<template v-for="(text,value) in system.views">
				<b-dropdown-item :key="value"  v-if="!(value in system.enabled) || system.enabled[value]" @click="system.setCurrentView(value)" :active="system.currentView === value">{{ text }}</b-dropdown-item>
			</template>
		</b-dropdown>
		<div class="ml-auto">
			<div v-if="!fullscreen" @click="minimize" class="text-light min-window btn btn-sm btn-dark py-1"><i class="fa fa-window-minimize"></i></div>
			<div @click="maximize" class="text-light max-window btn btn-sm btn-dark py-1"><i class="fa fa-window-maximize"></i></div>
			<div v-if="!fullscreen" @click="close" class="text-light close-window btn btn-sm btn-dark py-1"><i class="fa fa-window-close"></i></div>
		</div>
	</nav>
</template>

<style lang="scss">
	.main-navbar {
		position: relative; 
		-webkit-app-region: drag;
		font-size: 80%;
		.btn {
			-webkit-app-region: no-drag;
			font-size: 80%;
		}
		.dropdown {
			-webkit-app-region: no-drag;
			.btn {
				font-size: 100%;
			}
		}
	}
</style>

<script>
	export default {
		props: ['system'],
		data(){
			return {
				fullscreen: this.$getWindow().isFullScreen() || false
			};
		},
		methods: {
			minimize(){
				this.$getWindow().setSkipTaskbar(false);
				this.$getWindow().addListener('restore',()=>{
					return this.$getWindow().setSkipTaskbar(true);
				},{once:true});
				this.$getWindow().minimize();
			},
			maximize(){
				this.fullscreen = this.$getWindow().isFullScreen() ? false : true;
				this.$getWindow().setFullScreen(this.fullscreen);
			},
			close(){
				this.$getWindow().close();
			}
		}
	}
</script>