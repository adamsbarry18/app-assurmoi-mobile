/** Réponses API (champs Sequelize en snake_case) */

export type ListMeta = {
  total: number
  limit: number
  offset: number
}

export type SinisterFolderSummary = {
  id: number
  folder_reference?: string | null
  status?: string | null
  scenario?: string | null
  is_closed: boolean
  created_at?: string | null
}

export type SinisterRow = {
  id: number
  vehicle_plate: string
  incident_datetime: string
  call_datetime?: string
  description?: string | null
  status?: string
  is_validated_by_manager?: boolean
  insured_user_id?: number | null
  folder?: SinisterFolderSummary | null
}

export type SinisterListResponse = {
  data: SinisterRow[]
  meta: ListMeta
}

export type UserSummary = {
  id: number
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
}

export type SinisterDetailResponse = {
  data: SinisterRow & {
    driver_first_name?: string | null
    driver_last_name?: string | null
    is_driver_insured?: boolean
    driver_responsability?: boolean
    driver_engaged_responsibility?: number | null
    cni_driver?: number | null
    vehicle_registration_doc_id?: number | null
    insurance_certificate_id?: number | null
    creator?: UserSummary | null
    insuredUser?: UserSummary | null
    folder?: (SinisterFolderSummary & { id: number; assignedOfficer?: UserSummary | null }) | null
  }
}

export type FolderListRow = {
  id: number
  folder_reference?: string | null
  status?: string | null
  scenario?: string | null
  is_closed: boolean
  created_at?: string | null
  sinister?: {
    id: number
    vehicle_plate: string
    incident_datetime: string
    is_validated_by_manager?: boolean
    insured_user_id?: number | null
  }
}

export type FolderListResponse = {
  data: FolderListRow[]
  meta: ListMeta
}

export type FolderStepRow = {
  id: number
  step_type?: string | null
  value?: string | null
  action_date?: string
  document_id?: number | null
  document?: { id: number; type?: string; is_validated?: boolean } | null
  performedBy?: UserSummary | null
}

export type FolderDetailResponse = {
  data: FolderListRow & {
    assigned_officer_id?: number | null
    assignedOfficer?: UserSummary | null
    sinister?: SinisterRow & { id: number } & Record<string, unknown>
    steps?: FolderStepRow[]
  }
}

export type DocumentUploadResponse = {
  data: { id: number; type: string; storage_url: string }
}

export type FolderStepCreateResponse = {
  data: FolderStepRow & Record<string, unknown>
}
