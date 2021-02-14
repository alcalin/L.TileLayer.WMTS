# L.TileLayer.WMTS

L.TileLayer.WMTS is a Leaflet.js plugin for creating WMTS Tile layers. It is a simple wrapper over L.TileLayer.

Usage
-----
    let options = {
        tileMatrixSet:'g',
        layer:'bluemarble_3857',
    };

    let wmtsLayer = L.tileLayer.wmts(url, options);

Demo
-----
See [the demo page][demo].

[demo]: https://alcalin.github.io/L.TileLayer.WMTS/example.html

License
-------
This plugin is licensed under the Beerware License,
see LICENSE.md


[leaflet]: http://leafletjs.com
[tl-options]: http://leafletjs.com/reference.html#tilelayer-options