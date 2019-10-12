import { Document, model, Schema } from 'mongoose'

/**
 * Permissions are what determined the sum of the controlled actions on the platform. They are not scoped
 * in any way and are fully handled by the product team.
 *
 * @export
 * @class PermissionClass
 */
export class PermissionClass {
    /**
     * The name of the permission, e.g.: "Créer un groupe"
     *
     * @type {string}
     * @memberof PermissionClass
     */
    public name: string

    /**
     * Additional infos if the name is not very informative, e.g.: "Ajouter un nouveau groupe au patrimoine."
     *
     * @type {string}
     * @memberof PermissionClass
     */
    public description: string

    /**
     * For display purposes. Indicates roughly where in the app does the permission apply. e.g.: "Permissions générales"
     *
     * @type {string}
     * @memberof PermissionClass
     */
    public scope: string

    /**
     * For display purposes. Indicates a bit more precisely where in the app does the permission apply.
     * e.g.: "Gestion des groupes"
     *
     * @type {string}
     * @memberof PermissionClass
     */
    public category: string


    /**
     * Functional key of the permission. Used by the ACL system to evaluate the permission for an user.
     * e.g.: "entity.group.create"
     *
     * @type {string}
     * @memberof PermissionClass
     */
    public key: string

    constructor(obj: Partial<PermissionClass>) {
        this.scope = obj && obj.scope || null
        this.category = obj && obj.category || null
        this.name = obj && obj.name || null
        this.description = obj && obj.description || null
        this.key = obj && obj.key || null
    }
}

const permissionSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        scope: { type: String },
        category: { type: String },
        key: { type: String, required: true }
    },
    {
        timestamps: true
    }
)

export interface PermissionDocument extends PermissionClass, Document { }

export const Permission = model<PermissionDocument>("Permission", permissionSchema)
