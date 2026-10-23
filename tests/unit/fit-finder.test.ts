import { afterEach, expect, it } from 'vitest';
import { FIT_STORAGE_KEY, matchProductSize, recommendSize } from '../../src/components/fit-finder/fit-finder';

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

it('estimates sensible letter sizes and shifts them with shape and fit', () => {
  expect(recommendSize({ sex: 'male', height: 180, weight: 89 })).toBe('L');
  expect(recommendSize({ sex: 'male', height: 175, weight: 70 })).toBe('M');
  expect(recommendSize({ sex: 'female', height: 165, weight: 60 })).toBe('S');
  expect(recommendSize({ sex: 'male', height: 180, weight: 89, fit: 'relaxed' })).toBe('XL');
  expect(recommendSize({ sex: 'male', height: 210, weight: 150 })).toBe('3XL');
});

it('maps onto the product’s own labels and gives up on non-letter sizing', () => {
  expect(matchProductSize('XXL', ['S', 'M', 'L', '2XL'])).toBe('2XL');
  expect(matchProductSize('XS', ['S', 'M', 'L'])).toBe('S');
  expect(matchProductSize('3XL', ['M', 'L', 'XL'])).toBe('XL');
  expect(matchProductSize('M', ['28', '30', '32'])).toBeNull();
});

it('walks the steps, saves the profile and selects the recommended size', () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div data-product-section>
      <nk-variant-picker><fieldset data-size-fieldset>
        <div data-size-pill="M"><input type="radio" value="M"></div>
        <div data-size-pill="L"><input type="radio" value="L"></div>
      </fieldset></nk-variant-picker>
      <button><span data-fit-hint hidden><span data-part="size"></span></span></button>
      <nk-fit-finder sizes="M,L" hidden>
        <p data-ref="counter"></p>
        <div data-ref="step" data-step="1">
          <input type="radio" name="x:sex" value="female" data-ref="choice">
          <input type="radio" name="x:sex" value="male" data-ref="choice">
          <input type="range" data-ref="range" data-field="height" min="140" max="210">
          <input type="range" data-ref="range" data-field="weight" min="40" max="150">
          <button data-ref="nudge" data-field="weight" value="1"></button>
        </div>
        <div data-ref="step" data-step="2" hidden></div>
        <div data-ref="step" data-step="3" hidden><button data-ref="apply"><span data-part="size"></span></button></div>
        <p data-ref="estimate"></p>
        <button data-ref="back"></button><button data-ref="next"></button>
      </nk-fit-finder>
    </div>`;
  document.body.append(wrap);
  const finder = document.querySelector<HTMLElement>('nk-fit-finder')!;
  expect(finder.hidden).toBe(false);
  expect(finder.querySelector('[data-ref="counter"]')!.textContent).toBe('01 / 03');
  expect(document.querySelector('[data-fit-hint]')!.hasAttribute('hidden')).toBe(true);

  const weight = finder.querySelector<HTMLInputElement>('[data-field="weight"][type="range"]')!;
  weight.value = '89';
  weight.dispatchEvent(new Event('input'));
  expect(finder.querySelector('[data-ref="estimate"]')!.textContent).toBe('L');
  expect(JSON.parse(localStorage.getItem(FIT_STORAGE_KEY)!).weight).toBe(89);
  expect(document.querySelector('[data-size-pill="L"]')!.hasAttribute('data-recommended')).toBe(true);
  expect(document.querySelector('[data-fit-hint] [data-part="size"]')!.textContent).toBe('L');

  const next = finder.querySelector<HTMLButtonElement>('[data-ref="next"]')!;
  next.click();
  next.click();
  expect(finder.querySelector<HTMLElement>('[data-step="3"]')!.hidden).toBe(false);
  expect(next.hidden).toBe(true);
  finder.querySelector<HTMLButtonElement>('[data-ref="apply"]')!.click();
  expect(document.querySelector<HTMLInputElement>('input[value="L"]')!.checked).toBe(true);
});
