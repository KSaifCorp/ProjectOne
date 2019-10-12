export interface AuthSubject {
    _id: string
    name: string
    isStaff: boolean
    permissions: Array<string>
}
