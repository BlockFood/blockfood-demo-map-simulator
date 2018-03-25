import * as _ from 'lodash'
import React from 'react'
import Builder from './builder/Builder'
import Map, {STEPS} from './map/Map'

import './App.css'

import Map1 from './data/Map1'

const ACTIVE_MAP = Map1
const BUILDER = false
const SHOW_MAP = false

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            step: STEPS.SET_CUSTOMER_POSITION,
            frozen: false,
            customer: null
        }

        // DEBUG STEP CHOOSE_RESTAURANT
        // this.state = _.merge(this.state, {
        //     step: STEPS.CHOOSE_RESTAURANT,
        //     customer: [80, 480]
        // })

        this.onActionStart = this.onActionStart.bind(this)
        this.onActionEnd = this.onActionEnd.bind(this)
        this.onCustomerSet = this.onCustomerSet.bind(this)
        this.canGoNext = this.canGoNext.bind(this)
        this.goToNextStep = this.goToNextStep.bind(this)
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

    canGoNext() {
        const {step, customer} = this.state

        return !(
            (step === STEPS.SET_CUSTOMER_POSITION && !customer) ||
            step === STEPS.CHOOSE_RESTAURANT ||
            step === STEPS.SET_COURIER_POSITION ||
            step === STEPS.SIMULATE_COURIER_TO_RESTAURANT ||
            step === STEPS.SIMULATE_COURIER_TO_CUSTOMER
        )
    }

    goToNextStep() {
        const {step, frozen} = this.state

        if (!frozen && this.canGoNext()) {
            const nextStep = _.find(STEPS, nextStep => nextStep === step + 1)

            this.setState({step: nextStep})
        }
    }

    render() {
        const {step, frozen, customer} = this.state

        return (
            <div className="app">
                <div className="wrapper" style={ACTIVE_MAP.dimensions}>
                    {!BUILDER && <Map step={step} image={ACTIVE_MAP.image}
                                      graph={ACTIVE_MAP.graph} graphLines={ACTIVE_MAP.graphLines}
                                      initialCustomerPosition={customer}
                                      onActionStart={this.onActionStart} onActionEnd={this.onActionEnd}
                                      onCustomerSet={this.onCustomerSet}/>}
                    {(BUILDER || SHOW_MAP) && <Builder showMapOnly={!BUILDER} mapData={ACTIVE_MAP}/>}
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
                    <nav className={`btn${(frozen || !this.canGoNext()) ? ' disabled' : ''}`} onClick={this.goToNextStep}>NEXT</nav>
                </div>
            </div>
        )
    }
}

export default App