import * as _ from 'lodash'
import React from 'react'
import Builder from './builder/Builder'
import Map, {STEPS} from './map/Map'

import './App.css'

import Map1 from './data/Map1'
import Map2 from './data/Map2'

const MAPS = [Map1, Map2]

const BUILDER = false
const DEFAULT_MAP_INDEX = 1
const SHOW_MAP = false

class App extends React.Component {
    constructor(props) {
        super(props)

        this.key = 0

        // DEBUG STEP SET_CUSTOMER_POSITION
        this.state = _.merge(this.getInitialState(), {activeMapIndex: DEFAULT_MAP_INDEX})

        // DEBUG STEP CHOOSE_RESTAURANT
        // this.state = _.merge(this.state, {
        //     step: STEPS.CHOOSE_RESTAURANT,
        //     customer: [80, 480]
        // })

        // DEBUG STEP SET_COURIER_POSITION
        // this.state = _.merge(this.state, {
        //     step: STEPS.SET_COURIER_POSITION,
        //     customer: [80, 480],
        //     restaurantSelectedIndex: 1
        // })

        // DEBUG STEP SIMULATE_COURIER_TO_RESTAURANT
        // this.state = _.merge(this.state, {
        //     step: STEPS.SIMULATE_COURIER_TO_RESTAURANT,
        //     customer: [80, 480],
        //     restaurantSelectedIndex: 1,
        //     courier: [480, 60],
        // })

        // DEBUG STEP SIMULATE_COURIER_TO_CUSTOMER
        // this.state = _.merge(this.state, {
        //     step: STEPS.SIMULATE_COURIER_TO_CUSTOMER,
        //     customer: [80, 480],
        //     restaurantSelectedIndex: 1,
        //     courier: [839, 400],
        //     pickingDone: true
        // })

        this.onActionStart = this.onActionStart.bind(this)
        this.onActionEnd = this.onActionEnd.bind(this)
        this.onCustomerSet = this.onCustomerSet.bind(this)
        this.onRestaurantSelected = this.onRestaurantSelected.bind(this)
        this.onCourierSet = this.onCourierSet.bind(this)
        this.onPickingDone = this.onPickingDone.bind(this)
        this.onDeliveryDone = this.onDeliveryDone.bind(this)
        this.canGoNext = this.canGoNext.bind(this)
        this.goToNextStep = this.goToNextStep.bind(this)
        this.selectMapFunctions = _.map(MAPS, (map, index) => () => this.selectMap(index))
    }

    getInitialState() {
        return {
            step: STEPS.SET_CUSTOMER_POSITION,
            frozen: false,
            customer: null,
            restaurantSelectedIndex: null,
            courier: null,
            pickingDone: false,
            deliveryDone: false,
        }
    }

    selectMap(index) {
        if (index !== this.state.activeMapIndex) {
            this.key++
            this.setState(_.merge(this.getInitialState(), {activeMapIndex: index}))
        }
    }

    onActionStart() {
        this.setState({frozen: true})
    }

    onActionEnd() {
        this.setState({frozen: false})
    }

    onCustomerSet(customer) {
        this.setState({customer})
    }

    onRestaurantSelected(restaurantSelectedIndex) {
        this.setState({restaurantSelectedIndex})
    }

    onCourierSet(courier) {
        this.setState({courier})
    }

    onPickingDone() {
        this.setState({pickingDone: true})
    }

    onDeliveryDone() {
        this.setState({deliveryDone: true})
    }

    canGoNext() {
        const {step, customer, restaurantSelectedIndex, courier, pickingDone, deliveryDone} = this.state

        return !(
            (step === STEPS.SET_CUSTOMER_POSITION && !customer) ||
            (step === STEPS.CHOOSE_RESTAURANT && restaurantSelectedIndex === null) ||
            (step === STEPS.SET_COURIER_POSITION && !courier) ||
            (step === STEPS.SIMULATE_COURIER_TO_RESTAURANT && !pickingDone) ||
            (step === STEPS.SIMULATE_COURIER_TO_CUSTOMER && !deliveryDone)
        )
    }

    goToNextStep() {
        const {step, frozen} = this.state

        if (!frozen && this.canGoNext()) {
            if (step < STEPS.SIMULATE_COURIER_TO_CUSTOMER) {
                const nextStep = _.find(STEPS, nextStep => nextStep === step + 1)

                this.setState({step: nextStep})
            }
            else {
                this.key++
                this.setState(this.getInitialState())
            }
        }
    }

    componentDidMount() {
        !BUILDER && window.addEventListener('keydown', (event) => event.keyCode === 13 && this.goToNextStep(), false)
    }

    render() {
        const {activeMapIndex, step, frozen, customer, restaurantSelectedIndex, courier} = this.state
        const activeMap = MAPS[activeMapIndex]

        return (
            <div className="app">
                <div className="wrapper" style={activeMap.dimensions}>
                    {!BUILDER && (
                        <div className="selector">
                            {_.map(MAPS, (map, index) => (
                                <div key={index} className={activeMapIndex === index ? 'active' : ''} onClick={this.selectMapFunctions[index]}>
                                    Map {index + 1}
                                    <i style={{background: `url(${map.image})`, display: 'none'}}/>
                                </div>
                            ))}
                        </div>
                    )}
                    {!BUILDER && <Map key={this.key} step={step} image={activeMap.image}
                                      graph={activeMap.graph}
                                      initialCustomerPosition={customer}
                                      restaurants={step > STEPS.CHOOSE_RESTAURANT ? activeMap.restaurants[restaurantSelectedIndex] : activeMap.restaurants}
                                      initialCourierPosition={courier}
                                      onCustomerSet={this.onCustomerSet}
                                      onRestaurantSelected={this.onRestaurantSelected}
                                      onCourierSet={this.onCourierSet}
                                      onPickingDone={this.onPickingDone}
                                      onDeliveryDone={this.onDeliveryDone}
                                      onActionStart={this.onActionStart} onActionEnd={this.onActionEnd}/>}
                    {(BUILDER || SHOW_MAP) && <Builder showMapOnly={!BUILDER} mapData={activeMap}/>}
                </div>
                <div className="toolbar">
                    <div className={`step${step >= STEPS.SET_CUSTOMER_POSITION ? ' active' : ''}`}>
                        <i className="fas fa-user"/>
                        <span>Set customer position</span>
                    </div>
                    <div className={`step${step >= STEPS.CHOOSE_RESTAURANT ? ' active' : ''}`}>
                        <i className="fas fa-utensils"/>
                        <span>Choose restaurant</span>
                    </div>
                    <div className={`step${step >= STEPS.SET_COURIER_POSITION ? ' active' : ''}`}>
                        <i className="fas fa-car"/>
                        <span>Set courier position</span>
                    </div>
                    <div className={`step${step >= STEPS.SIMULATE_COURIER_TO_RESTAURANT ? ' active' : ''}`}>
                        <i className="fas fa-paper-plane"/>
                        <span>Simulate courier to restaurant</span>
                    </div>
                    <div className={`step${step >= STEPS.SIMULATE_COURIER_TO_CUSTOMER ? ' active' : ''}`}>
                        <i className="fas fa-paper-plane"/>
                        <span>Simulate courier to customer</span>
                    </div>
                    <nav className={`btn${(frozen || !this.canGoNext()) ? ' disabled' : ''}`} onClick={this.goToNextStep}>
                        {step < STEPS.SIMULATE_COURIER_TO_CUSTOMER ? 'NEXT' : 'RESTART'}
                    </nav>
                </div>
            </div>
        )
    }
}

export default App