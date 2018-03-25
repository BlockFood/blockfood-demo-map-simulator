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

class Map extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            customerPosition: this.props.initialCustomerPosition || null,
            customerPositionBuffer: []
        }

        this.onClick = this.onClick.bind(this)
    }

    getNearestPosition(target) {
        const {graphLines} = this.props

        const projections = _.map(graphLines, ([line1, line2]) => nearestPointOnLine(line1, line2, target))
        return _.minBy(projections, projection => projection.dist).position
    }

    adjustCustomerPosition() {
        const adjust = () => {
            const {customerPosition, customerPositionBuffer} = this.state

            if (customerPositionBuffer.length > 0) {
                const newCustomerPositionBuffer = _.takeRight(customerPositionBuffer, 4 * (customerPositionBuffer.length / 5))
                const newCustomerPosition = newCustomerPositionBuffer.length > 0 ? newCustomerPositionBuffer[0] : customerPosition

                this.setState({customerPosition: newCustomerPosition, customerPositionBuffer: newCustomerPositionBuffer})

                if (newCustomerPositionBuffer.length > 0) {
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

    onClick(event) {
        const eventPoint = [event.offsetX, event.offsetY]

        if (this.props.step === STEPS.SET_CUSTOMER_POSITION) {
            const nearestEventPoint = this.getNearestPosition(eventPoint)

            let customerPositionBuffer = []
            if (distance(eventPoint, nearestEventPoint) > POSITION_MARGIN) {
                const vector = getVector(nearestEventPoint, eventPoint)
                const nearestEventPointWithMargin = [nearestEventPoint[0] + POSITION_MARGIN * vector[0], nearestEventPoint[1] + POSITION_MARGIN * vector[1]]
                customerPositionBuffer = splitPath([eventPoint, nearestEventPointWithMargin])
            }

            this.props.onCustomerSet(customerPositionBuffer.length > 0 ? _.last(customerPositionBuffer) : eventPoint)
            this.setState({customerPosition: eventPoint, customerPositionBuffer})
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
    }

    componentWillUnmount() {
        this.containerElement.removeEventListener('click', this.onClick, false)
    }

    render() {
        const {image} = this.props
        const {customerPosition} = this.state

        const customerStyle = customerPosition ? {transform: `translate(${customerPosition[0]}px, ${customerPosition[1]}px)`} : null

        return (
            <div className="map">
                <img src={image} alt="" draggable="false"/>
                {customerPosition && <div className="icon" style={customerStyle}><i className="fas fa-user"/></div>}
            </div>
        )
    }
}

export default Map