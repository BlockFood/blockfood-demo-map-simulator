import React from 'react'
import * as _ from 'lodash'
import Graph from 'node-dijkstra'
import {distance, nearestPointOnLine, splitPath} from '../utils/Geometry'

import './Map.css'

const SPEED = 2

class Map extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            path1: this.props.pathOptions.visible && this.props.courier ? this.computePath1() : null,
            path2: this.props.pathOptions.visible && this.props.customer ? this.computePath2() : null,
            courierPosition: null
        }
    }

    getPathFromListOfPoints(points) {
        let path = ''
        _.forEach(points, (point, index) => path += `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]} `)
        return path
    }

    getAdditionalPoint(target) {
        const {roadNodes, roadNodesLines} = this.props

        const projections = _.map(roadNodesLines, ([line1, line2], id) => {
            const {position, dist} = nearestPointOnLine(line1, line2, target)
            return {id, position, dist}
        })

        const additionPoint = _.minBy(projections, projection => projection.dist)

        let perfectPoint = null
        const connections = {}
        _.forEach(additionPoint.id.split('_'), id => {
            const dist = distance(additionPoint.position, roadNodes[id].position)
            if (dist < 0.05) {
                perfectPoint = {
                    id,
                    properties: {
                        position: roadNodes[id].position,
                        connections: {}
                    }
                }
            }
            else {
                connections[id] = dist
            }
        })

        return perfectPoint || {
            id: additionPoint.id,
            properties: {
                position: additionPoint.position,
                connections
            }
        }
    }

    computePath(props, target) {
        const {roadNodes, restaurants, restaurantSelectedId} = props

        const route = new Graph()

        const additionalPoint = this.getAdditionalPoint(target)

        _.forEach(roadNodes, (roadNode, roadNodeId) => {
            const additionalPointDistance = additionalPoint.properties.connections[roadNodeId]

            if (additionalPointDistance) {
                const connections = _.assign({}, roadNode.connections, {[additionalPoint.id]: additionalPointDistance})
                route.addNode(roadNodeId, connections)
            }
            else {
                route.addNode(roadNodeId, roadNode.connections)
            }
        })

        const from = _.minBy(_.keys(roadNodes), roadNodeId => {
            return distance(roadNodes[roadNodeId].position, restaurants[restaurantSelectedId].position)
        })

        const points = _.map(route.path(from, additionalPoint.id), roadNodeId => {
            return roadNodeId === additionalPoint.id ? additionalPoint.properties.position : roadNodes[roadNodeId].position
        })
        points.push(target)

        return splitPath(points, SPEED)
    }

    computePath1(props = this.props) {
        const {courier} = props

        return _.reverse(this.computePath(props, courier))
    }

    computePath2(props = this.props) {
        const {customer} = props

        const points = this.computePath(props, customer)
        while (distance(customer, points[points.length - 1]) < 14) points.pop()
        return points
    }

    simulate1() {
        const run = () => {
            const newPath1 = this.state.path1.slice(1)
            const newCourierPosition = newPath1.length > 0 ? newPath1[0]: this.state.courierPosition

            this.setState({path1: newPath1, courierPosition: newCourierPosition})

            if (newPath1.length > 0) {
                requestAnimationFrame(run)
            }
            else {
                this.props.onSimulate1Done()
            }
        }

        const firstPoints = splitPath([this.props.courier, this.state.path1[0]], SPEED)

        const goToStart = () => {
            const newCourierPosition = firstPoints.shift()

            this.setState({courierPosition: newCourierPosition})

            if (firstPoints.length > 0) {
                requestAnimationFrame(goToStart)
            }
            else {
                requestAnimationFrame(run)
            }
        }

        goToStart()
    }

    simulate2() {
        const run = () => {
            const newPath2 = this.state.path2.slice(1)
            const newCourierPosition = newPath2.length > 0 ? newPath2[0]: this.state.courierPosition

            this.setState({path2: newPath2, courierPosition: newCourierPosition})

            if (newPath2.length > 0) {
                requestAnimationFrame(run)
            }
        }

        run()
    }

    componentWillReceiveProps(nextProps) {
        const isPathFirstTimeVisible = !this.props.showPaths && nextProps.showPaths
        const isCourierPositionChanged = !_.isEqual(this.props.courier, nextProps.courier)

        if (isPathFirstTimeVisible || isCourierPositionChanged) {
            this.setState({
                path1: this.computePath1(nextProps),
                path2: this.computePath2(nextProps),
            })
        }

        if (!this.props.simulate1 && nextProps.simulate1) {
            this.simulate1()
        }
        else if (!this.props.simulate2 && nextProps.simulate2) {
            this.simulate2()
        }
    }

    render() {
        const {src, restaurants, restaurantSelectedId, showOnlyRestaurantSelected, customer, courier, pathOptions} = this.props
        const {path1, path2, courierPosition} = this.state

        const courierStyle = (courierPosition || courier) ? {
            transform: `translate(${courierPosition ? courierPosition[0] : courier[0]}px, ${courierPosition ? courierPosition[1] : courier[1]}px)`
        } : null

        const customerStyle = customer ? {
            transform: `translate(${customer[0]}px, ${customer[1]}px)`
        } : null

        return (
            <div className="map">
                <img src={src} alt="" draggable="false"/>
                {_.map(restaurants, (restaurant, id) => {
                    const isSelected = restaurantSelectedId === id

                    return (showOnlyRestaurantSelected ? isSelected : true) ? (
                        <div key={id} className={`restaurant ${restaurant.labelDirection}${restaurantSelectedId === id ? ' selected' : ''}`}
                             style={{left: restaurant.position[0], top: restaurant.position[1]}}>
                            <i className="fas fa-utensils"/>
                            <div className="name">{restaurant.name}</div>
                        </div>
                    ) : null
                })}
                <svg>
                    {path1 && <path d={this.getPathFromListOfPoints(path1)}/>}
                    {path2 && <path d={this.getPathFromListOfPoints(path2)} style={{strokeDasharray: pathOptions.path2dasharray ? 7 : 0}}/>}
                </svg>
                {customer && <i className="customer fas fa-user" style={customerStyle}/>}
                {courier && <i className="courier fas fa-car" style={courierStyle}/>}
            </div>
        )
    }
}

export default Map
