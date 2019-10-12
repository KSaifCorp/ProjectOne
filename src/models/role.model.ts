import { Document, model, Schema } from 'mongoose'

/**
 * A Role is a particular set of enabled permissions. It belongs to an entity, and members of this entity
 * can modify each of their roles as they see fit.
 *
 * @export
 * @class RoleClass
 */
export class RoleClass {
    public name: string
    public isDeletable: boolean
    /**
     * If a permission key is inside this array, then the permission is granted.
     *
     * @type {Array<string>}
     * @memberof RoleClass
     */
    public permissions: Array<string>

    constructor(obj: Partial<RoleClass>) {
        this.name = obj && obj.name || null
        this.isDeletable = obj && obj.isDeletable || true
        this.permissions = obj && obj.permissions || []
    }
}

const roleSchema = new Schema(
    {
        name: { type: String, required: true },
        isDeletable: { type: Boolean, default: true },
        permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    },
    {
        timestamps: true
    }
)

export interface RoleDocument extends RoleClass, Document { }

export const Role = model<RoleDocument>("Role", roleSchema)
