import * as THREE from 'three'

export const shared = {
  scene: new THREE.Scene(),
  points: [] as THREE.Mesh[],
  axisLine: new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.2, 0),
      new THREE.Vector3(0, 1.2, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  ),
  radius: 1.0,
  createPoints() {
    const data = [
      { lat: 0, lon: 0, r: 1, name: 'Equator Prime', color: '#ff4444' },
      { lat: 0, lon: 90, r: 1, name: 'Equator 90E', color: '#44ff44' },
      { lat: 90, lon: 0, r: 1, name: 'North Pole', color: 'white' },
      // ...
    ]

    this.points = data.map(({ lat, lon, r, color }) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.02),
        new THREE.MeshBasicMaterial({ color })
      )
      const pos = latLonToVec3(lat, lon, r)
      mesh.position.copy(pos)
      return mesh
    })
  }
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const latRad = toRad(lat)
  const lonRad = toRad(lon)
  const x = r * Math.cos(latRad) * Math.cos(lonRad)
  const y = r * Math.sin(latRad)
  const z = r * Math.cos(latRad) * Math.sin(lonRad)
  return new THREE.Vector3(x, y, z)
}
