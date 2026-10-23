import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSettings, validateComposition, validateOrder, checkTheme } from './theme-contracts.mjs';
import { resolve } from 'node:path';

test('rejects an invalid select default and duplicated IDs/options', () => {
  const errors = validateSettings([{id:'layout',type:'select',default:'missing',options:[{value:'grid'},{value:'grid'}]},{id:'layout',type:'text'}]);
  assert.equal(errors.length, 3);
});
test('range defaults must be valid and aligned, including a valid zero', () => {
  assert.deepEqual(validateSettings([{id:'top',type:'range',min:0,max:200,step:4,default:0}]), []);
  assert.equal(validateSettings([{id:'top',type:'range',min:0,max:200,step:4,default:3}]).length, 1);
  assert.equal(validateSettings([{id:'top',type:'range',min:0,max:200,step:0,default:0}]).length, 1);
});
test('blocks keep native composition models and preset references valid', () => {
  assert.equal(validateComposition({blocks:[{type:'@theme'},{type:'card'}]}).length, 1);
  assert.equal(validateComposition({blocks:[{type:'card'}],presets:[{name:'Grid',blocks:[{type:'missing'}]}]}).length, 1);
  assert.deepEqual(validateComposition({blocks:[{type:'@app'},{type:'card'}],presets:[{blocks:[{type:'card'}]}]}), []);
});
test('template ordering catches missing and duplicated IDs', () => {
  assert.equal(validateOrder({main:{}}, ['main','missing','main']).length, 2);
});
test('current deployable theme satisfies source contracts', () => {
  assert.deepEqual(checkTheme(resolve(import.meta.dirname, '../theme')), []);
});
