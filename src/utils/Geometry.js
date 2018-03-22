import Segment2 from 'segment2'
import Vec2 from 'vec2'

export const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2))
}

export const nearestPointOnLine = (p1, p2, p3) => {
    const segment = new Segment2(Vec2(p1[0], p1[1]), Vec2(p2[0], p2[1]))
    const _position = segment.closestPointTo(Vec2(p3[0], p3[1]))
    const position = [_position.x, _position.y]
    return {position, dist: distance(position, p3)}
}