import * as _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import {distance} from '../utils/Geometry'
import MAP_DATA from '../data/MapData'

import './MapBuilder.css'

class MapBuilder extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            roadNodes: MAP_DATA.roadNodes,
            currentRoadNodeId: null
        }
    }

    getNearRoadNodeId(eventPoint) {
        const {roadNodes} = this.state

        const nearRoadNodeId = _.minBy(_.keys(roadNodes), roadNodeId => {
            return distance(roadNodes[roadNodeId].position, eventPoint)
        })

        return distance(roadNodes[nearRoadNodeId].position, eventPoint) < 6 ? nearRoadNodeId : null
    }

    componentDidMount() {
        const containerElement = ReactDOM.findDOMNode(this).parentElement
        containerElement.addEventListener('click', (event) => {
            const {roadNodes, currentRoadNodeId} = this.state

            const eventPoint = [event.offsetX, event.offsetY]

            if (event.ctrlKey) {
                const nearRoadNodeId = this.getNearRoadNodeId(eventPoint)

                if (nearRoadNodeId) {
                    this.setState({currentRoadNodeId: nearRoadNodeId})
                }
            }
            else if (event.shiftKey) {
                const nearRoadNodeId = this.getNearRoadNodeId(eventPoint)

                if (nearRoadNodeId && currentRoadNodeId) {
                    const dist = distance(roadNodes[currentRoadNodeId].position, roadNodes[nearRoadNodeId].position)
                    const newRoadNodes = {}
                    _.assign(newRoadNodes, roadNodes)
                    newRoadNodes[currentRoadNodeId].connections[nearRoadNodeId] = dist
                    newRoadNodes[nearRoadNodeId].connections[currentRoadNodeId] = dist
                    window.roadNodes = newRoadNodes
                    this.setState({roadNodes: newRoadNodes, currentRoadNodeId: nearRoadNodeId})
                }
                else if (nearRoadNodeId) {
                    this.setState({currentRoadNodeId: nearRoadNodeId})
                }
            }
            else if (event.altKey && _.keys(roadNodes).length > 0) {
                const nearRoadNodeId = this.getNearRoadNodeId(eventPoint)

                if (nearRoadNodeId) {
                    const newRoadNodes = {}
                    _.assign(newRoadNodes, roadNodes)
                    delete newRoadNodes[nearRoadNodeId]

                    _.forEach(newRoadNodes, ({connections}) => {
                        delete connections[nearRoadNodeId]
                    })

                    window.roadNodes = newRoadNodes
                    this.setState({roadNodes: newRoadNodes, currentRoadNodeId: null})
                }
            }
            else {
                let i = 0
                while (roadNodes[i]) i++
                const newRoadNode = {
                    position: eventPoint,
                    connections: {}
                }

                const newRoads = _.assign({}, roadNodes, {[i]: newRoadNode})
                window.roadNodes = newRoads
                this.setState({roadNodes: newRoads, currentRoadNodeId: i + ''})
            }
        }, false)
    }

    render() {
        const {roadNodes, currentRoadNodeId} = this.state

        return (
            <svg className="map-builder">
                {_.map(_.keys(roadNodes), mainId => (
                    <g key={mainId}>
                        <circle className={currentRoadNodeId === mainId ? 'current' : ''}
                                cx={roadNodes[mainId].position[0]} cy={roadNodes[mainId].position[1]}
                                r="2"/>
                        {_.map(_.keys(roadNodes[mainId].connections), connId => (
                            <line key={mainId + '_' + connId} x1={roadNodes[mainId].position[0]}
                                  y1={roadNodes[mainId].position[1]}
                                  x2={roadNodes[connId].position[0]} y2={roadNodes[connId].position[1]}/>
                        ))}
                    </g>
                ))}
            </svg>
        )
    }
}

export default MapBuilder