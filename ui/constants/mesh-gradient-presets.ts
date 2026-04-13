export interface MeshGradientPoint {
  x: number
  y: number
  radius: number
  opacity: number
  blur: number
}

export interface MeshGradientPreset {
  name: string
  palette: string[]
  points: MeshGradientPoint[]
  background: string
}

export const meshGradientPresets: MeshGradientPreset[] = [
  {
    name: 'Warm Bloom',
    background: '#FFF7ED',
    palette: ['#FF1E5A', '#FFDA8A', '#F2FF29', '#FF6A1E'],
    points: [
      { x: 18, y: 14, radius: 34, opacity: 0.96, blur: 0.56 },
      { x: 78, y: 18, radius: 40, opacity: 0.92, blur: 0.58 },
      { x: 82, y: 82, radius: 46, opacity: 0.94, blur: 0.6 },
      { x: 18, y: 80, radius: 42, opacity: 0.9, blur: 0.56 },
    ],
  },
  {
    name: 'Peach Pop',
    background: '#FFF6EC',
    palette: ['#FF4B59', '#FFD08A', '#FFF133', '#FF7A24'],
    points: [
      { x: 20, y: 20, radius: 36, opacity: 0.96, blur: 0.54 },
      { x: 82, y: 16, radius: 42, opacity: 0.9, blur: 0.58 },
      { x: 84, y: 82, radius: 44, opacity: 0.93, blur: 0.62 },
      { x: 12, y: 82, radius: 40, opacity: 0.88, blur: 0.56 },
    ],
  },
  {
    name: 'Sunset',
    background: '#FFF8F2',
    palette: ['#FF2B5C', '#FFC07A', '#FFF84D', '#FF8328'],
    points: [
      { x: 18, y: 18, radius: 34, opacity: 0.96, blur: 0.54 },
      { x: 78, y: 16, radius: 46, opacity: 0.92, blur: 0.58 },
      { x: 84, y: 84, radius: 44, opacity: 0.94, blur: 0.6 },
      { x: 22, y: 80, radius: 40, opacity: 0.9, blur: 0.56 },
    ],
  },
  {
    name: 'Candy',
    background: '#FFF7FA',
    palette: ['#FF1E5A', '#FFD4A2', '#F8FF3B', '#FF5D23'],
    points: [
      { x: 14, y: 16, radius: 38, opacity: 0.96, blur: 0.58 },
      { x: 80, y: 14, radius: 40, opacity: 0.92, blur: 0.56 },
      { x: 82, y: 84, radius: 42, opacity: 0.92, blur: 0.6 },
      { x: 18, y: 82, radius: 40, opacity: 0.9, blur: 0.56 },
    ],
  },
]
