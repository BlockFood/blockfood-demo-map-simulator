import * as _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import './App.css'
import '../node_modules/reset-css/reset.css'
import {distance} from './utils/Geometry'
import MAP_DATA from './data/MapData'
import Map from './component/Map'
import MapBuilder from './builder/MapBuilder'

const BUILD_MAP = true

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            step: 0,
            customer: null,
            restaurantSelectedId: null,
            courier: null
        }

        this.canGoNext = this.canGoNext.bind(this)
        this.incrStep = this.incrStep.bind(this)
    }

    getNearRestaurantId(eventPoint) {
        const nearRestaurantId = _.minBy(_.keys(MAP_DATA.restaurants), restaurantId => {
            return distance(MAP_DATA.restaurants[restaurantId].position, eventPoint)
        })

        return distance(MAP_DATA.restaurants[nearRestaurantId].position, eventPoint) < 100 ? nearRestaurantId : null
    }

    canGoNext() {
        const {step, customer, restaurantSelectedId, courier} = this.state

        return !(
            (step === 0 && !customer) ||
            (step === 1 && !restaurantSelectedId) ||
            (step === 2 && !courier) ||
            step === 3 ||
            step === 4
        )
    }

    incrStep() {
        const {step} = this.state
        this.canGoNext() && this.setState({step: step + 1})
    }

    componentDidMount() {
        if (!BUILD_MAP) {
            const mapElement = ReactDOM.findDOMNode(this).querySelector('.mapWrapper')

            mapElement.addEventListener('click', (event) => {
                const {step} = this.state

                const eventPoint = [event.offsetX, event.offsetY]

                if (step === 0) {
                    this.setState({customer: eventPoint})
                }
                else if (step === 1) {
                    const nearRestaurantId = this.getNearRestaurantId(eventPoint)

                    if (nearRestaurantId) {
                        this.setState({restaurantSelectedId: nearRestaurantId})
                    }
                }
                else if (step === 2) {
                    this.setState({courier: eventPoint})
                }
            }, false)
        }
    }

    render() {
        const {step, customer, restaurantSelectedId, courier} = this.state

        return (
            <div className="App">
                <div className="mapWrapper" style={MAP_DATA.dimensions}>
                    <Map src={MAP_DATA.image}
                         roadNodes={MAP_DATA.roadNodes} roadNodesLines={MAP_DATA.roadNodesLines}
                         restaurants={MAP_DATA.restaurants}
                         restaurantSelectedId={restaurantSelectedId}
                         showOnlyRestaurantSelected={step >= 2}
                         customer={customer}
                         courier={courier}
                         pathOptions={{visible: !!courier, path2dasharray: step < 4}}/>
                    {BUILD_MAP && <MapBuilder/>}
                </div>
                <div className="toolbar">
                    <div className={`step${step >= 0 ? ' active' : ''}`}>
                        <i className="fas fa-user"/>
                        <span>Set customer position</span>
                    </div>
                    <div className={`step${step >= 1 ? ' active' : ''}`}>
                        <i className="fas fa-utensils"/>
                        <span>Choose restaurant</span>
                    </div>
                    <div className={`step${step >= 2 ? ' active' : ''}`}>
                        <i className="fas fa-car"/>
                        <span>Set courier position</span>
                    </div>
                    <div className={`step${step >= 3 ? ' active' : ''}`}>
                        <i className="fas fa-paper-plane"/>
                        <span>Simulate courier to restaurant</span>
                    </div>
                    <div className={`step${step >= 4 ? ' active' : ''}`}>
                        <i className="fas fa-paper-plane"/>
                        <span>Simulate courier to customer</span>
                    </div>
                    <nav className={`btn${!this.canGoNext() ? ' disabled' : ''}`} onClick={this.incrStep}>NEXT</nav>
                </div>
            </div>
        )
    }
}

export default App
