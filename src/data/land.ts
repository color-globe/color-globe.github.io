import * as topojson from 'topojson-client'
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import type { Topology, Objects } from 'topojson-specification'

import { landTopo } from './land-data'

function isFeatureCollection(feature: unknown): feature is FeatureCollection<Geometry, GeoJsonProperties> {
  return (
    typeof feature === 'object' &&
    feature !== null &&
    'type' in feature &&
    (feature as { type?: unknown }).type === 'FeatureCollection'
  )
}

export function getLandFeatures(): FeatureCollection<Geometry, GeoJsonProperties> {
  const topo = landTopo as unknown as Topology<Objects<GeoJsonProperties>>
  const feature = topojson.feature(topo, topo.objects.land)

  if (!isFeatureCollection(feature)) {
    const type = (feature as { type?: unknown })?.type ?? 'unknown'
    throw new Error(`Expected FeatureCollection but got ${type}`)
  }

  return feature
}
