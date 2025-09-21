import { feature } from 'topojson-client'
import worldAtlasLand from 'world-atlas/land-110m.json'
import type { Topology } from 'topojson-specification'
import type { FeatureCollection, Geometry, GeoJsonProperties, Feature } from 'geojson'
import { placesCollection } from './placesCollection'

const landTopology = worldAtlasLand as unknown as Topology
const raw = feature(landTopology, landTopology.objects.land)
export const land: FeatureCollection<Geometry, GeoJsonProperties> = 'features' in raw ? raw : { type: 'FeatureCollection', features: [raw] }

export function getLandFeatures(): object[] {
  const t = landTopology as unknown as Topology
  return (feature(t, t.objects.land) as FeatureCollection).features
}

export function getPlacesFeatures(): Feature[] {
  return placesCollection.features as unknown as Feature[]
}
