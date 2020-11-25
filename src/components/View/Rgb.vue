<template>
	<div class="h-100">
		<template v-if="system.status.rgb === true">
			<view-rgb-display v-if="!widget" :system="system" @edit="widget=$event" />
			<view-rgb-form v-else :system="system" :widget="widget" @close="widget=null" />
		</template>
		<template v-else-if="!system.enabled.rgb">
			<div class="text-center mt-5">
				<h3>RGB Sync Not Enabled</h3>
			</div>
		</template>
		<template v-else>
			<div class="text-center mt-5">
				<h3>Unable to connect to openRGB</h3>
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