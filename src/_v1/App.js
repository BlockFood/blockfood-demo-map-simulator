import * as _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import './App.css'
import '../../node_modules/reset-css/reset.css'
import {distance, nearestPointOnLine, splitPath} from '../utils/Geometry'
import MAP_DATA from '../data/MapData'
import Map from './component/Map'
import MapBuilder from './builder/MapBuilder'

const BUILD_MAP = false

const ADJUST_SPEED = 1
const ADJUST_MARGIN = 15

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            step: 0,
            customer: null,
            tmpCustomerPoints: [],
            restaurantSelectedId: null,
            courier: null,
            tmpCourierPoints: [],
            simulate1: 0,
            simulate2: 0
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

    getNearestPosition(target) {
        const projections = _.map(MAP_DATA.roadNodesLines, ([line1, line2]) => {
            const {position, dist} = nearestPointOnLine(line1, line2, target)
            return {position, dist}
        })

        return _.minBy(projections, projection => projection.dist).position
    }

    canGoNext() {
        const {step, customer, tmpCustomerPoints, restaurantSelectedId, courier, tmpCourierPoints, simulate1} = this.state

        return !(
            tmpCustomerPoints.length > 0 || tmpCourierPoints.length > 0 ||
            (step === 0 && !customer) ||
            (step === 1 && !restaurantSelectedId) ||
            (step === 2 && !courier) ||
            (step === 3 && simulate1 < 2) ||
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
                const {step, simulate1, simulate2} = this.state

                const eventPoint = [event.offsetX, event.offsetY]
                const nearestEventPoint = this.getNearestPosition(eventPoint)

                if (step === 0) {
                    let tmpCustomerPoints = []
                    if (distance(eventPoint, nearestEventPoint) > ADJUST_SPEED * ADJUST_MARGIN) {
                        const points = splitPath([eventPoint, nearestEventPoint], ADJUST_SPEED)
                        tmpCustomerPoints = _.take(points, points.length - ADJUST_MARGIN)
                    }
                    this.setState({customer: eventPoint, tmpCustomerPoints})
                }
                else if (step === 1) {
                    const nearRestaurantId = this.getNearRestaurantId(eventPoint)

                    if (nearRestaurantId) {
                        this.setState({restaurantSelectedId: nearRestaurantId})
                    }
                }
                else if (step === 2) {
                    let tmpCourierPoints = []
                    if (distance(eventPoint, nearestEventPoint) > ADJUST_SPEED * ADJUST_MARGIN) {
                        const points = splitPath([eventPoint, nearestEventPoint], ADJUST_SPEED)
                        tmpCourierPoints = _.take(points, points.length - ADJUST_MARGIN)
                    }

                    this.setState({courier: eventPoint, tmpCourierPoints})
                }
                else if (step === 3 && simulate1 === 0) {
                    this.setState({simulate1: 1})
                }
                else if (step === 4 && simulate2 === 0) {
                    this.setState({simulate2: 1})
                }
            }, false)

            window.addEventListener('keydown', (event) => {
                if (event.keyCode === 13) {
                    this.incrStep()
                }
            }, false)

            const adjustPosition = () => {
                const {tmpCustomerPoints, customer, tmpCourierPoints, courier} = this.state

                if (tmpCustomerPoints.length > 0) {
                    const newTmpCustomerPoints = _.takeRight(tmpCustomerPoints,  4 * (tmpCustomerPoints.length / 5))
                    const newCustomerPosition = newTmpCustomerPoints.length > 0 ? newTmpCustomerPoints[0]: customer

                    this.setState({tmpCustomerPoints: newTmpCustomerPoints, customer: newCustomerPosition})
                }
                else if (tmpCourierPoints.length > 0) {
                    const newTmpCourierPoints = _.takeRight(tmpCourierPoints, 4 * (tmpCourierPoints.length / 5))
                    const newCourierPosition = newTmpCourierPoints.length > 0 ? newTmpCourierPoints[0] : courier

                    this.setState({tmpCourierPoints: newTmpCourierPoints, courier: newCourierPosition})
                }

                requestAnimationFrame(adjustPosition)
            }

            adjustPosition()
        }
    }

    render() {
        const {step, customer, restaurantSelectedId, courier, simulate1, simulate2} = this.state

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
                         pathOptions={{visible: !!courier, path2dasharray: step < 4}}
                         simulate1={simulate1 === 1}
                         onSimulate1Done={() => this.setState({simulate1: 2})}
                         simulate2={simulate2 === 1}/>
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
