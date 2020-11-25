import Vue from 'vue';
import { camelToSnake } from '@/utils.js';

let context;

context = require.context('@/components/.', true, /\.vue$/);
context.keys().forEach(function (key) {
	let component = context(key);
	Vue.component(camelToSnake(key.replace(/^\.\/|.vue$|\//g,''),'-'),component.default||component);
});