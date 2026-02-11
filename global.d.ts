/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {ThreeElements} from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
