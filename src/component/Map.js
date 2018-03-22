import React from 'react'
import * as _ from 'lodash'
import Graph from 'node-dijkstra'
import {distance, nearestPointOnLine} from '../utils/Geometry'

class Map extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            path1: this.props.pathOptions.visible && this.props.courier ? this.computePath(this.props.courier) : null,
            path2: this.props.pathOptions.visible && this.props.customer? this.computePath(this.props.customer) : null
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

        const connections = {}
        _.forEach(additionPoint.id.split('_'), id => {
            connections[id] = distance(additionPoint.position, roadNodes[id].position)
        })

        return {
            id: additionPoint.id,
            properties: {
                position: additionPoint.position,
                connections
            }
        }
    }

    computePath(props = this.props, target) {
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

        return this.getPathFromListOfPoints(points)
    }

    componentWillReceiveProps(nextProps) {
        const isPathFirstTimeVisible = !this.props.showPaths && nextProps.showPaths
        const isCourierPositionChanged = !_.isEqual(this.props.courier, nextProps.courier)

        if (isPathFirstTimeVisible || isCourierPositionChanged) {
            this.setState({
                path1: this.computePath(nextProps, nextProps.courier),
                path2: this.computePath(nextProps, nextProps.customer),
            })
        }
    }

    render() {
        const {src, restaurants, restaurantSelectedId, showOnlyRestaurantSelected, customer, courier, pathOptions} = this.props
        const {path1, path2} = this.state

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
                {customer && <div className="customer" style={{left: customer[0], top: customer[1]}}><i className="fas fa-user"/></div>}
                {courier && <div className="courier" style={{left: courier[0], top: courier[1]}}><i className="fas fa-car"/></div>}
                <svg>
                    {path1 && <path d={path1}/>}
                    {path2 && <path d={path2} style={{strokeDasharray: pathOptions.path2dasharray ? 10 : 0}}/>}
                </svg>
            </div>
        )
    }
}

export default Map
