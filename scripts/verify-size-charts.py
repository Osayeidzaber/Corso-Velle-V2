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

# Both storefronts render the same source values; abbreviated labels never change row matching.
env.add_filter('t', lambda value, **kwargs: {'product.size_names.s': 'Small'}.get(value, value))
product['metafields']['custom']['size_chart'] = {'value': assigned}
carousel = env.get_template('carousel-measurements').render(product=product, size_option={'values': ['S', 'M']})
assert 'data-measure-value="57"' in carousel and 'data-measurement-size-label="S">Small (S)' in carousel
assert env.get_template('size-display-label').render(value='42').strip() == '42'
featured = (root / 'theme/sections/featured-collection.liquid').read_text(encoding='utf-8')
assert 'data-browse-only' in featured
assert 'data-ref="sizes"' not in featured and 'data-ref="measurements"' not in featured and 'data-ref="add"' not in featured
assert "render 'carousel-product-data'" not in featured
print('size chart compatibility fixtures and browse-only carousel markup pass')
