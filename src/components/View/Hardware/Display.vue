<template>
	<div class="container-fluid px-2">
		<div :style="{height:rootHeight+'px'}">
			<div class="row h-50" v-for="(chunk,ci) in chunks" :key="ci">
				<div class="col-3 my-1 d-flex justify-content-center align-items-center" v-for="(widget,i) in chunk" :key="i">
					<div class="card bg-dark border-gray h-100 w-100">
						<div class="card-body px-1 py-3 d-flex flex-column justify-content-center align-items-center">
							<template v-if="widget.data">
								<div class="w-100 mb-auto">
									<h4 class="text-center text-truncate mb-2">{{ widget.text }}</h4>
								</div>
								<div class="w-100 mt-auto">
									<view-hardware-gauge :widget="widget" :system="system" />
								</div>
							</template>
							<div class="switcher">
								<div class="btn-group">
									<div class="btn btn-secondary btn-sm" @click="$emit('edit',widget)" ><i class="fa fa-pencil"></i></div>
									<div class="btn btn-secondary btn-sm" @click="system.shiftHardwareWidget(widget,-1)"><i class="fa fa-chevron-left"></i></div>
									<div class="btn btn-secondary btn-sm" @click="system.shiftHardwareWidget(widget,1)"><i class="fa fa-chevron-right"></i></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>


<style lang="scss" scoped>
	.progress {
		height: 4rem;
	}
	.square {
		float: left;
		height: 50%;
		width: 25%;
	}
	.switcher {
		position: absolute;
		bottom: 0;
		right: 0;
		opacity: 0;
		transition: 300ms opacity ease-in-out;
		z-index: 99999;
	}

	.card:hover .switcher {
		opacity: 1;
	}
</style>

<script> 

	import { chunk } from '@/utils.js';
	export default {
		props: ['system'],
		data(){
			return {
				rootHeight: 0
			};
		},
		computed: {
			chunks(){
				return chunk(this.system.hardwareWidgets,4);
			}
		},
		methods: {
			setRootHeight(){
				this.rootHeight = 0;
				window.requestAnimationFrame(()=>{
					this.rootHeight = document.getElementById('main-container').offsetHeight;
				});
			},
			getRatio(widget){
				let before = widget.data.cur - widget.min;
				let after = widget.max - widget.data.cur;
				return before / (before + after);
			}
		},
		mounted(){
			this.setRootHeight();
			window.addEventListener('resize',this.setRootHeight);
		},
		destroyed(){
			window.removeEventListener('resize',this.setRootHeight);
		}
	};
</script>