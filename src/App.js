import React from 'react'
import Builder from './builder/Builder'
import Map from './map/Map'

import './App.css'

import Map1 from './data/Map1'

const BUILDER = true
const SHOW_MAP = false

class App extends React.Component {
    render() {
        return (
            <div className="app" style={Map1.dimensions}>
                {(BUILDER || SHOW_MAP) && <Builder showMapOnly={!BUILDER} mapData={Map1}/>}
            </div>
        )
    }
}

export default App