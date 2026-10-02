#!/bin/sh
# Stamp site.css / site.js links with a content hash so browsers fetch the
# new files after every change. Run after editing the CSS or JS:  sh scripts/bust-cache.sh
cd "$(dirname "$0")/../public" || exit 1
css=$(sha1sum assets/css/site.css | cut -c1-8)
js=$(sha1sum assets/js/site.js | cut -c1-8)
find . -name '*.html' -exec sed -i -E \
  -e "s#/assets/css/site\.css(\?v=[0-9a-f]+)?#/assets/css/site.css?v=$css#g" \
  -e "s#/assets/js/site\.js(\?v=[0-9a-f]+)?#/assets/js/site.js?v=$js#g" {} +
echo "css v=$css  js v=$js"
