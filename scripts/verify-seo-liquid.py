"""Render the actual SEO snippets with synthetic fixtures; never uploads catalog content.

Optional development tool: python-liquid on PYTHONPATH. Shopify's preview is authoritative
for Shopify-specific drops; these fixtures exercise missing data and catalogs we do not own.
"""
from html import unescape
from pathlib import Path
import json
import re
import unittest
from liquid import Environment, FileSystemLoader

root = Path(__file__).resolve().parents[1]
env = Environment(loader=FileSystemLoader(str(root / 'theme/snippets'), ext='.liquid'))
env.add_filter('json', lambda value: json.dumps(value, ensure_ascii=False))
env.add_filter('t', lambda value, **kwargs: f"{kwargs['count']} products" if 'count' in kwargs else (f"Page {kwargs['number']}" if 'number' in kwargs else value))
env.add_filter('image_url', lambda image, **kwargs: f"//cdn.example.test/{image.get('id', 1)}.jpg?width={kwargs.get('width', 100)}")
env.add_filter('image_tag', lambda url, **kwargs: f'<img src="{url}" loading="{kwargs.get("loading", "auto")}" fetchpriority="{kwargs.get("fetchpriority", "auto")}">')
env.add_filter('metafield_text', lambda field: field.get('value', '') if isinstance(field, dict) else str(field))
env.add_filter('structured_data', lambda value: json.dumps({'@type': 'Article', 'headline': value.get('title', '')}))

def render(name, **kwargs):
    return env.get_template(name).render(**kwargs).strip()

def context():
    variant = {'id': 101, 'title': 'M', 'options': ['M'], 'price': 190000, 'compare_at_price': 220000, 'featured_image': '',
               'available': True, 'barcode': '4006381333931', 'sku': 'REAL-M'}
    return {'shop': {'name': 'Fixture Store', 'url': 'https://shop.example.test', 'description': 'Store description'},
            'cart': {'currency': {'iso_code': 'BDT'}}, 'routes': {'root_url': '/'},
            'request': {'page_type': 'product'}, 'settings': {'card_size_option_names': 'Size,Waist'},
            'product': {'id': 1, 'url': '/products/fixture', 'title': 'Fixture Shirt', 'description': '<p>Cotton</p><p>Relaxed fit</p>',
                        'vendor': 'Actual Brand', 'category': '', 'metafields': {'custom': {'fabric': '', 'materials': '', 'color_name': {'value': ''}}, 'shopify': {}},
                        'images': [{'id': 1}], 'featured_image': {'id': 1}, 'has_only_default_variant': False,
                        'options_with_values': [{'name': 'Size'}], 'variants': [variant], 'selected_or_first_available_variant': variant},
            'page_title': 'Fixture Shirt', 'page_description': '', 'current_page': 1, 'canonical_url': 'https://shop.example.test/products/fixture',
            'template': {'name': 'product'}}

def schema(data):
    output = render('structured-data', **data)
    return [json.loads(item) for item in re.findall(r'<script[^>]*>(.*?)</script>', output, re.S)]

class SeoFixtures(unittest.TestCase):
    def test_rich_text_word_boundaries(self):
        self.assertEqual(render('seo-text', text='<p>Cotton</p><p>Relaxed<br>fit</p>\nCare&nbsp;guide'), 'Cotton Relaxed fit Care guide')

    def test_native_description_is_preserved(self):
        data = context(); data['page_description'] = 'Merchant SEO wording & facts ' * 12
        output = unescape(render('meta-tags', **data))
        self.assertIn(f'<meta name="description" content="{data["page_description"].strip()}">', output)

    def test_no_case_variant_duplicate_store_suffix(self):
        data = context(); data['page_title'] = 'Fixture shirt | FIXTURE STORE'
        title = re.search(r'<title>(.*?)</title>', render('meta-tags', **data), re.S)[1]
        self.assertNotIn('&ndash;', title)

    def test_collection_fallback_and_pagination_canonical(self):
        data = context(); data.update(request={'page_type': 'collection'}, collection={'title': 'Linen', 'description': '', 'all_products_count': 7}, current_page=2, canonical_url='https://shop.example.test/collections/linen?page=2')
        output = render('meta-tags', **data)
        self.assertIn('Linen — Fixture Store. 7 products.', output)
        self.assertIn('href="https://shop.example.test/collections/linen?page=2"', output)
        self.assertIn('Page 2', output)
        self.assertNotIn('noindex', output)
        self.assertIn('max-image-preview:large', output)

    def test_search_and_cart_noindex(self):
        for page_type in ['search', 'cart']:
            data = context(); data['request']['page_type'] = page_type
            self.assertIn('content="noindex, follow"', render('meta-tags', **data))

    def test_no_empty_collection_claims(self):
        data = context(); data.update(request={'page_type': 'collection'}, collection={'title': 'Empty', 'description': '', 'all_products_count': 0})
        self.assertNotIn('name="description"', render('meta-tags', **data))

    def test_policy_fallback_uses_native_body(self):
        data = context(); data.update(request={'page_type': 'policy', 'path': '/policies/shipping-policy'})
        data['shop']['policies'] = [{'url': '/policies/shipping-policy', 'body': '<p>Actual shipping terms</p><p>Set in Shopify</p>'}]
        output = render('meta-tags', **data)
        self.assertIn('content="Actual shipping terms Set in Shopify"', output)

    def test_contact_policy_fallback_matches_visible_theme_content(self):
        data = context(); data.update(request={'page_type': 'policy', 'path': '/policies/contact-information'})
        data['shop']['policies'] = [{'url': '/policies/contact-information', 'body': 'Legacy policy text'}]
        data['settings']['support_intro'] = '<p>Current support introduction</p>'
        data['settings']['support_email'] = 'support@example.test'
        data['settings']['support_replace_policy'] = True
        output = render('meta-tags', **data)
        self.assertIn('content="Current support introduction"', output)
        self.assertNotIn('Legacy policy text', output)

    def test_unconfigured_support_retains_native_policy(self):
        data = context(); data.update(request={'page_type': 'policy', 'path': '/policies/contact-information'})
        data['shop']['policies'] = [{'url': '/policies/contact-information', 'body': 'Native merchant contact policy'}]
        data['settings'].update(support_replace_policy=True, support_intro='<p>Default introduction</p>', support_email='', support_phone='', support_instagram='')
        output = render('meta-tags', **data)
        self.assertIn('content="Native merchant contact policy"', output)
        self.assertNotIn('Default introduction', output)

    def test_gtin_checksums(self):
        # Real check-digit examples, used only in synthetic fixtures.
        for barcode in ['96385074', '036000291452', '4006381333931', '10012345000017']:
            self.assertEqual(render('structured-data-gtin', barcode=barcode), barcode)

    def test_bad_gtin_never_claimed(self):
        for barcode in ['', '00000000', '4006381333932', 'ABC1234567890', '123', '123456789012345', '1234 67890123']:
            self.assertEqual(render('structured-data-gtin', barcode=barcode), '')

    def test_offer_values_and_sale_price(self):
        data = context(); group = schema(data)[0]; variant = group['hasVariant'][0]
        self.assertEqual(variant['gtin13'], '4006381333931')
        self.assertEqual(variant['sku'], 'REAL-M')
        self.assertEqual(variant['size'], 'M')
        self.assertEqual(variant['offers']['price'], 1900)
        self.assertEqual(variant['offers']['priceCurrency'], 'BDT')
        self.assertEqual(variant['offers']['priceSpecification']['price'], 2200)
        self.assertEqual(variant['url'], variant['offers']['url'])
        self.assertEqual(group['description'], 'Cotton Relaxed fit')

    def test_sold_out_missing_identifiers_and_conditional_discounts(self):
        data = context(); variant = data['product']['variants'][0]
        variant.update(available=False, sku='', barcode='4006381333932', compare_at_price=180000)
        data['product']['metafields']['custom']['discount_code'] = {'value': 'HALFPRICE'}
        output = schema(data)[0]['hasVariant'][0]
        self.assertNotIn('sku', output); self.assertNotIn('gtin13', output)
        self.assertEqual(output['offers']['availability'], 'https://schema.org/OutOfStock')
        self.assertEqual(output['offers']['price'], 1900)
        self.assertNotIn('priceSpecification', output['offers'])
        self.assertNotIn('HALFPRICE', json.dumps(output))

    def test_selected_variant_outside_liquid_window(self):
        data = context(); original = data['product']['variants'][0]
        data['product']['variants'] = [dict(original, id=index) for index in range(1, 251)]
        selected = dict(original, id=999, title='XL', options=['XL'], price=240000, available=False)
        data['product']['selected_or_first_available_variant'] = selected
        variants = schema(data)[0]['hasVariant']
        self.assertEqual(len(variants), 51)
        self.assertEqual(variants[-1]['offers']['price'], 2400)
        self.assertEqual(variants[-1]['size'], 'XL')
        self.assertIn('variant=999', variants[-1]['url'])

    def test_selected_variant_not_duplicated(self):
        data = context(); variants = schema(data)[0]['hasVariant']
        self.assertEqual(len(variants), 1)

    def test_default_variant_single_product(self):
        data = context(); data['product']['has_only_default_variant'] = True
        product = schema(data)[0]
        self.assertEqual(product['@type'], 'Product')
        self.assertNotIn('hasVariant', product)
        self.assertEqual(product['offers']['price'], 1900)

    def test_custom_size_name_matches_purchase_ui(self):
        data = context(); data['product']['options_with_values'][0]['name'] = 'Waist'
        self.assertEqual(schema(data)[0]['hasVariant'][0]['size'], 'M')

    def test_quotes_and_unicode_produce_valid_json(self):
        data = context(); data['product']['title'] = 'শার্ট "Cotton" \\ Shirt'
        self.assertEqual(schema(data)[0]['name'], data['product']['title'])

    def test_gallery_prioritizes_variant_image_without_lazy_first_frame(self):
        media = [{'id': 1, 'media_type': 'image'}, {'id': 2, 'media_type': 'image'}]
        output = render('product-media', product={'title': 'Fixture', 'media': media}, selected_variant={'featured_media': media[1]}, options={'gallery_layout': 'slider', 'show_thumbnails': False, 'enable_zoom': False, 'show_media_progress': False, 'show_gallery_controls': False})
        self.assertIn('1.jpg?width=1800" loading="eager" fetchpriority="auto"', output)
        self.assertIn('2.jpg?width=1800" loading="eager" fetchpriority="high"', output)
        self.assertEqual(output.count('fetchpriority="high"'), 1)

    def test_collage_prioritizes_visible_first_frame(self):
        media = [{'id': 1, 'media_type': 'image'}, {'id': 2, 'media_type': 'image'}]
        output = render('product-media', product={'title': 'Fixture', 'media': media}, selected_variant={'featured_media': media[1]}, options={'gallery_layout': 'collage', 'show_thumbnails': False, 'enable_zoom': False, 'show_media_progress': False, 'show_gallery_controls': False})
        self.assertIn('1.jpg?width=1800" loading="eager" fetchpriority="high"', output)
        self.assertIn('2.jpg?width=1800" loading="lazy" fetchpriority="auto"', output)

if __name__ == '__main__':
    unittest.main(verbosity=2)
