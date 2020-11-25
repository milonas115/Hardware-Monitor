<template>
	<div class="h-100">
		<template v-if="system.status.hardware === true">
			<view-hardware-display v-if="!widget" :system="system" @edit="widget=$event" />
			<view-hardware-form v-else :system="system" :widget="widget" @close="widget=null" />
		</template>
		<template v-else-if="!system.enabled.hard">
			<div class="text-center mt-5">
				<h3>Hardware Monitor Not Enabled</h3>
			</div>
		</template>
		<template v-else>
			<div class="text-center mt-5">
				<h3>Unable to connect to HWiNFO64</h3>
				<p>Please make sure it's running and that the server is turned on</p>
			</div>
		</template>
	</div>
</template>

<script>
	export default {
		props: ['system'],
		data(){
			return {
				widget: null
			};
		}
	}
</script>