const TILE_SIZE = 256;

class GeoJson2Svg {
    constructor(data) {
        this._data = data;
    }

    convert(countryCode) {
        let data = this._data.find(node => node.iso_3166_1_alpha_2_codes == countryCode);
        if (!data) {
            throw new Error(`No map found for ${countryCode}`);
        }
        let geometry = data.geo_shape.geometry;
        let shapes = geometry.type == 'Polygon' ? geometry.coordinates : geometry.coordinates.flatMap(e => e);
        let projectedShapes = shapes.map(e => e.map(this._projectCoord));

        let boundingBox = this._boundingBox(projectedShapes);

        let strokeWidth = Math.max(boundingBox.width, boundingBox.height) / 500;
        let paths = projectedShapes.map(e => this._toPath(e)).join('');
        let viewBox = `${boundingBox.minX} ${boundingBox.minY} ${boundingBox.width} ${boundingBox.height}`;
        return `<svg baseprofile="tiny" viewBox="${viewBox}" fill="#307bbb" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" version="1.2" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
    }

    _toPath(coordinates) {
        let d = "M" + coordinates.map(coord => coord[0] + " " + coord[1]).join(" L") + " Z";
        return `<path d="${d}"/>`;
    }

    //Mercator projection from https://developers.google.com/maps/documentation/javascript/examples/map-coordinates
    _projectCoord(coord) {
        let siny = Math.sin((coord[1] * Math.PI) / 180);

        siny = Math.min(Math.max(siny, -0.9999), 0.9999);
      
        return [
          TILE_SIZE * (0.5 + coord[0] / 360),
          TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
        ];
    }

    _boundingBox(shapes) {
        let minX = Math.min(...shapes.flatMap(e => e).map(e => e[0]));
        let maxX = Math.max(...shapes.flatMap(e => e).map(e => e[0]));
        let minY = Math.min(...shapes.flatMap(e => e).map(e => e[1]));
        let maxY = Math.max(...shapes.flatMap(e => e).map(e => e[1]));
        let width = maxX - minX;
        let height = maxY - minY;
        return {
            minX: minX,
            minY: minY,
            width : width,
            height : height
        }
    }
}

export default GeoJson2Svg;