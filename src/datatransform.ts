'use strict'

import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import PrimitiveValue = powerbi.PrimitiveValue;


interface VData {
    values: PrimitiveValue[],
    table: string,
    column: string
}

export function dataTransform(options: VisualUpdateOptions): VData {
    let data: VData
    try {
        const dataView = options.dataViews[0]
        const cat = dataView.categorical.categories[0]
        const dotIx = cat.source.queryName.indexOf( '.')
        data = {
            values: cat.values,
            table: cat.source.queryName.substring(0, dotIx),
            column: cat.source.queryName.substring(dotIx + 1)
        }
    } catch (error) {
        data = {
            values: [],
            column: '',
            table: ''
        }
    }
    return data
}
