import * as _ from 'lodash'
import React from 'react'
import ReactDOM from "react-dom";
import {distance} from '../utils/Geometry'

import './Builder.css'

const MAX_NEAR_POINT_DISTANCE = 6

class Builder extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            graph: this.props.mapData.graph,
            selectedNodeId: null
        }
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

    getNodeIdFromEventPoint(eventPoint) {
        const {graph} = this.state

        const nearestNodeId = _.minBy(_.keys(graph), nodeId => distance(graph[nodeId].position, eventPoint))
        return distance(graph[nearestNodeId].position, eventPoint) < MAX_NEAR_POINT_DISTANCE ? nearestNodeId : null
    }

    onClick(event) {
        const {graph, selectedNodeId} = this.state

        const eventPoint = [event.offsetX, event.offsetY]

        // Select a node
        if (event.ctrlKey) {
            const nearestNodeId = this.getNodeIdFromEventPoint(eventPoint)

            if (nearestNodeId) {
                this.setState({selectedNodeId: nearestNodeId})
            }
        }
        // Add a connection
        else if (event.shiftKey) {
            const nearestNodeId = this.getNodeIdFromEventPoint(eventPoint)

            if (nearestNodeId && selectedNodeId) {
                const dist = distance(graph[selectedNodeId].position, graph[nearestNodeId].position)
                const newGraph = _.assign(newGraph, graph)
                newGraph[selectedNodeId].connections[nearestNodeId] = dist
                newGraph[nearestNodeId].connections[selectedNodeId] = dist

                this.setState({graph: newGraph, selectedNodeId: nearestNodeId})
            }
            else if (nearestNodeId) {
                this.setState({selectedNodeId: nearestNodeId})
            }
        }
        // Delete a node
        else if (event.altKey && _.keys(graph).length > 0) {
            const nearestNodeId = this.getNodeIdFromEventPoint(eventPoint)

            if (nearestNodeId) {
                const newGraph = _.assign({}, graph)
                delete newGraph[nearestNodeId]
                _.forEach(newGraph, ({connections}) => {
                    delete connections[nearestNodeId]
                })

                this.setState({graph: newGraph, selectedNodeId: null})
            }
        }
        // Add a node
        else {
            let nodeId = 0
            while (graph[nodeId]) nodeId++
            const newNode = {
                position: eventPoint,
                connections: {}
            }
            const newRoads = _.assign({}, graph, {[nodeId]: newNode})

            this.setState({graph: newRoads, selectedNodeId: nodeId + ''})
        }
    }

    componentDidMount() {
        if (!this.props.showMapOnly) {
            const containerElement = ReactDOM.findDOMNode(this).parentElement
            containerElement.addEventListener('click', this.onClick.bind(this), false)
        }
    }

    componentDidUpdate(newState) {
        if (newState.graph !== this.state.graph) {
            window.graph = JSON.stringify(this.state.graph)
            window.graphLines = JSON.stringify(this.computeGraphLines(this.state.graph))
        }
    }

    render() {
        const {mapData, showMapOnly} = this.props
        const {graph, selectedNodeId} = this.state

        return (
            <div className="map map-builder">
                {!showMapOnly && <img src={mapData.image} alt="" draggable="false"/>}
                <svg>
                    {_.map(_.keys(graph), nodeId => (
                        <g key={nodeId}>
                            {_.map(_.keys(graph[nodeId].connections), connectionId => (
                                <line key={nodeId + '_' + connectionId}
                                      x1={graph[nodeId].position[0]} y1={graph[nodeId].position[1]}
                                      x2={graph[connectionId].position[0]} y2={graph[connectionId].position[1]}/>
                            ))}
                        </g>
                    ))}
                    {_.map(_.keys(graph), nodeId => (
                        <circle key={nodeId} className={nodeId === selectedNodeId ? 'current' : ''}
                                cx={graph[nodeId].position[0]} cy={graph[nodeId].position[1]} r="3.5"/>
                    ))}
                </svg>
            </div>
        )
    }
}

export default Builder