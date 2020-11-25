import System from '@/classes/System.js';
import Vue from 'vue';
import '@/scss/main.scss';
import '@/components';
import { remote } from 'electron';
import { BootstrapVue } from 'bootstrap-vue';
import log from 'electron-log';

Vue.use(BootstrapVue);

Vue.prototype.$getWindow = function(){
	return remote.BrowserWindow.getFocusedWindow();
};

global.log = log;

process.on('uncaughtException', (err, origin) => {
	log('Application: Uncaught Exception -> ' + err + ' || ' + origin);
});

new System({
	el: '#app-wrapper',
	render(h){
		return h('app',{
			props: {
				system: this
			}
		});
	},
	mounted(){
		log.info('Application: Mounted');
	}
});