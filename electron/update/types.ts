export type UpdatePhase = 'disabled' | 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'installing' | 'error'
export type UpdateStage = 'check' | 'download' | 'install'

export interface UpdateState {
  revision: number
  enabled: boolean
  phase: UpdatePhase
  currentVersion: string
  availableVersion: string
  releaseDate: string
  releaseNotes: string
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
  checkedAt: string
  message: string
  failedStage?: UpdateStage
}
