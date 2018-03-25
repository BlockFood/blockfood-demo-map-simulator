import * as _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import {distance, nearestPointOnLine, splitPath, getVector} from '../utils/Geometry'

import './Map.css'

export const STEPS = {
    SET_CUSTOMER_POSITION: 0,
    CHOOSE_RESTAURANT: 1,
    SET_COURIER_POSITION: 2,
    SIMULATE_COURIER_TO_RESTAURANT: 3,
    SIMULATE_COURIER_TO_CUSTOMER: 4
}

const SPEED = 2
const POSITION_MARGIN = 18
const MIN_RESTAURANT_DETECTION_RANGE = 150

class Map extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            customerPosition: this.props.initialCustomerPosition || null,
            customerPositionBuffer: [],
            selectedRestaurantIndex: null,
            courierPosition: this.props.initialCourierPosition || null,
            courierPositionBuffer: []
        }

        this.onClick = this.onClick.bind(this)
    }

    getNearestPosition(target) {
        const {graphLines} = this.props

        const projections = _.map(graphLines, ([line1, line2]) => nearestPointOnLine(line1, line2, target))
        return _.minBy(projections, projection => projection.dist).position
    }

    getNearestRestaurantIndex(eventPoint) {
        const {restaurants} = this.props

        const nearRestaurantIndex = _.minBy(_.range(restaurants.length), index => {
            return distance(restaurants[index].position, eventPoint)
        })

        return distance(restaurants[nearRestaurantIndex].position, eventPoint) < MIN_RESTAURANT_DETECTION_RANGE ? nearRestaurantIndex : null
    }

    getPositionBuffer(eventPoint) {
        const nearestEventPoint = this.getNearestPosition(eventPoint)

        let customerPositionBuffer = []
        if (distance(eventPoint, nearestEventPoint) > POSITION_MARGIN) {
            const vector = getVector(nearestEventPoint, eventPoint)
            const nearestEventPointWithMargin = [nearestEventPoint[0] + POSITION_MARGIN * vector[0], nearestEventPoint[1] + POSITION_MARGIN * vector[1]]
            customerPositionBuffer = splitPath([eventPoint, nearestEventPointWithMargin])
        }

        return customerPositionBuffer
    }

    adjustPosition(getter, setter) {
        const adjust = () => {
            const {position, buffer} = getter()

            if (buffer.length > 0) {
                const newBuffer = _.takeRight(buffer, 4 * (buffer.length / 5))
                const newPosition = newBuffer.length > 0 ? newBuffer[0] : position

                setter(newPosition, newBuffer)

                if (newBuffer.length > 0) {
                    requestAnimationFrame(adjust)
                }
                else {
                    this.props.onActionEnd()
                }
            }
        }

        this.props.onActionStart()
        adjust()
    }

    adjustCustomerPosition() {
        const getter = () => ({position: this.state.customerPosition, buffer: this.state.customerPositionBuffer})
        const setter = (position, buffer) => this.setState({customerPosition: position, customerPositionBuffer: buffer})
        this.adjustPosition(getter, setter)
    }

    adjustCourierPosition() {
        const getter = () => ({position: this.state.courierPosition, buffer: this.state.courierPositionBuffer})
        const setter = (position, buffer) => this.setState({courierPosition: position, courierPositionBuffer: buffer})
        this.adjustPosition(getter, setter)
    }

    onClick(event) {
        const {step} = this.props

        const eventPoint = [event.offsetX, event.offsetY]

        if (step === STEPS.SET_CUSTOMER_POSITION) {
            const customerPositionBuffer = this.getPositionBuffer(eventPoint)
            this.props.onCustomerSet(customerPositionBuffer.length > 0 ? _.last(customerPositionBuffer) : eventPoint)
            this.setState({customerPosition: eventPoint, customerPositionBuffer})
        }
        else if (step === STEPS.CHOOSE_RESTAURANT) {
            const nearRestaurantIndex = this.getNearestRestaurantIndex(eventPoint)

            if (nearRestaurantIndex !== null) {
                this.props.onRestaurantSelected(nearRestaurantIndex)
                this.setState({selectedRestaurantIndex: nearRestaurantIndex})
            }
        }
        else if (step === STEPS.SET_COURIER_POSITION) {
            const courierPositionBuffer = this.getPositionBuffer(eventPoint)
            this.props.onCourierSet(courierPositionBuffer.length > 0 ? _.last(courierPositionBuffer) : eventPoint)
            this.setState({courierPosition: eventPoint, courierPositionBuffer})
        }
    }

    componentDidMount() {
        this.containerElement = ReactDOM.findDOMNode(this)
        this.containerElement.addEventListener('click', this.onClick, false)
    }

    componentDidUpdate(_prevProps, prevState) {
        if (this.state.customerPositionBuffer.length > 0 && prevState.customerPositionBuffer.length === 0) {
            this.adjustCustomerPosition()
        }
        else if (this.state.courierPositionBuffer.length > 0 && prevState.courierPositionBuffer.length === 0) {
            this.adjustCourierPosition()
        }
    }

    componentWillUnmount() {
        this.containerElement.removeEventListener('click', this.onClick, false)
    }

    render() {
        const {step, image, restaurants} = this.props
        const {customerPosition, courierPosition} = this.state

        const customerStyle = customerPosition ? {transform: `translate(${customerPosition[0]}px, ${customerPosition[1]}px)`} : null
        const courierStyle = courierPosition ? {transform: `translate(${courierPosition[0]}px, ${courierPosition[1]}px)`} : null

        const selectedRestaurantIndex = step === STEPS.CHOOSE_RESTAURANT ? this.state.selectedRestaurantIndex : null

        return (
            <div className="map">
                <img src={image} alt="" draggable="false"/>
                {_.map(_.isArray(restaurants) ? restaurants : [restaurants], (restaurant, index) => (
                    <div key={index} className={`restaurant ${restaurant.labelDirection}${selectedRestaurantIndex !== null && selectedRestaurantIndex !== index ? ' not-selected' : ''}`}
                         style={{transform: `translate(${restaurant.position[0]}px, ${restaurant.position[1]}px)`}}>
                        <div className="icon"><i className="fas fa-utensils"/></div>
                        <div className="name">{restaurant.name}</div>
                    </div>
                ))}
                {customerPosition && <div className="icon" style={customerStyle}><i className="fas fa-user"/></div>}
                {courierPosition && <div className="icon" style={courierStyle}><i className="fas fa-car"/></div>}
            </div>
        )
    }
}

export default Map