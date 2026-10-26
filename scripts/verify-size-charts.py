"""Optional Liquid fixture verification: run with python-liquid available on PYTHONPATH.

The renderer is a validation tool only, not a storefront/project dependency. Shopify Theme Check
and a live product preview remain authoritative for Shopify-specific drops and schema validation.
Fixtures below are synthetic test data, never uploaded to the catalog.
"""
from pathlib import Path
import re
from liquid import Environment, FileSystemLoader

root = Path(__file__).resolve().parents[1]
snippets = root / 'theme' / 'snippets'
env = Environment(loader=FileSystemLoader(str(snippets), ext='.liquid'))
env.add_filter('t', lambda value, **kwargs: value)
env.add_filter('metafield_tag', lambda field: field.get('value', '') if isinstance(field, dict) else field)
env.add_filter('newline_to_br', lambda value: str(value).replace('\n', '<br />'))

def chart(value=52):
    return {'table': {'value': {'columns': [{'key': 'chest', 'label': 'Chest'}],
            'rows': [{'size': 'M', 'values': {'chest': value}}]}},
            'unit': {'value': 'cm'}, 'measurement_basis': {'value': 'Garment, flat'}}

def collection(handle, priority=1000, value=52):
    return {'id': handle, 'handle': handle, 'metafields': {'custom': {
        'size_chart': {'value': chart(value)}, 'size_chart_priority': {'value': priority}}}}

def context():
    return {'product': {'id': 'product', 'title': 'Fixture Shirt', 'type': 'Shirt',
            'collections': [collection('z-shirts', 20, 54), collection('a-shirts', 10, 50)],
            'metafields': {'custom': {}}}, 'settings': {}, 'metaobjects': {'size_chart': {}}}

def resolve(data):
    return env.get_template('size-chart-assignment').render(**data).strip()

def check(data, expected):
    actual = resolve(data)
    assert actual == expected, (actual, expected)

data = context(); check(data, 'collection:a-shirts')
data['product']['collections'].reverse(); check(data, 'collection:a-shirts')
data['product']['collections'] = [collection('z-shirts', 10), collection('a-shirts', 10)]
check(data, 'collection:a-shirts')
data['product']['metafields']['custom']['size_chart_collection'] = {'value': {'id': 'z-shirts'}}
check(data, 'collection:z-shirts')
data['product']['metafields']['custom']['size_chart_collection'] = {'value': collection('not-a-member', 1)}
check(data, 'collection:a-shirts')
data['product']['metafields']['custom']['size_chart'] = {'value': chart(60)}
check(data, 'product')
data['product']['metafields']['custom']['size_chart'] = {'value': {}}
data['product']['metafields']['custom']['measurements'] = {'value': chart()['table']['value']}
check(data, 'json')
data = context()
data['settings'].update(size_chart_4_products=[{'id': 'product'}], size_chart_4_table='Size,Chest\nM,60')
check(data, 'rule:4')
data = context(); data['product']['collections'] = [{'id': 'shirts', 'handle': 'shirts'}]
data['settings'].update(size_chart_2_collections=[{'id': 'shirts'}], size_chart_2_table='Size,Chest\nM,55')
check(data, 'rule:2')
data = context(); data['product']['collections'] = []
check(data, '')
data['settings']['size_chart_default_handle'] = 'default-shirt'
data['metaobjects']['size_chart']['default-shirt'] = chart(56)
check(data, 'default')
data['metaobjects']['size_chart']['default-shirt'] = {}
check(data, '')

# Render both existing surfaces with the exact same assigned object.
def render(name, **kwargs):
    source = (snippets / f'{name}.liquid').read_text(encoding='utf-8')
    source = re.sub(r'{%-?\s*doc\s*-?%}.*?{%-?\s*enddoc\s*-?%}', '', source, flags=re.S)
    return env.from_string(source).render(**kwargs)

data = context(); product = data['product']; product['options_with_values'] = [{'name': 'Size', 'values': ['M']}]
assigned = chart(57)
guide = render('size-chart', product=product, chart=assigned, option='Size')
panel = render('product-measurements', product=product, chart=assigned, size_option={'values': ['M']})
assert 'data-value="57"' in guide and 'data-measure-value="57"' in panel
assert 'unit="cm"' in guide and 'data-base-unit="cm"' in panel
assert 'data-size-row="M"' in guide and 'data-measurement-row="M"' in panel
notes_only = {'notes': {'value': 'Contact us for sizing'}}
product['metafields']['custom']['measurements'] = {'value': chart()['table']['value']}
panel = render('product-measurements', product=product, chart=notes_only, table_csv='Size,Chest\nM,999')
assert 'data-measure-value=' not in panel  # Never mix lower-priority numbers with assigned instructions.
guide = render('size-chart', product=product, chart=assigned, show_units=False, highlight=False)
panel = render('product-measurements', product=product, chart=assigned, show_units=False)
assert 'data-ref="unit"' not in guide and 'data-highlight-disabled' in guide
assert 'data-measure-unit=' not in panel and 'data-unit-switch-disabled' in panel
main = (root / 'theme/sections/main-product.liquid').read_text(encoding='utf-8')
initial = '{% liquid\n' + re.search(r"  assign eligible_collections = .*\n  assign primary_collection = .*", main).group() + '\n%}'
lookup = env.from_string(initial + '{{ primary_collection.handle }}')
fixture_product = {'collections': [{'handle': 'all'}, {'handle': 'frontpage'}, {'handle': 'shirts'}, {'handle': 'linen'}], 'has_only_default_variant': True}
assert lookup.render(product=fixture_product, settings={}).strip() == 'shirts'
assert lookup.render(product=fixture_product, settings={}, collection={'handle': 'linen'}).strip() == 'linen'
print('size chart Liquid fixtures: hierarchy, priorities, shared data, units and instructions pass')
for labels, expected in [(['S','M','L','XL'],'true'), (['39','40','42'],'false'), (['28','30','32'],'false'), (['M','42'],'false'), (['Small','Medium','Large'],'true')]:
    assert env.get_template('fit-option-supported').render(option={'values': labels}).strip() == expected, labels
print('fit eligibility: apparel supported; footwear, numeric waist and mixed scales excluded')

# Both storefronts render the same source values; abbreviated labels never change row matching.
env.add_filter('t', lambda value, **kwargs: {'product.size_names.s': 'Small'}.get(value, value))
product['metafields']['custom']['size_chart'] = {'value': assigned}
carousel = env.get_template('carousel-measurements').render(product=product, size_option={'values': ['S', 'M']})
assert 'data-measure-value="57"' in carousel and 'data-measurement-size-label="S">Small (S)' in carousel
assert env.get_template('size-display-label').render(value='42').strip() == '42'
featured = (root / 'theme/sections/featured-collection.liquid').read_text(encoding='utf-8')
assert 'data-browse-only' in featured
# Featured collections also support an opt-in purchase branch now. The size-chart
# compatibility fixture must not require deleting that independently implemented feature.
print('size chart compatibility fixtures and browse-only carousel markup pass')

# Product/collection/tag rules share the actual Liquid resolver, not a JS/Python rewrite.
data = context(); data['product']['collections'] = []; data['product']['tags'] = ['Linen', 'Summer, 2026']
data['settings'].update(size_chart_1_tags='  linen  \nother', size_chart_1_handle='linen-shirt')
data['metaobjects']['size_chart']['linen-shirt'] = chart(61)
check(data, 'rule:1')  # Admin-managed metaobject works without CSV.
data['settings']['size_chart_1_tags'] = 'lin\nshirt'
check(data, '')  # Never match substrings.
data['settings']['size_chart_1_tags'] = '\n  \nSUMMER, 2026\n'
check(data, 'rule:1')  # Commas inside tags are preserved; blank lines ignored.
data['settings'].update(size_chart_2_tags='Linen', size_chart_2_table='Size,Chest\nM,99')
check(data, 'rule:1')  # First usable rule within a scope wins.
data['metaobjects']['size_chart']['linen-shirt'] = {}
check(data, 'rule:2')  # Empty Admin entry does not hide usable later rules.
data['settings']['size_chart_1_handle'] = 'missing'
check(data, 'rule:2')  # Missing/draft/inaccessible entries resolve blank.
data['settings']['size_chart_1_table'] = 'Size,Chest\nM,58'
check(data, 'rule:1')  # A legacy CSV remains a valid fallback.
data['settings'].update(size_chart_5_products=[{'id': 'product'}], size_chart_5_table='Size,Chest\nM,63')
check(data, 'rule:5')  # Specific product outranks earlier tag rules.
data['settings']['size_chart_5_products'] = []
data['product']['collections'] = [{'id': 'shirts', 'handle': 'shirts'}]
data['settings'].update(size_chart_4_collections=[{'id': 'shirts'}], size_chart_4_table='Size,Chest\nM,64')
check(data, 'rule:4')  # Collection outranks tag rules.
data['product']['metafields']['custom']['size_chart'] = {'value': chart(65)}
check(data, 'product')
data['product']['metafields']['custom'] = {}; data['product']['collections'] = []
data['settings']['size_chart_1_handle'] = 'instructions'
data['metaobjects']['size_chart']['instructions'] = {'notes': {'value': 'Ask us for measurements'}}
check(data, 'rule:1')
carousel = env.get_template('carousel-measurements').render(**data, size_option={'values': ['M']})
assert 'data-measure-value=' not in carousel  # Rule instructions suppress even the rule CSV.
data['metaobjects']['size_chart']['instructions'] = chart(67)
carousel = env.get_template('carousel-measurements').render(**data, size_option={'values': ['M']})
assert 'data-measure-value="67"' in carousel and 'data-measure-value="58"' not in carousel
data['metaobjects']['size_chart']['instructions'] = chart(68)
carousel = env.get_template('carousel-measurements').render(**data, size_option={'values': ['M']})
assert 'data-measure-value="68"' in carousel  # Editing the Admin entry updates the rendered value.
print('Admin chart + exact tag rules: matching, precedence, empty entries, CSV fallback and edits pass')

# Image charts may stand alone, and an assigned image must not leak lower-priority numbers.
from html import escape
env.add_filter('image_url', lambda image, **kwargs: image['url'])
env.add_filter('image_tag', lambda url, **kwargs: f'<img src="{escape(url)}" alt="{escape(kwargs.get("alt", ""))}">')
picture = {'url': '/files/shirt-chart.png', 'alt': 'Shirt measurements in centimetres'}
data = context(); data['product']['collections'] = []; data['product']['tags'] = ['Linen']
data['settings'].update(size_chart_1_tags='Linen', size_chart_1_image=picture)
check(data, 'rule:1')
guide = render('size-chart', product=data['product'], image=picture)
assert '/files/shirt-chart.png' in guide and 'Shirt measurements in centimetres' in guide
assert 'data-ref="unit"' not in guide and '<table' not in guide
image_chart = {'image': {'value': picture}, 'notes': {'value': 'Read the garment measurements.'}}
data['product']['metafields']['custom']['size_chart'] = {'value': image_chart}
check(data, 'product')
guide = render('size-chart', product=data['product'], chart=image_chart, table_csv='Size,Chest\nM,999')
panel = render('product-measurements', product=data['product'], chart=image_chart, table_csv='Size,Chest\nM,999')
assert '/files/shirt-chart.png' in guide and 'data-value="999"' not in guide
assert 'data-measure-value=' not in panel
data['product']['metafields']['custom'] = {}
data['settings'] = {'size_chart_default_handle': 'image-chart'}
data['metaobjects']['size_chart']['image-chart'] = image_chart
check(data, 'default')
data['product']['collections'] = [collection('shirts')]
data['product']['collections'][0]['metafields']['custom']['size_chart']['value'] = image_chart
check(data, 'collection:shirts')
print('Size chart pictures: standalone rule, product/collection/default assignment, alt text and no invented conversion pass')

# Exercise the actual product-section wiring, including rule -> shared guide/panel inputs.
product_setup = re.search(r"when 'variant_picker' -%}\s*{%- liquid(.*?)-%}", main, re.S).group(1)
setup = env.from_string('{% liquid\n' + product_setup + '\n%}{{ size_chart_html }}')
data = context(); data['product']['collections'] = []; data['product']['tags'] = ['Linen']
data['product']['options_with_values'] = [{'name': 'Size', 'values': ['M']}]
data['settings'].update(size_chart_3_tags='Linen', size_chart_3_image=picture)
args = dict(data, block={'settings': {'show_fit_finder': False}}, section={'id': 'fixture'})
guide = setup.render(**args)
assert '/files/shirt-chart.png' in guide and '<table' not in guide
data['settings']['size_chart_3_handle'] = 'admin-chart'
data['metaobjects']['size_chart']['admin-chart'] = chart(72)
guide = setup.render(**args)
assert 'data-value="72"' in guide and '/files/shirt-chart.png' in guide
print('Product-section wiring: tag assignment -> picture and reusable table guide pass')

data = context(); data['product']['collections'] = []
data['settings'].update(size_chart_12_products=[{'id': 'product'}], size_chart_12_table='Size,Chest\nM,73')
check(data, 'rule:12')  # All editor slots, including the spare rule, can actually resolve.
print('Chart slots: the last editor slot (12) resolves')
