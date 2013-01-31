var matrixString = (function() {
    if (('WebKitCSSMatrix' in window) && ('m11' in new WebKitCSSMatrix())) {
        return function(scale,x,y,cx,cy) {
            scale = scale || 1;
            return 'translate3d(' + [ x, y, '0px' ].join('px,') + ') scale3d(' + [ scale,scale,1 ].join(',') + ')';
/*                        return 'matrix3d(' +
                [ scale, '0,0,0,0',
                  scale, '0,0,0,0,1,0',
                  (x + ((cx * scale) - cx)).toFixed(4),
                  (y + ((cy * scale) - cy)).toFixed(4),
                  '0,1'].join(',') + ')'; */
        }
    } else {
        return function(scale,x,y,cx,cy) {
            var unit = (transformProperty == 'MozTransform') ? 'px' : '';
            return 'matrix(' +
                [(scale || '1'), 0, 0,
                (scale || '1'),
                (x + ((cx * scale) - cx)) + unit,
                (y + ((cy * scale) - cy)) + unit
                ].join(',') + ')';
        }
    }
})();
