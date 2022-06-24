/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict"

import "./../style/visual.less"
import powerbi from "powerbi-visuals-api"
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions
import IVisual = powerbi.extensibility.visual.IVisual
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions
import VisualObjectInstance = powerbi.VisualObjectInstance
import DataView = powerbi.DataView
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject
import IVisualHost = powerbi.extensibility.visual.IVisualHost
import { IBasicFilter, FilterType } from 'powerbi-models'

import { VisualSettings } from "./settings"

import { dataTransform } from "./datatransform"

export class Visual implements IVisual {
    private target: HTMLElement
    private host: IVisualHost
    private container: HTMLElement
    private menuItems: HTMLElement
    private settings: VisualSettings
    private basicFilter: IBasicFilter
    private filterSet: boolean

    constructor(options: VisualConstructorOptions) {
        // console.log('Visual constructor', options)
        this.target = options.element
        this.host = options.host
        if (document) {
            this.container = document.createElement('div')
            this.container.setAttribute('class', 'menu-container')
            this.menuItems = document.createElement('ul')
            this.container.appendChild(this.menuItems)
            this.target.appendChild(this.container)
            this.filterSet = false
        }
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0])
        let data = dataTransform(options)
        let style = document.documentElement.style
        style.setProperty('--h-padding', `${this.settings.menuButton.paddingX}px`)
        style.setProperty('--v-padding', `${this.settings.menuButton.paddingY}px`)
        style.setProperty('--h-margin', `${this.settings.menuButton.marginX}px`)
        style.setProperty('--v-margin', `${this.settings.menuButton.marginY}px`)
        style.setProperty('--font-family', this.settings.menuButton.fontFamily)
        style.setProperty('--font-size', `${this.settings.menuButton.fontSize}px`)
        style.setProperty('--min-width', `${this.settings.menuButton.minWidth}px`)
        style.setProperty('--border-radius', `${this.settings.menuButton.borderRadius}px`)
        style.setProperty('--color-default', this.settings.menuButton.defaultColor)
        style.setProperty('--color-back', this.settings.menuButton.backColor)
        style.setProperty('--color-back-hover', this.settings.menuButton.hoverColor)
        style.setProperty('--color-selected', this.settings.menuButton.selectedColor)

        if (!this.filterSet) {
            this.basicFilter = {
                $schema: " https://powerbi.com/product/schema#basic",
                target: {
                    table: data.table,
                    column: data.column
                },
                operator: "In",
                values: <(string | number | boolean)[]>data.values,
                filterType: FilterType.Basic
            }
            this.filterSet = true
        }

        while(this.menuItems.firstChild) {
            this.menuItems.removeChild(this.menuItems.firstChild)
        }

        for (let value of data.values) {
            let menuItem = document.createElement('li')
            menuItem.innerText = <string>value
            menuItem.style.textAlign = 'center'
            if (this.settings.menuButton.showBorder) {
                menuItem.style.border = `1px solid ${this.settings.menuButton.defaultColor}`
            }
            menuItem.onclick = (ev: MouseEvent) => {
                if (this.basicFilter.values.length === 1 && this.basicFilter.values[0] === value) {
                    this.basicFilter.values = <(string | number | boolean)[]>data.values
                    this.host.applyJsonFilter(this.basicFilter, 'general', 'filter', powerbi.FilterAction.remove)
                } else {
                    this.basicFilter.values = [<(string | number | boolean)>value]
                    this.host.applyJsonFilter(this.basicFilter, 'general', 'filter', powerbi.FilterAction.merge)
                }
            }
            this.menuItems.appendChild(menuItem)
        }
        this.updateBtnBackground()
    }

    private updateBtnBackground() {
        let menuItems = this.menuItems.children
        for (let i = 0; i < menuItems.length; i++) {
            const menuItem = menuItems[i]
            if (this.basicFilter.values.length !== 1) {
                menuItem.classList.remove('selected')
                menuItem.classList.add('default')
            } else {
                if ((menuItem.textContent === this.basicFilter.values[0])) {
                    menuItem.classList.add('selected')
                    menuItem.classList.remove('default')
                } else {
                    menuItem.classList.add('default')
                    menuItem.classList.remove('selected')
                }
            }
        }
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}
