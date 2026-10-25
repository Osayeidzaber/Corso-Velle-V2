// Optional development-preview regression. Uses isolated carts and removes test items.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
const results=[];
try {
 for (const width of [390,1440]) {
  const c=await b.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390}); const p=await c.newPage(); p.setDefaultTimeout(15000); const errors=[]; p.on('pageerror',e=>errors.push(e.message));
  try {
   await p.goto('http://127.0.0.1:9292/products/amaya-embroidered-shacket',{waitUntil:'load'});
   await p.waitForFunction(()=>!!customElements.get('nk-gallery')&&!!customElements.get('nk-variant-picker'));
   await p.locator('[data-gallery-thumb="1"]').click();
   await p.waitForFunction(()=>document.querySelector('nk-gallery [data-slide-index="1"]').hasAttribute('data-current'));
   await p.locator('[data-gallery-zoom="1"]').click();
   await p.locator('dialog.gallery-lightbox[open]').waitFor();
   await p.keyboard.press('Escape');
   await p.locator('dialog.gallery-lightbox[open]').waitFor({state:'hidden'});
   if(width===390) {
    await p.getByRole('button',{name:'Menu',exact:true}).click();
    await p.locator('#MenuDrawer dialog[open]').waitFor();
    await p.keyboard.press('Escape');
    await p.locator('#MenuDrawer dialog[open]').waitFor({state:'hidden'});
   }
   
   await p.getByRole('radio',{name:'M',exact:true}).check({force:true});
   await p.waitForFunction(()=>document.querySelector('nk-variant-picker')?.state==='available',null,{timeout:15000});
   const selected=await p.locator('nk-product-form input[name=id]').inputValue();
   const before=await (await c.request.get('http://127.0.0.1:9292/cart.js')).json();
   assert.equal(before.item_count,0,'fresh isolated cart must be empty');
   
   await p.locator('nk-product-form button[type=submit]').click();
   await p.waitForFunction(()=>!!document.querySelector('nk-cart-drawer dialog[open] .cart-line'),null,{timeout:15000});
   const added=await (await c.request.get('http://127.0.0.1:9292/cart.js')).json();
   assert.equal(added.item_count,1); assert.equal(String(added.items[0].variant_id),selected);
   await p.locator('nk-cart-drawer [data-qty-step="1"]').click();
   await p.waitForFunction(()=>document.querySelector('nk-cart-drawer [data-qty-input]')?.value==='2'&&!document.querySelector('nk-cart-drawer [aria-busy=true]'));
   const quantity=await (await c.request.get('http://127.0.0.1:9292/cart.js')).json();
   assert.equal(quantity.item_count,2);
   // Verify the checkout control is a native Shopify form action, without submitting payment.
   const checkout=await p.locator('nk-cart-drawer button[name=checkout]').evaluate(button=>({disabled:button.disabled,action:button.form?.getAttribute('action'),method:button.form?.method}));
   assert.equal(checkout.disabled,false); assert.equal(checkout.method,'post'); assert.equal(checkout.action,'/cart');
   await p.locator('nk-cart-drawer [data-line-remove]').click();
   await p.waitForFunction(()=>!document.querySelector('nk-cart-drawer [data-line-key]'));
   const empty=await (await c.request.get('http://127.0.0.1:9292/cart.js')).json(); assert.equal(empty.item_count,0);
   await p.goto('http://127.0.0.1:9292/collections/all',{waitUntil:'load'});
   await p.waitForFunction(()=>!!customElements.get('nk-facets'));
   await p.locator('[data-sort-menu] summary').click();
   await p.locator('[data-facets-sort-value="price-ascending"]').click();
   await p.waitForURL(/sort_by=price-ascending/);
   await p.waitForFunction(()=>!document.querySelector('nk-facets[aria-busy=true]'));
   const canonical=await p.locator('link[rel=canonical]').getAttribute('href'); assert.equal(canonical,'https://corsovelle.com/collections/all');
   results.push({width,passed:['gallery thumbnails','image lightbox','Escape dismiss','variant M selection','exact variant add','quantity update','native checkout form enabled','remove and empty cart','sort AJAX and canonical',...(width===390?['mobile menu open/close']:[])],checkout,errors});
  } catch(error) { console.log('FAILED',width,error.message); results.push({width,error:error.message,errors}); await p.screenshot({path:`docs/evidence/seo-2026-10-25/regression-failed-${width}.png`}); }
  finally {
   // This is a fresh session whose initial empty state was asserted above. Clear test items only.
   const cart=await (await c.request.get('http://127.0.0.1:9292/cart.js')).json();
   for(const item of cart.items.filter(item=>item.handle==='amaya-embroidered-shacket')) await c.request.post('http://127.0.0.1:9292/cart/change.js',{data:{id:item.key,quantity:0}});
   await c.close();
  }
 }
 await writeFile('docs/evidence/seo-2026-10-25/interactions.json',JSON.stringify(results,null,2)); console.log(JSON.stringify(results,null,2));
 if(results.some(result=>result.error||result.errors?.length)) process.exitCode=1;
} finally {await b.close();}
