<template>
	<layout-container vertical>
		<layout-panel content>
			<navigation-bar :system="system" />
		</layout-panel>
		<layout-panel id="main-container" scroll content fill>
			<component :is="'view-'+system.currentView" :system="system"></component>
		</layout-panel>
	</layout-container>
</template>
<style>
	.cursor-pointer {
		cursor: pointer;
	}
</style>
<script>
	export default {
		props: ['system']
	}
</script>