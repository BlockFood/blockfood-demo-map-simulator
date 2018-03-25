import * as _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import GraphDijkstra from 'node-dijkstra'
import {distance, nearestPointOnLine, splitPath, getVector} from './utils/Geometry'

import './Map.css'

export const STEPS = {
    SET_CUSTOMER_POSITION: 0,
    CHOOSE_RESTAURANT: 1,
    SET_COURIER_POSITION: 2,
    SIMULATE_COURIER_TO_RESTAURANT: 3,
    SIMULATE_COURIER_TO_CUSTOMER: 4
}

const SPEED = 2
const POSITION_MARGIN = 15
const STOP_MARGIN = 18
const MIN_RESTAURANT_DETECTION_RANGE = 150

class Map extends React.Component {
    constructor(props) {
        super(props)

        this.simulationOngoing = false

        this.graphLines = this.computeGraphLines(this.props.graph)

        const customerPosition = this.props.initialCustomerPosition || null
        const courierPosition = this.props.initialCourierPosition || null

        let path1 = null, path2 = null
        if (customerPosition && courierPosition) {
            const paths = this.computePaths(customerPosition, courierPosition)
            path1 = paths.path1
            path2 = paths.path2
        }

        this.state = {
            customerPosition,
            customerPositionBuffer: [],
            selectedRestaurantIndex: null,
            courierPosition,
            courierPositionBuffer: [],
            path1,
            path2
        }

        this.onClick = this.onClick.bind(this)
        this.onBtnSimulationClick = this.onBtnSimulationClick.bind(this)
    }

    computeGraphLines(graph) {
        const graphLines = {}
        _.forEach(graph, (node, nodeId1) => {
            _.forEach(_.keys(node.connections), nodeId2 => {
                const min = Math.min(+nodeId1, +nodeId2)
                const max = Math.max(+nodeId1, +nodeId2)
                graphLines[min + '_' + max] = [
                    graph[min].position,
                    graph[max].position
                ]
            })
        })

        return graphLines
    }

    getPathFromListOfPoints(points) {
        let path = ''
        _.forEach(points, (point, index) => path += `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]} `)
        return path
    }

    getNearestPosition(target) {
        const projections = _.map(this.graphLines, ([line1, line2]) => nearestPointOnLine(line1, line2, target))
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
        const setter = (position, buffer) => {
            const {path1, path2} = this.computePaths(this.state.customerPosition, position)
            this.setState({courierPosition: position, courierPositionBuffer: buffer, path1, path2})
        }
        this.adjustPosition(getter, setter)
    }

    getPathAdditionalPoint(target, idPrefix) {
        const {graph} = this.props

        const projections = _.map(this.graphLines, ([line1, line2], id) => {
            const {position, dist} = nearestPointOnLine(line1, line2, target)
            return {id, position, dist}
        })

        const additionPoint = _.minBy(projections, projection => projection.dist)

        let perfectPoint = null
        const connections = {}
        _.forEach(additionPoint.id.split('_'), id => {
            const dist = distance(additionPoint.position, graph[id].position)

            if (dist < 0.05) {
                perfectPoint = {id, alreadyInGraph: true}
            }
            else {
                connections[id] = dist
            }
        })

        return perfectPoint || {
            id: idPrefix + additionPoint.id,
            alreadyInGraph: false,
            line: additionPoint.id,
            position: additionPoint.position,
            connections
        }
    }

    computePath(from, target) {
        const {graph} = this.props

        const route = new GraphDijkstra()

        const fromPoint = this.getPathAdditionalPoint(from, 'from_')
        const targetPoint = this.getPathAdditionalPoint(target, 'target_')

        if (!fromPoint.alreadyInGraph && !targetPoint.alreadyInGraph && fromPoint.line === targetPoint.line) {
            const dist = distance(fromPoint.position, targetPoint.position)
            fromPoint.connections[targetPoint.id] = dist
            targetPoint.connections[fromPoint.id] = dist
        }

        _.forEach(graph, (node, nodeId) => {
            const distanceToFromPoint = !fromPoint.alreadyInGraph ? fromPoint.connections[nodeId] : null
            const distanceToTargetPoint = !targetPoint.alreadyInGraph ? targetPoint.connections[nodeId] : null

            const connections = _.assign({}, node.connections)

            if (distanceToFromPoint) {
                _.assign(connections, {[fromPoint.id]: distanceToFromPoint})
            }

            if (distanceToTargetPoint) {
                _.assign(connections, {[targetPoint.id]: distanceToTargetPoint})
            }

            route.addNode(nodeId, connections)
        })

        !fromPoint.alreadyInGraph && route.addNode(fromPoint.id, fromPoint.connections)
        !targetPoint.alreadyInGraph && route.addNode(targetPoint.id, targetPoint.connections)

        const points = _.map(route.path(fromPoint.id, targetPoint.id), nodeId => {
            return {
                [targetPoint.id]: targetPoint.position,
                [fromPoint.id]: fromPoint.position
            }[nodeId] || graph[nodeId].position
        })
        points.unshift(from)
        points.push(target)

        return splitPath(points, SPEED)
    }

    computePaths(customerPosition, courierPosition) {
        const {graph, restaurants: restaurant} = this.props

        const restaurantPoint = this.getPathAdditionalPoint(restaurant.position)
        const restaurantPosition = !restaurantPoint.alreadyInGraph ? restaurantPoint.position : graph[restaurantPoint.id].position

        const path1 = this.computePath(courierPosition, restaurantPosition)
        const path2 = this.computePath(restaurantPosition, customerPosition)

        return {path1, path2}
    }

    simulate1() {
        const run = () => {
            const {courierPosition, path1} = this.state

            const newPath1 = path1.slice(1)
            const newCourierPosition = newPath1.length > 0 ? newPath1[0]: courierPosition

            this.setState({path1: newPath1, courierPosition: newCourierPosition})

            if (newPath1.length > 0 && this.simulationOngoing) {
                requestAnimationFrame(run)
            }
            else if (newPath1.length === 0) {
                this.simulationOngoing = false
                this.props.onPickingDone()
                this.props.onActionEnd()
            }
        }

        this.simulationOngoing = true
        this.props.onActionStart()
        run()
    }

    simulate2() {
        const run = () => {
            const {customerPosition, courierPosition, path2} = this.state

            let newPath2 = path2.slice(1)
            if (newPath2.length > 0 && distance(newPath2[0], customerPosition) < STOP_MARGIN) {
                newPath2 = []
            }
            const newCourierPosition = newPath2.length > 0 ? newPath2[0] : courierPosition

            this.setState({path2: newPath2, courierPosition: newCourierPosition})

            if (newPath2.length > 0 && this.simulationOngoing) {
                requestAnimationFrame(run)
            }
            else if (newPath2.length === 0) {
                this.simulationOngoing = false
                this.props.onDeliveryDone()
                this.props.onActionEnd()
            }
        }

        this.simulationOngoing = true
        this.props.onActionStart()
        run()
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
            const {path1, path2} = this.computePaths(this.state.customerPosition, eventPoint)
            this.setState({courierPosition: eventPoint, courierPositionBuffer, path1, path2})
        }
    }

    onBtnSimulationClick() {
        const {step} = this.props

        if (step === STEPS.SIMULATE_COURIER_TO_RESTAURANT && !this.simulationOngoing) {
            this.simulate1()
        }
        else if (step === STEPS.SIMULATE_COURIER_TO_CUSTOMER && !this.simulationOngoing) {
            this.simulate2()
        }
        else if (this.simulationOngoing) {
            this.simulationOngoing = false
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
        const {customerPosition, courierPosition, path1, path2} = this.state

        const customerStyle = customerPosition ? {transform: `translate(${customerPosition[0]}px, ${customerPosition[1]}px)`} : null
        const courierStyle = courierPosition ? {transform: `translate(${courierPosition[0]}px, ${courierPosition[1]}px)`} : null

        const selectedRestaurantIndex = step === STEPS.CHOOSE_RESTAURANT ? this.state.selectedRestaurantIndex : null

        const showBtnSimulation = (step === STEPS.SIMULATE_COURIER_TO_RESTAURANT && path1.length > 0) || (step === STEPS.SIMULATE_COURIER_TO_CUSTOMER && path2.length > 0)

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
                <svg>
                    {path1 && <path d={this.getPathFromListOfPoints(path1)}/>}
                    {path2 && <path d={this.getPathFromListOfPoints(path2)} style={{strokeDasharray: step < STEPS.SIMULATE_COURIER_TO_CUSTOMER ? 7 : 0}}/>}
                </svg>
                {customerPosition && <div className="icon" style={customerStyle}><i className="fas fa-user"/></div>}
                {courierPosition && <div className="icon" style={courierStyle}><i className="fas fa-car"/></div>}
                {showBtnSimulation && (
                    <i className={`btn-simulation far fa-${!this.simulationOngoing ? 'play' : 'pause'}-circle`} onClick={this.onBtnSimulationClick}/>
                )}
            </div>
        )
    }
}

export default Map