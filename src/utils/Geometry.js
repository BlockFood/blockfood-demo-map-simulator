import Segment2 from 'segment2'
import Vec2 from 'vec2'
import * as _ from "lodash";

export const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2))
}

export const nearestPointOnLine = (p1, p2, p3) => {
    const segment = new Segment2(Vec2(p1[0], p1[1]), Vec2(p2[0], p2[1]))
    const _position = segment.closestPointTo(Vec2(p3[0], p3[1]))
    const position = [_position.x, _position.y]
    return {position, dist: distance(position, p3)}
}

export const splitLine = (p1, p2, length) => {
    const dist = distance(p1, p2)
    const vector = []
    if(Math.abs(dist) < 1e-9) {
        vector[0] = 0;
        vector[1] = 0;
    } else {
        vector[0] = (p2[0] - p1[0]) / dist;
        vector[1] = (p2[1] - p1[1]) / dist;
    }

    let parts = 1
    while (parts * length < dist) parts++

    const points = [p1]
    _.times(parts, (i) => {
        const x = p1[0] + (i * vector[0] * length)
        const y = p1[1] + (i * vector[1] * length)

        points.push([x, y])
    })
    points.push(p2)

    return points
}