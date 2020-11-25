<style lang="scss" scoped>
	.layout-panel {
		position: relative;
		max-width: 100vw;
		& > .layout-panel-content {
			& > .layout-container {
				height: 100%;
			}
		}
	}
</style>

<script>
	import { uppercaseWords, isMediaBreakpointDown, isArray } from '@/utils.js';
	export default {
		props: {
			bg: {
				type: String,
				default: ''
			},
			text: {
				type: String,
				default: ''
			},
			collapse: {
				type: Boolean,
				default: false
			},
			collapseDirection: {
				type: String,
				default: 'left'
			},
			content: {
				type: Boolean,
				default: false
			},
			fill: {
				type: Boolean,
				default: false
			},
			pad: {
				type: Boolean,
				default: false
			},
			scroll: {
				type: Boolean,
				default: false
			},
			width: {
				type: String,
				default: null
			}
		},
		render(h){
			let panel = h('div',{
				class: ['layout-panel',this.panelClass],
				style: this.panelStyle
			},[]);

			if(this.scroll)
			{
				panel.children.push(h('div',{
					class: 'layout-panel-content mh-100 h-100 overflow-auto' + (this.pad ? ' p' : ''),
					ref: 'scrolling'
				},this.$slots.default));
			}
			else 
			{
				let child = isArray(this.$slots.default) ? this.$slots.default : (this.$slots.default ? [this.$slots.default] : []);
				panel.children.push(...child);
			}



			return panel;
		},
		mounted(){
			this.$forceUpdate();
		},
		computed: {
			panelStyle(){
				let style = {};
				if(this.width)
				{
					style.width = this.width;
					style.maxWidth = this.width;
					style.minWidth = this.width;
					if(this.collapse) style['margin' + uppercaseWords(this.collapseDirection)] = '-'+this.width;
				}
				return style;
			},
			panelClass(){
				let classList = [];
				if(this.bg) classList.push('bg-'+this.bg);
				if(this.text) classList.push('text-'+this.text);
				if(!this.content) classList.push('d-flex','overflow-hidden');
				if(this.fill) classList.push('flex-fill');
				if(this.scroll) classList.push('overflow-hidden');
				if(this.content && this.scroll) classList.push('d-flex','flex-column');
				if(this.pad && !this.scroll) classList.push('p');
				return classList;
			}
		}
	};
</script>